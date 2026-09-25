const express = require('express');
const router = express.Router();
const pool = require('../db');

const CLICKPESA_API = 'https://api.clickpesa.com/third-parties';

function getEnv(name, fallbackNames = []) {
  if (process.env[name]) return process.env[name];

  for (const fallback of fallbackNames) {
    if (process.env[fallback]) return process.env[fallback];
  }

  return '';
}

// Generate unique ClickPesa order reference
function generateOrderReference() {
  const time = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();

  return `MCH${time}${random}`.substring(0, 20);
}

// Get ClickPesa authorization token
async function getClickPesaToken() {
  const apiKey = getEnv('CLICKPESA_API_KEY', ['CLICKPESA_APIKEY']);
  const clientId = getEnv('CLICKPESA_CLIENT_ID', ['CLICKPESA_CLIENTID']);

  if (!apiKey || !clientId) {
    throw new Error('CLICKPESA_API_KEY au CLICKPESA_CLIENT_ID haijawekwa Render');
  }

  const response = await fetch(
    `${CLICKPESA_API}/generate-token`,
    {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'client-id': clientId
      }
    }
  );

  const data = await response.json();

  if (!response.ok || !data.token) {
    throw new Error(
      data.message || data.error || 'Imeshindikana kupata ClickPesa token'
    );
  }

  return data.token;
}

// Map ClickPesa status -> MCHANGO status
function mapStatus(cpStatus) {
  switch (cpStatus) {
    case 'SUCCESS':
    case 'SETTLED':
      return 'approved';

    case 'FAILED':
    case 'CANCELED':
      return 'failed';

    default:
      return 'pending';
  }
}

/*
POST /api/mchango/:mchangoId/malipo/clickpesa

Body:
{
  "jina": "John",
  "simu": "0712345678",
  "kiasi": 10000
}
*/
router.post('/mchango/:mchangoId/malipo/clickpesa', async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      jina,
      simu,
      kiasi
    } = req.body;

    const mchangoId = req.params.mchangoId;

    if (!jina || !String(jina).trim()) {
      return res.status(400).json({
        error: 'Jina linahitajika'
      });
    }

    if (!simu) {
      return res.status(400).json({
        error: 'Namba ya simu inahitajika'
      });
    }

    if (!kiasi || Number(kiasi) <= 0) {
      return res.status(400).json({
        error: 'Kiasi sahihi kinahitajika'
      });
    }

    // Tanzania phone number -> 255XXXXXXXXX
    let phoneNumber = String(simu).replace(/\D/g, '');

    if (phoneNumber.startsWith('0')) {
      phoneNumber = '255' + phoneNumber.substring(1);
    }

    if (!phoneNumber.startsWith('255') || phoneNumber.length !== 12) {
      return res.status(400).json({
        error: 'Namba ya simu si sahihi. Tumia mfano 0712345678'
      });
    }

    await client.query('BEGIN');

    // Tafuta mshiriki
    const existing = await client.query(
      `SELECT id
       FROM washiriki
       WHERE mchango_id=$1
       AND LOWER(jina)=LOWER($2)
       LIMIT 1`,
      [mchangoId, String(jina).trim()]
    );

    let mshirikiId;

    if (existing.rows.length) {
      mshirikiId = existing.rows[0].id;

      await client.query(
        `UPDATE washiriki
         SET simu=$1
         WHERE id=$2`,
        [phoneNumber, mshirikiId]
      );
    } else {
      const created = await client.query(
        `INSERT INTO washiriki
         (mchango_id, jina, simu)
         VALUES ($1,$2,$3)
         RETURNING id`,
        [
          mchangoId,
          String(jina).trim(),
          phoneNumber
        ]
      );

      mshirikiId = created.rows[0].id;
    }

    // Unique ClickPesa reference
    const orderReference = generateOrderReference();

    // Hifadhi malipo kama pending
    const payment = await client.query(
      `INSERT INTO malipo
       (mchango_id, mshiriki_id, kiasi, njia, maelezo, status, order_reference)
       VALUES ($1,$2,$3,$4,$5,'pending',$6)
       RETURNING *`,
      [
        mchangoId,
        mshirikiId,
        Number(kiasi),
        'ClickPesa',
        'USSD-PUSH',
        orderReference
      ]
    );

    await client.query('COMMIT');

    const token = await getClickPesaToken();

    // ClickPesa checksum security iko OFF,
    // hivyo tunatuma checksum tupu.
    const requestBody = {
      amount: String(Number(kiasi)),
      currency: 'TZS',
      orderReference,
      phoneNumber,
      checksum: ''
    };

    // STEP 1: Preview
    const previewResponse = await fetch(
      `${CLICKPESA_API}/payments/preview-ussd-push-request`,
      {
        method: 'POST',
        headers: {
          Authorization: token.startsWith('Bearer ')
            ? token
            : `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...requestBody,
          fetchSenderDetails: false
        })
      }
    );

    const previewData = await previewResponse.json();

    if (!previewResponse.ok) {
      await pool.query(
        `UPDATE malipo
         SET status='failed'
         WHERE order_reference=$1`,
        [orderReference]
      );

      return res.status(400).json({
        error: 'ClickPesa preview imeshindikana',
        details: previewData
      });
    }

    // STEP 2: Initiate USSD-PUSH
    const initiateResponse = await fetch(
      `${CLICKPESA_API}/payments/initiate-ussd-push-request`,
      {
        method: 'POST',
        headers: {
          Authorization: token.startsWith('Bearer ')
            ? token
            : `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      }
    );

    const initiateData = await initiateResponse.json();

    if (!initiateResponse.ok) {
      await pool.query(
        `UPDATE malipo
         SET status='failed'
         WHERE order_reference=$1`,
        [orderReference]
      );

      return res.status(400).json({
        error: 'ClickPesa USSD-PUSH imeshindikana',
        details: initiateData
      });
    }

    res.status(201).json({
      success: true,
      message: 'USSD-PUSH imetumwa kwenye simu',
      orderReference,
      malipo: payment.rows[0],
      clickpesa: initiateData
    });

  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {}

    console.error('ClickPesa USSD-PUSH error:', err);

    res.status(500).json({
      error: err.message
    });

  } finally {
    client.release();
  }
});


