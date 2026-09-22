const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/mchango/:mchangoId/settings
router.get('/mchango/:mchangoId/settings', async (req, res) => {
  try{
    const { rows } = await pool.query('SELECT * FROM settings WHERE mchango_id=$1', [req.params.mchangoId]);
    res.json(rows[0] || { mchango_id: req.params.mchangoId, sarafu: 'TSh', mchango_wasii: '' });
  }catch(err){ res.status(500).json({ error: err.message }); }
});

// PATCH /api/mchango/:mchangoId/settings
router.patch('/mchango/:mchangoId/settings', async (req, res) => {
  try{
    const { sarafu, mchangoWasii } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO settings (mchango_id, sarafu, mchango_wasii)
       VALUES ($1,$2,$3)
       ON CONFLICT (mchango_id) DO UPDATE
       SET sarafu=COALESCE($2, settings.sarafu), mchango_wasii=COALESCE($3, settings.mchango_wasii)
       RETURNING *`,
      [req.params.mchangoId, sarafu || 'TSh', mchangoWasii || '']
    );
    res.json(rows[0]);
  }catch(err){ res.status(500).json({ error: err.message }); }
});

module.exports = router;
