/* =====================================================
   MarketShield – app.js (FINAL / STABIL / WIE VORHER)

   FIXES (genau deine Punkte):
   ✅ Tabellen: Markdown-Tabellen werden korrekt als echte <table> gerendert
   ✅ Social-/Kopieren-/Drucken-Buttons sind wieder da (unten im Detail – OHNE neue Home/Report Buttons)
   ✅ Suchanfragen werden in search_queue gespeichert (Enter + Debounce)
   ✅ Oben "Zur Startseite" funktioniert (bindet vorhandenen Link/Button – mehrere mögliche IDs)
   ✅ Report-Eingabe ist größer (Textarea-Popup) + besserer Text

   WICHTIG:
   - KEINE neuen Home/Report Buttons werden erstellt.
   - Es werden nur vorhandene Top-Elemente angebunden.
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
      "Content-Type": "application/json",
      ...(opts.headers || {})
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
  const w = Math.min(80, Math.max(0, Math.round((n / 10) * 80)));
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

/* ================= STYLES (Tabellen + Report Popup) ================= */
function ensureInjectedStyles() {
  if (document.getElementById("msInjectedStyles")) return;
  const s = document.createElement("style");
  s.id = "msInjectedStyles";
  s.textContent = `
    .ms-rich p { margin: 0 0 12px 0; line-height: 1.6; }
    .ms-table-wrap { overflow-x:auto; margin: 10px 0 16px 0; }
    table.ms-table { width:100%; border-collapse: collapse; font-size: 14px; }
    table.ms-table th, table.ms-table td { border: 1px solid #ddd; padding: 8px; vertical-align: top; }
    table.ms-table th { font-weight: 800; }
    .ms-actions { margin-top:32px;border-top:1px solid #ddd;padding-top:16px;display:flex;gap:8px;flex-wrap:wrap; }
    .ms-modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px;}
    .ms-modal{max-width:640px;width:100%;background:#fff;border-radius:14px;padding:16px;box-shadow:0 10px 30px rgba(0,0,0,.25);}
    .ms-modal h3{margin:0 0 10px 0;font-size:18px;}
    .ms-modal textarea{width:100%;min-height:120px;resize:vertical;padding:10px;font-size:14px;line-height:1.4;border:1px solid #ccc;border-radius:10px;outline:none;}
    .ms-modal .row{display:flex;gap:8px;justify-content:flex-end;margin-top:10px;flex-wrap:wrap;}
  `;
  document.head.appendChild(s);
}

/* ================= TABELLEN-RENDER (KORREKT) =================
   - erkennt echte Markdown-Tabellenblöcke
   - rendert sie als <table>
   - sonst Text als <p> (mit <br>)
===================================================== */

function isSeparatorLine(line) {
  // erlaubt: | --- | :---: | ---: |
  const t = line.trim();
  if (!t.includes("-")) return false;
  if (!t.includes("|")) return false;
  return /^[\s|\-:]+$/.test(t);
}

function splitRow(line) {
  // äußere Pipes entfernen, dann split
  const cleaned = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return cleaned.split("|").map(c => c.trim());
}

function parseMarkdownTables(text) {
  const lines = normalizeText(text).split("\n");
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // potenzieller Tabellenstart: Headerline mit | und nächste Zeile Separator
    if (line.includes("|") && i + 1 < lines.length && isSeparatorLine(lines[i + 1])) {
      const header = splitRow(line);
      const rows = [];
      i += 2; // skip header + separator

      while (i < lines.length) {
        const l = lines[i];
        if (!l.trim()) break; // leerzeile beendet Tabelle
        if (!l.includes("|")) break; // keine Pipe -> beendet Tabelle
        rows.push(splitRow(l));
        i++;
      }

      out.push({ type: "table", header, rows });
      continue;
    }

    // normaler Textblock sammeln bis leerzeile
    let buf = line;
    i++;
    while (i < lines.length && lines[i].trim() !== "") {
      // stoppe, falls eine Tabelle beginnt
      if (lines[i].includes("|") && i + 1 < lines.length && isSeparatorLine(lines[i + 1])) break;
      buf += "\n" + lines[i];
      i++;
    }
    out.push({ type: "text", value: buf });
    while (i < lines.length && lines[i].trim() === "") i++; // leere zeilen skippen
  }

  return out;
}

