/* =====================================================
   MarketShield – app.js (STABIL / OHNE HTML-ÄNDERUNG)
   FIX:
   - Tooltip wieder sichtbar (Overlay wie früher, CSP-safe, kein eval)
   - Tabellen korrekt (Markdown -> echtes <table>, leere Zellen bleiben)
===================================================== */

let currentEntryId = null;

/* ================= SUPABASE ================= */
const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
const SUPABASE_KEY = "sb_publishable_FBywhrypx6zt_0nMlFudyQ_zFiqZKTD";

async function supa(query) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    return await r.json();
  } catch (e) {
    console.error("Supabase Fehler:", e);
    return [];
  }
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
    // escaped sequences aus Generator
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    // echte CRLF
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // zu viele Leerzeilen
    .replace(/\n{3,}/g, "\n\n");
}

function stripArtifacts(text) {
  if (!text) return "";
  return String(text)
    .replace(/:contentReference\[[^\]]*\]\{[^}]*\}/g, "")
    .replace(/\[oaicite:\d+\]/g, "")
    .trim();
}

function shortText(text, max = 160) {
  if (!text) return "";
  const t = String(text);
  return t.length > max ? t.slice(0, max) + " …" : t;
}

/* ================= STYLES ================= */
function injectStyles() {
  if (document.getElementById("msStyles")) return;
  const style = document.createElement("style");
  style.id = "msStyles";
  style.textContent = `
    /* Tabellen stabil */
    .ms-tablewrap{
      overflow-x:auto;
      -webkit-overflow-scrolling:touch;
      margin:14px 0;
      border:1px solid #ddd;
      border-radius:10px;
      background:#fff;
    }
    table.ms-table{
      border-collapse:collapse;
      width:100%;
      min-width:640px;
      background:#fff;
    }
    .ms-table th,.ms-table td{
      border:1px solid #ddd;
      padding:8px 10px;
      vertical-align:top;
      text-align:left;
      word-break:break-word;
    }
    .ms-table th{ background:#f5f5f5; font-weight:800; }

    /* Tooltip Overlay (wie früher) */
    #msTip{
      position:fixed;
      z-index:999999;
      pointer-events:none;
      background:rgba(20,20,20,.95);
      color:#fff;
      padding:8px 10px;
      border-radius:8px;
      font-size:13px;
      line-height:1.35;
      max-width:360px;
      box-shadow:0 10px 26px rgba(0,0,0,.25);
      opacity:0;
      transform:translateY(6px);
      transition:opacity .12s ease, transform .12s ease;
      display:block;
    }
    #msTip.ms-on{
      opacity:1;
      transform:translateY(0);
    }
  `;
  document.head.appendChild(style);
}

/* ================= TOOLTIP (CSP-SAFE, KEIN eval) ================= */
let tipEl = null;
let tipOn = false;

function ensureTooltip() {
  if (tipEl) return;
  tipEl = document.createElement("div");
  tipEl.id = "msTip";
  tipEl.textContent = "";
  document.body.appendChild(tipEl);
}

function getTipText(el) {
  if (!el) return "";
  // Priorität: data-tooltip, dann title
  const dt = el.getAttribute("data-tooltip");
  if (dt && dt.trim()) return dt.trim();
  const tt = el.getAttribute("title");
  if (tt && tt.trim()) return tt.trim();
  return "";
}

function showTip(text, x, y) {
  if (!text) return;
  ensureTooltip();
  tipEl.textContent = text;
  tipEl.classList.add("ms-on");
  tipOn = true;

  // Position mit Abstand; bleibt im Viewport
  const pad = 12;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // erst grob setzen, dann messen
  tipEl.style.left = "0px";
  tipEl.style.top = "0px";
  const rect = tipEl.getBoundingClientRect();

  let left = x + pad;
  let top = y + pad;

  if (left + rect.width > vw - 8) left = vw - rect.width - 8;
  if (top + rect.height > vh - 8) top = y - rect.height - pad;

  left = Math.max(8, left);
  top = Math.max(8, top);

  tipEl.style.left = `${left}px`;
  tipEl.style.top = `${top}px`;
}

function hideTip() {
  if (!tipEl) return;
  tipEl.classList.remove("ms-on");
  tipOn = false;
}

/* Tooltip-Targets: alles mit data-tooltip ODER title */
function findTipTarget(start) {
  return start?.closest?.("[data-tooltip],[title]") || null;
}

