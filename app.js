/* =====================================================
   MarketShield – app.js (FINAL / STABIL / VOLLSTÄNDIG)
===================================================== */

let currentEntryId = null;

/* ================= SUPABASE ================= */
const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
const SUPABASE_KEY = "sb_publishable_FBywhrypx6zt_0nMlFudyQ_zFiqZKTD";

async function supa(query, options = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
    method: options.method || "GET",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  if (!r.ok) throw new Error(await r.text());
  return r.status === 204 ? null : r.json();
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
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/* =====================================================
   TABELLEN-RENDER (ZWINGEND / ROBUST)
===================================================== */
function renderSummaryWithTables(text) {
  if (!text) return "";
  const lines = normalizeText(text).split("\n");
  let html = "";
  let i = 0;

  while (i < lines.length) {
    if (
      lines[i].includes("|") &&
      lines[i + 1] &&
      /^[-\s|]+$/.test(lines[i + 1])
    ) {
      const headers = lines[i].split("|").map(c => c.trim()).filter(Boolean);
      html += `<table style="border-collapse:collapse;width:100%;margin:12px 0;">`;
      html += `<thead><tr>` + headers.map(h =>
        `<th style="border:1px solid #ccc;padding:6px;text-align:left;">${escapeHtml(h)}</th>`
      ).join("") + `</tr></thead><tbody>`;
      i += 2;
      while (i < lines.length && lines[i].includes("|")) {
        const cells = lines[i].split("|").map(c => c.trim()).filter(Boolean);
        html += `<tr>` + cells.map(c =>
          `<td style="border:1px solid #ccc;padding:6px;">${escapeHtml(c)}</td>`
        ).join("") + `</tr>`;
        i++;
      }
      html += `</tbody></table>`;
      continue;
    }

    if (lines[i].trim()) {
      html += `<div style="white-space:pre-wrap;margin:6px 0;">${escapeHtml(lines[i])}</div>`;
    } else {
      html += `<div style="height:8px;"></div>`;
    }
    i++;
  }
  return html;
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
  let color = "#2e7d32";
  if (n >= 7) color = "#f9a825";
  if (n >= 9) color = "#c62828";
  return `
    <div style="width:80px;height:8px;background:#e0e0e0;border-radius:6px;">
      <div style="width:${w}px;height:8px;background:${color};border-radius:6px;"></div>
    </div>`;
}

function renderScoreBlock(score, processing) {
  const h = renderHealth(score);
  const i = renderIndustry(processing);
  if (!h && !i) return "";
  return `
    <div style="margin:12px 0;display:flex;flex-direction:column;gap:6px;">
      ${h ? `<div style="display:flex;gap:10px;align-items:center;">
        <div style="min-width:90px;font-size:15px;">${h}</div>
        <div>Gesundheitsscore</div>
      </div>` : ""}
      ${i ? `<div style="display:flex;gap:10px;align-items:center;">
        <div style="min-width:90px;">${i}</div>
        <div>Industrie-Verarbeitungsgrad</div>
      </div>` : ""}
    </div>`;
}

/* ================= LISTE ================= */
function renderList(data) {
  $("results").innerHTML = (data || []).map(e => `
    <div class="entry-card" data-id="${e.id}">
      <div style="font-size:20px;font-weight:800;">${escapeHtml(e.title)}</div>
      ${renderScoreBlock(e.score, e.processing_score)}
      <div style="font-size:15px;">
        ${escapeHtml(normalizeText(e.summary).slice(0,160))} …
      </div>
    </div>
  `).join("");
}

/* ================= DETAIL ================= */
async function loadEntry(id) {
  const d = await supa(`entries?select=*&id=eq.${id}`);
  const e = d[0];
  if (!e) return;
  currentEntryId = id;

  $("results").innerHTML = `
    <h2>${escapeHtml(e.title)}</h2>
    ${renderScoreBlock(e.score, e.processing_score)}
    <div style="font-size:16px;line-height:1.7;">
      ${renderSummaryWithTables(e.summary)}
    </div>
    <div id="entryActions"></div>
  `;
  renderEntryActions(e.title);
}

/* ================= ACTIONS ================= */
function renderEntryActions(title) {
  const url = location.href;
  $("entryActions").innerHTML = `
    <div style="margin-top:24px;display:flex;gap:8px;flex-wrap:wrap;">
      <button onclick="goHome()">⬅️ Startseite</button>
      <button onclick="share('tg')">📨 Telegram</button>
      <button onclick="share('wa')">💬 WhatsApp</button>
      <button onclick="share('x')">✖️ X</button>
      <button onclick="share('fb')">📘 Facebook</button>
      <button onclick="sendReport()">🚨 Melden</button>
    </div>`;
}

function goHome() {
  history.pushState(null, "", location.pathname);
  location.reload();
}

function share(t) {
  const u = encodeURIComponent(location.href);
  const tlt = encodeURIComponent(document.title);
  const map = {
    tg: `https://t.me/share/url?url=${u}&text=${tlt}`,
    wa: `https://wa.me/?text=${tlt}%20${u}`,
    x: `https://x.com/intent/tweet?text=${tlt}&url=${u}`,
    fb: `https://www.facebook.com/sharer/sharer.php?u=${u}`
  };
  window.open(map[t], "_blank");
}

/* ================= REPORT ================= */
async function sendReport() {
  if (!currentEntryId) return;
  await supa("reports", {
    method: "POST",
    body: { entry_id: currentEntryId, created_at: new Date().toISOString() }
  });
  alert("Report gespeichert. Danke!");
}

/* ================= SUCHE ================= */
const search = $("searchInput");
if (search) {
  search.addEventListener("input", async () => {
    const q = search.value.trim();
    if (q.length < 2) return;
    await supa("search_queue", {
      method: "POST",
      body: { query: q, created_at: new Date().toISOString() }
    });
    const data = await supa(
      `entries?select=id,title,summary,score,processing_score&or=(title.ilike.%25${q}%25,summary.ilike.%25${q}%25)`
    );
    renderList(data);
  });
}

/* ================= NAV ================= */
document.addEventListener("click", (e) => {
  const c = e.target.closest(".entry-card");
  if (!c) return;
  history.pushState(null, "", "?id=" + c.dataset.id);
  loadEntry(c.dataset.id);
});

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  const id = new URLSearchParams(location.search).get("id");
  if (id) loadEntry(id);
});
