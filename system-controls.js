/* =====================================================
   MarketShield – system-controls.js
   PURE LOGIC ONLY – NICHTS WIRD ERZEUGT
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

  /* ================= ZUR STARTSEITE ================= */
  const backHome = document.getElementById("backHome");
  if (backHome) {
    backHome.addEventListener("click", (e) => {
      e.preventDefault();
      history.pushState({}, "", location.pathname);
      window.dispatchEvent(new Event("ms:home"));
    });
  } else {
    console.warn("⚠️ backHome nicht gefunden");
  }

  /* ================= REPORT ================= */
  const reportBtn   = document.getElementById("reportBtn");
  const reportModal = document.getElementById("reportModal");
  const closeReport = document.getElementById("closeReportModal");

  if (reportBtn && reportModal) {
    reportBtn.addEventListener("click", () => {
      reportModal.style.display = "block";
    });

    if (closeReport) {
      closeReport.addEventListener("click", () => {
        reportModal.style.display = "none";
      });
    }

    reportModal.addEventListener("click", (e) => {
      if (e.target === reportModal) {
        reportModal.style.display = "none";
      }
    });
  } else {
    console.warn("⚠️ Report-Elemente fehlen");
  }

  /* ================= SOCIAL / COPY / PRINT ================= */
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-sys]");
    if (!btn) return;

    e.preventDefault();

    const url = location.href;
    const title = document.title;

    switch (btn.dataset.sys) {
      case "copy":
        navigator.clipboard.writeText(url);
        break;

      case "print":
        window.print();
        break;

      case "wa":
        window.open(`https://wa.me/?text=${encodeURIComponent(title + " " + url)}`);
        break;

      case "tg":
        window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`);
        break;

      case "x":
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`);
        break;
    }
  });

  /* ================= RECHTLICHER HINWEIS ================= */
  const legalLink = document.getElementById("legalHintLink");
  if (legalLink) {
    legalLink.addEventListener("click", (e) => {
      e.preventDefault();
      alert(
        "MarketShield dient ausschließlich der Information.\n" +
        "Keine Beratung. Keine Gewähr."
      );
    });
  } else {
    console.warn("⚠️ legalHintLink nicht gefunden");
  }

  console.log("✅ system-controls.js vollständig aktiv");
});
