/* =====================================================
   MarketShield – system-controls.js
   FINAL / STABIL / MOBILE-SAFE
   - Zur Startseite
   - Report-Modal
   - Social Links (Copy / Print / WhatsApp / Telegram / X)
   - Rechtlicher Hinweis (Mini-Link unter Titel)
===================================================== */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  /* ================= SCROLL LOCK (MOBILE SAFE) ================= */
  function lockScroll() {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
  }

  function unlockScroll() {
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
    document.body.style.touchAction = "";
  }

  /* ================= HOME ================= */
  function goHome(e) {
    e.preventDefault();
    history.pushState({}, "", location.pathname);
    unlockScroll();
    window.dispatchEvent(new Event("ms:home"));
  }

  /* ================= REPORT ================= */
  function openReport() {
    const modal = $("reportModal");
    if (!modal) return;
    modal.style.display = "block";
    lockScroll();
  }

  function closeReport() {
    const modal = $("reportModal");
    if (!modal) return;
    modal.style.display = "none";
    unlockScroll();
  }

  /* ================= LEGAL HINT ================= */
  function renderLegalHint() {
    const el = $("legalHintAnchor");
    if (!el || $("legalHintLink")) return;

    el.innerHTML = `
      <a href="#" id="legalHintLink"
         style="font-size:12px;opacity:.6;text-decoration:underline;cursor:pointer;">
        Rechtlicher Hinweis
      </a>
    `;
  }

  function openLegalHint() {
    if ($("legalHintModal")) return;

    const modal = document.createElement("div");
    modal.id = "legalHintModal";
    modal.style.cssText = `
      position:fixed; inset:0; background:rgba(0,0,0,.5);
      z-index:9999; display:flex; align-items:center; justify-content:center;
    `;

    modal.innerHTML = `
      <div style="background:#fff;padding:20px;max-width:520px;width:90%;
                  border-radius:10px;font-size:14px;line-height:1.4;">
        <strong>Rechtlicher Hinweis</strong><br><br>
        MarketShield dient ausschließlich der Information und Aufklärung.
        Es handelt sich nicht um Beratung, Empfehlung oder Bewertung im
        rechtlichen oder medizinischen Sinne. Angaben ohne Gewähr.
        <br><br>
        <div style="text-align:right;">
          <button id="closeLegalHint">Schließen</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  function closeLegalHint() {
    $("legalHintModal")?.remove();
  }

  /* ================= SOCIAL BAR ================= */
  function renderSocial() {
    const el = $("systemSocialBar");
    if (!el) return;

    el.innerHTML = `
      <div style="display:flex;gap:10px;flex-wrap:wrap;
                  justify-content:center;margin:20px 0;">
        <button data-sys="copy">🔗 Kopieren</button>
        <button data-sys="print">🖨️ Drucken</button>
        <button data-sys="wa">WhatsApp</button>
        <button data-sys="tg">Telegram</button>
        <button data-sys="x">X</button>
      </div>
    `;
  }

  function handleShare(type) {
    const url = location.href;
    const title = document.title;

    if (type === "copy") navigator.clipboard.writeText(url);
    if (type === "print") window.print();
    if (type === "wa") window.open(`https://wa.me/?text=${encodeURIComponent(title + " " + url)}`);
    if (type === "tg") window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`);
    if (type === "x") window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`);
  }

  /* ================= GLOBAL EVENTS (CAPTURE) ================= */
  document.addEventListener("click", (e) => {
    if (e.target.closest("#backHome")) return goHome(e);
    if (e.target.closest("#reportBtn")) { e.preventDefault(); return openReport(); }
    if (e.target.closest("#closeReportModal") || e.target.id === "reportModal") return closeReport();

    if (e.target.id === "legalHintLink") { e.preventDefault(); return openLegalHint(); }
    if (e.target.id === "closeLegalHint" || e.target.id === "legalHintModal") return closeLegalHint();

    const sys = e.target.closest("[data-sys]");
    if (sys) { e.preventDefault(); return handleShare(sys.dataset.sys); }
  }, true);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeReport(); closeLegalHint(); }
  });

  /* ================= INIT ================= */
  document.addEventListener("DOMContentLoaded", () => {
    renderLegalHint();
    renderSocial();
  });

  window.addEventListener("popstate", renderSocial);
})();
