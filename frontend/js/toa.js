/* =========================================================
   MCHANGO — toa.js
   Public "give" page. No login, no admin nav — anyone with
   this link can see progress + who has given, and submit
   their own contribution (goes in as 'pending' until the
   admin approves it from the main app's Maombi page).
   ========================================================= */

const mainEl = document.getElementById('toa-main');
const toastEl = document.getElementById('toast');

function escapeHtml(str){
  return String(str ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function showToast(msg){
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=> toastEl.classList.remove('show'), 2800);
}

function formHtml(){
  return `
    <div class="card">
      <h3 style="margin-bottom:14px;">🤝 Toa Mchango Wako</h3>
      <form id="form-toa">
        <div class="field">
          <label for="t-jina">Jina Lako</label>
          <input id="t-jina" type="text" required placeholder="Jina kamili" />
        </div>
        <div class="form-row">
          <div class="field">
            <label for="t-kiasi">Kiasi Ulichotoa (TSh)</label>
            <input id="t-kiasi" type="number" min="1" step="500" required placeholder="0" />
          </div>
          <div class="field">
            <label for="t-simu">Namba ya Simu (hiari)</label>
            <input id="t-simu" type="tel" placeholder="07XXXXXXXX" />
          </div>
        </div>
        <div class="field">
          <label for="t-njia">Ulitoa Kwa Njia Gani?</label>
          <select id="t-njia">
            <option>M-Pesa</option>
            <option>Tigo Pesa</option>
            <option>Airtel Money</option>
            <option>Halo Pesa</option>
            <option>Cash</option>
            <option>Benki</option>
            <option>Nyingine</option>
          </select>
        </div>
        <button class="btn btn-primary btn-block" type="submit">✅ Nimetoa</button>
      </form>
      <p style="color:var(--paper-dim);font-size:12px;line-height:1.5;margin-top:12px;">
        Baada ya kutuma, mchango wako utaonekana kwenye orodha ukiwa "Unasubiri" mpaka msimamizi athibitishe.
      </p>
    </div>
  `;
}

async function loadPage(){
  try{
    const [summary, givers] = await Promise.all([
      Store.summary(),
      Store.listMalipo('approved')
    ]);

    mainEl.innerHTML = `
      <div class="hero">
        <div class="event-label">Mchango</div>
        <div class="event-name">${escapeHtml(summary.jina)}</div>

        <div class="kpi-grid">
          <div class="kpi maroon">
            <div class="kpi-label">🎯 Gharama Zote</div>
            <div class="kpi-value">${Store.formatMoney(summary.gharamaZote)}</div>
          </div>
          <div class="kpi gold">
            <div class="kpi-label">💰 Zilizokusanywa</div>
            <div class="kpi-value">${Store.formatMoney(summary.zilizokusanywa)}</div>
          </div>
          <div class="kpi">
            <div class="kpi-label">⏳ Zilizobaki</div>
            <div class="kpi-value">${Store.formatMoney(summary.zilizobaki)}</div>
          </div>
          <div class="kpi">
            <div class="kpi-label">👥 Waliotoa</div>
            <div class="kpi-value">${givers.length}</div>
          </div>
        </div>

        <div class="progress-wrap">
          <div class="progress-labels"><span>Maendeleo</span><strong>${summary.progress.toFixed(1)}%</strong></div>
          <div class="progress-track"><div class="progress-fill" style="width:${summary.progress.toFixed(1)}%"></div></div>
        </div>
      </div>

      <div style="margin-top:18px;">${formHtml()}</div>

      <div class="section-title">Waliotoa Hivi Karibuni</div>
      ${givers.length ? `<div class="list">${givers.slice(0,25).map(g => `
        <div class="list-item">
          <div class="li-main">
            <div class="li-title">${escapeHtml(g.mshirikiJina || 'Bila jina')}</div>
            <div class="li-sub">${escapeHtml(g.tarehe||'')}</div>
          </div>
          <div class="li-amount gold">${Store.formatMoney(g.kiasi)}</div>
        </div>
      `).join('')}</div>` : `<div class="empty-state"><span class="emoji">🤝</span><p>Bado hakuna aliyetoa — uwe wa kwanza!</p></div>`}
    `;

    document.getElementById('form-toa').addEventListener('submit', async e=>{
      e.preventDefault();
      const btn = e.target.querySelector('button[type="submit"]');
      btn.disabled = true;
      try{
        await Store.submitToa({
          jina: document.getElementById('t-jina').value.trim(),
          kiasi: document.getElementById('t-kiasi').value,
          simu: document.getElementById('t-simu').value.trim(),
          njia: document.getElementById('t-njia').value
        });
        mainEl.innerHTML = `
          <div class="empty-state">
            <span class="emoji">✅</span>
            <p><strong>Asante!</strong> Mchango wako umepokelewa na unasubiri uthibitisho wa msimamizi. Utaonekana kwenye orodha mara utakapoidhinishwa.</p>
          </div>
          <button class="btn btn-outline btn-block" onclick="loadPage()" style="margin-top:14px;">⬅️ Rudi</button>
        `;
      }catch(err){
        showToast(err.message || 'Imeshindwa kutuma. Jaribu tena.');
        btn.disabled = false;
      }
    });
  }catch(e){
    mainEl.innerHTML = `<div class="empty-state"><span class="emoji">⚠️</span><p>Imeshindikana kuunganisha na seva. Hakikisha una mtandao kisha jaribu tena.</p></div>
      <button class="btn btn-outline btn-block" onclick="loadPage()" style="margin-top:10px;">🔄 Jaribu Tena</button>`;
  }
}
window.loadPage = loadPage;

window.addEventListener('DOMContentLoaded', loadPage);
