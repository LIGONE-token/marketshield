/* =====================================================
   MarketShield – app.js (FINAL / STABIL / CSP-SAFE)
   Tabellen: OK (Desktop + Mobile Scroll)
   Absätze: OK (keine sichtbaren \n\n)
   Tooltip: CSS-only (Text & Inhalt IDENTISCH)
   Scores: Original-Layout wiederhergestellt
===================================================== */

let currentEntryId = null;

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  injectGlobalStyles();
  loadCategories();

  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  if (id) loadEntry(id);

  initReport();
  initBackHome();
});

/* ================= GLOBAL CLICK ================= */
document.addEventListener("click", (e) => {
  const card = e.target.closest(".entry-card");
  if (!card) return;
  const id = card.dataset.id;
  history.pushState(null, "", "?id=" + id);
  loadEntry(id);
});

/* ================= SUPABASE ================= */
const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
const SUPABASE_KEY = "sb_publishable_FBywhrypx6zt_0nMlFudyQ_zFiqZKTD";

async function supa(query) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });
  return r.json();
}

/* ================= HELPERS ================= */
function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function normalizeText(text) {
  if (!text) return "";
  return String(text)
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
}

function shortText(text, max = 160) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max) + " …" : text;
}

/* ================= GLOBAL STYLES (TABLE + TOOLTIP) ================= */
function injectGlobalStyles() {
  if (document.getElementById("msGlobalStyles")) return;

  const style = document.createElement("style");
  style.id = "msGlobalStyles";
  style.textContent = `
    /* ---------- TABLES ---------- */
    .ms-table { margin:12px 0; border:1px solid #ddd; border-radius:10px; overflow:hidden; }
    .ms-row { display:grid; }
    .ms-row > div { padding:8px 10px; border-top:1px solid #eee; word-break:break-word; }
    .ms-head { font-weight:800; background:#f6f6f6; }
    .ms-head > div { border-top:none; }

    @media (max-width: 720px) {
      .ms-table { overflow-x:auto; -webkit-overflow-scrolling:touch; }
      .ms-row { min-width:600px; }
    }

    /* ---------- TOOLTIP (CSS-ONLY, CSP-SAFE) ---------- */
    [data-tooltip] {
      position: relative;
      cursor: help;
    }

    [data-tooltip]::after {
      content: attr(data-tooltip);
      position: absolute;
      left: 0;
      bottom: 125%;
      max-width: 360px;
      background: rgba(20,20,20,.95);
      color: #fff;
      padding: 8px 10px;
      border-radius: 8px;
      font-size: 13px;
      line-height: 1.35;
      white-space: normal;
      opacity: 0;
      pointer-events: none;
      transform: translateY(6px);
      transition: opacity .15s ease, transform .15s ease;
      z-index: 9999;
      box-shadow: 0 10px 26px rgba(0,0,0,.25);
    }

    [data-tooltip]:hover::after {
      opacity: 1;
      transform: translateY(0);
    }
  `;
  document.head.appendChild(style);
}

/* ================= MARKDOWN TABLE + TEXT ================= */
function renderMarkdownTables(text) {
  if (!text) return "";
  const lines = normalizeText(text).split("\n");
  let html = "";
  let inTable = false;
  let colCount = 0;

  const isSeparator = s =>
    /^(\|?\s*:?-{3,}:?\s*)+(\|?\s*)$/.test((s || "").trim());

  const splitRow = row =>
    row.split("|").map(s => s.trim()).filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();

    if (!inTable && line.includes("|") && isSeparator(lines[i + 1])) {
      inTable = true;
      const headers = splitRow(line);
      colCount = headers.length;

      html += `<div class="ms-table">`;
      html += `<div class="ms-row ms-head" style="grid-template-columns:repeat(${colCount},1fr)">`;
      headers.forEach(h => html += `<div>${escapeHtml(h)}</div>`);
      html += `</div>`;
      i++;
      continue;
    }

    if (inTable) {
      if (line.includes("|")) {
        const cells = splitRow(line);
        html += `<div class="ms-row" style="grid-template-columns:repeat(${colCount},1fr)">`;
        cells.forEach(c => html += `<div>${escapeHtml(c)}</div>`);
        html += `</div>`;
        continue;
      } else {
        html += `</div>`;
        inTable = false;
      }
    }

    if (raw === "") {
      html += `<div style="height:10px;"></div>`;
    } else {
      const isWarning = raw.trim().toUpperCase().startsWith("NICHT DEKLARIERT");
      html += `
        <p
          style="margin:8px 0;line-height:1.6;"
          ${isWarning ? 'data-tooltip="Diese Bestandteile sind rechtlich nicht deklarationspflichtig, können aber technisch oder prozessbedingt vorhanden sein."' : ""}
        >
          ${escapeHtml(raw)}
        </p>
      `;
    }
  }

  if (inTable) html += `</div>`;
  return html;
}

function renderTextBlock(title, text) {
  if (!text) return "";
  return `
    <h3>${escapeHtml(title)}</h3>
    <div>${renderMarkdownTables(text)}</div>
  `;
}

/* ================= SCORES (ORIGINAL-LOGIK) ================= */
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
  return `
    <div style="width:80px;height:8px;background:#e0e0e0;border-radius:6px;overflow:hidden;">
      <div style="width:${w}px;height:8px;background:#2e7d32;"></div>
    </div>
  `;
}

function renderScoreBlock(score, processing) {
  const h = renderHealth(score);
  const i = renderIndustry(processing);
  if (!h && !i) return "";

  return `
    <div style="margin:12px 0;">
      ${h ? `<div style="display:flex;align-items:center;gap:8px;">${h}<span style="opacity:.7;">Gesundheitsscore</span></div>` : ""}
      ${i ? `<div style="display:flex;align-items:center;gap:8px;margin-top:6px;">${i}<span style="opacity:.7;">Industrie-Verarbeitungsgrad</span></div>` : ""}
    </div>
  `;
}

/* ================= LIST / DETAIL ================= */
function renderList(data) {
  const results = document.getElementById("results");
  results.innerHTML = data.map(e => `
    <div class="entry-card" data-id="${e.id}">
      <div style="font-size:20px;font-weight:800;">${escapeHtml(e.title)}</div>
      ${renderScoreBlock(e.score, e.processing_score)}
      <div>${escapeHtml(shortText(e.summary,160))}</div>
    </div>
  `).join("");
}

async function loadEntry(id) {
  const data = await supa(`entries?select=*&id=eq.${id}`);
  const e = data[0];
  if (!e) return;

  currentEntryId = id;

  document.getElementById("results").innerHTML = `
    <h2>${escapeHtml(e.title)}</h2>
    ${renderScoreBlock(e.score, e.processing_score)}
    ${renderTextBlock("Zusammenfassung", e.summary)}
    ${renderTextBlock("Wirkmechanismus", e.mechanism)}
    ${renderTextBlock("Wissenschaftlicher Hinweis", e.scientific_note)}
    <div id="entryActions"></div>
  `;
}

/* ================= PLACEHOLDERS ================= */
function loadCategories() {}
function initReport() {}
function initBackHome() {}
