// services/aiEngine.service.js
// Code Vortex — On-Server AI Prediction Engine
// Implements: flood forecast, wildfire spread, AQ prediction, landslide precursor,
//             auto-baseline anomaly detection, multi-hazard confidence scoring
// No external ML library needed — uses statistical methods (linear regression, z-score)

const db = require('../config/db');

// ─── In-memory baseline store per node ─────────────────────────────────────────
// { node_id: { water: { mean, stddev, n, sum, sumSq }, temp: {...}, aqi: {...} } }
const baselines = {};

// ─── Linear Regression Helper ──────────────────────────────────────────────────
// Returns { slope, intercept, r2 } from arrays of x (time index) and y (values)
function linearRegression(y) {
  const n = y.length;
  if (n < 2) return { slope: 0, intercept: y[0] || 0, r2: 0 };
  const x = y.map((_, i) => i);
  const xMean = x.reduce((a, b) => a + b, 0) / n;
  const yMean = y.reduce((a, b) => a + b, 0) / n;
  let ssxy = 0, ssxx = 0, ssyy = 0;
  for (let i = 0; i < n; i++) {
    ssxy += (x[i] - xMean) * (y[i] - yMean);
    ssxx += (x[i] - xMean) ** 2;
    ssyy += (y[i] - yMean) ** 2;
  }
  const slope = ssxx !== 0 ? ssxy / ssxx : 0;
  const intercept = yMean - slope * xMean;
  const r2 = ssyy !== 0 ? (ssxy ** 2) / (ssxx * ssyy) : 0;
  return { slope, intercept, r2 };
}

// ─── Clamp helper ──────────────────────────────────────────────────────────────
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// ─── Update Baseline for a node ────────────────────────────────────────────────
function updateBaseline(nodeId, metrics) {
  if (!baselines[nodeId]) {
    baselines[nodeId] = {};
  }
  const b = baselines[nodeId];
  for (const [key, val] of Object.entries(metrics)) {
    if (val == null || isNaN(val)) continue;
    if (!b[key]) b[key] = { n: 0, sum: 0, sumSq: 0, mean: val, stddev: 1 };
    b[key].n++;
    b[key].sum += val;
    b[key].sumSq += val * val;
    b[key].mean = b[key].sum / b[key].n;
    if (b[key].n > 1) {
      const variance = (b[key].sumSq / b[key].n) - b[key].mean ** 2;
      b[key].stddev = Math.sqrt(Math.max(0, variance));
    }
  }
}

// ─── Z-Score Anomaly Detection ─────────────────────────────────────────────────
function anomalyScore(nodeId, key, value) {
  const b = baselines[nodeId];
  if (!b || !b[key] || b[key].n < 20 || b[key].stddev < 0.01) return 0;
  return Math.abs((value - b[key].mean) / b[key].stddev);
}

// ─── Fetch last N readings for a node from DB ──────────────────────────────────
async function getRecentReadings(nodeId, hours = 6) {
  try {
    const result = await db.query(`
      SELECT recorded_at, water_level_cm, soil_moisture, temperature_c,
             humidity_pct, smoke_aqi, gas_ppm, risk_flood, risk_fire,
             risk_pollution, flame_detected
      FROM sensor_readings
      WHERE node_id = $1 AND recorded_at > now() - INTERVAL '${hours} hours'
      ORDER BY recorded_at ASC
    `, [nodeId]);
    return result.rows;
  } catch {
    return [];
  }
}

