/* =========================================================
   MCHANGO — storage.js
   Data layer backed by localStorage. Later this file can be
   swapped for one that calls the backend API (see backend/)
   without changing any other file — every function below
   keeps the same name and return shape.
   ========================================================= */

const DB_KEY = 'mchango_db_v1';

function uid(){
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function defaultDB(){
  return {
    mchango: {
      jina: 'Mchango wa Harusi',
      tarehe: new Date().toISOString().slice(0,10),
      lengo: 820000 // target total cost (Gharama Zote), editable in Mchango Mpya / Settings
    },
    gharama: [],   // {id, jina, kiasi, tarehe, maelezo}
    washiriki: [], // {id, jina, simu, kiasiKinachotarajiwa}
    malipo: [],    // {id, mshirikiId, kiasi, tarehe, njia, maelezo}
    settings: {
      sarafu: 'TSh',
      mchangoWasii: '' // organizer/admin name, optional, for PDF/whatsapp footer
    }
  };
}

function load(){
  try{
    const raw = localStorage.getItem(DB_KEY);
    if(!raw) { const d = defaultDB(); save(d); return d; }
    const parsed = JSON.parse(raw);
    // merge with defaults in case of missing keys from older versions
    const base = defaultDB();
    return {
      mchango: { ...base.mchango, ...(parsed.mchango||{}) },
      gharama: Array.isArray(parsed.gharama) ? parsed.gharama : [],
      washiriki: Array.isArray(parsed.washiriki) ? parsed.washiriki : [],
      malipo: Array.isArray(parsed.malipo) ? parsed.malipo : [],
      settings: { ...base.settings, ...(parsed.settings||{}) }
    };
  }catch(e){
    console.error('Imeshindikana kusoma data, tunaanzisha upya', e);
    const d = defaultDB(); save(d); return d;
  }
}

function save(db){
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

const Store = {
  // ---------- Mchango (event) ----------
  getMchango(){ return load().mchango; },
  updateMchango(patch){
    const db = load();
    db.mchango = { ...db.mchango, ...patch };
    save(db);
    return db.mchango;
  },

  // ---------- Gharama (expenses) ----------
  listGharama(){ return load().gharama.slice().sort((a,b)=> (b.tarehe||'').localeCompare(a.tarehe||'')); },
  addGharama({ jina, kiasi, tarehe, maelezo }){
    const db = load();
    const item = { id: uid(), jina, kiasi: Number(kiasi)||0, tarehe: tarehe || new Date().toISOString().slice(0,10), maelezo: maelezo||'' };
    db.gharama.push(item);
    save(db);
    return item;
  },
  updateGharama(id, patch){
    const db = load();
    const i = db.gharama.findIndex(g=>g.id===id);
    if(i>-1){ db.gharama[i] = { ...db.gharama[i], ...patch, kiasi: patch.kiasi!==undefined ? Number(patch.kiasi)||0 : db.gharama[i].kiasi }; save(db); return db.gharama[i]; }
    return null;
  },
  deleteGharama(id){
    const db = load();
    db.gharama = db.gharama.filter(g=>g.id!==id);
    save(db);
  },
  totalGharama(){ return load().gharama.reduce((s,g)=> s+ (Number(g.kiasi)||0), 0); },

  // ---------- Washiriki (participants) ----------
  listWashiriki(){ return load().washiriki.slice().sort((a,b)=> a.jina.localeCompare(b.jina)); },
  addMshiriki({ jina, simu, kiasiKinachotarajiwa }){
    const db = load();
    const item = { id: uid(), jina, simu: simu||'', kiasiKinachotarajiwa: Number(kiasiKinachotarajiwa)||0 };
    db.washiriki.push(item);
    save(db);
    return item;
  },
  updateMshiriki(id, patch){
    const db = load();
    const i = db.washiriki.findIndex(w=>w.id===id);
    if(i>-1){ db.washiriki[i] = { ...db.washiriki[i], ...patch }; save(db); return db.washiriki[i]; }
    return null;
  },
  deleteMshiriki(id){
    const db = load();
    db.washiriki = db.washiriki.filter(w=>w.id!==id);
    db.malipo = db.malipo.filter(p=>p.mshirikiId!==id);
    save(db);
  },
  countWashiriki(){ return load().washiriki.length; },

  // ---------- Malipo (payments/contributions received) ----------
  listMalipo(){ return load().malipo.slice().sort((a,b)=> (b.tarehe||'').localeCompare(a.tarehe||'')); },
  addMalipo({ mshirikiId, kiasi, tarehe, njia, maelezo }){
    const db = load();
    const item = { id: uid(), mshirikiId, kiasi: Number(kiasi)||0, tarehe: tarehe || new Date().toISOString().slice(0,10), njia: njia||'Cash', maelezo: maelezo||'' };
    db.malipo.push(item);
    save(db);
    return item;
  },
  deleteMalipo(id){
    const db = load();
    db.malipo = db.malipo.filter(p=>p.id!==id);
    save(db);
  },
  totalMalipo(){ return load().malipo.reduce((s,p)=> s+ (Number(p.kiasi)||0), 0); },
  malipoYaMshiriki(mshirikiId){
    return load().malipo.filter(p=>p.mshirikiId===mshirikiId).reduce((s,p)=> s+(Number(p.kiasi)||0), 0);
  },

  // ---------- Mkeka (ledger view: kila mshiriki na alicholipa) ----------
  mkeka(){
    const db = load();
    return db.washiriki.map(w=>{
      const jumla = db.malipo.filter(p=>p.mshirikiId===w.id).reduce((s,p)=>s+(Number(p.kiasi)||0),0);
      const lengo = Number(w.kiasiKinachotarajiwa)||0;
      return {
        id: w.id, jina: w.jina, simu: w.simu,
        lengo, kiasi: jumla,
        amelipa: lengo>0 ? jumla >= lengo : jumla>0,
        salio: lengo>0 ? Math.max(lengo - jumla, 0) : 0
      };
    }).sort((a,b)=> a.jina.localeCompare(b.jina));
  },

  // ---------- Dashboard summary ----------
  summary(){
    const db = load();
    const gharamaZote = db.mchango.lengo && db.mchango.lengo>0
      ? db.mchango.lengo
      : db.gharama.reduce((s,g)=>s+(Number(g.kiasi)||0),0);
    const zilizokusanywa = db.malipo.reduce((s,p)=>s+(Number(p.kiasi)||0),0);
    const zilizobaki = Math.max(gharamaZote - zilizokusanywa, 0);
    const progress = gharamaZote>0 ? Math.min((zilizokusanywa/gharamaZote)*100, 100) : 0;
    return {
      jina: db.mchango.jina,
      gharamaZote, zilizokusanywa, zilizobaki,
      washiriki: db.washiriki.length,
      progress
    };
  },

  // ---------- Settings ----------
  getSettings(){ return load().settings; },
  updateSettings(patch){
    const db = load();
    db.settings = { ...db.settings, ...patch };
    save(db);
    return db.settings;
  },

  // ---------- Utilities ----------
  formatMoney(n){
    const s = load().settings;
    const val = Math.round(Number(n)||0);
    return s.sarafu + ' ' + val.toLocaleString('en-US');
  },
  exportAll(){ return load(); },
  clearAll(){ localStorage.removeItem(DB_KEY); },
  resetToDefault(){ const d = defaultDB(); save(d); return d; }
};

window.Store = Store;
