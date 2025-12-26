/* =====================================================
   MarketShield – app.js (FINAL / STABIL)
   ✔ Suche korrekt priorisiert
   ✔ Kategorien sichtbar
   ✔ Markdown-Reste entfernt
   ✔ Keys unverändert
===================================================== */

let currentEntryId = null;

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

/* Text bereinigen (## ** usw.) */
function normalizeText(text) {
  if (!text) return "";
  return String(text)
    .replace(/\*\*/g, "")
    .replace(/##+/g, "")
    .replace(/__+/g, "")
    .replace(/~~+/g, "")
    .replace(/`+/g, "")
    .replace(/\\n\\n/g, "\n\n")
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
  if (!n || n <= 0) return "";
  if (n >= 80) return "💚💚💚";
  if (n >= 60) return "💚💚";
  if (n >= 40) return "💚";
  if (n >= 20) return "💛";
  return "⚠️❗⚠️";
}

function renderIndustry(score) {
  const n = Number(score);
  if (!n || n <= 0) return "";
  const w = Math.round((n / 10) * 80);
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
      ${h ? `<div style="display:flex;gap:8px;align-items:center">
        <div>${h}</div><div style="opacity:.8">Gesundheitsscore</div>
      </div>` : ""}
      ${i ? `<div style="display:flex;gap:8px;align-items:center;margin-top:6px">
        <div>${i}</div><div style="opacity:.8">Industrie-Verarbeitungsgrad</div>
      </div>` : ""}
    </div>`;
}

/* ================= LISTE ================= */
function renderList(data) {
  const box = $("results");
  if (!box) return;

  box.innerHTML = (data || []).map(e => `
    <div class="entry-card" data-id="${e.id}">
      <div style="font-size:20px;font-weight:800">${escapeHtml(e.title)}</div>
      ${renderScoreBlock(e.score, e.processing_score)}
      <div style="font-size:15px;line-height:1.4">
        ${escapeHtml(shortText(e.summary))}
      </div>
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

    <h3>Zusammenfassung</h3>
    <div style="white-space:pre-wrap;line-height:1.6">
      ${escapeHtml(normalizeText(e.summary))}
    </div>
  `;
}

/* ================= 🔍 SMART SEARCH ================= */
async function smartSearch(q) {
  const enc = encodeURIComponent(q);

  // 1️⃣ Titel beginnt mit Suchwort (höchste Priorität)
  const exact = await supa(
    `entries?select=id,title,summary,score,processing_score&title.ilike.${enc}%25`
  );

  const exactIds = new Set((exact || []).map(e => e.id));

  // 2️⃣ Enthält Suchwort (Titel oder Summary)
  const broad = await supa(
    `entries?select=id,title,summary,score,processing_score&or=(title.ilike.%25${enc}%25,summary.ilike.%25${enc}%25)`
  );

  return [
    ...(exact || []),
    ...(broad || []).filter(e => !exactIds.has(e.id))
  ];
}

/* ================= SEARCH ================= */
function initSearch() {
  const input = $("searchInput");
  const box = $("results");
  if (!input || !box) return;

  input.addEventListener("input", async () => {
    const q = input.value.trim();
    if (q.length < 2) {
      box.innerHTML = "";
      return;
    }
    try {
      const data = await smartSearch(q);
      renderList(data);
    } catch (e) {
      console.error(e);
      box.innerHTML = "<div style='opacity:.6'>Keine Treffer</div>";
    }
  });

  input.addEventListener("keydown", async (e) => {
    if (e.key !== "Enter") return;
    const q = input.value.trim();
    if (q.length < 2) return;
    const data = await smartSearch(q);
    renderList(data);
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
    b.onclick = () => loadCategory(c.title);
    grid.appendChild(b);
  });
}

async function loadCategory(cat) {
  const data = await supa(
    `entries?select=id,title,summary,score,processing_score&category=eq.${encodeURIComponent(cat)}`
  );
  renderList(data);
}

/* ================= CLICK ================= */
document.addEventListener("click", (e) => {
  const c = e.target.closest(".entry-card");
  if (!c) return;
  history.pushState(null, "", "?id=" + c.dataset.id);
  loadEntry(c.dataset.id);
});

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
  initSearch();

  const id = new URLSearchParams(location.search).get("id");
  if (id) loadEntry(id);
});
