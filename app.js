/* =====================================================
   MarketShield – app.js (FINAL / LOCKED)
===================================================== */

let currentEntryId = null;

/* ================= SUPABASE ================= */
const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
const SUPABASE_KEY = "sb_publishable_FBywhrypx6zt_0nMlFudyQ_zFiqZKTD";

async function supa(query, opts = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
    method: opts.method || "GET",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json"
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  const t = await r.text();
  if (!r.ok) throw new Error(t || r.statusText);
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
    .replace(/\*\*|##+|__+|~~+|`+/g, "")
    .replace(/\\n/g, "\n")              // literal \n → echte Zeile
    .replace(/\r\n|\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function shortText(t, max = 160) {
  t = normalizeText(t);
  return t.length > max ? t.slice(0, max) + " …" : t;
}

/* ================= SCORES (LOCKED) ================= */
/* 0 = nichts anzeigen | Warnung = ❗⚠️❗ (wie vorher) */

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
  const MAX_WIDTH = 90;
  const width = Math.round((clamped / 10) * MAX_WIDTH);
  const hue = Math.round(120 - (clamped - 1) * (120 / 9)); // grün → rot

  return `
    <div style="margin-top:6px;">
      <div style="display:flex;align-items:center;gap:8px;font-size:13px;opacity:.85;">
        <div style="width:${MAX_WIDTH}px;height:6px;background:#e0e0e0;border-radius:4px;overflow:hidden;">
          <div style="width:${width}px;height:6px;background:hsl(${hue},85%,45%);border-radius:4px;"></div>
        </div>
        <div>Industrie-Verarbeitungsgrad</div>
      </div>
    </div>
  `;
}

function renderScoreBlock(score, processing) {
  const h = renderHealth(score);
  const i = renderIndustry(processing);
  if (!h && !i) return "";

  return `
    <div style="margin:10px 0;">
      ${h ? `
        <div style="display:flex;align-items:center;gap:8px;font-size:15px;margin-bottom:4px;">
          <div>${h}</div>
          <div style="opacity:.8;">Gesundheit</div>
        </div>
      ` : ""}
      ${i || ""}
    </div>
  `;
}

/* ================= STARTSEITE (LEER) ================= */
function showStart() {
  currentEntryId = null;
  const box = $("results");
  if (box) box.innerHTML = "";
}

/* ================= MARKDOWN-TABELLEN ================= */
function renderSummaryHtml(raw) {
  const text = normalizeText(raw);
  const blocks = text.split(/\n\s*\n/);

  return blocks.map(block => {
    const table = mdTableToHtml(block);
    if (table) return table;

    return `<p style="margin:0 0 12px 0; white-space:pre-wrap; line-height:1.6;">
      ${escapeHtml(block)}
    </p>`;
  }).join("");
}

function mdTableToHtml(block) {
  const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;
  if (!lines[0].includes("|")) return null;

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
      <div style="font-size:15px;">${escapeHtml(shortText(e.summary))}</div>
    </div>
  `).join("");
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
    <div id="entryActions" style="margin-top:28px;"></div>
  `;

  renderEntryActions(e.title);
}

/* ================= SOCIAL / ACTIONS ================= */
function renderEntryActions(title) {
  const box = $("entryActions");
  if (!box) return;

  const url = location.href;
  const encUrl = encodeURIComponent(url);
  const encTitle = encodeURIComponent(title + " – MarketShield");

  box.innerHTML = `
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <button id="btnCopy">🔗 Kopieren</button>
      <button id="btnPrint">🖨️ Drucken</button>
      <button id="btnTelegram">Telegram</button>
      <button id="btnWhatsapp">WhatsApp</button>
      <button id="btnX">X</button>
      <button id="btnFacebook">Facebook</button>
    </div>
  `;

  $("btnCopy").onclick = () => navigator.clipboard.writeText(url);
  $("btnPrint").onclick = () => window.print();
  $("btnTelegram").onclick = () => window.open(`https://t.me/share/url?url=${encUrl}&text=${encTitle}`, "_blank");
  $("btnWhatsapp").onclick = () => window.open(`https://wa.me/?text=${encTitle}%20${encUrl}`, "_blank");
  $("btnX").onclick = () => window.open(`https://twitter.com/intent/tweet?url=${encUrl}&text=${encTitle}`, "_blank");
  $("btnFacebook").onclick = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encUrl}`, "_blank");
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

/* ================= KATEGORIEN ================= */
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

/* ================= REPORT → SUPABASE ================= */
document.addEventListener("click", (e) => {
  if (e.target.id === "reportBtn") $("reportModal").style.display = "block";
  if (e.target.id === "closeReportModal") $("reportModal").style.display = "none";
});

const elReportForm = $("reportForm");
if (elReportForm) {
  elReportForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const txt = elReportForm.description?.value.trim();
    if (!txt || txt.length < 3) return alert("Bitte Beschreibung eingeben.");

    const res = await fetch(`${SUPABASE_URL}/rest/v1/reports`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify({
        description: txt,
        entry_id: currentEntryId || null,
        created_at: new Date().toISOString()
      })
    });

    if (!res.ok) return alert("Report fehlgeschlagen");

    elReportForm.reset();
    $("reportModal").style.display = "none";
    alert("Danke! Meldung wurde gespeichert.");
  });
}

/* ================= RECHTLICHER HINWEIS ================= */
$("legalLink")?.addEventListener("click", (e) => {
  e.preventDefault();
  $("legalModal").style.display = "block";
});
$("closeLegalModal")?.addEventListener("click", () => {
  $("legalModal").style.display = "none";
});

/* ================= NAVIGATION ================= */
document.addEventListener("click", e => {
  const card = e.target.closest(".entry-card");
  if (!card) return;
  history.pushState({}, "", "?id=" + card.dataset.id);
  loadEntry(card.dataset.id);
});

$("backHome")?.addEventListener("click", (e) => {
  e.preventDefault();
  history.pushState({}, "", location.pathname);
  showStart();
});

window.onpopstate = () => {
  const id = new URLSearchParams(location.search).get("id");
  if (id) loadEntry(id);
  else showStart();
};

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
  initSearch();

  const id = new URLSearchParams(location.search).get("id");
  if (id) loadEntry(id);
  else showStart();
});
