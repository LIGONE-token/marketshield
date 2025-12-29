/* =====================================================
   MarketShield – REPORT MODAL FINAL (OPEN + CLOSE)
===================================================== */
(function () {
  "use strict";

  function getModal() {
    return document.getElementById("reportModal");
  }

  function openModal() {
    const modal = getModal();
    if (modal) modal.classList.add("open");
  }

  function closeModal() {
    const modal = getModal();
    if (modal) modal.classList.remove("open");
  }

  // ===== Öffnen =====
  document.addEventListener("click", function (e) {
    const btn = e.target.closest("#reportBtn");
    if (!btn) return;

    e.preventDefault();
    openModal();
  });

  // ===== Schließen (Button + Overlay) =====
  document.addEventListener("click", function (e) {
    if (
      e.target.id === "closeReportModal" ||
      e.target.id === "reportModal"
    ) {
      e.preventDefault();
      closeModal();
    }
  });

  // ===== Submit =====
  document.addEventListener("submit", function (e) {
    if (e.target.id === "reportForm") {
      e.preventDefault();
      closeModal();
      alert("Danke! Dein Hinweis wurde gespeichert.");
    }
  });

  // ===== Sicherheit: bei Navigation schließen =====
  window.addEventListener("popstate", closeModal);
})();
