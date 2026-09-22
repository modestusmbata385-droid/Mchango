/* =========================================================
   MCHANGO — toa.js
   Public "give" page.
   No login, no admin nav.

   Anyone with this link can:
   - See contribution progress
   - See approved contributors
   - Submit their own contribution
   - Contribution goes in as "pending" until admin approves
   ========================================================= */

const mainEl = document.getElementById('toa-main');
const toastEl = document.getElementById('toast');

/* =========================================================
   HTML SECURITY
   ========================================================= */

function escapeHtml(str) {
  return String(str ?? '').replace(
    /[&<>"']/g,
    c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c])
  );
}

/* =========================================================
   TOAST MESSAGE
   ========================================================= */

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');

  clearTimeout(showToast._t);

  showToast._t = setTimeout(() => {
    toastEl.classList.remove('show');
  }, 2800);
}

/* =========================================================
   CONTRIBUTION FORM
   ========================================================= */

function formHtml() {
  return `
    <div class="card">
      <h3 style="margin-bottom:14px;">
        🤝 Toa Mchango Wako
      </h3>

      <form id="form-toa">

        <!-- NAME -->
        <div class="field">
          <label for="t-jina">
            Jina Lako
          </label>

          <input
            id="t-jina"
            type="text"
            required
            autocomplete="name"
            placeholder="Jina kamili"
          />
        </div>

        <!-- AMOUNT + PHONE -->
        <div class="form-row">

          <div class="field">
            <label for="t-kiasi">
              Kiasi Ulichotoa (TSh)
            </label>

            <!--
              step="1" is intentional.

              Previously:
              min="1" step="500"

              That made the browser calculate valid values as:
              1, 501, 1001, 1501 ... 4501, 5001

              Therefore 5000 was rejected.

              With step="1", values such as:
              5000
              5001
              10000
              10001
              are all valid.
            -->
            <input
              id="t-kiasi"
              type="number"
              min="1"
              step="1"
              required
              inputmode="numeric"
              autocomplete="off"
              placeholder="5000"
            />
          </div>

          <div class="field">
            <label for="t-simu">
              Namba ya Simu (hiari)
            </label>

            <input
              id="t-simu"
              type="tel"
              inputmode="tel"
              autocomplete="tel"
              placeholder="07XXXXXXXX"
            />
          </div>

        </div>

        <!-- PAYMENT METHOD -->
        <div class="field">
          <label for="t-njia">
            Ulitoa Kwa Njia Gani?
          </label>

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

        <!-- SUBMIT -->
        <button
          class="btn btn-primary btn-block"
          type="submit"
        >
          ✅ Nimetoa
        </button>

      </form>

      <p
        style="
          color:var(--paper-dim);
          font-size:12px;
          line-height:1.5;
          margin-top:12px;
        "
      >
        Baada ya kutuma, mchango wako utaonekana kwenye
        orodha ukiwa "Unasubiri" mpaka msimamizi athibitishe.
      </p>

    </div>
  `;
}

/* =========================================================
   LOAD PUBLIC CONTRIBUTION PAGE
   ========================================================= */

