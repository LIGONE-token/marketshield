/* =====================================================
   MarketShield – REPORT BUTTON FINAL FIX
   Event Delegation – nicht zerstörbar
===================================================== */
(function () {
  "use strict";

  // GLOBALER Klick-Fänger (überlebt jedes Re-Render)
  document.addEventListener("click", function (e) {
    const btn = e.target.closest("#reportBtn");
    if (!btn) return;

    e.preventDefault();
    e.stopPropagation();

    const modal = document.getElementById("reportModal");
    if (!modal) {
      alert("Report-Modal nicht gefunden – Button lebt.");
      return;
    }

    modal.style.display = "block";
  }, true); // capture-phase

  // Schließen
  document.addEventListener("click", function (e) {
    if (e.target.id === "closeReportModal") {
      e.preventDefault();
      const modal = document.getElementById("reportModal");
      if (modal) modal.style.display = "none";
    }
    if (e.target.id === "reportModal") {
      const modal = document.getElementById("reportModal");
      if (modal) modal.style.display = "none";
    }
  });
})();
