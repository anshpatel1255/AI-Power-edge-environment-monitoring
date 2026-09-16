const router = require('express').Router();
const db = require('../config/db');

// GET /api/readings/latest — most recent reading per node
router.get('/latest', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT DISTINCT ON (node_id) *
      FROM sensor_readings
      ORDER BY node_id, recorded_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
