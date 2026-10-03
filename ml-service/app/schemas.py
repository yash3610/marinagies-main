from typing import Any
from pydantic import BaseModel, Field

class TrainRequest(BaseModel):
    sample_count: int = Field(default=800, ge=100, le=5000)
    seed: int = 1701

class PredictRequest(BaseModel):
    model_id: str
    features: dict[str, float]
    sequence: list[list[float]] | None = None

class PredictionResponse(BaseModel):
    model_id: str
    module: str
    probability: float = Field(ge=0, le=1)
    classification: str
    threshold: float
    algorithm: str
    explanation: dict[str, Any]
