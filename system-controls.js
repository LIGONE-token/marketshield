/* =====================================================
   MarketShield – system-controls.js
   FINAL / STABLE / NO LAYOUT CHANGES
===================================================== */
(function () {
  "use strict";

  function hasDetail() {
    return new URLSearchParams(location.search).has("id");
  }

  function ensureSocialBar() {
    const shareBox = document.getElementById("shareBox");
    if (!shareBox) return null;

    let bar = document.getElementById("systemSocialBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "systemSocialBar";
      bar.className = "system-social-bar";
      shareBox.appendChild(bar);
    }

    // nur Buttons, kein Layout erzwingen
    bar.innerHTML = `
      <button data-sys="copy">Kopieren</button>
      <button data-sys="print">Drucken</button>
      <button data-sys="fb">Facebook</button>
      <button data-sys="wa">WhatsApp</button>
      <button data-sys="tg">Telegram</button>
      <button data-sys="x">X</button>
    `;

    return bar;
  }

  function updateVisibility() {
    const detail = hasDetail();

    // Zur Startseite – nur Detail
    const backHome =
      document.getElementById("backhome") ||
      document.getElementById("backHome");

    if (backHome) {
      backHome.style.display = detail ? "" : "none";
      backHome.style.cursor = "pointer";
    }

    // Social – nur Detail
    const bar = ensureSocialBar();
    if (bar) {
      bar.style.display = detail ? "" : "none";
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    // initial + immer wenn app.js State wechselt
    updateVisibility();
    window.addEventListener("ms:state", updateVisibility);
    window.addEventListener("popstate", updateVisibility);

    /* ===== Zur Startseite: nur Klick, kein Layout ===== */
    const backHome =
      document.getElementById("backhome") ||
      document.getElementById("backHome");

    if (backHome) {
      backHome.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = window.location.pathname;
      });
    }

    document.addEventListener("DOMContentLoaded", () => {
  const reportBtn = document.getElementById("reportBtn");

  if (!reportBtn) return;

  reportBtn.addEventListener(
    "click",
    (e) => {
      e.preventDefault();      // ⛔ verhindert Submit / Reload
      e.stopPropagation();     // ⛔ verhindert Fremd-Handler

      // 🔴 SICHTBARE REAKTION – Beweis, dass der Button lebt
      alert("Report-Button funktioniert.");
    },
    true // 🔒 Capture-Phase: kommt VOR allen anderen
  );
});

    /* ===== Social Actions (inkl. Facebook) ===== */
    document.body.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-sys]");
      if (!btn) return;

      const url = location.href;
      const title = document.title;

      if (btn.dataset.sys === "copy") {
        if (navigator.clipboard) navigator.clipboard.writeText(url);
        return;
      }
      if (btn.dataset.sys === "print") {
        window.print();
        return;
      }
      if (btn.dataset.sys === "fb") {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
        return;
      }
      if (btn.dataset.sys === "wa") {
        window.open(`https://wa.me/?text=${encodeURIComponent(title + " " + url)}`, "_blank");
        return;
      }
      if (btn.dataset.sys === "tg") {
        window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, "_blank");
        return;
      }
      if (btn.dataset.sys === "x") {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, "_blank");
        return;
      }
    });
  });
})();
