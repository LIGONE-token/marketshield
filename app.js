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
  initSearch();
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
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  return r.json();
}

/* ================= HELPERS ================= */
const $ = (id) => document.getElementById(id);

function escapeHtml(s = "") {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function shortText(t, max = 160) {
  if (!t) return "";
  return t.length > max ? t.slice(0, max) + " …" : t;
}

function normalizeText(t) {
  if (!t) return "";
  return String(t)
    .replace(/\\r\\n/g,"\n").replace(/\\n/g,"\n").replace(/\\r/g,"\n")
    .replace(/\r\n/g,"\n").replace(/\r/g,"\n");
}

/* ================= TABLES ================= */
function renderMarkdownTables(text) {
  const lines = normalizeText(text).split("\n");
  let html = "", i = 0;

  const isSep = s => /^(\|?\s*:?-{3,}:?\s*)+(\|?\s*)$/.test((s||"").trim());
  const split = r => {
    let a = r.split("|").map(v=>v.trim());
    if (a[0]==="") a.shift();
    if (a[a.length-1]==="") a.pop();
    return a;
  };

  while (i < lines.length) {
    if (lines[i].includes("|") && isSep(lines[i+1])) {
      const head = split(lines[i]);
      html += `<div style="overflow-x:auto;margin:12px 0">
        <table style="border-collapse:collapse;min-width:600px;width:100%">
          <thead><tr>${head.map(h=>`<th style="border:1px solid #ddd;padding:8px;background:#f5f5f5">${escapeHtml(h)}</th>`).join("")}</tr></thead><tbody>`;
      i += 2;
      while (lines[i] && lines[i].includes("|")) {
        const c = split(lines[i]);
        html += `<tr>${head.map((_,k)=>`<td style="border:1px solid #ddd;padding:8px">${escapeHtml(c[k]||"")}</td>`).join("")}</tr>`;
        i++;
      }
      html += `</tbody></table></div>`;
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
  return `<h3>${escapeHtml(title)}</h3>${renderMarkdownTables(text)}`;
}

/* ================= SCORES ================= */
function renderHealth(score) {
  const n = Number(score);
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n >= 80) return "💚💚💚";
  if (n >= 60) return "💚💚";
  if (n >= 40) return "💚";
  if (n >= 20) return "💛";
  return "⚠️❗⚠️";
}

function renderIndustry(score) {
  const n = Number(score);
  if (!Number.isFinite(n) || n <= 0) return "";
  const w = Math.round((n / 10) * 80);
  return `<div style="width:80px;height:8px;background:#e0e0e0;border-radius:6px;overflow:hidden;">
    <div style="width:${w}px;height:8px;background:#2e7d32;"></div></div>`;
}

/* ================= SCORE BLOCK (wie vorher ausgerichtet) ================= */
function renderScoreBlock(score, processing, size = 13) {
  const h = renderHealth(score);
  const i = renderIndustry(processing);
  if (!h && !i) return "";

  const colW = 90, rowGap = 6, colGap = 8;
  const labelStyle = `font-size:${size}px;opacity:0.85;line-height:1.2;`;

  return `
    <div style="margin:12px 0;">
      ${h ? `
        <div style="display:grid;grid-template-columns:${colW}px 1fr;column-gap:${colGap}px;align-items:center;margin-bottom:${i?rowGap:0}px;">
          <div style="white-space:nowrap;">${h}</div>
          <div style="${labelStyle}">Gesundheitsscore</div>
        </div>` : ""}

      ${i ? `
        <div style="display:grid;grid-template-columns:${colW}px 1fr;column-gap:${colGap}px;align-items:center;">
          <div>${i}</div>
          <div style="${labelStyle}">Industrie-Verarbeitungsgrad</div>
        </div>` : ""}
    </div>`;
}

/* ================= LIST / DETAIL ================= */
function renderList(data) {
  const r = $("results"); if (!r) return;
  r.innerHTML = (data||[]).map(e=>`
    <div class="entry-card" data-id="${e.id}">
      <div style="font-size:20px;font-weight:800">${escapeHtml(e.title)}</div>
      ${renderScoreBlock(e.score, e.processing_score)}
      <div>${escapeHtml(shortText(e.summary))}</div>
    </div>`).join("");
}

async function loadEntry(id) {
  const data = await supa(`entries?select=*&id=eq.${id}`);
  const e = data && data[0]; if (!e) return;
  currentEntryId = id;

  const r = $("results"); if (!r) return;

  r.innerHTML = `
    <h2>${escapeHtml(e.title)}</h2>
    ${renderScoreBlock(e.score, e.processing_score)}

    <!-- NUR HIER: Rechtliche Info -->
    <button
      type="button"
      title="Rechtlicher Hinweis:
MarketShield darf rechtlich keine vollständige oder absolute Wahrheit darstellen.
Nicht alle bekannten, vermuteten oder technisch möglichen Stoffe, Rückstände oder Effekte dürfen als gesicherte Tatsachen veröffentlicht werden.
Die Inhalte dienen der Einordnung und Aufklärung, nicht der Tatsachenbehauptung."
      style="margin:6px 0 8px 0;padding:2px 6px;font-size:12px;cursor:help;background:#f3f3f3;border:1px solid #ccc;border-radius:4px;"
    >Rechtliche Info</button>

    ${renderTextBlock("Zusammenfassung", e.summary)}
    ${renderTextBlock("Wirkmechanismus", e.mechanism)}
    ${renderTextBlock("Wissenschaftlicher Hinweis", e.scientific_note)}
    <div id="entryActions"></div>
  `;

  renderEntryActions(e.title);
  updateBackHome();
}

/* ================= SOCIAL ================= */
function renderEntryActions(title) {
  const b = $("entryActions"); if (!b) return;
  const u = encodeURIComponent(location.href);
  const t = encodeURIComponent(title||document.title);
  b.innerHTML = `
    <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
      <button onclick="navigator.clipboard.writeText(location.href)">🔗 Kopieren</button>
      <button onclick="window.open('https://www.facebook.com/sharer/sharer.php?u=${u}','_blank')">Facebook</button>
      <button onclick="window.open('https://twitter.com/intent/tweet?url=${u}&text=${t}','_blank')">X</button>
      <button onclick="window.open('https://wa.me/?text=${t}%20${u}','_blank')">WhatsApp</button>
      <button onclick="window.open('https://t.me/share/url?url=${u}&text=${t}','_blank')">Telegram</button>
      <button onclick="window.print()">🖨️ Drucken</button>
    </div>`;
}

/* ================= CATEGORIES ================= */
async function loadCategories() {
  const g = document.querySelector(".category-grid"); if (!g) return;
  const d = await fetch("categories.json").then(r=>r.json());
  g.innerHTML = "";
  (d.categories||[]).forEach(c=>{
    const b = document.createElement("button");
    b.textContent = c.title;
    b.onclick = ()=>loadCategory(c.title);
    g.appendChild(b);
  });
}

async function loadCategory(cat) {
  const d = await supa(`entries?select=id,title,summary,score,processing_score&category=eq.${encodeURIComponent(cat)}`);
  renderList(d);
}

/* ================= SEARCH ================= */
function initSearch() {
  const i = $("searchInput"), r = $("results");
  if (!i || !r) return;
  i.addEventListener("input", async ()=>{
    const q = i.value.trim();
    if (q.length < 2) { r.innerHTML=""; return; }
    const e = encodeURIComponent(q);
    const d = await supa(`entries?select=id,title,summary,score,processing_score&or=(title.ilike.%25${e}%25,summary.ilike.%25${e}%25)`);
    renderList(d);
  });
}

/* ================= REPORT ================= */
function initReport() {
  const btn=$("reportBtn"), m=$("reportModal"), c=$("closeReportModal"), f=$("reportForm");
  if (!btn || !m || !f) return;
  btn.onclick=()=>m.classList.add("active");
  if (c) c.onclick=()=>m.classList.remove("active");
  f.onsubmit=async(e)=>{
    e.preventDefault();
    const d=f.description.value.trim(); if(!d) return;
    await fetch(`${SUPABASE_URL}/rest/v1/reports`,{
      method:"POST",
      headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,"Content-Type":"application/json"},
      body:JSON.stringify({description:d,entry_id:currentEntryId})
    });
    m.classList.remove("active"); f.reset();
  };
}

/* ================= BACK HOME ================= */
function initBackHome() {
  const b=$("backHome"), r=$("results");
  if (!b || !r) return;
  b.onclick=()=>{ history.pushState(null,"",location.pathname); r.innerHTML=""; updateBackHome(); };
  window.addEventListener("popstate",()=>{
    const p=new URLSearchParams(location.search); const id=p.get("id");
    if (id) loadEntry(id); else { r.innerHTML=""; updateBackHome(); }
  });
  updateBackHome();
}
function updateBackHome() {
  const b=$("backHome"); if (!b) return;
  b.style.display = location.search.includes("id=") ? "block" : "none";
}
