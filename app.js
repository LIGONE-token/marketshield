/* =====================================================
   MarketShield – app.js (FINAL / FREEZE / GENERATOR-FEST)
   - Kategorien NUR aus categories.json (Root, neben index.html)
   - Startseite leer
   - Texte roh anzeigen (white-space: pre-wrap)
   - In summary: Markdown-Tabellen erkennen & rendern
   - Keine Platzhalter / Hinweise
   - Report-Button UNANTASTBAR
   - Render-Ziel: #results (wie in index.html)
===================================================== */

/* ================= CONFIG ================= */
const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
const SUPABASE_KEY = "sb_publishable_FBywhrypx6zt_0nMlFudyQ_zFiqZKTD";

/* ================= DOM ================= */
const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelector(sel);
function resultsBox() { return $("results"); }

/* ================= HELPERS ================= */
function escapeHtml(s) {
  if (s === null || s === undefined) return "";
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* Rohes Rendering (wie früher) */
function renderRawText(text) {
  if (!text) return "";
  return `<div style="white-space:pre-wrap;line-height:1.6;">${escapeHtml(text)}</div>`;
}

/* Summary: Rohtext + Markdown-Tabellen */
function renderSummaryWithTables(text) {
  if (!text) return "";

  const lines = String(text).split("\n");
  let html = "";
  let buffer = [];

  const flushParagraph = () => {
    if (buffer.length) {
      html += `<p>${escapeHtml(buffer.join("\n")).replace(/\n/g, "<br>")}</p>`;
      buffer = [];
    }
  };

  const isSeparator = l => /^[-\s|]+$/.test(l);
  const isPipeRow  = l => (l.match(/\|/g) || []).length >= 2;

  for (let i = 0; i < lines.length; ) {
    const line = lines[i];

    if (!line.trim()) {
      flushParagraph();
      i++;
      continue;
    }

    if (isPipeRow(line)) {
      flushParagraph();
      const rows = [];
      while (i < lines.length && (isPipeRow(lines[i]) || isSeparator(lines[i]))) {
        if (!isSeparator(lines[i])) {
          rows.push(
            lines[i].split("|").map(c => c.trim()).filter(Boolean)
          );
        }
        i++;
      }
      if (rows.length) {
        html += `<div class="summary-table-wrap"><table class="summary-table">`;
        html += "<thead><tr>";
        rows[0].forEach(c => html += `<th>${escapeHtml(c)}</th>`);
        html += "</tr></thead><tbody>";
        for (let r = 1; r < rows.length; r++) {
          html += "<tr>";
          rows[r].forEach(c => html += `<td>${escapeHtml(c)}</td>`);
          html += "</tr>";
        }
        html += "</tbody></table></div>";
      }
      continue;
    }

    buffer.push(line);
    i++;
  }

  flushParagraph();
  return html;
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

/* ================= CORE ================= */
function setResultsHTML(html) {
  const box = resultsBox();
  if (!box) return;
  box.innerHTML = `<div id="shareBox"></div>${html || ""}`;
}
function clearResults() { setResultsHTML(""); }

/* ================= LISTE ================= */
function renderList(items) {
  if (!items || !items.length) { setResultsHTML(""); return; }
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
  if (query.length < 2) { clearResults(); return; }
  const enc = encodeURIComponent(`%${query}%`);
  const data = await supa(
    `entries?select=id,title,category,type&or=(title.ilike.${enc},summary.ilike.${enc})&order=title.asc&limit=200`
  );
  renderList(data);
}

async function loadListByCategory(categoryTitle) {
  const cat = String(categoryTitle || "").trim();
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
  if (!data || !data.length) { setResultsHTML(""); return; }
  const e = data[0];

  setResultsHTML(`
    <h2>${escapeHtml(e.title)}</h2>
    <div style="opacity:.7;margin-bottom:12px;">
      ${escapeHtml(e.category || "")}
      ${e.category && e.type ? " · " : ""}
      ${escapeHtml(e.type || "")}
    </div>

    ${e.summary ? `<h3>Beschreibung</h3>${renderSummaryWithTables(e.summary)}` : ""}
    ${e.mechanism ? `<h3>Mechanismus</h3>${renderRawText(e.mechanism)}` : ""}
    ${e.scientific_note ? `<h3>Wissenschaftlicher Hinweis</h3>${renderRawText(e.scientific_note)}` : ""}
  `);

  const back = $("backHome");
  if (back) back.style.display = "block";
}

/* ================= KATEGORIEN (NUR categories.json) ================= */
async function loadCategories() {
  const grid = $$(".category-grid");
  if (!grid) return;

  try {
    // Erwartet im Root neben index.html
    const res = await fetch("./categories.json", { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const cats = await res.json(); // [{ id, title, description }]
    if (!Array.isArray(cats) || !cats.length) return;

    grid.innerHTML = cats
      .map(c => `<button class="cat-btn" data-cat="${escapeHtml(c.title)}">${escapeHtml(c.title)}</button>`)
      .join("");
  } catch (e) {
    console.error("❌ Kategorien konnten nicht geladen werden:", e);
  }
}

/* ================= SUCHE ================= */
function initSearch() {
  const input = $("searchInput");
  if (!input) return;
  input.addEventListener("input", () => {
    const q = input.value.trim();
    if (q.length < 2) { clearResults(); return; }
    loadListBySearch(q);
  });
}

/* ================= NAVIGATION ================= */
document.addEventListener("click", (e) => {
  // Report-Button bleibt UNANTASTBAR
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
  if (id) loadEntry(id);
  else clearResults(); // Startseite leer (Freeze)
});