async function loadPage() {

  try {

    const [summary, givers] = await Promise.all([
      Store.summary(),
      Store.listMalipo('approved')
    ]);

    /* =====================================================
       PAGE CONTENT
       ===================================================== */

    mainEl.innerHTML = `

      <div class="hero">

        <div class="event-label">
          Mchango
        </div>

        <div class="event-name">
          ${escapeHtml(summary.jina)}
        </div>

        <!-- KPI -->
        <div class="kpi-grid">

          <div class="kpi maroon">
            <div class="kpi-label">
              🎯 Gharama Zote
            </div>

            <div class="kpi-value">
              ${Store.formatMoney(summary.gharamaZote)}
            </div>
          </div>


          <div class="kpi gold">
            <div class="kpi-label">
              💰 Zilizokusanywa
            </div>

            <div class="kpi-value">
              ${Store.formatMoney(summary.zilizokusanywa)}
            </div>
          </div>


          <div class="kpi">

            <div class="kpi-label">
              ⏳ Zilizobaki
            </div>

            <div class="kpi-value">
              ${Store.formatMoney(summary.zilizobaki)}
            </div>

          </div>


          <div class="kpi">

            <div class="kpi-label">
              👥 Waliotoa
            </div>

            <div class="kpi-value">
              ${givers.length}
            </div>

          </div>

        </div>


        <!-- PROGRESS -->
        <div class="progress-wrap">

          <div class="progress-labels">
            <span>Maendeleo</span>

            <strong>
              ${summary.progress.toFixed(1)}%
            </strong>
          </div>

          <div class="progress-track">

            <div
              class="progress-fill"
              style="width:${summary.progress.toFixed(1)}%"
            ></div>

          </div>

        </div>

      </div>


      <!-- CONTRIBUTION FORM -->
      <div style="margin-top:18px;">
        ${formHtml()}
      </div>


      <!-- CONTRIBUTORS -->
      <div class="section-title">
        Waliotoa Hivi Karibuni
      </div>


      ${
        givers.length
          ? `
            <div class="list">

              ${givers.slice(0, 25).map(g => `

                <div class="list-item">

                  <div class="li-main">

                    <div class="li-title">
                      ${escapeHtml(
                        g.mshirikiJina || 'Bila jina'
                      )}
                    </div>

                    <div class="li-sub">
                      ${escapeHtml(g.tarehe || '')}
                    </div>

                  </div>

                  <div class="li-amount gold">
                    ${Store.formatMoney(g.kiasi)}
                  </div>

                </div>

              `).join('')}

            </div>
          `
          : `
            <div class="empty-state">

              <span class="emoji">
                🤝
              </span>

              <p>
                Bado hakuna aliyetoa — uwe wa kwanza!
              </p>

            </div>
          `
      }

    `;


    /* =====================================================
       FORM SUBMISSION
       ===================================================== */

    const form = document.getElementById('form-toa');

    form.addEventListener('submit', async e => {

      e.preventDefault();

      const btn =
        e.target.querySelector(
          'button[type="submit"]'
        );

      const jinaInput =
        document.getElementById('t-jina');

      const kiasiInput =
        document.getElementById('t-kiasi');

      const simuInput =
        document.getElementById('t-simu');

      const njiaInput =
        document.getElementById('t-njia');


      /* ===================================================
         READ VALUES
         =================================================== */

      const jina =
        jinaInput.value.trim();

      const kiasi =
        Number(kiasiInput.value);

      const simu =
        simuInput.value.trim();

      const njia =
        njiaInput.value;


      /* ===================================================
         NAME VALIDATION
         =================================================== */

      if (!jina) {

        showToast(
          'Tafadhali weka jina lako.'
        );

        jinaInput.focus();

        return;
      }


      /* ===================================================
         AMOUNT VALIDATION
         =================================================== */

      if (
        !Number.isFinite(kiasi) ||
        kiasi <= 0
      ) {

        showToast(
          'Weka kiasi sahihi, mfano 5000.'
        );

        kiasiInput.focus();

        return;
      }


      /* ===================================================
         PREVENT DOUBLE SUBMISSION
         =================================================== */

      btn.disabled = true;

      const originalText =
        btn.innerHTML;

      btn.innerHTML =
        '⏳ Inatuma...';


      try {

        /* ================================================
           SEND CONTRIBUTION TO BACKEND
           ================================================ */

        await Store.submitToa({

          jina: jina,

          kiasi: kiasi,

          simu: simu,

          njia: njia

        });


        /* ================================================
           SUCCESS MESSAGE
           ================================================ */

        mainEl.innerHTML = `

          <div class="empty-state">

            <span class="emoji">
              ✅
            </span>

            <p>
              <strong>Asante!</strong>
              Mchango wako umepokelewa na
              unasubiri uthibitisho wa msimamizi.
              Utaonekana kwenye orodha mara
              utakapoidhinishwa.
            </p>

          </div>


          <button
            class="btn btn-outline btn-block"
            onclick="loadPage()"
            style="margin-top:14px;"
          >
            ⬅️ Rudi
          </button>

        `;

      } catch (err) {

        /* ================================================
           ERROR
           ================================================ */

        showToast(
          err.message ||
          'Imeshindwa kutuma. Jaribu tena.'
        );

        btn.disabled = false;

        btn.innerHTML =
          originalText;
      }

    });

  } catch (e) {

    /* ===================================================
       PAGE LOAD ERROR
       =================================================== */

    mainEl.innerHTML = `

      <div class="empty-state">

        <span class="emoji">
          ⚠️
        </span>

        <p>
          Imeshindikana kuunganisha na seva.
          Hakikisha una mtandao kisha jaribu tena.
        </p>

      </div>


      <button
        class="btn btn-outline btn-block"
        onclick="loadPage()"
        style="margin-top:10px;"
      >
        🔄 Jaribu Tena
      </button>

    `;

  }

}


/* =========================================================
   MAKE loadPage AVAILABLE GLOBALLY
   ========================================================= */

window.loadPage = loadPage;


/* =========================================================
   START PAGE
   ========================================================= */

window.addEventListener(
  'DOMContentLoaded',
  loadPage
);