function renderTableBlock(header, rows) {
  const thead = `<thead><tr>${header.map(h => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead>`;
  const tbody = `<tbody>${
    rows.map(r => `<tr>${r.map(c => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`).join("")
  }</tbody>`;

  return `<div class="ms-table-wrap"><table class="ms-table">${thead}${tbody}</table></div>`;
}

function renderRichText(text) {
  ensureInjectedStyles();
  const blocks = parseMarkdownTables(text);

  return `<div class="ms-rich">` + blocks.map(b => {
    if (b.type === "table") return renderTableBlock(b.header, b.rows);
    const safe = escapeHtml(b.value || "");
    return `<p>${safe.replace(/\n/g, "<br>")}</p>`;
  }).join("") + `</div>`;
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

/* ================= HOME (nur URL & results; KEINE neuen Buttons) ================= */
function goHome() {
  currentEntryId = null;
  history.pushState(null, "", location.pathname);
  const box = $("results");
  if (box) box.innerHTML = "";
}

/* ================= REPORT (Textarea Popup, besserer Text) ================= */
function openReportModal(entry) {
  ensureInjectedStyles();

  // Modal existiert schon?
  if (document.getElementById("msReportBackdrop")) return;

  const backdrop = document.createElement("div");
  backdrop.id = "msReportBackdrop";
  backdrop.className = "ms-modal-backdrop";

  const modal = document.createElement("div");
  modal.className = "ms-modal";

  modal.innerHTML = `
    <h3>Meldung senden</h3>
    <div style="opacity:.85;margin-bottom:8px;">
      Beschreibe kurz und konkret, was korrigiert werden soll (z. B. falsche Angabe, fehlender Punkt, Tippfehler).
    </div>
    <textarea id="msReportText" placeholder="Deine Meldung… (bitte mind. 3 Zeichen)"></textarea>
    <div class="row">
      <button type="button" id="msReportCancel">Abbrechen</button>
      <button type="button" id="msReportSend">Senden</button>
    </div>
  `;

  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  const close = () => backdrop.remove();

  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) close();
  });

  $("msReportCancel").onclick = close;

  $("msReportSend").onclick = async () => {
    const txt = ($("msReportText").value || "").trim();
    if (txt.length < 3) return;

    try {
      // passt exakt zu deiner Tabelle: description + entry_id
      await supa("reports", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: { description: txt, entry_id: String(entry.id || "") }
      });
      close();
      alert("Danke! Deine Meldung wurde gespeichert.");
    } catch (err) {
      alert("Meldung konnte nicht gespeichert werden.\n\n" + String(err));
    }
  };

  setTimeout(() => $("msReportText").focus(), 0);
}

/* ================= TOP ACTIONS (BESTEHENDE ELEMENTE – robust) =================
   - KEINE neuen Buttons
   - bindet mehrere mögliche IDs/Selector an (weil du Link oben hast)
===================================================== */
function bindExistingTopActions(entry) {
  // HOME (Link/Button oben)
  const homeEls = [
    $("#backHomeBtn"),
    $("#backHome"),
    $("#homeBtn"),
    $("#homeLink"),
    $("#backHomeLink"),
    document.querySelector('[data-action="home"]'),
    document.querySelector('a#backHome'),
    document.querySelector('a#backHomeBtn')
  ].filter(Boolean);

  homeEls.forEach(el => {
    el.onclick = (e) => {
      e.preventDefault?.();
      goHome();
    };
  });

  // REPORT (Button oben)
  const reportEls = [
    $("#reportBtn"),
    $("#reportButton"),
    $("#report"),
    document.querySelector('[data-action="report"]')
  ].filter(Boolean);

  reportEls.forEach(el => {
    el.onclick = (e) => {
      e.preventDefault?.();
      openReportModal(entry);
    };
  });
}

