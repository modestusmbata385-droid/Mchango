const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/mchango/:mchangoId/malipo
router.get('/mchango/:mchangoId/malipo', async (req, res) => {
  try{
    const { rows } = await pool.query(
      `SELECT m.*, w.jina AS mshiriki_jina
       FROM malipo m JOIN washiriki w ON w.id = m.mshiriki_id
       WHERE m.mchango_id=$1 ORDER BY m.tarehe DESC, m.created_at DESC`,
      [req.params.mchangoId]
    );
    res.json(rows);
  }catch(err){ res.status(500).json({ error: err.message }); }
});

// POST /api/mchango/:mchangoId/malipo
router.post('/mchango/:mchangoId/malipo', async (req, res) => {
  try{
    const { mshirikiId, kiasi, tarehe, njia, maelezo } = req.body;
    if(!mshirikiId) return res.status(400).json({ error: 'mshirikiId inahitajika' });
    const { rows } = await pool.query(
      `INSERT INTO malipo (mchango_id, mshiriki_id, kiasi, tarehe, njia, maelezo)
       VALUES ($1,$2,$3,COALESCE($4,CURRENT_DATE),$5,$6) RETURNING *`,
      [req.params.mchangoId, mshirikiId, kiasi || 0, tarehe || null, njia || 'Cash', maelezo || '']
    );
    res.status(201).json(rows[0]);
  }catch(err){ res.status(500).json({ error: err.message }); }
});

// DELETE /api/malipo/:id
router.delete('/malipo/:id', async (req, res) => {
  try{
    await pool.query('DELETE FROM malipo WHERE id=$1', [req.params.id]);
    res.status(204).end();
  }catch(err){ res.status(500).json({ error: err.message }); }
});

module.exports = router;
