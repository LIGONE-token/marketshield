/* =====================================================
   MarketShield – app.js (FINAL / STABIL / CSP-SAFE)
   - Tabellen: echtes <table> (PC + Handy stabil)
   - Tooltip: CSS-only via data-tooltip + title (CSP-safe)
   - Social Buttons: da (ohne inline onclick)
   - Suche/Kategorien/Back/Report: drin
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
  return r.json();
}

/* ================= HELPERS ================= */
const $ = (id) => document.getElementById(id);

function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* Escaped \\n\\n -> echte Newlines */
function normalizeText(text) {
  if (!text) return "";
  return String(text)
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
}

function shortText(text, max = 160) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max) + " …" : text;
}

async function saveSearchQuery(query) {
  if (!query || query.trim().length < 2) return;
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

/* ================= STYLES (TABLE + TOOLTIP) ================= */
function injectGlobalStyles() {
  if (document.getElementById("msGlobalStyles")) return;

  const style = document.createElement("style");
  style.id = "msGlobalStyles";
  style.textContent = `
    /* Tooltip: CSP-safe (CSS-only), plus title fallback */
    [data-tooltip] { position: relative; cursor: help; }
    [data-tooltip]:focus { outline: none; }

    [data-tooltip]::after {
      content: attr(data-tooltip);
      position: absolute;
      left: 0;
      bottom: 125%;
      max-width: 360px;
      background: rgba(20,20,20,.95);
      color: #fff;
      padding: 8px 10px;
      border-radius: 8px;
      font-size: 13px;
      line-height: 1.35;
      white-space: normal;
      opacity: 0;
      pointer-events: none;
      transform: translateY(6px);
      transition: opacity .15s ease, transform .15s ease;
      z-index: 9999;
      box-shadow: 0 10px 26px rgba(0,0,0,.25);
    }

    [data-tooltip]:hover::after,
    [data-tooltip]:focus::after,
    [data-tooltip]:active::after {
      opacity: 1;
      transform: translateY(0);
    }

    /* Table wrapper */
    .ms-tablewrap { overflow-x: auto; -webkit-overflow-scrolling: touch; margin: 14px 0; }
    .ms-table {
      border-collapse: collapse;
      width: 100%;
      min-width: 640px;
      background: #fff;
    }
    .ms-table th, .ms-table td {
      border: 1px solid #ddd;
      padding: 8px 10px;
      vertical-align: top;
      text-align: left;
    }
    .ms-table th { background: #f5f5f5; font-weight: 800; }
  `;
  document.head.appendChild(style);
}

/* ================= MARKDOWN TABLE -> HTML TABLE ================= */
function renderMarkdownTables(text) {
  if (!text) return "";

  const lines = normalizeText(text).split("\n");
  let html = "";
  let i = 0;

  const isSeparator = (s) =>
    /^(\|?\s*:?-{3,}:?\s*)+(\|?\s*)$/.test((s || "").trim());

  const splitRow = (row) =>
    row.split("|").map(s => s.trim()).filter(Boolean);

  while (i < lines.length) {
    const line = lines[i].trim();

    // TABLE start: header + separator
    if (line.includes("|") && isSeparator(lines[i + 1])) {
      const headers = splitRow(lines[i]);
      const colCount = headers.length;

      html += `<div class="ms-tablewrap">`;
      html += `<table class="ms-table"><thead><tr>`;
      for (let c = 0; c < colCount; c++) {
        html += `<th>${escapeHtml(headers[c] || "")}</th>`;
      }
      html += `</tr></thead><tbody>`;

      i += 2; // skip header + separator

      while (i < lines.length && lines[i].includes("|")) {
        const cells = splitRow(lines[i]);
        html += `<tr>`;
        for (let c = 0; c < colCount; c++) {
          html += `<td>${escapeHtml(cells[c] || "")}</td>`;
        }
        html += `</tr>`;
        i++;
      }

      html += `</tbody></table></div>`;
      continue;
    }

    // normal text
    if (line === "") {
      html += `<div style="height:10px;"></div>`;
    } else {
      const raw = lines[i];
      const isWarning = raw.trim().toUpperCase().startsWith("NICHT DEKLARIERT");
      const tip = isWarning
        ? `title="Diese Bestandteile sind rechtlich nicht deklarationspflichtig, können aber technisch oder prozessbedingt vorhanden sein." data-tooltip="Diese Bestandteile sind rechtlich nicht deklarationspflichtig, können aber technisch oder prozessbedingt vorhanden sein." tabindex="0"`
        : "";
      html += `<p style="margin:8px 0;line-height:1.6;" ${tip}>${escapeHtml(raw)}</p>`;
    }
    i++;
  }

  return html;
}

function renderTextBlock(title, text) {
  if (!text) return "";
  return `
    <h3>${escapeHtml(title)}</h3>
    <div>${renderMarkdownTables(text)}</div>
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

function renderScoreBlock(score, processing) {
  const h = renderHealth(score);
  const i = renderIndustry(processing);
  if (!h && !i) return "";

  return `
    <div style="margin:12px 0;">
      ${h ? `
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="white-space:nowrap;">${h}</div>
          <span
            title="Gesamtbewertung der gesundheitlichen Wirkung"
            data-tooltip="Gesamtbewertung der gesundheitlichen Wirkung"
            tabindex="0"
            style="opacity:.7;"
          >Gesundheitsscore</span>
        </div>
      ` : ""}

      ${i ? `
        <div style="display:flex;align-items:center;gap:8px;margin-top:6px;">
          <div>${i}</div>
          <span
            title="Grad der industriellen Verarbeitung"
            data-tooltip="Grad der industriellen Verarbeitung"
            tabindex="0"
            style="opacity:.7;"
          >Industrie-Verarbeitungsgrad</span>
        </div>
      ` : ""}
    </div>
  `;
}

/* ================= LIST / DETAIL ================= */
function renderList(data) {
  const results = $("results");
  if (!results) return;

  results.innerHTML = (data || []).map(e => `
    <div class="entry-card" data-id="${e.id}">
      <div style="font-size:20px;font-weight:800;">${escapeHtml(e.title || "")}</div>
      ${renderScoreBlock(e.score, e.processing_score)}
      <div style="font-size:15px;line-height:1.4;">${escapeHtml(shortText(e.summary || "", 160))}</div>
    </div>
  `).join("");

  updateBackHome();
}

async function loadEntry(id) {
  const results = $("results");
  if (!results) return;

  const data = await supa(`entries?select=*&id=eq.${id}`);
  const e = data && data[0];
  if (!e) return;

  currentEntryId = id;

  results.innerHTML = `
    <h2>${escapeHtml(e.title || "")}</h2>

    ${renderScoreBlock(e.score, e.processing_score)}

    ${renderTextBlock("Zusammenfassung", e.summary)}
    ${renderTextBlock("Wirkmechanismus", e.mechanism)}
    ${renderTextBlock("Wissenschaftlicher Hinweis", e.scientific_note)}

    <div id="entryActions"></div>
  `;

  renderEntryActions(e.title || "");
  updateBackHome();
}

/* ================= SOCIAL BUTTONS (CSP-safe) ================= */
function renderEntryActions(title) {
  const box = $("entryActions");
  if (!box) return;

  const url = location.href;
  box.innerHTML = `
    <div style="margin-top:24px;border-top:1px solid #ddd;padding-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
      <button data-action="copy" title="Link kopieren" data-tooltip="Link kopieren" tabindex="0">🔗 Kopieren</button>
      <button data-action="print" title="Drucken" data-tooltip="Drucken" tabindex="0">🖨️ Drucken</button>
      <button data-action="share" data-net="telegram" title="Telegram teilen" data-tooltip="Telegram teilen" tabindex="0">Telegram</button>
      <button data-action="share" data-net="whatsapp" title="WhatsApp teilen" data-tooltip="WhatsApp teilen" tabindex="0">WhatsApp</button>
      <button data-action="share" data-net="x" title="X teilen" data-tooltip="X teilen" tabindex="0">X</button>
      <button data-action="share" data-net="facebook" title="Facebook teilen" data-tooltip="Facebook teilen" tabindex="0">Facebook</button>
    </div>
  `;

  // store title for share text
  box.dataset.shareTitle = title;
}

/* ================= CATEGORIES ================= */
async function loadCategories() {
  const grid = document.querySelector(".category-grid");
  if (!grid) return;

  let data;
  try {
    data = await fetch("categories.json").then(r => r.json());
  } catch {
    grid.innerHTML = "";
    return;
  }

  grid.innerHTML = (data.categories || []).map(c => `
    <button data-cat="${escapeHtml(c.title)}">${escapeHtml(c.title)}</button>
  `).join("");
}

async function loadCategory(cat) {
  const data = await supa(
    `entries?select=id,title,summary,score,processing_score&category=eq.${encodeURIComponent(cat)}`
  );
  renderList(data);
}

/* ================= SEARCH ================= */
function initSearch() {
  const input = $("searchInput");
  const results = $("results");
  if (!input || !results) return;

  input.addEventListener("input", async () => {
    const q = input.value.trim();
    if (q.length < 2) {
      results.innerHTML = "";
      updateBackHome();
      return;
    }
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

/* ================= REPORT ================= */
function initReport() {
  const btn = $("reportBtn");
  const modal = $("reportModal");
  const close = $("closeReportModal");
  const form = $("reportForm");

  if (!btn || !modal || !form) return;

  // tooltips on report button if present
  btn.setAttribute("title", btn.getAttribute("title") || "Meldung senden");
  btn.setAttribute("data-tooltip", btn.getAttribute("data-tooltip") || "Meldung senden");
  btn.setAttribute("tabindex", btn.getAttribute("tabindex") || "0");

  btn.addEventListener("click", () => modal.classList.add("active"));
  if (close) close.addEventListener("click", () => modal.classList.remove("active"));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const description = (form.description?.value || "").trim();
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
  });
}

/* ================= BACK HOME ================= */
function initBackHome() {
  const back = $("backHome");
  if (!back) return;

  back.setAttribute("title", back.getAttribute("title") || "Zurück zur Startseite");
  back.setAttribute("data-tooltip", back.getAttribute("data-tooltip") || "Zurück zur Startseite");
  back.setAttribute("tabindex", back.getAttribute("tabindex") || "0");

  back.addEventListener("click", () => {
    history.pushState(null, "", location.pathname);
    const results = $("results");
    if (results) results.innerHTML = "";
    updateBackHome();
  });

  window.addEventListener("popstate", () => {
    const params = new URLSearchParams(location.search);
    const id = params.get("id");
    if (id) loadEntry(id);
    else {
      const results = $("results");
      if (results) results.innerHTML = "";
    }
    updateBackHome();
  });
}

function updateBackHome() {
  const back = $("backHome");
  if (!back) return;
  back.style.display = location.search.includes("id=") ? "block" : "none";
}

/* ================= GLOBAL ACTION HANDLER (CSP-safe) ================= */
document.addEventListener("click", async (e) => {
  // Category buttons
  const catBtn = e.target.closest("[data-cat]");
  if (catBtn) {
    const cat = catBtn.getAttribute("data-cat");
    if (cat) loadCategory(cat);
    return;
  }

  // Entry card open
  const card = e.target.closest(".entry-card");
  if (card && card.dataset.id) {
    history.pushState(null, "", "?id=" + card.dataset.id);
    loadEntry(card.dataset.id);
    return;
  }

  // Social/action buttons
  const act = e.target.closest("[data-action]");
  if (!act) return;

  const action = act.getAttribute("data-action");
  const url = location.href;

  if (action === "copy") {
    try { await navigator.clipboard.writeText(url); } catch {}
    return;
  }

  if (action === "print") {
    window.print();
    return;
  }

  if (action === "share") {
    const net = act.getAttribute("data-net");
    const box = $("entryActions");
    const title = (box && box.dataset.shareTitle) ? box.dataset.shareTitle : "MarketShield";
    const encUrl = encodeURIComponent(url);
    const encTitle = encodeURIComponent(title + " – MarketShield");

    let shareUrl = "";
    if (net === "telegram") shareUrl = `https://t.me/share/url?url=${encUrl}&text=${encTitle}`;
    if (net === "whatsapp") shareUrl = `https://wa.me/?text=${encTitle}%20${encUrl}`;
    if (net === "x") shareUrl = `https://twitter.com/intent/tweet?url=${encUrl}&text=${encTitle}`;
    if (net === "facebook") shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encUrl}`;

    if (shareUrl) window.open(shareUrl, "_blank");
  }
});

/* ================= STARTUP ================= */
injectGlobalStyles();
initSearch();
