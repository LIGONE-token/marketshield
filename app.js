/* =====================================================
   MarketShield – app.js (FINAL / LOCKED)
===================================================== */

let currentEntryId = null;

/* ================= SUPABASE ================= */
const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
const SUPABASE_KEY = "sb_publishable_FBywhrypx6zt_0nMlFudyQ_zFiqZKTD";

/* ================= FETCH ================= */
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
  if (!text) return "";

  return String(text)
    // Zeilenweise arbeiten
    .split(/\r?\n/)
    .map(l => l.trim())

    // ❌ GANZE ZEILEN MIT KI-/CONTENT-ARTEFAKTEN RAUS
    .filter(l =>
      !/contentReference\s*\[|oaicite\s*:|:contentReference/i.test(l)
    )

    // Wieder zusammenfügen
    .join("\n")

    // Normale Formatbereinigung
    .replace(/\*\*|##+|__+|~~+|`+/g, "")
    .replace(/\\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
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
    <div style="margin-top:6px">
      <div style="display:flex;align-items:center;gap:8px;font-size:13px">
        <div style="width:${MAX}px;height:6px;background:#e0e0e0;border-radius:4px;overflow:hidden">
          <div style="width:${w}px;height:6px;background:hsl(${hue},85%,45%)"></div>
        </div>
        <div>Industrie-Verarbeitungsgrad</div>
      </div>
    </div>`;
}

function renderScoreBlock(score, processing) {
  const h = renderHealth(score);
  const i = renderIndustry(processing);
  if (!h && !i) return "";
  return `
    <div style="margin:10px 0">
      ${h ? `<div style="display:flex;gap:8px"><div>${h}</div><div>Gesundheit</div></div>` : ""}
      ${i || ""}
    </div>`;
}

/* ================= STARTSEITE ================= */
function showStart() {
  currentEntryId = null;
  const box = $("results");
  if (box) box.innerHTML = "";
}

/* ================= TABELLEN-RENDERER ================= */
function renderSummaryHtml(raw) {
  const text = normalizeText(raw);
  const blocks = text.split(/\n\s*\n/);

  return blocks.map(b => mdTableToHtml(b) || 
    `<p style="white-space:pre-wrap;line-height:1.6">${escapeHtml(b)}</p>`
  ).join("");
}

function mdTableToHtml(block) {
  const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length < 2 || !lines[0].includes("|")) return null;

  const sep = lines[1].replace(/\s+/g, "");
  if (!/^[-:|]+$/.test(sep)) return null;

  const row = (l) => {
    let s = l;
    if (s.startsWith("|")) s = s.slice(1);
    if (s.endsWith("|")) s = s.slice(0, -1);
    return s.split("|").map(c => escapeHtml(c.trim()));
  };

  const head = row(lines[0]);
  const body = lines.slice(2).map(row);

  return `
    <table style="border-collapse:collapse;margin:12px 0;font-size:14px">
      <thead><tr>${head.map(h => `<th style="border:1px solid #ccc;padding:6px">${h}</th>`).join("")}</tr></thead>
      <tbody>${body.map(r => `<tr>${r.map(c => `<td style="border:1px solid #ccc;padding:6px">${c}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>`;
}

/* ================= LISTE ================= */
function renderList(data = []) {
  const box = $("results");
  if (!box) return;
  box.innerHTML = data.map(e => `
    <div class="entry-card" data-id="${e.id}">
      <div style="font-weight:800">${escapeHtml(e.title)}</div>
      ${renderScoreBlock(e.score, e.processing_score)}
      <div>${escapeHtml(normalizeText(e.summary).slice(0,160))}…</div>
    </div>`).join("");
}

/* ================= DETAIL ================= */
async function loadEntry(id) {
  const box = $("results");
  const d = await supa(`entries?select=*&id=eq.${id}`);
  const e = d[0];
  if (!e || !box) return;

  currentEntryId = id;
  box.innerHTML = `
    <h2>${escapeHtml(e.title)}</h2>
    ${renderScoreBlock(e.score, e.processing_score)}
    <div>${renderSummaryHtml(e.summary)}</div>
    <div id="entryActions"></div>`;
}

/* ================= SEARCH ================= */
function initSearch() {
  const input = $("searchInput");
  if (!input) return;
  input.addEventListener("input", async () => {
    const q = input.value.trim();
    if (q.length < 2) return showStart();
    renderList(await supa(`entries?select=id,title,summary,score,processing_score&title=ilike.%25${encodeURIComponent(q)}%25`));
  });
}

/* ================= CATEGORIES ================= */
async function loadCategories() {
  const grid = document.querySelector(".category-grid");
  if (!grid) return;
  const data = await fetch("categories.json").then(r => r.json());
  grid.innerHTML = "";
  data.categories.forEach(c => {
    const b = document.createElement("button");
    b.textContent = c.title;
    b.onclick = async () => renderList(await supa(
      `entries?select=id,title,summary,score,processing_score&category=eq.${c.title}`));
    grid.appendChild(b);
  });
}

/* ================= GLOBAL CLICK HANDLER ================= */
document.addEventListener("click", async (e) => {
  if (e.target.closest(".entry-card")) {
    const id = e.target.closest(".entry-card").dataset.id;
    history.pushState({}, "", "?id=" + id);
    loadEntry(id);
  }

  if (e.target.closest("#backHome")) {
    history.pushState({}, "", location.pathname);
    showStart();
  }

  if (e.target.closest("#reportBtn")) $("reportModal").style.display = "block";
  if (e.target.closest("#closeReportModal")) $("reportModal").style.display = "none";
});

/* ================= REPORT SUBMIT ================= */
document.addEventListener("submit", async (e) => {
  const form = e.target.closest("#reportForm");
  if (!form) return;
  e.preventDefault();

  const txt = form.description.value.trim();
  if (txt.length < 3) return alert("Beschreibung fehlt");

  const res = await fetch(`${SUPABASE_URL}/rest/v1/reports`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      description: txt,
      entry_id: currentEntryId || null,
      created_at: new Date().toISOString()
    })
  });

  if (!res.ok) return alert("Report fehlgeschlagen");
  form.reset();
  $("reportModal").style.display = "none";
  alert("Report gespeichert");
});

/* ================= HISTORY ================= */
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
