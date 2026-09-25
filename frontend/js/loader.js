/* =========================================================
   MCHANGO — GLOBAL LOADING SCREEN
   Does not modify existing pages or application logic.
========================================================= */

(function () {
  "use strict";

  // Prevent duplicate loader
  if (document.getElementById("mchango-loader")) return;

  // Create loader
  const loader = document.createElement("div");
  loader.id = "mchango-loader";

  loader.innerHTML = `
    <div class="mchango-loader-content">
      <div class="mchango-loader-logo">MCHANGO</div>
      <div class="mchango-loader-line"></div>
    </div>
  `;

  document.body.appendChild(loader);

  // Hide loader when page finishes loading
  window.addEventListener("load", function () {
    setTimeout(function () {
      loader.classList.add("mchango-loader-hidden");

      setTimeout(function () {
        loader.remove();
      }, 500);

    }, 700);
  });

})();
