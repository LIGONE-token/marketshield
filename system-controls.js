/* =====================================================
   MarketShield – system-controls.js
   SYSTEMFUNKTIONEN (STABIL > PERFORMANCE)
===================================================== */

(function () {

  /* ================= KONFIG ================= */
  const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
  const SUPABASE_KEY = "sb_publishable_FBywhrypx6zt_0nMlFudyQ_zFiqZKTD";

  /* ================= HELPERS ================= */
  const $ = (id) => document.getElementById(id);

  function log(msg) {
    console.log("🛡️ system-controls:", msg);
  }

  /* =====================================================
     SHARE-CONTEXT (IMMER DER AKTUELLE EINTRAG)
  ===================================================== */
  function getShareContext() {
    const url = location.href;

    const title =
      document.querySelector("h2")?.textContent?.trim() ||
      document.title ||
      "MarketShield";

    let text =
      document.querySelector("#entryContent p")?.textContent?.trim() ||
      "";

    if (text.length > 180) {
      text = text.slice(0, 177).trim() + "…";
    }

    if (!text) {
      text = "Transparente Informationen auf MarketShield.";
    }

    return {
      url,
      title,
      text,
      fullText: `${title} – ${text}`
    };
  }

  /* =====================================================
     REPORT BUTTON – GLOBAL & UNBLOCKIERBAR
     (Capture-Phase, kein onclick)
  ===================================================== */
  document.addEventListener("click", function (e) {
    const trigger = e.target.closest("#reportBtn");
    if (!trigger) return;

    e.preventDefault();
    e.stopImmediatePropagation();

    const modal = document.getElementById("reportModal");
    if (!modal) {
      alert("❌ Report-Fenster nicht gefunden");
      console.error("reportModal fehlt im DOM");
      return;
    }

    modal.style.display = "block";
    modal.style.visibility = "visible";
    modal.style.opacity = "1";

    log("REPORT BUTTON → MODAL GEÖFFNET");
  }, true); // ← CAPTURE MODE (entscheidend!)

  /* =====================================================
     REPORT SUBMIT → SUPABASE (GLOBAL)
  ===================================================== */
  function bindReportSubmit() {
    const form = $("reportForm");
    if (!form) return;

    form.onsubmit = async (e) => {
      e.preventDefault();

      const textarea =
        form.querySelector("textarea") ||
        form.querySelector("input[type='text']");

      const txt = textarea?.value?.trim();
      if (!txt || txt.length < 3) {
        alert("Bitte Beschreibung eingeben.");
        return;
      }

      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/reports`, {
          method: "POST",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal"
          },
          body: JSON.stringify({
            description: txt,
            entry_id: null,
            created_at: new Date().toISOString()
          })
        });

        if (!res.ok) {
          console.error(await res.text());
          alert("Report konnte nicht gespeichert werden.");
          return;
        }

        form.reset();
        document.getElementById("reportModal").style.display = "none";
        alert("Danke! Meldung wurde gespeichert.");
        log("Report gespeichert");

      } catch (err) {
        console.error(err);
        alert("Netzwerkfehler beim Report.");
      }
    };
  }

  /* =====================================================
     REPORT MODAL SCHLIESSEN
  ===================================================== */
  function bindReportClose() {
    const close = $("closeReportModal");
    const modal = $("reportModal");
    if (!close || !modal) return;

    close.onclick = () => {
      modal.style.display = "none";
    };
  }

  /* =====================================================
     ZUR STARTSEITE
  ===================================================== */
  function bindBackHome() {
    const link = $("backHome");
    if (!link) return;

    link.onclick = (e) => {
      e.preventDefault();
      history.pushState({}, "", location.pathname);

      const results = $("results");
      if (results) results.innerHTML = "";

      log("Zur Startseite");
    };
  }

  /* =====================================================
     RECHTLICHER HINWEIS
  ===================================================== */
  function bindLegal() {
    const link = $("legalLink");
    const modal = $("legalModal");
    const close = $("closeLegalModal");

    if (link && modal) {
      link.onclick = (e) => {
        e.preventDefault();
        modal.style.display = "block";
        log("Rechtlicher Hinweis geöffnet");
      };
    }

    if (close && modal) {
      close.onclick = () => {
        modal.style.display = "none";
      };
    }
  }

  /* =====================================================
     SOCIAL / KOPIEREN / DRUCKEN
     data-action="copy|print|telegram|whatsapp|x|facebook"
  ===================================================== */
  function bindActions() {
    document.body.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;

      const action = btn.dataset.action;
      const ctx = getShareContext();

      const encUrl = encodeURIComponent(ctx.url);
      const encText = encodeURIComponent(ctx.fullText);

      if (action === "copy") {
        navigator.clipboard.writeText(`${ctx.fullText}\n${ctx.url}`);
        alert("Link & Beschreibung kopiert");
        return;
      }

      if (action === "print") {
        window.print();
        return;
      }

      if (action === "telegram") {
        window.open(
          `https://t.me/share/url?url=${encUrl}&text=${encText}`,
          "_blank"
        );
        return;
      }

      if (action === "whatsapp") {
        window.open(
          `https://wa.me/?text=${encText}%20${encUrl}`,
          "_blank"
        );
        return;
      }

      if (action === "x") {
        window.open(
          `https://twitter.com/intent/tweet?text=${encText}&url=${encUrl}`,
          "_blank"
        );
        return;
      }

      if (action === "facebook") {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encUrl}`,
          "_blank"
        );
        return;
      }
    });
  }

  /* =====================================================
     ZENTRALES BINDING
  ===================================================== */
  function bindAll() {
    bindReportSubmit();
    bindReportClose();
    bindBackHome();
    bindLegal();
    bindActions();
  }

  /* =====================================================
     INITIAL + SELBSTHEILUNG
  ===================================================== */
  document.addEventListener("DOMContentLoaded", () => {
    bindAll();
    log("Initial gebunden");
  });

  const observer = new MutationObserver(() => {
    bindAll();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

})();
