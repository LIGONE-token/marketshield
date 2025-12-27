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

/* ================= LEGAL MINI LINK (LOCKED) ================= */
function renderLegalMiniLink() {
  return `
    <div
      style="
        font-size:11px;
        opacity:0.6;
        margin:4px 0 8px;
        cursor:pointer;
        text-decoration:underline;
      "
      onclick="event.stopPropagation(); openLegalPopup();">
      Rechtlicher Hinweis
    </div>
  `;
}
function renderMarkdownTables(text) {
  const lines = text.split("\n");

  // einfache Erkennung: Header | --- | Zeile
  if (lines.length < 2 || !lines[0].includes("|") || !lines[1].includes("---")) {
    return escapeHtml(text);
  }

  const rows = lines
    .filter(l => l.includes("|"))
    .map(l => l.split("|").map(c => c.trim()).filter(Boolean));

  if (rows.length < 2) return escapeHtml(text);

  const header = rows.shift();
  const body = rows;

  return `
    <table style="border-collapse:collapse;margin:12px 0;width:100%;">
      <thead>
        <tr>
          ${header.map(h =>
            `<th style="border-bottom:2px solid #ccc;padding:6px 8px;text-align:left;">
              ${escapeHtml(h)}
            </th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${body.map(r => `
          <tr>
            ${r.map(c =>
              `<td style="border-bottom:1px solid #eee;padding:6px 8px;">
                ${escapeHtml(c)}
              </td>`).join("")}
          </tr>`).join("")}
      </tbody>
    </table>
  `;
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

  const maxWidth = 80;
  const w = Math.round((n / 10) * maxWidth);

  let color = "#2e7d32";       // grün
  if (n >= 5) color = "#f9a825"; // gelb
  if (n >= 8) color = "#c62828"; // rot

  return `
    <div style="width:${maxWidth}px;height:8px;background:#e0e0e0;border-radius:6px;">
      <div style="width:${w}px;height:8px;background:${color};border-radius:6px;"></div>
    </div>`;
}

/* ================= SCOREBLOCK (FIXED) ================= */
function renderScoreBlock(score, processing) {
  const h = renderHealth(score);
  const i = renderIndustry(processing);
  if (!h && !i) return "";

  return `
    <div style="margin:12px 0;">
      ${h ? `
        <div style="
          display:grid;
          grid-template-columns:90px 1fr;
          gap:8px;
          align-items:center;
          margin-bottom:${i ? 6 : 0}px;
        ">
          <div>${h}</div>
          <div style="font-size:13px;opacity:.85;">
            Gesundheitsscore
          </div>
        </div>
      ` : ""}

      ${i ? `
        <div style="
          display:grid;
          grid-template-columns:90px 1fr;
          gap:8px;
          align-items:center;
        ">
          <div>${i}</div>
          <div style="font-size:13px;opacity:.85;">
            Industrie-Verarbeitungsgrad
          </div>
        </div>
      ` : ""}
    </div>
  `;
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
    ${renderLegalMiniLink()}

    <div style="white-space:pre-wrap;line-height:1.6;">
      ${escapeHtml(normalizeText(e.summary))}
    </div>

    <div id="entryActions"></div>
  `;

  renderEntryActions(e.title);
  bindReportButton();
}

/* ================= SOCIAL (UNVERÄNDERT) ================= */
function renderEntryActions(title) {
  const box = $("entryActions");
  if (!box) return;

  const url = location.href;
  const encUrl = encodeURIComponent(url);
  const encTitle = encodeURIComponent(title + " – MarketShield");

  box.innerHTML = `
    <div style="margin-top:16px;border-top:1px solid #ddd;padding-top:16px;display:flex;gap:8px;flex-wrap:wrap;">
      <button onclick="navigator.clipboard.writeText('${url}')">🔗 Kopieren</button>
      <button onclick="window.print()">🖨️ Drucken</button>
      <button onclick="window.open('https://wa.me/?text=${encTitle}%20${encUrl}','_blank')">WhatsApp</button>
      <button onclick="window.open('https://t.me/share/url?url=${encUrl}&text=${encTitle}','_blank')">Telegram</button>
      <button onclick="window.open('https://twitter.com/intent/tweet?url=${encUrl}','_blank')">X</button>
      <button onclick="window.open('https://www.facebook.com/sharer/sharer.php?u=${encUrl}','_blank')">Facebook</button>
    </div>`;
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
        "Content-Type": "application/json"
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

    await saveSearchQuery(q);
    renderList(await smartSearch(q));
  });
}

/* ================= LEGAL POPUP ================= */
function ensureLegalPopup() {
  if (document.getElementById("legalPopup")) return;

  const d = document.createElement("div");
  d.id = "legalPopup";
  d.style.cssText = "display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;";
  d.innerHTML = `
    <div style="background:#fff;margin:10% auto;padding:16px;max-width:420px;">
      <b>Rechtlicher Hinweis</b><br><br>
      MarketShield kann rechtlich nicht alle Informationen vollständig darstellen.
      Inhalte dienen der sachlichen Einordnung und ersetzen keine Beratung.
      <br><br>
      <button onclick="closeLegalPopup()">Schließen</button>
    </div>`;
  document.body.appendChild(d);
}
function openLegalPopup(){ensureLegalPopup();$("legalPopup").style.display="block";}
function closeLegalPopup(){$("legalPopup").style.display="none";}

/* ================= REPORT (BESTEHENDER BUTTON) ================= */
function findReportButton() {
  return (
    document.getElementById("reportBtn") ||
    document.querySelector("[data-action='report']") ||
    document.querySelector(".report-btn")
  );
}

function bindReportButton() {
  const btn = findReportButton();
  if (!btn || btn.dataset.bound) return;
  btn.dataset.bound = "1";

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    openReportPopup();
  });
}

function ensureReportPopup() {
  if (document.getElementById("reportPopup")) return;

  const d = document.createElement("div");
  d.id = "reportPopup";
  d.style.cssText = "display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;";
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

  const r = await fetch(`${SUPABASE_URL}/rest/v1/reports`, {
    method:"POST",
    headers:{
      apikey:SUPABASE_KEY,
      Authorization:`Bearer ${SUPABASE_KEY}`,
      "Content-Type":"application/json"
    },
    body:JSON.stringify({ entry_id: currentEntryId, text, url: location.href })
  });

  if (!r.ok) {
    const err = await r.text();
    console.error("REPORT FAILED:", err);
    alert("Report konnte nicht gespeichert werden.");
    return;
  }

  closeReportPopup();
  alert("Danke für den Hinweis");
}

/* ================= NAV ================= */
document.addEventListener("click", (e) => {
  if (
    e.target.closest("#legalPopup") ||
    e.target.closest("#reportPopup") ||
    e.target.closest("#entryActions")
  ) return;

  const c = e.target.closest(".entry-card");
  if (!c) return;
  history.pushState(null, "", "?id=" + c.dataset.id);
  loadEntry(c.dataset.id);
});

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  initSearch();
  bindReportButton();

  const id = new URLSearchParams(location.search).get("id");
  if (id) loadEntry(id);
});
