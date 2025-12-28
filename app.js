/* =====================================================
   MarketShield – app.js (FINAL / STABIL / VOLLSTÄNDIG)
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
  t = normalizeText(t).replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max) + " …" : t;
}

/* ================= TABELLEN RENDERING ================= */
/* erkennt Pipe-Tabellen und rendert echte HTML-Tabellen */
function renderSummary(text = "") {
  text = normalizeText(text);
  const lines = text.split("\n");
  let html = "";
  let i = 0;

  const isSep = (l) => /^[-| :]+$/.test(l || "");

  while (i < lines.length) {
    // Tabelle: Kopfzeile mit | und direkt danach Separator
    if (lines[i].includes("|") && isSep(lines[i + 1])) {
      const head = lines[i].split("|").map(c => c.trim()).filter(Boolean);
      i += 2;

      const rows = [];
      while (lines[i] && lines[i].includes("|")) {
        rows.push(lines[i].split("|").map(c => c.trim()).filter(Boolean));
        i++;
      }

      html += `
        <table style="border-collapse:collapse;width:100%;margin:14px 0">
          <thead>
            <tr>
              ${head.map(h => `<th style="border:1px solid #ccc;padding:7px;text-align:left">${escapeHtml(h)}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${rows.map(r => `
              <tr>
                ${r.map(c => `<td style="border:1px solid #ccc;padding:7px;vertical-align:top">${escapeHtml(c)}</td>`).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;
      continue;
    }

    // normale Absätze
    if (lines[i].trim()) {
      html += `<p style="margin:10px 0;line-height:1.6">${escapeHtml(lines[i])}</p>`;
    } else {
      html += `<div style="height:8px"></div>`;
    }
    i++;
  }

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

/* Industriebalken: grün -> gelb -> rot */
function renderIndustry(score) {
  const n = Number(score);
  if (!Number.isFinite(n) || n <= 0) return "";

  const value = Math.max(0, Math.min(10, n));
  const w = Math.round((value / 10) * 80);

  let color = "#2e7d32"; // grün
  if (value >= 4) color = "#f9a825"; // gelb
  if (value >= 7) color = "#c62828"; // rot

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
      <div style="font-size:20px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
        ${escapeHtml(e.title || "")}
      </div>
      ${renderScoreBlock(e.score, e.processing_score)}
      <div style="font-size:15px;line-height:1.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
        ${escapeHtml(shortText(e.summary || "", 220))}
      </div>
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
    <h2>${escapeHtml(e.title || "")}</h2>
    ${renderScoreBlock(e.score, e.processing_score)}

    <h3>Zusammenfassung</h3>
    <div>${renderSummary(e.summary || "")}</div>

    <div id="entryActions"></div>
  `;

  renderEntryActions(e.title || "");
}

/* ================= SOCIAL (unten als Buttons) ================= */
function renderEntryActions(title) {
  const box = $("entryActions");
  if (!box) return;

  const url = location.href;
  const encUrl = encodeURIComponent(url);
  const encTitle = encodeURIComponent(title + " – MarketShield");

  box.innerHTML = `
    <div style="margin-top:32px;border-top:1px solid #ddd;padding-top:16px;display:flex;gap:8px;flex-wrap:wrap;">
      <button type="button" onclick="navigator.clipboard.writeText('${url}')">🔗 Kopieren</button>
      <button type="button" onclick="window.print()">🖨️ Drucken</button>
      <button type="button" onclick="window.open('https://wa.me/?text=${encTitle}%20${encUrl}','_blank')">WhatsApp</button>
      <button type="button" onclick="window.open('https://t.me/share/url?url=${encUrl}&text=${encTitle}','_blank')">Telegram</button>
      <button type="button" onclick="window.open('https://twitter.com/intent/tweet?url=${encUrl}&text=${encTitle}','_blank')">X</button>
      <button type="button" onclick="window.open('https://www.facebook.com/sharer/sharer.php?u=${encUrl}','_blank')">Facebook</button>
    </div>`;
}

/* ================= SEARCH ================= */
async function smartSearch(q) {
  const term = q.trim();
  if (term.length < 2) return [];

  const enc = encodeURIComponent(term);
  return await supa(
    `entries?select=id,title,summary,score,processing_score&or=(title.ilike.%25${enc}%25,summary.ilike.%25${enc}%25)&limit=60`
  );
}

function initSearch() {
  const input = $("searchInput");
  const box = $("results");
  if (!input || !box) return;

  input.addEventListener("input", async () => {
    const q = input.value.trim();
    if (q.length < 2) return (box.innerHTML = "");
    renderList(await smartSearch(q));
  });
}

/* ================= KATEGORIEN ================= */
async function loadCategories() {
  const grid = document.querySelector(".category-grid");
  if (!grid) return;

  const data = await fetch("categories.json", { cache: "no-store" }).then(r => r.json());
  grid.innerHTML = "";

  (data.categories || []).forEach(c => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = c.title;
    b.onclick = () => loadCategory(c.title);
    grid.appendChild(b);
  });
}

async function loadCategory(cat) {
  renderList(await supa(
    `entries?select=id,title,summary,score,processing_score&category=eq.${encodeURIComponent(cat)}`
  ));
}

/* ================= REPORT MODAL (Eingabe MUSS funktionieren) ================= */
function ensureReportModal() {
  if ($("reportModal")) return;

  const m = document.createElement("div");
  m.id = "reportModal";
  m.style.cssText =
    "display:none;position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.45);align-items:center;justify-content:center;";

  m.innerHTML = `
    <form id="reportForm" style="background:#fff;padding:16px;border-radius:12px;width:90%;max-width:420px">
      <b>Produkt / Problem melden</b>
      <textarea name="description" required
        style="width:100%;height:120px;margin-top:8px"></textarea>
      <div id="reportStatus" style="font-size:12px;margin-top:6px"></div>
      <div style="margin-top:10px;text-align:right">
        <button type="submit">Senden</button>
        <button type="button" id="closeReport">Abbrechen</button>
      </div>
    </form>
  `;

  document.body.appendChild(m);

  // 🔒 Modal schluckt ALLE Events (Capture), damit Eingabe/Fokus nicht von Navigation zerstört wird
  ["click", "mousedown", "mouseup", "touchstart", "touchend", "keydown", "focusin"].forEach(ev => {
    m.addEventListener(ev, (e) => e.stopPropagation(), true);
  });

  // Klick außerhalb schließt (ohne Fokus-Stress)
  m.addEventListener("click", (e) => {
    if (e.target === m) m.style.display = "none";
  });

  $("closeReport").onclick = () => (m.style.display = "none");

  $("reportForm").onsubmit = async (e) => {
    e.preventDefault();
    const desc = e.target.description.value.trim();

    if (desc.length < 5) {
      $("reportStatus").textContent = "Bitte mindestens 5 Zeichen eingeben.";
      return;
    }

    $("reportStatus").textContent = "Sende …";
    await supaPost("reports", {
      description: desc,
      entry_id: currentEntryId,
      url: location.href
    });

    $("reportStatus").textContent = "Gesendet. Danke!";
    setTimeout(() => {
      m.style.display = "none";
      e.target.reset();
      $("reportStatus").textContent = "";
    }, 600);
  };
}

/* ================= REPORTBUTTON (OBEN, EXISTIERT SCHON) ================= */
document.addEventListener("click", (e) => {
  const btn = e.target.closest("#reportBtn"); // EXISTIERENDER OBERER BUTTON
  if (!btn) return;

  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  ensureReportModal();
  $("reportModal").style.display = "flex";
});

/* ================= NAVIGATION ================= */
document.addEventListener("click", (e) => {
  // Report-Modal und Report-Button dürfen niemals Navigation triggern
  if (e.target.closest("#reportModal")) return;
  if (e.target.closest("#reportBtn")) return;

  const c = e.target.closest(".entry-card");
  if (!c) return;

  history.pushState(null, "", "?id=" + c.dataset.id);
  loadEntry(c.dataset.id);
});

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
  initSearch();

  const id = new URLSearchParams(location.search).get("id");
  if (id) loadEntry(id);
});
