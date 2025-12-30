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
  if (document.getElementById("legalHintLink")) return;

  const target = document.querySelector(".entry-text");
  if (!target) return;

  const wrap = document.createElement("span");
  wrap.style.position = "relative";
  wrap.style.display = "inline-block";

  const link = document.createElement("a");
  link.id = "legalHintLink";
  link.href = "#";
  link.textContent = "Rechtlicher Hinweis";
  link.style.cssText = "font-size:12px;opacity:.6;cursor:pointer;";

  const box = document.createElement("div");
  box.style.cssText = `
    display:none;
    position:absolute;
    top:20px;
    left:0;
    max-width:260px;
    padding:10px 12px;
    background:#fff;
    border:1px solid #ddd;
    border-radius:6px;
    box-shadow:0 6px 18px rgba(0,0,0,.12);
    font-size:12px;
    line-height:1.4;
    z-index:9999;
  `;

  box.innerHTML = `
    <strong>Warum kein Anspruch auf „die Wahrheit“?</strong><br>
    MarketShield wertet öffentlich verfügbare Informationen aus
    und bereitet sie verständlich auf. Rechtliche Vorgaben,
    Haftungsgrenzen und fehlende Einblicke in interne Rezepturen
    machen eine vollständige oder verbindliche Wahrheit unmöglich.
  `;

  link.onclick = (e) => {
    e.preventDefault();
    box.style.display = box.style.display === "none" ? "block" : "none";
  };

  // Klick außerhalb schließt das Fenster
  document.addEventListener("click", (e) => {
    if (!wrap.contains(e.target)) {
      box.style.display = "none";
    }
  });

  wrap.appendChild(link);
  wrap.appendChild(box);
  target.appendChild(wrap);
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
// ===== ABSOLUTER REPORT-BUTTON-FIX =====
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("reportBtn");
  const modal = document.getElementById("reportModal");

  if (!btn || !modal) return;

  // DIREKTER Klick – unabhängig von Overlays / Capture / Bubbling
  btn.onclick = function (e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    modal.style.display = "block";
  };
});
// ===== REPORT BUTTON: DIREKTER NOTFALL-HANDLER =====
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("reportBtn");
  const modal = document.getElementById("reportModal");

  if (!btn || !modal) return;

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    modal.style.display = "block";
    console.log("REPORT BUTTON CLICKED");
  });
});
