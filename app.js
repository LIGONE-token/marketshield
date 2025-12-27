/* =====================================================
   MarketShield – app.js (STABIL / FINAL / REPORT INPUT FIX)
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

function escapeHtml(s="") {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function normalizeText(t="") {
  return t.replace(/\*\*/g,"").replace(/##+/g,"").replace(/\n{3,}/g,"\n\n").trim();
}

function shortText(t,max=160){
  t=normalizeText(t).replace(/\s+/g," ");
  return t.length>max?t.slice(0,max)+" …":t;
}

/* ================= LISTE ================= */
function renderList(data){
  const box=$("results"); if(!box) return;
  box.innerHTML=(data||[]).map(e=>`
    <div class="entry-card" data-id="${e.id}">
      <b>${escapeHtml(e.title)}</b>
      <div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
        ${escapeHtml(shortText(e.summary))}
      </div>
    </div>`).join("");
}

/* ================= DETAIL ================= */
async function loadEntry(id){
  const box=$("results"); if(!box) return;
  const d=await supa(`entries?select=*&id=eq.${id}`);
  const e=d[0]; if(!e) return;
  currentEntryId=id;

  box.innerHTML=`
    <div class="entry-card" data-id="${e.id}">
      <h2>${escapeHtml(e.title)}</h2>

      <button id="reportBtn" type="button">
        Produkt / Problem melden<br>
        <small>Anonym · in 1 Minute · hilft allen</small>
      </button>

      <div style="white-space:pre-wrap;margin-top:12px">
        ${escapeHtml(normalizeText(e.summary))}
      </div>
    </div>`;
}

/* ================= REPORT MODAL ================= */
function ensureReportModal(){
  if($("reportModal")) return;

  const m=document.createElement("div");
  m.id="reportModal";
  m.style.cssText="position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.45);display:none;align-items:center;justify-content:center;";
  m.innerHTML=`
    <form id="reportForm" style="background:#fff;padding:16px;border-radius:12px;width:90%;max-width:420px">
      <b>Produkt / Problem melden</b>
      <textarea name="description" style="width:100%;height:120px;margin-top:8px" required></textarea>
      <div id="reportStatus" style="font-size:12px;margin-top:6px"></div>
      <div style="margin-top:10px;text-align:right">
        <button type="submit">Senden</button>
        <button type="button" id="closeReport">Abbrechen</button>
      </div>
    </form>`;
  document.body.appendChild(m);

  // ❗ GANZ WICHTIG: Klicks IM MODAL dürfen NICHT weitergegeben werden
  m.addEventListener("click",e=>e.stopPropagation());
  $("closeReport").onclick=()=>m.style.display="none";

  $("reportForm").onsubmit=async(e)=>{
    e.preventDefault();
    const txt=e.target.description.value.trim();
    if(txt.length<5){
      $("reportStatus").textContent="Bitte mindestens 5 Zeichen.";
      return;
    }
    $("reportStatus").textContent="Sende …";
    await supaPost("reports",{description:txt,entry_id:currentEntryId,url:location.href});
    $("reportStatus").textContent="Gesendet. Danke!";
    setTimeout(()=>{m.style.display="none";e.target.reset();},600);
  };
}

/* Klick auf Reportbutton */
document.addEventListener("click",(e)=>{
  const btn=e.target.closest("#reportBtn");
  if(!btn) return;
  e.preventDefault();
  e.stopPropagation();
  ensureReportModal();
  $("reportModal").style.display="flex";
});

/* ================= NAVIGATION ================= */
document.addEventListener("click",(e)=>{
  if(e.target.closest("#reportModal")) return; // 🔥 DAS WAR DER FEHLENDE SCHUTZ
  if(e.target.closest("#reportBtn")) return;

  const card=e.target.closest(".entry-card");
  if(!card) return;
  loadEntry(card.dataset.id);
});

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded",async()=>{
  const d=await supa("entries?select=id,title,summary&limit=20");
  renderList(d);
});
