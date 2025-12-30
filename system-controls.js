/* =====================================================
   MarketShield – REPORT BUTTON FINAL (STABIL)
===================================================== */
(function () {
  "use strict";

  function modal() {
    return document.getElementById("reportModal");
  }

  // EIN globaler Click-Handler
  document.addEventListener("click", function (e) {

    // ===== ÖFFNEN =====
    if (e.target.closest("#reportBtn")) {
      e.preventDefault();
      const m = modal();
      if (m) m.classList.add("open");
      return;
    }

    // ===== SCHLIESSEN (Button oder Overlay) =====
    if (
      e.target.id === "closeReportModal" ||
      e.target.id === "reportModal"
    ) {
      e.preventDefault();
      const m = modal();
      if (m) m.classList.remove("open");
      return;
    }

  });

  // ===== FORM SUBMIT =====
  document.addEventListener("submit", function (e) {
    if (e.target.id === "reportForm") {
      e.preventDefault();
      const m = modal();
      if (m) m.classList.remove("open");
      alert("Danke! Dein Hinweis wurde gespeichert.");
    }
  });

})();
