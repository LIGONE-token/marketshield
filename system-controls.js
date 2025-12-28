/* =====================================================
   MarketShield – system-controls.js
   UI-KLICK-LOGIK (FIXED / STABIL)
===================================================== */

(function () {

  const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
  const SUPABASE_KEY = "sb_publishable_FBywhrypx6zt_0nMlFudyQ_zFiqZKTD";

  const $ = (id) => document.getElementById(id);

  function getEntryUrl() {
    const base = location.origin + location.pathname;
    return window.currentEntryId ? `${base}?id=${window.currentEntryId}` : base;
  }

  /* =====================================================
     1️⃣ REPORTBUTTON – EINZIGER CAPTURE-LISTENER
  ===================================================== */
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("#reportBtn");
    if (!btn) return;

    e.preventDefault(); // ❗ reicht vollkommen

    const modal = $("reportModal");
    if (!modal) {
      alert("Report-Modal fehlt im HTML");
      return;
    }

    modal.style.display = "block";
  }, true); // ✅ capture, aber KEIN stopPropagation

  /* =====================================================
     2️⃣ REPORT MODAL SCHLIESSEN
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
     3️⃣ REPORT SENDEN
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
     4️⃣ ZUR STARTSEITE
  ===================================================== */
  document.addEventListener("click", (e) => {
    const home =
      e.target.closest("#backHome") ||
      e.target.closest('[data-action="home"]');

    if (!home) return;

    e.preventDefault();
    location.href = location.origin + location.pathname;
  });

  /* =====================================================
     5️⃣ SOCIAL BUTTONS
  ===================================================== */
  document.addEventListener("click", (e) => {
    const t = e.target;

    const url = encodeURIComponent(getEntryUrl());
    const title = encodeURIComponent(
      document.querySelector("h2")?.innerText || "MarketShield"
    );

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
     6️⃣ KOPIEREN
  ===================================================== */
  document.addEventListener("click", async (e) => {
    if (!e.target.closest("#copyLink")) return;

    e.preventDefault();
    await navigator.clipboard.writeText(getEntryUrl());
    alert("Link kopiert");
  });

  /* =====================================================
     7️⃣ DRUCKEN
  ===================================================== */
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#printPage")) return;

    e.preventDefault();
    window.print();
  });

  /* =====================================================
     8️⃣ RECHTLICHER HINWEIS
  ===================================================== */
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#legalHint")) return;

    e.preventDefault();
    alert(
      "MarketShield dient der Information.\n" +
      "Keine Beratung. Angaben ohne Gewähr."
    );
  });

})();
