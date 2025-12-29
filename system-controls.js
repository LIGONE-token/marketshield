console.log("system-controls.js aktiv (FINAL)");

// 🔑 Supabase ANON Key
const SUPABASE_ANON_KEY = "sb_publishable_JHb4LBhP26eI7BgDS1jIkw_4OYn3-F9";

document.addEventListener("DOMContentLoaded", () => {

  /* ===== ZUR STARTSEITE ===== */
  const backHome = document.getElementById("backHome");
  if (backHome) {
    backHome.style.display = "block";
    backHome.addEventListener("click", () => {
      location.href = location.origin + location.pathname;
    });
  }

  /* ===== REPORT MODAL ===== */
  const reportBtn   = document.getElementById("reportBtn");
  const reportModal = document.getElementById("reportModal");
  const closeBtn    = document.getElementById("closeReportModal");
  const reportBox   = document.querySelector(".report-modal-box");
  const reportForm  = document.getElementById("reportForm");

  if (!reportBtn || !reportModal) {
    console.warn("❌ Report-Elemente nicht gefunden");
    return;
  }

  const openModal = () => {
    reportModal.style.display = "block";
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    reportModal.style.display = "none";
    document.body.style.overflow = "";
  };

  // Öffnen
  reportBtn.addEventListener("click", openModal);

  // Schließen per Button
  if (closeBtn) {
    closeBtn.addEventListener("click", closeModal);
  }

  // Schließen per Overlay
  if (reportBox) {
    reportModal.addEventListener("click", closeModal);
    reportBox.addEventListener("click", (e) => e.stopPropagation());
  }

  // ESC (Desktop)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && reportModal.style.display === "block") {
      closeModal();
    }
  });

  /* ===== REPORT SENDEN ===== */
  if (reportForm) {
    reportForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const text = reportForm.querySelector("textarea")?.value.trim();
      if (!text || text.length < 3) {
        alert("Bitte Beschreibung eingeben.");
        return;
      }

      await fetch("https://thrdlycfwlsegriduqvw.supabase.co/rest/v1/reports", {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          description: text,
          entry_id: window.currentEntryId || null,
          page_url: location.href,
          created_at: new Date().toISOString()
        })
      });

      reportForm.reset();
      closeModal();
      alert("Danke! Meldung gespeichert.");
    });
  }

});
