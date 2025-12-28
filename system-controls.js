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
     REPORT BUTTON (GLOBAL, IMMER)
  ===================================================== */
  function bindReportButton() {
    const btn = $("reportBtn");
    const modal = $("reportModal");
    const close = $("closeReportModal");

    if (!btn || !modal) return;

    btn.onclick = (e) => {
      e.preventDefault();
      modal.style.display = "block";
      log("Report geöffnet");
    };

    if (close) {
      close.onclick = () => {
        modal.style.display = "none";
      };
    }
  }

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
        $("reportModal").style.display = "none";
        alert("Danke! Meldung wurde gespeichert.");
        log("Report gespeichert");

      } catch (err) {
        console.error(err);
        alert("Netzwerkfehler beim Report.");
      }
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
     (data-action="copy|print|telegram|whatsapp|x|facebook")
  ===================================================== */
  function bindActions() {
    document.body.onclick = (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;

      const action = btn.dataset.action;
      const url = location.href;
      const title =
        document.querySelector("h2")?.textContent ||
        document.title ||
        "MarketShield";

      const encUrl = encodeURIComponent(url);
      const encTitle = encodeURIComponent(title);

      if (action === "copy") {
        navigator.clipboard.writeText(url);
        alert("Link kopiert");
        return;
      }

      if (action === "print") {
        window.print();
        return;
      }

      if (action === "telegram") {
        window.open(`https://t.me/share/url?url=${encUrl}&text=${encTitle}`, "_blank");
        return;
      }

      if (action === "whatsapp") {
        window.open(`https://wa.me/?text=${encTitle}%20${encUrl}`, "_blank");
        return;
      }

      if (action === "x") {
        window.open(`https://twitter.com/intent/tweet?url=${encUrl}&text=${encTitle}`, "_blank");
        return;
      }

      if (action === "facebook") {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encUrl}`, "_blank");
        return;
      }
    };
  }

  /* =====================================================
     BINDINGS ZENTRAL
  ===================================================== */
  function bindAll() {
    bindReportButton();
    bindReportSubmit();
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
