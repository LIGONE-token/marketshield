/* =====================================================
   MarketShield – app.js (FINAL / ABSOLUT STABIL)
   - Kategorien FEST im Code (nie wieder weg)
   - Generator-fest
   - Startseite leer + Kategorien sichtbar
   - Texte roh, Summary mit Tabellen
   - Report-Button unantastbar
===================================================== */

/* ================= CONFIG ================= */
const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
const SUPABASE_KEY = "sb_publishable_FBywhrypx6zt_0nMlFudyQ_zFiqZKTD";

/* ================= FESTE KATEGORIEN ================= */
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
  if (!s) return "";
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderRawText(text) {
  if (!text) return "";
  return `<div style="white-space:pre-wrap;line-height:1.6;">${escapeHtml(text)}</div>`;
}

/* ================= SUMMARY MIT TABELLEN ================= */
function renderSummaryWithTables(text) {
  if (!text) return "";
  const lines = text.split("\n");
  let html = "", buf = [];

  const flush = () => {
    if (buf.length) {
      html += `<p>${escapeHtml(buf.join("\n")).replace(/\n/g,"<br>")}</p>`;
      buf = [];
    }
  };

  const isSep = l => /^[-\s|]+$/.test(l);
  const isRow = l => (l.match(/\|/g)||[]).length >= 2;

  for (let i=0;i<lines.length;) {
    const l = lines[i];
    if (!l.trim()) { flush(); i++; continue; }

    if (isRow(l)) {
      flush();
      const rows = [];
      while (i<lines.length && (isRow(lines[i])||isSep(lines[i]))) {
        if (!isSep(lines[i])) {
          rows.push(lines[i].split("|").map(c=>c.trim()).filter(Boolean));
        }
        i++;
      }
      html += `<div class="summary-table-wrap"><table class="summary-table"><thead><tr>`;
      rows[0].forEach(c=>html+=`<th>${escapeHtml(c)}</th>`);
      html += `</tr></thead><tbody>`;
      rows.slice(1).forEach(r=>{
        html+="<tr>";
        r.forEach(c=>html+=`<td>${escapeHtml(c)}</td>`);
        html+="</tr>";
      });
      html += `</tbody></table></div>`;
      continue;
    }
    buf.push(l); i++;
  }
  flush(); return html;
}

/* ================= SUPABASE ================= */
async function supa(q) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${q}`, {
    headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`}
  });
  return r.json();
}

/* ================= CORE ================= */
function setResults(html){ resultsBox().innerHTML = `<div id="shareBox"></div>${html||""}`; }
function clearResults(){ setResults(""); }

/* ================= LISTE ================= */
function renderList(items){
  if(!items?.length){clearResults();return;}
  setResults(items.map(e=>`
    <div class="entry-card" data-id="${e.id}">
      <strong>${escapeHtml(e.title)}</strong><br>
      <small>${escapeHtml(e.category)} · ${escapeHtml(e.type)}</small>
    </div>`).join(""));
}

async function loadListByCategory(cat){
  const d = await supa(`entries?select=id,title,category,type&category=eq.${encodeURIComponent(cat)}`);
  renderList(d);
}

/* ================= DETAIL ================= */
async function loadEntry(id){
  const d = await supa(`entries?id=eq.${id}&limit=1`);
  if(!d?.length){clearResults();return;}
  const e=d[0];
  setResults(`
    <h2>${escapeHtml(e.title)}</h2>
    ${renderSummaryWithTables(e.summary)}
    ${e.mechanism?`<h3>Mechanismus</h3>${renderRawText(e.mechanism)}`:""}
  `);
}

/* ================= KATEGORIEN (IMMER SICHTBAR) ================= */
function loadCategories(){
  const grid = $$(".category-grid");
  if(!grid) return;
  grid.innerHTML = CATEGORIES
    .map(c=>`<button class="cat-btn" data-cat="${c}">${c}</button>`)
    .join("");
}

/* ================= NAV ================= */
document.addEventListener("click",e=>{
  if(e.target.closest("#reportBtn")) return;
  const c=e.target.closest(".cat-btn");
  if(c){loadListByCategory(c.dataset.cat);return;}
  const card=e.target.closest(".entry-card");
  if(card){loadEntry(card.dataset.id);}
});

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded",()=>{
  loadCategories(); // 🔒 KATEGORIEN SIND JETZT IMMER DA
  clearResults();
});
