const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
process.env.NODE_ENV = "production";
process.env.JWT_SECRET = "local-integration-test-secret-at-least-32-characters";
const app = require("../src/app");
const User = require("../src/models/User");
const { ACCESS_TOKEN_COOKIE, TOKEN_ISSUER, TOKEN_AUDIENCE } = require("../src/controllers/auth.controller");
const { verifySessionToken } = require("../src/middleware/auth.middleware");
const { getPermissionsForRole, PERMISSIONS } = require("../src/utils/accessControl");
const { sanitize } = require("../src/middleware/audit.middleware");
const { vesselScope, canAccessVessel } = require("../src/utils/dataScope");
const { normalizeTelemetrySample } = require("../src/services/telemetry.service");
const { isValidIngestionKey } = require("../src/middleware/telemetryIngestion.middleware");
const { analyzeGhostTrace } = require("../src/services/ghostTrace.service");
const { evaluateDigitalTwin } = require("../src/services/navigationResponse.service");
const { createTextPdf } = require("../src/services/pdf.service");
const { inferredTimeline } = require("../src/services/incidentReport.service");
const { evaluateDeviceHealth } = require("../src/services/edgeArmor.service");
const { scoreUnknownDomain, evaluateSegmentation } = require("../src/services/netGuard.service");
const { analyzeAttackSequence } = require("../src/services/agentWatch.service");
const { calculateSupplierRisk, buildWhatIfScenario } = require("../src/services/fleetChoke.service");
const { scoreDistressSignal } = require("../src/services/sarVerify.service");
const { scoreRemoteCommand } = require("../src/services/rocShield.service");
const { generateSecret, generateTotp, verifyTotp } = require("../src/services/totp.service");
let server, base;
before(async () => {
  server = await new Promise(resolve => { const instance = app.listen(0, "127.0.0.1", () => resolve(instance)); });
  base = "http://127.0.0.1:" + server.address().port;
});
after(() => new Promise(resolve => server.close(resolve)));
const post = (url, body, headers={}) => fetch(base + url, {method:"POST",headers:{"Content-Type":"application/json",...headers},body:JSON.stringify(body)});
const cookieFrom = response => response.headers.get("set-cookie").split(";")[0];

test("production entries stay isolated and security headers are present", async () => {
  const website = await fetch(base + "/login");
  const websiteHtml = await website.text();
  assert.match(websiteHtml,/bootstrap.min.css/);
  assert.equal(website.headers.get("x-frame-options"),"DENY");
  assert.equal(website.headers.get("x-content-type-options"),"nosniff");
  const dashboard = await fetch(base + "/dashboard/navigation");
  const dashboardHtml = await dashboard.text();
  assert.match(dashboardHtml,/assets\/dashboard-.*\.css/);
  assert.doesNotMatch(dashboardHtml,/bootstrap.min.css/);
  assert.equal((await fetch(base + "/api/does-not-exist")).status,404);
});

test("missing, malformed and legacy JWT sessions are rejected", async () => {
  assert.equal((await fetch(base + "/api/auth/me")).status,401);
  assert.equal((await fetch(base + "/api/dashboard/stats",{headers:{Authorization:"Bearer invalid"}})).status,401);
  const legacy = jwt.sign({userId:"507f1f77bcf86cd799439011",role:"ADMIN"},process.env.JWT_SECRET);
  assert.equal((await fetch(base + "/api/dashboard/stats",{headers:{Authorization:`Bearer ${legacy}`}})).status,401);
});

test("website forms keep server-side validation", async () => {
  for (const endpoint of ["contact","newsletter","service-request"]) assert.equal((await post("/api/forms/"+endpoint,{})).status,400);
});

