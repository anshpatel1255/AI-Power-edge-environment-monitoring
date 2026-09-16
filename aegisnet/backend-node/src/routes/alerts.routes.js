const router = require('express').Router();
const db = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');
const sockets = require('../sockets/index');

// GET /api/alerts?status=open&hazard=flood
router.get('/', async (req, res) => {
  try {
    const { status, hazard, limit = 50 } = req.query;
    let query = 'SELECT a.*, n.name as node_name, n.latitude, n.longitude FROM alerts a JOIN nodes n ON a.node_id=n.node_id WHERE 1=1';
    const params = [];
    if (status) { params.push(status); query += ` AND a.status=$${params.length}`; }
    if (hazard) { params.push(hazard); query += ` AND a.hazard=$${params.length}`; }
    params.push(parseInt(limit));
    query += ` ORDER BY a.triggered_at DESC LIMIT $${params.length}`;
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/alerts/:id
router.patch('/:id', verifyToken, requireRole('authority', 'admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['confirmed', 'false_positive', 'resolved'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const resolvedSet = status === 'resolved' ? 'resolved_at=now(),' : '';
    const result = await db.query(
      `UPDATE alerts SET status=$1, ${resolvedSet} resolved_at=CASE WHEN $1='resolved' THEN now() ELSE resolved_at END WHERE id=$2 RETURNING *`,
      [status, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Alert not found' });
    sockets.emit('alert:statusChanged', result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
