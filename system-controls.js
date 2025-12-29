/* =====================================================
   MarketShield – system-controls.js
   FINAL / STABLE / LOCKED
   - Zur Startseite
   - Report-Modal
   - Social Links (Copy / Print / WhatsApp / Telegram / X)
   - Rechtlicher Hinweis (Mini-Link unter Titel)
===================================================== */

(function () {
  "use strict";

  /* ===================== HELPERS ===================== */
  function qs(id) { return document.getElementById(id); }

  /* ===================== HOME ===================== */
  function goHome(e) {
    e.preventDefault();
    history.pushState(null, "", location.pathname);
    location.reload(); // zuverlässig, egal was vorher gerendert wurde
  }

  /* ===================== REPORT ===================== */
  function openReport() {
    const modal = qs("reportModal");
    if (!modal) return;
    modal.style.display = "block";
    document.body.style.overflow = "hidden";
  }

  function closeReport() {
    const modal = qs("reportModal");
    if (!modal) return;
    modal.style.display = "none";
    document.body.style.overflow = "";
  }

  /* ===================== LEGAL HINT ===================== */
  function renderLegalHint() {
    const el = qs("legalHintAnchor");
    if (!el) return;

    if (qs("legalHintLink")) return; // kein Doppel-Render
    el.innerHTML = `
      <a href="#" id="legalHintLink"
         style="font-size:12px;opacity:.6;text-decoration:underline;cursor:pointer;">
        Rechtlicher Hinweis
      </a>
    `;
  }

  function openLegalHint() {
    if (qs("legalHintModal")) return;

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
    qs("legalHintModal")?.remove();
  }

  /* ===================== SOCIAL BAR ===================== */
  function renderSystemSocialBar() {
    const el = qs("systemSocialBar");
    if (!el) return;

    el.innerHTML = `
      <div style="
        display:flex; justify-content:center; gap:10px;
        margin:25px 0 10px; flex-wrap:wrap;
      ">
        <button data-sys="copy">🔗 Kopieren</button>
        <button data-sys="print">🖨️ Drucken</button>
        <button data-sys="whatsapp">🟢 WhatsApp</button>
        <button data-sys="telegram">📨 Telegram</button>
        <button data-sys="x">𝕏 Teilen</button>
      </div>
    `;
  }

  function handleShare(type) {
    const url = location.href;
    const title = document.title;

    switch (type) {
      case "copy":
        navigator.clipboard.writeText(url)
          .then(() => alert("Link kopiert"))
          .catch(() => alert("Kopieren nicht möglich"));
        break;
      case "print":
        window.print();
        break;
      case "whatsapp":
        window.open(
          `https://wa.me/?text=${encodeURIComponent(title + " " + url)}`,
          "_blank"
        );
        break;
      case "telegram":
        window.open(
          `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
          "_blank"
        );
        break;
      case "x":
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
          "_blank"
        );
        break;
    }
  }

  /* ===================== GLOBAL EVENTS ===================== */
  document.addEventListener("click", (e) => {
    // Zur Startseite
    const home = e.target.closest("#backHome");
    if (home) return goHome(e);

    // Report öffnen
    if (e.target.closest("#reportBtn")) {
      e.preventDefault();
      return openReport();
    }

    // Report schließen (Overlay)
    const modal = qs("reportModal");
    if (modal && e.target === modal) return closeReport();

    // Report schließen (Button)
    if (e.target.closest("#closeReportModal")) return closeReport();

    // Legal Hint öffnen
    if (e.target.id === "legalHintLink") {
      e.preventDefault();
      return openLegalHint();
    }

    // Legal Hint schließen
    if (e.target.id === "closeLegalHint") return closeLegalHint();
    if (e.target.id === "legalHintModal") return closeLegalHint();

    // Social / Copy / Print
    const sys = e.target.closest("[data-sys]");
    if (sys) {
      e.preventDefault();
      return handleShare(sys.dataset.sys);
    }
  });

  // ESC schließt Modals
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeReport();
      closeLegalHint();
    }
  });

  /* ===================== VISIBILITY GUARD ===================== */
  setInterval(() => {
    const backHome = qs("backHome");
    if (backHome) {
      backHome.style.display = "block";
      backHome.style.pointerEvents = "auto";
    }

    const reportBtn = qs("reportBtn");
    if (reportBtn) {
      reportBtn.style.pointerEvents = "auto";
    }

    renderLegalHint();
    renderSystemSocialBar();
  }, 1000);

  /* ===================== INIT ===================== */
  document.addEventListener("DOMContentLoaded", () => {
    renderLegalHint();
    renderSystemSocialBar();
  });

})();