test("both stored password formats create an HttpOnly cookie session", async t => {
  const password="correct password";
  const hash=await bcrypt.hash(password,4);
  for(const field of ["password","passwordHash"]){
    const user={_id:"507f1f77bcf86cd799439011",name:"Test",email:`${field}@example.com`,role:"BRIDGE_OFFICER",active:true,[field]:hash,save:async()=>{}};
    const findMock=t.mock.method(User,"findOne",()=>({select:async()=>user}));
    const response=await post("/api/auth/login",{email:user.email,password});
    assert.equal(response.status,200);
    const data=await response.json();
    assert.equal(data.token,undefined);
    const setCookie=response.headers.get("set-cookie");
    assert.match(setCookie,/marineaegis_session=/);
    assert.match(setCookie,/HttpOnly/i);
    assert.match(setCookie,/SameSite=Strict/i);
    assert.match(setCookie,/Secure/i);
    const token=decodeURIComponent(cookieFrom(response).slice(ACCESS_TOKEN_COOKIE.length+1));
    assert.equal(verifySessionToken(token).userId,user._id);
    findMock.mock.restore();
  }
});

test("cookie authenticates current user and logout clears it", async t => {
  const user={_id:"507f1f77bcf86cd799439011",name:"Test",email:"me@example.com",role:"BRIDGE_OFFICER",active:true};
  const token=jwt.sign({role:user.role},process.env.JWT_SECRET,{subject:user._id,issuer:TOKEN_ISSUER,audience:TOKEN_AUDIENCE,algorithm:"HS256",expiresIn:"8h"});
  t.mock.method(User,"findById",()=>({select:async()=>user}));
  const me=await fetch(base+"/api/auth/me",{headers:{Cookie:`${ACCESS_TOKEN_COOKIE}=${token}`}});
  assert.equal(me.status,200);
  const meBody=await me.json();
  assert.equal(meBody.user.id,user._id);
  assert.equal(meBody.user.role,user.role);
  const logout=await post("/api/auth/logout",{});
  assert.match(logout.headers.get("set-cookie"),/marineaegis_session=;/);
});

test("registration validates input and never accepts a requested admin role", async t => {
  assert.equal((await post("/api/auth/register",{name:"Test",email:"test@example.com",password:"short",confirmPassword:"short"})).status,400);
  t.mock.method(User,"exists",async()=>false);
  let saved;
  t.mock.method(User,"create",async data=>{saved=data;return {_id:"507f1f77bcf86cd799439011",...data,save:async()=>{}};});
  const response=await post("/api/auth/register",{name:"Test",email:"TEST@example.com",password:"correct password",confirmPassword:"correct password",role:"ADMIN"});
  assert.equal(response.status,201);
  assert.equal(saved.role,"BRIDGE_OFFICER");
  assert.equal(saved.email,"test@example.com");
  assert.equal(await bcrypt.compare("correct password",saved.password),true);
});

test("login endpoint rate-limits repeated attempts", async t => {
  t.mock.method(User,"findOne",()=>({select:async()=>null}));
  let response;
  for(let i=0;i<11;i++) response=await post("/api/auth/login",{email:"limited@example.com",password:"wrong password"});
  assert.equal(response.status,429);
  assert.ok(Number(response.headers.get("retry-after"))>0);
});

test("legacy and PRD roles resolve to least-privilege permissions", () => {
  assert.ok(getPermissionsForRole("BRIDGE_OFFICER").includes(PERMISSIONS.NAVIGATION_VIEW));
  assert.equal(getPermissionsForRole("BRIDGE_OFFICER").includes(PERMISSIONS.USERS_MANAGE),false);
  assert.ok(getPermissionsForRole("COMPLIANCE_AUDITOR").includes(PERMISSIONS.AUDIT_LOGS_VIEW));
  assert.equal(getPermissionsForRole("COMPLIANCE_AUDITOR").includes(PERMISSIONS.DEVICE_QUARANTINE),false);
});

test("audit metadata redacts nested authentication secrets", () => {
  assert.deepEqual(
    sanitize({email:"test@example.com",password:"secret",nested:{mfaCode:"123456"}}),
    {email:"test@example.com",password:"[REDACTED]",nested:{mfaCode:"[REDACTED]"}}
  );
});

