/* =====================================================
   MarketShield – app.js (FINAL / STABIL / KORREKT)
   ✔ KEINE neuen Buttons
   ✔ Oben: Zur Startseite + Report funktionieren
   ✔ Rechtlicher Hinweis: Minilink unter dem Titel + Popup
   ✔ Tabellen korrekt (Markdown → echte Tabellen)
   ✔ Social / Kopieren / Drucken vorhanden
   ✔ Suchanfragen werden gespeichert
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

function normalizeText(t = "") {
  return String(t)
    .replace(/\*\*|##+|__+|~~+|`+/g, "")
    .replace(/\\n/g, "\n")
    .replace(/\r\n|\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function shortText(t, max = 160) {
  t = normalizeText(t);
  return t.length > max ? t.slice(0, max) + " …" : t;
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
  const w = Math.min(80, Math.max(0, Math.round((n / 10) * 80)));
  return `
    <div style="width:80px;height:8px;background:#e0e0e0;border-radius:6px;">
      <div style="width:${w}px;height:8px;background:#2e7d32;border-radius:6px;"></div>
    </div>`;
}

function renderScoreBlock(score, processing) {
  const h = renderHealth(score);
  const i = renderIndustry(processing);
  if (!h && !i) return "";
  return `
    <div style="margin:12px 0;">
      ${h ? `<div style="display:grid;grid-template-columns:90px 1fr;gap:8px;">
        <div>${h}</div><div>Gesundheitsscore</div></div>` : ""}
      ${i ? `<div style="display:grid;grid-template-columns:90px 1fr;gap:8px;">
        <div>${i}</div><div>Industrie-Verarbeitungsgrad</div></div>` : ""}
    </div>`;
}

/* ================= STYLES ================= */
(function injectStyles() {
  if (document.getElementById("msStyles")) return;
  const s = document.createElement("style");
  s.id = "msStyles";
  s.textContent = `
    .ms-table-wrap{overflow-x:auto;margin:12px 0}
    table.ms-table{border-collapse:collapse;width:100%;font-size:14px}
    table.ms-table th,table.ms-table td{border:1px solid #ddd;padding:8px}
    table.ms-table th{font-weight:700}
    .ms-actions{margin-top:28px;border-top:1px solid #ddd;padding-top:14px;display:flex;gap:8px;flex-wrap:wrap}
    .ms-modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:9999}
    .ms-modal{background:#fff;border-radius:14px;max-width:640px;width:100%;padding:16px}
    .ms-modal textarea{width:100%;min-height:120px;padding:10px}
    .ms-modal .row{display:flex;justify-content:flex-end;gap:8px;margin-top:10px}
  `;
  document.head.appendChild(s);
})();

