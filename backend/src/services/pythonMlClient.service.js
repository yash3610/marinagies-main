const configured = () => Boolean(process.env.ML_SERVICE_URL && process.env.ML_SERVICE_KEY?.length >= 32);

const request = async (path, { method = "GET", body, timeoutMs = 5000 } = {}) => {
    if (!configured()) throw Object.assign(new Error("Python ML service is not configured"), { status: 503 });
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), timeoutMs); timer.unref?.();
    try {
        const response = await fetch(`${process.env.ML_SERVICE_URL.replace(/\/$/, "")}${path}`, { method, headers: { "Content-Type": "application/json", "X-ML-Service-Key": process.env.ML_SERVICE_KEY }, body: body ? JSON.stringify(body) : undefined, signal: controller.signal });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw Object.assign(new Error(payload.detail || `Python ML service returned ${response.status}`), { status: response.status >= 500 ? 502 : response.status });
        return payload;
    } catch (error) {
        if (error.name === "AbortError") throw Object.assign(new Error("Python ML service timed out"), { status: 504 });
        if (error.status) throw error;
        throw Object.assign(new Error("Python ML service is unavailable"), { status: 503, cause: error });
    } finally { clearTimeout(timer); }
};

const trainPythonModel = ({ module, sampleCount, seed }) => request(`/v1/train/${encodeURIComponent(module)}`, { method: "POST", body: { sample_count: sampleCount, seed }, timeoutMs: 10 * 60 * 1000 });
const predictPythonModel = ({ module, modelId, features, sequence }) => request(`/v1/predict/${encodeURIComponent(module)}`, { method: "POST", body: { model_id: modelId, features, ...(sequence ? { sequence } : {}) }, timeoutMs: 2500 });
const pythonMlHealth = async () => {
    if (!configured()) return { configured: false, available: false };
    try { const response = await fetch(`${process.env.ML_SERVICE_URL.replace(/\/$/, "")}/health`, { signal: AbortSignal.timeout(2000) }); return { configured: true, available: response.ok, ...(response.ok ? await response.json() : {}) }; }
    catch { return { configured: true, available: false }; }
};

module.exports = { configured, request, trainPythonModel, predictPythonModel, pythonMlHealth };
