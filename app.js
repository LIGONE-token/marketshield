/* =====================================================
   MarketShield – app.js (FINAL / STABIL / KORRIGIERT)
===================================================== */

/* ================= CONFIG ================= */
const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
const SUPABASE_KEY = "sb_publishable_FBywhrypx6zt_0nMlFudyQ_zFiqZKTD";

/* ================= KATEGORIEN ================= */
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
const resultsBox = () => $("results");

/* ================= HELPERS ================= */
function escapeHtml(s) {
  if (s == null) return "";
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function formatType(t) {
  if (!t) return "";
  t = String(t).trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : "";
}

/* ================= TEXT ================= */
function renderRawText(t) {
  if (!t) return "";
  return `<div style="white-space:pre-wrap;line-height:1.6;">${escapeHtml(t)}</div>`;
}

/* ================= SUMMARY ================= */
function renderSummaryWithTables(text) {
  if (!text) return "";
  const normalized = String(text)
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n\\n/g, "\n\n")
    .replace(/\\n/g, "\n");

  const lines = normalized.split("\n");
  let html = "", buf = [];

  const flush = () => {
    if (!buf.length) return;
    html += `<p>${escapeHtml(buf.join(" "))}</p>`;
    buf = [];
  };

  for (let l of lines) {
    l = l.trim();
    if (!l) { flush(); continue; }
    buf.push(l);
  }
  flush();
  return html;
}

/* ================= SCORES ================= */
function renderHealth(score) {
  const n = Number(score);
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n >= 80) return "💚💚💚";
  if (n >= 60) return "💚💚";
  if (n >= 40) return "💚";
  if (n >= 20) return "💛";
  return "⚠️❗⚠️";
}

function renderIndustry(score) {
  const n = Number(score);
  if (!Number.isFinite(n) || n <= 0) return "";

  const w = Math.round((n / 10) * 80);

  let color = "#2e7d32";          // grün
  if (n >= 7) color = "#c62828";  // rot (hoch)
  else if (n >= 4) color = "#f9a825"; // gelb (mittel)

  return `
    <div style="width:80px;height:8px;background:#e0e0e0;border-radius:6px;overflow:hidden;">
      <div style="width:${w}px;height:8px;background:${color};"></div>
    </div>`;
}

/* ================= SCORE BLOCK ================= */
function renderScoreBlock(score, processing, size = 13) {
  const h = renderHealth(score);
  const i = renderIndustry(processing);
  if (!h && !i) return "";

  const colW = 90;
  const labelStyle = `font-size:${size}px;opacity:.85;line-height:1.2;`;

  return `
    <div style="margin:12px 0;">
      ${h ? `
        <div style="display:grid;grid-template-columns:${colW}px 1fr;column-gap:8px;align-items:center;margin-bottom:${i ? 6 : 0}px;">
          <div style="white-space:nowrap;">${h}</div>
          <div style="${labelStyle}">Gesundheitsscore</div>
        </div>` : ""}
      ${i ? `
        <div style="display:grid;grid-template-columns:${colW}px 1fr;column-gap:8px;align-items:center;">
          <div>${i}</div>
          <div style="${labelStyle}">Industrie-Verarbeitungsgrad</div>
        </div>` : ""}
    </div>`;
}

/* ================= RECHTLICHER TOOLTIP ================= */
function renderLegalTooltip() {
  return `
    <div style="margin:6px 0 16px 0;">
      <span
        style="
          position:relative;
          font-size:12px;
          color:#666;
          cursor:help;
          display:inline-block;
        "
        onmouseenter="this.querySelector('.legal-tip').style.display='block'"
        onmouseleave="this.querySelector('.legal-tip').style.display='none'"
      >
        ℹ️ <span style="text-decoration:underline;">Rechtlicher Hinweis</span>
        <span
          class="legal-tip"
          style="
            display:none;
            position:absolute;
            left:0;
            bottom:130%;
            width:260px;
            background:#222;
            color:#fff;
            padding:10px;
            border-radius:6px;
            font-size:11px;
            line-height:1.4;
            z-index:9999;
          "
        >
          MarketShield stellt Informationen und Bewertungen zur Orientierung bereit.
          Diese dürfen aus rechtlichen Gründen nicht als absolute Wahrheit oder
          individuelle Beratung verstanden werden.
        </span>
      </span>
    </div>`;
}

