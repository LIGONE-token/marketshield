/* =====================================================
   MarketShield – app.js (FINAL / STABIL / LOCKED)
===================================================== */

let currentEntryId = null;

/* ================= SUPABASE ================= */
const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
const SUPABASE_KEY = "sb_publishable_FBywhrypx6zt_0nMlFudyQ_zFiqZKTD";

/* ================= FETCH ================= */
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

/* ========= TEXT NORMALIZATION (SINNWAHREND) ========= */
function normalizeText(text) {
  if (!text) return "";

  return String(text)
    .split(/\r?\n/)
    .map(l => l.trim())
    // 🔥 komplette KI-Artefakt-Zeilen entfernen
    .filter(l => !/contentReference|oaicite/i.test(l))
    .join("\n")
    .replace(/\\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/* ================= SCORES ================= */
function renderHealth(score) {
  const n = Number(score);
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n >= 80) return "💚💚💚";
  if (n >= 60) return "💚💚";
  if (n >= 40) return "💚";
  if (n >= 20) return "💛";
  return "❗⚠️❗";
}

function renderIndustry(score) {
  const n = Number(score);
  if (!Number.isFinite(n) || n <= 0) return "";
  const max = 90;
  const clamped = Math.min(10, Math.max(1, n));
  const width = Math.round((clamped / 10) * max);
  const hue = Math.round(120 - (clamped - 1) * 12);

  return `
    <div class="industry">
      <div class="industry-bar">
        <div style="width:${width}px;background:hsl(${hue},85%,45%)"></div>
      </div>
      <span>Industrie-Verarbeitungsgrad</span>
    </div>
  `;
}

function renderScoreBlock(score, processing) {
  const h = renderHealth(score);
  const i = renderIndustry(processing);
  if (!h && !i) return "";
  return `
    <div class="scoreblock">
      ${h ? `<div class="health"><span>${h}</span><small>Gesundheit</small></div>` : ""}
      ${i || ""}
    </div>
  `;
}

/* ================= START ================= */
function showStart() {
  currentEntryId = null;
  $("results").innerHTML = "";
}

/* ================= TABLE PARSER ================= */
function renderSummaryHtml(raw) {
  const text = normalizeText(raw);
  const blocks = text.split(/\n\s*\n/);

  return blocks.map(b => {
    const table = parseMdTable(b);
    if (table) return table;
    return `<p>${escapeHtml(b)}</p>`;
  }).join("");
}

function parseMdTable(block) {
  const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length < 2 || !lines[0].includes("|")) return null;
  if (!/^[-|:\s]+$/.test(lines[1])) return null;

  const row = (l) =>
    l.replace(/^\||\|$/g, "")
     .split("|")
     .map(c => `<td>${escapeHtml(c.trim())}</td>`)
     .join("");

  const head = lines[0].replace(/^\||\|$/g, "")
    .split("|")
    .map(c => `<th>${escapeHtml(c.trim())}</th>`)
    .join("");

  const body = lines.slice(2).map(l => `<tr>${row(l)}</tr>`).join("");

  return `
    <table class="ms-table">
      <thead><tr>${head}</tr></thead>
      <tbody>${body}</tbody>
    </table>
  `;
}

/* ================= LIST ================= */
function renderList(data) {
  $("results").innerHTML = data.map(e => `
    <div class="entry-card" data-id="${e.id}">
      <strong>${escapeHtml(e.title)}</strong>
      ${renderScoreBlock(e.score, e.processing_score)}
      <div>${escapeHtml(normalizeText(e.summary).slice(0,160))}…</div>
    </div>
  `).join("");
}

/* ================= DETAIL ================= */
async function loadEntry(id) {
  const e = (await supa(`entries?id=eq.${id}`))[0];
  if (!e) return;

  currentEntryId = id;

  $("results").innerHTML = `
    <h2>${escapeHtml(e.title)}</h2>
    ${renderScoreBlock(e.score, e.processing_score)}
    <div class="entry-text">${renderSummaryHtml(e.summary)}</div>

    <div class="actions">
      <button data-act="copy">🔗 Kopieren</button>
      <button data-act="print">🖨️ Drucken</button>
      <button data-act="telegram">Telegram</button>
      <button data-act="whatsapp">WhatsApp</button>
      <button data-act="x">X</button>
      <button data-act="facebook">Facebook</button>
    </div>
  `;
}

/* ================= GLOBAL CLICK ================= */
document.addEventListener("click", async (e) => {

  const card = e.target.closest(".entry-card");
  if (card) {
    history.pushState({}, "", "?id=" + card.dataset.id);
    loadEntry(card.dataset.id);
    return;
  }

  if (e.target.closest("#backHome")) {
    history.pushState({}, "", location.pathname);
    showStart();
    return;
  }

  /* ===== REPORT BUTTON (JETZT 100%) ===== */
  if (e.target.closest("#reportBtn")) {
    const m = $("reportModal");
    if (m) m.style.display = "block";
    return;
  }

  if (e.target.closest("#closeReportModal")) {
    const m = $("reportModal");
    if (m) m.style.display = "none";
    return;
  }

  /* ===== SOCIAL ===== */
  const act = e.target.closest("[data-act]")?.dataset.act;
  if (!act) return;

  const url = location.href;
  const title = document.querySelector("h2")?.textContent || "MarketShield";
  const encU = encodeURIComponent(url);
  const encT = encodeURIComponent(title);

  if (act === "copy") navigator.clipboard.writeText(url);
  if (act === "print") window.print();
  if (act === "telegram") window.open(`https://t.me/share/url?url=${encU}&text=${encT}`);
  if (act === "whatsapp") window.open(`https://wa.me/?text=${encT}%20${encU}`);
  if (act === "x") window.open(`https://twitter.com/intent/tweet?url=${encU}&text=${encT}`);
  if (act === "facebook") window.open(`https://www.facebook.com/sharer/sharer.php?u=${encU}`);
});

/* ================= REPORT SUBMIT ================= */
document.addEventListener("submit", async (e) => {
  const f = e.target.closest("#reportForm");
  if (!f) return;
  e.preventDefault();

  const txt = f.description.value.trim();
  if (txt.length < 3) return alert("Bitte Beschreibung eingeben.");

  await fetch(`${SUPABASE_URL}/rest/v1/reports`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      description: txt,
      entry_id: currentEntryId || null,
      created_at: new Date().toISOString()
    })
  });

  f.reset();
  $("reportModal").style.display = "none";
  alert("Danke! Meldung gespeichert.");
});

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  const id = new URLSearchParams(location.search).get("id");
  if (id) loadEntry(id);
  else showStart();
});
