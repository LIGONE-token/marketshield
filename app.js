/* =====================================================
   MarketShield – app.js (STABIL / FINAL / REPARIERT)
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

/* POST für reports (und später optional search_queue) */
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

/* ================= PIPE-TABELLEN (ZEILENBASIERT, ROBUST) ================= */
function renderSummary(text) {
  const lines = normalizeText(text).split("\n");
  let html = "";
  let tableLines = [];

  const flushTable = () => {
    // Separatorzeilen raus, aber erst NACH dem Sammeln
    const cleaned = tableLines.filter(l => l.trim().length > 0);

    // Wenn es doch keine echte Tabelle ist -> als Text
    const pipeCount = cleaned.filter(l => l.includes("|")).length;
    if (pipeCount < 2) {
      html += `<div style="white-space:pre-wrap;line-height:1.6;margin:6px 0;">${escapeHtml(cleaned.join("\n"))}</div>`;
      tableLines = [];
      return;
    }

    const rows = cleaned
      .filter(l => !/^[-\s|:]+$/.test(l)) // typische Trennzeile entfernen
      .map(l => l.split("|").map(c => c.trim()).filter(Boolean));

    if (rows.length < 2) {
      html += `<div style="white-space:pre-wrap;line-height:1.6;margin:6px 0;">${escapeHtml(cleaned.join("\n"))}</div>`;
      tableLines = [];
      return;
    }

    const head = rows.shift();
    const cols = head.length;

    const norm = (r) => {
      const out = r.slice(0, cols);
      while (out.length < cols) out.push("");
      return out;
    };

    html += `
      <table class="ms-table">
        <thead>
          <tr>${norm(head).map(h => `<th>${escapeHtml(h)}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${rows.map(r =>
            `<tr>${norm(r).map(c => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`
          ).join("")}
        </tbody>
      </table>
    `;

    tableLines = [];
  };

  for (const line of lines) {
    if (line.includes("|")) {
      tableLines.push(line);
    } else {
      if (tableLines.length) flushTable();
      if (line.trim()) {
        html += `<div style="white-space:pre-wrap;line-height:1.6;margin:6px 0;">${escapeHtml(line)}</div>`;
      }
    }
  }
  if (tableLines.length) flushTable();

  return html;
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

/* Industrie 0–10 + Farbe grün/gelb/rot */
function renderIndustry(score) {
  const n0 = Number(score);
  if (!Number.isFinite(n0) || n0 <= 0) return "";

  const n = Math.max(0, Math.min(10, n0));
  const w = Math.round((n / 10) * 80);

  let color = "#2e7d32";      // grün
  if (n >= 4) color = "#f9a825"; // gelb
  if (n >= 7) color = "#c62828"; // rot

  return `
    <div style="width:80px;height:8px;background:#e0e0e0;border-radius:6px;">
      <div style="width:${w}px;height:8px;background:${color};border-radius:6px;"></div>
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

/* ================= HOME / BACK ================= */
function showBackHome(show) {
  const back = $("backHome");
  if (!back) return;
  back.style.display = show ? "block" : "none";
}

function goHome() {
  // URL sauber zurücksetzen (wichtig für GitHub Pages)
  history.pushState(null, "", location.pathname);
  currentEntryId = null;

  // Ergebnisbereich leeren (Startseite zeigt Kategorien/Intro ohnehin außerhalb)
  const box = $("results");
  if (box) box.innerHTML = `<div id="shareBox"></div>`;

  showBackHome(false);
}

/* ================= DETAIL ================= */
async function loadEntry(id) {
  const box = $("results");
  if (!box) return;

  const d = await supa(`entries?select=*&id=eq.${id}`);
  const e = d[0];
  if (!e) return;

  currentEntryId = id;
  showBackHome(true);

  box.innerHTML = `
    <h2>${escapeHtml(e.title)}</h2>
    ${renderScoreBlock(e.score, e.processing_score)}

    <h3>Zusammenfassung</h3>
    <div class="entry-content">
      ${renderSummary(e.summary)}
    </div>

    <div style="margin-top:10px;">
      <a href="#" id="legalLink" style="font-size:12px;opacity:.75;">⚖️ Rechtlicher Hinweis</a>
      <div id="legalPopup" style="display:none;margin-top:6px;padding:8px 10px;border:1px solid #ddd;border-radius:10px;background:#fafafa;font-size:12px;line-height:1.5;">
        MarketShield dient der Information und Orientierung. Inhalte und Bewertungen sind eine
        transparente Einschätzung ohne Anspruch auf Vollständigkeit oder Aktualität.
        Keine Rechts- oder Gesundheitsberatung. Bitte prüfe Angaben auf Verpackung und
        offiziellen Quellen.
      </div>
    </div>

    <div id="entryActions"></div>
  `;

  // Legal: Link → Popup toggle (Text NICHT sofort sichtbar)
  const legalLink = $("legalLink");
  const legalPopup = $("legalPopup");
  if (legalLink && legalPopup) {
    legalLink.onclick = (ev) => {
      ev.preventDefault();
      legalPopup.style.display = (legalPopup.style.display === "none") ? "block" : "none";
    };
  }

  renderEntryActions(e.title);
}

/* ================= SOCIAL ================= */
function renderEntryActions(title) {
  const box = $("entryActions");
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
    </div>`;
}

/* ================= SEARCH ================= */
async function smartSearch(q) {
  const term = q.trim();
  if (term.length < 2) return [];

  const enc = encodeURIComponent(term);

  // ✅ NUR Titel durchsuchen (dein Originalverhalten)
  return await supa(
    `entries?select=id,title,summary,score,processing_score&title=ilike.%25${enc}%25`
  );
}

function initSearch() {
  const input = $("searchInput");
  const box = $("results");
  if (!input || !box) return;

  input.addEventListener("input", async () => {
    const q = input.value.trim();
    if (q.length < 2) return box.innerHTML = "";
    renderList(await smartSearch(q));
    showBackHome(false); // Suche ist Startseiten-Modus
    currentEntryId = null;
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
  renderList(await supa(
    `entries?select=id,title,summary,score,processing_score&category=eq.${encodeURIComponent(cat)}`
  ));
  showBackHome(false);
  currentEntryId = null;
}

/* ================= NAV ================= */
document.addEventListener("click", (e) => {
  const c = e.target.closest(".entry-card");
  if (!c) return;
  history.pushState(null, "", "?id=" + c.dataset.id);
  loadEntry(c.dataset.id);
});

/* ================= REPORT (Modal + Supabase) ================= */
function initReport() {
  const reportBtn = $("reportBtn");
  const modal = $("reportModal");
  const closeBtn = $("closeReportModal");
  const form = $("reportForm");

  if (!reportBtn || !modal || !closeBtn || !form) return;

  reportBtn.onclick = () => { modal.style.display = "flex"; };
  closeBtn.onclick = () => { modal.style.display = "none"; };

  form.onsubmit = async (e) => {
    e.preventDefault();
    const desc = (form.description?.value || "").trim();
    if (desc.length < 5) return;

    // entry_id darf null sein (Report auch von Startseite)
    await supaPost("reports", {
      entry_id: currentEntryId || null,
      description: desc,
      created_at: new Date().toISOString()
    });

    form.reset();
    modal.style.display = "none";
  };
}

/* ================= BACKHOME LINK (oben links) ================= */
function initBackHome() {
  const back = $("backHome");
  if (!back) return;
  back.onclick = goHome;
}

/* ================= POPSTATE (Browser Zurück/Weiter) ================= */
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
  initReport();

  const id = new URLSearchParams(location.search).get("id");
  if (id) loadEntry(id);
  else showBackHome(false);
});
