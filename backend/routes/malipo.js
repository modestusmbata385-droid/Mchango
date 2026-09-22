const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/mchango/:mchangoId/malipo
router.get('/mchango/:mchangoId/malipo', async (req, res) => {
  try {
    const { status } = req.query;
    const params = [req.params.mchangoId];

    let where = 'm.mchango_id=$1';

    if (status === 'approved' || status === 'pending') {
      params.push(status);
      where += ' AND m.status=$2';
    }

    const { rows } = await pool.query(
      `SELECT m.*, w.jina AS mshiriki_jina
       FROM malipo m
       JOIN washiriki w ON w.id = m.mshiriki_id
       WHERE ${where}
       ORDER BY m.tarehe DESC, m.created_at DESC`,
      params
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/mchango/:mchangoId/malipo
router.post('/mchango/:mchangoId/malipo', async (req, res) => {
  try {
    const {
      mshirikiId,
      kiasi,
      tarehe,
      njia,
      maelezo
    } = req.body;

    if (!mshirikiId) {
      return res.status(400).json({
        error: 'mshirikiId inahitajika'
      });
    }

    const { rows } = await pool.query(
      `INSERT INTO malipo
       (mchango_id, mshiriki_id, kiasi, tarehe, njia, maelezo, status)
       VALUES ($1,$2,$3,COALESCE($4,CURRENT_DATE),$5,$6,'approved')
       RETURNING *`,
      [
        req.params.mchangoId,
        mshirikiId,
        kiasi || 0,
        tarehe || null,
        njia || 'Cash',
        maelezo || ''
      ]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/mchango/:mchangoId/malipo/toa
// PUBLIC CONTRIBUTION
router.post('/mchango/:mchangoId/malipo/toa', async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      jina,
      simu,
      kiasi,
      njia,
      maelezo
    } = req.body;

    const mchangoId = req.params.mchangoId;

    if (!jina || !String(jina).trim()) {
      return res.status(400).json({
        error: 'jina inahitajika'
      });
    }

    if (!kiasi || Number(kiasi) <= 0) {
      return res.status(400).json({
        error: 'kiasi sahihi kinahitajika'
      });
    }

    await client.query('BEGIN');

    // Tafuta mshiriki kwa jina
    const washiriki = await client.query(
      `SELECT id
       FROM washiriki
       WHERE mchango_id=$1
       AND LOWER(jina)=LOWER($2)
       LIMIT 1`,
      [
        mchangoId,
        String(jina).trim()
      ]
    );

    let mshirikiId;

    if (washiriki.rows.length) {
      mshirikiId = washiriki.rows[0].id;
    } else {
      // Kama hayupo, tengeneza mshiriki mpya
      const created = await client.query(
        `INSERT INTO washiriki
         (mchango_id, jina, simu)
         VALUES ($1,$2,$3)
         RETURNING id`,
        [
          mchangoId,
          String(jina).trim(),
          simu || ''
        ]
      );

      mshirikiId = created.rows[0].id;
    }

    // Hifadhi mchango kama pending
    const malipo = await client.query(
      `INSERT INTO malipo
       (mchango_id, mshiriki_id, kiasi, njia, maelezo, status)
       VALUES ($1,$2,$3,$4,$5,'pending')
       RETURNING *`,
      [
        mchangoId,
        mshirikiId,
        Number(kiasi),
        njia || 'Simu',
        maelezo || ''
      ]
    );

    await client.query('COMMIT');

    res.status(201).json(malipo.rows[0]);

  } catch (err) {

    await client.query('ROLLBACK');

    res.status(500).json({
      error: err.message
    });

  } finally {
    client.release();
  }
});

// PATCH /api/malipo/:id/approve
router.patch('/malipo/:id/approve', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE malipo
       SET status='approved'
       WHERE id=$1
       RETURNING *`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        error: 'Malipo hayakupatikana'
      });
    }

    res.json(rows[0]);

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// DELETE /api/malipo/:id
router.delete('/malipo/:id', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM malipo WHERE id=$1',
      [req.params.id]
    );

    res.status(204).end();

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

module.exports = router;