test("vessel data scope denies unassigned vessels", () => {
  const scopedRequest={user:{allVessels:false,vesselAccess:["507f1f77bcf86cd799439011"]}};
  assert.deepEqual(vesselScope(scopedRequest),{vessel:{$in:["507f1f77bcf86cd799439011"]}});
  assert.equal(canAccessVessel(scopedRequest,"507f1f77bcf86cd799439011"),true);
  assert.equal(canAccessVessel(scopedRequest,"507f191e810c19729de860ea"),false);
  assert.deepEqual(vesselScope({user:{allVessels:true}},"_id"),{});
});

test("telemetry ingestion validates ranges, source time and normalizes values", () => {
  const now=new Date("2026-01-01T00:00:00.000Z");
  const sample=normalizeTelemetrySample({
    vessel:"507f1f77bcf86cd799439011",latitude:"18.94",longitude:72.835,
    speed:"12.5",heading:360,source:"nmea",timestamp:"2025-12-31T23:59:00.000Z",
    deviceId:"ESP32-BRIDGE-01",
    mpu6050:{accel:{x:0.04,y:-0.02,z:1.01},gyro:{x:0.2,y:0.1,z:1.4},temperature:31.5,motionDetected:true},
    aisLatitude:18.9401,aisLongitude:72.8351,gyroHeading:359,simulatedSpeed:12.2
  },now);
  assert.equal(sample.speed,12.5);
  assert.equal(sample.source,"NMEA");
  assert.equal(sample.sensorNode.deviceId,"ESP32-BRIDGE-01");
  assert.equal(sample.motion.accelerometer.z,1.01);
  assert.equal(sample.motion.gyroscope.z,1.4);
  assert.equal(sample.navigationReference.gyroHeading,359);
  assert.throws(()=>normalizeTelemetrySample({vessel:"bad",latitude:0,longitude:0},now),/valid vessel id/);
  assert.throws(()=>normalizeTelemetrySample({vessel:"507f1f77bcf86cd799439011",latitude:91,longitude:0},now),/latitude/);
  assert.throws(()=>normalizeTelemetrySample({vessel:"507f1f77bcf86cd799439011",latitude:0,longitude:0,timestamp:"2026-01-01T00:06:00.000Z"},now),/5 minutes/);
  assert.throws(()=>normalizeTelemetrySample({vessel:"507f1f77bcf86cd799439011",latitude:0,longitude:0,mpu6050:{accel:{x:17}}},now),/accelerometer.x/);
});

test("telemetry agent key requires a configured 32-character secret", () => {
  const key="a-secure-telemetry-key-with-32-characters";
  assert.equal(isValidIngestionKey(key,key),true);
  assert.equal(isValidIngestionKey("wrong",key),false);
  assert.equal(isValidIngestionKey("short","short"),false);
});

test("GhostTrace raises confidence when GPS movement conflicts with MPU6050 and AIS", () => {
  const previous={latitude:18,longitude:72,speed:10,heading:90,sourceTimestamp:new Date("2026-01-01T00:00:00Z")};
  const result=analyzeGhostTrace({
    latitude:18.01,longitude:72.01,speed:10,heading:90,timestamp:new Date("2026-01-01T00:00:10Z"),
    motion:{accelerometer:{x:0,y:0,z:1},gyroscope:{x:0,y:0,z:0},motionDetected:false},
    navigationReference:{aisLatitude:18,aisLongitude:72,gyroHeading:90,simulatedSpeed:10}
  },previous,0.7);
  assert.equal(result.detected,true);
  assert.equal(result.confidenceLevel,"HIGH");
  assert.ok(result.anomalyScores.physicalMotionMismatch>0.8);
  assert.match(result.explanation.whatCausedIt,/MPU6050/);
});

