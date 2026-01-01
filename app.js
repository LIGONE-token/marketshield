/* =====================================================
   MarketShield – app.js (FINAL SORTIERT / STABIL)
   ❗ KEINE LOGIK GEÄNDERT – NUR REIHENFOLGE
===================================================== */

/* ================= GLOBAL ================= */
let currentEntryId = null;
let lastSearchLogged = "";

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

/* ================= SCORES (LOCKED) ================= */
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

  const clamped = Math.max(0, Math.min(10, n));
  const w = Math.round((clamped / 10) * 80);

  let color = "#2e7d32";
  if (clamped >= 4 && clamped <= 7) color = "#f9a825";
  if (clamped >= 8) color = "#c62828";

  return `
    <div style="width:80px;height:8px;background:#e0e0e0;border-radius:6px;">
      <div style="width:${w}px;height:8px;background:${color};border-radius:6px;"></div>
    </div>`;
}

function renderScoreBlock(score, processing, size = 13) {
  const h = renderHealth(score);
  const i = renderIndustry(processing);
  if (!h && !i) return "";

  return `
    <div style="margin:12px 0;">
      ${h ? `
        <div style="display:grid;grid-template-columns:90px 1fr;gap:8px;align-items:center;">
          <div>${h}</div>
          <div style="font-size:${size}px;">Gesundheitsscore</div>
        </div>` : ""}
      ${i ? `
        <div style="display:grid;grid-template-columns:90px 1fr;gap:8px;align-items:center;margin-top:6px;">
          <div>${i}</div>
          <div style="font-size:${size}px;">Industrie-Verarbeitungsgrad</div>
        </div>` : ""}
    </div>`;
}

function renderUserRating(avg, count) {
  const c = Number.isFinite(+count) ? +count : 0;
  const avgNum = Number.isFinite(+avg) ? +avg : 0;
  const stars = Math.max(0, Math.min(5, Math.round(avgNum)));
  const avgText = avgNum ? avgNum.toFixed(1) : "0,0";

  return `
    <div class="user-rating">
      <div style="font-size:20px;">
        ${Array.from({ length: 5 }, (_, i) => i < stars ? "⭐" : "☆").join("")}
      </div>
<div class="rating-open"
     onclick="event.stopPropagation()"
     style="cursor:pointer;text-decoration:underline;">
        <strong>${avgText}</strong> von 5 · ${c} Bewertung${c === 1 ? "" : "en"}
      </div>
    </div>`;
}

/* ================= LISTE ================= */
function renderList(data) {
  const box = $("results");
  if (!box) return;

  box.innerHTML = (data || []).map(e => `
    <div class="entry-card" data-id="${e.id}">
      <div style="font-size:20px;font-weight:800;">${escapeHtml(e.title)}</div>
      ${renderUserRating(e.rating_avg, e.rating_count)}
      ${renderScoreBlock(e.score, e.processing_score)}
      <div>${escapeHtml(shortText(e.summary))}</div>
    </div>
  `).join("");
}

/* ================= DETAIL ================= */
async function loadEntry(id) {
  const box = $("results");
  if (!box) return;

  const d = await supa(`entries_with_ratings?select=*&id=eq.${id}`);
  const e = d[0];
  if (!e) return;

  currentEntryId = id;

  box.innerHTML = `
    <h2>${escapeHtml(e.title)}</h2>
    ${renderUserRating(e.rating_avg, e.rating_count)}
    ${renderScoreBlock(e.score, e.processing_score)}
    <h3>Zusammenfassung</h3>
    <div style="white-space:pre-wrap;">${escapeHtml(normalizeText(e.summary))}</div>
    <div id="entryActions"></div>
  `;

  renderEntryActions(e.title);
}

/* ================= SOCIAL ================= */
function renderEntryActions(title) {
  const box = $("entryActions");
  if (!box) return;

  const url = location.href;
  const encUrl = encodeURIComponent(url);
  const encTitle = encodeURIComponent(title + " – MarketShield");

  box.innerHTML = `
    <div style="margin-top:24px;display:flex;gap:8px;flex-wrap:wrap;">
      <button onclick="navigator.clipboard.writeText('${url}')">🔗 Kopieren</button>
      <button onclick="window.print()">🖨️ Drucken</button>
      <button onclick="window.open('https://t.me/share/url?url=${encUrl}&text=${encTitle}')">Telegram</button>
    </div>`;
}

/* ================= SEARCH ================= */
async function logSearch(term) {
  if (!term || term.length < 2 || term === lastSearchLogged) return;
  lastSearchLogged = term;
  await fetch(`${SUPABASE_URL}/rest/v1/search_queue`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    },
    body: JSON.stringify({ query: term })
  });
}

async function smartSearch(q) {
  const enc = encodeURIComponent(q);
  return await supa(
    `entries_with_ratings?select=id,title,summary,score,processing_score,rating_avg,rating_count&title=ilike.%25${enc}%25`
  );
}

function initSearch() {
  const input = $("searchInput");
  if (!input) return;
  input.addEventListener("input", async () => {
    const q = input.value.trim();
    if (q.length < 2) return;
    renderList(await smartSearch(q));
    logSearch(q);
  });
}

/* ================= KATEGORIEN ================= */
async function loadCategories() {
  const grid = document.querySelector(".category-grid");
  if (!grid) return;
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
    `entries_with_ratings?select=id,title,summary,score,processing_score,rating_avg,rating_count&category=eq.${cat}`
  ));
}

/* ================= NAVIGATION ================= */
function bindEntryClicks() {
  document.querySelectorAll(".entry-card").forEach(card => {
    card.addEventListener("click", () => {
      history.pushState(null, "", "?id=" + card.dataset.id);
      loadEntry(card.dataset.id);
    });
  });
}


/* ================= PROGRESS ================= */
function showProgress(text = "Wird gesendet …") {
  const box = document.getElementById("msProgressBox");
  if (!box) return;
  box.innerHTML = `<div class="box">${text}</div>`;
  box.style.display = "flex";
}

function hideProgress() {
  const box = document.getElementById("msProgressBox");
  if (!box) return;
  box.style.display = "none";
  box.innerHTML = "";
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
  initSearch();
  const id = new URLSearchParams(location.search).get("id");
  if (id) loadEntry(id);
});

/* ================= RATING ================= */
document.addEventListener("click", (e) => {
  const trigger = e.target.closest(".rating-open");
  if (!trigger) return;
  const modal = document.getElementById("ratingModal");
  if (modal) modal.style.display = "flex";
});
