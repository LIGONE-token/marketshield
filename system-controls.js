/* =====================================================
   MarketShield – system-controls.js
   MINIMAL / STABIL / OHNE NEBENEFFEKTE
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

  const reportBtn   = document.getElementById("reportBtn");
  const reportModal = document.getElementById("reportModal");
  const closeBtn    = document.getElementById("closeReportModal");

  // 🔴 ABSOLUTER BASISCHECK
  if (!reportBtn) {
    console.error("❌ reportBtn nicht gefunden");
    return;
  }
  if (!reportModal) {
    console.error("❌ reportModal nicht gefunden");
    return;
  }

  // ✅ ÖFFNEN
  reportBtn.addEventListener("click", () => {
    reportModal.style.display = "block";
  });

  // ✅ SCHLIESSEN (Button)
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      reportModal.style.display = "none";
    });
  }

  // ✅ SCHLIESSEN (Overlay)
  reportModal.addEventListener("click", (e) => {
    if (e.target === reportModal) {
      reportModal.style.display = "none";
    }
  });

  console.log("✅ Report-Button aktiv");
});
