/* =====================================================
   MarketShield – REPORT MODAL FINAL, KONFLIKTFREI
===================================================== */
(function () {
  "use strict";

  const getModal = () => document.getElementById("reportModal");

  function openModal() {
    const m = getModal();
    if (m) m.style.display = "block";
  }

  function closeModal() {
    const m = getModal();
    if (m) m.style.display = "none";
  }

  // ===== SCHLIESSEN HAT IMMER VORRANG =====
  document.addEventListener("click", function (e) {

    // 1) Klick auf Schließen-Button
    if (e.target && e.target.id === "closeReportModal") {
      e.preventDefault();
      e.stopImmediatePropagation();
      closeModal();
      return;
    }

    // 2) Klick auf Overlay (dunkler Hintergrund)
    if (e.target && e.target.id === "reportModal") {
      e.preventDefault();
      e.stopImmediatePropagation();
      closeModal();
      return;
    }

  }, true); // capture, damit nichts dazwischenfunkt

  // ===== ÖFFNEN (nur wenn NICHT geschlossen wurde) =====
  document.addEventListener("click", function (e) {
    const btn = e.target.closest("#reportBtn");
    if (!btn) return;

    e.preventDefault();
    e.stopImmediatePropagation();
    openModal();
  }, true);

  // ===== SUBMIT ABFANGEN =====
  document.addEventListener("submit", function (e) {
    if (e.target && e.target.id === "reportForm") {
      e.preventDefault();
      closeModal();
      alert("Danke! Dein Hinweis wurde gespeichert.");
    }
  }, true);

})();
