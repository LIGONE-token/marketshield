/* =====================================================
   MarketShield – app.js (FINAL / STABIL / KOMPLETT)
===================================================== */

/* ================= GLOBAL ================= */
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
  return await r.json();
}

async function supaPost(table, payload) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    },
    body: JSON.stringify(payload)
  });
  if (!r.ok) throw new Error(await r.text());
}

/* ================= HELPERS ================= */
const $ = (id) => document.getElementById(id);

function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function cleanText(t = "") {
  return String(t)
    .replace(/\*\*/g, "")
    .replace(/##+/g, "")
    .replace(/__+/g, "")
    .replace(/~~+/g, "")
    .replace(/`+/g, "")
    .replace(/:contentReference\[[^\]]*\]\{[^}]*\}/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

/* ================= TABELLEN ================= */
function renderSummary(text) {
  const lines = cleanText(text).split("\n");
  let html = "";
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (
      line.includes("|") &&
      lines[i + 1] &&
      /^[-\s|]+$/.test(lines[i + 1])
    ) {
      const rows = [];
      rows.push(line);
      i += 2;

      while (i < lines.length && lines[i].includes("|")) {
        rows.push(lines[i]);
        i++;
      }

      const cells = rows.map(r =>
        r.split("|").map(c => c.trim()).filter(Boolean)
      );

      const head = cells.shift();
      html += `
        <table class="ms-table">
          <thead>
            <tr>${head.map(h => `<th>${escapeHtml(h)}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${cells.map(r =>
              `<tr>${r.map(c => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`
            ).join("")}
          </tbody>
        </table>
      `;
      continue;
    }

    if (line.trim()) {
      html += `<p>${escapeHtml(line)}</p>`;
    }
    i++;
  }
  return html;
}

/* ================= SCORES ================= */
function renderHealth(score) {
  const n = Number(score);
  if (!n) return "";
  if (n >= 80) return "💚💚💚";
  if (n >= 60) return "💚💚";
  if (n >= 40) return "💚";
  if (n >= 20) return "💛";
  return "⚠️❗⚠️";
}

function renderIndustry(score) {
  const n = Math.min(10, Math.max(0, Number(score)));
  if (!n) return "";
  let color = "#2e7d32";
  if (n >= 4) color = "#f9a825";
  if (n >= 7) color = "#c62828";
  const w = Math.round((n / 10) * 80);

  return `
    <div style="width:80px;height:8px;background:#e0e0e0;border-radius:6px;">
      <div style="width:${w}px;height:8px;background:${color};border-radius:6px;"></div>
    </div>`;
}

function renderScoreBlock(score, processing) {
  const h = renderHealth(score);
  const i = renderIndustry(processing);
  if (!h && !i) return "";

  return `
    <div style="margin:12px 0;">
      ${h ? `<div style="display:grid;grid-template-columns:90px 1fr;"><div>${h}</div><div>Gesundheit</div></div>` : ""}
      ${i ? `<div style="display:grid;grid-template-columns:90px 1fr;"><div>${i}</div><div>Industrie</div></div>` : ""}
    </div>`;
}

/* ================= LISTE ================= */
function renderList(data) {
  $("results").innerHTML = data.map(e => `
    <div class="entry-card" data-id="${e.id}">
      <strong>${escapeHtml(e.title)}</strong>
      ${renderScoreBlock(e.score, e.processing_score)}
    </div>
  `).join("");
}

/* ================= DETAIL ================= */
async function loadEntry(id) {
  const e = (await supa(`entries?select=*&id=eq.${id}`))[0];
  if (!e) return;

  currentEntryId = id;
  $("backHome").style.display = "block";

  $("results").innerHTML = `
    <div style="display:flex;justify-content:space-between;">
      <h2>${escapeHtml(e.title)}</h2>
      <a href="#" id="legalLink" style="font-size:12px;">Rechtlicher Hinweis</a>
    </div>

    <div id="legalPopup" style="display:none;font-size:12px;margin-bottom:12px;">
      MarketShield dient der Information. Keine Beratung. Angaben ohne Gewähr.
    </div>

    ${renderScoreBlock(e.score, e.processing_score)}
    ${renderSummary(e.summary)}
    <div id="entryActions"></div>
  `;

  $("legalLink").onclick = (ev) => {
    ev.preventDefault();
    const p = $("legalPopup");
    p.style.display = p.style.display === "none" ? "block" : "none";
  };

  renderEntryActions(e.title);
}

/* ================= SOCIAL ================= */
function renderEntryActions(title) {
  const url = location.href;
  const encUrl = encodeURIComponent(url);
  const encTitle = encodeURIComponent(title + " – MarketShield");

  $("entryActions").innerHTML = `
    <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;">
      <button onclick="navigator.clipboard.writeText('${url}')">🔗 Kopieren</button>
      <button onclick="window.print()">🖨️ Drucken</button>
      <button onclick="window.open('https://t.me/share/url?url=${encUrl}&text=${encTitle}')">Telegram</button>
      <button onclick="window.open('https://wa.me/?text=${encTitle}%20${encUrl}')">WhatsApp</button>
    </div>`;
}

/* ================= NAV ================= */
function goHome() {
  currentEntryId = null;
  history.pushState(null, "", location.pathname);
  $("results").innerHTML = "";
  $("backHome").style.display = "none";
}

document.addEventListener("click", (e) => {
  const c = e.target.closest(".entry-card");
  if (c) loadEntry(c.dataset.id);
});

/* ================= SEARCH ================= */
function initSearch() {
  $("searchInput").addEventListener("input", async () => {
    const q = searchInput.value.trim();
    if (q.length < 2) return;
    renderList(await supa(`entries?select=id,title,score,processing_score&title=ilike.%25${encodeURIComponent(q)}%25`));
  });
}

/* ================= KATEGORIEN ================= */
async function loadCategories() {
  const grid = document.querySelector(".category-grid");
  const data = await fetch("categories.json").then(r => r.json());
  grid.innerHTML = "";
  data.categories.forEach(c => {
    const b = document.createElement("button");
    b.textContent = c.title;
    b.onclick = () => loadCategory(c.title);
    grid.appendChild(b);
  });
}

async function loadCategory(cat) {
  renderList(await supa(`entries?select=id,title,score,processing_score&category=eq.${encodeURIComponent(cat)}`));
}

/* ================= REPORT ================= */
function initReport() {
  reportBtn.onclick = () => reportModal.style.display = "flex";
  closeReportModal.onclick = () => reportModal.style.display = "none";

  reportForm.onsubmit = async (e) => {
    e.preventDefault();
    await supaPost("reports", {
      entry_id: currentEntryId,
      description: reportForm.description.value,
      created_at: new Date().toISOString()
    });
    reportForm.reset();
    reportModal.style.display = "none";
  };
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  $("backHome").onclick = goHome;
  loadCategories();
  initSearch();
  initReport();
});