test("GhostTrace does not alert when independent motion and navigation signals agree", () => {
  const previous={latitude:18,longitude:72,speed:10,heading:90,sourceTimestamp:new Date("2026-01-01T00:00:00Z")};
  const result=analyzeGhostTrace({
    latitude:18,longitude:72.00049,speed:10,heading:90,timestamp:new Date("2026-01-01T00:00:10Z"),
    motion:{accelerometer:{x:0.1,y:0,z:1},gyroscope:{x:0,y:0,z:3},motionDetected:true},
    navigationReference:{aisLatitude:18,aisLongitude:72.00049,gyroHeading:90,simulatedSpeed:10}
  },previous,0.7);
  assert.equal(result.detected,false);
  assert.ok(result.confidenceScore<0.2);
});

test("college demo 650 metre GPS injection triggers while AIS and MPU6050 stay on the real route", () => {
  const previous={latitude:18.94,longitude:72.835,speed:10,heading:280,sourceTimestamp:new Date("2026-01-01T00:00:00Z")};
  const actual={latitude:18.94001,longitude:72.83485};
  const spoofedLatitude=actual.latitude+(650/111320);
  const result=analyzeGhostTrace({
    latitude:spoofedLatitude,longitude:actual.longitude,speed:10,heading:280,timestamp:new Date("2026-01-01T00:00:03Z"),
    motion:{accelerometer:{x:0.05,y:0.02,z:1},gyroscope:{x:0,y:0,z:0.4},motionDetected:true},
    navigationReference:{aisLatitude:actual.latitude,aisLongitude:actual.longitude,gyroHeading:280,simulatedSpeed:10}
  },previous,0.7);
  assert.equal(result.detected,true);
  assert.notEqual(result.alertType,"SIGNALS_CONSISTENT");
  assert.ok(result.signalsEvaluated.aisGapMeters>600);
});

test("Digital Twin permits a recent bounded correction but blocks a stale trusted position", () => {
  const now=new Date("2026-01-01T00:10:00Z");
  const base={
    trustedPosition:{latitude:18.94,longitude:72.835,speed:10,heading:280,timestamp:new Date("2026-01-01T00:09:30Z")},
    suspiciousPosition:{latitude:18.94584,longitude:72.835,speed:10,heading:280,timestamp:now}
  };
  const safe=evaluateDigitalTwin(base,now);
  assert.equal(safe.result,"SAFE");
  assert.equal(safe.checks.requiresHumanApproval,true);
  const unsafe=evaluateDigitalTwin({...base,trustedPosition:{...base.trustedPosition,timestamp:new Date("2025-12-31T23:00:00Z")}},now);
  assert.equal(unsafe.result,"UNSAFE");
  assert.equal(unsafe.checks.trustedPositionFresh,false);
});

test("incident security report generator creates a real PDF document", () => {
  const pdf=createTextPdf("MarineAegis Report",["Incident GTI-1","GPS spoofing detected"]);
  assert.equal(pdf.subarray(0,8).toString("ascii"),"%PDF-1.4");
  assert.match(pdf.toString("ascii"),/xref/);
  assert.match(pdf.toString("ascii"),/%%EOF/);
});

test("legacy incident replay is reconstructed chronologically from stored evidence", () => {
  const timeline=inferredTimeline({
    incident:{description:"Investigation",source:"ESP32",severity:"CRITICAL",detectedAt:new Date("2026-01-01T00:00:03Z")},
    alert:{title:"Spoof alert",message:"Mismatch",source:"ESP32",severity:"CRITICAL",detectedAt:new Date("2026-01-01T00:00:02Z")},
    detection:{createdAt:new Date("2026-01-01T00:00:01Z"),confidenceScore:0.95,alertType:"GPS_POSITION_INCONSISTENT",explanation:{whatCausedIt:"AIS mismatch"}},
    action:{createdAt:new Date("2026-01-01T00:00:04Z"),actionId:"NAV-1",status:"AWAITING_APPROVAL",digitalTwin:{result:"SAFE",summary:"Safe",simulatedAt:new Date("2026-01-01T00:00:04Z")}},
  });
  assert.deepEqual(timeline.map(event=>event.eventType),["DETECTION","ALERT_CREATED","INCIDENT_CREATED","DIGITAL_TWIN_RESULT"]);
  assert.ok(timeline.every(event=>event.data.inferred));
});

