/* =====================================================
   MarketShield – system-controls.js
   FINAL / SYNTAX-SAFE
===================================================== */

(function () {
  "use strict";

  console.log("[system-controls] start");

  document.addEventListener("DOMContentLoaded", () => {

    console.log("[system-controls] DOM ready");

    /* ================= ZUR STARTSEITE ================= */
    const backHome = document.getElementById("backHome");
    if (backHome) {
      backHome.addEventListener("click", (e) => {
        e.preventDefault();
        history.pushState({}, "", location.pathname);
        window.dispatchEvent(new Event("ms:home"));
      });
      console.log("[system-controls] backHome OK");
    }

    /* ================= REPORT ================= */
    const reportBtn   = document.getElementById("reportBtn");
    const reportModal = document.getElementById("reportModal");
    const closeBtn    = document.getElementById("closeReportModal");

    if (reportBtn && reportModal) {
      reportBtn.addEventListener("click", () => {
        reportModal.style.display = "block";
      });

      if (closeBtn) {
        closeBtn.addEventListener("click", () => {
          reportModal.style.display = "none";
        });
      }

      reportModal.addEventListener("click", (e) => {
        if (e.target === reportModal) {
          reportModal.style.display = "none";
        }
      });

      console.log("[system-controls] report OK");
    }

    /* ================= SOCIAL ================= */
    const social = document.getElementById("systemSocialBar");
    if (social) {
      social.innerHTML = `
        <button data-sys="copy">Kopieren</button>
        <button data-sys="print">Drucken</button>
        <button data-sys="wa">WhatsApp</button>
        <button data-sys="tg">Telegram</button>
        <button data-sys="x">X</button>
      `;
      console.log("[system-controls] social OK");
    }

    document.body.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-sys]");
      if (!btn) return;

      const url = location.href;
      const title = document.title;

      if (btn.dataset.sys === "copy") navigator.clipboard.writeText(url);
      if (btn.dataset.sys === "print") window.print();
      if (btn.dataset.sys === "wa") window.open(`https://wa.me/?text=${encodeURIComponent(title + " " + url)}`);
      if (btn.dataset.sys === "tg") window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`);
      if (btn.dataset.sys === "x") window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`);
    });

    /* ================= LEGAL ================= */
    const h2 = document.querySelector("#results h2");
    if (h2 && !document.getElementById("legalHintLink")) {
      const a = document.createElement("a");
      a.id = "legalHintLink";
      a.href = "#";
      a.textContent = "Rechtlicher Hinweis";
      a.style.cssText = "display:block;font-size:12px;opacity:.6;margin:6px 0;";
      a.addEventListener("click", (e) => {
        e.preventDefault();
        alert("MarketShield dient ausschließlich der Information. Keine Beratung.");
      });
      h2.insertAdjacentElement("afterend", a);
      console.log("[system-controls] legal OK");
    }

    console.log("[system-controls] ready");
  });

})();