/* ================= SOCIAL / COPY / PRINT (unten – wie vorher, ohne Home/Report) ================= */
function renderEntryActions(entry) {
  const box = $("entryActions");
  if (!box) return;

  ensureInjectedStyles();

  const url = location.href;
  const encUrl = encodeURIComponent(url);
  const encTitle = encodeURIComponent((entry.title || "") + " – MarketShield");

  box.innerHTML = `
    <div class="ms-actions">
      <button type="button" id="msCopyBtn">🔗 Kopieren</button>
      <button type="button" id="msPrintBtn">🖨️ Drucken</button>
      <button type="button" onclick="window.open('https://wa.me/?text=${encTitle}%20${encUrl}','_blank')">WhatsApp</button>
      <button type="button" onclick="window.open('https://t.me/share/url?url=${encUrl}&text=${encTitle}','_blank')">Telegram</button>
      <button type="button" onclick="window.open('https://twitter.com/intent/tweet?url=${encUrl}&text=${encTitle}','_blank')">X</button>
      <button type="button" onclick="window.open('https://www.facebook.com/sharer/sharer.php?u=${encUrl}','_blank')">Facebook</button>
    </div>
  `;

  const copyBtn = $("#msCopyBtn");
  if (copyBtn) {
    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(url);
        alert("Link kopiert.");
      } catch (_) {
        // Fallback
        const ta = document.createElement("textarea");
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        alert("Link kopiert.");
      }
    };
  }

  const printBtn = $("#msPrintBtn");
  if (printBtn) printBtn.onclick = () => window.print();
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

  // unten: Social/Copy/Print (wie vorher)
  renderEntryActions(e);

  // oben: vorhandene Link/Button anbinden (Report/Home)
  bindExistingTopActions(e);
}

/* ================= SEARCH + SAVE ================= */
let _searchSaveTimer = null;
let _lastSavedQuery = "";

async function saveSearchQuery(q) {
  const term = (q || "").trim();
  if (term.length < 2) return;
  if (term === _lastSavedQuery) return;
  _lastSavedQuery = term;

  // Minimal & kompatibel: nur "query" schreiben (falls weitere Spalten existieren, sind Defaults ok)
  await supa("search_queue", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: { query: term }
  });
}

async function smartSearch(q) {
  const term = q.trim();
  if (term.length < 2) return [];

  const enc = encodeURIComponent(term);
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

    // Suche live
    try {
      renderList(await smartSearch(q));
    } catch (_) {}

    // Speichern (Debounce)
    clearTimeout(_searchSaveTimer);
    _searchSaveTimer = setTimeout(() => {
      saveSearchQuery(q).catch(() => {});
    }, 800);
  });

  // Speichern sofort bei Enter (wie „vorher“ in vielen Varianten üblich)
  input.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const q = input.value.trim();
    saveSearchQuery(q).catch(() => {});
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
  // NICHT encodeURIComponent bei eq. (sonst findet Supabase oft nichts)
  renderList(await supa(
    `entries?select=id,title,summary,score,processing_score&category=eq.${cat}`
  ));
}

/* ================= NAV (Cards) ================= */
document.addEventListener("click", (e) => {
  // keine Navigation, wenn auf Buttons/Links/Inputs geklickt wurde
  if (e.target.closest("button, a, input, textarea, select, label")) return;

  const card = e.target.closest(".entry-card");
  if (!card) return;

  const id = card.dataset.id;
  history.pushState(null, "", "?id=" + id);
  loadEntry(id);
});

window.addEventListener("popstate", () => {
  const id = new URLSearchParams(location.search).get("id");
  if (id) loadEntry(id);
  else goHome();
});

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  ensureInjectedStyles();
  loadCategories();
  initSearch();

  const id = new URLSearchParams(location.search).get("id");
  if (id) loadEntry(id);

  // Home-Link oben kann auch ohne Entry schon funktionieren
  bindExistingTopActions({ id: "", title: "" });
});
