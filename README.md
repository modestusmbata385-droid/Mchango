# MCHANGO

App ya kudhibiti michango (harusi, msiba, harambee, n.k.) — bila Login/Register. Ukifungua, unaingia moja kwa moja kwenye Dashboard.

```
MCHANGO
│
├── 🏠 Dashboard
├── ➕ Mchango Mpya
├── 💰 Gharama
├── 👥 Washiriki
├── 💳 Malipo
├── 📋 Mkeka
├── 📄 PDF Report
├── 📲 Share WhatsApp
└── ⚙️ Settings
```

## Muundo wa mradi

```
mchango/
├── frontend/          ← inafanya kazi peke yake, bila backend (localStorage)
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── storage.js   ← data layer (localStorage sasa; API baadaye)
│       ├── app.js        ← router + views zote
│       └── pdf.js         ← ripoti ya PDF (jsPDF)
└── backend/            ← API tayari, bado haijaunganishwa na frontend
    ├── server.js
    ├── db.js
    ├── migrate.js
    ├── schema.sql
    ├── package.json
    ├── .env.example
    └── routes/
        ├── mchango.js
        ├── gharama.js
        ├── washiriki.js
        ├── malipo.js
        └── settings.js
```

## 1) Kuendesha Frontend (sasa hivi, bila backend)

Frontend ni HTML/CSS/JS ya kawaida — hakuna build step, hakuna npm inayohitajika.

- Fungua tu `frontend/index.html` kwenye browser (double-click), **au**
- Kwenye VS Code, tumia extension ya "Live Server" bonyeza "Go Live", **au**
- Kwa terminal: `cd frontend && npx serve .`

Data yote (mchango, gharama, washiriki, malipo, settings) inahifadhiwa kwenye **localStorage** ya browser yako — hakuna internet inayohitajika isipokuwa kwa fonti (Google Fonts) na maktaba ya PDF (jsPDF) zinazopakiwa kutoka CDN.

## 2) Kuendesha Backend (kwa baadaye, ukishaunganisha)

Backend tayari ipo kamili (Node.js + Express + PostgreSQL) lakini frontend bado *haijaunganishwa* nayo — hii ni kwa makusudi, ili kwanza uone muonekano na hesabu zikifanya kazi kabla ya kuongeza database.

```bash
cd backend
cp .env.example .env     # kisha weka DATABASE_URL yako halisi
npm install
npm run migrate          # inaunda tables + mchango wa kwanza
npm start                # inaanzisha server kwenye http://localhost:3000
```

Angalia kama inafanya kazi: `GET http://localhost:3000/api/health`

### Endpoints kuu

| Method | Path | Maelezo |
|---|---|---|
| GET/PATCH | `/api/mchango/:id` | Taarifa za mchango |
| GET | `/api/mchango/:id/summary` | KPI za Dashboard |
| GET/POST | `/api/mchango/:id/gharama` | Orodha / ongeza gharama |
| PATCH/DELETE | `/api/gharama/:id` | Badilisha / futa gharama |
| GET/POST | `/api/mchango/:id/washiriki` | Orodha / ongeza mshiriki |
| PATCH/DELETE | `/api/washiriki/:id` | Badilisha / futa mshiriki |
| GET | `/api/mchango/:id/mkeka` | Mkeka (washiriki + walicholipa) |
| GET/POST | `/api/mchango/:id/malipo` | Orodha / rekodi malipo |
| DELETE | `/api/malipo/:id` | Futa malipo |
| GET/PATCH | `/api/mchango/:id/settings` | Sarafu, jina la msimamizi |

### Kuunganisha na frontend baadaye

Badilisha tu maudhui ya `frontend/js/storage.js` yaite `fetch()` kwa hizi endpoints badala ya `localStorage` — majina ya function (`Store.listGharama()`, `Store.addMalipo()`, n.k.) na muundo wa data yanabaki sawa, kwa hiyo `app.js` na `pdf.js` hazitahitaji kubadilika.

## 3) Ku-deploy Render (baadaye, kama Mbata Agent)

- **Backend**: unda Web Service mpya kwenye Render, ukielekeza kwa folder ya `backend/`, ongeza `DATABASE_URL` (Postgres ya Render) kama environment variable, `Start Command: npm start`.
- **Frontend**: unaweza kuu-deploy kama Static Site tofauti (root: `frontend/`), au — ukishakuwa tayari — uondoe comment kwenye mstari wa `express.static` ndani ya `server.js` na uhudumie frontend kutoka backend hiyo hiyo.
