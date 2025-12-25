/* =====================================================
   MarketShield – app.js (FINAL / STABIL)
===================================================== */

let currentEntryId = null;

/* ================= SUPABASE ================= */
const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
const SUPABASE_KEY = "sb_publishable_FBywhrypx6zt_0nMlFudyQ_zFiqZKTD";

async function supa(query) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  return r.json();
}

/* ================= HELPERS ================= */
const $ = (id) => document.getElementById(id);

function escapeHtml(s = "") {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

/* KI-ARTEFAKTE ENTFERNEN – ABSÄTZE BLEIBEN */
function cleanGeneratedArtifacts(text) {
  return String(text || "")
    .replace(/:contentReference\[[^\]]*]\{[^}]*}/g, "")
    .replace(/\[oaicite:\d+]/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function normalizeText(text) {
  return cleanGeneratedArtifacts(text)
    .replace(/\r\n/g,"\n")
    .replace(/\r/g,"\n");
}

function shortText(t, max = 160) {
  if (!t) return "";
  return t.length > max ? t.slice(0, max) + " …" : t;
}

/* ================= TEXT + TABELLEN ================= */
function renderMarkdownTables(text) {
  const lines = normalizeText(text).split("\n");
  let html = "";
  let i = 0;

  const isSep = s => /^(\|?\s*:?-{3,}:?\s*)+(\|?\s*)$/.test((s||"").trim());
  const splitRow = r => {
    let a = r.split("|").map(v=>v.trim());
    if (a[0]==="") a.shift();
    if (a[a.length-1]==="") a.pop();
    return a;
  };

  while (i < lines.length) {
    if (lines[i].includes("|") && isSep(lines[i+1])) {
      const head = splitRow(lines[i]);
      html += `<div style="overflow-x:auto;margin:12px 0">
        <table style="border-collapse:collapse;min-width:600px;width:100%">
        <thead><tr>${head.map(h=>`<th style="border:1px solid #ddd;padding:8px;background:#f5f5f5">${escapeHtml(h)}</th>`).join("")}</tr></thead><tbody>`;
      i += 2;
      while (lines[i] && lines[i].includes("|")) {
        const c = splitRow(lines[i]);
        html += `<tr>${head.map((_,k)=>`<td style="border:1px solid #ddd;padding:8px">${escapeHtml(c[k]||"")}</td>`).join("")}</tr>`;
        i++;
      }
      html += `</tbody></table></div>`;
      continue;
    }

    if (lines[i].trim()==="") {
      html += `<div style="height:12px"></div>`;
    } else {
      html += `<p style="line-height:1.6;margin:0">${escapeHtml(lines[i])}</p>`;
    }
    i++;
  }
  return html;
}

function renderTextBlock(title, text) {
  if (!text) return "";
  return `<h3>${escapeHtml(title)}</h3>${renderMarkdownTables(text)}`;
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
  return `<div style="width:80px;height:8px;background:#e0e0e0;border-radius:6px;overflow:hidden">
    <div style="width:${w}px;height:8px;background:#2e7d32"></div></div>`;
}

/* ================= SCORE BLOCK (EXAKT DEINE VERSION) ================= */
function renderScoreBlock(score, processing, size = 13) {
  const h = renderHealth(score);
  const i = renderIndustry(processing);
  if (!h && !i) return "";

  const colW = 90;
  const labelStyle = `font-size:${size}px;opacity:0.85;line-height:1.2;`;
  const rowGap = 6;
  const colGap = 8;

  return `
    <div style="margin:12px 0;">
      ${h ? `
        <div style="display:grid;grid-template-columns:${colW}px 1fr;column-gap:${colGap}px;align-items:center;margin-bottom:${i ? rowGap : 0}px;">
          <div style="white-space:nowrap;">${h}</div>
          <div style="${labelStyle}">Gesundheitsscore</div>
        </div>` : ""}

      ${i ? `
        <div style="display:grid;grid-template-columns:${colW}px 1fr;column-gap:${colGap}px;align-items:center;">
          <div>${i}</div>
          <div style="${labelStyle}">Industrie-Verarbeitungsgrad</div>
        </div>` : ""}
    </div>`;
}

/* ================= ECHTER CLICK-TOOLTIP (KLEIN) ================= */
function toggleLegalTooltip(btn) {
  let tip = document.getElementById("legalTooltip");
  if (tip) { tip.remove(); return; }

  tip = document.createElement("div");
  tip.id = "legalTooltip";
  tip.textContent =
    "MarketShield kann rechtlich keine vollständige oder absolute Wahrheit darstellen. Die Inhalte dienen der Einordnung, nicht der Tatsachenbehauptung.";

  tip.style.cssText = `
    position:absolute;
    z-index:9999;
    display:inline-block;
    max-width:220px;
    padding:6px 8px;
    background:#222;
    color:#fff;
    font-size:12px;
    line-height:1.3;
    border-radius:4px;
    box-shadow:0 4px 10px rgba(0,0,0,.25);
    white-space:normal;
  `;

  document.body.appendChild(tip);

  const r = btn.getBoundingClientRect();
  tip.style.top  = `${window.scrollY + r.bottom + 6}px`;
  tip.style.left = `${window.scrollX + r.left}px`;

  setTimeout(() => {
    document.addEventListener("click", function close(e) {
      if (!tip.contains(e.target) && e.target !== btn) {
        tip.remove();
        document.removeEventListener("click", close);
      }
    });
  }, 0);
}

/* ================= LIST / DETAIL ================= */
function renderList(data) {
  $("results").innerHTML = (data||[]).map(e=>`
    <div class="entry-card" data-id="${e.id}">
      <div style="font-size:20px;font-weight:800">${escapeHtml(e.title)}</div>
      ${renderScoreBlock(e.score, e.processing_score)}
      <div>${escapeHtml(shortText(cleanGeneratedArtifacts(e.summary)))}</div>
    </div>`).join("");
}

async function loadEntry(id) {
  const d = await supa(`entries?select=*&id=eq.${id}`);
  const e = d && d[0];
  if (!e) return;
  currentEntryId = id;

  $("results").innerHTML = `
    <h2>${escapeHtml(e.title)}</h2>
    ${renderScoreBlock(e.score, e.processing_score)}

    <button
      type="button"
      onclick="toggleLegalTooltip(this)"
      style="margin:6px 0 8px 0;padding:2px 6px;font-size:12px;border:1px solid #ccc;border-radius:4px;background:#f3f3f3;cursor:pointer">
      Rechtliche Info
    </button>

    ${renderTextBlock("Zusammenfassung", e.summary)}
    ${renderTextBlock("Wirkmechanismus", e.mechanism)}
    ${renderTextBlock("Wissenschaftlicher Hinweis", e.scientific_note)}
  `;
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  const p = new URLSearchParams(location.search);
  const id = p.get("id");
  if (id) loadEntry(id);
});
