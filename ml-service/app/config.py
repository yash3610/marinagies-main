import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT_DIR = Path(os.getenv("ML_ARTIFACT_DIR", ROOT / "artifacts")).resolve()
SERVICE_KEY = os.getenv("ML_SERVICE_KEY", "")
MAX_SAMPLES = int(os.getenv("ML_MAX_SAMPLES", "5000"))

ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

def validate_configuration() -> None:
    if len(SERVICE_KEY) < 32:
        raise RuntimeError("ML_SERVICE_KEY must contain at least 32 characters")
