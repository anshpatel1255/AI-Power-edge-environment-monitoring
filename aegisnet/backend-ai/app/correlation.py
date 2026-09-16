"""
correlation.py — Cross-node hazard correlation using distance-decay weighted average.

Algorithm: distance-decay weighted average of recent risk scores from nearby nodes
(within RADIUS_KM). Returns an Area Probability Index (0-1).

# FUTURE: Replace the weighted average with an LSTM ensemble trained on historical
# multi-node sequences (PRD §6.2). The function signature stays identical — swap
# the body, keep the return type.
"""
import math
import os
from typing import Tuple

import psycopg2
import psycopg2.extras

RADIUS_KM    = 5.0    # nodes within 5km contribute
DECAY_FACTOR = 2.0    # distance^decay in denominator


def _get_db_conn():
    return psycopg2.connect(os.environ.get("DATABASE_URL"))


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance in km."""
    R = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi    = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def compute_area_probability(
    trigger_node_id: str,
    hazard: str,
    trigger_score: int,
    lat: float,
    lng: float,
) -> Tuple[float, int]:
    """
    Returns (area_probability: float 0-1, nearby_node_count: int).
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
        # Fetch latest risk score from all OTHER nodes
        cur.execute(
            f"""
            SELECT n.node_id, n.latitude, n.longitude,
                   r.{col} AS risk_score
            FROM nodes n
            LEFT JOIN LATERAL (
                SELECT {col} FROM sensor_readings
                WHERE node_id = n.node_id
                ORDER BY recorded_at DESC LIMIT 1
            ) r ON TRUE
            WHERE n.node_id != %s
            """,
            (trigger_node_id,),
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
    except Exception:
        # DB unavailable — fallback to single-node score
        return min(trigger_score / 100.0, 1.0), 0

    # Weighted sum — triggering node is distance=0, weight=1
    weighted_sum = float(trigger_score)
    weight_total = 1.0
    nearby       = 0

    for row in rows:
        if row["risk_score"] is None:
            continue
        dist = haversine_km(lat, lng, row["latitude"], row["longitude"])
        if dist > RADIUS_KM:
            continue
        weight        = 1.0 / (1.0 + (dist ** DECAY_FACTOR))
        weighted_sum += row["risk_score"] * weight
        weight_total += weight
        nearby       += 1

    raw_prob  = (weighted_sum / weight_total) / 100.0
    area_prob = round(min(max(raw_prob, 0.0), 1.0), 4)
    return area_prob, nearby
