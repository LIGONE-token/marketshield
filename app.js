// 🎄 Weihnachtsmodus (1.–26. Dezember)
document.addEventListener("DOMContentLoaded", () => {
  const now = new Date();
  if (now.getMonth() === 11 && now.getDate() <= 26) {
    document.body.classList.add("christmas");
  }

  const id = new URLSearchParams(location.search).get("id");
  if (id) loadFullEntry(id, false);
});

// ───────────────── CONFIG
const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
const SUPABASE_KEY = "sb_publishable_FBywhrypx6zt_0nMlFudyQ_zFiqZKTD";

// ───────────────── SUPABASE CLIENT
const supabase = {
  async select(query) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });
    return await r.json();
  },
};

// ───────────────── HILFSFUNKTIONEN
function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getHealthIcons(score) {
  if (score == null) return "";
  if (score >= 80) return "💚💚💚";
  if (score >= 60) return "💚💚";
  if (score >= 40) return "💚";
  if (score >= 20) return "🧡🧡";
  return "⚠️❗⚠️";
}

function renderProcessBar(score) {
  if (score == null) return "";
  const s = Math.max(1, Math.min(10, Number(score)));
  return `<div class="process-bar"><div style="width:${s * 10}%"></div></div>`;
}

// ───────────────── KATEGORIEN
fetch("categories.json")
  .then(r => r.json())
  .then(data => {
    const grid = document.querySelector(".category-grid");
    if (!grid) return;
    grid.innerHTML = "";
    data.categories.forEach(cat => {
      const b = document.createElement("button");
      b.textContent = cat.title;
      b.onclick = () => loadCategory(cat.title);
      grid.appendChild(b);
    });
  });

// ───────────────── SUCHE
const searchInput = document.getElementById("searchInput");
if (searchInput) {
  searchInput.addEventListener("input", runSearch);
}

async function runSearch() {
  const q = searchInput.value.trim();
  const results = document.getElementById("results");
  if (!results) return;

  if (q.length < 2) {
    results.innerHTML = "";
    return;
  }

  results.innerHTML = "<p>Suche…</p>";

  const enc = encodeURIComponent(q);
  const data = await supabase.select(
    `entries?select=id,title,summary,score,processing_score&or=` +
    `(title.ilike.%25${enc}%25,summary.ilike.%25${enc}%25,mechanism.ilike.%25${enc}%25)`
  );

  if (!data || data.length === 0) {
    results.innerHTML = "<p>Keine Treffer gefunden.</p>";
    return;
  }

  results.innerHTML = data.map(e => `
    <div class="search-result" data-id="${e.id}">
      <strong>${escapeHtml(e.title)}</strong>
      <span>${getHealthIcons(e.score)}</span>
      ${renderProcessBar(e.processing_score)}
      <div>${escapeHtml(e.summary)}</div>
    </div>
  `).join("");

  results.querySelectorAll(".search-result").forEach(el => {
    el.onclick = () => loadFullEntry(el.dataset.id);
  });
}

// ───────────────── KATEGORIE
async function loadCategory(cat) {
  const results = document.getElementById("results");
  if (!results) return;

  results.innerHTML = "<p>Lade…</p>";

  const data = await supabase.select(
    `entries?select=id,title,summary,score,processing_score&category=eq.${encodeURIComponent(cat)}`
  );

  if (!data || data.length === 0) {
    results.innerHTML = "<p>Keine Einträge.</p>";
    return;
  }

  results.innerHTML = data.map(e => `
    <div class="search-result" data-id="${e.id}">
      <strong>${escapeHtml(e.title)}</strong>
      <span>${getHealthIcons(e.score)}</span>
      ${renderProcessBar(e.processing_score)}
      <div>${escapeHtml(e.summary)}</div>
    </div>
  `).join("");

  results.querySelectorAll(".search-result").forEach(el => {
    el.onclick = () => loadFullEntry(el.dataset.id);
  });
}

// ───────────────── EINZELANSICHT (ABSÄTZE FIX)
async function loadFullEntry(id, push = true) {
  if (push) history.pushState({ id }, "", `?id=${id}`);

  const results = document.getElementById("results");
  if (!results) return;

  results.innerHTML = "<p>Lade Eintrag…</p>";

  const data = await supabase.select(`entries?select=*&id=eq.${id}`);
  if (!data || !data[0]) {
    results.innerHTML = "<p>Eintrag nicht gefunden.</p>";
    return;
  }

  const e = data[0];

  results.innerHTML = `
    <div class="entry-card full-entry">
      <h2>${escapeHtml(e.title)}</h2>
      <div>${getHealthIcons(e.score)}</div>
      ${renderProcessBar(e.processing_score)}
      <div class="entry-summary">
        ${escapeHtml(e.summary).replace(/\n/g, "<br>")}
      </div>
    </div>
  `;
}

// ───────────────── NAVIGATION
window.addEventListener("popstate", () => {
  const id = new URLSearchParams(location.search).get("id");
  if (id) loadFullEntry(id, false);
});
