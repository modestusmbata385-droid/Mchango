/* =========================================================
   MCHANGO — app.js
   Hash-router SPA, no login/register — opens straight to
   Dashboard. All data comes from Store (js/storage.js).
   ========================================================= */

const NAV_ITEMS = [
  { route: 'dashboard',   emoji: '🏠', label: 'Dashboard' },
  { route: 'mchango-mpya',emoji: '➕', label: 'Mchango Mpya' },
  { route: 'gharama',     emoji: '💰', label: 'Gharama' },
  { route: 'washiriki',   emoji: '👥', label: 'Washiriki' },
  { route: 'malipo',      emoji: '💳', label: 'Malipo' },
  { route: 'mkeka',       emoji: '📋', label: 'Mkeka' },
  { route: 'pdf',         emoji: '📄', label: 'PDF Report' },
  { route: 'whatsapp',    emoji: '📲', label: 'Share WhatsApp' },
  { route: 'settings',    emoji: '⚙️', label: 'Settings' },
];

const ACTION_ROUTES = new Set(['pdf', 'whatsapp']); // these don't render a page, they just run

const appEl = document.getElementById('app-main');
const drawerEl = document.getElementById('drawer');
const scrimEl = document.getElementById('scrim');
const drawerNavEl = document.getElementById('drawer-nav');
const drawerEventEl = document.getElementById('drawer-event');
const toastEl = document.getElementById('toast');

let modalResolver = null;

/* ---------------- helpers ---------------- */

