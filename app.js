/* =====================================================
   MarketShield – app.js FINAL
   ✔ Health-Score korrekt + grüne Herzen
   ✔ Industrie-Score 0–10 (0 = nicht anzeigen) KOMPAKT
   ✔ Warnung bei Health-Score = 1 (DEUTLICH)
   ✔ Alles klickbar (globaler Klick-Fix)
   ✔ Kein CSS hier nötig (inline styles für die neuen UI-Teile)
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
});

/* ---------- GLOBALER KLICK-FIX ---------- */
document.addEventListener("click", (e) => {
  const card = e.target.closest(".search-result");
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

function showIndustry(v) {
  const n = toNum(v);
  return n !== null && n > 0 && n <= 10;   // 0 = nicht anzeigen
}

function formatText(text) {
  if (!text) return "";
  return escapeHtml(text)
    .split(/\n\s*\n/)
    .map(p => `<p style="margin:0 0 14px 0; line-height:1.75;">${p.trim()}</p>`)
    .join("");
}

/* ---------- UI SNIPPETS (INLINE, KOMPAKT) ---------- */
function heartsHtml(score100) {
  const s = Math.max(0, Math.min(100, score100));
  const filled = Math.round(s / 20); // 0..5
  let out = `<span style="display:inline-flex; gap:2px; vertical-align:middle;">`;
  for (let i = 1; i <= 5; i++) {
    out += `<span style="font-size:16px; line-height:1; color:${i <= filled ? "#2e7d32" : "#cfcfcf"};">♥</span>`;
  }
  out += `</span>`;
  return out;
}

function industryCompactHtml(ind10) {
  const n = Math.max(1, Math.min(10, ind10)); // nur 1..10 hier
  // kompakter Balken: max 90px, NICHT full width
  const w = Math.round((n / 10) * 90);
  return `
    <span style="display:inline-flex; align-items:center; gap:8px; vertical-align:middle;">
      <span style="font-weight:700;">Industrie:</span>
      <span style="display:inline-block; width:90px; height:10px; background:#e9e9e9; border-radius:999px; overflow:hidden;">
        <span style="display:block; width:${w}px; height:10px; background:#666;"></span>
      </span>
      <span style="font-weight:700;">${n}/10</span>
    </span>
  `;
}

function healthLineHtml(score100) {
  const s = score100;
  return `
    <span style="display:inline-flex; align-items:center; gap:10px; vertical-align:middle;">
      <span style="font-weight:700;">Health:</span>
      ${heartsHtml(s)}
      <span style="font-weight:800;">${s}</span>
    </span>
  `;
}

function warningHtml() {
  return `
    <div style="
      margin:14px 0 18px 0;
      padding:14px 14px;
      border-radius:10px;
      background:#fff0f0;
      border:2px solid #c62828;
      color:#7a0b0b;
      font-weight:900;
      font-size:16px;
      letter-spacing:0.2px;
    ">
      ⚠️ EXTREME WARNUNG: Gesundheits-Score = 1
    </div>
  `;
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
      `entries?select=id,title,summary,score,processing_score&or=(title.ilike.%25${enc}%25,summary.ilike.%25${enc}%25)`
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

/* ---------- LISTE (KURZANSICHT) ---------- */
function renderList(data) {
  results.innerHTML = data.map(e => {
    const hs = toNum(e.score);
    const ind = toNum(e.processing_score);

    // Health immer anzeigen, aber korrekt (fallback "–")
    const healthPart = (hs !== null)
      ? healthLineHtml(Math.max(0, Math.min(100, Math.round(hs))))
      : `<span style="font-weight:800;">Health: –</span>`;

    // Industrie nur anzeigen wenn 1..10
    const industryPart = (ind !== null && showIndustry(ind))
      ? `<span style="margin-left:14px;">${industryCompactHtml(Math.round(ind))}</span>`
      : ``;

    return `
      <div class="search-result" data-id="${e.id}" style="padding:14px 12px; border-bottom:1px solid #e0e0e0; cursor:pointer;">
        <div style="display:flex; flex-wrap:wrap; gap:10px; align-items:center; margin-bottom:8px;">
          ${healthPart}
          ${industryPart}
        </div>

        <div class="entry-title" style="font-size:20px; font-weight:800; margin:0 0 6px 0;">
          ${escapeHtml(e.title)}
        </div>

        <div class="entry-summary preview" style="
          display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:2;
          overflow:hidden; font-size:16px; line-height:1.5; color:#333;
        ">
          ${escapeHtml(e.summary || "").replace(/\s+/g, " ").trim()}
        </div>

        <div class="entry-cta" style="margin-top:8px; font-size:14px; font-weight:900; color:#1e88e5;">
          Mehr anzeigen →
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

  const hsRaw = toNum(e.score);
  const hs = (hsRaw !== null) ? Math.max(0, Math.min(100, Math.round(hsRaw))) : null;

  const indRaw = toNum(e.processing_score);
  const ind = (indRaw !== null) ? Math.round(indRaw) : null;

  results.innerHTML = `
    <h2 class="entry-title" style="font-size:22px; font-weight:900; margin:6px 0 10px 0;">
      ${escapeHtml(e.title)}
    </h2>

    <div style="display:flex; flex-wrap:wrap; gap:10px; align-items:center; margin-bottom:10px;">
      ${hs !== null ? healthLineHtml(hs) : `<span style="font-weight:900;">Health: –</span>`}
      ${ind !== null && showIndustry(ind) ? `<span style="margin-left:14px;">${industryCompactHtml(ind)}</span>` : ``}
    </div>

    ${hs === 1 ? warningHtml() : ""}

    ${e.summary ? `
      <section class="entry-section" style="margin:22px 0; padding-top:10px; border-top:1px solid #e0e0e0;">
        <h3 style="font-size:20px; font-weight:900; margin:0 0 12px 0;">Zusammenfassung</h3>
        <div class="entry-text" style="white-space:normal;">
          ${formatText(e.summary)}
        </div>
      </section>` : ""}

    ${e.mechanism ? `
      <section class="entry-section" style="margin:22px 0; padding-top:10px; border-top:1px solid #e0e0e0;">
        <h3 style="font-size:20px; font-weight:900; margin:0 0 12px 0;">Wirkmechanismus</h3>
        <div class="entry-text" style="white-space:normal;">
          ${formatText(e.mechanism)}
        </div>
      </section>` : ""}

    ${e.risk_groups ? `
      <section class="entry-section" style="margin:22px 0; padding-top:10px; border-top:1px solid #e0e0e0;">
        <h3 style="font-size:20px; font-weight:900; margin:0 0 12px 0;">Risiken & Risikogruppen</h3>
        <ul style="margin:0 0 0 18px; padding:0; line-height:1.65;">
          ${JSON.parse(e.risk_groups).map(r => `<li style="margin:0 0 8px 0;">${escapeHtml(r)}</li>`).join("")}
        </ul>
      </section>` : ""}
  `;
}
