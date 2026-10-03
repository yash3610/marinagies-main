const mongoose = require("mongoose");
const { snapshot, prometheus } = require("../services/observability.service");
const { pythonMlHealth } = require("../services/pythonMlClient.service");
const overview = async (req, res) => res.json({ success: true, metrics: snapshot(), dependencies: { mongodb: mongoose.connection.readyState === 1 ? "UP" : "DOWN", pythonMl: await pythonMlHealth() } });
const metrics = (req, res) => { const expected = process.env.OBSERVABILITY_KEY; const supplied = req.headers["x-observability-key"]; if (!expected || expected.length < 32 || supplied !== expected) return res.status(401).type("text/plain").send("Unauthorized\n"); res.type("text/plain; version=0.0.4").send(prometheus()); };
module.exports = { overview, metrics };
