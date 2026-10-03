import hashlib
import json
from pathlib import Path
import joblib
from .config import ARTIFACT_DIR

_cache: dict[str, dict] = {}

def save_artifact(model_id: str, bundle: dict, manifest: dict) -> tuple[str, Path]:
    path = ARTIFACT_DIR / f"{model_id}.joblib"; joblib.dump(bundle, path, compress=3)
    artifact_hash = hashlib.sha256(path.read_bytes()).hexdigest(); manifest = {**manifest, "artifact_hash": artifact_hash, "artifact_file": path.name}
    (ARTIFACT_DIR / f"{model_id}.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8"); _cache[model_id] = bundle
    return artifact_hash, path

def load_artifact(model_id: str) -> dict:
    if model_id in _cache: return _cache[model_id]
    path = ARTIFACT_DIR / f"{model_id}.joblib"
    if not path.exists(): raise FileNotFoundError(model_id)
    bundle = joblib.load(path); _cache[model_id] = bundle; return bundle

def list_models() -> list[dict]:
    results = []
    for path in sorted(ARTIFACT_DIR.glob("*.json"), reverse=True):
        try: results.append(json.loads(path.read_text(encoding="utf-8")))
        except (OSError, json.JSONDecodeError): continue
    return results
