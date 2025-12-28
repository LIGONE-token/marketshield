/* =====================================================
   MarketShield – app.js (FINAL / HTML-KOMPATIBEL)
===================================================== */

let currentEntryId = null;

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
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function supaPost(table, payload) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  if (!r.ok) throw new Error(await r.text());
}

/* ================= HELPERS ================= */
const $ = (id) => document.getElementById(id);

function escapeHtml(s = "") {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* ================= TABELLEN ================= */
function renderSummary(text = "") {
  const lines = text.split("\n");
  let html = "";
  let i = 0;
  const isSep = l => /^[-| :]+$/.test(l || "");

  while (i < lines.length) {
    if (lines[i].includes("|") && isSep(lines[i + 1])) {
      const head = lines[i].split("|").map(c => c.trim()).filter(Boolean);
      i += 2;
      const rows = [];
      while (lines[i] && lines[i].includes("|")) {
        rows.push(lines[i].split("|").map(c => c.trim()).filter(Boolean));
        i++;
      }
      html += `
        <table>
          <thead><tr>${head.map(h => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead>
          <tbody>
            ${rows.map(r => `<tr>${r.map(c => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`).join("")}
          </tbody>
        </table>`;
    } else {
      if (lines[i].trim()) html += `<p>${escapeHtml(lines[i])}</p>`;
      i++;
    }
  }
  return html;
}

/* ================= LISTE ================= */
function renderList(data) {
  $("results").innerHTML = (data || []).map(e => `
    <div class="entry-card" data-id="${e.id}">
      <strong>${escapeHtml(e.title)}</strong>
      <div class="preview">${escapeHtml(e.summary || "").slice(0, 140)}…</div>
    </div>
  `).join("");
}

/* ================= DETAIL ================= */
async function loadEntry(id) {
  const d = await supa(`entries?select=*&id=eq.${id}`);
  const e = d[0];
  if (!e) return;

  currentEntryId = id;
  $("results").innerHTML = `
    <h2>${escapeHtml(e.title)}</h2>
    ${renderSummary(e.summary || "")}
  `;
  $("backHome").style.display = "block";
}

/* ================= REPORT MODAL (HTML EXISTIERT SCHON) ================= */
const reportModal = $("reportModal");
const reportForm = $("reportForm");

$("reportBtn").addEventListener("click", (e) => {
  e.preventDefault();
  reportModal.style.display = "flex";
});

$("closeReportModal").addEventListener("click", () => {
  reportModal.style.display = "none";
});

reportForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const txt = reportForm.description.value.trim();
  if (txt.length < 5) return;

  await supaPost("reports", {
    description: txt,
    entry_id: currentEntryId,
    url: location.href
  });

  reportForm.reset();
  reportModal.style.display = "none";
  alert("Danke! Meldung wurde gespeichert.");
});

/* ================= BACK HOME ================= */
$("backHome").addEventListener("click", () => {
  history.pushState(null, "", location.pathname);
  $("backHome").style.display = "none";
  loadInitial();
});

/* ================= SEARCH ================= */
$("searchInput").addEventListener("input", async (e) => {
  const q = e.target.value.trim();
  if (q.length < 2) return;
  renderList(await supa(
    `entries?select=id,title,summary&or=(title.ilike.%25${q}%25,summary.ilike.%25${q}%25)`
  ));
});

/* ================= CATEGORIES ================= */
async function loadCategories() {
  const g = document.querySelector(".category-grid");
  const d = await fetch("categories.json").then(r => r.json());
  g.innerHTML = "";
  d.categories.forEach(c => {
    const b = document.createElement("button");
    b.textContent = c.title;
    b.onclick = () => loadCategory(c.title);
    g.appendChild(b);
  });
}

async function loadCategory(cat) {
  renderList(await supa(
    `entries?select=id,title,summary&category=eq.${encodeURIComponent(cat)}`
  ));
}

/* ================= NAV ================= */
document.addEventListener("click", (e) => {
  const card = e.target.closest(".entry-card");
  if (!card) return;
  loadEntry(card.dataset.id);
});

/* ================= INIT ================= */
async function loadInitial() {
  renderList(await supa("entries?select=id,title,summary&limit=30"));
}

document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
  loadInitial();
});
