const MAX_SAMPLES = 2000;
const state = { startedAt: new Date(), requests: new Map(), operations: new Map() };
const normalizeRoute = (req) => `${req.method} ${(req.baseUrl || "")}${req.route?.path || req.path || "unknown"}`.replace(/[a-f\d]{24}/gi, ":id");
const percentile = (values, quantile) => { if (!values.length) return 0; const sorted = [...values].sort((a, b) => a - b); return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * quantile) - 1)]; };
const append = (list, value) => { list.push(value); if (list.length > MAX_SAMPLES) list.splice(0, list.length - MAX_SAMPLES); };

const observeRequest = (req, statusCode, durationMs) => {
    const key = normalizeRoute(req); const metric = state.requests.get(key) || { count: 0, errors: 0, durationsMs: [] };
    metric.count += 1; if (statusCode >= 500) metric.errors += 1; append(metric.durationsMs, durationMs); state.requests.set(key, metric);
};
const observeOperation = (name, durationMs, metadata = {}) => {
    const metric = state.operations.get(name) || { count: 0, failures: 0, durationsMs: [], confidences: [] };
    metric.count += 1; if (metadata.failed) metric.failures += 1; append(metric.durationsMs, durationMs); if (Number.isFinite(metadata.confidence)) append(metric.confidences, metadata.confidence); state.operations.set(name, metric);
};
const snapshot = () => ({ startedAt: state.startedAt, uptimeSeconds: Math.floor(process.uptime()), memory: process.memoryUsage(), requests: [...state.requests].map(([route, value]) => ({ route, count: value.count, errors: value.errors, p50Ms: percentile(value.durationsMs, .5), p95Ms: percentile(value.durationsMs, .95), p99Ms: percentile(value.durationsMs, .99) })), operations: [...state.operations].map(([name, value]) => ({ name, count: value.count, failures: value.failures, p50Ms: percentile(value.durationsMs, .5), p95Ms: percentile(value.durationsMs, .95), p99Ms: percentile(value.durationsMs, .99), averageConfidence: value.confidences.length ? value.confidences.reduce((sum, item) => sum + item, 0) / value.confidences.length : null })) });
const prometheus = () => {
    const lines = ["# HELP marineaegis_process_uptime_seconds Process uptime", "# TYPE marineaegis_process_uptime_seconds gauge", `marineaegis_process_uptime_seconds ${Math.floor(process.uptime())}`];
    snapshot().requests.forEach((item) => { const route = item.route.replace(/\\/g, "\\\\").replace(/"/g, "\\\""); lines.push(`marineaegis_http_requests_total{route="${route}"} ${item.count}`, `marineaegis_http_errors_total{route="${route}"} ${item.errors}`, `marineaegis_http_request_p99_milliseconds{route="${route}"} ${item.p99Ms.toFixed(3)}`); });
    snapshot().operations.forEach((item) => { const name = item.name.replace(/[^a-zA-Z0-9_:-]/g, "_"); lines.push(`marineaegis_operation_total{name="${name}"} ${item.count}`, `marineaegis_operation_failures_total{name="${name}"} ${item.failures}`, `marineaegis_operation_p99_milliseconds{name="${name}"} ${item.p99Ms.toFixed(3)}`); if (item.averageConfidence !== null) lines.push(`marineaegis_detection_average_confidence{name="${name}"} ${item.averageConfidence.toFixed(6)}`); });
    return `${lines.join("\n")}\n`;
};
module.exports = { observeRequest, observeOperation, snapshot, prometheus };
