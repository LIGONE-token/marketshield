/* =====================================================
   MarketShield – app.js
   CONTENT ONLY (STABIL / SYSTEMFREI)
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

/* Nur Artefakte entfernen – Struktur behalten */
function stripArtifacts(s) {
  return String(s || "")
    .replace(/:contentReference\[[^\]]*\]\{[^}]*\}/gi, "")
    .replace(/\[oaicite:[^\]]*\]/gi, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function normalizeText(text) {
  return stripArtifacts(String(text || ""))
    .replace(/\\n/g, "\n")
    .replace(/\r\n|\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function makePreview(text, max = 170) {
  const t = normalizeText(text).replace(/\n+/g, " ").trim();
  return t.length <= max ? t : t.slice(0, max).trim() + " …";
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
  const w = Math.round((clamped / 10) * MAX);
  const hue = Math.round(120 - (clamped - 1) * (120 / 9));

  return `
    <div style="margin-top:6px;">
      <div style="display:flex;align-items:center;gap:8px;font-size:13px;opacity:.85;">
        <div style="width:${MAX}px;height:6px;background:#e0e0e0;border-radius:4px;overflow:hidden;">
          <div style="width:${w}px;height:6px;background:hsl(${hue},85%,45%);border-radius:4px;"></div>
        </div>
        <div>Industrie-Verarbeitungsgrad</div>
      </div>
    </div>
  `;
}

function renderScoreBlock(score, processing) {
  const health = renderHealth(score);
  const industry = renderIndustry(processing);

  if (!health && !industry) return "";

  return `
    <div class="score-block">

      ${health ? `
        <div class="score-row">
          <div class="score-title">Gesundheit</div>
          <div class="score-value score-health">${health}</div>
        </div>
      ` : ""}

      ${industry ? `
        <div class="score-row">
          ${industry}
        </div>
      ` : ""}

    </div>
  `;
}


/* ================= STARTSEITE (LEER) ================= */
function showStart() {
  currentEntryId = null;
  const box = $("results");
  if (box) box.innerHTML = "";
}

/* ================= TABELLEN ================= */
function renderSummaryHtml(raw) {
  const text = normalizeText(raw);
  const blocks = text.split(/\n\s*\n/);

  return blocks.map(block => {
    const table = mdTableToHtml(block);
    if (table) return table;
    return `<p style="margin:0 0 14px 0; white-space:pre-wrap; line-height:1.6;">${escapeHtml(block)}</p>`;
  }).join("");
}

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
  const rows = lines.slice(2).filter(l => l.includes("|")).map(parseRow);
  if (header.length < 2) return null;

  return `
    <div style="margin:14px 0; overflow:auto;">
      <table style="border-collapse:collapse;width:auto;max-width:100%;font-size:14px;">
        <thead>
          <tr>${header.map(h => `<th style="border:1px solid #ddd;padding:8px 10px;background:#f6f6f6;text-align:left;">${h}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${rows.map(r => `<tr>${r.map(c => `<td style="border:1px solid #ddd;padding:8px 10px;vertical-align:top;">${c}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;
}

/* ================= LISTE ================= */
function renderList(data = []) {
  const box = $("results");
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

  // 🔥 DAS HAT GEFEHLT
  bindEntryCards();
}


/* ================= DETAIL ================= */
async function loadEntry(id) {
  const box = $("results");
  if (!box) return;

  const d = await supa(`entries?select=*&id=eq.${id}`);
  const e = d[0];
  if (!e) return;

  currentEntryId = id;

  box.innerHTML = `
    <h2>${escapeHtml(e.title)}</h2>
    ${renderScoreBlock(e.score, e.processing_score)}
    <div id="entryContent">
      ${renderSummaryHtml(e.summary)}
    </div>

    <!-- Action-Buttons bleiben im HTML, Logik kommt aus system-controls.js -->
<div id="entryActions" class="entry-actions">
  <button id="shareFb">Facebook</button>
  <button id="shareX">X</button>
  <button id="shareTg">Telegram</button>
  <button id="shareWa">WhatsApp</button>

  <button id="copyLink">Link kopieren</button>
  <button id="printPage">Drucken</button>
</div>
  `;
}

/* ================= SUCHE ================= */
function initSearch() {
  const input = $("searchInput");
  if (!input) return;

  input.addEventListener("input", async (e) => {
    const q = e.target.value.trim();
    if (q.length < 2) {
      showStart();
      return;
    }

    const enc = encodeURIComponent(q);
    renderList(await supa(
      `entries?select=id,title,summary,score,processing_score&title=ilike.%25${enc}%25`
    ));
  });
}

/* ================= KATEGORIEN ================= */
async function loadCategories() {
  const grid =
    document.querySelector(".category-grid") ||
    document.getElementById("categoryGrid");

  if (!grid) return;

  const data = await fetch("categories.json").then(r => r.json());
  grid.innerHTML = "";

  (data.categories || []).forEach(c => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = c.title;
    b.onclick = async () => {
      renderList(await supa(
        `entries?select=id,title,summary,score,processing_score&category=eq.${c.title}`
      ));
    };
    grid.appendChild(b);
  });
}

/* ================= NAVIGATION (PASSIV) ================= */
function bindEntryCards() {
  document.querySelectorAll(".entry-card").forEach(card => {
    card.onclick = () => {
      history.pushState({}, "", "?id=" + card.dataset.id);
      loadEntry(card.dataset.id);
    };
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
  loadCategories();
  initSearch();

  const id = new URLSearchParams(location.search).get("id");
  if (id) loadEntry(id);
  else showStart();
});
