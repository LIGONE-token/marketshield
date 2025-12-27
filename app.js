/* =====================================================
   MarketShield – app.js (STABIL / REPARIERT / JS-FIX)
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
    .replace(/:contentReference\[[^\]]*\]\{[^}]*\}/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

/* ================= TABELLEN (KORREKT) ================= */
function renderSummary(text) {
  const lines = normalizeText(text).split("\n");
  let html = "";
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    if (line.includes("|") && lines[i + 1] && /^[-\s|]+$/.test(lines[i + 1])) {
      const rows = [];
      rows.push(lines[i]);
      i += 2;

      while (i < lines.length && lines[i].includes("|")) {
        rows.push(lines[i]);
        i++;
      }

      const cells = rows.map(r =>
        r.split("|").map(c => c.trim()).filter(Boolean)
      );

      if (cells.length >= 2) {
        const head = cells.shift();
        html += `
          <table class="ms-table">
            <thead><tr>${head.map(h => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead>
            <tbody>
              ${cells.map(r =>
                `<tr>${r.map(c => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`
              ).join("")}
            </tbody>
          </table>`;
      }
      continue;
    }

    if (line) {
      html += `<div style="white-space:pre-wrap;line-height:1.6;">${escapeHtml(line)}</div>`;
    }
    i++;
  }
  return html;
}

/* ================= SCORES (UNVERÄNDERT) ================= */
function renderHealth(score) {
  const n = Number(score);
  if (!n) return "";
  if (n >= 80) return "💚💚💚";
  if (n >= 60) return "💚💚";
  if (n >= 40) return "💚";
  if (n >= 20) return "💛";
  return "⚠️❗⚠️";
}

function renderIndustry(score) {
  const n = Math.min(10, Math.max(0, Number(score)));
  if (!n) return "";
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
      ${h ? `<div style="display:grid;grid-template-columns:90px 1fr;"><div>${h}</div><div>Gesundheit</div></div>` : ""}
      ${i ? `<div style="display:grid;grid-template-columns:90px 1fr;"><div>${i}</div><div>Industrie</div></div>` : ""}
    </div>`;
}

/* ================= LISTE ================= */
function renderList(data) {
  $("results").innerHTML = (data || []).map(e => `
    <div class="entry-card" data-id="${e.id}">
      <strong>${escapeHtml(e.title)}</strong>
      ${renderScoreBlock(e.score, e.processing_score)}
    </div>
  `).join("");
}

/* ================= DETAIL ================= */
async function loadEntry(id) {
  const e = (await supa(`entries?select=*&id=eq.${id}`))[0];
  if (!e) return;

  currentEntryId = id;
  $("backHome").style.display = "block";

  $("results").innerHTML = `
    <h2>${escapeHtml(e.title)}</h2>
    ${renderScoreBlock(e.score, e.processing_score)}
    ${renderSummary(e.summary)}
  `;
}

/* ================= ZUR STARTSEITE (JETZT 100 %) ================= */
function goHome() {
  currentEntryId = null;
  history.pushState(null, "", location.pathname);
  $("results").innerHTML = "";
  $("backHome").style.display = "none";
}

/* ================= REPORT (JETZT STABIL) ================= */
function initReport() {
  const btn = $("reportBtn");
  const modal = $("reportModal");
  const close = $("closeReportModal");
  const form = $("reportForm");

  btn.onclick = () => modal.style.display = "flex";
  close.onclick = () => modal.style.display = "none";

  form.onsubmit = async (e) => {
    e.preventDefault();
    const text = form.description.value.trim();
    if (!text) return;

    await supaPost("reports", {
      entry_id: currentEntryId || null,
      description: text,
      created_at: new Date().toISOString()
    });

    form.reset();
    modal.style.display = "none";
  };
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  $("backHome").onclick = goHome;
  initReport();
});
