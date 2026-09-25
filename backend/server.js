// server.js — MCHANGO API (Node.js + Express + PostgreSQL)
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const mchangoRoutes = require('./routes/mchango');
const gharamaRoutes = require('./routes/gharama');
const washirikiRoutes = require('./routes/washiriki');
const malipoRoutes = require('./routes/malipo');
const clickpesaRoutes = require('./routes/clickpesa');
const settingsRoutes = require('./routes/settings');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'mchango-backend' }));

// Every route file below defines its own full path (e.g. '/mchango/:id',
// '/gharama/:id'), so they all mount cleanly under the single '/api' prefix
// with no overlap.
app.use('/api', mchangoRoutes);
app.use('/api', gharamaRoutes);
app.use('/api', washirikiRoutes);
app.use('/api', malipoRoutes);
app.use('/api', clickpesaRoutes);
app.use('/api', settingsRoutes);

// Once you're ready to host frontend + backend together on Render,
// uncomment this to serve the static frontend from the same service:
// const path = require('path');
// app.use(express.static(path.join(__dirname, '..', 'frontend')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ MCHANGO backend inaendesha kwenye port ${PORT}`);
});