function initTooltipSystem() {
  // Maus: enter/move/leave
  document.addEventListener("mousemove", (e) => {
    if (!tipOn) return;
    // follow mouse
    showTip(tipEl.textContent || "", e.clientX, e.clientY);
  }, { passive: true });

  document.addEventListener("mouseover", (e) => {
    const t = findTipTarget(e.target);
    if (!t) return;
    const text = getTipText(t);
    if (!text) return;
    // native title nicht doppelt anzeigen -> kurz entfernen (wir zeigen Overlay)
    // WICHTIG: wir speichern es nicht global, weil wir es nicht dauerhaft löschen.
    // Stattdessen lassen wir title drin; Overlay ist sowieso sichtbar.
    showTip(text, e.clientX, e.clientY);
  }, { passive: true });

  document.addEventListener("mouseout", (e) => {
    const rel = e.relatedTarget;
    // wenn wir von einem tooltip-target weggehen und nicht direkt zu einem anderen
    const from = findTipTarget(e.target);
    const to = findTipTarget(rel);
    if (from && from !== to) hideTip();
  }, { passive: true });

  // Touch (Handy): tippen/longpress -> kurz anzeigen
  document.addEventListener("touchstart", (e) => {
    const t = findTipTarget(e.target);
    if (!t) return;
    const text = getTipText(t);
    if (!text) return;

    const touch = e.touches && e.touches[0];
    if (!touch) return;

    showTip(text, touch.clientX, touch.clientY);
    // nach 1.2s ausblenden (damit UI nicht klebt)
    setTimeout(() => hideTip(), 1200);
  }, { passive: true });
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
            style="opacity:.7;"
          >Gesundheitsscore</span>
        </div>` : ""}

      ${i ? `
        <div style="display:flex;align-items:center;gap:8px;margin-top:6px;">
          <div>${i}</div>
          <span
            title="Grad der industriellen Verarbeitung"
            data-tooltip="Grad der industriellen Verarbeitung"
            style="opacity:.7;"
          >Industrie-Verarbeitungsgrad</span>
        </div>` : ""}
    </div>
  `;
}

