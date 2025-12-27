/* =====================================================
   MarketShield – app.js (FINAL / STABIL / LOCKED)
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

/* ================= RECHTLICHER HINWEIS ================= */
const LEGAL_HTML = `
<p>
MarketShield dient ausschließlich der Information.<br>
Es handelt sich nicht um Beratung.<br>
Alle Angaben ohne Gewähr.
</p>
`;

function ensureLegalModal() {
  if ($("msLegalModal")) return;

  const modal = document.createElement("div");
  modal.id = "msLegalModal";
  modal.style.cssText = "display:none;position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.45);align-items:center;justify-content:center;";

  modal.innerHTML = `
    <div style="background:#fff;border-radius:12px;max-width:800px;width:95%;padding:16px">
      <b>Rechtlicher Hinweis</b>
      <div style="margin-top:10px;font-size:13px">${LEGAL_HTML}</div>
      <div style="text-align:right;margin-top:12px">
        <button id="closeLegal">✕</button>
      </div>
    </div>
  `;

  modal.addEventListener("click", e => {
    if (e.target === modal) modal.style.display = "none";
  });

  document.body.appendChild(modal);

  modal.querySelector("#closeLegal").onclick = () => modal.style.display = "none";
}

function openLegal() {
  $("msLegalModal").style.display = "flex";
}

/* ================= HEADER LINK ================= */
function ensureHeaderHomeLink() {
  const header = document.querySelector("header");
  if (!header || $("headerHomeLink")) return;

  const a = document.createElement("a");
  a.id = "headerHomeLink";
  a.href = "/";
  a.textContent = "MarketShield Startseite";
  a.style.cssText = "font-size:12px;opacity:.7;display:block;text-align:center;margin-top:6px;text-decoration:underline;";
  header.appendChild(a);
}

/* ================= TABELLEN ================= */
function renderSummary(text="") {
  const lines = text.split("\n");
  let html = "";
  let i = 0;

  const isSep = s => /^[-| :]+$/.test(s||"");

  while (i < lines.length) {
    if (lines[i].includes("|") && isSep(lines[i+1])) {
      const head = lines[i].split("|").map(s=>s.trim());
      i+=2;
      const rows=[];
      while (lines[i] && lines[i].includes("|")) {
        rows.push(lines[i].split("|").map(s=>s.trim()));
        i++;
      }
      html += `<table border="1" style="border-collapse:collapse;width:100%;margin:10px 0">
        <tr>${head.map(h=>`<th>${escapeHtml(h)}</th>`).join("")}</tr>
        ${rows.map(r=>`<tr>${r.map(c=>`<td>${escapeHtml(c)}</td>`).join("")}</tr>`).join("")}
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
  $("results").innerHTML = data.map(e=>`
    <div class="entry-card" data-id="${e.id}">
      <b>${escapeHtml(e.title)}</b>
      <div style="opacity:.8">${escapeHtml(e.summary||"")}</div>
    </div>
  `).join("");
}

/* ================= DETAIL ================= */
async function loadEntry(id) {
  const d = await supa(`entries?id=eq.${id}`);
  const e = d[0];
  if (!e) return;

  currentEntryId = e.id;

  $("results").innerHTML = `
    <h2>${escapeHtml(e.title)}</h2>
    <a href="#" id="legalLink">Rechtlicher Hinweis</a>
    <div>${renderSummary(e.summary||"")}</div>

    <button id="reportBtn" type="button">
      Produkt / Problem melden<br>
      <small>Anonym · in 1 Minute · hilft allen</small>
    </button>

    <div id="entryActions"></div>
  `;

  $("legalLink").onclick = (ev)=>{ev.preventDefault();openLegal();};
}

/* ================= REPORT (STABIL) ================= */
document.addEventListener("click", e => {
  const btn = e.target.closest("#reportBtn");
  if (!btn) return;

  e.preventDefault();
  e.stopPropagation();

  let modal = $("reportModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "reportModal";
    modal.style.cssText = "position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;";
    modal.innerHTML = `
      <form id="reportForm" style="background:#fff;padding:16px;border-radius:10px;width:90%;max-width:420px">
        <b>Produkt / Problem melden</b>
        <textarea name="description" required style="width:100%;margin-top:8px"></textarea>
        <div id="reportStatus" style="font-size:12px;margin-top:6px"></div>
        <div style="margin-top:10px;text-align:right">
          <button type="submit">Senden</button>
          <button type="button" id="closeReport">Abbrechen</button>
        </div>
      </form>
    `;
    document.body.appendChild(modal);

    modal.addEventListener("click", ev=>{
      if (ev.target===modal) modal.remove();
    });

    modal.querySelector("#closeReport").onclick = ()=>modal.remove();

    modal.querySelector("#reportForm").onsubmit = async ev=>{
      ev.preventDefault();
      const desc = ev.target.description.value.trim();
      if (desc.length<5) return;

      $("reportStatus").textContent="Sende …";
      await supaPost("reports",{description:desc,entry_id:currentEntryId,url:location.href});
      $("reportStatus").textContent="Gesendet. Danke!";
      setTimeout(()=>modal.remove(),600);
    };
  }
});

/* ================= NAVIGATION ================= */
document.addEventListener("click", e=>{
  const card = e.target.closest(".entry-card");
  if (!card) return;
  loadEntry(card.dataset.id);
});

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", ()=>{
  ensureLegalModal();
  ensureHeaderHomeLink();

  const id = new URLSearchParams(location.search).get("id");
  if (id) loadEntry(id);
});
