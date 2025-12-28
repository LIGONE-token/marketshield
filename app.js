/* =====================================================
   MarketShield – app.js (FINAL / LOCKED)
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

/* Entfernt NUR Artefakte, zerstört keine Struktur */
function stripArtifacts(s) {
  return String(s || "")
    .replace(/:contentReference\[[^\]]*\]\{[^}]*\}/gi, "")
    .replace(/\[oaicite:[^\]]*\]/gi, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/* Behält Absätze (\n\n) */
function normalizeText(text) {
  return stripArtifacts(String(text || ""))
    .replace(/\\n/g, "\n")
    .replace(/\r\n|\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function makePreview(text, max = 170) {
  const t = normalizeText(text).replace(/\n+/g, " ").trim();
  return t.length <= max ? t : t.slice(0, max).trim() + " …";
}

/* ================= SCORES (LOCKED) ================= */
function renderHealth(score) {
  const n = Number(score);
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n >= 80) return "💚💚💚";
  if (n >= 60) return "💚💚";
  if (n >= 40) return "💚";
  if (n >= 20) return "💛";
  return "❗⚠️❗";
}

function renderIndustry(score) {
  const n = Number(score);
  if (!Number.isFinite(n) || n <= 0) return "";
  const clamped = Math.min(10, Math.max(1, n));
  const MAX = 90;
  const w = Math.round((clamped / 10) * MAX);
  const hue = Math.round(120 - (clamped - 1) * (120 / 9));
  return `
    <div style="margin-top:6px;">
      <div style="display:flex;align-items:center;gap:8px;font-size:13px;opacity:.85;">
        <div style="width:${MAX}px;height:6px;background:#e0e0e0;border-radius:4px;overflow:hidden;">
          <div style="width:${w}px;height:6px;background:hsl(${hue},85%,45%);border-radius:4px;"></div>
        </div>
        <div>Industrie-Verarbeitungsgrad</div>
      </div>
    </div>
  `;
}

function renderScoreBlock(score, processing) {
  const h = renderHealth(score);
  const i = renderIndustry(processing);
  if (!h && !i) return "";
  return `
    <div style="margin:10px 0;">
      ${h ? `
        <div style="display:flex;align-items:center;gap:8px;font-size:15px;margin-bottom:4px;">
          <div>${h}</div><div style="opacity:.8;">Gesundheit</div>
        </div>` : ""}
      ${i || ""}
    </div>
  `;
}

/* ================= STARTSEITE (LEER) ================= */
function showStart() {
  currentEntryId = null;
  const box = $("results");
  if (box) box.innerHTML = "";
}

/* ================= TABELLEN ================= */
function renderSummaryHtml(raw) {
  const text = normalizeText(raw);
  const blocks = text.split(/\n\s*\n/);

  return blocks.map(block => {
    const table = mdTableToHtml(block);
    if (table) return table;
    return `<p style="margin:0 0 14px 0; white-space:pre-wrap; line-height:1.6;">${escapeHtml(block)}</p>`;
  }).join("");
}

function mdTableToHtml(block) {
  const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length < 2 || !lines[0].includes("|")) return null;
  const sep = lines[1].replace(/\s+/g, "");
  if (!sep.includes("|") || !/^[-:|]+$/.test(sep)) return null;

  const parseRow = (line) => {
    let s = line;
    if (s.startsWith("|")) s = s.slice(1);
    if (s.endsWith("|")) s = s.slice(0, -1);
    return s.split("|").map(c => escapeHtml(c.trim()));
  };

  const header = parseRow(lines[0]);
  const rows = lines.slice(2).filter(l => l.includes("|")).map(parseRow);
  if (header.length < 2) return null;

  return `
    <div style="margin:14px 0; overflow:auto;">
      <table style="border-collapse:collapse;width:auto;max-width:100%;font-size:14px;">
        <thead>
          <tr>${header.map(h => `<th style="border:1px solid #ddd;padding:8px 10px;background:#f6f6f6;text-align:left;">${h}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${rows.map(r => `<tr>${r.map(c => `<td style="border:1px solid #ddd;padding:8px 10px;vertical-align:top;">${c}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;
}

/* ================= LISTE ================= */
function renderList(data = []) {
  const box = $("results");
  if (!box) return;

  box.innerHTML = data.map(e => `
    <div class="entry-card" data-id="${e.id}">
      <div style="font-size:20px;font-weight:800;">${escapeHtml(e.title)}</div>
      ${renderScoreBlock(e.score, e.processing_score)}
      <div style="font-size:15px;opacity:.9;">${escapeHtml(makePreview(e.summary))}</div>
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
    <div id="entryContent">${renderSummaryHtml(e.summary)}</div>

    <div id="entryActions" style="margin-top:26px;border-top:1px solid #e5e5e5;padding-top:14px;">
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button data-act="copy">🔗 Kopieren</button>
        <button data-act="print">🖨️ Drucken</button>
        <button data-act="telegram">Telegram</button>
        <button data-act="whatsapp">WhatsApp</button>
        <button data-act="x">X</button>
        <button data-act="facebook">Facebook</button>
      </div>
    </div>
  `;
}

/* ================= SEARCH ================= */
function initSearch() {
  const input = $("searchInput");
  if (!input) return;

  input.addEventListener("input", async (e) => {
    const q = e.target.value.trim();
    if (q.length < 2) return showStart();

    const enc = encodeURIComponent(q);
    renderList(await supa(
      `entries?select=id,title,summary,score,processing_score&title=ilike.%25${enc}%25`
    ));
  });
}

/* ================= KATEGORIEN ================= */
async function loadCategories() {
  const grid =
    document.querySelector(".category-grid") ||
    document.getElementById("categoryGrid");

  if (!grid) return;

  const data = await fetch("categories.json").then(r => r.json());
  grid.innerHTML = "";

  (data.categories || []).forEach(c => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = c.title;
    b.onclick = async () => {
      renderList(await supa(
        `entries?select=id,title,summary,score,processing_score&category=eq.${c.title}`
      ));
    };
    grid.appendChild(b);
  });
}

/* ================= GLOBAL CLICK (STABIL) ================= */
document.addEventListener("click", async (e) => {
  // Entry öffnen
  const card = e.target.closest(".entry-card");
  if (card) {
    history.pushState({}, "", "?id=" + card.dataset.id);
    loadEntry(card.dataset.id);
    return;
  }

  // Zur Startseite
  if (e.target.closest("#backHome")) {
    e.preventDefault();
    history.pushState({}, "", location.pathname);
    showStart();
    return;
  }

  // Rechtlicher Hinweis
  if (e.target.closest("#legalLink")) {
    e.preventDefault();
    $("legalModal") && ($("legalModal").style.display = "block");
    return;
  }
  if (e.target.closest("#closeLegalModal")) {
    $("legalModal") && ($("legalModal").style.display = "none");
    return;
  }

  // GLOBALER REPORT (immer aktiv)
  if (e.target.closest("#reportBtn")) {
    const m = $("reportModal");
    if (!m) {
      alert("Report-Fenster fehlt.");
      return;
    }
    m.style.display = "block";
    return;
  }
  if (e.target.closest("#closeReportModal")) {
    $("reportModal") && ($("reportModal").style.display = "none");
    return;
  }

  // Social / Aktionen
  const btn = e.target.closest("#entryActions [data-act]");
  if (!btn) return;

  const act = btn.dataset.act;
  const url = location.href;
  const title = (document.querySelector("h2")?.textContent || "MarketShield").trim();
  const encUrl = encodeURIComponent(url);
  const encTitle = encodeURIComponent(title + " – MarketShield");

  if (act === "copy") { navigator.clipboard.writeText(url); return; }
  if (act === "print") { window.print(); return; }
  if (act === "telegram") return void window.open(`https://t.me/share/url?url=${encUrl}&text=${encTitle}`, "_blank");
  if (act === "whatsapp") return void window.open(`https://wa.me/?text=${encTitle}%20${encUrl}`, "_blank");
  if (act === "x") return void window.open(`https://twitter.com/intent/tweet?url=${encUrl}&text=${encTitle}`, "_blank");
  if (act === "facebook") return void window.open(`https://www.facebook.com/sharer/sharer.php?u=${encUrl}`, "_blank");
});

/* ================= REPORT SUBMIT → SUPABASE ================= */
document.addEventListener("submit", async (e) => {
  const form = e.target.closest("#reportForm");
  if (!form) return;

  e.preventDefault();
  const txt = form.description?.value.trim();
  if (!txt || txt.length < 3) {
    alert("Bitte Beschreibung eingeben.");
    return;
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/reports`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    },
    body: JSON.stringify({
      description: txt,
      entry_id: currentEntryId || null,
      created_at: new Date().toISOString()
    })
  });

  if (!res.ok) {
    console.error(await res.text());
    alert("Report fehlgeschlagen.");
    return;
  }

  form.reset();
  $("reportModal") && ($("reportModal").style.display = "none");
  alert("Danke! Meldung wurde gespeichert.");
});

/* ================= HISTORY ================= */
window.addEventListener("popstate", () => {
  const id = new URLSearchParams(location.search).get("id");
  if (id) loadEntry(id);
  else showStart();
});

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
  initSearch();

  const id = new URLSearchParams(location.search).get("id");
  if (id) loadEntry(id);
  else showStart();
});
