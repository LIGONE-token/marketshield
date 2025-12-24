/* =====================================================
   MarketShield – app.js (FINAL / STABLE)
===================================================== */

/* ================= CONFIG ================= */
const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
const SUPABASE_KEY = "sb_publishable_FBywhrypx6zt_0nMlFudyQ_zFiqZKTD";

/* ================= KATEGORIEN ================= */
const CATEGORIES = [
  "Ernährung","Gesundheit","Medizin","Genussmittel","Risiken","Pflege",
  "Kosmetik","Hygiene","Sonnenschutz","Haushalt","Wohnen","Luftqualität",
  "Wasserqualität","Textilien","Umwelt","Chemikalien","Strahlung","Tiere",
  "Technik","Arbeit","Baumarkt","Zielgruppen","Lifestyle","Finanzen",
  "Trends","Konsum","Freizeit","Mobilität","Sicherheit","Energie"
];

/* ================= DOM ================= */
const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelector(sel);
const resultsBox = () => $("results");

/* ================= HELPERS ================= */
function escapeHtml(s) {
  if (s == null) return "";
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function formatType(t) {
  if (!t) return "";
  t = String(t).trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : "";
}

/* ================= TEXT ================= */
function renderRawText(t) {
  if (!t) return "";
  return `<div style="white-space:pre-wrap;line-height:1.6;">${escapeHtml(t)}</div>`;
}

/* ================= SUMMARY + TABELLEN ================= */
function renderSummaryWithTables(text) {
  if (!text) return "";

  const normalized = String(text)
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n");

  const lines = normalized.split("\n");
  let html = "";
  let buffer = [];

  const flush = () => {
    if (!buffer.length) return;
    html += `<p>${escapeHtml(buffer.join("\n")).replace(/\n/g,"<br>")}</p>`;
    buffer = [];
  };

  const isPipe = l => (l.match(/\|/g)||[]).length >= 2;
  const isSep = l => /^[-\s|]+$/.test(l);

  for (let i=0;i<lines.length;) {
    const line = lines[i];
    if (!line.trim()) { flush(); i++; continue; }

    if (isPipe(line)) {
      flush();
      const rows=[];
      while (i<lines.length && (isPipe(lines[i])||isSep(lines[i]))) {
        if (!isSep(lines[i])) {
          rows.push(lines[i].split("|").map(c=>c.trim()).filter(Boolean));
        }
        i++;
      }
      if (rows.length) {
        html += `<div class="summary-table-wrap"><table class="summary-table"><thead><tr>`;
        rows[0].forEach(c=>html+=`<th>${escapeHtml(c)}</th>`);
        html += `</tr></thead><tbody>`;
        for (let r=1;r<rows.length;r++) {
          html += `<tr>`;
          rows[r].forEach(c=>html+=`<td>${escapeHtml(c)}</td>`);
          html += `</tr>`;
        }
        html += `</tbody></table></div>`;
      }
      continue;
    }

    buffer.push(line);
    i++;
  }
  flush();
  return html;
}

/* ================= SCORES ================= */
function renderHealth(score) {
  const n = Number(score);
  if (!Number.isFinite(n)||n<=0) return "";
  if (n>=80) return "💚💚💚";
  if (n>=60) return "💚💚";
  if (n>=40) return "💚";
  if (n>=20) return "💛";
  return "⚠️❗⚠️";
}
function renderIndustry(score) {
  const n = Number(score);
  if (!Number.isFinite(n)||n<=0) return "";
  const w = Math.round((n/10)*80);
  let c="#2e7d32";
  if (n>=7) c="#c62828";
  else if (n>=4) c="#f9a825";
  return `
    <div style="width:80px;height:8px;background:#e0e0e0;border-radius:6px;overflow:hidden;">
      <div style="width:${w}px;height:8px;background:${c};"></div>
    </div>`;
}
function renderScoreBlock(score, proc, size=13) {
  const h=renderHealth(score), i=renderIndustry(proc);
  if (!h&&!i) return "";
  return `
    <div style="margin:12px 0;">
      ${h?`<div style="display:grid;grid-template-columns:90px 1fr;gap:8px;">
        <div>${h}</div><div style="font-size:${size}px;">Gesundheitsscore</div>
      </div>`:""}
      ${i?`<div style="display:grid;grid-template-columns:90px 1fr;gap:8px;margin-top:6px;">
        <div>${i}</div><div style="font-size:${size}px;">Industrie Verarbeitungsgrad</div>
      </div>`:""}
    </div>`;
}

/* ================= TOOLTIP ================= */
function renderLegalTooltip() {
  return `
    <div style="margin:6px 0 18px;">
      <span style="font-size:12px;color:#666;">
        ℹ️ <span style="text-decoration:underline;">Rechtlicher Hinweis</span>
        <span style="display:none;position:absolute;width:260px;
          background:#222;color:#fff;padding:10px;border-radius:6px;"
          class="legal-tip">
          MarketShield stellt Informationen zur Orientierung bereit.
        </span>
      </span>
    </div>`;
}

/* ================= SUPABASE ================= */
async function supa(path, params) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${path}`);
  if (params) url.search = new URLSearchParams(params).toString();
  const r = await fetch(url,{
    headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`}
  });
  return r.json();
}

