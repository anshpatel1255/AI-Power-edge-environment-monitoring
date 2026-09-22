// routes/predict.routes.js — Code Vortex AI Prediction REST API
// Endpoints:
//   GET /api/predict/summary        — Network-wide AI risk summary for Dashboard
//   GET /api/predict/:nodeId        — Full AI prediction for a specific node
//   GET /api/predict/correlations   — Multi-hazard compound event detection

const router = require('express').Router();
const ai = require('../services/aiEngine.service');

// GET /api/predict/summary — Full network AI summary (used by Dashboard)
router.get('/summary', async (req, res) => {
  try {
    const summary = await ai.getNetworkAiSummary();
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/predict/correlations — Multi-hazard compound event detection
router.get('/correlations', async (req, res) => {
  try {
    const correlations = await ai.detectMultiHazardCorrelation();
    res.json(correlations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/predict/:nodeId — Full AI prediction for a specific node
router.get('/:nodeId', async (req, res) => {
  try {
    const prediction = await ai.getNodePrediction(req.params.nodeId);
    res.json(prediction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/predict/:nodeId/flood — Flood-only forecast
router.get('/:nodeId/flood', async (req, res) => {
  try {
    const forecast = await ai.forecastFlood(req.params.nodeId);
    res.json(forecast);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/predict/:nodeId/wildfire — Wildfire-only forecast
router.get('/:nodeId/wildfire', async (req, res) => {
  try {
    const forecast = await ai.forecastWildfire(req.params.nodeId);
    res.json(forecast);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/predict/:nodeId/airquality — AQ forecast
router.get('/:nodeId/airquality', async (req, res) => {
  try {
    const forecast = await ai.forecastAirQuality(req.params.nodeId);
    res.json(forecast);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/predict/:nodeId/landslide — Landslide precursor
router.get('/:nodeId/landslide', async (req, res) => {
  try {
    const forecast = await ai.detectLandslidePrecursor(req.params.nodeId);
    res.json(forecast);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
