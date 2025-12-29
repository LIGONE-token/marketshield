/* =====================================================
   MarketShield – system-controls.js
   FINAL / LOCKED / HTML-INDEPENDENT
===================================================== */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {

    /* ================= ZUR STARTSEITE ================= */
    const backHome = document.getElementById("backHome");
    if (backHome) {
      backHome.addEventListener("click", (e) => {
        e.preventDefault();
        location.href = location.pathname;
      });
    }

    /* ================= REPORT ================= */
    const reportBtn   = document.getElementById("reportBtn");
    const reportModal = document.getElementById("reportModal");
    const closeBtn    = document.getElementById("closeReportModal");

    if (reportBtn && reportModal) {
      reportBtn.addEventListener("click", (e) => {
        e.preventDefault();
        reportModal.style.display = "block";
      });
      if (closeBtn) {
        closeBtn.addEventListener("click", () => {
          reportModal.style.display = "none";
        });
      }
      reportModal.addEventListener("click", (e) => {
        if (e.target === reportModal) reportModal.style.display = "none";
      });
    }

    /* ================= SYSTEM SOCIAL BAR ================= */
    let social = document.getElementById("systemSocialBar");

    if (!social) {
      social = document.createElement("div");
      social.id = "systemSocialBar";
      social.className = "system-social-bar";

      const anchor =
        document.getElementById("shareBox") ||
        document.getElementById("results");

      if (anchor) anchor.appendChild(social);
    }

    if (social) {
      social.innerHTML = `
        <button data-sys="copy">Kopieren</button>
        <button data-sys="print">Drucken</button>
        <button data-sys="wa">WhatsApp</button>
        <button data-sys="tg">Telegram</button>
        <button data-sys="x">X</button>
      `;
    }

    document.body.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-sys]");
      if (!btn) return;

      const url = location.href;
      const title = document.title;

      if (btn.dataset.sys === "copy") navigator.clipboard.writeText(url);
      if (btn.dataset.sys === "print") window.print();
      if (btn.dataset.sys === "wa")
        window.open(`https://wa.me/?text=${encodeURIComponent(title + " " + url)}`);
      if (btn.dataset.sys === "tg")
        window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`);
      if (btn.dataset.sys === "x")
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`);
    });

    /* ================= RECHTLICHER HINWEIS ================= */
    if (!document.getElementById("legalHintLink")) {
      const legal = document.createElement("a");
      legal.id = "legalHintLink";
      legal.href = "#";
      legal.textContent = "Rechtlicher Hinweis";
      legal.style.cssText =
        "display:block;font-size:12px;opacity:.6;margin:8px 0;";

      legal.addEventListener("click", (e) => {
        e.preventDefault();
        alert("MarketShield dient ausschließlich der Information. Keine Beratung. Angaben ohne Gewähr.");
      });

      const target =
        document.getElementById("shareBox") ||
        document.getElementById("results");

      if (target) target.appendChild(legal);
    }

  });
})();
