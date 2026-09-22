const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/mchango/:id  — event details + settings
router.get('/mchango/:id', async (req, res) => {
  try{
    const { id } = req.params;
    const m = await pool.query('SELECT * FROM mchango WHERE id=$1', [id]);
    if(!m.rows.length) return res.status(404).json({ error: 'Mchango haukupatikana' });
    const s = await pool.query('SELECT * FROM settings WHERE mchango_id=$1', [id]);
    res.json({ ...m.rows[0], settings: s.rows[0] || null });
  }catch(err){ res.status(500).json({ error: err.message }); }
});

// PATCH /api/mchango/:id — update jina / tarehe / lengo
router.patch('/mchango/:id', async (req, res) => {
  try{
    const { id } = req.params;
    const { jina, tarehe, lengo } = req.body;
    const { rows } = await pool.query(
      `UPDATE mchango SET jina=COALESCE($1,jina), tarehe=COALESCE($2,tarehe), lengo=COALESCE($3,lengo) WHERE id=$4 RETURNING *`,
      [jina, tarehe, lengo, id]
    );
    if(!rows.length) return res.status(404).json({ error: 'Mchango haukupatikana' });
    res.json(rows[0]);
  }catch(err){ res.status(500).json({ error: err.message }); }
});

// GET /api/mchango/:id/summary — dashboard KPIs, computed server-side
router.get('/mchango/:id/summary', async (req, res) => {
  try{
    const { id } = req.params;
    const m = await pool.query('SELECT * FROM mchango WHERE id=$1', [id]);
    if(!m.rows.length) return res.status(404).json({ error: 'Mchango haukupatikana' });

    const gharamaSum = await pool.query('SELECT COALESCE(SUM(kiasi),0) AS total FROM gharama WHERE mchango_id=$1', [id]);
    const malipoSum = await pool.query('SELECT COALESCE(SUM(kiasi),0) AS total FROM malipo WHERE mchango_id=$1', [id]);
    const washirikiCount = await pool.query('SELECT COUNT(*) AS n FROM washiriki WHERE mchango_id=$1', [id]);

    const lengo = Number(m.rows[0].lengo);
    const gharamaZote = lengo > 0 ? lengo : Number(gharamaSum.rows[0].total);
    const zilizokusanywa = Number(malipoSum.rows[0].total);
    const zilizobaki = Math.max(gharamaZote - zilizokusanywa, 0);
    const progress = gharamaZote > 0 ? Math.min((zilizokusanywa / gharamaZote) * 100, 100) : 0;

    res.json({
      jina: m.rows[0].jina,
      gharamaZote, zilizokusanywa, zilizobaki,
      washiriki: Number(washirikiCount.rows[0].n),
      progress
    });
  }catch(err){ res.status(500).json({ error: err.message }); }
});

module.exports = router;
