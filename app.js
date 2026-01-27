/* =====================================================
   MarketShield – app.js (FINAL / STABIL)
   Drop-in Replacement – nichts fehlt
===================================================== */

/* ================= HARD GUARD ================= */
(function () {
  if (location.pathname.endsWith("/undefined/")) {
    history.replaceState(null, "", "/marketshield/");
  }
})();

/* ================= GLOBAL ================= */
let currentEntryId = null;

/* ================= SUPABASE ================= */
const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
const SUPABASE_KEY = "sb_publishable_JHb4LBhP26eI7BgDS1jIkw_4OYn3-F9";

async function supa(query) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });
    const t = await r.text();
    if (!r.ok) return [];
    const j = JSON.parse(t || "[]");
    return Array.isArray(j) ? j : [];
  } catch {
    return [];
  }
}

async function supaPost(table, payload) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify(payload)
    });
  } catch {}
}

/* ================= HELPERS ================= */
function renderEffectsBlock(title, items) {
  if (!items) return "";
  let arr;
  try {
    arr = Array.isArray(items) ? items : JSON.parse(items);
  } catch {
    return "";
  }
  if (!arr.length) return "";

  return `
    <section class="entry-effects">
      <h3>${title}</h3>
      <ul>
        ${arr.map(i => `<li>${escapeHtml(i)}</li>`).join("")}
      </ul>
    </section>
  `;
}

const $ = id => document.getElementById(id);

