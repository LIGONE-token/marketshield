/* =====================================================
   MarketShield – app.js (FINAL / STABIL / WIE VORHER)
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
});

/* ================= GLOBAL CLICK ================= */
document.addEventListener("click", (e) => {
  const card = e.target.closest("[data-id]");
  if (!card) return;
  loadEntry(card.dataset.id);
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
function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/* ================= TEXT (ABSÄTZE!) ================= */
function formatText(text) {
  if (!text) return "";
  const normalized = text.replace(/\r\n/g, "\n").trim();
  const parts = normalized.split(/\n\s*\n+/);

  return parts.map(p => `
    <p style="
      margin:0 0 20px 0;
      line-height:1.75;
      font-size:16px;
    ">
      ${escapeHtml(p.trim())}
    </p>
  `).join("");
}

/* ================= HEALTH SCORE ================= */
function renderHealth(score) {
  if (score >= 80) return "💚💚💚";
  if (score >= 60) return "💚💚";
  if (score >= 40) return "💚";
  if (score >= 20) return "🧡";
  return "⚠️❗⚠️";
}

/* ================= INDUSTRIE SCORE ================= */
function renderIndustry(score) {
  const n = toNum(score);
  if (!n || n <= 0) return "";

  const s = Math.max(1, Math.min(10, Math.round(n)));
  let color = "#2e7d32";
  if (s >= 4) color = "#f9a825";
  if (s >= 7) color = "#c62828";

  const w = Math.round((s / 10) * 120);

  return `
    <div style="display:flex; align-items:center; gap:8px; margin-top:6px;">
      <strong>Industrie-Verarbeitungsgrad</strong>
      <div style="width:120px;height:8px;background:#e0e0e0;border-radius:6px;overflow:hidden;">
        <div style="width:${w}px;height:8px;background:${color};"></div>
      </div>
      <span style="font-size:12px;">${s}/10</span>
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

/* ================= KATEGORIE ================= */
async function loadCategory(cat) {
  const data = await supa(
    `entries?select=id,title,summary,score,processing_score&category=eq.${encodeURIComponent(cat)}`
  );
  renderList(data);
}

/* ================= LISTE (KURZANSICHT) ================= */
function renderList(data) {
  results.innerHTML = data.map(e => `
    <div class="entry-card" data-id="${e.id}" style="
      padding:14px;
      border-bottom:1px solid #ddd;
      cursor:pointer;
    ">
      <div style="margin-bottom:6px;">
        <strong>Gesundheitsscore</strong>
        <span style="margin-left:6px;font-size:18px;">
          ${renderHealth(toNum(e.score) || 0)}
        </span>
      </div>

      ${renderIndustry(e.processing_score)}

      <div style="font-size:20px;font-weight:800;margin:8px 0 4px 0;">
        ${escapeHtml(e.title)}
      </div>

      <div style="
        display:-webkit-box;
        -webkit-box-orient:vertical;
        -webkit-line-clamp:1;
        overflow:hidden;
        font-size:15px;
      ">
        ${escapeHtml(e.summary || "")}
      </div>

      <div style="margin-top:6px;color:#1e88e5;font-weight:700;">
        Öffnen →
      </div>
    </div>
  `).join("");
}

/* ================= DETAIL ================= */
async function loadEntry(id) {
  const data = await supa(`entries?select=*&id=eq.${id}`);
  const e = data[0];
  if (!e) {
    results.innerHTML = "Eintrag nicht gefunden";
    return;
  }

  const hs = toNum(e.score) || 0;

  results.innerHTML = `
    <h2 style="font-size:22px;font-weight:900;margin:6px 0 10px 0;">
      ${escapeHtml(e.title)}
    </h2>

    <div style="margin-bottom:10px;">
      <strong>Gesundheitsscore</strong>
      <span style="margin-left:6px;font-size:20px;">
        ${renderHealth(hs)}
      </span>
    </div>

    ${renderIndustry(e.processing_score)}

    ${hs < 20 ? `
      <div style="
        margin:16px 0;
        padding:14px;
        border:2px solid #c62828;
        background:#fff0f0;
        font-weight:900;
      ">
        ⚠️ DEUTLICHE WARNUNG
      </div>` : ""}

    ${e.summary ? `<h3>Zusammenfassung</h3>${formatText(e.summary)}` : ""}
    ${e.mechanism ? `<h3>Wirkmechanismus</h3>${formatText(e.mechanism)}` : ""}

    ${renderListSection("Risiken & Risikogruppen", e.risk_groups)}
    ${renderListSection("Negative Effekte", e.effects_negative)}
    ${renderListSection("Positive Effekte", e.effects_positive)}
    ${renderListSection("Synergien", e.synergy)}
    ${renderListSection("Natürliche Quellen", e.natural_sources)}
  `;
}

/* ================= JSON LISTEN ================= */
function renderListSection(title, data) {
  if (!data) return "";

  let arr = data;
  if (typeof data === "string") {
    try { arr = JSON.parse(data); } catch { return ""; }
  }

  if (!Array.isArray(arr) || arr.length === 0) return "";

  return `
    <h3>${title}</h3>
    <ul style="margin-left:20px;line-height:1.7;">
      ${arr.map(v => `<li>${escapeHtml(v)}</li>`).join("")}
    </ul>
  `;
}
