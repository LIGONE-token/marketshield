/* =====================================================
   MarketShield – app.js (FINAL / STABIL)
===================================================== */

let currentEntryId = null;

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  loadCategories();

  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  if (id) loadEntry(id);

  initReport();
  initBackHome();
});

/* ================= GLOBAL CLICK (Navigation) ================= */
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
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/* ================= SHARE ================= */
function renderShareButtons(title) {
  const box = document.getElementById("shareBox");
  if (!box) return;

  const url = encodeURIComponent(location.href);
  const text = encodeURIComponent(title + " – MarketShield");

  box.innerHTML = `
    <div class="share-box">
      <a href="https://wa.me/?text=${text}%20${url}" target="_blank">WhatsApp</a>
      <a href="https://t.me/share/url?url=${url}&text=${text}" target="_blank">Telegram</a>
      <a href="https://twitter.com/intent/tweet?url=${url}&text=${text}" target="_blank">X</a>
      <a href="https://www.facebook.com/sharer/sharer.php?u=${url}" target="_blank">Facebook</a>
    </div>
  `;
}

/* ================= SCORES ================= */
function renderHealth(score) {
  if (score >= 80) return "💚💚💚";
  if (score >= 60) return "💚💚";
  if (score >= 40) return "💚";
  if (score >= 20) return "🧡";
  return "⚠️❗⚠️";
}

function renderIndustry(score) {
  const n = toNum(score);
  if (!n || n <= 0) return "";
  const w = Math.round((n / 10) * 80);
  return `
    <div style="width:80px;height:8px;background:#e0e0e0;border-radius:6px;overflow:hidden;">
      <div style="width:${w}px;height:8px;background:#2e7d32;"></div>
    </div>
  `;
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

/* ================= SUCHE ================= */
const input = document.getElementById("searchInput");
const results = document.getElementById("results");

if (input) {
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

async function loadCategory(cat) {
  const data = await supa(
    `entries?select=id,title,summary,score,processing_score&category=eq.${encodeURIComponent(cat)}`
  );
  renderList(data);
}

function renderList(data) {
  results.innerHTML = data.map(e => `
    <div class="entry-card" data-id="${e.id}">
      <div style="font-size:20px;font-weight:800;">${escapeHtml(e.title)}</div>
      <div>${renderHealth(e.score || 0)} ${renderIndustry(e.processing_score || 0)}</div>
      <div>${escapeHtml(e.summary || "")}</div>
    </div>
  `).join("");
}

/* ================= DETAIL ================= */
async function loadEntry(id) {
  const data = await supa(`entries?select=*&id=eq.${id}`);
  const e = data[0];
  if (!e) return;

  currentEntryId = id;

  results.innerHTML = `
    <h2>${escapeHtml(e.title)}</h2>
    <div id="shareBox"></div>
    ${renderHealth(e.score || 0)}
    ${renderIndustry(e.processing_score || 0)}
    <p>${escapeHtml(e.summary || "")}</p>
  `;

  renderShareButtons(e.title);
  updateBackHome();
}

/* ================= REPORT ================= */
function initReport() {
  const btn = document.getElementById("reportBtn");
  const modal = document.getElementById("reportModal");
  const close = document.getElementById("closeReportModal");
  const form = document.getElementById("reportForm");

  if (!btn || !modal || !form) return;

  btn.onclick = () => modal.classList.add("active");
  close.onclick = () => modal.classList.remove("active");

  form.onsubmit = async (e) => {
    e.preventDefault();

    const description = form.description.value.trim();
    if (!description) return alert("Bitte Beschreibung eingeben.");

    await fetch(`${SUPABASE_URL}/rest/v1/reports`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        description,
        entry_id: currentEntryId,
        entry_url: location.href
      })
    });

    form.reset();
    modal.classList.remove("active");
    alert("Meldung gesendet. Danke!");
  };
}

/* ================= BACK HOME ================= */
function initBackHome() {
  const back = document.getElementById("backHome");
  if (!back) return;

  back.onclick = () => {
    history.pushState(null, "", location.pathname);
    results.innerHTML = "";
    updateBackHome();
  };

  window.addEventListener("popstate", updateBackHome);
}

function updateBackHome() {
  const back = document.getElementById("backHome");
  if (!back) return;
  back.style.display = location.search.includes("id=") ? "block" : "none";
}
