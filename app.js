/* =====================================================
   MarketShield – app.js (FINAL / STABIL / TABELLEN FIX)
===================================================== */

let currentEntryId = null;

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  injectTableStyles();

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
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
}

function shortText(text, max = 160) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max) + " …" : text;
}

/* ================= TABLE STYLES ================= */
function injectTableStyles() {
  if (document.getElementById("msTableStyles")) return;

  const style = document.createElement("style");
  style.id = "msTableStyles";
  style.textContent = `
    .ms-text p { margin: 8px 0; line-height: 1.6; }
    .ms-text .ms-sp { height: 10px; }

    .ms-table {
      margin: 14px 0;
      border: 1px solid #ddd;
      border-radius: 10px;
      overflow: hidden;
    }

    .ms-row {
      display: grid;
    }

    .ms-row > div {
      padding: 8px 10px;
      border-top: 1px solid #eee;
      word-break: break-word;
    }

    .ms-head {
      background: #f5f5f5;
      font-weight: 800;
    }

    .ms-head > div {
      border-top: none;
    }

    @media (max-width: 720px) {
      .ms-row {
        grid-template-columns: 1fr !important;
      }
    }
  `;
  document.head.appendChild(style);
}

/* ================= MARKDOWN TABLE RENDER ================= */
function renderMarkdownTables(text) {
  if (!text) return "";

  const lines = normalizeText(text).split("\n");
  let html = "";
  let inTable = false;
  let colCount = 0;

  const isSeparator = (s) =>
    /^(\|?\s*:?-{3,}:?\s*)+(\|?\s*)$/.test((s || "").trim());

  const splitRow = (row) =>
    row.split("|").map(s => s.trim()).filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();

    // Tabellenstart
    if (!inTable && line.includes("|") && isSeparator(lines[i + 1])) {
      inTable = true;
      const headers = splitRow(line);
      colCount = headers.length;

      html += `<div class="ms-table">`;
      html += `<div class="ms-row ms-head" style="grid-template-columns:repeat(${colCount},1fr)">`;
      headers.forEach(h => html += `<div>${escapeHtml(h)}</div>`);
      html += `</div>`;

      i++; // Separator überspringen
      continue;
    }

    // Tabellenzeilen
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

    // Normaler Text
    if (line.length === 0) {
      html += `<div class="ms-sp"></div>`;
    } else {
      html += `<p>${escapeHtml(raw)}</p>`;
    }
  }

  if (inTable) html += `</div>`;
  return html;
}

/* ================= TEXT BLOCK ================= */
function renderTextBlock(title, text) {
  if (!text) return "";
  return `
    <h3>${escapeHtml(title)}</h3>
    <div class="ms-text">
      ${renderMarkdownTables(text)}
    </div>
  `;
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
      ${h ? `<div>${h} <span style="opacity:.7">Gesundheitsscore</span></div>` : ""}
      ${i ? `<div style="margin-top:6px;">${i} <span style="opacity:.7">Industrie-Verarbeitungsgrad</span></div>` : ""}
    </div>
  `;
}

/* ================= LIST / DETAIL ================= */
function renderList(data) {
  const results = document.getElementById("results");
  results.innerHTML = data.map(e => `
    <div class="entry-card" data-id="${e.id}">
      <div style="font-size:20px;font-weight:800;">
        ${escapeHtml(e.title)}
      </div>
      ${renderScoreBlock(e.score, e.processing_score)}
      <div>${escapeHtml(shortText(e.summary, 160))}</div>
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

/* ================= STUBS ================= */
function loadCategories() {}
function initReport() {}
function initBackHome() {}
