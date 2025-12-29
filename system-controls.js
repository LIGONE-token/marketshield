console.log("system-controls.js aktiv");

document.addEventListener("DOMContentLoaded", () => {
  const reportBtn   = document.getElementById("reportBtn");
  const reportModal = document.getElementById("reportModal");
  const closeBtn    = document.getElementById("closeReportModal");
  const reportBox   = document.querySelector(".report-modal-box");

  const openModal = () => {
    reportModal.style.display = "block";
    document.body.style.overflow = "hidden"; // Body fixieren (Mobile!)
  };
  const closeModal = () => {
    reportModal.style.display = "none";
    document.body.style.overflow = ""; // Body wieder frei
  };

  if (reportBtn && reportModal) {
    reportBtn.addEventListener("click", openModal);
    reportBtn.addEventListener("touchstart", (e) => { e.preventDefault(); openModal(); }, { passive:false });
  }

  // Schließen per Button (Click + Touch)
  if (closeBtn) {
    closeBtn.addEventListener("click", closeModal);
    closeBtn.addEventListener("touchstart", (e) => { e.preventDefault(); closeModal(); }, { passive:false });
  }

  // Klick/Tap auf Overlay schließt
  if (reportModal && reportBox) {
    reportModal.addEventListener("click", closeModal);
    reportModal.addEventListener("touchstart", closeModal, { passive:true });
    reportBox.addEventListener("click", (e) => e.stopPropagation());
    reportBox.addEventListener("touchstart", (e) => e.stopPropagation(), { passive:true });
  }

  // ESC (Laptop/Tablet mit Tastatur)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && reportModal.style.display === "block") closeModal();
  });
});

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