test("EdgeArmor explains healthy, stale and firmware-tampered device scores", () => {
  const healthy=evaluateDeviceHealth({deviceStatus:"ONLINE",signalStrength:90,temperature:32,reportedFirmware:"1.0.0",approvedFirmware:"1.0.0"});
  assert.equal(healthy.riskScore,0);
  assert.equal(healthy.effectiveStatus,"ONLINE");
  const compromised=evaluateDeviceHealth({deviceStatus:"OFFLINE",signalStrength:8,temperature:80,reportedFirmware:"evil",approvedFirmware:"1.0.0",heartbeatAgeSeconds:180});
  assert.equal(compromised.riskScore,100);
  assert.equal(compromised.riskLevel,"CRITICAL");
  assert.ok(compromised.anomalyCodes.includes("FIRMWARE_MISMATCH"));
  assert.ok(compromised.anomalyCodes.includes("HEARTBEAT_MISSING"));
});

test("NetGuard explains suspicious domains and applies default-deny segmentation", () => {
  const suspicious=scoreUnknownDomain("malware-command-control.xyz");
  assert.equal(suspicious.suspicious,true);
  assert.ok(suspicious.score>=70);
  assert.ok(suspicious.signals.length>=2);
  const policy={segmentationRules:[
    {from:"MARINEAEGIS",to:"OT",action:"ALLOW",reason:"Monitoring"},
    {from:"CREW",to:"OT",action:"BLOCK",reason:"Crew isolation"},
  ]};
  assert.equal(evaluateSegmentation({sourceSegment:"MARINEAEGIS",destinationSegment:"OT",policy}).verdict,"ALLOWED");
  const blocked=evaluateSegmentation({sourceSegment:"CREW",destinationSegment:"OT",policy});
  assert.equal(blocked.verdict,"BLOCKED");
  assert.match(blocked.reason,/Crew isolation/);
});

test("AgentWatch distinguishes machine-speed progression from incomplete activity", () => {
  const base=Date.parse("2026-01-01T00:00:00Z");
  const kinds=[
    ["NETWORK_SCAN","RECON"],["NETWORK_SCAN","RECON"],["AUTH_FAILURE","CREDENTIAL_ATTACK"],
    ["AUTH_SUCCESS","CREDENTIAL_ATTACK"],["PRIVILEGE_ESCALATION","LATERAL_MOVEMENT"],
    ["COMMAND_EXECUTION","LATERAL_MOVEMENT"],["EXFILTRATION","EXFILTRATION"],
  ];
  const fast=analyzeAttackSequence(kinds.map(([eventKind,stage],index)=>({eventKind,stage,timestamp:new Date(base+index*500)})));
  assert.equal(fast.classification,"AUTONOMOUS_SUSPECTED");
  assert.equal(fast.confidenceLevel,"HIGH");
  assert.equal(fast.stages.length,4);
  assert.ok(fast.mitreTechniques.some(item=>item.techniqueId==="T1041"));
  const incomplete=analyzeAttackSequence(kinds.slice(0,4).map(([eventKind,stage],index)=>({eventKind,stage,timestamp:new Date(base+index*500)})));
  assert.equal(incomplete.classification,"INCOMPLETE");
  assert.ok(incomplete.confidence<70);
});

test("FleetChoke calculates weighted supplier exposure and vessel blast radius", () => {
  const supplier={name:"Test Navigation Vendor",baseRisk:10,cves:[{cvssScore:9.8}]};
  const assets=[
    {vessel:"vessel-a",criticality:"SAFETY_CRITICAL",operationalStatus:"ACTIVE"},
    {vessel:"vessel-a",criticality:"OPERATIONAL",operationalStatus:"ACTIVE"},
    {vessel:"vessel-b",criticality:"STANDARD",operationalStatus:"ACTIVE"},
  ];
  const risk=calculateSupplierRisk({supplier,assets,edgeDevices:[{health:{riskScore:80}}]});
  assert.equal(risk.blastRadius,7);
  assert.equal(risk.affectedVesselCount,2);
  assert.equal(risk.riskLevel,"HIGH");
  assert.ok(risk.riskScore>=55);
  const scenario=buildWhatIfScenario({supplier,assets,compromiseSeverity:90});
  assert.equal(scenario.affectedVessels.length,2);
  assert.equal(scenario.totalAssets,3);
  assert.equal(scenario.affectedVessels[0].vessel,"vessel-a");
  assert.ok(scenario.affectedVessels[0].projectedRisk>scenario.affectedVessels[1].projectedRisk);
});