// ─── FLOOD FORECAST ────────────────────────────────────────────────────────────
// Uses linear regression on water_level_cm trend to project 3h and 6h ahead
// Lower distance sensor value = higher water, so rising trend = falling cm
async function forecastFlood(nodeId) {
  const rows = await getRecentReadings(nodeId, 6);
  const waterVals = rows.map(r => Number(r.water_level_cm)).filter(v => !isNaN(v));

  if (waterVals.length < 3) {
    return {
      hazard: 'flood',
      trend: 'unknown',
      prob_3h: 0.15,
      prob_6h: 0.20,
      predicted_level_3h: null,
      predicted_level_6h: null,
      confidence: 0.40,
      note: 'Insufficient data — need at least 3 readings',
    };
  }

  const reg = linearRegression(waterVals);
  const latestLevel = waterVals[waterVals.length - 1];
  const n = waterVals.length;

  // Project forward: each step ≈ reading interval (~30 min avg)
  // 6 readings ≈ 3h ahead, 12 readings ≈ 6h ahead
  const stepsPerHour = Math.max(1, rows.length / 6);
  const predicted3h = reg.intercept + reg.slope * (n + stepsPerHour * 3);
  const predicted6h = reg.intercept + reg.slope * (n + stepsPerHour * 6);

  // Risk probability: water_level_cm < 50 = dangerous (sensor closer to water)
  const prob3h = clamp(1 - predicted3h / 100, 0, 1);
  const prob6h = clamp(1 - predicted6h / 100, 0, 1);

  // Also factor in soil moisture
  const soilVals = rows.map(r => Number(r.soil_moisture)).filter(v => !isNaN(v));
  const avgSoil = soilVals.length ? soilVals.reduce((a, b) => a + b, 0) / soilVals.length : 50;
  const soilBoost = avgSoil > 80 ? 0.15 : avgSoil > 60 ? 0.07 : 0;

  const trend = reg.slope < -0.5 ? 'rising' : reg.slope > 0.5 ? 'receding' : 'stable';
  const confidence = clamp(0.40 + reg.r2 * 0.5 + (waterVals.length / 20) * 0.1, 0.40, 0.95);

  return {
    hazard: 'flood',
    trend,
    prob_3h: clamp(prob3h + soilBoost, 0, 1),
    prob_6h: clamp(prob6h + soilBoost, 0, 1),
    predicted_level_3h: Math.round(predicted3h * 10) / 10,
    predicted_level_6h: Math.round(predicted6h * 10) / 10,
    current_level: latestLevel,
    confidence: Math.round(confidence * 100) / 100,
    data_points: waterVals.length,
    slope_per_reading: Math.round(reg.slope * 100) / 100,
  };
}

// ─── WILDFIRE SPREAD MODEL ─────────────────────────────────────────────────────
// Estimates spread radius based on temperature trend, smoke AQI, and flame detection
async function forecastWildfire(nodeId) {
  const rows = await getRecentReadings(nodeId, 3);
  const latest = rows[rows.length - 1];

  if (!latest) {
    return {
      hazard: 'wildfire',
      active: false,
      spread_radius_km: 0,
      prob_ignition_3h: 0.05,
      confidence: 0.30,
      note: 'No recent data',
    };
  }

  const flameDetected = Boolean(latest.flame_detected);
  const aqi = Number(latest.smoke_aqi) || 0;
  const temp = Number(latest.temperature_c) || 25;
  const gas = Number(latest.gas_ppm) || 0;

  const tempVals = rows.map(r => Number(r.temperature_c)).filter(v => !isNaN(v));
  const tempReg = linearRegression(tempVals);
  const tempRising = tempReg.slope > 0.3;

  // Spread radius: combines fire status + smoke AQI + temp
  let spreadRadius = 0;
  if (flameDetected) {
    spreadRadius = 0.5 + (aqi / 100) * 1.5 + (temp - 30) * 0.05;
  } else if (aqi > 100 && tempRising) {
    spreadRadius = (aqi / 200) * 0.8;
  }

  const ignitionProb = flameDetected
    ? 0.95
    : clamp((temp - 25) * 0.02 + (aqi / 300) + (gas > 5 ? 0.3 : 0), 0, 0.95);

  const severity = flameDetected ? 'ACTIVE FIRE' : aqi > 150 ? 'HIGH SMOKE' : aqi > 80 ? 'SMOKE DETECTED' : 'CLEAR';

  return {
    hazard: 'wildfire',
    active: flameDetected,
    severity,
    spread_radius_km: Math.round(spreadRadius * 100) / 100,
    prob_ignition_3h: Math.round(ignitionProb * 100) / 100,
    current_aqi: aqi,
    current_temp: temp,
    temp_trend: tempRising ? 'rising' : 'stable',
    confidence: flameDetected ? 0.95 : clamp(0.40 + rows.length * 0.02, 0.40, 0.82),
  };
}

