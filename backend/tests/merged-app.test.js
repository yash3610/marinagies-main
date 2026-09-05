const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
process.env.NODE_ENV = "production";
process.env.JWT_SECRET = "local-integration-test-secret";
const app = require("../src/app");
const User = require("../src/models/User");
let server, base;
before(async () => {
  server = await new Promise(resolve => { const instance = app.listen(0, "127.0.0.1", () => resolve(instance)); });
  base = "http://127.0.0.1:" + server.address().port;
});
after(() => new Promise(resolve => server.close(resolve)));
const post = (url, body) => fetch(base + url, {method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(body)});

test("production public pages and dashboard deep links use isolated styles", async () => {
  for (const route of ["/", "/about-us", "/login", "/register", "/contact"]) {
    const response = await fetch(base + route);
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.match(html, /bootstrap.min.css/);
    assert.doesNotMatch(html, /assets\/dashboard-.*\.css/);
  }
  for (const route of ["/dashboard", "/dashboard/fleet", "/dashboard/navigation"]) {
    const response = await fetch(base + route);
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.match(html, /assets\/dashboard-.*\.css/);
    assert.doesNotMatch(html, /bootstrap.min.css/);
  }
  assert.equal((await fetch(base + "/assets/css/style.css")).status, 200);
  assert.equal((await fetch(base + "/api/does-not-exist")).status, 404);
});
test("dashboard API rejects missing and invalid sessions", async () => {
  assert.equal((await fetch(base + "/api/auth/me")).status, 401);
  assert.equal((await fetch(base + "/api/dashboard/stats", {headers:{Authorization:"Bearer invalid"}})).status, 401);
});
test("website forms retain validation without writing to a database", async () => {
  for (const endpoint of ["contact", "newsletter", "service-request"]) {
    const response = await post("/api/forms/" + endpoint, {});
    assert.equal(response.status, 400);
    assert.equal((await response.json()).success, false);
  }
});
test("both password formats issue the common dashboard token", async t => {
  const password = "correct password";
  const hash = await bcrypt.hash(password, 4);
  for (const field of ["password", "passwordHash"]) {
    const user = {_id:"507f1f77bcf86cd799439011", name:"Test", email:"test@example.com", role:"BRIDGE_OFFICER", active:true, [field]:hash};
    const mock = t.mock.method(User,"findOne",() => ({select:async () => user}));
    const response = await post("/api/auth/login",{email:user.email,password});
    assert.equal(response.status,200);
    const data = await response.json();
    const decoded = jwt.verify(data.token,process.env.JWT_SECRET);
    assert.equal(decoded.userId,user._id);
    assert.equal(data.user.role,"BRIDGE_OFFICER");
    assert.equal(data.user.password,undefined);
    assert.equal(data.user.passwordHash,undefined);
    assert.equal((await post("/api/auth/login",{email:user.email,password:"wrong"})).status,401);
    mock.mock.restore();
  }
});
test("registration checks confirmation and never accepts a requested admin role", async t => {
  assert.equal((await post("/api/auth/register",{name:"Test",email:"test@example.com",password:"12345678",confirmPassword:"different"})).status,400);
  t.mock.method(User,"exists",async () => false);
  let saved;
  t.mock.method(User,"create",async data => {saved=data;return {_id:"507f1f77bcf86cd799439011",...data};});
  const response = await post("/api/auth/register",{name:"Test",email:"TEST@example.com",password:"correct password",confirmPassword:"correct password",role:"ADMIN"});
  assert.equal(response.status,201);
  assert.equal(saved.role,"BRIDGE_OFFICER");
  assert.equal(saved.email,"test@example.com");
  assert.equal(await bcrypt.compare("correct password",saved.password),true);
});
