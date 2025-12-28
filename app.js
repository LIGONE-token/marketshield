/* =====================================================
   MarketShield – app.js (FINAL / KOMPLETT / STABIL)
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
  const t = await r.text();
  if (!r.ok) throw new Error(t);
  return JSON.parse(t || "[]");
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
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function normalizeText(t="") {
  return t
    .replace(/\*\*/g,"")
    .replace(/##+/g,"")
    .replace(/__+/g,"")
    .replace(/~~+/g,"")
    .replace(/`+/g,"")
    .replace(/\r\n/g,"\n")
    .replace(/\r/g,"\n")
    .replace(/\n{3,}/g,"\n\n")
    .trim();
}

function shortText(t,max=160){
  t = normalizeText(t).replace(/\s+/g," ");
  return t.length>max ? t.slice(0,max)+" …" : t;
}

/* ================= TABELLEN ================= */
function renderSummary(text="") {
  text = normalizeText(text);
  const lines = text.split("\n");
  let html = "";
  let i = 0;
  const isSep = l => /^[-| :]+$/.test(l||"");

  while (i < lines.length) {
    if (lines[i].includes("|") && isSep(lines[i+1])) {
      const head = lines[i].split("|").map(c=>c.trim()).filter(Boolean);
      i+=2;
      const rows=[];
      while(lines[i] && lines[i].includes("|")){
        rows.push(lines[i].split("|").map(c=>c.trim()).filter(Boolean));
        i++;
      }
      html += `
        <table style="border-collapse:collapse;width:100%;margin:16px 0">
          <thead>
            <tr>${head.map(h=>`<th style="border:1px solid #ccc;padding:6px">${escapeHtml(h)}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${rows.map(r=>`<tr>${r.map(c=>`<td style="border:1px solid #ccc;padding:6px">${escapeHtml(c)}</td>`).join("")}</tr>`).join("")}
          </tbody>
        </table>
      `;
    } else {
      if(lines[i].trim()) html += `<p>${escapeHtml(lines[i])}</p>`;
      i++;
    }
  }
  return html;
}

/* ================= SCORES ================= */
function renderHealth(score){
  const n=Number(score);
  if(!Number.isFinite(n)||n<=0) return "";
  if(n>=80) return "💚💚💚";
  if(n>=60) return "💚💚";
  if(n>=40) return "💚";
  if(n>=20) return "💛";
  return "⚠️❗⚠️";
}

function renderIndustry(score){
  const n=Number(score);
  if(!Number.isFinite(n)||n<=0) return "";
  const v=Math.max(0,Math.min(10,n));
  const w=Math.round((v/10)*80);
  let c="#2e7d32";
  if(v>=4) c="#f9a825";
  if(v>=7) c="#c62828";
  return `
    <div style="width:80px;height:8px;background:#e0e0e0;border-radius:6px">
      <div style="width:${w}px;height:8px;background:${c};border-radius:6px"></div>
    </div>`;
}

function renderScoreBlock(score,processing){
  const h=renderHealth(score);
  const i=renderIndustry(processing);
  if(!h&&!i) return "";
  return `
    <div style="margin:12px 0">
      ${h?`<div style="display:grid;grid-template-columns:90px 1fr;gap:8px">
        <div>${h}</div><div>Gesundheitsscore</div></div>`:""}
      ${i?`<div style="display:grid;grid-template-columns:90px 1fr;gap:8px;margin-top:6px">
        <div>${i}</div><div>Industrie-Verarbeitungsgrad</div></div>`:""}
    </div>`;
}

/* ================= LISTE ================= */
function renderList(data){
  $("results").innerHTML=(data||[]).map(e=>`
    <div class="entry-card" data-id="${e.id}">
      <b>${escapeHtml(e.title)}</b>
      ${renderScoreBlock(e.score,e.processing_score)}
      <div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
        ${escapeHtml(shortText(e.summary))}
      </div>
    </div>`).join("");
}

/* ================= DETAIL ================= */
async function loadEntry(id){
  const d=await supa(`entries?select=*&id=eq.${id}`);
  const e=d[0]; if(!e) return;
  currentEntryId=id;
  $("results").innerHTML=`
    <h2>${escapeHtml(e.title)}</h2>
    ${renderScoreBlock(e.score,e.processing_score)}
    <a href="#" id="legalLink">Rechtlicher Hinweis</a>
    <div>${renderSummary(e.summary)}</div>
    <div id="entryActions"></div>`;
  renderEntryActions(e.title);
  $("legalLink").onclick=(ev)=>{ev.preventDefault();openLegal();};
}

/* ================= SOCIAL ================= */
function renderEntryActions(title){
  const u=location.href;
  const eu=encodeURIComponent(u);
  const et=encodeURIComponent(title+" – MarketShield");
  $("entryActions").innerHTML=`
    <div style="margin-top:24px;display:flex;gap:8px;flex-wrap:wrap">
      <button onclick="navigator.clipboard.writeText('${u}')">Kopieren</button>
      <button onclick="window.print()">Drucken</button>
      <button onclick="window.open('https://wa.me/?text=${et}%20${eu}')">WhatsApp</button>
      <button onclick="window.open('https://t.me/share/url?url=${eu}&text=${et}')">Telegram</button>
      <button onclick="window.open('https://twitter.com/intent/tweet?url=${eu}&text=${et}')">X</button>
      <button onclick="window.open('https://facebook.com/sharer/sharer.php?u=${eu}')">Facebook</button>
    </div>`;
}

/* ================= LEGAL ================= */
function openLegal(){
  alert("MarketShield informiert neutral. Bestimmte Bewertungen dürfen rechtlich nicht vollständig dargestellt werden.");
}

/* ================= REPORT ================= */
document.addEventListener("click",(e)=>{
  const btn=e.target.closest("#reportBtn");
  if(!btn) return;
  e.preventDefault(); e.stopPropagation();
  const txt=prompt("Produkt / Problem melden:");
  if(txt && txt.length>=5){
    supaPost("reports",{description:txt,entry_id:currentEntryId,url:location.href});
    alert("Danke! Meldung gespeichert.");
  }
});

/* ================= SEARCH ================= */
async function smartSearch(q){
  const enc=encodeURIComponent(q);
  return await supa(`entries?select=id,title,summary,score,processing_score&or=(title.ilike.%25${enc}%25,summary.ilike.%25${enc}%25)`);
}

$("searchInput")?.addEventListener("input",async e=>{
  const q=e.target.value.trim();
  if(q.length<2) return;
  renderList(await smartSearch(q));
});

/* ================= KATEGORIEN ================= */
async function loadCategories(){
  const g=document.querySelector(".category-grid"); if(!g) return;
  const d=await fetch("categories.json").then(r=>r.json());
  g.innerHTML="";
  d.categories.forEach(c=>{
    const b=document.createElement("button");
    b.textContent=c.title;
    b.onclick=()=>loadCategory(c.title);
    g.appendChild(b);
  });
}

async function loadCategory(cat){
  renderList(await supa(`entries?select=id,title,summary,score,processing_score&category=eq.${encodeURIComponent(cat)}`));
}

/* ================= NAV ================= */
document.addEventListener("click",(e)=>{
  const c=e.target.closest(".entry-card");
  if(!c||e.target.closest("#reportBtn")) return;
  loadEntry(c.dataset.id);
});

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded",()=>loadCategories());
