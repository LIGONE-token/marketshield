/* =====================================================
   MarketShield – KORREKTE app.js (FINAL)
   ✔ KEIN CSS hier
   ✔ Globaler Klick-Fix (alles anklickbar)
   ✔ Scores korrekt:
     - Health: score (0–100) IMMER anzeigen
     - Industrie: processing_score (0–10), 0 = NICHT anzeigen
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
});

/* ---------- GLOBALER KLICK-FIX (NUR JS) ---------- */
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
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
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

function showIndustry(v) {
  return typeof v === "number" && v > 0 && v <= 10;
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

/* ---------- KATEGORIE ---------- */
async function loadCategory(cat) {
  const data = await supa(
    `entries?select=id,title,summary,score,processing_score&category=eq.${encodeURIComponent(cat)}`
  );
  renderList(data);
}

/* ---------- LISTE (KURZANSICHT) ---------- */
function renderList(data) {
  results.innerHTML = data.map(e => `
    <div class="search-result" data-id="${e.id}">
      <div class="scores">
        Health: ${e.score ?? "–"}
        ${showIndustry(e.processing_score)
          ? `<span class="sep">|</span>Industrie: ${e.processing_score}/10`
          : ``}
      </div>

      <div class="entry-title">${escapeHtml(e.title)}</div>

      <div class="entry-summary preview">
        ${escapeHtml(e.summary || "").replace(/\s+/g," ").trim()}
      </div>

      <div class="entry-cta">Mehr anzeigen →</div>
    </div>
  `).join("");
}

/* ---------- DETAILANSICHT ---------- */
async function loadEntry(id) {
  const data = await supa(`entries?select=*&id=eq.${id}`);
  const e = data[0];

  if (!e) {
    results.innerHTML = "Eintrag nicht gefunden";
    return;
  }

  results.innerHTML = `
    <h2 class="entry-title">${escapeHtml(e.title)}</h2>

    <div class="scores">
      Health: ${e.score ?? "–"}
      ${showIndustry(e.processing_score)
        ? `<span class="sep">|</span>Industrie: ${e.processing_score}/10`
        : ``}
    </div>

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
      <section class="entry-section">
        <h3>Risiken & Risikogruppen</h3>
        <ul>
          ${JSON.parse(e.risk_groups).map(r => `<li>${escapeHtml(r)}</li>`).join("")}
        </ul>
      </section>` : ""}
  `;
}
