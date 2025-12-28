/* =====================================================
   MarketShield – app.js (FINAL / STABIL / KORREKT)
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
      "Content-Type": "application/json"
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  const t = await r.text();
  if (!r.ok) throw new Error(t || r.statusText);
  return t ? JSON.parse(t) : [];
}

/* ================= HELPERS ================= */
const $ = (id) => document.getElementById(id);

function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ================= TEXT ================= */
function normalizeText(t = "") {
  return String(t)
    .replace(/:contentReference\[.*?\]\{.*?\}/g, "")
    .replace(/\\n/g, "\n")
    .replace(/\r\n|\r/g, "\n")
    .trim();
}

function renderInline(text = "") {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

/* ================= SCORES ================= */
function renderHealth(score) {
  const n = Number(score);
  if (!Number.isFinite(n) || n < 1 || n > 100) return "";
  if (n >= 80) return "💚💚💚";
  if (n >= 60) return "💚💚";
  if (n >= 40) return "💚";
  if (n >= 20) return "💛";
  return "⚠️❗⚠️";
}

function renderIndustry(score) {
  const n = Number(score);
  if (!Number.isFinite(n) || n < 1) return "";

  const clamped = Math.min(10, n);
  const w = Math.round((clamped / 10) * 80);
  const hue = Math.round(120 * (1 - clamped / 10)); // grün → rot
  const color = `hsl(${hue},90%,45%)`;

  return `
    <div style="width:80px;height:8px;background:#e0e0e0;border-radius:6px;overflow:hidden;">
      <div style="width:${w}px;height:8px;background:${color};border-radius:6px;"></div>
    </div>`;
}

function renderScoreBlock(score, processing, type = "", size = 13) {
  const h = renderHealth(score);

  const isTopic =
    String(type).toLowerCase() === "thema" ||
    String(type).toLowerCase() === "topic";

  const i = (!isTopic && Number(processing) >= 1)
    ? renderIndustry(processing)
    : "";

  if (!h && !i) return "";

  return `
    <div style="margin:12px 0;">
      ${h ? `
        <div style="display:grid;grid-template-columns:90px 1fr;gap:8px;align-items:center;margin-bottom:${i ? 6 : 0}px;">
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

/* ================= TABLE HELPERS ================= */
function isMdTableSeparator(line) {
  const s = line.trim();
  return s.includes("|") && /^[\s|:-]+$/.test(s) && s.replace(/[^-]/g, "").length >= 3;
}

function splitMdRow(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map(c => c.trim());
}

/* ================= RICH TEXT ================= */
function renderRichText(text) {
  const clean = normalizeText(text);
  if (!clean) return "";

  const blocks = clean.split(/\n\s*\n/);

  return blocks.map(blockRaw => {
    const block = blockRaw.trim();
    if (!block) return "";

    const lines = block.split("\n");

    if (/^##\s+/.test(block)) {
      return `<h3>${renderInline(block.replace(/^##\s+/, ""))}</h3>`;
    }

    if (lines.length >= 2 && lines[0].includes("|") && isMdTableSeparator(lines[1])) {
      const header = splitMdRow(lines[0]);
      const rows = [];

      for (let i = 2; i < lines.length; i++) {
        if (!lines[i].includes("|")) break;
        rows.push(splitMdRow(lines[i]));
      }

      const cols = header.length || (rows[0] ? rows[0].length : 0);
      const norm = (a) => {
        const r = (a || []).slice(0, cols);
        while (r.length < cols) r.push("");
        return r;
      };

      return `
        <div class="ms-table-wrap">
          <table class="ms-table">
            <thead>
              <tr>${norm(header).map(h => `<th>${renderInline(h)}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${rows.map(r =>
                `<tr>${norm(r).map(c => `<td>${renderInline(c)}</td>`).join("")}</tr>`
              ).join("")}
            </tbody>
          </table>
        </div>`;
    }

    return `<p>${lines.map(l => renderInline(l)).join("<br>")}</p>`;
  }).join("");
}

/* ================= LIST ================= */
function renderList(data) {
  $("results").innerHTML = (data || []).map(e => `
    <div class="entry-card" data-id="${e.id}">
      <div style="font-size:20px;font-weight:800;">${escapeHtml(e.title)}</div>
      ${renderScoreBlock(e.score, e.processing_score, e.type)}
      <div>${renderInline(e.summary?.slice(0,160) || "")} …</div>
    </div>
  `).join("");
}

/* ================= DETAIL ================= */
async function loadEntry(id) {
  const d = await supa(`entries?select=*&id=eq.${id}`);
  const e = d[0];
  if (!e) return;

  currentEntryId = e.id;

  $("results").innerHTML = `
    <h2>${escapeHtml(e.title)}</h2>
    <a href="#" id="legalMiniLink" style="font-size:12px;opacity:.7;">Rechtlicher Hinweis</a>
    ${renderScoreBlock(e.score, e.processing_score, e.type)}
    ${renderRichText(e.summary)}
  `;

  $("legalMiniLink").onclick = (ev) => {
    ev.preventDefault();
    alert("MarketShield dient ausschließlich der Information. Keine Beratung.");
  };
}

/* ================= SEARCH ================= */
async function smartSearch(q) {
  if (q.length < 2) return [];
  const enc = encodeURIComponent(q);
  return await supa(
    `entries?select=id,title,summary,score,processing_score,type&title=ilike.%25${enc}%25`
  );
}

function initSearch() {
  const i = $("searchInput");
  if (!i) return;
  i.oninput = async () => {
    const q = i.value.trim();
    if (q.length < 2) return $("results").innerHTML = "";
    renderList(await smartSearch(q));
  };
}

/* ================= NAV ================= */
document.addEventListener("click", e => {
  const card = e.target.closest(".entry-card");
  if (!card) return;
  history.pushState(null, "", "?id=" + card.dataset.id);
  loadEntry(card.dataset.id);
});

window.addEventListener("popstate", () => {
  const id = new URLSearchParams(location.search).get("id");
  if (id) loadEntry(id);
});

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  initSearch();
  const id = new URLSearchParams(location.search).get("id");
  if (id) loadEntry(id);
});
