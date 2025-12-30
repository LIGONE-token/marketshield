/* =====================================================
   MarketShield – system-controls.js
   FINAL / STABLE / CLEAN
===================================================== */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const hasEntry = () => new URLSearchParams(location.search).has("id");

  /* ================= REPORT MODAL ================= */
  function openReport() {
    const m = $("reportModal");
    if (m) m.style.display = "block";
  }

  function closeReport() {
    const m = $("reportModal");
    if (m) m.style.display = "none";
  }

  /* ================= SOCIAL BAR ================= */
  function ensureSocialBar() {
    let bar = $("systemSocialBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "systemSocialBar";
      bar.className = "system-social-bar";
      $("results")?.appendChild(bar);
    }

    bar.innerHTML = `
      <button data-share="copy">Kopieren</button>
      <button data-share="print">Drucken</button>
      <button data-share="fb">Facebook</button>
      <button data-share="wa">WhatsApp</button>
      <button data-share="tg">Telegram</button>
      <button data-share="x">X</button>
    `;
  }

  function share(kind) {
    const url = location.href;
    const title = document.title;
    if (kind === "copy") navigator.clipboard?.writeText(url);
    if (kind === "print") window.print();
    if (kind === "fb") window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
    if (kind === "wa") window.open(`https://wa.me/?text=${encodeURIComponent(title + " " + url)}`);
    if (kind === "tg") window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`);
    if (kind === "x") window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`);
  }

  /* ================= LEGAL HINT ================= */
  function ensureLegalHint() {
    if ($("legalHintLink")) return;
    const target = document.querySelector(".entry-text");
    if (!target) return;

    const a = document.createElement("a");
    a.id = "legalHintLink";
    a.href = "#";
    a.textContent = "Rechtlicher Hinweis";
    a.style.cssText = "display:block;font-size:12px;opacity:.6;margin:10px 0;";
    a.onclick = (e) => {
      e.preventDefault();
      alert("MarketShield dient ausschließlich der Information. Keine Beratung.");
    };
    target.appendChild(a);
  }

  /* ================= UI STATE ================= */
  function syncUI() {
    const show = hasEntry();

    // Zur Startseite
    const back = $("backHome");
    if (back) {
      back.style.display = show ? "inline-block" : "none";
      back.style.cursor = "pointer";
    }

    // Social Bar
    const bar = $("systemSocialBar");
    if (bar) bar.style.display = show ? "flex" : "none";

    // Legal Hint
    if (show) ensureLegalHint();
    else closeReport();
  }

  /* ================= GLOBAL HANDLERS ================= */
  document.addEventListener("click", (e) => {

    // Zur Startseite
    if (e.target?.id === "backHome") {
      e.preventDefault();
      history.pushState({}, "", location.pathname);
      window.dispatchEvent(new Event("ms:state"));
      return;
    }

    // Report öffnen
    if (e.target.closest("#reportBtn")) {
      e.preventDefault();
      openReport();
      return;
    }

    // Report schließen
    if (e.target.id === "closeReportModal" || e.target.id === "reportModal") {
      e.preventDefault();
      closeReport();
      return;
    }

    // Social teilen
    const s = e.target.closest("[data-share]");
    if (s) {
      e.preventDefault();
      share(s.dataset.share);
    }
  }, true);

  // Formular absenden
  document.addEventListener("submit", (e) => {
    if (e.target.id === "reportForm") {
      e.preventDefault();
      closeReport();
      alert("Danke! Dein Hinweis wurde gespeichert.");
    }
  }, true);

  window.addEventListener("popstate", syncUI);
  window.addEventListener("ms:state", syncUI);

  document.addEventListener("DOMContentLoaded", () => {
    ensureSocialBar();
    syncUI();
  });

})();
