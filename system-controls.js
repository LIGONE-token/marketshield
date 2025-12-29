console.log("system-controls.js geladen – Report-Fix aktiv");

(function () {

  function bindReport() {
    const btn   = document.getElementById("reportBtn");
    const modal = document.getElementById("reportModal");
    const close = document.getElementById("closeReportModal");
    const box   = document.querySelector(".report-modal-box");

    if (!btn || !modal) {
      return; // DOM noch nicht bereit
    }

    // Doppelte Bindings verhindern
    if (btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";

    console.log("✅ ReportButton gebunden");

    const open = () => {
      modal.style.display = "block";
      document.body.style.overflow = "hidden";
    };

    const closeModal = () => {
      modal.style.display = "none";
      document.body.style.overflow = "";
    };

    // Öffnen
    btn.addEventListener("click", open);

    // Schließen (Button)
    if (close) {
      close.addEventListener("click", closeModal);
    }

    // Schließen (Overlay)
    modal.addEventListener("click", closeModal);
    if (box) {
      box.addEventListener("click", e => e.stopPropagation());
    }

    // ESC
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") closeModal();
    });
  }

  // 🔥 SOFORT + SELBSTHEILUNG
  bindReport();
  setInterval(bindReport, 500);

})();
