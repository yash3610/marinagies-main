const crypto = require("node:crypto");
const { observeRequest } = require("../services/observability.service");

const buckets = new Map();
const requestContext = (req, res, next) => {
    const started = process.hrtime.bigint(); req.requestId = String(req.headers["x-request-id"] || crypto.randomUUID()).slice(0, 100); res.setHeader("X-Request-Id", req.requestId);
    res.on("finish", () => {
        const durationMs = Number(process.hrtime.bigint() - started) / 1e6; observeRequest(req, res.statusCode, durationMs);
        if (process.env.NODE_ENV !== "test") console.log(JSON.stringify({ level: res.statusCode >= 500 ? "error" : "info", event: "http_request", requestId: req.requestId, method: req.method, path: req.originalUrl.split("?")[0], status: res.statusCode, durationMs: Number(durationMs.toFixed(2)), userId: req.user?.userId || null, timestamp: new Date().toISOString() }));
    });
    next();
};
const apiRateLimit = (req, res, next) => {
    if (!req.path.startsWith("/api/") || req.path === "/api/health") return next();
    const now = Date.now(); const windowMs = 60000; const maximum = Number(process.env.API_RATE_LIMIT_PER_MINUTE || 600); const key = req.ip || req.socket.remoteAddress || "unknown";
    let bucket = buckets.get(key); if (!bucket || bucket.resetAt <= now) bucket = { count: 0, resetAt: now + windowMs }; bucket.count += 1; buckets.set(key, bucket);
    res.setHeader("RateLimit-Limit", maximum); res.setHeader("RateLimit-Remaining", Math.max(0, maximum - bucket.count)); res.setHeader("RateLimit-Reset", Math.ceil(bucket.resetAt / 1000));
    if (bucket.count > maximum) return res.status(429).json({ success: false, message: "API rate limit exceeded", requestId: req.requestId });
    next();
};
const findDangerousKey = (value, depth = 0) => {
    if (depth > 20 || !value || typeof value !== "object") return null;
    for (const [key, nested] of Object.entries(value)) { if (key.startsWith("$") || key.includes("." ) || ["__proto__", "prototype", "constructor"].includes(key)) return key; const found = findDangerousKey(nested, depth + 1); if (found) return found; }
    return null;
};
const rejectDangerousInput = (req, res, next) => {
    const key = findDangerousKey(req.body) || findDangerousKey(req.query) || findDangerousKey(req.params);
    if (key) return res.status(400).json({ success: false, message: "Request contains a prohibited key", requestId: req.requestId });
    next();
};
module.exports = { requestContext, apiRateLimit, findDangerousKey, rejectDangerousInput };
