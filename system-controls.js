/* =====================================================
   MarketShield – system-controls.js
   SYSTEMFUNKTIONEN (STABIL > PERFORMANCE)
===================================================== */

(function () {

  /* ================= KONFIG ================= */
  const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
  const SUPABASE_KEY = "sb_publishable_FBywhrypx6zt_0nMlFudyQ_zFiqZKTD";

  const $ = (id) => document.getElementById(id);

  function log(msg) {
    console.log("🛡️ system-controls:", msg);
  }

  /* =====================================================
     REPORT BUTTON – GLOBAL (UNBLOCKIERBAR)
  ===================================================== */
  document.addEventListener("click", function (e) {
    const trigger = e.target.closest("#reportBtn");
    if (!trigger) return;

    e.preventDefault();
    e.stopImmediatePropagation();

    const modal = $("reportModal");
    if (!modal) {
      alert("Report-Fenster nicht gefunden");
      return;
    }

    modal.style.display = "block";
    modal.style.visibility = "visible";
    modal.style.opacity = "1";

    log("Report geöffnet");
  }, true); // CAPTURE MODE

  /* =====================================================
     REPORT MODAL – ABBRECHEN / SCHLIESSEN
  ===================================================== */
  function bindReportClose() {
    const modal = $("reportModal");
    if (!modal) return;

    modal.addEventListener("click", (e) => {
      if (
        e.target.id === "closeReportModal" ||
        e.target.dataset.action === "cancel-report"
      ) {
        e.preventDefault();
        modal.style.display = "none";
        log("Report abgebrochen");
      }
    });
  }

  /* =====================================================
     REPORT SENDEN → SUPABASE
  ===================================================== */
  function bindReportSubmit() {
    const form = $("reportForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const textarea =
        form.querySelector("textarea") ||
        form.querySelector("input[type='text']");

      const text = textarea?.value?.trim();
      if (!text || text.length < 3) {
        alert("Bitte eine Beschreibung eingeben.");
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
            description: text,
            created_at: new Date().toISOString()
          })
        });

        if (!res.ok) {
          console.error(await res.text());
          alert("Fehler beim Speichern der Meldung.");
          return;
        }

        form.reset();
        $("reportModal").style.display = "none";
        alert("Danke! Meldung wurde gespeichert.");
        log("Report gesendet");

      } catch (err) {
        console.error(err);
        alert("Netzwerkfehler beim Report.");
      }
    });
  }

  /* =====================================================
     INITIAL + SELBSTHEILUNG
  ===================================================== */
  function bindAll() {
    bindReportClose();
    bindReportSubmit();
  }

  document.addEventListener("DOMContentLoaded", bindAll);

  new MutationObserver(bindAll).observe(document.body, {
    childList: true,
    subtree: true
  });

})();
