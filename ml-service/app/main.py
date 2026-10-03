import hmac
import time
import uuid
from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI, Header, HTTPException
from starlette.concurrency import run_in_threadpool
from .config import MAX_SAMPLES, SERVICE_KEY, validate_configuration
from .datasets import FEATURES
from .registry import list_models, load_artifact, save_artifact
from .schemas import PredictRequest, PredictionResponse, TrainRequest
from .trainers import predict, train_module

@asynccontextmanager
async def lifespan(_: FastAPI):
    validate_configuration(); yield

app = FastAPI(title="MarineAegis ML Service", version="1.0.0", docs_url=None, redoc_url=None, lifespan=lifespan)

def authorize(x_ml_service_key: str = Header(default="")):
    if not SERVICE_KEY or not hmac.compare_digest(x_ml_service_key, SERVICE_KEY): raise HTTPException(status_code=401, detail="Invalid ML service key")

@app.get("/health")
def health(): return {"status": "ok", "service": "marineaegis-ml", "modules": list(FEATURES), "models": len(list_models())}

@app.get("/v1/models", dependencies=[Depends(authorize)])
def models(): return {"models": list_models()}

@app.post("/v1/train/{module}", dependencies=[Depends(authorize)])
async def train(module: str, request: TrainRequest):
    normalized = module.upper()
    if normalized not in FEATURES: raise HTTPException(status_code=400, detail="Unsupported module")
    if request.sample_count > MAX_SAMPLES: raise HTTPException(status_code=400, detail=f"sample_count exceeds configured maximum {MAX_SAMPLES}")
    started = time.perf_counter(); result = await run_in_threadpool(train_module, normalized, request.sample_count, request.seed)
    model_id = f"{normalized.lower()}-{int(time.time())}-{uuid.uuid4().hex[:8]}"; passed = result.metrics["precision"] >= .90 and result.metrics["recall"] >= .85
    manifest = {"model_id": model_id, "module": normalized, "algorithm": result.bundle["algorithm"], "feature_names": result.bundle["feature_names"], "threshold": result.bundle["threshold"], "dataset_hash": result.dataset_hash, "metrics": result.metrics, "status": "PASSED" if passed else "FAILED", "seed": request.seed, "sample_count": request.sample_count}
    artifact_hash, _ = save_artifact(model_id, result.bundle, manifest)
    return {**manifest, "artifact_hash": artifact_hash, "training_count": result.training_count, "holdout_count": result.holdout_count, "positive_count": result.positive_count, "negative_count": result.negative_count, "duration_ms": round((time.perf_counter() - started) * 1000)}

@app.post("/v1/predict/{module}", response_model=PredictionResponse, dependencies=[Depends(authorize)])
def inference(module: str, request: PredictRequest):
    try: bundle = load_artifact(request.model_id)
    except FileNotFoundError: raise HTTPException(status_code=404, detail="Model artifact not found") from None
    if bundle["module"] != module.upper(): raise HTTPException(status_code=400, detail="Model does not belong to requested module")
    probability, components = predict(bundle, request.features, request.sequence); threshold = float(bundle["threshold"])
    return {"model_id": request.model_id, "module": bundle["module"], "probability": max(0, min(1, probability)), "classification": "ANOMALOUS" if probability >= threshold else "NORMAL", "threshold": threshold, "algorithm": bundle["algorithm"], "explanation": {"component_scores": components, "feature_names": bundle["feature_names"]}}
