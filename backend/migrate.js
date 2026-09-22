// migrate.js — run once to create tables: node migrate.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function migrate(){
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  try{
    await pool.query(sql);
    console.log('✅ Schema imewekwa (tables zimeundwa).');

    // seed one default mchango row if table is empty, so the API has something to serve
    const { rows } = await pool.query('SELECT id FROM mchango LIMIT 1');
    if(rows.length === 0){
      const r = await pool.query(
        `INSERT INTO mchango (jina, tarehe, lengo) VALUES ($1, CURRENT_DATE, $2) RETURNING id`,
        ['Mchango wa Harusi', 820000]
      );
      await pool.query(
        `INSERT INTO settings (mchango_id, sarafu, mchango_wasii) VALUES ($1, 'TSh', '')`,
        [r.rows[0].id]
      );
      console.log('🌱 Mchango wa kwanza umeundwa (id=' + r.rows[0].id + ').');
    }
  }catch(err){
    console.error('❌ Migration imeshindwa:', err.message);
    process.exitCode = 1;
  }finally{
    await pool.end();
  }
}

migrate();
