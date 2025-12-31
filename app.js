/* =====================================================
   MarketShield – NEW CORE app.js
===================================================== */

const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
const SUPABASE_KEY = "sb_publishable_FBywhrypx6zt_0nMlFudyQ_zFiqZKTD";

const $ = (id) => document.getElementById(id);

/* ================= SUPABASE ================= */
async function supa(query) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });
  if (!r.ok) throw new Error(await r.text());
  return await r.json();
}

/* ================= HELPERS ================= */
function esc(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function oneLine(text, max = 140) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max) + " …" : text;
}

/* ================= RATINGS (ECHT) ================= */
async function loadRatings(ids) {
  if (!ids.length) return {};
  const rows = await supa(
    `entry_ratings?select=entry_id,rating&entry_id=in.(${ids.map(i => `"${i}"`).join(",")})`
  );

  const map = {};
  rows.forEach(r => {
    if (!map[r.entry_id]) map[r.entry_id] = [];
    map[r.entry_id].push(r.rating);
  });
  return map;
}

function renderStars(avg, count) {
  if (!count) return `<div style="font-size:13px;opacity:.6;">Noch keine Bewertungen</div>`;
  const stars =
    "★★★★★".slice(0, Math.round(avg)) +
    "☆☆☆☆☆".slice(0, 5 - Math.round(avg));
  return `<div style="color:#f5b301;font-size:16px">${stars} <span style="color:#555;font-size:13px">${avg.toFixed(1)} (${count})</span></div>`;
}

/* ================= LIST ================= */
async function renderList(entries) {
  const box = $("results");
  box.innerHTML = "Lade…";

  const ids = entries.map(e => e.id);
  const ratings = await loadRatings(ids);

  box.innerHTML = entries.map(e => {
    const r = ratings[e.id] || [];
    const avg = r.length ? r.reduce((a,b)=>a+b,0)/r.length : 0;

    return `
      <div class="entry-card" data-id="${e.id}">
        <div style="font-size:18px;font-weight:700">${esc(e.title)}</div>
        ${renderStars(avg, r.length)}
        <div class="entry-preview">${esc(oneLine(e.summary))}</div>
      </div>
    `;
  }).join("");
}

/* ================= DETAIL ================= */
async function loadEntry(id) {
  const d = await supa(`entries?select=*&id=eq.${id}`);
  const e = d[0];
  if (!e) return;

  const box = $("results");
  box.innerHTML = `
    <div class="entry-detail">
      <h2>${esc(e.title)}</h2>
      <p>${esc(e.summary)}</p>
    </div>
  `;
}

/* ================= SEARCH ================= */
function initSearch() {
  const input = $("searchInput");
  if (!input) return;

  input.addEventListener("input", async () => {
    const q = input.value.trim();
    if (q.length < 2) {
      $("results").innerHTML = "";
      return;
    }
    renderList(await supa(
      `entries?select=id,title,summary&title=ilike.%25${encodeURIComponent(q)}%25`
    ));
  });
}

/* ================= CATEGORIES ================= */
async function loadCategories() {
  const grid = document.querySelector(".category-grid");
  const data = await fetch("categories.json").then(r => r.json());
  grid.innerHTML = "";

  data.categories.forEach(c => {
    const b = document.createElement("button");
    b.textContent = c.title;
    b.onclick = async () => {
      renderList(await supa(
        `entries?select=id,title,summary&category=eq.${encodeURIComponent(c.title)}`
      ));
    };
    grid.appendChild(b);
  });
}

/* ================= NAV ================= */
document.addEventListener("click", (e) => {
  const card = e.target.closest(".entry-card");
  if (!card) return;
  loadEntry(card.dataset.id);
});

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  $("results").innerHTML = "";
  loadCategories();
  initSearch();
});
