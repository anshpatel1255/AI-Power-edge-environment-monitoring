from pydantic import BaseModel
from typing import Optional, List


class CorrelateRequest(BaseModel):
    node_id: str
    hazard: str          # flood | fire | pollution
    risk_score: int
    lat: float
    lng: float


class CorrelateResponse(BaseModel):
    confirmed: bool
    area_probability: float
    nearby_nodes: int
    message: str


class ForecastRequest(BaseModel):
    node_id: str
    hazard: str
    hours_ahead: int = 3


class ForecastPoint(BaseModel):
    hours_ahead: float
    predicted_score: float


class ForecastResponse(BaseModel):
    node_id: str
    hazard: str
    trend: str           # rising | falling | stable
    forecast: List[ForecastPoint]
    confidence: float
