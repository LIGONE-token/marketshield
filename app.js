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

/* ================= GLOBAL CLICK ================= */
document.addEventListener("click", (e) => {
  const card = e.target.closest(".entry-card");
  if (!card) return;
  history.pushState(null, "", "?id=" + card.dataset.id);
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
function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function shortText(text, max = 160) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max) + " …" : text;
}

function normalizeText(text) {
  if (!text) return "";
  return String(text)
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
}

/* ================= MARKDOWN TABLES ================= */
function renderMarkdownTables(text) {
  const lines = normalizeText(text).split("\n");
  let html = "";
  let i = 0;

  const isSep = s =>
    /^(\|?\s*:?-{3,}:?\s*)+(\|?\s*)$/.test((s || "").trim());

  const splitRow = r => {
    let a = r.split("|").map(v => v.trim());
    if (a[0] === "") a.shift();
    if (a[a.length - 1] === "") a.pop();
    return a;
  };

  while (i < lines.length) {
    if (lines[i].includes("|") && isSep(lines[i + 1])) {
      const head = splitRow(lines[i]);
      html += `
        <div style="overflow-x:auto;margin:12px 0">
          <table style="border-collapse:collapse;min-width:600px;width:100%">
            <thead>
              <tr>${head.map(h =>
                `<th style="border:1px solid #ddd;padding:8px;background:#f5f5f5">${escapeHtml(h)}</th>`
              ).join("")}</tr>
            </thead>
            <tbody>
      `;
      i += 2;
      while (lines[i] && lines[i].includes("|")) {
        const cells = splitRow(lines[i]);
        html += `
          <tr>${head.map((_, c) =>
            `<td style="border:1px solid #ddd;padding:8px">${escapeHtml(cells[c] || "")}</td>`
          ).join("")}</tr>
        `;
        i++;
      }
      html += `
            </tbody>
          </table>
        </div>
      `;
      continue;
    }

    html += lines[i].trim()
      ? `<p style="line-height:1.6">${escapeHtml(lines[i])}</p>`
      : `<div style="height:10px"></div>`;
    i++;
  }
  return html;
}

function renderTextBlock(title, text) {
  if (!text) return "";
  return `
    <h3>${escapeHtml(title)}</h3>
    ${renderMarkdownTables(text)}
  `;
}

/* ================= SCORES (KORREKT: GELB + WARNUNG) ================= */
function renderHealth(score) {
  const n = Number(score);
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n >= 80) return "💚💚💚";
  if (n >= 60) return "💚💚";
  if (n >= 40) return "💚";
  if (n >= 20) return "💛";     // gelb statt orange/rot
  return "⚠️❗⚠️";              // Warnscore wieder da
}

function renderIndustry(score) {
  const n = Number(score);
  if (!Number.isFinite(n) || n <= 0) return "";
  const w = Math.round((n / 10) * 80);
  return `
    <div style="width:80px;height:8px;background:#e0e0e0;border-radius:6px;overflow:hidden;">
      <div style="width:${w}px;height:8px;background:#2e7d32;"></div>
    </div>`;
}

function renderScoreBlock(score, processing) {
  const h = renderHealth(score);
  const i = renderIndustry(processing);
  if (!h && !i) return "";
  return `
    <div style="margin:12px 0">
      ${h ? `<div title="Gesundheitsscore">${h}</div>` : ""}
      ${i ? `<div title="Industrie-Verarbeitungsgrad">${i}</div>` : ""}
    </div>`;
}

/* ================= LIST / DETAIL ================= */
function renderList(data) {
  const results = document.getElementById("results");
  if (!results) return;

  results.innerHTML = data.map(e => `
    <div class="entry-card" data-id="${e.id}">
      <div style="font-size:20px;font-weight:800">${escapeHtml(e.title)}</div>
      ${renderScoreBlock(e.score, e.processing_score)}
      <div>${escapeHtml(shortText(e.summary))}</div>
    </div>
  `).join("");
}

async function loadEntry(id) {
  const data = await supa(`entries?select=*&id=eq.${id}`);
  const e = data[0];
  if (!e) return;

  currentEntryId = id;

  const results = document.getElementById("results");
  if (!results) return;

  results.innerHTML = `
    <h2>${escapeHtml(e.title)}</h2>
    ${renderScoreBlock(e.score, e.processing_score)}
    ${renderTextBlock("Zusammenfassung", e.summary)}
    ${renderTextBlock("Wirkmechanismus", e.mechanism)}
    ${renderTextBlock("Wissenschaftlicher Hinweis", e.scientific_note)}
    <div id="entryActions"></div>
  `;
  renderEntryActions(e.title);
  updateBackHome();
}

/* ================= SOCIAL BUTTONS ================= */
function renderEntryActions(title) {
  const box = document.getElementById("entryActions");
  if (!box) return;

  box.innerHTML = `
    <button onclick="navigator.clipboard.writeText(location.href)">🔗 Kopieren</button>
    <button onclick="window.open('https://t.me/share/url?url='+encodeURIComponent(location.href)+'&text='+encodeURIComponent('${title}'),'_blank')">Telegram</button>
    <button onclick="window.print()">🖨️ Drucken</button>
  `;
}

/* ================= CATEGORIES ================= */
async function loadCategories() {
  const grid = document.querySelector(".category-grid");
  if (!grid) return;
  const data = await fetch("categories.json").then(r => r.json());
  grid.innerHTML = "";
  data.categories.forEach(c => {
    const btn = document.createElement("button");
    btn.textContent = c.title;
    btn.onclick = () => loadCategory(c.title);
    grid.appendChild(btn);
  });
}

async function loadCategory(cat) {
  const data = await supa(
    `entries?select=id,title,summary,score,processing_score&category=eq.${encodeURIComponent(cat)}`
  );
  renderList(data);
}

/* ================= REPORT ================= */
function initReport() {
  const btn = document.getElementById("reportBtn");
  const modal = document.getElementById("reportModal");
  const close = document.getElementById("closeReportModal");
  const form = document.getElementById("reportForm");
  if (!btn || !modal || !form) return;

  btn.onclick = () => modal.classList.add("active");
  if (close) close.onclick = () => modal.classList.remove("active");

  form.onsubmit = async (e) => {
    e.preventDefault();
    const description = form.description.value.trim();
    if (!description) return;

    await fetch(`${SUPABASE_URL}/rest/v1/reports`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ description, entry_id: currentEntryId })
    });

    modal.classList.remove("active");
    form.reset();
  };
}

/* ================= BACK HOME ================= */
function initBackHome() {
  const back = document.getElementById("backHome");
  const results = document.getElementById("results");
  if (!back || !results) return;

  back.onclick = () => {
    history.pushState(null, "", location.pathname);
    results.innerHTML = "";
    updateBackHome();
  };

  window.addEventListener("popstate", () => {
    const params = new URLSearchParams(location.search);
    const id = params.get("id");
    if (id) loadEntry(id);
    else {
      results.innerHTML = "";
      updateBackHome();
    }
  });

  updateBackHome();
}

function updateBackHome() {
  const back = document.getElementById("backHome");
  if (!back) return;
  back.style.display = location.search.includes("id=") ? "block" : "none";
}