test("SARVerify accepts corroborated distress and rejects a known hoax", () => {
  const genuine=scoreDistressSignal({
    input:{format:"AIS_EPIRB",mmsi:"419001234",distressNature:"SINKING",claimedLocation:{latitude:18.94,longitude:72.84},signal:{protocolValid:true,signalStrength:90,corroboratingSources:["COAST_GUARD","EPIRB_SATELLITE","NEARBY_VESSEL"]}},
    registry:{active:true,falseAlarmCount:0,confirmedHoaxCount:0,lastKnownLocation:{latitude:18.94,longitude:72.84}},
    nearbyVessels:[{latitude:18.95,longitude:72.84}],weather:{condition:"ROUGH",waveHeightMeters:4,observedAt:new Date()},
  });
  assert.equal(genuine.decision,"AUTO_ACCEPTED");
  assert.ok(genuine.trustScore>0.75);
  assert.equal(Object.keys(genuine.scores).length,5);
  const hoax=scoreDistressSignal({
    input:{format:"DSC",mmsi:"999666333",distressNature:"DISABLED",claimedLocation:{latitude:18.94,longitude:72.84},signal:{protocolValid:false,signalStrength:15,corroboratingSources:[]}},
    registry:{active:false,falseAlarmCount:4,confirmedHoaxCount:2,lastKnownLocation:{latitude:12,longitude:68}},
    nearbyVessels:[],weather:{condition:"CALM",waveHeightMeters:.2,observedAt:new Date()},falseAlarmZoneCount:1,
  });
  assert.equal(hoax.decision,"LIKELY_FALSE");
  assert.ok(hoax.trustScore<0.4);
  assert.match(hoax.explanation.whyItMatters,/course-diversion/);
});

test("ROCShield executes normal commands and blocks unauthenticated command channels", () => {
  const baseline={totalCommands:20,commandTypeCounts:{SET_SPEED:10,CHANGE_ROUTE:2},hourCounts:{"10":5}};
  const safe=scoreRemoteCommand({input:{type:"SET_SPEED",parameters:{speed:12},issuedAt:new Date("2026-01-01T10:00:00Z"),channelAuthenticated:true},operatorRole:"ROC_OPERATOR",baseline,vesselState:{heading:90,speed:10,status:"ONLINE"},recentCommands:[]});
  assert.equal(safe.decision,"AUTO_EXECUTE");
  assert.ok(safe.riskScore<=0.30);
  const fake=scoreRemoteCommand({input:{type:"CHANGE_ROUTE",parameters:{heading:270,distanceKm:1200},issuedAt:new Date("2026-01-01T03:00:00Z"),channelAuthenticated:false},operatorRole:"ADMIN",baseline,vesselState:{heading:90,speed:24,status:"WARNING"},weather:{condition:"STORM"},recentCommands:[{type:"STOP_ENGINE",decision:"BLOCK"}]});
  assert.equal(fake.decision,"BLOCK");
  assert.equal(fake.riskFactors.authorityCheck.score,1);
  assert.match(fake.riskFactors.authorityCheck.reasons[0],/failed origin authentication/);
});

test("ROCShield authenticator codes verify only inside the accepted TOTP window", () => {
  const secret=generateSecret();
  const now=Date.parse("2026-01-01T00:00:00Z");
  const code=generateTotp(secret,now);
  assert.equal(verifyTotp(secret,code,now),true);
  assert.equal(verifyTotp(secret,"000000",now),code==="000000");
  assert.equal(verifyTotp(secret,code,now+120000),false);
});
