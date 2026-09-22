const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/mchango/:mchangoId/gharama
router.get('/mchango/:mchangoId/gharama', async (req, res) => {
  try{
    const { rows } = await pool.query(
      'SELECT * FROM gharama WHERE mchango_id=$1 ORDER BY tarehe DESC, created_at DESC',
      [req.params.mchangoId]
    );
    res.json(rows);
  }catch(err){ res.status(500).json({ error: err.message }); }
});

// POST /api/mchango/:mchangoId/gharama
router.post('/mchango/:mchangoId/gharama', async (req, res) => {
  try{
    const { jina, kiasi, tarehe, maelezo } = req.body;
    if(!jina) return res.status(400).json({ error: 'jina inahitajika' });
    const { rows } = await pool.query(
      `INSERT INTO gharama (mchango_id, jina, kiasi, tarehe, maelezo)
       VALUES ($1,$2,$3,COALESCE($4,CURRENT_DATE),$5) RETURNING *`,
      [req.params.mchangoId, jina, kiasi || 0, tarehe || null, maelezo || '']
    );
    res.status(201).json(rows[0]);
  }catch(err){ res.status(500).json({ error: err.message }); }
});

// PATCH /api/gharama/:id
router.patch('/gharama/:id', async (req, res) => {
  try{
    const { jina, kiasi, tarehe, maelezo } = req.body;
    const { rows } = await pool.query(
      `UPDATE gharama SET jina=COALESCE($1,jina), kiasi=COALESCE($2,kiasi),
       tarehe=COALESCE($3,tarehe), maelezo=COALESCE($4,maelezo) WHERE id=$5 RETURNING *`,
      [jina, kiasi, tarehe, maelezo, req.params.id]
    );
    if(!rows.length) return res.status(404).json({ error: 'Gharama haikupatikana' });
    res.json(rows[0]);
  }catch(err){ res.status(500).json({ error: err.message }); }
});

// DELETE /api/gharama/:id
router.delete('/gharama/:id', async (req, res) => {
  try{
    await pool.query('DELETE FROM gharama WHERE id=$1', [req.params.id]);
    res.status(204).end();
  }catch(err){ res.status(500).json({ error: err.message }); }
});

module.exports = router;
