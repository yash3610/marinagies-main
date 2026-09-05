const buckets = new Map();
const rateLimit = ({ windowMs, max, key = (req) => req.ip }) => (req, res, next) => {
    const now = Date.now();
    if (buckets.size > 10000) {
        for (const [storedKey, stored] of buckets) if (stored.resetAt <= now) buckets.delete(storedKey);
    }
    const bucketKey = key(req);
    const current = buckets.get(bucketKey);
    const bucket = !current || current.resetAt <= now ? { count: 0, resetAt: now + windowMs } : current;
    bucket.count += 1;
    buckets.set(bucketKey, bucket);
    res.setHeader("RateLimit-Limit", max);
    res.setHeader("RateLimit-Remaining", Math.max(0, max - bucket.count));
    res.setHeader("RateLimit-Reset", Math.ceil(bucket.resetAt / 1000));
    if (bucket.count > max) {
        res.setHeader("Retry-After", Math.ceil((bucket.resetAt - now) / 1000));
        return res.status(429).json({ success: false, message: "Too many attempts. Please try again later." });
    }
    next();
};
module.exports = rateLimit;
