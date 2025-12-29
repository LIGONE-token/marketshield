// 🔑 SUPABASE – ANON PUBLIC KEY (neu, rotiert)
const SUPABASE_ANON_KEY = "sb_publishable_JHb4LBhP26eI7BgDS1jIkw_4OYn3-F9";

console.log("system-controls.js FINAL geladen");

/* ================= REPORT BUTTON – IMMER AKTIV ================= */
function bindReportButton() {
  const btn = document.getElementById("reportBtn");
  const modal = document.getElementById("reportModal");
  const close = document.getElementById("closeReportModal");
  const form = document.getElementById("reportForm");

  if (btn && modal && !btn.dataset.bound) {
    btn.dataset.bound = "1";
    btn.addEventListener("click", () => {
      modal.style.display = "block";
    });
    console.log("✅ ReportButton gebunden");
  }

  if (close && modal && !close.dataset.bound) {
    close.dataset.bound = "1";
    close.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  if (form && !form.dataset.bound) {
    form.dataset.bound = "1";
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const text = form.querySelector("textarea")?.value.trim();
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

      form.reset();
      modal.style.display = "none";
      alert("Danke! Meldung gespeichert.");
    });
  }
}

/* ================= SOFORT + SELBSTHEILUNG ================= */
bindReportButton();
setInterval(bindReportButton, 500);
