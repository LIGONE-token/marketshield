/* =====================================================
   MarketShield – app.js (STABIL / REPARIERT)
===================================================== */

let currentEntryId = null;

/* ================= SUPABASE ================= */
const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
const SUPABASE_KEY = "sb_publishable_JHb4LBhP26eI7BgDS1jIkw_4OYn3-F9";

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

/* Textbereinigung */
function normalizeText(text) {
  if (!text) return "";
  return String(text)
    .replace(/\*\*/g, "")
    .replace(/##+/g, "")
    .replace(/__+/g, "")
    .replace(/~~+/g, "")
    .replace(/`+/g, "")
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanId(id) {
  return String(id || "").trim();
}

/* ================= MARKDOWN TABLE ================= */
function renderMarkdownTable(text) {
  if (!text.includes("|") || !text.includes("---")) return text;

  const lines = text.trim().split("\n").filter(l => l.trim());
  if (lines.length < 3) return text;

  const header = lines[0].split("|").map(c => c.trim()).filter(Boolean);
  const rows = lines.slice(2).map(line =>
    line.split("|").map(c => c.trim()).filter(Boolean)
  );

  let html = `<table class="ms-table"><thead><tr>`;
  header.forEach(h => html += `<th>${escapeHtml(h)}</th>`);
  html += `</tr></thead><tbody>`;

  rows.forEach(r => {
    html += `<tr>`;
    r.forEach(c => html += `<td>${escapeHtml(c)}</td>`);
    html += `</tr>`;
  });

  html += `</tbody></table>`;
  return html;
}

function renderContent(text) {
  if (!text) return "";
  if (text.includes("|") && text.includes("---")) {
    return renderMarkdownTable(text);
  }
  return normalizeText(text)
    .split("\n\n")
    .map(p => `<p>${escapeHtml(p)}</p>`)
    .join("");
}

function shortText(t, max = 160) {
  t = normalizeText(t);
  return t.length > max ? t.slice(0, max) + " …" : t;
}

/* ================= USER HASH ================= */
function getUserHash() {
  let h = localStorage.getItem("ms_user_hash");
  if (!h) {
    h =
      (window.crypto && crypto.randomUUID)
        ? crypto.randomUUID()
        : "ms-" + Math.random().toString(36).slice(2) + Date.now();
    localStorage.setItem("ms_user_hash", h);
  }
  return h;
}

/* ================= SCORES ================= */
function renderHealth(score) {
  const n = Number(score);
  if (!Number.isFinite(n) || n === 0) return "";
  if (n >= 80) return "💚💚💚";
  if (n >= 60) return "💚💚";
  if (n >= 40) return "💚";
  if (n >= 20) return "💛";
  return "⚠️❗⚠️";
}

function renderIndustry(score) {
  const n = Number(score);
  if (!Number.isFinite(n) || n === 0) return "";

  const clamped = Math.min(Math.max(n, 0), 10);
  const w = Math.round((clamped / 10) * 80);

  let color = "#2e7d32";
  if (clamped >= 4 && clamped <= 6) color = "#f9a825";
  if (clamped >= 7) color = "#c62828";

  return `
    <div style="width:80px;height:8px;background:#e0e0e0;border-radius:6px;">
      <div style="width:${w}px;height:8px;background:${color};border-radius:6px;"></div>
    </div>
  `;
}

function renderScoreBlock(score, processing, size = 13) {
  const h = renderHealth(score);
  const i = renderIndustry(processing);
  if (!h && !i) return "";

  return `
    <div style="margin:12px 0;">
      ${h ? `
        <div style="display:grid;grid-template-columns:90px 1fr;gap:8px;align-items:center;">
          <div>${h}</div>
          <div style="font-size:${size}px;opacity:.85;">Gesundheitsscore</div>
        </div>` : ""}

      ${i ? `
        <div style="display:grid;grid-template-columns:90px 1fr;gap:8px;align-items:center;">
          <div>${i}</div>
          <div style="font-size:${size}px;opacity:.85;">Industrie-Verarbeitungsgrad</div>
        </div>` : ""}
    </div>`;
}

/* ================= USER RATING ================= */
function renderUserRating(avg, count) {
  const c = Number(count) || 0;
  const a = Number(avg);

  const full = Number.isFinite(a) ? Math.round(a) : 0;
  const empty = 5 - full;

  return `
    <div class="user-rating" data-rate style="cursor:pointer;">
      ${"⭐".repeat(full)}${"☆".repeat(empty)}
      <span style="font-size:13px;opacity:.7;">(${c} Bewertungen)</span>
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
      ${renderUserRating(e.rating_avg, e.rating_count)}
      ${renderScoreBlock(e.score, e.processing_score)}
      <div>${escapeHtml(shortText(e.summary))}</div>
    </div>
  `).join("");
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  console.log("MarketShield app.js – STABIL geladen");
});
