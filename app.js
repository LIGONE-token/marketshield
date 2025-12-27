/* =====================================================
   MarketShield – app.js (FINAL / STABIL / TABELLEN-SICHER)
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
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

/* =====================================================
   TABELLEN-RENDER (ZWINGEND / ROBUST / SUPABASE-SICHER)
   - erkennt Tabellen überall im Text
   - beliebig viele Tabellen
   - Text davor/danach bleibt erhalten
===================================================== */
function renderSummaryWithTables(text) {
  if (!text) return "";

  const lines = normalizeText(text).split("\n");
  let html = "";
  let i = 0;

  while (i < lines.length) {
    // Tabellenkopf erkannt?
    if (
      lines[i].includes("|") &&
      lines[i + 1] &&
      /^[-\s|]+$/.test(lines[i + 1])
    ) {
      const headers = lines[i]
        .split("|")
        .map(c => c.trim())
        .filter(Boolean);

      html += `<table style="border-collapse:collapse;width:100%;margin:12px 0;">`;
      html += `<thead><tr>` +
        headers.map(h =>
          `<th style="border:1px solid #ccc;padding:6px;text-align:left;">${escapeHtml(h)}</th>`
        ).join("") +
        `</tr></thead><tbody>`;

      i += 2; // Header + Trenner überspringen

      // Tabellenzeilen
      while (i < lines.length && lines[i].includes("|")) {
        const cells = lines[i]
          .split("|")
          .map(c => c.trim())
          .filter(Boolean);

        html += `<tr>` +
          cells.map(c =>
            `<td style="border:1px solid #ccc;padding:6px;">${escapeHtml(c)}</td>`
          ).join("") +
          `</tr>`;
        i++;
      }

      html += `</tbody></table>`;
      continue;
    }

    // Normaler Text (Absätze erhalten)
    if (lines[i].trim() === "") {
      html += `<div style="height:8px;"></div>`;
    } else {
      html += `<div style="white-space:pre-wrap;margin:6px 0;">${escapeHtml(lines[i])}</div>`;
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

  const w = Math.max(0, Math.min(80, Math.round((n / 10) * 80)));

  let color = "#2e7d32";
  if (n >= 7) color = "#f9a825";
  if (n >= 9) color = "#c62828";

  return `
    <div style="width:80px;min-width:80px;height:8px;background:#e0e0e0;border-radius:6px;overflow:hidden;">
      <div style="width:${w}px;height:8px;background:${color};border-radius:6px;"></div>
    </div>`;
}

/* ================= SCORE BLOCK (STABIL) ================= */
function renderScoreBlock(score, processing) {
  const h = renderHealth(score);
  const i = renderIndustry(processing);
  if (!h && !i) return "";

  return `
    <div style="margin:12px 0;display:flex;flex-direction:column;gap:6px;">
      ${h ? `
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:nowrap;">
          <div style="min-width:92px;white-space:nowrap;font-size:18px;line-height:1;">${h}</div>
          <div style="opacity:.85;white-space:nowrap;">Gesundheitsscore</div>
        </div>` : ""}

      ${i ? `
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:nowrap;">
          <div style="min-width:92px;">${i}</div>
          <div style="opacity:.85;white-space:nowrap;">Industrie-Verarbeitungsgrad</div>
        </div>` : ""}
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
      <div style="white-space:pre-wrap;font-size:15px;">
        ${escapeHtml(normalizeText(e.summary).slice(0,160))} …
      </div>
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
    <div style="font-size:16px;line-height:1.7;">
      ${renderSummaryWithTables(e.summary)}
    </div>
    <div id="entryActions"></div>
  `;

  renderEntryActions();
}

/* ================= ACTIONS ================= */
function renderEntryActions() {
  const box = $("entryActions");
  if (!box) return;

  box.innerHTML = `
    <div style="margin-top:24px;display:flex;gap:8px;flex-wrap:wrap;">
      <button onclick="location.href='?'">⬅️ Zur Startseite</button>
      <button onclick="navigator.clipboard.writeText(location.href)">🔗 Link kopieren</button>
      <button onclick="window.print()">🖨️ Drucken</button>
    </div>`;
}

/* ================= NAV ================= */
document.addEventListener("click", (e) => {
  const c = e.target.closest(".entry-card");
  if (!c) return;
  history.pushState(null, "", "?id=" + c.dataset.id);
  loadEntry(c.dataset.id);
});

/* ================= LEGAL ================= */
function renderLegalMiniLink() {
  return `<div style="font-size:11px;opacity:.6;cursor:pointer;text-decoration:underline;"
    onclick="event.stopPropagation();openLegalPopup()">Rechtlicher Hinweis</div>`;
}

function ensureLegalPopup() {
  if ($("legalPopup")) return;
  const d = document.createElement("div");
  d.id = "legalPopup";
  d.style.cssText = "display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;";
  d.innerHTML = `
    <div style="background:#fff;margin:10% auto;padding:16px;max-width:420px;">
      <b>Rechtlicher Hinweis</b><br><br>
      Die Darstellung dient der Information und ersetzt keine Beratung.
      <br><br>
      <button onclick="closeLegalPopup()">Schließen</button>
    </div>`;
  document.body.appendChild(d);
}
function openLegalPopup(){ensureLegalPopup();$("legalPopup").style.display="block";}
function closeLegalPopup(){$("legalPopup").style.display="none";}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  const id = new URLSearchParams(location.search).get("id");
  if (id) loadEntry(id);
});
