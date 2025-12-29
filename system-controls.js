/* =====================================================
   MarketShield – system-controls.js
   FINAL – NUR EVENTS, KEIN ERZEUGEN, KEIN UMBRUCH
===================================================== */

(function () {
  "use strict";

  function log(msg) { console.log("[system-controls]", msg); }

  document.addEventListener("DOMContentLoaded", () => {

    log("geladen");

    /* ================= ZUR STARTSEITE ================= */
    const backHome = document.getElementById("backHome");
    if (backHome) {
      backHome.onclick = (e) => {
        e.preventDefault();
        history.pushState({}, "", location.pathname);
        window.dispatchEvent(new Event("ms:home"));
      };
      log("backHome aktiv");
    } else {
      log("backHome FEHLT");
    }

    /* ================= REPORT ================= */
    const reportBtn   = document.getElementById("reportBtn");
    const reportModal = document.getElementById("reportModal");
    const closeBtn    = document.getElementById("closeReportModal");

    if (reportBtn && reportModal) {
      reportBtn.onclick = () => {
        reportModal.style.display = "block";
      };

      if (closeBtn) {
        closeBtn.onclick = () => {
          reportModal.style.display = "none";
        };
      }

      reportModal.onclick = (e) => {
        if (e.target === reportModal) {
          reportModal.style.display = "none";
        }
      };

      log("Report aktiv");
    } else {
      log("Report-Elemente FEHLEN");
    }

    /* ================= SOCIAL / COPY / PRINT ================= */
    document.body.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-sys]");
      if (!btn) return;

      const url = location.href;
      const title = document.title;

      switch (btn.dataset.sys) {
        case "copy":
          navigator.clipboard.writeText(url);
          log("copy");
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
   /* ================= RECHTLICHER HINWEIS (AUTO) ================= */
function ensureLegalHint() {
  // schon vorhanden? → nichts tun
  if (document.getElementById("legalHintLink")) return;

  // Titel des Eintrags suchen
  const h2 = document.querySelector("#results h2");
  if (!h2) return;

  const a = document.createElement("a");
  a.id = "legalHintLink";
  a.href = "#";
  a.textContent = "Rechtlicher Hinweis";
  a.style.cssText =
    "display:block;font-size:12px;opacity:.6;text-decoration:underline;margin:6px 0;";

  a.addEventListener("click", (e) => {
    e.preventDefault();
    alert(
      "MarketShield dient ausschließlich der Information.\n" +
      "Keine Beratung. Keine Gewähr."
    );
  });

  h2.insertAdjacentElement("afterend", a);
}

})();
