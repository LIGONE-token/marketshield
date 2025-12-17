// 🎄 Weihnachtsmodus (1.–26. Dezember)
document.addEventListener("DOMContentLoaded", function () {
  const now = new Date();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  if (m === 12 && d >= 1 && d <= 26) {
    document.body.classList.add("christmas");
  }

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (id) loadFullEntry(id, false);
});

// ░░░░░░░░░░░░░ KONFIGURATION
const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
const SUPABASE_KEY = "sb_publishable_FBywhrypx6zt_0nMlFudyQ_zFiqZKTD";

// ░░░░░░░░░░░░░ SUPABASE CLIENT
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

// ░░░░░░░░░░░░░ KATEGORIEN
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

// ░░░░░░░░░░░░░ UI HELFER
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

// ░░░░░░░░░░░░░ SUCHE
const searchInput = document.getElementById("searchInput");

if (searchInput) {
  // Live-Suche
  searchInput.addEventListener("input", runSearch);

  // Enter = Suche + Logging
  searchInput.addEventListener("keydown", async e => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    await logSearch(searchInput.value);
    runSearch();
  });
}

async function runSearch() {
  const qRaw = searchInput.value.trim();
  const results = document.getElementById("results");
  if (!results) return;

  if (qRaw.length < 2) {
    results.innerHTML = "";
    return;
  }

  results.innerHTML = "<p>Suche…</p>";
  const q = encodeURIComponent(qRaw);

  const data = await supabase.select(
    `entries?select=id,title,summary,score,processing_score&or=` +
    `(title.ilike.%25${q}%25,summary.ilike.%25${q}%25,mechanism.ilike.%25${q}%25)`
  );

  if (!data || data.length === 0) {
    results.innerHTML = `
      <div class="no-results">
        <strong>Keine Treffer gefunden</strong><br>
        Dieser Begriff ist noch nicht erfasst.
      </div>`;
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

// ░░░░░░░░░░░░░ SUCHLOG
async function logSearch(query) {
  const q = query.trim();
  if (q.length < 2) return;

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/search_queue`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: q,
        page: location.pathname,
        user_agent: navigator.userAgent,
      }),
    });
  } catch (_) {}
}

// ░░░░░░░░░░░░░ KATEGORIE
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

// ░░░░░░░░░░░░░ EINZELANSICHT
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
    <h2>${escapeHtml(e.title)}</h2>
    <div>${getHealthIcons(e.score)}</div>
    ${renderProcessBar(e.processing_score)}
    <p>${escapeHtml(e.summary).replace(/\n/g, "<br>")}</p>
  `;
}

// ░░░░░░░░░░░░░ NAVIGATION
window.addEventListener("popstate", () => {
  const id = new URLSearchParams(location.search).get("id");
  if (id) loadFullEntry(id, false);
});

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