/* ================= MARKDOWN → TABLE ================= */
function isSeparator(line) {
  return /^[\s|\-:]+$/.test(line) && line.includes("-");
}
function splitRow(line) {
  return line.replace(/^\|/, "").replace(/\|$/, "").split("|").map(c => c.trim());
}
function parseMarkdown(text) {
  const lines = normalizeText(text).split("\n");
  const out = [];
  let i = 0;
  while (i < lines.length) {
    if (lines[i].includes("|") && lines[i + 1] && isSeparator(lines[i + 1])) {
      const header = splitRow(lines[i]);
      const rows = [];
      i += 2;
      while (i < lines.length && lines[i].includes("|")) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      out.push({ type: "table", header, rows });
    } else {
      let buf = lines[i];
      i++;
      while (i < lines.length && lines[i].trim() !== "") {
        buf += "\n" + lines[i];
        i++;
      }
      out.push({ type: "text", value: buf });
      while (i < lines.length && lines[i].trim() === "") i++;
    }
  }
  return out;
}
function renderRichText(text) {
  return parseMarkdown(text).map(b => {
    if (b.type === "table") {
      return `<div class="ms-table-wrap"><table class="ms-table">
        <thead><tr>${b.header.map(h => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead>
        <tbody>${b.rows.map(r => `<tr>${r.map(c => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`).join("")}</tbody>
      </table></div>`;
    }
    return `<p>${escapeHtml(b.value).replace(/\n/g, "<br>")}</p>`;
  }).join("");
}

/* ================= LIST ================= */
function renderList(data) {
  $("results").innerHTML = (data || []).map(e => `
    <div class="entry-card" data-id="${e.id}">
      <div style="font-size:20px;font-weight:800">${escapeHtml(e.title)}</div>
      ${renderScoreBlock(e.score, e.processing_score)}
      <div>${escapeHtml(shortText(e.summary))}</div>
    </div>
  `).join("");
}

/* ================= HOME ================= */
function goHome() {
  currentEntryId = null;
  history.pushState(null, "", location.pathname);
  $("results").innerHTML = "";
}

/* ================= TOP NAV (bestehend) ================= */
function bindTopNav() {
  [
    $("backHomeBtn"),
    $("backHome"),
    $("homeLink"),
    document.querySelector('[data-action="home"]')
  ].filter(Boolean).forEach(el => {
    el.addEventListener("click", e => {
      e.preventDefault();
      goHome();
    });
  });

  [
    $("reportBtn"),
    $("reportButton"),
    document.querySelector('[data-action="report"]')
  ].filter(Boolean).forEach(el => {
    el.addEventListener("click", e => {
      e.preventDefault();
      if (!currentEntryId) {
        alert("Bitte zuerst einen Eintrag öffnen.");
        return;
      }
      openReportPopup();
    });
  });
}

/* ================= REPORT ================= */
function openReportPopup() {
  const bg = document.createElement("div");
  bg.className = "ms-modal-backdrop";
  bg.innerHTML = `
    <div class="ms-modal">
      <h3>Meldung senden</h3>
      <p>Bitte beschreibe kurz und sachlich, was korrigiert werden soll.</p>
      <textarea id="repTxt" placeholder="Deine Meldung …"></textarea>
      <div class="row">
        <button id="repCancel">Abbrechen</button>
        <button id="repSend">Senden</button>
      </div>
    </div>`;
  document.body.appendChild(bg);

  $("repCancel").onclick = () => bg.remove();
  $("repSend").onclick = async () => {
    const t = $("repTxt").value.trim();
    if (t.length < 3) return;
    await supa("reports", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: { description: t, entry_id: currentEntryId }
    });
    bg.remove();
    alert("Danke! Meldung gespeichert.");
  };
}

/* ================= LEGAL POPUP ================= */
function openLegalPopup() {
  const bg = document.createElement("div");
  bg.className = "ms-modal-backdrop";
  bg.innerHTML = `
    <div class="ms-modal">
      <h3>Rechtlicher Hinweis</h3>
      <p>
        MarketShield dient ausschließlich der Information und Aufklärung.
        Es stellt keine Beratung dar. Angaben ohne Gewähr.
      </p>
      <div class="row">
        <button id="legalClose">Schließen</button>
      </div>
    </div>`;
  document.body.appendChild(bg);
  $("legalClose").onclick = () => bg.remove();
}

/* ================= SOCIAL ================= */
function renderEntryActions(entry) {
  const box = $("entryActions");
  if (!box) return;
  const url = location.href;
  const enc = encodeURIComponent(url);
  const title = encodeURIComponent(entry.title + " – MarketShield");
  box.innerHTML = `
    <div class="ms-actions">
      <button id="copyBtn">🔗 Kopieren</button>
      <button id="printBtn">🖨️ Drucken</button>
      <button onclick="window.open('https://wa.me/?text=${title}%20${enc}','_blank')">WhatsApp</button>
      <button onclick="window.open('https://t.me/share/url?url=${enc}&text=${title}','_blank')">Telegram</button>
      <button onclick="window.open('https://twitter.com/intent/tweet?url=${enc}&text=${title}','_blank')">X</button>
      <button onclick="window.open('https://www.facebook.com/sharer/sharer.php?u=${enc}','_blank')">Facebook</button>
    </div>`;
  $("copyBtn").onclick = () => navigator.clipboard.writeText(url);
  $("printBtn").onclick = () => window.print();
}

/* ================= DETAIL ================= */
async function loadEntry(id) {
  const d = await supa(`entries?select=*&id=eq.${id}`);
  const e = d[0];
  if (!e) return;

  currentEntryId = e.id;

  $("results").innerHTML = `
    <h2>${escapeHtml(e.title)}</h2>

    <a href="#" id="legalMiniLink"
       style="display:inline-block;font-size:12px;opacity:.7;margin:-6px 0 10px 0;">
       Rechtlicher Hinweis
    </a>

    ${renderScoreBlock(e.score, e.processing_score)}
    <h3>Zusammenfassung</h3>
    ${renderRichText(e.summary)}
    <div id="entryActions"></div>
  `;

  const legalLink = $("legalMiniLink");
  if (legalLink) {
    legalLink.onclick = (ev) => {
      ev.preventDefault();
      openLegalPopup();
    };
  }

  renderEntryActions(e);
}

/* ================= SEARCH ================= */
let lastQ = "";
async function saveSearch(q) {
  if (q.length < 2 || q === lastQ) return;
  lastQ = q;
  await supa("search_queue", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: { query: q }
  });
}
async function smartSearch(q) {
  if (q.length < 2) return [];
  const enc = encodeURIComponent(q);
  return await supa(
    `entries?select=id,title,summary,score,processing_score&or=(title.ilike.%25${enc}%25,summary.ilike.%25${enc}%25)`
  );
}
function initSearch() {
  const i = $("searchInput");
  if (!i) return;
  i.oninput = async () => {
    const q = i.value.trim();
    if (q.length < 2) {
      $("results").innerHTML = "";
      return;
    }
    renderList(await smartSearch(q));
    saveSearch(q).catch(() => {});
  };
}

/* ================= CATEGORIES ================= */
async function loadCategories() {
  const g = document.querySelector(".category-grid");
  if (!g) return;
  const d = await fetch("categories.json").then(r => r.json());
  g.innerHTML = "";
  d.categories.forEach(c => {
    const b = document.createElement("button");
    b.textContent = c.title;
    b.onclick = () => loadCategory(c.title);
    g.appendChild(b);
  });
}
async function loadCategory(cat) {
  renderList(await supa(
    `entries?select=id,title,summary,score,processing_score&category=eq.${cat}`
  ));
}

/* ================= NAV ================= */
document.addEventListener("click", e => {
  if (e.target.closest("button,a,textarea,input")) return;
  const c = e.target.closest(".entry-card");
  if (!c) return;
  history.pushState(null, "", "?id=" + c.dataset.id);
  loadEntry(c.dataset.id);
});
window.addEventListener("popstate", () => {
  const id = new URLSearchParams(location.search).get("id");
  if (id) loadEntry(id);
  else goHome();
});

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  bindTopNav();
  loadCategories();
  initSearch();
  const id = new URLSearchParams(location.search).get("id");
  if (id) loadEntry(id);
});
