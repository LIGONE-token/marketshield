console.log("system-controls.js aktiv");

document.addEventListener("DOMContentLoaded", () => {

  /* ===== ZUR STARTSEITE ===== */
  const backHome = document.getElementById("backHome");
  if (backHome) {
    backHome.style.display = "block"; // sichtbar machen
    backHome.addEventListener("click", () => {
      location.href = location.origin + location.pathname;
    });
  }

  /* ===== REPORT MODAL ===== */
  const reportBtn   = document.getElementById("reportBtn");
  const reportModal = document.getElementById("reportModal");
  const closeBtn    = document.getElementById("closeReportModal");
  const reportForm  = document.getElementById("reportForm");

  if (reportBtn && reportModal) {
    reportBtn.addEventListener("click", () => {
      reportModal.style.display = "block";
    });
  }

  if (closeBtn && reportModal) {
    closeBtn.addEventListener("click", () => {
      reportModal.style.display = "none";
    });
  }

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
      reportModal.style.display = "none";
      alert("Danke! Meldung gespeichert.");
    });
  }

});
