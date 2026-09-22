/* =========================================================
   MCHANGO — storage.js (API VERSION)
   Talks to the mchango-backend API instead of localStorage.
   Every function keeps the same name it had in the
   localStorage version, but is now async — callers must
   use `await Store.xxx()`.
   ========================================================= */

const API_BASE = 'https://mchango-backend-47ur.onrender.com/api';
const MCHANGO_ID = 1; // single-event app: always the first (and only) mchango row

let cachedSettings = { sarafu: 'TSh', mchangoWasii: '' };

async function apiFetch(path, options = {}) {
  let res;
  try {
    res = await fetch(API_BASE + path, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
  } catch (e) {
    throw new Error('Imeshindikana kuunganisha na seva — angalia mtandao wako');
  }
  if (!res.ok) {
    let msg = 'Hitilafu ya seva (' + res.status + ')';
    try { const j = await res.json(); if (j.error) msg = j.error; } catch (e) {}
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}

function onlyDate(v) {
  return v ? String(v).slice(0, 10) : '';
}

const Store = {
  // ---------- Mchango (event) ----------
  async getMchango() {
    const m = await apiFetch(`/mchango/${MCHANGO_ID}`);
    return { jina: m.jina, tarehe: onlyDate(m.tarehe), lengo: Number(m.lengo) || 0 };
  },
  async updateMchango(patch) {
    const m = await apiFetch(`/mchango/${MCHANGO_ID}`, {
      method: 'PATCH',
      body: JSON.stringify(patch)
    });
    return { jina: m.jina, tarehe: onlyDate(m.tarehe), lengo: Number(m.lengo) || 0 };
  },

  // ---------- Gharama (expenses) ----------
  async listGharama() {
    const rows = await apiFetch(`/mchango/${MCHANGO_ID}/gharama`);
    return rows.map(g => ({ id: g.id, jina: g.jina, kiasi: Number(g.kiasi) || 0, tarehe: onlyDate(g.tarehe), maelezo: g.maelezo || '' }));
  },
  async addGharama({ jina, kiasi, tarehe, maelezo }) {
    return apiFetch(`/mchango/${MCHANGO_ID}/gharama`, {
      method: 'POST',
      body: JSON.stringify({ jina, kiasi: Number(kiasi) || 0, tarehe, maelezo })
    });
  },
  async deleteGharama(id) {
    await apiFetch(`/gharama/${id}`, { method: 'DELETE' });
  },

  // ---------- Washiriki (participants) ----------
  async listWashiriki() {
    const rows = await apiFetch(`/mchango/${MCHANGO_ID}/washiriki`);
    return rows.map(w => ({ id: w.id, jina: w.jina, simu: w.simu || '', kiasiKinachotarajiwa: Number(w.kiasi_kinachotarajiwa) || 0 }))
                .sort((a, b) => a.jina.localeCompare(b.jina));
  },
  async addMshiriki({ jina, simu, kiasiKinachotarajiwa }) {
    return apiFetch(`/mchango/${MCHANGO_ID}/washiriki`, {
      method: 'POST',
      body: JSON.stringify({ jina, simu, kiasiKinachotarajiwa: Number(kiasiKinachotarajiwa) || 0 })
    });
  },
  async deleteMshiriki(id) {
    await apiFetch(`/washiriki/${id}`, { method: 'DELETE' });
  },

  // ---------- Malipo (payments) ----------
  async listMalipo() {
    const rows = await apiFetch(`/mchango/${MCHANGO_ID}/malipo`);
    return rows.map(p => ({
      id: p.id, mshirikiId: p.mshiriki_id, mshirikiJina: p.mshiriki_jina,
      kiasi: Number(p.kiasi) || 0, tarehe: onlyDate(p.tarehe), njia: p.njia || '', maelezo: p.maelezo || ''
    }));
  },
  async addMalipo({ mshirikiId, kiasi, tarehe, njia, maelezo }) {
    return apiFetch(`/mchango/${MCHANGO_ID}/malipo`, {
      method: 'POST',
      body: JSON.stringify({ mshirikiId, kiasi: Number(kiasi) || 0, tarehe, njia, maelezo })
cachedSettings.sarafu + ' ' + val.toLocaleString('en-US');
  }
};

window.Store = Store;

