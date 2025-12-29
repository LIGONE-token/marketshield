(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {

    /* === ZUR STARTSEITE (ORIGINALPOSITION) === */
    const backHome =
      document.getElementById("backhome") ||
      document.getElementById("backHome");

    if (backHome) {
      backHome.style.cursor = "pointer";
      backHome.addEventListener("click", () => {
        window.location.href = window.location.pathname;
      });
    }

    /* === REPORT === */
    const reportBtn   = document.getElementById("reportBtn");
    const reportModal = document.getElementById("reportModal");
    const closeBtn    = document.getElementById("closeReportModal");

    if (reportBtn && reportModal) {
      reportBtn.onclick = () => reportModal.style.display = "block";
      if (closeBtn) closeBtn.onclick = () => reportModal.style.display = "none";
      reportModal.onclick = (e) => {
        if (e.target === reportModal) reportModal.style.display = "none";
      };
    }

  });
})();
