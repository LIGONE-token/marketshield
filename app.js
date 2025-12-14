// 🎄 Weihnachtsmodus (1.–26. Dezember)
document.addEventListener("DOMContentLoaded", function () {
  const now = new Date();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  if (m === 12 && d >= 1 && d <= 26) {
    document.body.classList.add("christmas");
  }

  // 🔗 Deep-Link direkt laden
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (id) loadFullEntry(id, false);
});

// ░░░░░░░░░░░░░  KONFIGURATION
const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
const SUPABASE_KEY = "sb_publishable_FBywhrypx6zt_0nMlFudyQ_zFiqZKTD";

// ░░░░░░░░░░░░░  SUPABASE CLIENT
const supabase = {
  async select(query) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });
    return await response.json();
  },
};

// ░░░░░░░░░░░░░  KATEGORIEN LADEN
fetch("categories.json")
  .then((r) => r.json())
  .then((data) => {
    const grid = document.querySelector(".category-grid");
    if (!grid) return;

    grid.innerHTML = "";
    data.categories.forEach((cat) => {
      const btn = document.createElement("button");
      btn.textContent = cat.title;
      btn.addEventListener("click", () => loadCategory(cat.title));
      grid.appendChild(btn);
    });
  });

// ░░░░░░░░░░░░░  HEALTH SCORE
function getHealthIcons(score) {
  if (!score || score === 0) return "";
  if (score >= 80) return `<div class="health-score-box health-3">💚💚💚</div>`;
  if (score >= 60) return `<div class="health-score-box health-2">💚💚</div>`;
  if (score >= 40) return `<div class="health-score-box health-1">💚</div>`;
  if (score >= 20) return `<div class="health-score-box health-mid">🧡🧡</div>`;
  return `<div class="health-score-box health-bad">⚠️❗⚠️</div>`;
}

// ░░░░░░░░░░░░░  INDUSTRIE SCORE
function renderProcessBar(score) {
  if (score === null || score === undefined) return "";
  const s = Math.max(1, Math.min(10, Number(score)));
  let color = "#2ecc71";
  if (s >= 4 && s <= 6) color = "#f1c40f";
  if (s >= 7) color = "#e74c3c";

  return `
    <div class="process-wrapper">
      <div class="process-bar-bg">
        <div class="process-bar-fill" style="width:${s * 10}%; background:${color};"></div>
      </div>
      <div class="process-bar-label">${s}/10</div>
    </div>
  `;
}

// ░░░░░░░░░░░░░  KOPIERFUNKTION
function copyEntry(title, summary, url) {
  const text = `${title}\n\n${summary}\n\nMehr Infos:\n${url}`;
  navigator.clipboard
    .writeText(text)
    .then(() => alert("✔ Eintrag wurde kopiert!"))
    .catch(() => alert("❌ Kopieren fehlgeschlagen."));
}

// ░░░░░░░░░░░░░  SHARE-BUTTONS (FIX!)
function renderShareButtons(entry) {
  const pageUrl = window.location.href;
  const shareText = `Interessanter Beitrag auf MarketShield:\n${entry.title}\n${pageUrl}`;

  return `
    <div class="share-box">
      <h3 class="share-title">Teilen & Export</h3>
      <div class="share-buttons">

        <button class="share-btn" onclick="window.open('https://wa.me/?text=${encodeURIComponent(shareText)}','_blank')">📱 WhatsApp</button>

        <button class="share-btn" onclick="window.open('https://t.me/share/url?url=${encodeURIComponent(pageUrl)}','_blank')">✈️ Telegram</button>

        <button class="share-btn" onclick="window.open('https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}','_blank')">📘 Facebook</button>

        <button class="share-btn" onclick="window.open('https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}','_blank')">🐦 X</button>

        <button class="share-btn" onclick="copyEntry('${entry.title.replace(/'/g,"\\'")}', \`${(entry.summary||"").replace(/`/g,"\\`")}\`, '${pageUrl}')">📋 Kopieren</button>

        <button class="share-btn" onclick="window.print()">🖨 Drucken / PDF</button>
      </div>
    </div>
  `;
}

// ░░░░░░░░░░░░░  EINZELANSICHT (FIX: echte URL!)
async function loadFullEntry(id, push = true) {
  if (push) {
    history.pushState({ id }, "", `?id=${id}`);
  }

  const results = document.getElementById("results");
  if (!results) return;

  results.innerHTML = "<p>Lade Eintrag…</p>";

  const query = `entries?select=*&id=eq.${encodeURIComponent(id)}`;
  const data = await supabase.select(query);

  if (!data || !data[0]) {
    results.innerHTML = "<p>Fehler beim Laden.</p>";
    return;
  }

  const e = data[0];

  results.innerHTML = `
    <div class="entry-card full-entry">
      <h2 class="entry-title">${escapeHtml(e.title || "")}</h2>

      <div class="full-metrics">
        ${e.score > 0 ? `<div class="full-health">${getHealthIcons(e.score)}</div>` : ""}
        ${e.processing_score > 0 ? `<div class="full-process">${renderProcessBar(e.processing_score)}</div>` : ""}
      </div>

      <p class="entry-summary">${escapeHtml(e.summary || "")}</p>
      ${renderDetails(e)}
      ${renderShareButtons(e)}
    </div>
  `;
}

// ░░░░░░░░░░░░░  BACK / FORWARD SUPPORT
window.addEventListener("popstate", () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (id) loadFullEntry(id, false);
});
