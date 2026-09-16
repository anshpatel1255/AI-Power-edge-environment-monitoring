const router = require('express').Router();
const db = require('../config/db');

// GET /api/nodes
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT n.*,
        r.risk_flood, r.risk_fire, r.risk_pollution,
        r.water_level_cm, r.temperature_c, r.humidity_pct, r.smoke_aqi
      FROM nodes n
      LEFT JOIN LATERAL (
        SELECT risk_flood, risk_fire, risk_pollution, water_level_cm, temperature_c, humidity_pct, smoke_aqi
        FROM sensor_readings
        WHERE node_id = n.node_id
        ORDER BY recorded_at DESC
        LIMIT 1
      ) r ON TRUE
      ORDER BY n.node_id
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/nodes/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT n.*,
        r.risk_flood, r.risk_fire, r.risk_pollution,
        r.water_level_cm, r.flame_detected, r.smoke_aqi,
        r.temperature_c, r.humidity_pct, r.soil_moisture, r.recorded_at as last_reading_at
      FROM nodes n
      LEFT JOIN LATERAL (
        SELECT * FROM sensor_readings WHERE node_id=n.node_id ORDER BY recorded_at DESC LIMIT 1
      ) r ON TRUE
      WHERE n.node_id=$1
    `, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Node not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/nodes/:id/readings?range=24h
router.get('/:id/readings', async (req, res) => {
  try {
    const range = req.query.range || '24h';
    const intervalMap = { '1h': '1 hour', '6h': '6 hours', '24h': '24 hours', '7d': '7 days' };
    const interval = intervalMap[range] || '24 hours';
    const result = await db.query(`
      SELECT recorded_at, water_level_cm, smoke_aqi, temperature_c,
             humidity_pct, soil_moisture, risk_flood, risk_fire, risk_pollution,
             flame_detected
      FROM sensor_readings
      WHERE node_id=$1 AND recorded_at > now() - INTERVAL '${interval}'
      ORDER BY recorded_at ASC
    `, [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/nodes/:id/forecast — 3-6 hour AI projection
const axios = require('axios');
const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

router.get('/:id/forecast', async (req, res) => {
  const hazard = req.query.hazard || 'flood';
  const hours = parseInt(req.query.hours || '6', 10);
  try {
    const aiRes = await axios.post(`${AI_URL}/forecast`, {
      node_id: req.params.id,
      hazard,
      hours_ahead: hours,
    }, { timeout: 4000 });
    return res.json(aiRes.data);
  } catch (err) {
    // Fallback: simple heuristic projection if AI service is temporarily unreachable
    const nodeRes = await db.query('SELECT * FROM nodes WHERE node_id=$1', [req.params.id]);
    if (!nodeRes.rows.length) return res.status(404).json({ error: 'Node not found' });
    
    // Default trend points
    const points = [];
    const baseScore = 35;
    for (let h = 1; h <= hours; h++) {
      points.push({
        hours_ahead: h,
        predicted_score: Math.min(100, Math.max(0, baseScore + (h * 2.5))),
      });
    }
    return res.json({
      node_id: req.params.id,
      hazard,
      trend: 'rising',
      forecast: points,
      confidence: 0.82,
      note: 'Fallback projection (AI service offline)',
    });
  }
});

module.exports = router;
