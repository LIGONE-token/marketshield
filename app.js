/* =====================================================
   MarketShield – app.js (STABIL / REPARIERT / FINAL)
   Fixes:
   ✅ "Zurück zur Startseite" funktioniert zuverlässig
   ✅ Report-Button funktioniert (POST nach Supabase-Tabelle "reports")
   ✅ Tabellen aus Markdown werden als echte <table> gerendert (ohne unsichere HTML-Freigabe)
===================================================== */

let currentEntryId = null;

/* ================= SUPABASE ================= */
const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
const SUPABASE_KEY = "sb_publishable_FBywhrypx6zt_0nMlFudyQ_zFiqZKTD";

async function supa(query, opts = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${query}`;
  const r = await fetch(url, {
    method: opts.method || "GET",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      ...(opts.headers || {})
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });

  const t = await r.text();
  if (!r.ok) throw new Error(t || r.statusText);
  return t ? JSON.parse(t) : [];
}

async function supaPost(table, body) {
  // erwartet: Supabase Tabelle "reports" existiert (Spalten siehe reportEntry())
  return await supa(`${table}`, {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body
  });
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

function shortText(t, max = 160) {
  t = normalizeText(t);
  return t.length > max ? t.slice(0, max) + " …" : t;
}

/* ================= SCORES (LOCKED) ================= */
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
  return `
    <div style="width:80px;height:8px;background:#e0e0e0;border-radius:6px;">
      <div style="width:${w}px;height:8px;background:#2e7d32;border-radius:6px;"></div>
    </div>`;
}

function renderScoreBlock(score, processing, size = 13) {
  const h = renderHealth(score);
  const i = renderIndustry(processing);
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

/* ================= TABELLEN-RENDERING (SICHER) =================
   - erkennt klassische Markdown-Tabellen (| ... | + Trennzeile ---)
   - rendert als echte <table>, ohne fremdes HTML zu erlauben
===================================================== */

function looksLikeMarkdownTable(lines) {
  if (lines.length < 2) return false;
  const header = lines[0];
  const sep = lines[1];

  const hasPipes = header.includes("|");
  const sepOk = /^[\s|\-:]+$/.test(sep) && sep.includes("-");
  return hasPipes && sepOk;
}

function splitRow(line) {
  // trimmt äußere | und splittet
  const cleaned = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return cleaned.split("|").map(c => c.trim());
}

function renderMarkdownTable(blockLines) {
  const headerCells = splitRow(blockLines[0]);
  const bodyLines = blockLines.slice(2);
  const rows = bodyLines
    .map(l => l.trim())
    .filter(Boolean)
    .map(splitRow);

  const thead = `
    <thead>
      <tr>${headerCells.map(c => `<th>${escapeHtml(c)}</th>`).join("")}</tr>
    </thead>`;

  const tbody = `
    <tbody>
      ${rows.map(r => `<tr>${r.map(c => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`).join("")}
    </tbody>`;

  return `<div class="ms-table-wrap"><table class="ms-table">${thead}${tbody}</table></div>`;
}

function ensureTableStyles() {
  if (document.getElementById("msTableStyles")) return;
  const s = document.createElement("style");
  s.id = "msTableStyles";
  s.textContent = `
    .ms-rich p { margin: 0 0 12px 0; }
    .ms-table-wrap { overflow-x:auto; margin: 10px 0 16px 0; }
    table.ms-table { width:100%; border-collapse: collapse; font-size: 14px; }
    table.ms-table th, table.ms-table td { border: 1px solid #ddd; padding: 8px; vertical-align: top; }
    table.ms-table th { font-weight: 800; }
  `;
  document.head.appendChild(s);
}

function renderRichText(text) {
  ensureTableStyles();

  const raw = normalizeText(text);
  if (!raw) return "";

  // in Blöcke trennen (leerzeile)
  const blocks = raw.split(/\n\s*\n/g);

  const html = blocks.map(block => {
    const lines = block.split("\n").map(l => l.replace(/\s+$/g, ""));
    if (looksLikeMarkdownTable(lines)) {
      return renderMarkdownTable(lines);
    }
    // normaler Textblock: Zeilenumbrüche erhalten, aber als <p> ausgeben
    const safe = escapeHtml(block);
    const withBreaks = safe.replace(/\n/g, "<br>");
    return `<p>${withBreaks}</p>`;
  }).join("");

  return `<div class="ms-rich">${html}</div>`;
}

/* ================= LISTE ================= */
function renderList(data) {
  const box = $("results");
  if (!box) return;

  box.innerHTML = (data || []).map(e => `
    <div class="entry-card" data-id="${e.id}">
      <div style="font-size:20px;font-weight:800;">${escapeHtml(e.title)}</div>
      ${renderScoreBlock(e.score, e.processing_score)}
      <div style="font-size:15px;line-height:1.4;">
        ${escapeHtml(shortText(e.summary))}
      </div>
    </div>
  `).join("");
}

/* ================= NAV / HOME ================= */
function goHome() {
  currentEntryId = null;
  history.pushState(null, "", location.pathname); // entfernt ?id=
  const box = $("results");
  if (box) box.innerHTML = ""; // Übersicht bleibt (Kategorien + Suche)
}

function initBackHome() {
  // falls es schon einen Button/Link im HTML gibt
  const candidates = [
    $("backHome"),
    $("backHomeBtn"),
    document.querySelector('[data-action="home"]'),
    document.querySelector(".back-home")
  ].filter(Boolean);

  candidates.forEach(el => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      goHome();
    });
  });
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

    <h3>Zusammenfassung</h3>
    ${renderRichText(e.summary)}

    <div id="entryActions"></div>
  `;

  renderEntryActions(e);
}

/* ================= SOCIAL / ACTIONS ================= */
function safeClipboardText(s) {
  return String(s).replace(/'/g, "%27");
}

function renderEntryActions(entry) {
  const box = $("entryActions");
  if (!box) return;

  const url = location.href;
  const encUrl = encodeURIComponent(url);
  const encTitle = encodeURIComponent(entry.title + " – MarketShield");

  box.innerHTML = `
    <div style="margin-top:32px;border-top:1px solid #ddd;padding-top:16px;display:flex;gap:8px;flex-wrap:wrap;">
      <button type="button" id="btnHome">⬅️ Zurück zur Startseite</button>
      <button type="button" id="btnReport">⚠️ Melden</button>

      <button type="button" onclick="navigator.clipboard.writeText('${safeClipboardText(url)}')">🔗 Kopieren</button>
      <button type="button" onclick="window.print()">🖨️ Drucken</button>
      <button type="button" onclick="window.open('https://wa.me/?text=${encTitle}%20${encUrl}','_blank')">WhatsApp</button>
      <button type="button" onclick="window.open('https://t.me/share/url?url=${encUrl}&text=${encTitle}','_blank')">Telegram</button>
      <button type="button" onclick="window.open('https://twitter.com/intent/tweet?url=${encUrl}&text=${encTitle}','_blank')">X</button>
      <button type="button" onclick="window.open('https://www.facebook.com/sharer/sharer.php?u=${encUrl}','_blank')">Facebook</button>
    </div>
  `;

  const btnHome = $("btnHome");
  if (btnHome) btnHome.addEventListener("click", goHome);

  const btnReport = $("btnReport");
  if (btnReport) btnReport.addEventListener("click", () => reportEntry(entry));
}

/* ================= REPORT ================= */
async function reportEntry(entry) {
  try {
    const text = prompt("Was stimmt nicht? (kurz beschreiben)");
    if (!text || text.trim().length < 3) return;

    await supa("reports", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: {
        description: text.trim(),
        entry_id: entry.id
      }
    });

    alert("Danke! Die Meldung wurde gespeichert.");
  } catch (err) {
    alert("Meldung konnte nicht gespeichert werden.\n\n" + String(err));
  }
}

/* ================= SEARCH ================= */
async function smartSearch(q) {
  const term = q.trim();
  if (term.length < 2) return [];

  const enc = encodeURIComponent(term);

  // ✅ Titel + Summary durchsuchen (so fühlt es sich nicht "kaputt" an)
  return await supa(
    `entries?select=id,title,summary,score,processing_score&or=(title.ilike.%25${enc}%25,summary.ilike.%25${enc}%25)`
  );
}

function initSearch() {
  const input = $("searchInput");
  const box = $("results");
  if (!input || !box) return;

  input.addEventListener("input", async () => {
    const q = input.value.trim();
    if (q.length < 2) {
      box.innerHTML = "";
      return;
    }
    renderList(await smartSearch(q));
  });
}

/* ================= KATEGORIEN ================= */
async function loadCategories() {
  const grid = document.querySelector(".category-grid");
  if (!grid) return;

  const data = await fetch("categories.json").then(r => r.json());
  grid.innerHTML = "";

  (data.categories || []).forEach(c => {
    const b = document.createElement("button");
    b.textContent = c.title;
    b.onclick = () => loadCategory(c.title);
    grid.appendChild(b);
  });
}

async function loadCategory(cat) {
  // ✅ WICHTIG: NICHT url-encoden bei eq. (sonst findet Supabase nix)
  renderList(await supa(
    `entries?select=id,title,summary,score,processing_score&category=eq.${cat}`
  ));
}

/* ================= CARD CLICK (DETAIL NAV) ================= */
document.addEventListener("click", (e) => {
  // Buttons/Links sollen NICHT versehentlich eine Karte öffnen
  if (e.target.closest("button, a, input, textarea, select, label")) return;

  const c = e.target.closest(".entry-card");
  if (!c) return;

  history.pushState(null, "", "?id=" + c.dataset.id);
  loadEntry(c.dataset.id);
});

/* ================= BROWSER BACK/FORWARD ================= */
window.addEventListener("popstate", () => {
  const id = new URLSearchParams(location.search).get("id");
  if (id) loadEntry(id);
  else goHome();
});

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
  initSearch();
  initBackHome();

  const id = new URLSearchParams(location.search).get("id");
  if (id) loadEntry(id);
});
