/* =====================================================
   MarketShield – app.js (FINAL / STABIL / SEARCH FIX)
   - Kategorien FEST im Code (immer sichtbar)
   - Suche stabil: PostgREST ilike.*term*
   - Summary: Markdown-Tabellen rendern
   - Mechanismus/Scientific: roh (pre-wrap)
   - Startseite: leer (keine Platzhaltertexte)
   - Report-Button UNANTASTBAR
   - SCORES: exakt wie vorher (Herzen + Balken)
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

/* ================= SUMMARY + TABELLEN ================= */
function renderSummaryWithTables(text) {
  if (!text) return "";

  // 🔧 NORMALISIERUNG: escaped Newlines → echte Zeilenumbrüche
  const normalized = String(text)
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n\\n/g, "\n\n")
    .replace(/\\n/g, "\n");

  const lines = normalized.split("\n");
  let html = "";
  let buffer = [];

  const flushParagraph = () => {
    if (!buffer.length) return;
    html += `<p>${escapeHtml(buffer.join(" ")).trim()}</p>`;
    buffer = [];
  };

  const isSeparator = (l) => /^[-\s|]+$/.test(l);
  const isPipeRow = (l) => (l.match(/\|/g) || []).length >= 2;

  for (let i = 0; i < lines.length; ) {
    const line = lines[i].trim();

    // ⬇️ LEERZEILE = neuer Absatz
    if (!line) {
      flushParagraph();
      i++;
      continue;
    }

    // ⬇️ MARKDOWN-TABELLE
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

/* ================= SCORES ================= */
function renderHealth(score) {
  const n = Number(score);
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n >= 80) return "💚💚💚";
  if (n >= 60) return "💚💚";
  if (n >= 40) return "💚";
  if (n >= 20) return "💛";   // ← GELB statt ROT
  return "⚠️❗⚠️";
}

function renderIndustry(score) {
  const n = Number(score);
  if (!Number.isFinite(n) || n <= 0) return "";
  const w = Math.round((n / 10) * 80);
  return `
    <div style="width:80px;height:8px;background:#e0e0e0;border-radius:6px;overflow:hidden;">
      <div style="width:${w}px;height:8px;background:#2e7d32;"></div>
    </div>
  `;
}

/* ================= SCORE BLOCK (EXAKT AUSGERICHTET) ================= */
/* Ziel: Beschreibungen starten IMMER exakt gleich, Score & Text sind nah, nichts gequetscht */
function renderScoreBlock(score, processing, size = 13) {
  const h = renderHealth(score);
  const i = renderIndustry(processing);

  if (!h && !i) return "";

  // 80px Balkenbreite + 10px Abstand = feste Textkante (wie sauber eingestellter Zustand)
  const colW = 90;

  const labelStyle = `font-size:${size}px;opacity:0.85;line-height:1.2;`;

  // Abstand zwischen Health-Zeile und Industry-Zeile (nicht gequetscht, aber kompakt)
  const rowGap = 6;

  // Abstand zwischen Score-Spalte und Text (nicht zu weit weg!)
  const colGap = 8;

  return `
    <div style="margin:12px 0;">
      ${h ? `
        <div style="display:grid;grid-template-columns:${colW}px 1fr;column-gap:${colGap}px;align-items:center;margin-bottom:${i ? rowGap : 0}px;">
          <div style="white-space:nowrap;">${h}</div>
          <div style="${labelStyle}">Gesundheitsscore</div>
        </div>
      ` : ""}

      ${i ? `
        <div style="display:grid;grid-template-columns:${colW}px 1fr;column-gap:${colGap}px;align-items:center;">
          <div>${i}</div>
          <div style="${labelStyle}">Industrie-Verarbeitungsgrad</div>
        </div>
      ` : ""}
    </div>
  `;
}


/* ================= SUPABASE ================= */
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
  box.innerHTML = `<div id="shareBox"></div>${html || ""}`;
}
function clearResults() { setResultsHTML(""); }

/* ================= KATEGORIEN ================= */
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

/* ================= SUCHE ================= */
function toIlikePattern(q) {
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

/* ================= KATEGORIE ================= */
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

    <div><strong>Gesundheit:</strong> ${renderHealth(e.score)}</div>
    <div style="margin-top:6px;">
      <strong>Industrie Verarbeitungsgrad:</strong>
      ${renderIndustry(e.processing_score)}
    </div>

    ${e.summary ? `<h3>Beschreibung</h3>${renderSummaryWithTables(e.summary)}` : ""}
    ${e.mechanism ? `<h3>Mechanismus</h3>${renderRawText(e.mechanism)}` : ""}
    ${e.scientific_note ? `<h3>Wissenschaftlicher Hinweis</h3>${renderRawText(e.scientific_note)}` : ""}
  `);

  const back = $("backHome");
  if (back) back.style.display = "block";
}

/* ================= SEARCH INPUT ================= */
function initSearch() {
  const input = $("searchInput");
  if (!input) return;

  input.addEventListener("input", () => {
    const q = input.value.trim();
    if (q.length < 2) { clearResults(); return; }
    loadListBySearch(q);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const q = input.value.trim();
    if (q.length < 2) return;
    loadListBySearch(q);
  });
}

/* ================= NAVIGATION ================= */
document.addEventListener("click", (e) => {
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
  else clearResults();
});