/* ================= MARKDOWN TABLES -> <table> ================= */
function renderMarkdownTables(text) {
  if (!text) return "";

  const lines = normalizeText(stripArtifacts(text)).split("\n");
  let html = "";
  let i = 0;

  const isSeparator = (s) =>
    /^(\|?\s*:?-{3,}:?\s*)+(\|?\s*)$/.test((s || "").trim());

  // WICHTIG: leere Zellen NICHT wegfiltern!
  const splitRowKeepEmpty = (row) => {
    let parts = row.split("|").map(s => s.trim());
    // optional führendes/abschließendes pipe entfernen
    if (parts.length && parts[0] === "") parts.shift();
    if (parts.length && parts[parts.length - 1] === "") parts.pop();
    return parts; // leere Strings bleiben erhalten
  };

  while (i < lines.length) {
    const line = lines[i].trim();

    // Tabellenstart: Header + Separator
    if (line.includes("|") && isSeparator(lines[i + 1])) {
      const headers = splitRowKeepEmpty(lines[i]);
      const colCount = headers.length;

      html += `<div class="ms-tablewrap"><table class="ms-table"><thead><tr>`;
      for (let c = 0; c < colCount; c++) {
        html += `<th>${escapeHtml(headers[c] || "")}</th>`;
      }
      html += `</tr></thead><tbody>`;

      i += 2; // skip header + separator

      // Rows: solange Zeile Pipes enthält UND nicht Separator
      while (i < lines.length) {
        const rowRaw = lines[i];
        const rowTrim = rowRaw.trim();

        if (!rowTrim) break;
        if (!rowTrim.includes("|")) break;
        if (isSeparator(rowTrim)) { i++; continue; }

        const cells = splitRowKeepEmpty(rowRaw);

        html += `<tr>`;
        for (let c = 0; c < colCount; c++) {
          html += `<td>${escapeHtml(cells[c] ?? "")}</td>`;
        }
        html += `</tr>`;
        i++;
      }

      html += `</tbody></table></div>`;
      continue;
    }

    // Normaler Text
    if (line === "") {
      html += `<div style="height:10px;"></div>`;
    } else {
      const raw = lines[i];
      const isWarn = raw.trim().toUpperCase().startsWith("NICHT DEKLARIERT");
      const tipText = "Diese Bestandteile sind rechtlich nicht deklarationspflichtig, können aber technisch oder prozessbedingt vorhanden sein.";
      html += `<p style="margin:8px 0;line-height:1.6;" ${
        isWarn ? `title="${escapeHtml(tipText)}" data-tooltip="${escapeHtml(tipText)}"` : ""
      }>${escapeHtml(raw)}</p>`;
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

  // Cards clickable (delegationsfrei, stabil)
  results.querySelectorAll(".entry-card").forEach(card => {
    card.addEventListener("click", () => {
      const id = card.dataset.id;
      if (!id) return;
      history.pushState(null, "", "?id=" + id);
      loadEntry(id);
    });
  });
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

/* ================= SOCIAL BUTTONS ================= */
function renderEntryActions(title) {
  const box = $("entryActions");
  if (!box) return;

  const url = location.href;
  const encUrl = encodeURIComponent(url);
  const encTitle = encodeURIComponent((title ? title + " – " : "") + "MarketShield");

  box.innerHTML = `
    <div style="margin-top:24px;border-top:1px solid #ddd;padding-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
      <button id="msCopyBtn" title="Link kopieren" data-tooltip="Link kopieren">🔗 Kopieren</button>
      <button id="msPrintBtn" title="Drucken" data-tooltip="Drucken">🖨️ Drucken</button>
      <button data-share="telegram" title="Telegram teilen" data-tooltip="Telegram teilen">Telegram</button>
      <button data-share="whatsapp" title="WhatsApp teilen" data-tooltip="WhatsApp teilen">WhatsApp</button>
      <button data-share="x" title="X teilen" data-tooltip="X teilen">X</button>
      <button data-share="facebook" title="Facebook teilen" data-tooltip="Facebook teilen">Facebook</button>
    </div>
  `;

  $("msCopyBtn")?.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(url); } catch {}
  });
  $("msPrintBtn")?.addEventListener("click", () => window.print());

  box.querySelectorAll("[data-share]").forEach(btn => {
    btn.addEventListener("click", () => {
      const net = btn.getAttribute("data-share");
      let shareUrl = "";
      if (net === "telegram") shareUrl = `https://t.me/share/url?url=${encUrl}&text=${encTitle}`;
      if (net === "whatsapp") shareUrl = `https://wa.me/?text=${encTitle}%20${encUrl}`;
      if (net === "x") shareUrl = `https://twitter.com/intent/tweet?url=${encUrl}&text=${encTitle}`;
      if (net === "facebook") shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encUrl}`;
      if (shareUrl) window.open(shareUrl, "_blank");
    });
  });
}

/* ================= CATEGORIES ================= */
async function loadCategories() {
  const grid = document.querySelector(".category-grid");
  if (!grid) return;

  try {
    const data = await fetch("categories.json").then(r => r.json());
    grid.innerHTML = "";
    (data.categories || []).forEach(c => {
      const b = document.createElement("button");
      b.textContent = c.title;
      b.addEventListener("click", () => loadCategory(c.title));
      grid.appendChild(b);
    });
  } catch (e) {
    console.warn("categories.json nicht geladen:", e);
  }
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
    if (q.length < 2) { results.innerHTML = ""; return; }
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

  btn.setAttribute("title", btn.getAttribute("title") || "Meldung senden");
  btn.setAttribute("data-tooltip", btn.getAttribute("data-tooltip") || "Meldung senden");

  btn.addEventListener("click", () => modal.classList.add("active"));
  close?.addEventListener("click", () => modal.classList.remove("active"));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const desc = (form.description?.value || "").trim();
    if (!desc) return alert("Bitte Beschreibung eingeben.");

    try {
      await fetch(`${SUPABASE_URL}/rest/v1/reports`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          description: desc,
          source: "community",
          status: "new",
          entry_id: currentEntryId || null
        })
      });
      form.reset();
      modal.classList.remove("active");
      alert("Meldung gesendet. Danke!");
    } catch (err) {
      console.error(err);
      alert("Fehler beim Senden.");
    }
  });
}

/* ================= BACK HOME ================= */
function initBackHome() {
  const back = $("backHome");
  if (!back) return;

  back.setAttribute("title", back.getAttribute("title") || "Zurück");
  back.setAttribute("data-tooltip", back.getAttribute("data-tooltip") || "Zurück");

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

/* ================= START ================= */
document.addEventListener("DOMContentLoaded", () => {
  injectStyles();
  initTooltipSystem();
  initSearch();
  loadCategories();
  initReport();
  initBackHome();

  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  if (id) loadEntry(id);
  updateBackHome();
});
