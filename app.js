/* =====================================================
   MarketShield – app.js
   STABIL / ROHES RENDERING / WIE VORHER
   Passend zur bestehenden index.html
===================================================== */

/* ================= CONFIG ================= */
const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
const SUPABASE_KEY = "sb_publishable_FBywhrypx6zt_0nMlFudyQ_zFiqZKTD";

/* ================= DOM ================= */
const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelector(sel);

function resultsBox() {
  return $("results");
}

/* ================= HELPERS ================= */

/** HTML sicher escapen */
function escapeHtml(s) {
  if (s === null || s === undefined) return "";
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/** 
 * 🔑 WIE FRÜHER:
 * Text 1:1 anzeigen, inkl. Absätzen & Leerzeilen
 */
function renderRawText(text) {
  if (!text) return "";
  return `
    <div style="white-space:pre-wrap;line-height:1.6;">
      ${escapeHtml(text)}
    </div>
  `;
}

/* ================= SUPABASE ================= */
async function supa(query) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  return res.json();
}

/* ================= CORE RENDER ================= */
function setResultsHTML(html) {
  const box = resultsBox();
  if (!box) return;
  // shareBox immer erhalten
  box.innerHTML = `<div id="shareBox"></div>${html || ""}`;
}

function clearResults() {
  setResultsHTML(`
     `);
}

/* ================= LISTE ================= */
function renderList(items) {
  if (!items || !items.length) {
    setResultsHTML("<p>Keine Treffer gefunden.</p>");
    return;
  }

  setResultsHTML(
    items.map(e => `
      <div class="entry-card" data-id="${e.id}">
        <strong>${escapeHtml(e.title)}</strong><br>
        <small>
          ${escapeHtml(e.category || "")}
          ${e.category && e.type ? " · " : ""}
          ${escapeHtml(e.type || "")}
        </small>
      </div>
    `).join("")
  );
}

async function loadListBySearch(q) {
  const query = q.trim();
  if (query.length < 2) {
    clearResults();
    return;
  }

  const enc = encodeURIComponent(`%${query}%`);
  const data = await supa(
    `entries?select=id,title,category,type&or=(title.ilike.${enc},summary.ilike.${enc})&order=title.asc&limit=200`
  );
  renderList(data);
}

async function loadListByCategory(category) {
  const cat = String(category || "").trim();
  if (!cat) return;

  const data = await supa(
    `entries?select=id,title,category,type&category=eq.${encodeURIComponent(cat)}&order=title.asc&limit=500`
  );
  renderList(data);
}

/* ================= DETAIL ================= */
async function loadEntry(id) {
  const entryId = String(id || "").trim();
  if (!entryId) return;

  const data = await supa(`entries?id=eq.${entryId}&limit=1`);
  if (!data || !data.length) {
    setResultsHTML("<p>Eintrag nicht gefunden.</p>");
    return;
  }

  const e = data[0];

  setResultsHTML(`
    <h2>${escapeHtml(e.title)}</h2>
    <div style="opacity:.7;margin-bottom:12px;">
      ${escapeHtml(e.category || "")}
      ${e.category && e.type ? " · " : ""}
      ${escapeHtml(e.type || "")}
    </div>

    <h3>Beschreibung</h3>
    ${renderRawText(e.summary)}

    ${e.mechanism ? `<h3>Mechanismus</h3>${renderRawText(e.mechanism)}` : ""}
    ${e.scientific_note ? `<h3>Wissenschaftlicher Hinweis</h3>${renderRawText(e.scientific_note)}` : ""}
  `);

  const back = $("backHome");
  if (back) back.style.display = "block";
}

/* ================= KATEGORIEN ================= */
async function loadCategories() {
  const grid = $$(".category-grid");
  if (!grid) return;

  const data = await supa("entries?select=category");
  const cats = [...new Set(data.map(d => d.category).filter(Boolean))].sort();

  grid.innerHTML = cats
    .map(c => `<button class="cat-btn" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`)
    .join("");
}

/* ================= SUCHE ================= */
function initSearch() {
  const input = $("searchInput");
  if (!input) return;

  input.addEventListener("input", () => {
    const q = input.value.trim();
    if (q.length < 2) {
      clearResults();
      return;
    }
    loadListBySearch(q);
  });
}

/* ================= NAVIGATION ================= */
document.addEventListener("click", (e) => {
  // Report-Button bleibt UNBERÜHRT
  if (e.target.closest("#reportBtn")) return;

  const card = e.target.closest(".entry-card");
  if (card) {
    history.pushState(null, "", "?id=" + card.dataset.id);
    loadEntry(card.dataset.id);
    return;
  }

  const cat = e.target.closest(".cat-btn");
  if (cat) {
    loadListByCategory(cat.dataset.cat);
    return;
  }

  const back = e.target.closest("#backHome");
  if (back) {
    back.style.display = "none";
    history.pushState(null, "", location.pathname);
    clearResults();
  }
});

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
  initSearch();

  const id = new URLSearchParams(location.search).get("id");
  if (id) {
    loadEntry(id);
  } else {
    clearResults(); // Startseite leer – wie vorher
  }
});
