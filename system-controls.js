/* =====================================================
   MarketShield – system-controls.js
   UI-KLICK-LOGIK (FINAL / MINIMAL / SICHER)
===================================================== */

(function () {
  const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
  const SUPABASE_KEY = "sb_publishable_FBywhrypx6zt_0nMlFudyQ_zFiqZKTD";

  const $ = (id) => document.getElementById(id);

  /* =====================================================
     HILFE: Beitrags-URL
  ===================================================== */
  function getEntryUrl() {
    const base = location.origin + location.pathname;
    return window.currentEntryId ? `${base}?id=${window.currentEntryId}` : base;
  }

  /* =====================================================
     REPORTBUTTON (FEST IN HTML)
  ===================================================== */
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("#reportBtn");
    if (!btn) return;

    e.preventDefault();
    e.stopPropagation();

    const modal = $("reportModal");
    if (!modal) {
      alert("Report-Modal fehlt im HTML");
      return;
    }

    modal.style.display = "block";
  }, true);

  /* =====================================================
     REPORT SCHLIESSEN
  ===================================================== */
  document.addEventListener("click", (e) => {
    if (
      e.target.id === "closeReportModal" ||
      e.target.dataset.action === "cancel-report"
    ) {
      const modal = $("reportModal");
      if (modal) modal.style.display = "none";
    }
  });

  /* =====================================================
     REPORT SENDEN
  ===================================================== */
  document.addEventListener("submit", async (e) => {
    if (e.target.id !== "reportForm") return;

    e.preventDefault();

    const ta = e.target.querySelector("textarea");
    const text = ta?.value?.trim();
    if (!text || text.length < 3) {
      alert("Bitte Beschreibung eingeben.");
      return;
    }

    try {
      await fetch(`${SUPABASE_URL}/rest/v1/reports`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          description: text,
          entry_id: window.currentEntryId || null,
          page_url: getEntryUrl(),
          created_at: new Date().toISOString()
        })
      });

      e.target.reset();
      $("reportModal").style.display = "none";
      alert("Danke! Hinweis gespeichert.");
    } catch {
      alert("Fehler beim Senden.");
    }
  });

  /* =====================================================
     ZUR STARTSEITE (FESTER LINK ODER BUTTON)
  ===================================================== */
  document.addEventListener("click", (e) => {
    const home =
      e.target.closest("#backHome") ||
      e.target.closest('[data-action="home"]');

    if (!home) return;

    e.preventDefault();
    e.stopPropagation();

    location.href = location.origin + location.pathname;
  }, true);

  /* =====================================================
     SOCIAL BUTTONS (FEST IN HTML)
  ===================================================== */
  document.addEventListener("click", (e) => {
    const t = e.target;

    const url = encodeURIComponent(getEntryUrl());
    const title = encodeURIComponent(document.querySelector("h2")?.innerText || "MarketShield");

    if (t.closest("#shareFb"))
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`);

    if (t.closest("#shareX"))
      window.open(`https://twitter.com/intent/tweet?text=${title}%0A${url}`);

    if (t.closest("#shareTg"))
      window.open(`https://t.me/share/url?url=${url}&text=${title}`);

    if (t.closest("#shareWa"))
      window.open(`https://wa.me/?text=${title}%0A${url}`);
  });

  /* =====================================================
     KOPIEREN
  ===================================================== */
  document.addEventListener("click", async (e) => {
    if (!e.target.closest("#copyLink")) return;

    e.preventDefault();
    e.stopPropagation();

    await navigator.clipboard.writeText(getEntryUrl());
    alert("Link kopiert");
  }, true);

  /* =====================================================
     DRUCKEN
  ===================================================== */
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#printPage")) return;

    e.preventDefault();
    e.stopPropagation();

    window.print();
  }, true);

  /* =====================================================
     RECHTLICHER HINWEIS (KLEINER LINK UNTER TITEL)
  ===================================================== */
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#legalHint")) return;

    e.preventDefault();
    e.stopPropagation();

    alert(
      "MarketShield dient der Information.\n" +
      "Keine Beratung. Angaben ohne Gewähr."
    );
  }, true);

})();
