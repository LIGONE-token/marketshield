/* =====================================================
   MarketShield – app.js (STABIL / TABELLEN + MOBILE + TOOLTIP)
===================================================== */

let currentEntryId = null;

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  injectTableStyles();
  initTooltips();

  loadCategories();

  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  if (id) loadEntry(id);

  initReport();
  initBackHome();
});

/* ================= GLOBAL CLICK ================= */
document.addEventListener("click", (e) => {
  const card = e.target.closest(".entry-card");
  if (!card) return;

  const id = card.dataset.id;
  history.pushState(null, "", "?id=" + id);
  loadEntry(id);
});

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
  return r.json();
}

/* ================= HELPERS ================= */
async function saveSearchQuery(query) {
  if (!query || query.length < 2) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/search_queue`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query: query.trim() })
    });
  } catch {}
}

function escapeHtml(s = "") {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function normalizeText(text) {
  if (!text) return "";
  return String(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function stripOaiCiteArtifacts(text) {
  if (!text) return "";
  return String(text)
    .replace(/:contentReference\[[^\]]*\]\{[^}]*\}/g, "")
    .replace(/\[oaicite:\d+\]/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function shortText(text, max = 160) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max) + " …" : text;
}

/* ================= TOOLTIP (GLOBAL, NICHT INTRUSIV) ================= */
function initTooltips() {
  if (document.getElementById("msTooltip")) return;

  const tip = document.createElement("div");
  tip.id = "msTooltip";
  tip.style.cssText = `
    position: fixed; z-index: 99999; max-width: 360px;
    padding: 8px 10px; border-radius: 8px;
    background: rgba(20,20,20,.95); color:#fff;
    font-size:13px; line-height:1.35;
    pointer-events:none; opacity:0;
    transform: translateY(6px);
    transition: opacity .12s ease, transform .12s ease;
    box-shadow: 0 10px 26px rgba(0,0,0,.25);
  `;
  document.body.appendChild(tip);

  const show = (text, x, y) => {
    tip.textContent = text;
    const pad = 14;
    tip.style.left = Math.min(window.innerWidth - 20, x + pad) + "px";
    tip.style.top  = Math.min(window.innerHeight - 20, y + pad) + "px";
    tip.style.opacity = "1";
    tip.style.transform = "translateY(0)";
  };

  const hide = () => {
    tip.style.opacity = "0";
    tip.style.transform = "translateY(6px)";
  };

  document.addEventListener("mousemove", (e) => {
    const el = e.target.closest("[data-tooltip],[title]");
    if (!el) return hide();
    const text = el.getAttribute("data-tooltip") || el.getAttribute("title");
    if (!text || !text.trim()) return hide();
    show(text.trim(), e.clientX, e.clientY);
  }, { passive:true });

  document.addEventListener("mouseleave", hide, { passive:true });
  document.addEventListener("scroll", hide, { passive:true });
}

/* ================= TABELLEN STYLES (PC + MOBILE) ================= */
function injectTableStyles() {
  if (document.getElementById("msTableStyles")) return;

  const style = document.createElement("style");
  style.id = "msTableStyles";
  style.textContent = `
    .ms-table { margin:12px 0; border:1px solid #ddd; border-radius:10px; overflow:hidden; }
    .ms-row { display:grid; }
    .ms-row > div { padding:8px 10px; border-top:1px solid #eee; word-break:break-word; }
    .ms-head { font-weight:800; background:#f6f6f6; }
    .ms-head > div { border-top:none; }

    /* MOBILE: horizontal scroll statt Umbruch */
    @media (max-width: 720px) {
      .ms-table { overflow-x:auto; -webkit-overflow-scrolling: touch; }
      .ms-row { min-width: 600px; }
    }
  `;
  document.head.appendChild(style);
}

/* ================= TABELLEN-RENDER ================= */
function renderMarkdownTables(text) {
  if (!text) return "";

  const lines = normalizeText(text).split("\n");
  let html = "";
  let inTable = false;
  let colCount = 0;

  const isSeparator = s =>
    /^(\|?\s*:?-{3,}:?\s*)+(\|?\s*)$/.test((s || "").trim());

  const splitRow = row =>
    row.split("|").map(s => s.trim()).filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    const raw = stripOaiCiteArtifacts(lines[i]);
    const line = raw.trim();

    if (!inTable && line.includes("|") && isSeparator(lines[i + 1])) {
      inTable = true;
      const headers = splitRow(line);
      colCount = Math.max(1, headers.length);

      html += `<div class="ms-table">`;
      html += `<div class="ms-row ms-head" style="grid-template-columns:repeat(${colCount},1fr)">`;
      headers.forEach(h => html += `<div>${escapeHtml(h)}</div>`);
      html += `</div>`;
      i++;
      continue;
    }

    if (inTable) {
      if (line.includes("|")) {
        const cells = splitRow(line);
        const cols = Math.max(colCount, cells.length || colCount);
        html += `<div class="ms-row" style="grid-template-columns:repeat(${cols},1fr)">`;
        cells.forEach(c => html += `<div>${escapeHtml(c)}</div>`);
        html += `</div>`;
        continue;
      } else {
        html += `</div>`;
        inTable = false;
      }
    }

    if (raw === "") html += `<div style="height:8px;"></div>`;
    else html += `<div>${escapeHtml(raw)}</div>`;
  }

  if (inTable) html += `</div>`;
  return html;
}

/* ================= TEXT BLOCK ================= */
function renderTextBlock(title, text) {
  if (!text) return "";
  return `
    <h3>${escapeHtml(title)}</h3>
    <div style="line-height:1.6;">
      ${renderMarkdownTables(text)}
    </div>
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
  const w = Math.round((n / 10) * 80);
  return `
    <div style="width:80px;height:8px;background:#e0e0e0;border-radius:6px;overflow:hidden;">
      <div style="width:${w}px;height:8px;background:#2e7d32;"></div>
    </div>
  `;
}

function renderScoreBlock(score, processing, size = 13) {
  const h = renderHealth(score);
  const i = renderIndustry(processing);

  if (!h && !i) return "";

  // feste Spaltenbreite für saubere Kante
  const colW = 90;
  const colGap = 8;
  const rowGap = 6;
  const labelStyle = `font-size:${size}px;opacity:0.85;line-height:1.2;`;

  return `
    <div style="margin:12px 0;">
      ${h ? `
        <div style="
          display:grid;
          grid-template-columns:${colW}px 1fr;
          column-gap:${colGap}px;
          align-items:center;
          margin-bottom:${i ? rowGap : 0}px;
        ">
          <div style="white-space:nowrap;">${h}</div>
          <div style="${labelStyle}">Gesundheitsscore</div>
        </div>
      ` : ""}

      ${i ? `
        <div style="
          display:grid;
          grid-template-columns:${colW}px 1fr;
          column-gap:${colGap}px;
          align-items:center;
        ">
          <div>${i}</div>
          <div style="${labelStyle}">Industrie-Verarbeitungsgrad</div>
        </div>
      ` : ""}
    </div>
  `;
}


/* ================= KATEGORIEN ================= */
async function loadCategories() {
  const grid = document.querySelector(".category-grid");
  if (!grid) return;

  const data = await fetch("categories.json").then(r => r.json());
  grid.innerHTML = "";

  data.categories.forEach(c => {
    const b = document.createElement("button");
    b.textContent = c.title;
    b.onclick = () => loadCategory(c.title);
    grid.appendChild(b);
  });
}

/* ================= SUCHE ================= */
const input = document.getElementById("searchInput");
const results = document.getElementById("results");

if (input) {
  input.addEventListener("input", async () => {
    const q = input.value.trim();
    if (q.length < 2) { results.innerHTML = ""; return; }
    const enc = encodeURIComponent(q);
    const data = await supa(
      `entries?select=id,title,summary,score,processing_score&or=(title.ilike.%25${enc}%25,summary.ilike.%25${enc}%25)`
    );
    renderList(data);
  });

  input.addEventListener("keydown", async (e) => {
    if (e.key !== "Enter") return;
    const q = input.value.trim();
    if (q.length < 2) return;
    saveSearchQuery(q);
    const enc = encodeURIComponent(q);
    const data = await supa(
      `entries?select=id,title,summary,score,processing_score&or=(title.ilike.%25${enc}%25,summary.ilike.%25${enc}%25)`
    );
    renderList(data);
  });
}

async function loadCategory(cat) {
  const data = await supa(
    `entries?select=id,title,summary,score,processing_score&category=eq.${encodeURIComponent(cat)}`
  );
  renderList(data);
}

function renderList(data) {
  results.innerHTML = data.map(e => `
    <div class="entry-card" data-id="${e.id}">
      <div style="font-size:20px;font-weight:800;">${escapeHtml(e.title)}</div>
      ${renderScoreBlock(e.score, e.processing_score, 13)}
      <div style="font-size:15px;line-height:1.4;">
        ${escapeHtml(shortText(e.summary, 160))}
      </div>
    </div>
  `).join("");
}

/* ================= DETAIL ================= */
async function loadEntry(id) {
  const data = await supa(`entries?select=*&id=eq.${id}`);
  const e = data[0];
  if (!e) return;

  currentEntryId = id;

  results.innerHTML = `
    <h2>${escapeHtml(e.title)}</h2>
    ${renderScoreBlock(e.score, e.processing_score, 14)}
    ${renderTextBlock("Zusammenfassung", e.summary)}
    ${renderTextBlock("Wirkmechanismus", e.mechanism)}
    ${renderTextBlock("Wissenschaftlicher Hinweis", e.scientific_note)}
    <div id="entryActions"></div>
  `;

  renderEntryActions(e.title);
  updateBackHome();
}

/* ================= SHARE / ACTIONS ================= */
function renderEntryActions(title) {
  const box = document.getElementById("entryActions");
  if (!box) return;

  const url = location.href;
  const encUrl = encodeURIComponent(url);
  const encTitle = encodeURIComponent(title + " – MarketShield");

  box.innerHTML = `
    <div style="margin-top:32px;border-top:1px solid #ddd;padding-top:16px;display:flex;gap:8px;flex-wrap:wrap;">
      <button onclick="navigator.clipboard.writeText('${url}')">🔗 Kopieren</button>
      <button onclick="window.print()">🖨️ Drucken</button>
      <button onclick="window.open('https://wa.me/?text=${encTitle}%20${encUrl}','_blank')">WhatsApp</button>
      <button onclick="window.open('https://t.me/share/url?url=${encUrl}&text=${encTitle}','_blank')">Telegram</button>
      <button onclick="window.open('https://twitter.com/intent/tweet?url=${encUrl}&text=${encTitle}','_blank')">X</button>
      <button onclick="window.open('https://www.facebook.com/sharer/sharer.php?u=${encUrl}','_blank')">Facebook</button>
    </div>
  `;
}

/* ================= REPORT ================= */
function initReport() {
  const btn = document.getElementById("reportBtn");
  const modal = document.getElementById("reportModal");
  const close = document.getElementById("closeReportModal");
  const form = document.getElementById("reportForm");

  if (!btn || !modal || !form) return;

  btn.onclick = () => modal.classList.add("active");
  close.onclick = () => modal.classList.remove("active");

  form.onsubmit = async (e) => {
    e.preventDefault();
    const description = form.description.value.trim();
    if (!description) return alert("Bitte Beschreibung eingeben.");

    await fetch(`${SUPABASE_URL}/rest/v1/reports`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        description,
        source: "community",
        status: "new",
        entry_id: currentEntryId || null
      })
    });

    form.reset();
    modal.classList.remove("active");
    alert("Meldung gesendet. Danke!");
  };
}

/* ================= BACK HOME ================= */
function initBackHome() {
  const back = document.getElementById("backHome");
  if (!back) return;

  back.onclick = () => {
    history.pushState(null, "", location.pathname);
    results.innerHTML = "";
    updateBackHome();
  };

  window.addEventListener("popstate", updateBackHome);
}

function updateBackHome() {
  const back = document.getElementById("backHome");
  if (!back) return;
  back.style.display = location.search.includes("id=") ? "block" : "none";
}
