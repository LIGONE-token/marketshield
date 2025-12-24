/* =====================================================
   MarketShield – app.js (FINAL / STABIL / SEARCH FIX)
   - Kategorien FEST im Code (immer sichtbar)
   - Suche stabil: PostgREST ilike.*term* (kein %25 Chaos)
   - Summary: Markdown-Tabellen rendern
   - Mechanismus/Scientific: roh (pre-wrap)
   - Startseite: leer (keine Platzhaltertexte)
   - Report-Button UNANTASTBAR
   - Passt zur bestehenden index.html
===================================================== */

/* ================= CONFIG ================= */
const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
const SUPABASE_KEY = "sb_publishable_FBywhrypx6zt_0nMlFudyQ_zFiqZKTD";

/* ================= FESTE KATEGORIEN ================= */
const CATEGORIES = [
  "Ernährung","Gesundheit","Medizin","Genussmittel","Risiken","Pflege",
  "Kosmetik","Hygiene","Sonnenschutz","Haushalt","Wohnen","Luftqualität",
  "Wasserqualität","Textilien","Umwelt","Chemikalien","Strahlung","Tiere",
  "Technik","Arbeit","Baumarkt","Zielgruppen","Lifestyle","Finanzen",
  "Trends","Konsum","Freizeit","Mobilität","Sicherheit","Energie"
];

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

function formatType(type) {
  if (!type) return "";
  const t = String(type).trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : "";
}

function renderRawText(text) {
  if (!text) return "";
  return `<div style="white-space:pre-wrap;line-height:1.6;">${escapeHtml(text)}</div>`;
}

/* Summary: Text + Markdown-Tabellen (|) */
function renderSummaryWithTables(text) {
  if (!text) return "";

  const lines = String(text).split("\n");
  let html = "";
  let buffer = [];

  const flushParagraph = () => {
    if (!buffer.length) return;
    html += `<p>${escapeHtml(buffer.join("\n")).replace(/\n/g, "<br>")}</p>`;
    buffer = [];
  };

  const isSeparator = (l) => /^[-\s|]+$/.test(l);
  const isPipeRow = (l) => (l.match(/\|/g) || []).length >= 2;

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
            lines[i]
              .split("|")
              .map(c => c.trim())
              .filter(Boolean)
          );
        }
        i++;
      }

      if (rows.length) {
        html += `<div class="summary-table-wrap"><table class="summary-table">`;

        html += "<thead><tr>";
        rows[0].forEach(c => html += `<th>${escapeHtml(c)}</th>`);
        html += "</tr></thead>";

        html += "<tbody>";
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

/* ================= SUPABASE (robust) ================= */
/**
 * PostgREST: baue URL sauber mit URLSearchParams (keine Encoding-Fallen)
 * path z.B. "entries"
 * params z.B. { select:"id,title", or:"(...)", order:"title.asc", limit:"200" }
 */
async function supa(path, params) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${path}`);
  if (params) url.search = new URLSearchParams(params).toString();

  const res = await fetch(url.toString(), {
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
  // shareBox IMMER erhalten (wie in index.html)
  box.innerHTML = `<div id="shareBox"></div>${html || ""}`;
}
function clearResults() { setResultsHTML(""); }

/* ================= KATEGORIEN (immer sichtbar) ================= */
function loadCategories() {
  const grid = $$(".category-grid");
  if (!grid) return;

  grid.innerHTML = CATEGORIES
    .map(c => `<button class="cat-btn" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`)
    .join("");
}

/* ================= LISTE ================= */
function renderList(items) {
  if (!items || !items.length) {
    clearResults();
    return;
  }

  setResultsHTML(
    items.map(e => `
      <div class="entry-card" data-id="${e.id}">
        <strong>${escapeHtml(e.title)}</strong><br>
        <small>
          ${escapeHtml(e.category || "")}
          ${e.category && e.type ? " · " : ""}
          ${escapeHtml(formatType(e.type))}
        </small>
      </div>
    `).join("")
  );
}

/* ================= SUCHE (FIX) ================= */
function toIlikePattern(q) {
  // PostgREST ilike nutzt * als Wildcard
  // Außerdem trimmen wir extremen Müll, ohne echte Begriffe zu zerstören.
  const clean = String(q || "").trim();
  return `*${clean}*`;
}

async function loadListBySearch(q) {
  const query = String(q || "").trim();
  if (query.length < 2) { clearResults(); return; }

  const pat = toIlikePattern(query);

  const data = await supa("entries", {
    select: "id,title,category,type",
    or: `(title.ilike.${pat},summary.ilike.${pat})`,
    order: "title.asc",
    limit: "200",
  });

  renderList(data);
}

/* ================= KATEGORIE-FILTER ================= */
async function loadListByCategory(categoryTitle) {
  const cat = String(categoryTitle || "").trim();
  if (!cat) return;

  const data = await supa("entries", {
    select: "id,title,category,type",
    category: `eq.${cat}`,
    order: "title.asc",
    limit: "500",
  });

  renderList(data);
}

/* ================= DETAIL ================= */
async function loadEntry(id) {
  const entryId = String(id || "").trim();
  if (!entryId) return;

  const data = await supa("entries", {
    id: `eq.${entryId}`,
    limit: "1",
  });

  if (!data || !data.length) { clearResults(); return; }

  const e = data[0];

  setResultsHTML(`
    <h2>${escapeHtml(e.title)}</h2>
    <div style="opacity:.7;margin-bottom:12px;">
      ${escapeHtml(e.category || "")}
      ${e.category && e.type ? " · " : ""}
      ${escapeHtml(formatType(e.type))}
    </div>

    ${e.summary ? `<h3>Beschreibung</h3>${renderSummaryWithTables(e.summary)}` : ""}
    ${e.mechanism ? `<h3>Mechanismus</h3>${renderRawText(e.mechanism)}` : ""}
    ${e.scientific_note ? `<h3>Wissenschaftlicher Hinweis</h3>${renderRawText(e.scientific_note)}` : ""}
  `);

  const back = $("backHome");
  if (back) back.style.display = "block";
}

/* ================= INPUT SEARCH ================= */
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

  // optional: Enter erzwingt Suche (falls Browser-Input-Events zicken)
  input.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const q = input.value.trim();
    if (q.length < 2) return;
    loadListBySearch(q);
  });
}

/* ================= NAVIGATION ================= */
document.addEventListener("click", (e) => {
  // Report-Button UNANTASTBAR
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
  else clearResults(); // Startseite leer, Kategorien sichtbar
});
