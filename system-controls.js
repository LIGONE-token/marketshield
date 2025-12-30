/* =====================================================
   MarketShield – SYSTEM CONTROLS (FINAL & STABLE)
   - Report Modal
   - Social Links
   - Zur Startseite
===================================================== */
(function () {
  "use strict";

  /* ---------- Helpers ---------- */
  const qs = (id) => document.getElementById(id);
  const hasEntry = () => new URLSearchParams(location.search).has("id");

  /* ---------- Report Modal ---------- */
  function openReport() {
    const m = qs("reportModal");
    if (m) m.classList.add("open");
  }

  function closeReport() {
    const m = qs("reportModal");
    if (m) m.classList.remove("open");
  }

  /* ---------- Global Click Handling ---------- */
  document.addEventListener("click", (e) => {

    // REPORT: öffnen
    if (e.target.closest("#reportBtn")) {
      e.preventDefault();
      openReport();
      return;
    }

    // REPORT: schließen (Button oder Overlay)
    if (
      e.target.id === "closeReportModal" ||
      e.target.id === "reportModal"
    ) {
      e.preventDefault();
      closeReport();
      return;
    }

    // ZUR STARTSEITE
    if (e.target.id === "backHome") {
      e.preventDefault();
      history.pushState({}, "", location.pathname);
      window.dispatchEvent(new Event("ms:state"));
      return;
    }

  });

  // REPORT: Submit abfangen
  document.addEventListener("submit", (e) => {
    if (e.target.id === "reportForm") {
      e.preventDefault();
      closeReport();
      alert("Danke! Dein Hinweis wurde gespeichert.");
    }
  });

  /* ---------- Social Bar ---------- */
  function ensureSocialBar() {
    let bar = qs("systemSocialBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "systemSocialBar";
      bar.className = "system-social-bar";

      const anchor = qs("results");
      if (anchor) anchor.appendChild(bar);
    }

    bar.innerHTML = `
      <button data-share="copy">Kopieren</button>
      <button data-share="print">Drucken</button>
      <button data-share="wa">WhatsApp</button>
      <button data-share="tg">Telegram</button>
      <button data-share="x">X</button>
    `;
  }

  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-share]");
    if (!b) return;

    const url = location.href;
    const title = document.title;

    if (b.dataset.share === "copy") navigator.clipboard.writeText(url);
    if (b.dataset.share === "print") window.print();
    if (b.dataset.share === "wa")
      window.open(`https://wa.me/?text=${encodeURIComponent(title + " " + url)}`);
    if (b.dataset.share === "tg")
      window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`);
    if (b.dataset.share === "x")
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`);
  });

  /* ---------- State Sync (wichtig!) ---------- */
  function syncUI() {
    const show = hasEntry();

    // Zur Startseite
    const back = qs("backHome");
    if (back) back.style.display = show ? "block" : "none";

    // Social Bar
    const bar = qs("systemSocialBar");
    if (bar) bar.style.display = show ? "flex" : "none";
  }

  window.addEventListener("ms:state", syncUI);
  window.addEventListener("popstate", syncUI);

  /* ---------- Init ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    ensureSocialBar();
    syncUI();
  });

})();
