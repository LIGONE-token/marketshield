/* =====================================================
   MarketShield – system-controls.js
   SYSTEMFUNKTIONEN (FINAL / SHARE-SICHER / STABIL)
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
     UI ROOT – STABILER ANKER
  ===================================================== */
  function ensureUIRoot() {
    let root = $("uiRoot");
    if (root) return root;

    root = document.createElement("div");
    root.id = "uiRoot";
    root.style.marginTop = "20px";
    root.style.padding = "10px";
    root.style.borderTop = "1px solid #ddd";

    document.body.appendChild(root);
    log("uiRoot erstellt");

    return root;
  }

  /* =====================================================
     HELFER – KORREKTE BEITRAGS-URL
  ===================================================== */
  function getEntryUrl(entryId) {
    const base = location.origin + location.pathname;
    return entryId ? `${base}?id=${entryId}` : base;
  }

  /* =====================================================
     UI ACTIONS – SOCIAL / COPY / PRINT / LEGAL
  ===================================================== */
  window.renderUIActions = function (entry) {
    const root = ensureUIRoot();

    const entryId = window.currentEntryId || null;
    const shareUrl = encodeURIComponent(getEntryUrl(entryId));
    const title = entry?.title || "MarketShield – Information";
    const shortText =
      `MarketShield: ${title}`.slice(0, 200); // kurz & teilbar

    const shareText = encodeURIComponent(`${shortText}\n${getEntryUrl(entryId)}`);

    root.innerHTML = `
      <div class="ui-actions">

        <div class="ui-buttons">
          <button id="shareWa">WhatsApp</button>
          <button id="shareFb">Facebook</button>
          <button id="shareX">X</button>
          <button id="shareTg">Telegram</button>
          <button id="copyLink">Kopieren</button>
          <button id="printPage">Drucken</button>
        </div>

        <div class="ui-legal">
          <a href="#" id="legalHint">Rechtlicher Hinweis</a>
        </div>

      </div>
    `;

    /* ===== SOCIAL SHARING (BEITRAGSGENAU) ===== */

    $("shareFb").onclick = () =>
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
        "_blank"
      );

    $("shareX").onclick = () =>
      window.open(
        `https://twitter.com/intent/tweet?text=${shareText}`,
        "_blank"
      );

    $("shareTg").onclick = () =>
      window.open(
        `https://t.me/share/url?url=${shareUrl}&text=${encodeURIComponent(shortText)}`,
        "_blank"
      );

    /* ===== COPY / PRINT ===== */

    $("copyLink").onclick = () => {
      navigator.clipboard.writeText(getEntryUrl(entryId));
      alert("Beitrags-Link kopiert");
    };

    $("printPage").onclick = () => window.print();

    /* ===== RECHTLICHER HINWEIS ===== */

    $("legalHint").onclick = (e) => {
      e.preventDefault();
      alert(
        "MarketShield dient ausschließlich der Information.\n" +
        "Keine Beratung, keine Gewähr.\n" +
        "Inhalte können unvollständig oder fehlerhaft sein."
      );
    };

    log("UI Actions (beitragsgenau) gerendert");
  };

  /* =====================================================
     REPORT BUTTON – IMMER KLICKBAR
  ===================================================== */
  document.addEventListener("click", function (e) {
    const trigger = e.target.closest("#reportBtn");
    if (!trigger) return;

    e.preventDefault();

    const modal = $("reportModal");
    if (!modal) {
      alert("Report-Fenster nicht gefunden");
      return;
    }

    modal.style.display = "block";
    modal.style.visibility = "visible";
    modal.style.opacity = "1";

    log("Report geöffnet");
  });

  /* =====================================================
     REPORT MODAL – SCHLIESSEN
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
        log("Report geschlossen");
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
            entry_id: window.currentEntryId || null,
            page_url: getEntryUrl(window.currentEntryId),
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
     INIT + SELBSTHEILUNG
  ===================================================== */
  function bindAll() {
    ensureUIRoot();
    bindReportClose();
    bindReportSubmit();
  }

  document.addEventListener("DOMContentLoaded", bindAll);

  new MutationObserver(bindAll).observe(document.body, {
    childList: true,
    subtree: true
  });

})();
