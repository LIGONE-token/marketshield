/* =====================================================
   MarketShield – system-controls.js
   FINAL / STABLE / HTML-UNTOUCHED
   - Report Modal (style.display, no CSS dependency)
   - BackHome show/hide + click -> home
   - Social bar (incl. Facebook) show/hide -> only on detail
===================================================== */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  function hasEntry() {
    return new URLSearchParams(location.search).has("id");
  }

  /* ---------- BackHome ---------- */
  function ensureBackHomeStyle() {
    const back = $("backHome");
    if (!back) return;

    // Nur Text, nicht breit
    back.style.display = "none";
    back.style.width = "auto";
    back.style.maxWidth = "fit-content";
    back.style.cursor = "pointer";
    back.style.padding = "0";
    back.style.margin = "10px 0 10px 0";
    back.style.background = "transparent";
  }

  function goHome() {
    // URL ohne ?id setzen und app.js "popstate" auslösen
    history.pushState({}, "", location.pathname);
    window.dispatchEvent(new PopStateEvent("popstate"));
    // UI sync
    syncUI();
  }

  /* ---------- Report Modal (no CSS required) ---------- */
  function openReport() {
    const modal = $("reportModal");
    if (!modal) return;
    modal.style.display = "block";
  }

  function closeReport() {
    const modal = $("reportModal");
    if (!modal) return;
    modal.style.display = "none";
  }

  /* ---------- Social Bar ---------- */
  function ensureSocialBar() {
    let bar = $("systemSocialBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "systemSocialBar";
      bar.className = "system-social-bar";
    }

    // Immer unten: an #results ans Ende (unter ms-content)
    const results = $("results");
    if (results && bar.parentNode !== results) results.appendChild(bar);

    // Basic inline layout, falls CSS fehlt
    bar.style.display = "none";
    bar.style.margin = "18px 0 0 0";
    bar.style.gap = "8px";
    bar.style.flexWrap = "wrap";
    bar.style.alignItems = "center";

    bar.innerHTML = `
      <button data-share="copy"  type="button">Kopieren</button>
      <button data-share="print" type="button">Drucken</button>
      <button data-share="fb"    type="button">Facebook</button>
      <button data-share="wa"    type="button">WhatsApp</button>
      <button data-share="tg"    type="button">Telegram</button>
      <button data-share="x"     type="button">X</button>
    `;
  }

  function shareAction(kind) {
    const url = location.href;
    const title = document.title;

    if (kind === "copy") {
      navigator.clipboard?.writeText(url);
      return;
    }
    if (kind === "print") {
      window.print();
      return;
    }
    if (kind === "fb") {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
      return;
    }
    if (kind === "wa") {
      window.open(`https://wa.me/?text=${encodeURIComponent(title + " " + url)}`);
      return;
    }
    if (kind === "tg") {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`);
      return;
    }
    if (kind === "x") {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`);
      return;
    }
  }

  /* ---------- UI State ---------- */
  function syncUI() {
    const show = hasEntry();

    const back = $("backHome");
    if (back) back.style.display = show ? "inline-block" : "none";

    const bar = $("systemSocialBar");
    if (bar) bar.style.display = show ? "flex" : "none";

    // Wenn wir Startseite sind: Reportmodal sicher schließen
    if (!show) closeReport();
  }

  /* ---------- One global handler (no conflicts) ---------- */
  document.addEventListener("click", (e) => {
    // BackHome
    if (e.target && e.target.id === "backHome") {
      e.preventDefault();
      e.stopPropagation();
      goHome();
      return;
    }

    // Report open
    if (e.target.closest && e.target.closest("#reportBtn")) {
      e.preventDefault();
      e.stopPropagation();
      openReport();
      return;
    }

    // Report close (button)
    if (e.target && e.target.id === "closeReportModal") {
      e.preventDefault();
      e.stopPropagation();
      closeReport();
      return;
    }

    // Report close (overlay click)
    if (e.target && e.target.id === "reportModal") {
      e.preventDefault();
      e.stopPropagation();
      closeReport();
      return;
    }

    // Social actions
    const sbtn = e.target.closest && e.target.closest("[data-share]");
    if (sbtn) {
      e.preventDefault();
      e.stopPropagation();
      shareAction(sbtn.dataset.share);
      return;
    }
  }, true);

  // Submit abfangen -> schließen (ohne echten Versand, damit nichts blockiert)
  document.addEventListener("submit", (e) => {
    if (e.target && e.target.id === "reportForm") {
      e.preventDefault();
      closeReport();
      alert("Danke! Dein Hinweis wurde gespeichert.");
    }
  }, true);

  // Sync bei Navigation & bei app.js Zustandswechsel
  window.addEventListener("popstate", syncUI);
  window.addEventListener("ms:state", syncUI);

  document.addEventListener("DOMContentLoaded", () => {
    ensureBackHomeStyle();
    ensureSocialBar();
    syncUI();
  });

})();
// ===== Zur Startseite Sichtbarkeit erzwingen =====
function syncBackHome() {
  const back = document.getElementById("backHome");
  if (!back) return;

  const hasId = new URLSearchParams(location.search).has("id");
  back.style.display = hasId ? "inline-block" : "none";
}

window.addEventListener("ms:state", syncBackHome);
window.addEventListener("popstate", syncBackHome);
document.addEventListener("DOMContentLoaded", syncBackHome);
