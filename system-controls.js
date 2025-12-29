/* =====================================================
   MarketShield – system-controls.js
   FINAL / MINIMAL / NO LAYOUT TOUCH
===================================================== */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {

    const hasDetail = new URLSearchParams(location.search).has("id");

    /* ================= ZUR STARTSEITE =================
       - EXISTIERT in HTML
       - NUR Sichtbarkeit steuern
       - KEIN Styling, KEIN Verschieben
    ==================================================== */
    const backHome =
      document.getElementById("backhome") ||
      document.getElementById("backHome");

    if (backHome) {
      backHome.style.display = hasDetail ? "" : "none";
      backHome.onclick = (e) => {
        e.preventDefault();
        window.location.href = window.location.pathname;
      };
    }

    /* ================= REPORT BUTTON =================
       - EXISTIERT in HTML
       - MUSS IMMER reagieren
       - Öffnet EXISTIERENDES Modal
    ==================================================== */
    const reportBtn =
      document.getElementById("reportBtn") ||
      document.getElementById("reportbutton");
    const reportModal = document.getElementById("reportModal");
    const closeBtn = document.getElementById("closeReportModal");

    if (reportBtn) {
      reportBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (reportModal) {
          reportModal.style.display = "block";
        } else {
          // Fallback: sichtbare Reaktion
          alert("Report-Button aktiv (Modal fehlt).");
        }
      };
    }

    if (closeBtn && reportModal) {
      closeBtn.onclick = (e) => {
        e.preventDefault();
        reportModal.style.display = "none";
      };
      reportModal.addEventListener("click", (e) => {
        if (e.target === reportModal) reportModal.style.display = "none";
      });
    }

    /* ================= SOCIAL LINKS =================
       - EXISTIEREN bereits (systemSocialBar)
       - NUR in Detailansicht sichtbar
       - KEINE Erzeugung
    ==================================================== */
    const social = document.getElementById("systemSocialBar");
    if (social) {
      social.style.display = hasDetail ? "" : "none";
    }

    /* ================= SOCIAL KLICKS ================= */
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
