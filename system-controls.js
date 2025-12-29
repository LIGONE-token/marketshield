/* =====================================================
   MarketShield – REPORT MODAL FINAL BEHAVIOR
   Öffnen + Schließen + Submit abfangen
===================================================== */
(function () {
  "use strict";

  // ===== Öffnen (Event Delegation – stabil) =====
  document.addEventListener("click", function (e) {
    const btn = e.target.closest("#reportBtn");
    if (!btn) return;

    e.preventDefault();
    e.stopPropagation();

    const modal = document.getElementById("reportModal");
    if (modal) modal.style.display = "block";
  }, true);

  // ===== Schließen per Button =====
  document.addEventListener("click", function (e) {
    if (e.target.id === "closeReportModal") {
      e.preventDefault();
      const modal = document.getElementById("reportModal");
      if (modal) modal.style.display = "none";
    }
  }, true);

  // ===== Schließen bei Klick auf Overlay =====
  document.addEventListener("click", function (e) {
    if (e.target.id === "reportModal") {
      const modal = document.getElementById("reportModal");
      if (modal) modal.style.display = "none";
    }
  }, true);

  // ===== FORMULAR ABFANGEN (Senden) =====
  document.addEventListener("submit", function (e) {
    const form = e.target;
    if (!form || form.id !== "reportForm") return;

    e.preventDefault(); // ⛔ echtes Submit verhindern

    // 👉 HIER könntest du später Daten speichern / senden

    // Modal schließen
    const modal = document.getElementById("reportModal");
    if (modal) modal.style.display = "none";

    // Optional: kleines Feedback
    alert("Danke! Dein Hinweis wurde gespeichert.");
  }, true);

})();