/* ================= SUPABASE ================= */
async function supa(path, params) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${path}`);
  if (params) url.search = new URLSearchParams(params).toString();
  const r = await fetch(url, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  return r.json();
}

/* ================= CORE ================= */
function setResultsHTML(html) {
  const b = resultsBox();
  if (!b) return;
  b.innerHTML = `<div id="shareBox"></div>${html || ""}`;
}
function clearResults(){ setResultsHTML(""); }

/* ================= KATEGORIEN ================= */
function loadCategories() {
  const g = $$(".category-grid");
  if (!g) return;
  g.innerHTML = CATEGORIES.map(c =>
    `<button class="cat-btn" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`
  ).join("");
}

/* ================= LISTE ================= */
function renderList(items) {
  if (!items || !items.length) { clearResults(); return; }
  setResultsHTML(items.map(e => `
    <div class="entry-card" data-id="${e.id}" style="overflow:visible;">
      <strong>${escapeHtml(e.title)}</strong><br>
      <small>${escapeHtml(e.category||"")}${e.category&&e.type?" · ":""}${escapeHtml(formatType(e.type))}</small>
      ${renderScoreBlock(e.score, e.processing_score, 12)}
      ${renderLegalTooltip()}
    </div>
  `).join(""));
}

/* ================= SUCHE ================= */
async function loadListBySearch(q) {
  if (!q || q.length < 2) { clearResults(); return; }
  const d = await supa("entries", {
    select:"id,title,category,type,score,processing_score",
    or:`(title.ilike.*${q}*,summary.ilike.*${q}*)`,
    order:"title.asc", limit:"200"
  });
  renderList(d);
}

/* ================= KATEGORIE ================= */
async function loadListByCategory(cat) {
  const d = await supa("entries", {
    select:"id,title,category,type,score,processing_score",
    category:`eq.${cat}`, order:"title.asc", limit:"500"
  });
  renderList(d);
}

/* ================= DETAIL ================= */
async function loadEntry(id) {
  const d = await supa("entries",{ id:`eq.${id}`, limit:"1" });
  if (!d || !d.length) return clearResults();
  const e = d[0];

  setResultsHTML(`
    <h2>${escapeHtml(e.title)}</h2>
    <div style="opacity:.7;margin-bottom:12px;">
      ${escapeHtml(e.category||"")}${e.category&&e.type?" · ":""}${escapeHtml(formatType(e.type))}
    </div>

    ${renderScoreBlock(e.score, e.processing_score, 13)}
    ${renderLegalTooltip()}

    ${e.summary?`<h3>Beschreibung</h3>${renderSummaryWithTables(e.summary)}`:""}
    ${e.mechanism?`<h3>Mechanismus</h3>${renderRawText(e.mechanism)}`:""}
    ${e.scientific_note?`<h3>Wissenschaftlicher Hinweis</h3>${renderRawText(e.scientific_note)}`:""}
  `);

  const b = $("backHome");
  if (b) b.style.display="block";
}

/* ================= EVENTS ================= */
document.addEventListener("click", (e) => {

  const cat = e.target.closest(".cat-btn");
  if (cat) {
    loadListByCategory(cat.dataset.cat);
    return;
  }

  const card = e.target.closest(".entry-card");
  if (card) {
    loadEntry(card.dataset.id);
    return;
  }
});

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
  const input = $("searchInput");
  if (input) input.addEventListener("input", e => loadListBySearch(e.target.value.trim()));
});
