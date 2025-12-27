/* =====================================================
   MarketShield – app.js (FINAL / FULL / RESTORED)
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

/* ================= HELPERS ================= */
const $ = (id) => document.getElementById(id);

function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeText(text) {
  if (!text) return "";
  return String(text)
    .replace(/\*\*/g, "")
    .replace(/##+/g, "")
    .replace(/__+/g, "")
    .replace(/~~+/g, "")
    .replace(/`+/g, "")
    .replace(/\\n/g, "\n")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function shortText(t, max = 160) {
  t = normalizeText(t);
  return t.length > max ? t.slice(0, max) + " …" : t;
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
  return `
    <div style="width:80px;height:8px;background:#e0e0e0;border-radius:6px;">
      <div style="width:${w}px;height:8px;background:#2e7d32;border-radius:6px;"></div>
    </div>`;
}

function renderScoreBlock(score, processing) {
  const h = renderHealth(score);
  const i = renderIndustry(processing);
  if (!h && !i) return "";

  return `
    <div style="margin:12px 0;">
      ${h ? `<div style="display:grid;grid-template-columns:90px 1fr;gap:8px;">
        <div>${h}</div><div>Gesundheitsscore</div></div>` : ""}
      ${i ? `<div style="display:grid;grid-template-columns:90px 1fr;gap:8px;">
        <div>${i}</div><div>Industrie-Verarbeitungsgrad</div></div>` : ""}
    </div>`;
}

/* ================= LISTE ================= */
function renderList(data) {
  const box = $("results");
  if (!box) return;

  box.innerHTML = (data || []).map(e => `
    <div class="entry-card" data-id="${e.id}">
      <div style="font-size:20px;font-weight:800;">${escapeHtml(e.title)}</div>
      ${renderScoreBlock(e.score, e.processing_score)}
      <div>${escapeHtml(shortText(e.summary))}</div>
    </div>
  `).join("");
}

/* ================= DETAIL ================= */
async function loadEntry(id) {
  const box = $("results");
  if (!box) return;

  const d = await supa(`entries?select=*&id=eq.${id}`);
  const e = d[0];
  if (!e) return;

  currentEntryId = id;

  box.innerHTML = `
    <h2>${escapeHtml(e.title)}</h2>
    ${renderScoreBlock(e.score, e.processing_score)}

    <div style="font-size:11px;opacity:.6;cursor:pointer;text-decoration:underline;"
      onclick="event.stopPropagation(); openLegalPopup();">
      Rechtlicher Hinweis
    </div>

    <div style="white-space:pre-wrap;">${escapeHtml(normalizeText(e.summary))}</div>

    <button
      onclick="event.stopPropagation(); openReportPopup();">
      Fehler melden
    </button>

    <div id="entryActions"></div>
  `;
  renderEntryActions(e.title);
}

/* ================= SOCIAL ================= */
function renderEntryActions(title) {
  const box = $("entryActions");
  if (!box) return;

  const url = location.href;
  const enc = encodeURIComponent(title + " – MarketShield");

  box.innerHTML = `
    <button onclick="navigator.clipboard.writeText('${url}')">Link kopieren</button>
    <button onclick="window.print()">Drucken</button>
    <button onclick="window.open('https://t.me/share/url?url=${url}&text=${enc}')">Telegram</button>
  `;
}

/* ================= SEARCH ================= */
async function smartSearch(q) {
  const enc = encodeURIComponent(q);
  return await supa(
    `entries?select=id,title,summary,score,processing_score&title=ilike.%25${enc}%25`
  );
}

async function saveSearchQuery(q) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/search_queue`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify({ query: q, url: location.href })
    });
  } catch {}
}

function initSearch() {
  const input = $("searchInput");
  if (!input) return;

  input.addEventListener("input", async () => {
    const q = input.value.trim();
    if (q.length < 2) return;
    saveSearchQuery(q);
    renderList(await smartSearch(q));
  });
}

/* ================= LEGAL POPUP ================= */
function ensureLegalPopup() {
  if (document.getElementById("legalPopup")) return;
  const d = document.createElement("div");
  d.id = "legalPopup";
  d.style.cssText = "display:none;position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:9999;";
  d.innerHTML = `
    <div style="background:#fff;margin:10% auto;padding:16px;max-width:420px;">
      <b>Rechtlicher Hinweis</b><br><br>
      MarketShield kann rechtlich nicht alle Informationen vollständig darstellen.
      Inhalte dienen der Einordnung und ersetzen keine Beratung.
      <br><br>
      <button onclick="closeLegalPopup()">Schließen</button>
    </div>`;
  document.body.appendChild(d);
}
function openLegalPopup(){ensureLegalPopup();$("legalPopup").style.display="block";}
function closeLegalPopup(){$("legalPopup").style.display="none";}

/* ================= REPORT POPUP ================= */
function ensureReportPopup() {
  if (document.getElementById("reportPopup")) return;
  const d = document.createElement("div");
  d.id = "reportPopup";
  d.style.cssText = "display:none;position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:9999;";
  d.innerHTML = `
    <div style="background:#fff;margin:10% auto;padding:16px;max-width:420px;">
      <b>Fehler melden</b><br><br>
      <textarea id="reportText" style="width:100%;height:80px;"></textarea><br><br>
      <button onclick="submitReport()">Senden</button>
      <button onclick="closeReportPopup()">Abbrechen</button>
    </div>`;
  document.body.appendChild(d);
}
function openReportPopup(){ensureReportPopup();$("reportPopup").style.display="block";}
function closeReportPopup(){$("reportPopup").style.display="none";}

async function submitReport() {
  const text = $("reportText").value.trim();
  if (!text) return alert("Bitte Text eingeben");
  await fetch(`${SUPABASE_URL}/rest/v1/reports`, {
    method:"POST",
    headers:{
      apikey:SUPABASE_KEY,
      Authorization:`Bearer ${SUPABASE_KEY}`,
      "Content-Type":"application/json",
      Prefer:"return=minimal"
    },
    body:JSON.stringify({entry_id:currentEntryId,text,url:location.href})
  });
  closeReportPopup();
  alert("Danke für den Hinweis");
}

/* ================= NAV ================= */
document.addEventListener("click", e => {
  const c = e.target.closest(".entry-card");
  if (!c) return;
  history.pushState(null,"","?id="+c.dataset.id);
  loadEntry(c.dataset.id);
});

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  initSearch();
  const id = new URLSearchParams(location.search).get("id");
  if (id) loadEntry(id);
});
