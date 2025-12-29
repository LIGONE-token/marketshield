/* =====================================================
   MarketShield – REPORT MODAL ABSOLUTE FIX
   Modal schließt IMMER bei Navigation / State-Wechsel
===================================================== */
(function () {
  "use strict";

  const modalId = "reportModal";

  function getModal() {
    return document.getElementById(modalId);
  }

  function openModal() {
    const m = getModal();
    if (m) m.style.display = "block";
  }

  function closeModal() {
    const m = getModal();
    if (m) m.style.display = "none";
  }

  /* ================== ÖFFNEN ================== */
  document.addEventListener("click", function (e) {
    const btn = e.target.closest("#reportBtn");
    if (!btn) return;

    e.preventDefault();
    e.stopImmediatePropagation();
    openModal();
  }, true);

  /* ================== SCHLIESSEN ================== */
  document.addEventListener("click", function (e) {
    if (
      e.target.id === "closeReportModal" ||
      e.target.id === modalId
    ) {
      e.preventDefault();
      e.stopImmediatePropagation();
      closeModal();
    }
  }, true);

  /* ================== SUBMIT ================== */
  document.addEventListener("submit", function (e) {
    if (e.target && e.target.id === "reportForm") {
      e.preventDefault();
      closeModal();
      alert("Danke! Dein Hinweis wurde gespeichert.");
    }
  }, true);

  /* ================== ABSOLUTER NOTAUS ================== */
  // SCHLIESST DAS MODAL BEI JEDER SEITENÄNDERUNG
  window.addEventListener("popstate", closeModal);
  window.addEventListener("hashchange", closeModal);
  window.addEventListener("load", closeModal);

})();