// ─── AIR QUALITY FORECAST ──────────────────────────────────────────────────────
// Projects AQI trend for next 3h using linear regression
async function forecastAirQuality(nodeId) {
  const rows = await getRecentReadings(nodeId, 6);
  const aqiVals = rows.map(r => Number(r.smoke_aqi)).filter(v => !isNaN(v));

  if (aqiVals.length < 3) {
    return {
      hazard: 'air_quality',
      trend: 'unknown',
      predicted_aqi_3h: null,
      prob_hazardous_3h: 0.10,
      confidence: 0.35,
    };
  }

  const reg = linearRegression(aqiVals);
  const n = aqiVals.length;
  const stepsPerHour = Math.max(1, rows.length / 6);
  const predicted3h = Math.round(reg.intercept + reg.slope * (n + stepsPerHour * 3));
  const predicted6h = Math.round(reg.intercept + reg.slope * (n + stepsPerHour * 6));

  // WHO AQI thresholds: >150 Unhealthy, >200 Very Unhealthy, >300 Hazardous
  const probHazardous3h = clamp(
    predicted3h > 300 ? 0.95 : predicted3h > 200 ? 0.70 : predicted3h > 150 ? 0.45 : predicted3h > 100 ? 0.20 : 0.05,
    0, 1
  );

  const category =
    predicted3h > 300 ? 'Hazardous' :
    predicted3h > 200 ? 'Very Unhealthy' :
    predicted3h > 150 ? 'Unhealthy' :
    predicted3h > 100 ? 'Unhealthy for Sensitive Groups' :
    predicted3h > 50  ? 'Moderate' : 'Good';

  return {
    hazard: 'air_quality',
    trend: reg.slope > 2 ? 'worsening' : reg.slope < -2 ? 'improving' : 'stable',
    current_aqi: aqiVals[aqiVals.length - 1],
    predicted_aqi_3h: predicted3h,
    predicted_aqi_6h: predicted6h,
    predicted_category_3h: category,
    prob_hazardous_3h: Math.round(probHazardous3h * 100) / 100,
    confidence: clamp(0.40 + reg.r2 * 0.45 + aqiVals.length * 0.01, 0.40, 0.90),
    data_points: aqiVals.length,
  };
}

// ─── LANDSLIDE PRECURSOR DETECTION ────────────────────────────────────────────
// Triggers when: soil moisture > 85% AND rising temperature AND heavy "rainfall proxy"
async function detectLandslidePrecursor(nodeId) {
  const rows = await getRecentReadings(nodeId, 3);
  const latest = rows[rows.length - 1];

  if (!latest) {
    return {
      hazard: 'landslide',
      risk_level: 'low',
      prob_3h: 0.03,
      confidence: 0.30,
      triggers: [],
    };
  }

  const soil = Number(latest.soil_moisture) || 0;
  const temp = Number(latest.temperature_c) || 25;
  const humidity = Number(latest.humidity_pct) || 50;

  const triggers = [];
  let riskScore = 0;

  if (soil > 90) { triggers.push('Critical soil saturation (>90%)'); riskScore += 40; }
  else if (soil > 80) { triggers.push('High soil saturation (>80%)'); riskScore += 20; }

  if (humidity > 90) { triggers.push('Extreme humidity — heavy rainfall likely'); riskScore += 20; }
  else if (humidity > 80) { triggers.push('High humidity — rainfall indicator'); riskScore += 10; }

  // Rapid temp drop can indicate sudden rainfall
  const tempVals = rows.map(r => Number(r.temperature_c)).filter(v => !isNaN(v));
  const tempReg = linearRegression(tempVals);
  if (tempReg.slope < -1.5) { triggers.push('Rapid temperature drop — rain onset detected'); riskScore += 20; }

  const prob3h = clamp(riskScore / 100, 0.03, 0.95);
  const riskLevel = prob3h > 0.70 ? 'critical' : prob3h > 0.45 ? 'high' : prob3h > 0.20 ? 'moderate' : 'low';

  return {
    hazard: 'landslide',
    risk_level: riskLevel,
    prob_3h: Math.round(prob3h * 100) / 100,
    soil_moisture: soil,
    humidity,
    temperature: temp,
    temp_trend: tempReg.slope < -1 ? 'dropping fast' : 'stable',
    triggers,
    confidence: clamp(0.40 + rows.length * 0.05, 0.40, 0.85),
  };
}

