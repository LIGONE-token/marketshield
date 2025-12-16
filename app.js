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
  .then(r => r.json())
  .then(data => {
    const grid = document.querySelector(".category-grid");
    if (!grid) return;

    grid.innerHTML = "";
    data.categories.forEach(cat => {
      const btn = document.createElement("button");
      btn.textContent = cat.title;
      btn.addEventListener("click", () => loadCategory(cat.title));
      grid.appendChild(btn);
    });
  });

// ░░░░░░░░░░░░░  HEALTH SCORE
function getHealthIcons(score) {
  if (score === null || score === undefined) return "";
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

// ░░░░░░░░░░░░░  HTML ESCAPE
function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ░░░░░░░░░░░░░  KOPIERFUNKTION
function copyEntry(title, summary, url) {
  const text = `${title}\n\n${summary}\n\nMehr Infos:\n${url}`;
  navigator.clipboard.writeText(text)
    .then(() => alert("✔ Eintrag wurde kopiert!"))
    .catch(() => alert("❌ Kopieren fehlgeschlagen."));
}

// ░░░░░░░░░░░░░  SHARE-BUTTONS
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

// ░░░░░░░░░░░░░  DETAILS
function renderList(title, arr) {
  if (!arr || arr.length === 0) return "";
  return `<h3>${title}</h3><ul>${arr.map(v => `<li>• ${escapeHtml(v)}</li>`).join("")}</ul>`;
}

function renderDetails(e) {
  return `
    ${e.mechanism ? `<h3>Was steckt dahinter?</h3><p>${escapeHtml(e.mechanism)}</p>` : ""}
    ${renderList("Positive Effekte", e.effects_positive)}
    ${renderList("Negative Effekte", e.effects_negative)}
    ${renderList("Risikogruppen", e.risk_groups)}
    ${renderList("Synergien", e.synergy)}
    ${renderList("Natürliche Quellen", e.natural_sources)}
    ${e.scientific_note ? `<h3>Wissenschaftlicher Hinweis</h3><p>${escapeHtml(e.scientific_note)}</p>` : ""}
  `;
}

// ░░░░░░░░░░░░░  SUCHE
const searchInput = document.getElementById("searchInput");
if (searchInput) {
  searchInput.addEventListener("input", async function () {
    const raw = this.value.trim();
    const results = document.getElementById("results");
    if (!results) return;

    if (raw.length < 2) {
      results.innerHTML = "";
      return;
    }

    results.innerHTML = "<p>Suche…</p>";

    const q = encodeURIComponent(raw);
    const query =
      `entries?select=id,title,summary,score,processing_score` +
      `&or=(title.ilike.%25${q}%25,summary.ilike.%25${q}%25,mechanism.ilike.%25${q}%25)`;

    const data = await supabase.select(query);

    results.innerHTML = data.map(entry => `
      <div class="search-result" data-id="${entry.id}">
        <div class="search-title">
          ${escapeHtml(entry.title)}
          ${getHealthIcons(entry.score)}
          <span class="search-arrow">›</span>
        </div>
        ${renderProcessBar(entry.processing_score)}
        <div class="search-one-line">${escapeHtml(entry.summary)}</div>
        <div class="search-cta">Details ansehen</div>
      </div>
    `).join("");

    results.querySelectorAll(".search-result").forEach(card => {
      card.addEventListener("click", () => loadFullEntry(card.dataset.id));
    });
  });
}

// ░░░░░░░░░░░░░  KATEGORIE
async function loadCategory(categoryName) {
  const results = document.getElementById("results");
  if (!results) return;

  results.innerHTML = "<p>Lade Daten…</p>";

  const query = `entries?select=id,title,summary,score,processing_score&category=eq.${encodeURIComponent(categoryName)}`;
  const data = await supabase.select(query);

  results.innerHTML = data.map(entry => `
    <div class="entry-card category-card" data-id="${entry.id}">
      <div class="search-title">
        ${escapeHtml(entry.title)}
        ${getHealthIcons(entry.score)}
        <span class="search-arrow">›</span>
      </div>
      ${renderProcessBar(entry.processing_score)}
      <div class="search-one-line">${escapeHtml(entry.summary)}</div>
      <div class="search-cta">Details ansehen</div>
    </div>
  `).join("");

  results.querySelectorAll(".category-card").forEach(card => {
    card.addEventListener("click", () => loadFullEntry(card.dataset.id));
  });
}

// ░░░░░░░░░░░░░  EINZELANSICHT
async function loadFullEntry(id, push = true) {
  if (push) history.pushState({ id }, "", `?id=${id}`);

  const results = document.getElementById("results");
  if (!results) return;

  results.innerHTML = "<p>Lade Eintrag…</p>";

  const data = await supabase.select(`entries?select=*&id=eq.${encodeURIComponent(id)}`);
  const e = data[0];

  results.innerHTML = `
    <div class="entry-card full-entry">
      <h2>${escapeHtml(e.title)}</h2>
      ${getHealthIcons(e.score)}
      ${renderProcessBar(e.processing_score)}
      <div class="entry-summary">${escapeHtml(e.summary).replace(/\n/g,"<br>")}</div>
      ${renderDetails(e)}
      ${renderShareButtons(e)}
    </div>
  `;
}

// ░░░░░░░░░░░░░  BACK / FORWARD
window.addEventListener("popstate", () => {
  const id = new URLSearchParams(window.location.search).get("id");
  if (id) loadFullEntry(id, false);
});
