/* =====================================================
   MarketShield – app.js (FINAL / ALLES KORRIGIERT)
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
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/* ================= TABELLEN (ROBUST) ================= */
function renderSummary(text) {
  const blocks = normalizeText(text).split(/\n\s*\n/);

  return blocks.map(block => {
    const lines = block.split("\n");
    const pipeLines = lines.filter(l => l.includes("|"));

    if (pipeLines.length >= 2) {
      const rows = pipeLines
        .filter(l => !/^[-\s|]+$/.test(l))
        .map(l => l.split("|").map(c => c.trim()).filter(Boolean));

      if (rows.length >= 2) {
        const head = rows.shift();
        return `
          <table class="ms-table">
            <thead>
              <tr>${head.map(h => `<th>${escapeHtml(h)}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${rows.map(r =>
                `<tr>${r.map(c => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`
              ).join("")}
            </tbody>
          </table>
        `;
      }
    }

    return `<div style="white-space:pre-wrap;line-height:1.6;margin:6px 0;">${escapeHtml(block)}</div>`;
  }).join("");
}

/* ================= SCORES ================= */
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
  let color = "#2e7d32";
  if (n >= 4) color = "#f9a825";
  if (n >= 7) color = "#c62828";

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

    <div style="margin-top:8px;font-size:12px;">
      <a href="#" id="legalLink">⚖️ Rechtlicher Hinweis</a>
      <div id="legalPopup" style="display:none;margin-top:6px;padding:8px;border:1px solid #ddd;border-radius:8px;background:#fafafa;">
        Die Inhalte dienen der Information und stellen keine Tatsachenbehauptung,
        Rechts- oder Gesundheitsberatung dar. Angaben können unvollständig oder
        fehlerhaft sein.
      </div>
    </div>
  `;

  $("legalLink").onclick = e => {
    e.preventDefault();
    const p = $("legalPopup");
    p.style.display = p.style.display === "none" ? "block" : "none";
  };
}

/* ================= NAV ================= */
document.addEventListener("click", e => {
  const c = e.target.closest(".entry-card");
  if (!c) return;
  history.pushState(null, "", "?id=" + c.dataset.id);
  loadEntry(c.dataset.id);
});

/* ================= BACK HOME ================= */
function initBackHome() {
  $("backHome").onclick = () => {
    history.pushState(null, "", location.pathname);
    currentEntryId = null;
    $("backHome").style.display = "none";
    $("results").innerHTML = "";
  };
}

/* ================= REPORT ================= */
function initReport() {
  $("reportBtn").onclick = () => $("reportModal").style.display = "flex";
  $("closeReportModal").onclick = () => $("reportModal").style.display = "none";

  $("reportForm").onsubmit = async e => {
    e.preventDefault();
    const text = e.target.description.value.trim();
    if (text.length < 5) return;

    await supaPost("reports", {
      entry_id: currentEntryId,
      description: text,
      created_at: new Date().toISOString()
    });

    e.target.reset();
    $("reportModal").style.display = "none";
  };
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  initBackHome();
  initReport();

  const id = new URLSearchParams(location.search).get("id");
  if (id) loadEntry(id);
});
