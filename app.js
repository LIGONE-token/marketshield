/* =====================================================
   MarketShield – app.js FINAL (KONSISTENT & STABIL)
   - Health: 3 Herzen / Warnsymbol (keine Zahlen)
   - Industrie: schmaler Balken (120px), farbcodiert
   - Absätze: \n\n aus Supabase robust erkannt
   - Kurzansichten: 1 Zeile + Scores, klar klickbar
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
});

/* ---------- GLOBALER KLICK ---------- */
document.addEventListener("click", (e) => {
  const card = e.target.closest(".search-result, .entry-card");
  if (!card || !card.dataset.id) return;
  loadEntry(card.dataset.id);
});

/* ---------- SUPABASE ---------- */
const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
const SUPABASE_KEY = "sb_publishable_FBywhrypx6zt_0nMlFudyQ_zFiqZKTD";

async function supa(query) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  return r.json();
}

/* ---------- HELPERS ---------- */
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

/* ---------- HEALTH SCORE (FINAL) ---------- */
function healthIcons(score) {
  const s = Math.max(0, Math.min(100, Number(score)));
  if (s >= 80) return "💚💚💚";
  if (s >= 60) return "💚💚";
  if (s >= 40) return "💚";
  if (s >= 20) return "🧡";
  return "⚠️❗⚠️";
}

function healthHtml(score) {
  if (score === null) return "";
  return `
    <span style="display:inline-flex; align-items:center; gap:6px;">
      <span style="font-weight:800;">Gesundheit</span>
      <span style="font-size:18px;">${healthIcons(score)}</span>
    </span>
  `;
}

function warningHtml() {
  return `
    <div style="
      margin:16px 0;
      padding:14px;
      border-radius:10px;
      background:#fff0f0;
      border:2px solid #c62828;
      color:#7a0b0b;
      font-weight:900;
      font-size:16px;
    ">
      ⚠️ DEUTLICHE WARNUNG: gesundheitlich kritisch
    </div>
  `;
}

/* ---------- INDUSTRIE SCORE (FINAL) ---------- */
function renderIndustryBar(score) {
  const n0 = toNum(score);
  if (n0 === null || n0 <= 0) return "";

  const n = Math.max(1, Math.min(10, Math.round(n0)));
  let color = "#2e7d32";       // grün
  if (n >= 4) color = "#f9a825"; // gelb
  if (n >= 7) color = "#c62828"; // rot

  const widthPx = Math.round((n / 10) * 120); // FIX: max 120px

  return `
    <span style="display:inline-flex; align-items:center; gap:8px;">
      <span style="font-size:13px; font-weight:700; opacity:.85;">
        Industrie-Verarbeitungsgrad
      </span>
      <span style="
        width:120px; height:8px; background:#e6e6e6;
        border-radius:999px; overflow:hidden;
      ">
        <span style="
          display:block; width:${widthPx}px; height:8px;
          background:${color};
        "></span>
      </span>
      <span style="font-size:12px; font-weight:700; opacity:.7;">
        ${n}/10
      </span>
    </span>
  `;
}

/* ---------- TEXTFORMATIERUNG (ABSÄTZE) ---------- */
function formatText(text) {
  if (!text) return "";
  const normalized = text.replace(/\r\n/g, "\n").trim();
  const paragraphs = normalized.split(/\n\s*\n+/);

  return paragraphs.map(p => `
    <p style="
      margin:0 0 18px 0;
      padding-left:12px;
      border-left:3px solid #e0e0e0;
      line-height:1.75;
      font-size:16px;
      color:#222;
    ">
      ${escapeHtml(p.trim())}
    </p>
  `).join("");
}

/* ---------- KATEGORIEN ---------- */
async function loadCategories() {
  const grid = document.querySelector(".category-grid");
  if (!grid) return;

  const cats = await fetch("categories.json").then(r => r.json());
  grid.innerHTML = "";
  cats.categories.forEach(c => {
    const b = document.createElement("button");
    b.textContent = c.title;
    b.onclick = () => loadCategory(c.title);
    grid.appendChild(b);
  });
}

/* ---------- SUCHE ---------- */
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

/* ---------- KATEGORIE ---------- */
async function loadCategory(cat) {
  const data = await supa(
    `entries?select=id,title,summary,score,processing_score&category=eq.${encodeURIComponent(cat)}`
  );
  renderList(data);
}

/* ---------- LISTE (KURZANSICHT: 1 ZEILE) ---------- */
function renderList(data) {
  results.innerHTML = data.map(e => {
    const hs = toNum(e.score);
    const ind = toNum(e.processing_score);

    return `
      <div class="search-result" data-id="${e.id}" style="
        padding:14px 12px; border-bottom:1px solid #e0e0e0; cursor:pointer;
      ">
        <div style="display:flex; gap:12px; align-items:center; margin-bottom:6px;">
          ${hs !== null ? healthHtml(hs) : ""}
          ${ind !== null && ind > 0 ? renderIndustryBar(ind) : ""}
        </div>

        <div style="font-size:20px; font-weight:800; margin:0 0 4px 0;">
          ${escapeHtml(e.title)}
        </div>

        <div style="
          display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:1;
          overflow:hidden; font-size:15px; line-height:1.4; color:#333;
        ">
          ${escapeHtml(e.summary || "").replace(/\s+/g, " ").trim()}
        </div>

        <div style="margin-top:6px; font-size:14px; font-weight:900; color:#1e88e5;">
          Öffnen →
        </div>
      </div>
    `;
  }).join("");
}

/* ---------- DETAILANSICHT ---------- */
async function loadEntry(id) {
  const data = await supa(`entries?select=*&id=eq.${id}`);
  const e = data[0];
  if (!e) { results.innerHTML = "Eintrag nicht gefunden"; return; }

  const hs = toNum(e.score);
  const ind = toNum(e.processing_score);

  results.innerHTML = `
    <h2 style="font-size:22px; font-weight:900; margin:6px 0 10px 0;">
      ${escapeHtml(e.title)}
    </h2>

    <div style="display:flex; gap:14px; align-items:center; margin-bottom:10px;">
      ${hs !== null ? healthHtml(hs) : ""}
      ${ind !== null && ind > 0 ? renderIndustryBar(ind) : ""}
    </div>

    ${hs !== null && hs < 20 ? warningHtml() : ""}

    ${e.summary ? `
      <section style="margin:22px 0;">
        <h3 style="font-size:20px; font-weight:900; margin:0 0 18px 0;">
          Zusammenfassung
        </h3>
        ${formatText(e.summary)}
      </section>` : ""}

    ${e.mechanism ? `
      <section style="margin:22px 0;">
        <h3 style="font-size:20px; font-weight:900; margin:0 0 18px 0;">
          Wirkmechanismus
        </h3>
        ${formatText(e.mechanism)}
      </section>` : ""}

    ${e.risk_groups ? `
      <section style="margin:22px 0;">
        <h3 style="font-size:20px; font-weight:900; margin:0 0 18px 0;">
          Risiken & Risikogruppen
        </h3>
        <ul style="margin:0 0 0 22px; padding:0; line-height:1.7;">
          ${JSON.parse(e.risk_groups).map(r => `
            <li style="margin-bottom:10px;">${escapeHtml(r)}</li>
          `).join("")}
        </ul>
      </section>` : ""}
  `;
}
