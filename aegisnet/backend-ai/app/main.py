from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from .schemas import (
    CorrelateRequest, CorrelateResponse,
    ForecastRequest, ForecastResponse, ForecastPoint,
)
from .correlation import compute_area_probability
from .forecasting import forecast_risk

app = FastAPI(
    title="AegisNet AI Correlation Service",
    description="Cross-node hazard correlation and short-term risk forecasting",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "aegisnet-ai"}


@app.post("/correlate", response_model=CorrelateResponse)
def correlate(req: CorrelateRequest):
    """
    Compute area-level probability for a hazard event given a triggering node.
    Called by the Node.js backend immediately after receiving an alert-type MQTT message.
    """
    try:
        area_prob, nearby = compute_area_probability(
            req.node_id, req.hazard, req.risk_score, req.lat, req.lng
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    confirmed = area_prob >= 0.5
    msg = (
        f"Area probability {area_prob:.0%} based on {nearby} nearby node(s). "
        + ("Event CONFIRMED." if confirmed else "Monitoring — not yet area-wide.")
    )
    return CorrelateResponse(
        confirmed=confirmed,
        area_probability=area_prob,
        nearby_nodes=nearby,
        message=msg,
    )


@app.post("/forecast", response_model=ForecastResponse)
def forecast(req: ForecastRequest):
    """
    Return linear-regression projected risk scores for the next N hours.
    Placeholder for the LSTM model (PRD §6.2 roadmap).
    """
    try:
        points, trend, confidence = forecast_risk(req.node_id, req.hazard, req.hours_ahead)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return ForecastResponse(
        node_id=req.node_id,
        hazard=req.hazard,
        trend=trend,
        forecast=[ForecastPoint(**p) for p in points],
        confidence=confidence,
    )
