/* =====================================================
   MarketShield – Report Button HARD FIX
   Klick = Reaktion. Immer.
===================================================== */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    const reportBtn   = document.getElementById("reportBtn");
    const reportModal = document.getElementById("reportModal");
    const closeBtn    = document.getElementById("closeReportModal");

    if (!reportBtn) {
      console.warn("Report-Button nicht gefunden");
      return;
    }

    // 🔒 HARD BIND – kommt vor allen anderen Listenern
    reportBtn.addEventListener(
      "click",
      (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (reportModal) {
          reportModal.style.display = "block";
        } else {
          alert("Report-Button klickbar (Modal fehlt)");
        }
      },
      true // ← Capture-Phase (entscheidend!)
    );

    // Schließen-Button
    if (closeBtn && reportModal) {
      closeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        reportModal.style.display = "none";
      });
    }

    // Klick außerhalb schließt Modal
    if (reportModal) {
      reportModal.addEventListener("click", (e) => {
        if (e.target === reportModal) {
          reportModal.style.display = "none";
        }
      });
    }
  });
})();
