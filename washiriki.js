const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/mchango/:mchangoId/washiriki
router.get('/mchango/:mchangoId/washiriki', async (req, res) => {
  try{
    const { rows } = await pool.query(
      'SELECT * FROM washiriki WHERE mchango_id=$1 ORDER BY jina ASC',
      [req.params.mchangoId]
    );
    res.json(rows);
  }catch(err){ res.status(500).json({ error: err.message }); }
});

// POST /api/mchango/:mchangoId/washiriki
router.post('/mchango/:mchangoId/washiriki', async (req, res) => {
  try{
    const { jina, simu, kiasiKinachotarajiwa } = req.body;
    if(!jina) return res.status(400).json({ error: 'jina inahitajika' });
    const { rows } = await pool.query(
      `INSERT INTO washiriki (mchango_id, jina, simu, kiasi_kinachotarajiwa)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.params.mchangoId, jina, simu || '', kiasiKinachotarajiwa || 0]
    );
    res.status(201).json(rows[0]);
  }catch(err){ res.status(500).json({ error: err.message }); }
});

// PATCH /api/washiriki/:id
router.patch('/washiriki/:id', async (req, res) => {
  try{
    const { jina, simu, kiasiKinachotarajiwa } = req.body;
    const { rows } = await pool.query(
      `UPDATE washiriki SET jina=COALESCE($1,jina), simu=COALESCE($2,simu),
       kiasi_kinachotarajiwa=COALESCE($3,kiasi_kinachotarajiwa) WHERE id=$4 RETURNING *`,
      [jina, simu, kiasiKinachotarajiwa, req.params.id]
    );
    if(!rows.length) return res.status(404).json({ error: 'Mshiriki hakupatikana' });
    res.json(rows[0]);
  }catch(err){ res.status(500).json({ error: err.message }); }
});

// DELETE /api/washiriki/:id  (cascades to malipo via FK)
router.delete('/washiriki/:id', async (req, res) => {
  try{
    await pool.query('DELETE FROM washiriki WHERE id=$1', [req.params.id]);
    res.status(204).end();
  }catch(err){ res.status(500).json({ error: err.message }); }
});

// GET /api/mchango/:mchangoId/mkeka — participants + how much each has paid
router.get('/mchango/:mchangoId/mkeka', async (req, res) => {
  try{
    const { rows } = await pool.query(
      `SELECT w.id, w.jina, w.simu, w.kiasi_kinachotarajiwa AS lengo,
              COALESCE(SUM(m.kiasi),0) AS kiasi
       FROM washiriki w
       LEFT JOIN malipo m ON m.mshiriki_id = w.id
       WHERE w.mchango_id = $1
       GROUP BY w.id
       ORDER BY w.jina ASC`,
      [req.params.mchangoId]
    );
    const mkeka = rows.map(r => {
      const lengo = Number(r.lengo);
      const kiasi = Number(r.kiasi);
      return {
        id: r.id, jina: r.jina, simu: r.simu, lengo, kiasi,
        amelipa: lengo > 0 ? kiasi >= lengo : kiasi > 0,
        salio: lengo > 0 ? Math.max(lengo - kiasi, 0) : 0
      };
    });
    res.json(mkeka);
  }catch(err){ res.status(500).json({ error: err.message }); }
});

module.exports = router;