/* ================= SEARCH SAVE ================= */
function saveSearchQuery(q) {
  if (!q||q.length<2) return;
  fetch(`${SUPABASE_URL}/rest/v1/search_queue`,{
    method:"POST",
    headers:{
      apikey:SUPABASE_KEY,
      Authorization:`Bearer ${SUPABASE_KEY}`,
      "Content-Type":"application/json",
      Prefer:"return=minimal"
    },
    body:JSON.stringify({query:q})
  }).catch(()=>{});
}

/* ================= CORE ================= */
function setResultsHTML(html) {
  const b=resultsBox(); if(!b)return;
  b.innerHTML = html||"";
}
function clearResults() {
  setResultsHTML("");
  const back=$("backHome"); if(back) back.style.display="none";
}

/* ================= KATEGORIEN ================= */
function loadCategories() {
  const g=$$(".category-grid"); if(!g)return;
  g.innerHTML=CATEGORIES.map(c=>`<button class="cat-btn">${c}</button>`).join("");
}

/* ================= LISTE ================= */
function renderList(items) {
  if(!items||!items.length) return;
  setResultsHTML(items.map(e=>`
    <div class="entry-card" data-id="${e.id}">
      <strong>${escapeHtml(e.title)}</strong><br>
      <small>${escapeHtml(e.category||"")}</small>
      ${renderScoreBlock(e.score,e.processing_score,12)}
    </div>`).join(""));
}

/* ================= LOADERS ================= */
async function loadListBySearch(q) {
  if(!q||q.length<2) return;
  const d=await supa("entries",{
    select:"id,title,category,score,processing_score",
    or:`(title.ilike.*${q}*,summary.ilike.*${q}*)`,
    order:"title.asc"
  });
  renderList(d);
}
async function loadEntry(id) {
  const d=await supa("entries",{id:`eq.${id}`,limit:"1"});
  if(!d||!d.length) return;
  const e=d[0];
  setResultsHTML(`
    <h2>${escapeHtml(e.title)}</h2>
    ${renderScoreBlock(e.score,e.processing_score)}
    ${renderLegalTooltip()}
    ${e.summary?renderSummaryWithTables(e.summary):""}`);
  const back=$("backHome"); if(back) back.style.display="block";
}

/* ================= GLOBAL CLICK ================= */
document.addEventListener("click",(e)=>{
  if (e.target.closest("#reportBtn") ||
      e.target.closest("a") ||
      e.target.closest(".no-nav")) return;

  const card=e.target.closest(".entry-card");
  if(!card) return;
  const id=card.dataset.id;
  history.pushState({id},"","?id="+id);
  loadEntry(id);
});

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded",()=>{
  loadCategories();

  const p=new URLSearchParams(location.search);
  if (p.get("id")) loadEntry(p.get("id"));

  const input=$("searchInput");
  if(input){
    input.addEventListener("input",e=>{
      const q=e.target.value.trim();
      if(q.length<2){clearResults();return;}
      loadListBySearch(q);
    });
    input.addEventListener("keydown",e=>{
      if(e.key!=="Enter")return;
      const q=input.value.trim();
      if(q.length<2)return;
      saveSearchQuery(q);
      loadListBySearch(q);
    });
  }
});
