/* =====================================================
   MarketShield – app.js (FINAL / STABIL / SAUBER)
===================================================== */

let currentEntryId = null;

const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
const SUPABASE_KEY = "sb_publishable_FBywhrypx6zt_0nMlFudyQ_zFiqZKTD";

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  injectStyles();
  initSearch();
  loadCategories();
  initReport();
  initBackHome();

  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  if (id) loadEntry(id);
});

/* ================= SUPABASE ================= */
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
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
}

/* ================= STYLES ================= */
function injectStyles() {
  if ($("msStyles")) return;

  const style = document.createElement("style");
  style.id = "msStyles";
  style.textContent = `
    .ms-tablewrap { overflow-x:auto; margin:14px 0; }
    table.ms-table { border-collapse:collapse; min-width:640px; width:100%; }
    .ms-table th, .ms-table td { border:1px solid #ddd; padding:8px; }
    .ms-table th { background:#f5f5f5; }

    [data-tooltip] { position:relative; cursor:help; }
    [data-tooltip]::after {
      content: attr(data-tooltip);
      position:absolute;
      bottom:125%;
      left:0;
      background:rgba(0,0,0,.9);
      color:#fff;
      padding:6px 8px;
      border-radius:6px;
      font-size:13px;
      opacity:0;
      pointer-events:none;
      transition:.15s;
      white-space:normal;
      max-width:300px;
      z-index:9999;
    }
    [data-tooltip]:hover::after { opacity:1; }
  `;
  document.head.appendChild(style);
}

/* ================= CATEGORIES ================= */
async function loadCategories() {
  const grid = document.querySelector(".category-grid");
  if (!grid) return;

  const res = await fetch("categories.json");
  const data = await res.json();

  grid.innerHTML = "";
  data.categories.forEach(c => {
    const btn = document.createElement("button");
    btn.textContent = c.title;
    btn.onclick = () => loadCategory(c.title);
    grid.appendChild(btn);
  });
}

async function loadCategory(cat) {
  const data = await supa(
    `entries?select=id,title,summary,score,processing_score&category=eq.${encodeURIComponent(cat)}`
  );
  renderList(data);
}

/* ================= SEARCH ================= */
function initSearch() {
  const input = $("searchInput");
  const results = $("results");
  if (!input || !results) return;

  input.addEventListener("input", async () => {
    const q = input.value.trim();
    if (q.length < 2) {
      results.innerHTML = "";
      return;
    }
    const enc = encodeURIComponent(q);
    const data = await supa(
      `entries?select=id,title,summary,score,processing_score&or=(title.ilike.%25${enc}%25,summary.ilike.%25${enc}%25)`
    );
    renderList(data);
  });
}

/* ================= RENDER LIST ================= */
function renderList(data) {
  $("results").innerHTML = data.map(e => `
    <div class="entry-card" data-id="${e.id}">
      <h3>${escapeHtml(e.title)}</h3>
      <div>${escapeHtml(e.summary || "")}</div>
    </div>
  `).join("");

  document.querySelectorAll(".entry-card").forEach(card => {
    card.addEventListener("click", () => {
      history.pushState(null, "", "?id=" + card.dataset.id);
      loadEntry(card.dataset.id);
    });
  });
}

/* ================= DETAIL ================= */
async function loadEntry(id) {
  const data = await supa(`entries?select=*&id=eq.${id}`);
  const e = data[0];
  if (!e) return;

  currentEntryId = id;

  $("results").innerHTML = `
    <h2>${escapeHtml(e.title)}</h2>
    ${renderTextBlock("Zusammenfassung", e.summary)}
    <div id="entryActions"></div>
  `;

  renderEntryActions(e.title);
}

/* ================= TEXT + TABLE ================= */
function renderTextBlock(title, text) {
  if (!text) return "";
  return `<h3>${escapeHtml(title)}</h3><p>${escapeHtml(normalizeText(text))}</p>`;
}

/* ================= SOCIAL ================= */
function renderEntryActions(title) {
  const box = $("entryActions");
  if (!box) return;

  box.innerHTML = `
    <button onclick="navigator.clipboard.writeText(location.href)">🔗 Kopieren</button>
    <button onclick="window.print()">🖨️ Drucken</button>
  `;
}

/* ================= REPORT ================= */
function initReport() {
  const btn = $("reportBtn");
  const modal = $("reportModal");
  const close = $("closeReportModal");
  const form = $("reportForm");

  if (!btn || !modal || !form) return;

  btn.onclick = () => modal.classList.add("active");
  close.onclick = () => modal.classList.remove("active");

  form.onsubmit = async (e) => {
    e.preventDefault();
    const description = form.description.value.trim();
    if (!description) return;

    await fetch(`${SUPABASE_URL}/rest/v1/reports`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ description, entry_id: currentEntryId })
    });

    modal.classList.remove("active");
    form.reset();
  };
}

/* ================= BACK HOME ================= */
function initBackHome() {
  const back = $("backHome");
  if (!back) return;

  back.onclick = () => {
    history.pushState(null, "", location.pathname);
    $("results").innerHTML = "";
  };
}
