document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
});

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

// ===============================
// KATEGORIEN
// ===============================
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

// ===============================
// SUCHE
// ===============================
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
      `entries?select=id,title,summary,score&or=(title.ilike.%25${enc}%25,summary.ilike.%25${enc}%25)`
    );

    renderList(data);
  });
}

// ===============================
// KATEGORIE
// ===============================
async function loadCategory(cat) {
  const data = await supa(
    `entries?select=id,title,summary,score&category=eq.${encodeURIComponent(cat)}`
  );

  renderList(data);
}

// ===============================
// LISTENANSICHT (KURZ)
// ===============================
function renderList(data) {
  results.innerHTML = data.map(e => `
    <div class="search-result" data-id="${e.id}">
      <div class="entry-score">Score: ${e.score ?? "–"}</div>
      <div class="entry-title">${e.title}</div>
      <div class="entry-summary preview">
        ${e.summary.replace(/\n/g, " ")}
      </div>
    </div>
  `).join("");

  document.querySelectorAll(".search-result").forEach(el => {
    el.onclick = () => loadEntry(el.dataset.id);
  });
}

// ===============================
// DETAILANSICHT (VOLL)
// ===============================
async function loadEntry(id) {
  const data = await supa(`entries?select=*&id=eq.${id}`);
  const e = data[0];

  if (!e) {
    results.innerHTML = "Eintrag nicht gefunden";
    return;
  }

  results.innerHTML = `
    <h2 class="entry-title">${e.title}</h2>
    <div class="entry-score detail">Score: ${e.score ?? "–"}</div>
    <div class="entry-summary-full">
      ${e.summary.replace(/\n/g, "<br><br>")}
    </div>
  `;
}
