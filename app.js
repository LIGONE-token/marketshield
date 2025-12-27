/* =====================================================
   MarketShield – app.js
   FINAL / FUNKTIONIERT / KEIN CHAOS
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
      ...(opts.method && opts.method !== "GET"
        ? { "Content-Type": "application/json", Prefer: "return=minimal" }
        : {})
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined
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

/* ================= TABELLEN ================= */
function renderSummaryWithTables(text) {
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
        `<th style="border:1px solid #ccc;padding:6px;">${escapeHtml(h)}</th>`
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
    <div style="margin:12px 0;font-size:14px;">
      ${h ? `<div style="display:flex;gap:8px;"><div style="min-width:70px;">${h}</div><div>Gesundheit</div></div>` : ""}
      ${i ? `<div style="display:flex;gap:8px;"><div style="min-width:70px;">${i}</div><div>Industrie</div></div>` : ""}
    </div>`;
}

/* ================= HINWEIS ================= */
function renderTruthLink() {
  return `
    <div style="font-size:11px;opacity:.6;cursor:pointer;text-decoration:underline;margin:4px 0;"
         onclick="openTruthPopup()">
      Hinweis zur Darstellung
    </div>`;
}

function openTruthPopup() {
  if (document.getElementById("truthPopup")) return;
  const overlay = document.createElement("div");
  overlay.id = "truthPopup";
  overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;";
  overlay.addEventListener("click", e => {
    if (e.target === overlay) overlay.remove();
  });
  overlay.innerHTML = `
    <div style="background:#fff;margin:10% auto;padding:18px;max-width:420px;border-radius:6px;">
      Die WAHRHEIT ist bekannt, darf aber aus rechtlichen Gründen
      nicht vollständig gezeigt werden.
    </div>`;
  document.body.appendChild(overlay);
}

/* ================= LISTE ================= */
function renderList(data) {
  $("results").innerHTML = data.map(e => `
    <div class="entry-card" data-id="${e.id}" style="cursor:pointer;margin-bottom:16px;">
      <div style="font-size:18px;font-weight:700;">${escapeHtml(e.title)}</div>
      ${renderScoreBlock(e.score, e.processing_score)}
      <div>${escapeHtml(normalizeText(e.summary).slice(0,140))} …</div>
    </div>
  `).join("");
}

/* ================= DETAIL ================= */
async function loadEntry(id) {
  const d = await supa(`entries?select=*&id=eq.${id}`);
  const e = d[0];
  currentEntryId = id;

  $("results").innerHTML = `
    <h2>${escapeHtml(e.title)}</h2>
    ${renderTruthLink()}
    ${renderScoreBlock(e.score, e.processing_score)}
    <div style="font-size:16px;line-height:1.7;">
      ${renderSummaryWithTables(e.summary)}
    </div>
    <div id="entryActions"></div>
  `;
  renderEntryActions();
}

/* ================= ACTIONS ================= */
function renderEntryActions() {
  const box = document.getElementById("entryActions");
  if (!box) return;
  const url = location.href;
  box.innerHTML = `
    <div style="margin-top:20px;display:flex;gap:8px;">
      <button onclick="navigator.clipboard.writeText('${url}')">🔗 Kopieren</button>
      <button onclick="window.print()">🖨️ Drucken</button>
      <button onclick="sendReport()">🚨 Report</button>
    </div>`;
}

async function sendReport() {
  if (!currentEntryId) {
    alert("Kein Eintrag ausgewählt.");
    return;
  }
  try {
    await supa("reports", { method: "POST", body: { entry_id: currentEntryId } });
    alert("Report gespeichert.");
  } catch (e) {
    alert("Report fehlgeschlagen.");
  }
}

/* ================= SUCHE ================= */
document.addEventListener("DOMContentLoaded", () => {
  const input = $("searchInput");
  if (!input) return;
  input.addEventListener("input", async () => {
    const q = input.value.trim();
    if (q.length < 2) return;
    const data = await supa(
      `entries?select=id,title,summary,score,processing_score&or=(title.ilike.%25${encodeURIComponent(q)}%25,summary.ilike.%25${encodeURIComponent(q)}%25)`
    );
    renderList(data);
  });
});

/* ================= NAV ================= */
document.addEventListener("click", (e) => {
  const card = e.target.closest(".entry-card");
  if (!card) return;
  history.pushState(null, "", "?id=" + card.dataset.id);
  loadEntry(card.dataset.id);
});

window.addEventListener("popstate", () => {
  const id = new URLSearchParams(location.search).get("id");
  if (id) loadEntry(id);
  else loadInitial();
});

/* ================= INIT ================= */
async function loadInitial() {
  const data = await supa("entries?select=id,title,summary,score,processing_score&limit=50");
  renderList(data);
}

document.addEventListener("DOMContentLoaded", () => {
  const id = new URLSearchParams(location.search).get("id");
  if (id) loadEntry(id);
  else loadInitial();
});