// ─── MULTI-HAZARD CORRELATION ──────────────────────────────────────────────────
// Checks across ALL nodes in a region for compound disaster signatures
async function detectMultiHazardCorrelation() {
  let rows = [];
  try {
    const result = await db.query(`
      SELECT DISTINCT ON (node_id)
        node_id, water_level_cm, smoke_aqi, gas_ppm, temperature_c,
        soil_moisture, flame_detected, risk_flood, risk_fire, risk_pollution,
        recorded_at
      FROM sensor_readings
      ORDER BY node_id, recorded_at DESC
    `);
    rows = result.rows;
  } catch {
    return [];
  }

  const correlations = [];

  // Pattern 1: Industrial discharge — multiple nodes show water + pollution spike
  const highWaterNodes = rows.filter(r => Number(r.water_level_cm) < 40);
  const highPollutionNodes = rows.filter(r => Number(r.smoke_aqi) > 100 || Number(r.gas_ppm) > 8);
  if (highWaterNodes.length >= 2 && highPollutionNodes.length >= 1) {
    correlations.push({
      type: 'COMPOUND_FLOOD_POLLUTION',
      severity: 'emergency',
      title: 'Industrial Discharge Detected',
      description: `${highWaterNodes.length} flood nodes + ${highPollutionNodes.length} pollution node(s) elevated simultaneously. Possible industrial discharge into waterway.`,
      affected_nodes: [...new Set([...highWaterNodes, ...highPollutionNodes].map(r => r.node_id))],
      confidence: 0.78,
    });
  }

  // Pattern 2: Wildfire + air quality cascade
  const fireNodes = rows.filter(r => r.flame_detected || Number(r.risk_fire) > 70);
  const smokeNodes = rows.filter(r => Number(r.smoke_aqi) > 150);
  if (fireNodes.length >= 1 && smokeNodes.length >= 1) {
    correlations.push({
      type: 'COMPOUND_WILDFIRE_SMOKE',
      severity: 'emergency',
      title: 'Wildfire Smoke Cascade',
      description: `Active fire detected at ${fireNodes.map(r => r.node_id).join(', ')} causing regional air quality collapse. ${smokeNodes.length} node(s) reporting hazardous AQI.`,
      affected_nodes: [...new Set([...fireNodes, ...smokeNodes].map(r => r.node_id))],
      confidence: 0.88,
    });
  }

  // Pattern 3: Regional heat + drought stress
  const hotNodes = rows.filter(r => Number(r.temperature_c) > 42);
  const dryNodes = rows.filter(r => Number(r.soil_moisture) < 15);
  if (hotNodes.length >= 2 && dryNodes.length >= 1) {
    correlations.push({
      type: 'COMPOUND_HEAT_DROUGHT',
      severity: 'warning',
      title: 'Extreme Heat + Drought Stress',
      description: `${hotNodes.length} nodes reporting temperatures >42°C with critically low soil moisture. High wildfire ignition risk in next 6 hours.`,
      affected_nodes: [...new Set([...hotNodes, ...dryNodes].map(r => r.node_id))],
      confidence: 0.72,
    });
  }

  return correlations;
}

// ─── FULL AI REPORT for a node ─────────────────────────────────────────────────
// Returns all predictions bundled, used by /api/predict/:nodeId
async function getNodePrediction(nodeId) {
  // Get node category to know which models to run
  let category = 'flood';
  try {
    const res = await db.query('SELECT category FROM nodes WHERE node_id=$1', [nodeId]);
    if (res.rows.length) category = res.rows[0].category || 'flood';
  } catch {}

  // Run all relevant models in parallel
  const [flood, wildfire, airQuality, landslide] = await Promise.all([
    forecastFlood(nodeId),
    forecastWildfire(nodeId),
    forecastAirQuality(nodeId),
    detectLandslidePrecursor(nodeId),
  ]);

  // Primary hazard — surface the most relevant based on category
  const primaryHazard = category === 'fire' ? wildfire
    : category === 'air' ? airQuality
    : category === 'landslide' ? landslide
    : flood;

  // Overall risk score 0-100
  const overallRisk = Math.round(
    Math.max(
      flood.prob_6h * 100,
      wildfire.prob_ignition_3h * 100,
      airQuality.prob_hazardous_3h * 100,
      landslide.prob_3h * 100,
    )
  );

  return {
    node_id: nodeId,
    category,
    generated_at: new Date().toISOString(),
    overall_risk_score: overallRisk,
    primary_hazard: primaryHazard,
    forecasts: { flood, wildfire, air_quality: airQuality, landslide },
  };
}

