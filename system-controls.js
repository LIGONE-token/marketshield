/* =====================================================
   MarketShield – system-controls.js
   NUR FUNKTIONEN FÜR FESTEN REPORTBUTTON
   KEIN UI, KEIN RENDERING
===================================================== */

(function () {

  const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
  const SUPABASE_KEY = "sb_publishable_FBywhrypx6zt_0nMlFudyQ_zFiqZKTD";

  const $ = (id) => document.getElementById(id);

  /* =====================================================
     REPORT BUTTON – FEST IN HTML
     → HIER NUR FUNKTION ANBINDEN
  ===================================================== */

  document.addEventListener(
    "click",
    function (e) {
      const btn = e.target.closest("#reportBtn");
      if (!btn) return;

      e.preventDefault(); // verhindert evtl. Link-Navigation

      const modal = $("reportModal");
      if (!modal) {
        alert("Report-Fenster fehlt im HTML");
        return;
      }

      modal.style.display = "block";
      modal.style.visibility = "visible";
      modal.style.opacity = "1";
    },
    true // CAPTURE → kommt vor anderen Klick-Handlern
  );

  /* =====================================================
     REPORT MODAL SCHLIESSEN
  ===================================================== */

  document.addEventListener("click", function (e) {
    if (
      e.target.id === "closeReportModal" ||
      e.target.dataset.action === "cancel-report"
    ) {
      const modal = $("reportModal");
      if (modal) modal.style.display = "none";
    }
  });

  /* =====================================================
     REPORT FORM SENDEN
  ===================================================== */

  document.addEventListener("submit", async function (e) {
    if (e.target.id !== "reportForm") return;

    e.preventDefault();

    const textarea =
      e.target.querySelector("textarea") ||
      e.target.querySelector("input[type='text']");

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
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          description: text,
          entry_id: window.currentEntryId || null,
          page_url: location.href,
          created_at: new Date().toISOString()
        })
      });

      if (!res.ok) {
        console.error(await res.text());
        alert("Fehler beim Senden des Reports");
        return;
      }

      e.target.reset();
      const modal = $("reportModal");
      if (modal) modal.style.display = "none";

      alert("Danke! Hinweis wurde gespeichert.");

    } catch (err) {
      console.error(err);
      alert("Netzwerkfehler beim Report");
    }
  });

})();
