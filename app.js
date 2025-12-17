/* =====================================================
   MarketShield – app.js (FINAL / STABIL / EINHEITLICH)
===================================================== */

/* ================= INIT ================= */
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
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
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

/* ================= EINHEITLICHE SCORE-LABEL ================= */
const SCORE_LABEL_STYLE = `
  font-size:13px;
  font-weight:700;
  line-height:1.2;
  color:#222;
`;

/* ================= TEXT (ABSÄTZE KORREKT) ================= */
function formatText(text) {
  if (!text) return "";
  const normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return normalized
    .split(/\n\s*\n/)
    .map(p => `
      <p style="margin:0 0 22px 0; line-height:1.8; font-size:16px;">
        ${escapeHtml(p.trim())}
      </p>
    `)
    .join("");
}

/* ================= HEALTH SCORE ================= */
function renderHealth(score) {
  if (score >= 80) return "💚💚💚";
  if (score >= 60) return "💚💚";
  if (score >= 40) return "💚";
  if (score >= 20) return "🧡";
  return "⚠️❗⚠️";
}

/* ================= INDUSTRIE (DETAIL – SCHMAL) ================= */
function renderIndustry(score) {
  const n0 = toNum(score);
  if (!n0 || n0 <= 0) return "";

  const s = Math.max(1, Math.min(10, Math.round(n0)));
  let color = "#2e7d32";
  if (s >= 4) color = "#f9a825";
  if (s >= 7) color = "#c62828";

  const w = Math.round((s / 10) * 120);

  return `
    <div style="margin-top:6px;">
      <div style="width:120px;height:8px;background:#e0e0e0;border-radius:6px;overflow:hidden;">
        <div style="width:${w}px;height:8px;background:${color};"></div>
      </div>
      <div style="${SCORE_LABEL_STYLE}; margin-top:4px;">
        Industrie-Verarbeitungsgrad
      </div>
    </div>
  `;
}

/* ================= SCORE-BLOCK (DETAIL) ================= */
function renderScoreBlock(score, processing) {
  return `
    <div style="display:grid;grid-template-columns:56px 1fr;column-gap:12px;margin:14px 0 18px 0;">
      <div style="font-size:18px;line-height:1.1;white-space:nowrap;">
        ${renderHealth(score)}
      </div>
      <div>
        <div style="${SCORE_LABEL_STYLE}; margin-bottom:6px;">
          Gesundheitsscore
        </div>
        ${renderIndustry(processing)}
      </div>
    </div>
  `;
}

/* ================= SCORE-BLOCK (KURZANSICHT – RESPONSIV) ================= */
function renderScoreBlockCompact(score, processing) {
  const isMobile = window.innerWidth <= 600;
  const heartSize = isMobile ? 12 : 13;
  const colLeft   = isMobile ? 36 : 44;
  const gap       = isMobile ? 8  : 10;
  const barW      = isMobile ? 60 : 70;
  const barH      = isMobile ? 4  : 5;

  return `
    <div style="display:grid;grid-template-columns:${colLeft}px 1fr;column-gap:${gap}px;margin-bottom:6px;">
      <div style="font-size:${heartSize}px;line-height:1;white-space:nowrap;">
        ${renderHealth(score)}
      </div>
      <div>
        <div style="${SCORE_LABEL_STYLE}; margin-bottom:2px;">
          Gesundheitsscore
        </div>
        ${renderIndustryCompact(processing, barW, barH)}
      </div>
    </div>
  `;
}

function renderIndustryCompact(score, barW, barH) {
  const n0 = toNum(score);
  if (!n0 || n0 <= 0) return "";
  const s = Math.max(1, Math.min(10, Math.round(n0)));
  const w = Math.round((s / 10) * barW);

  return `
    <div style="margin-top:2px;">
      <div style="width:${barW}px;height:${barH}px;background:#e0e0e0;border-radius:4px;overflow:hidden;">
        <div style="width:${w}px;height:${barH}px;background:#777;"></div>
      </div>
      <div style="${SCORE_LABEL_STYLE}; margin-top:3px;">
        Industrie-Verarbeitungsgrad
      </div>
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

/* ================= SUCHE / KATEGORIE ================= */
const input = document.getElementById("searchInput");
const results = document.getElementById("results");

if (input) {
  input.addEventListener("input", async () => {
    const q = input.value.trim();
    if (q.length < 2) { results.innerHTML = ""; return; }
    const enc = encodeURIComponent(q);
    const data = await supa(
      `entries?select=id,title,summary,score,processing_score&or=(title.ilike.%25${enc}%25,summary.ilike.%25${enc}%25,mechanism.ilike.%25${enc}%25)`
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

/* ================= LISTE (KURZANSICHT) ================= */
function renderList(data) {
  results.innerHTML = data.map(e => `
    <div class="entry-card" data-id="${e.id}" style="padding:14px;border-bottom:1px solid #ddd;cursor:pointer;">
      ${renderScoreBlockCompact(toNum(e.score) || 0, e.processing_score)}
      <div style="font-size:20px;font-weight:800;margin:6px 0 4px 0;">
        ${escapeHtml(e.title)}
      </div>
      <div style="display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:1;overflow:hidden;font-size:15px;line-height:1.4;color:#333;">
        ${escapeHtml(e.summary || "").replace(/\s+/g, " ").trim()}
      </div>
      <div style="margin-top:6px;color:#1e88e5;font-weight:700;">Öffnen →</div>
    </div>
  `).join("");
}

/* ================= DETAILANSICHT ================= */
async function loadEntry(id) {
  const data = await supa(`entries?select=*&id=eq.${id}`);
  const e = data[0];
  if (!e) { results.innerHTML = "Eintrag nicht gefunden"; return; }

  const hs = toNum(e.score) || 0;

  results.innerHTML = `
    <h2 style="font-size:22px;font-weight:900;margin:6px 0 10px 0;">
      ${escapeHtml(e.title)}
    </h2>
    ${renderScoreBlock(hs, e.processing_score)}
    ${hs < 20 ? `<div style="margin:16px 0;padding:14px;border:2px solid #c62828;background:#fff0f0;font-weight:900;">⚠️ DEUTLICHE WARNUNG</div>` : ""}
    ${e.summary ? `<h3>Zusammenfassung</h3>${formatText(e.summary)}` : ""}
    ${e.mechanism ? `<h3>Wirkmechanismus</h3>${formatText(e.mechanism)}` : ""}
    ${renderListSection("Risiken & Risikogruppen", e.risk_groups)}
    ${renderListSection("Negative Effekte", e.effects_negative)}
    ${renderListSection("Positive Effekte", e.effects_positive)}
    ${renderListSection("Synergien", e.synergy)}
    ${renderListSection("Natürliche Quellen", e.natural_sources)}
  `;
}

/* ================= JSON-LISTEN ================= */
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