function escapeHtml(s="") {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
function shortText(t="",max=160){
  t=String(t).replace(/\s+/g," ").trim();
  return t.length>max?t.slice(0,max)+" …":t;
}
function showCategories(){
  const g=document.querySelector(".category-grid");
  if(g) g.style.display="grid";
}
function hideStaticEntries(){
  const s=$("static-entries");
  if(s) s.style.display="none";
}
function renderMarkdownTableBlock(text) {
  if (!text || !text.includes("|")) return null;

  const lines = text
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);

  // finde Header + Trennlinie (egal ob Linien dazwischen sind)
  let headerIndex = -1;
  let sepIndex = -1;

  for (let i = 0; i < lines.length - 1; i++) {
    if (
      lines[i].includes("|") &&
      /^(\|?\s*:?-+:?\s*)+(\|\s*:?-+:?\s*)*\|?$/.test(lines[i + 1])
    ) {
      headerIndex = i;
      sepIndex = i + 1;
      break;
    }
  }

  if (headerIndex === -1) return null;

  const header = lines[headerIndex]
    .split("|")
    .map(s => s.trim())
    .filter(Boolean);

  const rows = [];

  for (let i = sepIndex + 1; i < lines.length; i++) {
    if (!lines[i].includes("|")) break;
    rows.push(
      lines[i].split("|").map(s => s.trim()).filter(Boolean)
    );
  }

  if (!rows.length) return null;

  return `
    <div class="table-wrapper">
      <table class="ms-table">
        <thead>
          <tr>${header.map(h => `<th>${escapeHtml(h)}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${rows
            .map(
              r =>
                `<tr>${r.map(c => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderContent(text = "") {
  if (!text) return "";

  const blocks = [];
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

  let buffer = [];
  let tableBuffer = [];

  function flushParagraph() {
    if (buffer.length) {
      blocks.push(
        buffer.map(p => `<p>${escapeHtml(p)}</p>`).join("")
      );
      buffer = [];
    }
  }

  function flushTable() {
    if (tableBuffer.length) {
      const table = renderMarkdownTableBlock(tableBuffer.join("\n"));
      if (table) blocks.push(table);
      tableBuffer = [];
    }
  }

  for (let line of lines) {
    const isTableLine =
  line.includes("|") || /^[-\s]{3,}$/.test(line);

    if (isTableLine) {
      flushParagraph();
      tableBuffer.push(line);
    } else {
      flushTable();
      if (line.trim()) buffer.push(line.trim());
      else flushParagraph();
    }
  }

  flushTable();
  flushParagraph();

  return blocks.join("");
}



/* ================= SCORES (EXAKT WIE VORHER) ================= */
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
  const c=Math.min(Math.max(n,0),10);
  const w=Math.round((c/10)*80);
  let col="#2e7d32";
  if(c>=3&&c<=7) col="#f9a825";
  if(c>=8) col="#c62828";
  return `<div style="width:80px;height:8px;background:#e0e0e0;border-radius:6px;">
    <div style="width:${w}px;height:8px;background:${col};border-radius:6px;"></div>
  </div>`;
}
function renderScoreBlock(score,processing,size=13){
  const h=renderHealth(score);
  const i=renderIndustry(processing);
  if(!h&&!i) return "";
  return `<div style="margin:12px 0;">
    ${h?`<div style="display:grid;grid-template-columns:90px 1fr;gap:8px;align-items:center;">
      <div>${h}</div><div style="font-size:${size}px;opacity:.85;">Gesundheitsscore</div></div>`:""}
    ${i?`<div style="display:grid;grid-template-columns:90px 1fr;gap:8px;align-items:center;margin-top:6px;">
      <div>${i}</div><div style="font-size:${size}px;opacity:.85;">Industrie-Verarbeitungsgrad</div></div>`:""}
  </div>`;
}

/* ================= RATING ================= */
function getUserHash(){
  let h=localStorage.getItem("ms_user_hash");
  if(!h){h=Math.random().toString(36).slice(2)+Date.now().toString(36);localStorage.setItem("ms_user_hash",h);}
  return h;
}
function renderRatingBlock(avg=0,count=0){
  const a=Number(avg)||0,c=Number(count)||0,f=c>0?Math.round(a):0;
  return `<div class="rating-wrapper"><div class="rating-box">
    <div class="rating-stars">
      ${[1,2,3,4,5].map(n=>`<span class="rating-star ${n<=f?"filled":"empty"}" data-star="${n}">${n<=f?"★":"☆"}</span>`).join("")}
    </div>
    <span class="rating-info">${c?`${a.toFixed(1).replace(".",",")} von 5 (${c})`:"Bitte Eintrag bewerten!"}</span>
  </div></div>`;
}
function bindRatingClicks(){
  const box=document.querySelector(".rating-stars");
  if(!box||!currentEntryId) return;
  box.querySelectorAll(".rating-star").forEach(s=>{
    s.addEventListener("click",()=>supaPost("entry_ratings",{entry_id:currentEntryId,rating:Number(s.dataset.star),user_hash:getUserHash()}).then(()=>loadEntry(location.pathname.replace(/^\/marketshield\/|\/$/g,""))));
  });
}

/* ================= LISTE ================= */
function renderList(data) {
  const box = document.getElementById("results");
  if (!box) return;

  hideStaticEntries();
  currentEntryId = null;
  box.innerHTML = "";

  if (!data || data.length === 0) {
    box.innerHTML = "<p style='opacity:.6'>Keine passenden Einträge gefunden.</p>";
    return;
  }

  data.forEach(e => {
    if (!e.slug) return;

    const a = document.createElement("a");
    a.href = `/marketshield/${e.slug}/`; // SEO & Fallback
    a.className = "entry-card";
    a.style.display = "block";
    a.style.cursor = "pointer";
    a.style.textDecoration = "none";
    a.style.color = "inherit";

    a.addEventListener("click", (ev) => {
      ev.preventDefault();              // ⛔ verhindert Startseiten-Sprung
      history.pushState(null, "", `/marketshield/${e.slug}/`);
loadEntry(e.slug);
                 
    });

    a.innerHTML = `
      <div style="font-size:20px;font-weight:800;">
        ${escapeHtml(e.title)}
      </div>
      ${renderRatingBlock(e.rating_avg, e.rating_count)}
      ${renderScoreBlock(e.score, e.processing_score)}
      <div style="font-size:15px;line-height:1.4;">
        ${escapeHtml(shortText(e.summary))}
      </div>
    `;

    box.appendChild(a);
  });
}



/* ================= DETAIL ================= */
async function loadEntry(slug){
  const box = $("results");
  if (!box || !slug) return;

  const d = await supa(`entries_with_ratings?select=*&slug=eq.${encodeURIComponent(slug)}`);
  const e = d[0];
  if (!e) return;

  currentEntryId = e.id;
  history.replaceState(null, "", `/marketshield/${e.slug}/`);
  document.title = `${e.title} – MarketShield`;

  box.innerHTML = `
    <article class="entry-detail">

      <!-- 1. Titel -->
      <h2>${escapeHtml(e.title)}</h2>

      <!-- 2. Bewertung / Einordnung -->
      ${renderRatingBlock(e.rating_avg, e.rating_count)}
      ${renderScoreBlock(e.score, e.processing_score, 14)}

      <!-- 3. Zusammenfassung -->
      <section class="entry-summary">
        ${renderContent(e.summary || "")}
      </section>

      <!-- 4. Einordnung nach Wirkung -->
      ${renderEffectsBlock("Positiv", e.effects_positive)}
      ${renderEffectsBlock("Negativ", e.effects_negative)}
      ${renderEffectsBlock("Risikogruppen", e.risk_groups)}

      <!-- 5. Fachliche Details -->
      ${e.mechanism ? `
        <section class="entry-mechanism">
          <h3>Wirkmechanismus</h3>
          <p>${escapeHtml(e.mechanism)}</p>
        </section>` : ""}

      ${e.scientific_note ? `
        <section class="entry-science">
          <h3>Wissenschaftliche Einordnung</h3>
          <p>${escapeHtml(e.scientific_note)}</p>
        </section>` : ""}

      <div id="similarEntries"></div>
      <div id="affiliateBox"></div>
      <div id="entryActions"></div>

    </article>
  `;

  bindRatingClicks();
  loadSimilarEntries(e);
}


/* ================= SIMILAR ================= */
async function loadSimilarEntries(cur){
  const box = $("similarEntries");
  if (!box) return;

  const d = await supa(
    `entries_with_ratings?select=id,slug,title,summary&category=eq.${encodeURIComponent(cur.category)}&id=neq.${cur.id}&limit=5`
  );

  if (!d.length) {
    box.innerHTML = "";
    return;
  }

  box.innerHTML = `
    <h3>Ähnliche Einträge</h3>
    <div class="similar-list">
      ${d.map(e => `
        <div class="similar-card" data-slug="${e.slug}">
          <strong>${escapeHtml(e.title)}</strong>
          <div>${escapeHtml(shortText(e.summary,120))}</div>
        </div>
      `).join("")}
    </div>
  `;

  /* ✅ DAS FEHLTE – CLICK BINDING */
  box.querySelectorAll(".similar-card").forEach(card => {
    card.style.cursor = "pointer";
    card.addEventListener("click", () => {
      const slug = card.dataset.slug;
      if (!slug) return;
      history.pushState(null, "", `/marketshield/${slug}/`);
      loadEntry(slug);
    });
  });
}



/* ================= SEARCH + CATEGORIES ================= */
async function smartSearch(q){
  if(q.trim().length<2) return [];
  return supa(`entries_with_ratings?select=*&title=ilike.%25${encodeURIComponent(q)}%25`);
}
function initSearch(){
  const i=$("searchInput"); if(!i) return;
  i.addEventListener("input",async()=>renderList(await smartSearch(i.value)));
}
async function loadCategories(){
  const g=document.querySelector(".category-grid"); if(!g) return;
  const d=await supa("categories"); g.innerHTML="";
  d.forEach(c=>{
    const b=document.createElement("button");
    b.textContent=c.title;
    b.className="cat-btn";
    b.onclick=()=>supa(`entries_with_ratings?select=*&category=eq.${encodeURIComponent(c.title)}`).then(renderList);
    g.appendChild(b);
  });
  g.style.display="grid";
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded",()=>{
  initSearch();

  const slug = location.pathname.replace(/^\/marketshield\/|\/$/g, "");

  if (slug) {
    loadEntry(slug);        // 👉 Detailseite zuerst
  } else {
    loadCategories();       // 👉 nur Startseite
    showCategories();
  }
});

