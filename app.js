/* ================================
   MarketShield – STABIL & FINAL
   EIN-DATEI-LÖSUNG
================================ */

document.addEventListener("DOMContentLoaded", () => {
  injectCSS();
  loadCategories();
});

const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
const SUPABASE_KEY = "sb_publishable_FBywhrypx6zt_0nMlFudyQ_zFiqZKTD";

/* ---------- HELPERS ---------- */
async function supa(query) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  return r.json();
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* ---------- CSS INJECTION (KEIN DATEI-WECHSEL) ---------- */
function injectCSS() {
  const css = `
  html, body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
                 Roboto, Helvetica, Arial, sans-serif;
    font-size: 18px; line-height: 1.6; color:#222; background:#fafafa;
  }
  .search-result { padding:14px 0; border-bottom:1px solid #e0e0e0; cursor:pointer; }
  .entry-title { font-size:20px; font-weight:600; margin:4px 0; }
  .entry-score { font-size:14px; font-weight:600; color:#2e7d32; margin-bottom:2px; }
  .entry-score.detail { margin:10px 0 16px; }
  /* KURZANSICHT – EXAKT 2 ZEILEN */
  .entry-summary.preview{
    display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:2;
    overflow:hidden; font-size:16px; line-height:1.5; color:#333;
  }
  /* DETAILANSICHT */
  .entry-section{ margin:28px 0; padding-top:10px; border-top:1px solid #e0e0e0; }
  .entry-section h3{ font-size:20px; font-weight:700; margin-bottom:12px; }
  .entry-text{ white-space:pre-wrap; line-height:1.75; font-size:18px; }
  .entry-section.risk{ background:#fff6f6; border-left:4px solid #c62828; padding-left:16px; }
  `;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
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
      `entries?select=id,title,summary,score&or=(title.ilike.%25${enc}%25,summary.ilike.%25${enc}%25)`
    );
    renderList(data);
  });
}

/* ---------- KATEGORIE ---------- */
async function loadCategory(cat) {
  const data = await supa(
    `entries?select=id,title,summary,score&category=eq.${encodeURIComponent(cat)}`
  );
  renderList(data);
}

/* ---------- LISTE (KURZANSICHT) ---------- */
function renderList(data) {
  results.innerHTML = data.map(e => `
    <div class="search-result" data-id="${e.id}">
      <div class="entry-score">Score: ${e.score ?? "–"}</div>
      <div class="entry-title">${escapeHtml(e.title)}</div>
      <div class="entry-summary preview">
        ${escapeHtml(e.summary).replace(/\s+/g," ").trim()}
      </div>
    </div>
  `).join("");

  document.querySelectorAll(".search-result").forEach(el => {
    el.onclick = () => loadEntry(el.dataset.id);
  });
}

/* ---------- DETAILANSICHT (VOLL) ---------- */
async function loadEntry(id) {
  const data = await supa(`entries?select=*&id=eq.${id}`);
  const e = data[0];
  if (!e) { results.innerHTML = "Eintrag nicht gefunden"; return; }

  results.innerHTML = `
    <h2 class="entry-title">${escapeHtml(e.title)}</h2>
    <div class="entry-score detail">Score: ${e.score ?? "–"}</div>

    ${e.summary ? `
      <section class="entry-section">
        <h3>Zusammenfassung</h3>
        <div class="entry-text">${escapeHtml(e.summary)}</div>
      </section>` : ""}

    ${e.mechanism ? `
      <section class="entry-section">
        <h3>Wirkmechanismus</h3>
        <div class="entry-text">${escapeHtml(e.mechanism)}</div>
      </section>` : ""}

    ${e.risk_groups ? `
      <section class="entry-section risk">
        <h3>Risiken & Risikogruppen</h3>
        <ul>
          ${JSON.parse(e.risk_groups).map(r=>`<li>${escapeHtml(r)}</li>`).join("")}
        </ul>
      </section>` : ""}
  `;
}
