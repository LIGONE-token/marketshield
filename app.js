/* =====================================================
   MarketShield – app.js
   FINAL / CONTENT ONLY / STABIL (preserves shareBox)
===================================================== */

let currentEntryId = null;

/* ================= SUPABASE ================= */
const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
const SUPABASE_KEY = "sb_publishable_JHb4LBhP26eI7BgDS1jIkw_4OYn3-F9";

async function supa(query) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });
  const t = await r.text();
  if (!r.ok) throw new Error(t);
  return JSON.parse(t || "[]");
}

/* ================= HELPERS ================= */
const $ = (id) => document.getElementById(id);

function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function normalizeText(text) {
  return String(text || "")
    .replace(/\r\n|\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function makePreview(text, max = 170) {
  const t = normalizeText(text).replace(/\n+/g, " ").trim();
  return t.length <= max ? t : t.slice(0, max).trim() + " …";
}

/* ===== keep #shareBox, render only into .ms-content ===== */
function ensureResultsScaffold() {
  const root = $("results");
  if (!root) return null;

  // ensure shareBox exists
  let shareBox = $("shareBox");
  if (!shareBox) {
    shareBox = document.createElement("div");
    shareBox.id = "shareBox";
    root.insertBefore(shareBox, root.firstChild);
  }

  // ensure content box exists
  let content = root.querySelector(".ms-content");
  if (!content) {
    content = document.createElement("div");
    content.className = "ms-content";
    root.appendChild(content);
  }

  return content;
}

/* ================= TABLE RENDER ================= */
function mdTableToHtml(block) {
  const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length < 2 || !lines[0].includes("|")) return null;

  const sep = lines[1].replace(/\s+/g, "");
  if (!sep.includes("|") || !/^[-:|]+$/.test(sep)) return null;

  const parseRow = (line) => {
    let s = line;
    if (s.startsWith("|")) s = s.slice(1);
    if (s.endsWith("|")) s = s.slice(0, -1);
    return s.split("|").map(c => escapeHtml(c.trim()));
  };

  const header = parseRow(lines[0]);
  const rows = lines.slice(2).map(parseRow);

  return `
    <div style="margin:14px 0;overflow:auto;">
      <table style="border-collapse:collapse;font-size:14px;">
        <thead>
          <tr>
            ${header.map(h =>
              `<th style="border:1px solid #ddd;padding:8px;background:#f6f6f6;text-align:left;">${h}</th>`
            ).join("")}
          </tr>
        </thead>
        <tbody>
          ${rows.map(r =>
            `<tr>${r.map(c =>
              `<td style="border:1px solid #ddd;padding:8px;vertical-align:top;">${c}</td>`
            ).join("")}</tr>`
          ).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderSummaryHtml(raw) {
  const text = normalizeText(raw);
  const blocks = text.split(/\n\s*\n/);

  return blocks.map(block => {
    const table = mdTableToHtml(block);
    if (table) return table;

    return `<p style="margin:0 0 14px 0;line-height:1.6;">
      ${escapeHtml(block)}
    </p>`;
  }).join("");
}

/* ================= SCORES ================= */
function renderHealth(score) {
  const n = Number(score);
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n >= 80) return "💚💚💚";
  if (n >= 60) return "💚💚";
  if (n >= 40) return "💚";
  if (n >= 20) return "💛";
  return "❗⚠️❗";
}

function renderIndustry(score) {
  const n = Number(score);
  if (!Number.isFinite(n) || n <= 0) return "";

  const clamped = Math.min(10, Math.max(1, n));
  const MAX = 90;
  const width = Math.round((clamped / 10) * MAX);

  let color = "#2ecc71";
  if (clamped >= 4) color = "#f1c40f";
  if (clamped >= 7) color = "#e74c3c";

  return `
    <div style="width:${MAX}px;height:8px;background:#e0e0e0;border-radius:4px;overflow:hidden;">
      <div style="width:${width}px;height:8px;background:${color};border-radius:4px;"></div>
    </div>
  `;
}

function renderScoreBlock(score, processing) {
  const health = renderHealth(score);
  const hasIndustry = Number.isFinite(Number(processing)) && Number(processing) > 0;
  if (!health && !hasIndustry) return "";

  const ICON_COL = 110;
  const FONT = 14;

  return `
    <div style="margin:12px 0;display:flex;flex-direction:column;gap:8px;">
      ${health ? `
        <div style="display:grid;grid-template-columns:${ICON_COL}px auto;align-items:center;">
          <div style="font-size:${FONT}px;line-height:1;">${health}</div>
          <div style="font-size:${FONT}px;opacity:.75;">Gesundheit</div>
        </div>` : ""}
      ${hasIndustry ? `
        <div style="display:grid;grid-template-columns:${ICON_COL}px auto;align-items:center;">
          <div>${renderIndustry(processing)}</div>
          <div style="font-size:${FONT}px;opacity:.75;">Industrie-Verarbeitungsgrad</div>
        </div>` : ""}
    </div>
  `;
}

/* ================= START ================= */
function showStart() {
  currentEntryId = null;
  const box = ensureResultsScaffold();
  if (box) box.innerHTML = "";

  // system-controls reagiert darauf (Social/Home verstecken)
  window.dispatchEvent(new Event("ms:state"));
}

/* ================= LIST ================= */
function renderList(data = []) {
  const box = ensureResultsScaffold();
  if (!box) return;

  box.innerHTML = data.map(e => `
    <div class="entry-card" data-id="${e.id}">
      <div style="font-size:20px;font-weight:800;">${escapeHtml(e.title)}</div>
      ${renderScoreBlock(e.score, e.processing_score)}
      <div style="font-size:15px;opacity:.9;">
        ${escapeHtml(makePreview(e.summary))}
      </div>
    </div>
  `).join("");

  document.querySelectorAll(".entry-card").forEach(card => {
    card.onclick = () => {
      history.pushState({}, "", "?id=" + card.dataset.id);
      loadEntry(card.dataset.id);
    };
  });

  window.dispatchEvent(new Event("ms:state"));
}

/* ================= DETAIL ================= */
async function loadEntry(id) {
  const box = ensureResultsScaffold();
  if (!box) return;

  const d = await supa(`entries?select=*&id=eq.${id}`);
  const e = d[0];
  if (!e) return;

  currentEntryId = id;

 box.innerHTML = `
  <h2>${escapeHtml(e.title)}</h2>
  ${renderScoreBlock(e.score, e.processing_score)}
  <div class="entry-text">
    ${renderSummaryHtml(e.summary)}
  </div>
`;


  window.dispatchEvent(new Event("ms:state"));
}

/* ================= SEARCH ================= */
function initSearch() {
  const input = $("searchInput");
  if (!input) return;

  input.addEventListener("input", async (e) => {
    const q = e.target.value.trim();
    if (q.length < 2) return showStart();

    const enc = encodeURIComponent(q);
    renderList(await supa(
      `entries?select=id,title,summary,score,processing_score&title=ilike.%25${enc}%25`
    ));
  });
}

/* ================= CATEGORIES ================= */
async function loadCategories() {
  const grid = document.querySelector(".category-grid");
  if (!grid) return;

  const data = await fetch("categories.json").then(r => r.json());
  grid.innerHTML = "";

  (data.categories || []).forEach(c => {
    const b = document.createElement("button");
    b.textContent = c.title;
    b.onclick = async () => {
      renderList(await supa(
        `entries?select=id,title,summary,score,processing_score&category=eq.${c.title}`
      ));
    };
    grid.appendChild(b);
  });
}

/* ================= HISTORY ================= */
window.addEventListener("popstate", () => {
  const id = new URLSearchParams(location.search).get("id");
  if (id) loadEntry(id);
  else showStart();
});

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  ensureResultsScaffold();
  loadCategories();
  initSearch();

  const id = new URLSearchParams(location.search).get("id");
  if (id) loadEntry(id);
  else showStart();
});
