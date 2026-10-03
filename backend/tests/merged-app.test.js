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
