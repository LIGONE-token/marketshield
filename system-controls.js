/* =====================================================
   MarketShield – system-controls.js
   FINAL / STATE-AWARE / NO LAYOUT TOUCH
===================================================== */
(function () {
  "use strict";

  function updateVisibility() {
    const hasDetail = new URLSearchParams(location.search).has("id");

    // Zur Startseite – NUR in Detailansicht
    const backHome =
      document.getElementById("backhome") ||
      document.getElementById("backHome");

    if (backHome) {
      backHome.style.display = hasDetail ? "" : "none";
    }

    // Social – NUR in Detailansicht
    const social = document.getElementById("systemSocialBar");
    if (social) {
      social.style.display = hasDetail ? "" : "none";
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    // Initial setzen
    updateVisibility();

    // Klick: Zur Startseite
    const backHome =
      document.getElementById("backhome") ||
      document.getElementById("backHome");

    if (backHome) {
      backHome.style.cursor = "pointer";
      backHome.onclick = (e) => {
        e.preventDefault();
        // hart zurück + danach Sichtbarkeit korrekt setzen
        history.pushState({}, "", location.pathname);
        updateVisibility();
      };
    }

    // Report-Button – MUSS reagieren
    const reportBtn =
      document.getElementById("reportBtn") ||
      document.getElementById("reportbutton");
    const reportModal = document.getElementById("reportModal");
    const closeBtn = document.getElementById("closeReportModal");

    if (reportBtn && reportModal) {
      reportBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        reportModal.style.display = "block";
      };
      if (closeBtn) {
        closeBtn.onclick = (e) => {
          e.preventDefault();
          reportModal.style.display = "none";
        };
      }
      reportModal.onclick = (e) => {
        if (e.target === reportModal) reportModal.style.display = "none";
      };
    }

    // Reagiere auf History-Änderungen (Kartenklicks etc.)
    window.addEventListener("popstate", updateVisibility);
  });
})();
