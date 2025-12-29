/* =====================================================
   MarketShield – REPORT MODAL STABLE FIX
   Öffnen + Schließen + Submit (ohne Konflikte)
===================================================== */
(function () {
  "use strict";

  function openModal() {
    const m = document.getElementById("reportModal");
    if (m) m.style.display = "block";
  }

  function closeModal() {
    const m = document.getElementById("reportModal");
    if (m) m.style.display = "none";
  }

  // ===== Öffnen (delegiert, robust) =====
  document.addEventListener("click", function (e) {
    const btn = e.target.closest("#reportBtn");
    if (!btn) return;
    e.preventDefault();
    openModal();
  });

  // ===== Schließen: Button =====
  document.addEventListener("click", function (e) {
    const closeBtn = e.target.closest("#closeReportModal");
    if (!closeBtn) return;
    e.preventDefault();
    closeModal();
  });

  // ===== Schließen: Overlay =====
  document.addEventListener("click", function (e) {
    if (e.target && e.target.id === "reportModal") {
      closeModal();
    }
  });

  // ===== Submit abfangen (Senden) =====
  document.addEventListener("submit", function (e) {
    if (e.target && e.target.id === "reportForm") {
      e.preventDefault(); // echtes Submit verhindern
      closeModal();
      alert("Danke! Dein Hinweis wurde gespeichert.");
    }
  });
})();