// ─── NETWORK-WIDE SUMMARY ─────────────────────────────────────────────────────
// Quick summary for Dashboard AI panel — highest risks across all nodes
async function getNetworkAiSummary() {
  let nodes = [];
  try {
    const res = await db.query(`
      SELECT DISTINCT ON (node_id) node_id, category,
        water_level_cm, smoke_aqi, temperature_c, soil_moisture,
        gas_ppm, flame_detected, humidity_pct
      FROM sensor_readings
      ORDER BY node_id, recorded_at DESC
    `);
    nodes = res.rows;
  } catch {
    // No DB — return mock summary
    return getMockSummary();
  }

  if (nodes.length === 0) return getMockSummary();

  // Aggregate risk signals
  const floodNodes   = nodes.filter(n => Number(n.water_level_cm) < 50);
  const fireNodes    = nodes.filter(n => n.flame_detected || Number(n.temperature_c) > 40);
  const pollutNodes  = nodes.filter(n => Number(n.smoke_aqi) > 100);
  const droughtNodes = nodes.filter(n => Number(n.soil_moisture) < 20);

  const overallFloodProb  = clamp(floodNodes.length / Math.max(nodes.length, 1), 0, 1);
  const overallFireProb   = clamp(fireNodes.length / Math.max(nodes.length, 1) * 1.5, 0, 1);
  const overallPollutProb = clamp(pollutNodes.length / Math.max(nodes.length, 1), 0, 1);

  const correlations = await detectMultiHazardCorrelation();

  return {
    generated_at: new Date().toISOString(),
    total_nodes: nodes.length,
    network_health: clamp(100 - (floodNodes.length + fireNodes.length + pollutNodes.length) * 5, 0, 100),
    hazard_summary: {
      flood: {
        prob_3h: Math.round(overallFloodProb * 0.85 * 100) / 100,
        prob_6h: Math.round(overallFloodProb * 100) / 100,
        affected_nodes: floodNodes.length,
        trend: floodNodes.length > nodes.length * 0.3 ? 'rising' : 'stable',
      },
      wildfire: {
        prob_3h: Math.round(overallFireProb * 100) / 100,
        active_fires: fireNodes.filter(n => n.flame_detected).length,
        high_risk_nodes: fireNodes.length,
        trend: fireNodes.length > 0 ? 'active' : 'clear',
      },
      air_quality: {
        prob_hazardous_3h: Math.round(overallPollutProb * 100) / 100,
        nodes_above_100_aqi: pollutNodes.length,
        trend: pollutNodes.length > nodes.length * 0.25 ? 'worsening' : 'acceptable',
      },
      drought: {
        stress_nodes: droughtNodes.length,
        severity: droughtNodes.length > 3 ? 'high' : droughtNodes.length > 1 ? 'moderate' : 'low',
      },
    },
    compound_alerts: correlations,
    confidence: nodes.length >= 5 ? 0.85 : nodes.length >= 2 ? 0.65 : 0.45,
    note: nodes.length < 3 ? 'Low confidence — fewer than 3 active nodes reporting' : undefined,
  };
}

function getMockSummary() {
  return {
    generated_at: new Date().toISOString(),
    total_nodes: 18,
    network_health: 87,
    hazard_summary: {
      flood:       { prob_3h: 0.22, prob_6h: 0.31, affected_nodes: 3, trend: 'stable' },
      wildfire:    { prob_3h: 0.09, active_fires: 0, high_risk_nodes: 1, trend: 'clear' },
      air_quality: { prob_hazardous_3h: 0.14, nodes_above_100_aqi: 2, trend: 'acceptable' },
      drought:     { stress_nodes: 1, severity: 'low' },
    },
    compound_alerts: [],
    confidence: 0.82,
    note: 'Simulated data — connect backend database for live AI predictions',
  };
}

module.exports = {
  getNodePrediction,
  getNetworkAiSummary,
  detectMultiHazardCorrelation,
  updateBaseline,
  anomalyScore,
  forecastFlood,
  forecastWildfire,
  forecastAirQuality,
  detectLandslidePrecursor,
};
