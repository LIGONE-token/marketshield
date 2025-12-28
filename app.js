/* =====================================================
   MarketShield – app.js (FINAL / STABIL / WIE VORHER)
   ❗ KEINE neuen Buttons
   ❗ KEIN UI-Umbau
   ✅ Bestehende obere Buttons funktionieren
   ✅ Tabellen korrekt dargestellt
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
  if (!r.ok) throw new Error(t);
  return t ? JSON.parse(t) : [];
}

/* ================= HELPERS ================= */
const $ = (id) => document.getElementById(id);

function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeText(text) {
  if (!text) return "";
  return String(text)
    .replace(/\*\*/g, "")
    .replace(/##+/g, "")
    .replace(/__+/g, "")
    .replace(/~~+/g, "")
    .replace(/`+/g, "")
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function shortText(t, max = 160) {
  t = normalizeText(t);
  return t.length > max ? t.slice(0, max) + " …" : t;
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
  const w = Math.min(80, Math.max(0, Math.round((n / 10) * 80)));
  return `
    <div style="width:80px;height:8px;background:#e0e0e0;border-radius:6px;">
      <div style="width:${w}px;height:8px;background:#2e7d32;border-radius:6px;"></div>
    </div>`;
}

function renderScoreBlock(score, processing) {
  const h = renderHealth(score);
  const i = renderIndustry(processing);
  if (!h && !i) return "";
  return `
    <div style="margin:12px 0;">
      ${h ? `<div style="display:grid;grid-template-columns:90px 1fr;gap:8px;">
        <div>${h}</div><div>Gesundheitsscore</div></div>` : ""}
      ${i ? `<div style="display:grid;grid-template-columns:90px 1fr;gap:8px;">
        <div>${i}</div><div>Industrie-Verarbeitungsgrad</div></div>` : ""}
    </div>`;
}

/* ================= TABELLEN ================= */
function looksLikeMarkdownTable(lines) {
  return lines.length > 1 && lines[0].includes("|") && /^[\s|\-:]+$/.test(lines[1]);
}

function splitRow(line) {
  return line.replace(/^\||\|$/g, "").split("|").map(c => c.trim());
}

function renderMarkdownTable(lines) {
  const head = splitRow(lines[0]);
  const body = lines.slice(2).map(splitRow);
  return `
    <table class="ms-table">
      <thead><tr>${head.map(h => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead>
      <tbody>
        ${body.map(r => `<tr>${r.map(c => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`).join("")}
      </tbody>
    </table>`;
}

function renderRichText(text) {
  const blocks = normalizeText(text).split(/\n\s*\n/g);
  return blocks.map(b => {
    const lines = b.split("\n");
    if (looksLikeMarkdownTable(lines)) return renderMarkdownTable(lines);
    return `<p>${escapeHtml(b).replace(/\n/g, "<br>")}</p>`;
  }).join("");
}

/* ================= LISTE ================= */
function renderList(data) {
  $("results").innerHTML = (data || []).map(e => `
    <div class="entry-card" data-id="${e.id}">
      <div style="font-size:20px;font-weight:800;">${escapeHtml(e.title)}</div>
      ${renderScoreBlock(e.score, e.processing_score)}
      <div>${escapeHtml(shortText(e.summary))}</div>
    </div>
  `).join("");
}

/* ================= REPORT ================= */
async function reportEntry(entry) {
  const text = prompt("Was stimmt nicht?");
  if (!text || text.trim().length < 3) return;
  await supa("reports", {
    method: "POST",
    body: {
      description: text.trim(),
      entry_id: entry.id
    }
  });
  alert("Danke! Meldung gespeichert.");
}

/* ================= TOP BUTTONS (BESTEHEND) ================= */
function bindTopActions(entry) {
  const reportBtn = $("reportBtn");
  if (reportBtn) reportBtn.onclick = () => reportEntry(entry);

  const backBtn = $("backHomeBtn");
  if (backBtn) backBtn.onclick = (e) => {
    e.preventDefault();
    history.pushState(null, "", location.pathname);
    $("results").innerHTML = "";
  };
}

/* ================= DETAIL ================= */
async function loadEntry(id) {
  const d = await supa(`entries?select=*&id=eq.${id}`);
  const e = d[0];
  if (!e) return;

  currentEntryId = id;
  $("results").innerHTML = `
    <h2>${escapeHtml(e.title)}</h2>
    ${renderScoreBlock(e.score, e.processing_score)}
    <h3>Zusammenfassung</h3>
    ${renderRichText(e.summary)}
  `;

  bindTopActions(e);
}

/* ================= SEARCH ================= */
async function smartSearch(q) {
  if (q.length < 2) return [];
  const enc = encodeURIComponent(q);
  return await supa(
    `entries?select=id,title,summary,score,processing_score&or=(title.ilike.%25${enc}%25,summary.ilike.%25${enc}%25)`
  );
}

function initSearch() {
  $("searchInput").addEventListener("input", async e => {
    const q = e.target.value.trim();
    if (q.length < 2) return $("results").innerHTML = "";
    renderList(await smartSearch(q));
  });
}

/* ================= KATEGORIEN ================= */
async function loadCategories() {
  const grid = document.querySelector(".category-grid");
  const data = await fetch("categories.json").then(r => r.json());
  grid.innerHTML = "";
  data.categories.forEach(c => {
    const b = document.createElement("button");
    b.textContent = c.title;
    b.onclick = () => loadCategory(c.title);
    grid.appendChild(b);
  });
}

async function loadCategory(cat) {
  renderList(await supa(
    `entries?select=id,title,summary,score,processing_score&category=eq.${cat}`
  ));
}

/* ================= NAV ================= */
document.addEventListener("click", e => {
  if (e.target.closest("button")) return;
  const c = e.target.closest(".entry-card");
  if (!c) return;
  history.pushState(null, "", "?id=" + c.dataset.id);
  loadEntry(c.dataset.id);
});

window.addEventListener("popstate", () => {
  const id = new URLSearchParams(location.search).get("id");
  if (id) loadEntry(id);
  else $("results").innerHTML = "";
});

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
  initSearch();
  const id = new URLSearchParams(location.search).get("id");
  if (id) loadEntry(id);
});
