const router = require('express').Router();
const db = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM thresholds ORDER BY hazard');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:hazard', verifyToken, requireRole('authority', 'admin'), async (req, res) => {
  try {
    const { hazard } = req.params;
    const { warn_score, danger_score } = req.body;
    const result = await db.query(
      `UPDATE thresholds SET warn_score=$1, danger_score=$2, updated_by=$3, updated_at=now()
       WHERE hazard=$4 RETURNING *`,
      [warn_score, danger_score, req.user.email, hazard]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Hazard not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
