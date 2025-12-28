/* =====================================================
   MarketShield – app.js
   FINAL / STABIL / REPARIERT
===================================================== */

let currentEntryId = null;

/* ================= SUPABASE ================= */
const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
const SUPABASE_KEY = "sb_publishable_FBywhrypx6zt_0nMlFudyQ_zFiqZKTD";

async function supa(query, opts = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
    method: opts.method || "GET",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json"
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });

  const t = await r.text();
  if (!r.ok) throw new Error(t || r.statusText);
  return t ? JSON.parse(t) : [];
}

/* ================= DOM ELEMENTE ================= */
const elResults     = document.getElementById("results");
const elSearch      = document.getElementById("searchInput");
const elBackHome    = document.getElementById("backHome");
const elReportBtn   = document.getElementById("reportBtn");
const elReportModal = document.getElementById("reportModal");
const elReportForm  = document.getElementById("reportForm");
const elReportClose = document.getElementById("closeReportModal");

/* ================= SCORES ================= */
function renderHealthScore(score) {
  const n = Number(score);
  if (!Number.isFinite(n) || n < 1 || n > 100) return "";
  if (n >= 80) return "💚💚💚";
  if (n >= 60) return "💚💚";
  if (n >= 40) return "💚";
  if (n >= 20) return "💛";
  return "⚠️";
}

function renderIndustryScore(score) {
  const n = Number(score);
  if (!Number.isFinite(n) || n < 1) return "";
  const clamped = Math.min(10, n);
  const width = Math.round((clamped / 10) * 100);
  const hue = Math.round(120 - clamped * 12);

  return `
    <div style="margin-top:6px;">
      <div style="height:6px;background:#ddd;border-radius:4px;overflow:hidden;">
        <div style="width:${width}%;height:6px;background:hsl(${hue},85%,45%);"></div>
      </div>
    </div>`;
}

/* ================= LISTE ================= */
function renderList(data = []) {
  if (!elResults) return;

  elResults.innerHTML = `
    <div id="shareBox"></div>
    ${data.map(e => `
      <div class="entry-card" data-id="${e.id}">
        <div style="font-size:18px;font-weight:700;">${e.title}</div>
        ${renderHealthScore(e.score) ? `<div>${renderHealthScore(e.score)}</div>` : ""}
        ${(e.type !== "thema" && e.processing_score > 0) ? renderIndustryScore(e.processing_score) : ""}
        <div style="font-size:14px;opacity:.85;">
          ${(e.summary || "").slice(0,160)}…
        </div>
      </div>
    `).join("")}
  `;

  bindEntryCards();
  if (elBackHome) elBackHome.style.display = "none";
}

/* ================= DETAIL ================= */
async function loadEntry(id) {
  if (!elResults) return;

  const d = await supa(`entries?select=*&id=eq.${id}`);
  const e = d[0];
  if (!e) return;

  currentEntryId = e.id;

  elResults.innerHTML = `
    <div id="shareBox"></div>
    <h2>${e.title}</h2>

    <div style="margin:10px 0;">
      ${renderHealthScore(e.score) ? `<div>${renderHealthScore(e.score)}</div>` : ""}
      ${(e.type !== "thema" && e.processing_score > 0) ? renderIndustryScore(e.processing_score) : ""}
    </div>

    <div style="white-space:pre-wrap;line-height:1.6;">
      ${e.summary || ""}
    </div>
  `;

  if (elBackHome) elBackHome.style.display = "block";
}

/* ================= ENTRY CLICK ================= */
function bindEntryCards() {
  document.querySelectorAll(".entry-card").forEach(card => {
    card.onclick = () => {
      const id = card.dataset.id;
      if (!id) return;
      history.pushState({ id }, "", "?id=" + id);
      loadEntry(id);
    };
  });
}

/* ================= SUCHE ================= */
async function smartSearch(q) {
  if (q.length < 2) return [];
  const enc = encodeURIComponent(q);
  return await supa(
    `entries?select=id,title,summary,score,processing_score,type&or=(title.ilike.%25${enc}%25,summary.ilike.%25${enc}%25)`
  );
}

if (elSearch) {
  elSearch.addEventListener("input", async () => {
    const q = elSearch.value.trim();
    if (q.length < 2) {
      elResults.innerHTML = `<div id="shareBox"></div>`;
      return;
    }
    renderList(await smartSearch(q));
  });
}

/* ================= BACK HOME ================= */
if (elBackHome) {
  elBackHome.onclick = () => {
    currentEntryId = null;
    history.pushState({}, "", location.pathname);
    elResults.innerHTML = `<div id="shareBox"></div>`;
    elBackHome.style.display = "none";
  };
}

/* ================= REPORT ================= */
if (elReportBtn && elReportModal) {
  elReportBtn.onclick = () => elReportModal.style.display = "block";
}
if (elReportClose && elReportModal) {
  elReportClose.onclick = () => elReportModal.style.display = "none";
}
if (elReportForm) {
  elReportForm.onsubmit = async (e) => {
    e.preventDefault();
    const txt = elReportForm.description.value.trim();
    if (txt.length < 3) return;

    await supa("reports", {
      method: "POST",
      body: { description: txt, entry_id: currentEntryId }
    });

    elReportForm.reset();
    if (elReportModal) elReportModal.style.display = "none";
    alert("Danke! Meldung wurde gespeichert.");
  };
}

/* ================= HISTORY ================= */
window.addEventListener("popstate", () => {
  const id = new URLSearchParams(location.search).get("id");
  if (id) loadEntry(id);
  else {
    elResults.innerHTML = `<div id="shareBox"></div>`;
    if (elBackHome) elBackHome.style.display = "none";
  }
});

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  const id = new URLSearchParams(location.search).get("id");
  if (id) loadEntry(id);
});
