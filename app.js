/* =====================================================
   MarketShield – app.js (FINAL / STABIL / DEFENSIV)
   - KEINE HTML-Änderung nötig
   - KEIN Abbruch bei fehlenden Elementen
   - Tabellen stabil (echte <table>)
   - Tooltip CSP-safe (title + optional data-tooltip)
===================================================== */

let currentEntryId = null;

/* ================= GLOBAL ERROR GUARD ================= */
window.addEventListener("error", (e) => {
  console.error("JS Fehler abgefangen:", e.message);
});
window.addEventListener("unhandledrejection", (e) => {
  console.error("Promise Fehler abgefangen:", e.reason);
});

/* ================= SUPABASE ================= */
const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
const SUPABASE_KEY = "sb_publishable_FBywhrypx6zt_0nMlFudyQ_zFiqZKTD";

async function supa(query) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });
    return await r.json();
  } catch (e) {
    console.error("Supabase Fehler:", e);
    return [];
  }
}

/* ================= HELPERS ================= */
const $ = (id) => document.getElementById(id);

function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function normalizeText(text) {
  if (!text) return "";
  return String(text)
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
}

function shortText(text, max = 160) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max) + " …" : text;
}

/* ================= STYLES ================= */
(function injectStyles(){
  if (document.getElementById("msStyles")) return;

  const style = document.createElement("style");
  style.id = "msStyles";
  style.textContent = `
    .ms-tablewrap{overflow-x:auto;margin:14px 0;border:1px solid #ddd;border-radius:10px}
    table.ms-table{border-collapse:collapse;min-width:640px;width:100%}
    .ms-table th,.ms-table td{border:1px solid #ddd;padding:8px 10px;vertical-align:top;text-align:left}
    .ms-table th{background:#f5f5f5;font-weight:700}

    [data-tooltip]{position:relative;cursor:help}
    [data-tooltip]::after{
      content:attr(data-tooltip);
      position:absolute;left:0;bottom:125%;
      background:rgba(0,0,0,.9);color:#fff;
      padding:6px 8px;border-radius:6px;
      font-size:13px;line-height:1.35;
      max-width:320px;white-space:normal;
      opacity:0;pointer-events:none;
      transition:.15s;z-index:9999
    }
    [data-tooltip]:hover::after{opacity:1}
  `;
  document.head.appendChild(style);
})();

/* ================= SCORES ================= */
function renderHealth(score){
  const n = Number(score);
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n >= 80) return "💚💚💚";
  if (n >= 60) return "💚💚";
  if (n >= 40) return "💚";
  if (n >= 20) return "💛";
  return "⚠️❗⚠️";
}

function renderIndustry(score){
  const n = Number(score);
  if (!Number.isFinite(n) || n <= 0) return "";
  const w = Math.round((n / 10) * 80);
  return `
    <div style="width:80px;height:8px;background:#e0e0e0;border-radius:6px;overflow:hidden">
      <div style="width:${w}px;height:8px;background:#2e7d32"></div>
    </div>
  `;
}

function renderScoreBlock(score, processing){
  const h = renderHealth(score);
  const i = renderIndustry(processing);
  if (!h && !i) return "";

  return `
    <div style="margin:12px 0">
      ${h ? `<div style="display:flex;gap:8px;align-items:center">
        ${h}<span title="Gesundheitsscore" data-tooltip="Gesundheitsscore" style="opacity:.7">Gesundheitsscore</span>
      </div>` : ""}
      ${i ? `<div style="display:flex;gap:8px;align-items:center;margin-top:6px">
        ${i}<span title="Industrie-Verarbeitungsgrad" data-tooltip="Industrie-Verarbeitungsgrad" style="opacity:.7">Industrie-Verarbeitungsgrad</span>
      </div>` : ""}
    </div>
  `;
}

