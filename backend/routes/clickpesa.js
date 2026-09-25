const express = require('express');
const router = express.Router();
const pool = require('../db');

// Ramani: hali ya ClickPesa -> hali yetu ya 'malipo'
function mapStatus(cpStatus) {
  switch (cpStatus) {
    case 'SUCCESS': return 'approved';
    case 'FAILED':
    case 'CANCELED': return 'failed';
    default: return 'pending'; // PROCESSING
  }
}

// POST /api/clickpesa/webhook
router.post('/clickpesa/webhook', async (req, res) => {
  try {
    const { status, orderReference } = req.body;
    console.log('📩 ClickPesa webhook:', req.body);

    if (!orderReference) {
      return res.status(400).json({ error: 'orderReference haipo' });
    }

    const { rows } = await pool.query(
      `UPDATE malipo SET status=$1 WHERE id=$2 RETURNING *`,
      [mapStatus(status), orderReference]
    );

    if (!rows.length) {
      console.warn(`⚠️ Malipo id=${orderReference} hayakupatikana`);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('ClickPesa webhook error:', err.message);
    res.status(200).json({ received: true, error: err.message });
  }
});

module.exports = router;
