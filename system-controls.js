(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {

    /* === ZUR STARTSEITE (ORIGINALPOSITION) === */
    const backHome =
      document.getElementById("backhome") ||
      document.getElementById("backHome");

    if (backHome) {
      backHome.style.cursor = "pointer";
      backHome.addEventListener("click", () => {
        window.location.href = window.location.pathname;
      });
    }

   // === REPORT-BUTTON: MUSS KLICKEN ===
const reportBtn =
  document.getElementById("reportBtn") ||
  document.getElementById("reportbutton");

if (reportBtn) {
  reportBtn.style.cursor = "pointer";

  reportBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Sichtbare, eindeutige Reaktion (unzerstörbar)
    alert("Report-Button ist aktiv.");
  }, true);
}


  });
})();
