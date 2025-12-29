/* =====================================================
   MarketShield – system-controls.js
   FINAL / CLEAN / NO LAYOUT TOUCH
===================================================== */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {

    /* ================= STATE ================= */
    const hasDetail = new URLSearchParams(location.search).has("id");

    /* ================= ZUR STARTSEITE =================
       - NUR sichtbar in Detailansicht
       - Position/Styling NICHT ändern
       - NUR Klick binden
    ==================================================== */
    const backHome =
      document.getElementById("backhome") ||
      document.getElementById("backHome");

    if (backHome) {
      backHome.style.display = hasDetail ? "" : "none";
      backHome.style.cursor = "pointer";
      backHome.addEventListener("click", (e) => {
        e.preventDefault();
        // hart zurück zur Startseite
        window.location.href = window.location.pathname;
      });
    }

    /* ================= REPORT =================
       - EXISTIERENDER Button
       - Öffnet EXISTIERENDES Modal
       - KEIN Formular-Handling
       - KEIN neues UI
    ============================================ */
    const reportBtn =
      document.getElementById("reportBtn") ||
      document.getElementById("reportbutton");
    const reportModal = document.getElementById("reportModal");
    const closeBtn = document.getElementById("closeReportModal");

    if (reportBtn && reportModal) {
      reportBtn.style.cursor = "pointer";
      reportBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        reportModal.style.display = "block";
      }, true);

      if (closeBtn) {
        closeBtn.addEventListener("click", (e) => {
          e.preventDefault();
          reportModal.style.display = "none";
        });
      }

      // Klick auf Hintergrund schließt
      reportModal.addEventListener("click", (e) => {
        if (e.target === reportModal) reportModal.style.display = "none";
      });
    }

    /* ================= SOCIAL =================
       - KEINE Erzeugung neuer Elemente
       - NUR vorhandene Leiste steuern
       - NUR in Detailansicht sichtbar
    ============================================ */
    const social = document.getElementById("systemSocialBar");
    if (social) {
      social.style.display = hasDetail ? "" : "none";
    }

    /* ================= SOCIAL ACTIONS =================
       - Klick-Delegation
       - Facebook ergänzt
       - KEIN Layout-Eingriff
    ==================================================== */
    document.body.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-sys]");
      if (!btn) return;

      const url = window.location.href;
      const title = document.title;

      switch (btn.dataset.sys) {
        case "copy":
          navigator.clipboard && navigator.clipboard.writeText(url);
          break;
        case "print":
          window.print();
          break;
        case "wa":
          window.open(`https://wa.me/?text=${encodeURIComponent(title + " " + url)}`, "_blank");
          break;
        case "tg":
          window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, "_blank");
          break;
        case "x":
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, "_blank");
          break;
        case "fb":
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
          break;
        default:
          break;
      }
    });

  });
})();
