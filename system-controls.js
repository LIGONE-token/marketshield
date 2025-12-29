console.log("system-controls.js aktiv");

document.addEventListener("DOMContentLoaded", () => {

  /* ================= ZUR STARTSEITE ================= */
  const backHome = document.getElementById("backHome");
  if (backHome) {
    backHome.onclick = () => {
      location.href = location.origin + location.pathname;
    };
  }

  /* ================= REPORT BUTTON ================= */
  const reportBtn   = document.getElementById("reportBtn");
  const reportModal = document.getElementById("reportModal");
  const closeBtn    = document.getElementById("closeReportModal");
  const reportForm  = document.getElementById("reportForm");

  if (reportBtn && reportModal) {
    reportBtn.onclick = () => {
      reportModal.style.display = "block";
    };
  }

  if (closeBtn && reportModal) {
    closeBtn.onclick = () => {
      reportModal.style.display = "none";
    };
  }

  if (reportForm) {
    reportForm.onsubmit = async (e) => {
      e.preventDefault();

      const text = reportForm.querySelector("textarea")?.value?.trim();
      if (!text || text.length < 3) {
        alert("Bitte Beschreibung eingeben.");
        return;
      }

      await fetch("https://thrdlycfwlsegriduqvw.supabase.co/rest/v1/reports", {
        method: "POST",
        headers: {
          apikey: "sb_publishable_FBywhrypx6zt_0nMlFudyQ_zFiqZKTD",
          Authorization: "Bearer sb_publishable_FBywhrypx6zt_0nMlFudyQ_zFiqZKTD",
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
    };
  }

});
