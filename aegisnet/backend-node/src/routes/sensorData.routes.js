// routes/sensorData.routes.js — Master ESP32 Gateway Ingestion & Dashboard Query APIs
// Compliant with SIH 2026 AegisNet Physical Architecture

const router = require('express').Router();
const sensorStore = require('../services/sensorStore');
const sockets = require('../sockets/index');

// ─── POST /api/sensor-data — Central Gateway Ingestion ─────────────────────────
// Receives data from Master ESP32 via Wi-Fi HTTP POST (or local USB serial bridge)
router.post('/', (req, res) => {
  try {
    const payload = req.body;
    if (!payload || !payload.node) {
      return res.status(400).json({
        error: 'Invalid payload: missing "node" property. Expected "FLOOD", "CO_TEMP", or "POLLUTION".',
      });
    }

    const record = sensorStore.saveReading(payload);

    // Instant real-time broadcast to all connected Web Dashboard clients
    sockets.emit('sensor:data', record);
    sockets.emit('reading:new', record);

    // If digital gas alarm triggered, broadcast alert event
    if (record.node === 'POLLUTION' && record.gas_status === 'ALARM') {
      sockets.emit('alert:new', {
        id: `ALERT-GAS-${Date.now()}`,
        hazard: 'pollution',
        severity: 'emergency',
        title: 'Toxic Gas Detected',
        message: 'MQ sensor digital threshold triggered on Pollution Node',
        timestamp: record.ist_time,
      });
    }

    res.status(201).json({
      success: true,
      message: `Reading ingested successfully for node: ${record.node}`,
      data: record,
    });
  } catch (err) {
    console.error('[SensorData API] Error saving reading:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/sensor-data/latest — Latest Reading for Every Node ───────────────
router.get('/latest', (req, res) => {
  try {
    const latestData = sensorStore.getLatest();
    res.json(latestData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/sensor-data/history — Time-Series Historical Records ─────────────
// Query params: node (optional: FLOOD, CO_TEMP, POLLUTION), range (5m, 15m, 1h, 6h, 24h, all)
router.get('/history', (req, res) => {
  try {
    const { node, range = '1h' } = req.query;
    const history = sensorStore.getHistory(node, range);
    res.json({
      node: node || 'ALL',
      range,
      count: history.length,
      data: history,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/sensor-data/alerts — Active Alerts Feed ──────────────────────────
router.get('/alerts', (req, res) => {
  try {
    const alerts = sensorStore.getAlerts();
    res.json({ count: alerts.length, data: alerts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/sensor-data/system-status — Complete Gateway Health Status ───────
router.get('/system-status', (req, res) => {
  try {
    const status = sensorStore.getSystemStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