/*
GET /api/clickpesa/payment/:orderReference

Kuangalia status ya malipo moja kwa moja ClickPesa.
*/
router.get('/clickpesa/payment/:orderReference', async (req, res) => {
  try {
    const token = await getClickPesaToken();

    const response = await fetch(
      `${CLICKPESA_API}/payments/${encodeURIComponent(req.params.orderReference)}`,
      {
        method: 'GET',
        headers: {
          Authorization: token.startsWith('Bearer ')
            ? token
            : `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    res.status(response.status).json(data);

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});


/*
POST /api/clickpesa/webhook

ClickPesa -> MCHANGO
*/
router.post('/clickpesa/webhook', async (req, res) => {
  try {
    const {
      status,
      orderReference
    } = req.body;

    console.log('📩 ClickPesa webhook:', req.body);

    if (!orderReference) {
      return res.status(400).json({
        error: 'orderReference haipo'
      });
    }

    const newStatus = mapStatus(status);

    const { rows } = await pool.query(
      `UPDATE malipo
       SET status=$1,
           tarehe=CURRENT_DATE
       WHERE order_reference=$2
       RETURNING *`,
      [
        newStatus,
        orderReference
      ]
    );

    if (!rows.length) {
      console.warn(
        `⚠️ order_reference=${orderReference} haikupatikana`
      );
    } else {
      console.log(
        `✅ Malipo ${orderReference} -> ${newStatus}`
      );
    }

    res.status(200).json({
      received: true
    });

  } catch (err) {
    console.error(
      'ClickPesa webhook error:',
      err.message
    );

    res.status(200).json({
      received: true,
      error: err.message
    });
  }
});

module.exports = router;
