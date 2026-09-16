"""
forecasting.py — Short-term hazard score trend projection.

Algorithm: linear regression over the last 24h of risk readings, projected forward.

# FUTURE: Replace LinearRegression with an LSTM sequence model trained on
# historical multi-node data (PRD §6.2 roadmap item). Same function interface.
"""
import os
from typing import List, Tuple

import numpy as np
import psycopg2
import psycopg2.extras
from sklearn.linear_model import LinearRegression


def _get_db_conn():
    return psycopg2.connect(os.environ.get("DATABASE_URL"))


def forecast_risk(
    node_id: str,
    hazard: str,
    hours_ahead: int = 3,
) -> Tuple[List[dict], str, float]:
    """
    Returns (forecast_points, trend_label, confidence_r2).
    forecast_points = [{"hours_ahead": float, "predicted_score": float}]
    trend_label     = "rising" | "falling" | "stable"
    confidence_r2   = R² of the linear fit (0-1)
    """
    col_map = {
        "flood":     "risk_flood",
        "fire":      "risk_fire",
        "pollution": "risk_pollution",
    }
    col = col_map.get(hazard, "risk_flood")

    try:
        conn = _get_db_conn()
        cur  = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute(
            f"""
            SELECT EXTRACT(EPOCH FROM recorded_at) AS ts, {col} AS score
            FROM sensor_readings
            WHERE node_id = %s
              AND recorded_at > now() - INTERVAL '24 hours'
              AND {col} IS NOT NULL
            ORDER BY recorded_at ASC
            """,
            (node_id,),
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
    except Exception:
        return [], "stable", 0.0

    if len(rows) < 3:
        return [], "stable", 0.0

    timestamps = np.array([r["ts"] for r in rows], dtype=float).reshape(-1, 1)
    scores     = np.array([r["score"] for r in rows], dtype=float)

    # Normalise timestamps to hours since first reading
    t0 = timestamps[0, 0]
    X  = (timestamps - t0) / 3600.0
    y  = scores

    model = LinearRegression()
    model.fit(X, y)
    r2    = float(model.score(X, y))
    slope = model.coef_[0]

    # Determine trend from slope (1 unit = 1 risk point per hour)
    if slope > 1.0:
        trend = "rising"
    elif slope < -1.0:
        trend = "falling"
    else:
        trend = "stable"

    # Project forward
    last_hours = float(X[-1, 0])
    forecast   = []
    for h in range(1, hours_ahead + 1):
        pred = float(np.clip(model.predict([[last_hours + h]])[0], 0, 100))
        forecast.append({"hours_ahead": h, "predicted_score": round(pred, 1)})

    return forecast, trend, round(r2, 4)