/* ================= TABLE RENDER ================= */
function renderMarkdownTables(text){
  if (!text) return "";
  const lines = normalizeText(text).split("\n");
  let html = "";
  let i = 0;

  const isSeparator = s =>
    /^(\|?\s*:?-{3,}:?\s*)+(\|?\s*)$/.test((s||"").trim());
  const splitRow = r => r.split("|").map(s=>s.trim()).filter(Boolean);

  while (i < lines.length){
    const line = lines[i].trim();

    if (line.includes("|") && isSeparator(lines[i+1])){
      const headers = splitRow(lines[i]);
      html += `<div class="ms-tablewrap"><table class="ms-table"><thead><tr>`;
      headers.forEach(h=>html+=`<th>${escapeHtml(h)}</th>`);
      html += `</tr></thead><tbody>`;
      i += 2;
      while (i < lines.length && lines[i].includes("|")){
        const cells = splitRow(lines[i]);
        html += `<tr>`;
        headers.forEach((_,c)=>html+=`<td>${escapeHtml(cells[c]||"")}</td>`);
        html += `</tr>`;
        i++;
      }
      html += `</tbody></table></div>`;
      continue;
    }

    if (line==="") html += `<div style="height:10px"></div>`;
    else html += `<p>${escapeHtml(lines[i])}</p>`;
    i++;
  }
  return html;
}

function renderTextBlock(title,text){
  if (!text) return "";
  return `<h3>${escapeHtml(title)}</h3><div>${renderMarkdownTables(text)}</div>`;
}

/* ================= LIST / DETAIL ================= */
function renderList(data){
  const r = $("results");
  if (!r) return;
  r.innerHTML = (data||[]).map(e=>`
    <div class="entry-card" data-id="${e.id}">
      <strong>${escapeHtml(e.title||"")}</strong>
      ${renderScoreBlock(e.score,e.processing_score)}
      <div>${escapeHtml(shortText(e.summary||""))}</div>
    </div>
  `).join("");

  r.querySelectorAll(".entry-card").forEach(c=>{
    c.addEventListener("click",()=>{
      history.pushState(null,"","?id="+c.dataset.id);
      loadEntry(c.dataset.id);
    });
  });
}

async function loadEntry(id){
  const r = $("results");
  if (!r) return;
  const data = await supa(`entries?select=*&id=eq.${id}`);
  const e = data[0];
  if (!e) return;

  currentEntryId = id;
  r.innerHTML = `
    <h2>${escapeHtml(e.title||"")}</h2>
    ${renderScoreBlock(e.score,e.processing_score)}
    ${renderTextBlock("Zusammenfassung",e.summary)}
    ${renderTextBlock("Wirkmechanismus",e.mechanism)}
    ${renderTextBlock("Wissenschaftlicher Hinweis",e.scientific_note)}
    <div id="entryActions"></div>
  `;
  renderEntryActions();
}

/* ================= SOCIAL / REPORT ================= */
function renderEntryActions(){
  const box = $("entryActions");
  if (!box) return;
  box.innerHTML = `
    <button title="Link kopieren" data-tooltip="Link kopieren">🔗 Kopieren</button>
    <button title="Drucken" data-tooltip="Drucken">🖨️ Drucken</button>
  `;
  box.querySelectorAll("button")[0]?.addEventListener("click",()=>navigator.clipboard.writeText(location.href));
  box.querySelectorAll("button")[1]?.addEventListener("click",()=>window.print());
}

/* ================= CATEGORIES ================= */
async function loadCategories(){
  const grid = document.querySelector(".category-grid");
  if (!grid) return;
  try{
    const data = await fetch("categories.json").then(r=>r.json());
    grid.innerHTML="";
    (data.categories||[]).forEach(c=>{
      const b=document.createElement("button");
      b.textContent=c.title;
      b.addEventListener("click",()=>loadCategory(c.title));
      grid.appendChild(b);
    });
  }catch(e){
    console.warn("Kategorien nicht geladen");
  }
}

async function loadCategory(cat){
  const data = await supa(`entries?select=id,title,summary,score,processing_score&category=eq.${encodeURIComponent(cat)}`);
  renderList(data);
}

/* ================= SEARCH ================= */
(function initSearch(){
  const input = $("searchInput");
  if (!input) return;
  input.addEventListener("input", async ()=>{
    const q=input.value.trim();
    if(q.length<2) return;
    const enc=encodeURIComponent(q);
    const data=await supa(`entries?select=id,title,summary,score,processing_score&or=(title.ilike.%25${enc}%25,summary.ilike.%25${enc}%25)`);
    renderList(data);
  });
})();

/* ================= START ================= */
document.addEventListener("DOMContentLoaded", ()=>{
  loadCategories();
});