function escapeHtml(str){
  return String(str ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function showToast(msg){
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=> toastEl.classList.remove('show'), 2400);
}

function openDrawer(){ drawerEl.classList.add('open'); scrimEl.classList.add('open'); }
function closeDrawer(){ drawerEl.classList.remove('open'); scrimEl.classList.remove('open'); }

function confirmModal(title, body){
  return new Promise(resolve=>{
    const scrim = document.getElementById('modal-scrim');
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').textContent = body;
    scrim.classList.add('open');
    modalResolver = resolve;
  });
}
function closeModal(result){
  document.getElementById('modal-scrim').classList.remove('open');
  if(modalResolver){ modalResolver(result); modalResolver = null; }
}

function navigate(route){
  window.location.hash = '#/' + route;
}

/* ---------------- drawer render ---------------- */

function renderDrawer(activeRoute){
  const m = Store.getMchango();
  drawerEventEl.textContent = m.jina;
  drawerNavEl.innerHTML = NAV_ITEMS.map(item => `
    <a href="#/${item.route}" data-route="${item.route}" class="${item.route===activeRoute ? 'active' : ''}">
      <span class="emoji">${item.emoji}</span><span>${escapeHtml(item.label)}</span>
    </a>
  `).join('');
}

/* ---------------- views ---------------- */

function viewDashboard(){
  const s = Store.summary();
  return `
    <div class="hero">
      <div class="event-label">Mchango</div>
      <div class="event-name">${escapeHtml(s.jina)}</div>

      <div class="kpi-grid">
        <div class="kpi maroon">
          <div class="kpi-label">🎯 Gharama Zote</div>
          <div class="kpi-value">${Store.formatMoney(s.gharamaZote)}</div>
        </div>
        <div class="kpi gold">
          <div class="kpi-label">💰 Zilizokusanywa</div>
          <div class="kpi-value">${Store.formatMoney(s.zilizokusanywa)}</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">⏳ Zilizobaki</div>
          <div class="kpi-value">${Store.formatMoney(s.zilizobaki)}</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">👥 Washiriki</div>
          <div class="kpi-value">${s.washiriki}</div>
        </div>
      </div>

      <div class="progress-wrap">
        <div class="progress-labels"><span>Maendeleo</span><strong>${s.progress.toFixed(1)}%</strong></div>
        <div class="progress-track"><div class="progress-fill" style="width:${s.progress.toFixed(1)}%"></div></div>
      </div>
    </div>

    <div class="action-grid">
      <a class="action-btn primary" href="#/gharama"><span class="emoji">➕</span><span class="label">Ongeza Gharama</span></a>
      <a class="action-btn" href="#/washiriki"><span class="emoji">👥</span><span class="label">Washiriki</span></a>
      <a class="action-btn" href="#/malipo"><span class="emoji">💳</span><span class="label">Malipo</span></a>
      <a class="action-btn" href="#/mkeka"><span class="emoji">📋</span><span class="label">Mkeka</span></a>
      <a class="action-btn" id="dash-pdf" href="#/pdf"><span class="emoji">📄</span><span class="label">PDF Report</span></a>
      <a class="action-btn" id="dash-wa" href="#/whatsapp"><span class="emoji">📲</span><span class="label">WhatsApp</span></a>
    </div>
  `;
}

function viewMchangoMpya(){
  const m = Store.getMchango();
  return `
    <div class="page-head"><h1>Mchango Mpya</h1></div>
    <div class="card">
      <p style="color:var(--paper-dim);font-size:13.5px;line-height:1.5;margin-bottom:18px;">
        Weka jina la mchango na lengo la gharama zote. Ukiacha lengo tupu, Gharama Zote itahesabiwa moja kwa moja kutoka orodha ya Gharama.
      </p>
      <form id="form-mchango">
        <div class="field">
          <label for="f-jina">Jina la Mchango</label>
          <input id="f-jina" type="text" required value="${escapeHtml(m.jina)}" placeholder="Mfano: Mchango wa Harusi" />
        </div>
        <div class="form-row">
          <div class="field">
            <label for="f-tarehe">Tarehe ya Tukio</label>
            <input id="f-tarehe" type="date" value="${escapeHtml(m.tarehe)}" />
          </div>
          <div class="field">
            <label for="f-lengo">Lengo la Gharama Zote (TSh)</label>
            <input id="f-lengo" type="number" min="0" step="1000" value="${m.lengo || ''}" placeholder="Hiari" />
          </div>
        </div>
        <button class="btn btn-primary btn-block" type="submit">Hifadhi Mchango</button>
      </form>
    </div>
  `;
}

function viewGharama(){
  const items = Store.listGharama();
  const total = Store.totalGharama();
  return `
    <div class="page-head"><h1>Gharama</h1><span class="count">${items.length} vipengele</span></div>

    <div class="card">
      <form id="form-gharama">
        <div class="field">
          <label for="g-jina">Kipengele cha Gharama</label>
          <input id="g-jina" type="text" required placeholder="Mfano: Chakula, Tent, Muziki" />
        </div>
        <div class="form-row">
          <div class="field">
            <label for="g-kiasi">Kiasi (TSh)</label>
            <input id="g-kiasi" type="number" min="0" step="1000" required placeholder="0" />
          </div>
          <div class="field">
            <label for="g-tarehe">Tarehe</label>
            <input id="g-tarehe" type="date" value="${new Date().toISOString().slice(0,10)}" />
          </div>
        </div>
        <div class="field">
          <label for="g-maelezo">Maelezo (hiari)</label>
          <input id="g-maelezo" type="text" placeholder="Maelezo mafupi" />
        </div>
        <button class="btn btn-primary btn-block" type="submit">➕ Ongeza Gharama</button>
      </form>
    </div>

    <div class="summary-strip">
      <div class="summary-chip"><div class="n">${Store.formatMoney(total)}</div><div class="l">Jumla ya Gharama</div></div>
    </div>

    <div class="section-title">Orodha ya Gharama</div>
    ${items.length ? `<div class="list">${items.map(g => `
      <div class="list-item" data-id="${g.id}">
        <div class="li-main">
          <div class="li-title">${escapeHtml(g.jina)}</div>
          <div class="li-sub">${escapeHtml(g.tarehe || '')}${g.maelezo ? ' · ' + escapeHtml(g.maelezo) : ''}</div>
        </div>
        <div class="li-amount maroon">${Store.formatMoney(g.kiasi)}</div>
        <div class="li-actions"><button class="li-icon btn-del-gharama" title="Futa">✕</button></div>
      </div>
    `).join('')}</div>` : emptyState('🧾', 'Hakuna gharama bado. Ongeza gharama ya kwanza hapo juu.')}
  `;
}

function viewWashiriki(){
  const items = Store.listWashiriki();
  return `
    <div class="page-head"><h1>Washiriki</h1><span class="count">${items.length} watu</span></div>

    <div class="card">
      <form id="form-mshiriki">
        <div class="field">
          <label for="w-jina">Jina la Mshiriki</label>
          <input id="w-jina" type="text" required placeholder="Jina kamili" />
        </div>
        <div class="form-row">
          <div class="field">
            <label for="w-simu">Namba ya Simu (hiari)</label>
            <input id="w-simu" type="tel" placeholder="07XXXXXXXX" />
          </div>
          <div class="field">
            <label for="w-lengo">Anachotarajiwa Kuchangia (hiari)</label>
            <input id="w-lengo" type="number" min="0" step="1000" placeholder="0" />
          </div>
        </div>
        <button class="btn btn-primary btn-block" type="submit">➕ Ongeza Mshiriki</button>
      </form>
    </div>

    <div class="section-title">Orodha ya Washiriki</div>
    ${items.length ? `<div class="list">${items.map(w => {
      const jumla = Store.malipoYaMshiriki(w.id);
      return `
      <div class="list-item" data-id="${w.id}">
        <div class="li-main">
          <div class="li-title">${escapeHtml(w.jina)}</div>
          <div class="li-sub">${w.simu ? escapeHtml(w.simu) : 'Hakuna namba'} · Amelipa ${Store.formatMoney(jumla)}</div>
        </div>
        <div class="li-actions"><button class="li-icon btn-del-mshiriki" title="Futa">✕</button></div>
      </div>
    `; }).join('')}</div>` : emptyState('👥', 'Bado hakuna washiriki. Waongeze hapo juu ili uweze kufuatilia malipo yao.')}
  `;
}

function viewMalipo(){
  const washiriki = Store.listWashiriki();
  const items = Store.listMalipo();
  const total = Store.totalMalipo();
  const nameOf = id => (washiriki.find(w=>w.id===id) || {}).jina || 'Mshiriki aliyeondolewa';

  if(!washiriki.length){
    return `
      <div class="page-head"><h1>Malipo</h1></div>
      ${emptyState('💳', 'Ongeza washiriki kwanza kabla ya kurekodi malipo yao.')}
      <a class="btn btn-primary btn-block" href="#/washiriki" style="margin-top:14px;">👥 Nenda Washiriki</a>
    `;
  }

  return `
    <div class="page-head"><h1>Malipo</h1><span class="count">${items.length} malipo</span></div>

    <div class="card">
      <form id="form-malipo">
        <div class="field">
          <label for="p-mshiriki">Mshiriki</label>
          <select id="p-mshiriki" required>
            ${washiriki.map(w => `<option value="${w.id}">${escapeHtml(w.jina)}</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <div class="field">
            <label for="p-kiasi">Kiasi Alicholipa (TSh)</label>
            <input id="p-kiasi" type="number" min="0" step="500" required placeholder="0" />
          </div>
          <div class="field">
            <label for="p-tarehe">Tarehe</label>
            <input id="p-tarehe" type="date" value="${new Date().toISOString().slice(0,10)}" />
          </div>
        </div>
        <div class="field">
          <label for="p-njia">Njia ya Malipo</label>
          <select id="p-njia">
            <option>Cash</option>
            <option>M-Pesa</option>
            <option>Tigo Pesa</option>
            <option>Airtel Money</option>
            <option>Halo Pesa</option>
            <option>Benki</option>
            <option>Nyingine</option>
          </select>
        </div>
        <button class="btn btn-primary btn-block" type="submit">💳 Rekodi Malipo</button>
      </form>
    </div>

    <div class="summary-strip">
      <div class="summary-chip"><div class="n">${Store.formatMoney(total)}</div><div class="l">Jumla Iliyokusanywa</div></div>
    </div>

    <div class="section-title">Historia ya Malipo</div>
    ${items.length ? `<div class="list">${items.map(p => `
      <div class="list-item" data-id="${p.id}">
        <div class="li-main">
          <div class="li-title">${escapeHtml(nameOf(p.mshirikiId))}</div>
          <div class="li-sub">${escapeHtml(p.tarehe||'')} · ${escapeHtml(p.njia||'')}</div>
        </div>
        <div class="li-amount gold">${Store.formatMoney(p.kiasi)}</div>
        <div class="li-actions"><button class="li-icon btn-del-malipo" title="Futa">✕</button></div>
      </div>
    `).join('')}</div>` : emptyState('💳', 'Bado hakuna malipo yaliyorekodiwa.')}
  `;
}

function viewMkeka(){
  const rows = Store.mkeka();
  const total = Store.totalMalipo();
  return `
    <div class="page-head"><h1>Mkeka</h1><span class="count">${rows.length} washiriki</span></div>
    <p style="color:var(--paper-dim);font-size:13px;line-height:1.5;margin-bottom:16px;">
      Orodha kamili ya washiriki na michango yao — kama mkeka wa jadi wa harusi.
    </p>
    ${rows.length ? `
    <div class="card" style="overflow-x:auto;padding:8px 10px;">
      <table class="mkeka-table">
        <thead><tr><th>Jina</th><th>Simu</th><th>Kiasi</th><th>Hali</th></tr></thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              <td>${escapeHtml(r.jina)}</td>
              <td>${r.simu ? escapeHtml(r.simu) : '—'}</td>
              <td>${Store.formatMoney(r.kiasi)}</td>
              <td class="${r.amelipa ? 'paid' : 'unpaid'}">${r.amelipa ? 'Kamili' : (r.kiasi>0 ? 'Sehemu' : 'Bado')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <div class="summary-strip">
      <div class="summary-chip"><div class="n">${Store.formatMoney(total)}</div><div class="l">Jumla Kwenye Mkeka</div></div>
    </div>
    ` : emptyState('📋', 'Ongeza washiriki na malipo ili mkeka uonekane hapa.')}
  `;
}

function viewSettings(){
  const s = Store.getSettings();
  return `
    <div class="page-head"><h1>Settings</h1></div>
    <div class="card">
      <form id="form-settings">
        <div class="field">
          <label for="s-sarafu">Alama ya Sarafu</label>
          <input id="s-sarafu" type="text" value="${escapeHtml(s.sarafu)}" maxlength="6" />
        </div>
        <div class="field">
          <label for="s-msimamizi">Jina la Msimamizi (kwa PDF/WhatsApp)</label>
          <input id="s-msimamizi" type="text" value="${escapeHtml(s.mchangoWasii)}" placeholder="Hiari" />
        </div>
        <button class="btn btn-primary btn-block" type="submit">Hifadhi Settings</button>
      </form>
    </div>

    <div class="section-title">Data</div>
    <div class="card">
      <p style="color:var(--paper-dim);font-size:13px;line-height:1.6;margin-bottom:16px;">
        Data yote inahifadhiwa kwenye kifaa chako (localStorage). Baadaye itaunganishwa na PostgreSQL bila kubadilisha muonekano huu.
      </p>
      <button class="btn btn-danger btn-block" id="btn-clear-data">🗑️ Futa Data Yote</button>
    </div>
  `;
}

function emptyState(emoji, text){
  return `<div class="empty-state"><span class="emoji">${emoji}</span><p>${escapeHtml(text)}</p></div>`;
}

/* ---------------- actions (no dedicated page) ---------------- */

function runWhatsAppShare(){
  const s = Store.summary();
  const settings = Store.getSettings();
  const lines = [
    `*MCHANGO — ${s.jina}*`,
    ``,
    `🎯 Gharama Zote: ${Store.formatMoney(s.gharamaZote)}`,
    `💰 Zilizokusanywa: ${Store.formatMoney(s.zilizokusanywa)}`,
    `⏳ Zilizobaki: ${Store.formatMoney(s.zilizobaki)}`,
    `👥 Washiriki: ${s.washiriki}`,
    `📊 Maendeleo: ${s.progress.toFixed(1)}%`,
  ];
  if(settings.mchangoWasii) lines.push(``, `_Imetumwa na ${settings.mchangoWasii}_`);
  const text = encodeURIComponent(lines.join('\n'));
  window.open(`https://wa.me/?text=${text}`, '_blank');
}

/* ---------------- router ---------------- */

function currentRoute(){
  const h = window.location.hash.replace('#/', '').trim();
  return h || 'dashboard';
}

function render(){
  let route = currentRoute();

  if(ACTION_ROUTES.has(route)){
    if(route === 'pdf') generatePDFReport();
    if(route === 'whatsapp') runWhatsAppShare();
    // go back to dashboard visually after firing the action
    window.location.hash = '#/dashboard';
    return;
  }

  const known = NAV_ITEMS.some(i => i.route === route) ? route : 'dashboard';
  renderDrawer(known);
  closeDrawer();

  const map = {
    dashboard: viewDashboard,
    'mchango-mpya': viewMchangoMpya,
    gharama: viewGharama,
    washiriki: viewWashiriki,
    malipo: viewMalipo,
    mkeka: viewMkeka,
    settings: viewSettings,
  };
  appEl.innerHTML = map[known]();
  attachHandlers(known);
  appEl.scrollTop = 0;
  window.scrollTo(0,0);
}

/* ---------------- form / list handlers per view ---------------- */

function attachHandlers(route){
  if(route === 'mchango-mpya'){
    document.getElementById('form-mchango').addEventListener('submit', e=>{
      e.preventDefault();
      Store.updateMchango({
        jina: document.getElementById('f-jina').value.trim() || 'Mchango',
        tarehe: document.getElementById('f-tarehe').value,
        lengo: Number(document.getElementById('f-lengo').value) || 0
      });
      showToast('Mchango umehifadhiwa');
      navigate('dashboard');
    });
  }

  if(route === 'gharama'){
    document.getElementById('form-gharama').addEventListener('submit', e=>{
      e.preventDefault();
      Store.addGharama({
        jina: document.getElementById('g-jina').value.trim(),
        kiasi: document.getElementById('g-kiasi').value,
        tarehe: document.getElementById('g-tarehe').value,
        maelezo: document.getElementById('g-maelezo').value.trim()
      });
      showToast('Gharama imeongezwa');
      render();
    });
    appEl.querySelectorAll('.btn-del-gharama').forEach(btn=>{
      btn.addEventListener('click', async e=>{
        const id = e.target.closest('.list-item').dataset.id;
        const ok = await confirmModal('Futa Gharama', 'Una uhakika unataka kufuta gharama hii?');
        if(ok){ Store.deleteGharama(id); showToast('Gharama imefutwa'); render(); }
      });
    });
  }

  if(route === 'washiriki'){
    document.getElementById('form-mshiriki').addEventListener('submit', e=>{
      e.preventDefault();
      Store.addMshiriki({
        jina: document.getElementById('w-jina').value.trim(),
        simu: document.getElementById('w-simu').value.trim(),
        kiasiKinachotarajiwa: document.getElementById('w-lengo').value
      });
      showToast('Mshiriki ameongezwa');
      render();
    });
    appEl.querySelectorAll('.btn-del-mshiriki').forEach(btn=>{
      btn.addEventListener('click', async e=>{
        const id = e.target.closest('.list-item').dataset.id;
        const ok = await confirmModal('Futa Mshiriki', 'Kufuta mshiriki huyu kutafuta pia malipo yake yote. Endelea?');
        if(ok){ Store.deleteMshiriki(id); showToast('Mshiriki amefutwa'); render(); }
      });
    });
  }

  if(route === 'malipo'){
    const form = document.getElementById('form-malipo');
    if(form) form.addEventListener('submit', e=>{
      e.preventDefault();
      Store.addMalipo({
        mshirikiId: document.getElementById('p-mshiriki').value,
        kiasi: document.getElementById('p-kiasi').value,
        tarehe: document.getElementById('p-tarehe').value,
        njia: document.getElementById('p-njia').value
      });
      showToast('Malipo yamerekodiwa');
      render();
    });
    appEl.querySelectorAll('.btn-del-malipo').forEach(btn=>{
      btn.addEventListener('click', async e=>{
        const id = e.target.closest('.list-item').dataset.id;
        const ok = await confirmModal('Futa Malipo', 'Una uhakika unataka kufuta malipo haya?');
        if(ok){ Store.deleteMalipo(id); showToast('Malipo yamefutwa'); render(); }
      });
    });
  }

  if(route === 'settings'){
    document.getElementById('form-settings').addEventListener('submit', e=>{
      e.preventDefault();
      Store.updateSettings({
        sarafu: document.getElementById('s-sarafu').value.trim() || 'TSh',
        mchangoWasii: document.getElementById('s-msimamizi').value.trim()
      });
      showToast('Settings zimehifadhiwa');
      render();
    });
    document.getElementById('btn-clear-data').addEventListener('click', async ()=>{
      const ok = await confirmModal('Futa Data Yote', 'Hatua hii haiwezi kutengulika. Data yote ya mchango, gharama, washiriki na malipo itafutwa. Endelea?');
      if(ok){ Store.clearAll(); showToast('Data yote imefutwa'); navigate('dashboard'); render(); }
    });
  }
}

/* ---------------- global chrome ---------------- */

document.getElementById('btn-menu').addEventListener('click', openDrawer);
document.getElementById('btn-drawer-close').addEventListener('click', closeDrawer);
scrimEl.addEventListener('click', closeDrawer);
drawerNavEl.addEventListener('click', e=>{
  const a = e.target.closest('a[data-route]');
  if(a) closeDrawer();
});

document.getElementById('modal-cancel').addEventListener('click', ()=> closeModal(false));
document.getElementById('modal-confirm').addEventListener('click', ()=> closeModal(true));
document.getElementById('modal-scrim').addEventListener('click', e=>{
  if(e.target.id === 'modal-scrim') closeModal(false);
});

window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', render);
