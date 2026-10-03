import hashlib
import json
import numpy as np

FEATURES = {
    "GHOSTTRACE": ["deadReckoning", "impossibleSpeed", "physicalMotionMismatch", "aisCrossReference", "headingMismatch", "speedMismatch"],
    "AGENTWATCH": ["stageCompleteness", "timingSpeed", "eventDiversity", "durationRisk", "credentialPressure", "privilegeSignal"],
    "EDGEARMOR": ["heartbeatAnomaly", "signalAnomaly", "temperatureAnomaly", "firmwareMismatch", "identityMismatch", "connectionDeviation"],
    "ROCSHIELD": ["routeDeviation", "operatorPattern", "environmentalContext", "timeAnomaly", "sequenceAnomaly", "authorityCheck"],
}

POSITIVE = {
    "GHOSTTRACE": [.88, .72, .86, .78, .68, .64], "AGENTWATCH": [.94, .91, .82, .89, .76, .88],
    "EDGEARMOR": [.65, .62, .58, .72, .55, .78], "ROCSHIELD": [.78, .82, .68, .72, .76, .84],
}
NEGATIVE = {
    "GHOSTTRACE": [.10, .06, .08, .09, .12, .10], "AGENTWATCH": [.28, .18, .30, .16, .20, .12],
    "EDGEARMOR": [.08, .12, .10, .05, .01, .12], "ROCSHIELD": [.14, .22, .16, .20, .10, .02],
}

def generate_dataset(module: str, sample_count: int, seed: int) -> tuple[np.ndarray, np.ndarray, str]:
    if module not in FEATURES:
        raise ValueError(f"Unsupported module: {module}")
    rng = np.random.default_rng(seed + sum(ord(char) for char in module))
    labels = np.arange(sample_count) % 2
    values = np.empty((sample_count, len(FEATURES[module])), dtype=np.float32)
    for row, label in enumerate(labels):
        center = np.asarray(POSITIVE[module] if label else NEGATIVE[module], dtype=np.float32)
        values[row] = np.clip(center + rng.normal(0, .12, len(center)), 0, 1)
        if rng.random() < .08:
            index = rng.integers(0, len(center))
            values[row, index] = 1 - values[row, index]
        if rng.random() < .035:
            labels[row] = 1 - label
    order = rng.permutation(sample_count)
    values, labels = values[order], labels[order].astype(np.int64)
    payload = json.dumps({"module": module, "seed": seed, "x": values.round(6).tolist(), "y": labels.tolist()}, separators=(",", ":"))
    return values, labels, hashlib.sha256(payload.encode()).hexdigest()

def make_sequences(values: np.ndarray, sequence_length: int, seed: int) -> np.ndarray:
    rng = np.random.default_rng(seed)
    noise = rng.normal(0, .035, (len(values), sequence_length, values.shape[1])).astype(np.float32)
    trend = np.linspace(-.04, .04, sequence_length, dtype=np.float32)[None, :, None]
    return np.clip(values[:, None, :] + noise + trend, 0, 1)
