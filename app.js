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
  const label = `<div class="score-label">Gesundheits-Score</div>`;

  if (score >= 80) return `<div class="score-block">${label}<div class="health-score-box health-3">💚💚💚</div></div>`;
  if (score >= 60) return `<div class="score-block">${label}<div class="health-score-box health-2">💚💚</div></div>`;
  if (score >= 40) return `<div class="score-block">${label}<div class="health-score-box health-1">💚</div></div>`;
  if (score >= 20) return `<div class="score-block">${label}<div class="health-score-box health-mid">🧡🧡</div></div>`;
  return `<div class="score-block">${label}<div class="health-score-box health-bad">⚠️❗⚠️</div></div>`;
}

// ░░░░░░░░░░░░░  INDUSTRIE SCORE
function renderProcessBar(score) {
  if (score === null || score === undefined) return "";
  const s = Math.max(1, Math.min(10, Number(score)));
  let color = "#2ecc71";
  if (s >= 4 && s <= 6) color = "#f1c40f";
  if (s >= 7) color = "#e74c3c";

  return `
    <div class="score-block">
      <div class="score-label">Industrie-Verarbeitung</div>
      <div class="process-wrapper">
        <div class="process-bar-bg">
          <div class="process-bar-fill" style="width:${s * 10}%; background:${color};"></div>
        </div>
        <div class="process-bar-label">${s}/10</div>
      </div>
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

// ░░░░░░░░░░░░░  SUCHE (Live)
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

  // ░░░░░░░░░░░░░  SUCHANFRAGE SPEICHERN (nur bei Enter)
  searchInput.addEventListener("keydown", async function (e) {
    if (e.key !== "Enter") return;

    const query = this.value.trim();
    if (query.length < 2) return;

    try {
      await fetch(`${SUPABASE_URL}/rest/v1/search_queue`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query: query,
          page: location.pathname,
          user_agent: navigator.userAgent
        })
      });
    } catch (_) {
      // bewusst leer – darf niemals die Suche beeinflussen
    }
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
    </div>
  `;
}

// ░░░░░░░░░░░░░  BACK / FORWARD
window.addEventListener("popstate", () => {
  const id = new URLSearchParams(window.location.search).get("id");
  if (id) loadFullEntry(id, false);
});
