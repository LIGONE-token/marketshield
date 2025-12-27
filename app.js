/* =====================================================
   MarketShield – app.js (FINAL / KOMPLETT / STABIL)
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
  const t = await r.text();
  if (!r.ok) throw new Error(t || "Insert failed");
}

/* ================= HELPERS ================= */
const $ = (id) => document.getElementById(id);

function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function cleanText(t = "") {
  return String(t)
    .replace(/\*\*/g, "")
    .replace(/##+/g, "")
    .replace(/__+/g, "")
    .replace(/~~+/g, "")
    .replace(/`+/g, "")
    .replace(/:contentReference\[[^\]]*\]\{[^}]*\}/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function shortText(t, max = 160) {
  t = cleanText(t);
  return t.length > max ? t.slice(0, max) + " …" : t;
}

function setResults(html) {
  const box = $("results");
  if (!box) return;
  box.innerHTML = html;
}

function showBackHome(show) {
  const back = $("backHome");
  if (!back) return;
  back.style.display = show ? "block" : "none";
}

function setUrlId(idOrNull) {
  const base = location.pathname;
  if (!idOrNull) {
    history.pushState(null, "", base);
  } else {
    history.pushState(null, "", `${base}?id=${encodeURIComponent(idOrNull)}`);
  }
}

/* ================= RECHTLICHER HINWEIS (TOP LINK + POPUP) ================= */
function ensureTopLegalLink() {
  const header = document.querySelector("header");
  if (!header) return;

  if ($("msLegalTopWrap")) return;

  const wrap = document.createElement("div");
  wrap.id = "msLegalTopWrap";
  wrap.style.display = "flex";
  wrap.style.justifyContent = "center";
  wrap.style.marginTop = "6px";

  const link = document.createElement("a");
  link.href = "#";
  link.id = "msLegalTopLink";
  link.textContent = "Rechtlicher Hinweis";
  link.style.fontSize = "12px";
  link.style.opacity = ".75";
  link.style.textDecoration = "underline";
  link.style.cursor = "pointer";

  const popup = document.createElement("div");
  popup.id = "msLegalTopPopup";
  popup.style.display = "none";
  popup.style.maxWidth = "900px";
  popup.style.margin = "8px auto 0 auto";
  popup.style.padding = "10px 12px";
  popup.style.border = "1px solid #ddd";
  popup.style.borderRadius = "10px";
  popup.style.background = "#fafafa";
  popup.style.fontSize = "12px";
  popup.style.lineHeight = "1.5";

  popup.textContent =
    "MarketShield dient der Information und Orientierung. Inhalte und Bewertungen sind Einschätzungen ohne Anspruch auf Vollständigkeit/Aktualität. Keine Rechts- oder Gesundheitsberatung. Bitte prüfe Angaben auf Verpackung und in offiziellen Quellen.";

  link.addEventListener("click", (e) => {
    e.preventDefault();
    popup.style.display = popup.style.display === "none" ? "block" : "none";
  });

  wrap.appendChild(link);
  header.appendChild(wrap);
  header.appendChild(popup);
}

/* ================= TABELLEN (ECHTE HTML-TABLES) ================= */
/*
  Erkennung: echte Markdown-Pipe-Tabelle nur wenn:
  1) Header-Zeile enthält |
  2) direkt danach Separator-Zeile nur aus - | space
  3) danach mind. 1 Datenzeile mit |
*/
function renderSummary(text) {
  const lines = cleanText(text).split("\n");
  let html = "";
  let i = 0;

  const isSep = (s) => /^[-\s|:]+$/.test((s || "").trim());

  while (i < lines.length) {
    const line = lines[i];

    if (line.includes("|") && isSep(lines[i + 1])) {
      // Sammle Header + Datenzeilen
      const headerLine = lines[i];
      i += 2; // sep skip

      const rowLines = [];
      while (i < lines.length && lines[i].includes("|")) {
        rowLines.push(lines[i]);
        i++;
      }

      // Nur echte Tabelle, wenn mindestens 1 Datenzeile existiert
      if (rowLines.length >= 1) {
        const head = headerLine.split("|").map(c => c.trim()).filter(Boolean);
        const cols = head.length;

        const norm = (arr) => {
          const out = arr.slice(0, cols);
          while (out.length < cols) out.push("");
          return out;
        };

        const bodyRows = rowLines.map(r =>
          norm(r.split("|").map(c => c.trim()).filter(Boolean))
        );

        html += `
          <table class="ms-table" style="width:100%;border-collapse:collapse;margin:12px 0;">
            <thead>
              <tr>
                ${norm(head).map(h => `<th style="border:1px solid #ccc;padding:6px 8px;background:#f4f4f4;text-align:left;">${escapeHtml(h)}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${bodyRows.map(r => `
                <tr>
                  ${r.map(c => `<td style="border:1px solid #ccc;padding:6px 8px;vertical-align:top;">${escapeHtml(c)}</td>`).join("")}
                </tr>
              `).join("")}
            </tbody>
          </table>
        `;
        continue;
      }

      // Keine Datenzeilen -> normaler Text
      html += `<p style="white-space:pre-wrap;line-height:1.6;margin:6px 0;">${escapeHtml(line)}</p>`;
      continue;
    }

    if (line.trim()) {
      html += `<p style="white-space:pre-wrap;line-height:1.6;margin:6px 0;">${escapeHtml(line)}</p>`;
    }
    i++;
  }

  return html;
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

// Industrie 0–10; Farbe: grün -> gelb -> rot
function renderIndustry(score) {
  const n0 = Number(score);
  if (!Number.isFinite(n0) || n0 <= 0) return "";
  const n = Math.max(0, Math.min(10, n0));
  const w = Math.round((n / 10) * 80);

  let color = "#2e7d32";
  if (n >= 4) color = "#f9a825";
  if (n >= 7) color = "#c62828";

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

/* ================= SOCIAL (DETAIL) ================= */
function renderEntryActions(title) {
  const box = $("entryActions");
  if (!box) return;

  const url = location.href;
  const encUrl = encodeURIComponent(url);
  const encTitle = encodeURIComponent(`${title} – MarketShield`);

  box.innerHTML = `
    <div style="margin-top:24px;border-top:1px solid #ddd;padding-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
      <button type="button" onclick="navigator.clipboard.writeText('${url}')">🔗 Kopieren</button>
      <button type="button" onclick="window.print()">🖨️ Drucken</button>
      <button type="button" onclick="window.open('https://wa.me/?text=${encTitle}%20${encUrl}','_blank')">WhatsApp</button>
      <button type="button" onclick="window.open('https://t.me/share/url?url=${encUrl}&text=${encTitle}','_blank')">Telegram</button>
      <button type="button" onclick="window.open('https://twitter.com/intent/tweet?url=${encUrl}&text=${encTitle}','_blank')">X</button>
      <button type="button" onclick="window.open('https://www.facebook.com/sharer/sharer.php?u=${encUrl}','_blank')">Facebook</button>
    </div>
  `;
}

/* ================= LISTE ================= */
function renderList(data) {
  const list = (data || []).map(e => `
    <div class="entry-card" data-id="${e.id}">
      <div style="font-size:20px;font-weight:800;">${escapeHtml(e.title || "")}</div>
      ${renderScoreBlock(e.score, e.processing_score)}
      <div style="font-size:15px;line-height:1.4;">${escapeHtml(shortText(e.summary || ""))}</div>
    </div>
  `).join("");

  setResults(list);
}

/* ================= STARTSEITE ================= */
function renderHome() {
  currentEntryId = null;
  showBackHome(false);
  setUrlId(null);

  // results wieder in "Startzustand" bringen (dein HTML enthält shareBox im results)
  setResults(`<div id="shareBox"></div>`);
}

/* ================= DETAIL ================= */
async function loadEntry(id) {
  const box = $("results");
  if (!box) return;

  const d = await supa(`entries?select=*&id=eq.${encodeURIComponent(id)}`);
  const e = d && d[0];
  if (!e) return;

  currentEntryId = e.id;
  showBackHome(true);
  setUrlId(e.id);

  box.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
      <h2 style="margin:0;">${escapeHtml(e.title || "")}</h2>
      <a href="#" id="legalLinkDetail" style="font-size:12px;opacity:.75;text-decoration:underline;">Rechtlicher Hinweis</a>
    </div>

    <div id="legalPopupDetail"
         style="display:none;margin:8px 0 12px 0;padding:10px 12px;border:1px solid #ddd;border-radius:10px;background:#fafafa;font-size:12px;line-height:1.5;">
      MarketShield dient der Information und Orientierung. Inhalte und Bewertungen sind Einschätzungen ohne Anspruch auf Vollständigkeit/Aktualität.
      Keine Rechts- oder Gesundheitsberatung. Bitte prüfe Angaben auf Verpackung und in offiziellen Quellen.
    </div>

    ${renderScoreBlock(e.score, e.processing_score)}

    <h3>Zusammenfassung</h3>
    <div class="entry-content">
      ${renderSummary(e.summary || "")}
    </div>

    <div id="entryActions"></div>
  `;

  const link = $("legalLinkDetail");
  const pop = $("legalPopupDetail");
  if (link && pop) {
    link.onclick = (ev) => {
      ev.preventDefault();
      pop.style.display = pop.style.display === "none" ? "block" : "none";
    };
  }

  renderEntryActions(e.title || "");
}

/* ================= SEARCH (inkl. search_queue) ================= */
async function saveSearchQuery(q) {
  // Minimal payload, damit nichts an "fehlenden Spalten" scheitert:
  // erwartet typischerweise: query (text) + created_at (optional default)
  try {
    await supaPost("search_queue", { query: q });
  } catch (e) {
    // bewusst still: Suche darf NICHT kaputtgehen, nur weil logging nicht geht
    console.error("search_queue insert failed:", e);
  }
}

async function smartSearch(term) {
  const q = term.trim();
  if (q.length < 2) return [];

  const like = `%${q}%`;
  const encLike = encodeURIComponent(like);

  // OR korrekt: ganzer Ausdruck muss URL-konform sein
  const orExpr = `or=(title.ilike.${encLike},summary.ilike.${encLike})`;

  return await supa(
    `entries?select=id,title,summary,score,processing_score&${orExpr}&order=idx.asc&limit=50`
  );
}

function initSearch() {
  const input = $("searchInput");
  const results = $("results");
  if (!input || !results) return;

  let last = "";
  let timer = null;

  input.addEventListener("input", () => {
    const q = input.value.trim();
    last = q;

    clearTimeout(timer);
    timer = setTimeout(async () => {
      if (q.length < 2) {
        // zurück zur Startseite, aber ohne Kategorien zu zerstören
        renderHome();
        return;
      }
      try {
        const data = await smartSearch(q);
        renderList(data);
        showBackHome(false);
        currentEntryId = null;
      } catch (e) {
        console.error("search failed:", e);
      }
    }, 180);
  });

  // Enter: Search-Query loggen (wie von dir gefordert)
  input.addEventListener("keydown", async (e) => {
    if (e.key !== "Enter") return;
    const q = input.value.trim();
    if (q.length < 2) return;
    await saveSearchQuery(q);
  });
}

/* ================= KATEGORIEN ================= */
async function loadCategories() {
  const grid = document.querySelector(".category-grid");
  if (!grid) return;

  try {
    const r = await fetch("categories.json", { cache: "no-store" });
    if (!r.ok) throw new Error("categories.json not found");
    const data = await r.json();

    grid.innerHTML = "";

    (data.categories || []).forEach(c => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = c.title;
      b.onclick = () => loadCategory(c.title);
      grid.appendChild(b);
    });
  } catch (e) {
    console.error("loadCategories failed:", e);
    // keine Zerstörung der Seite, nur still
  }
}

async function loadCategory(cat) {
  try {
    const data = await supa(
      `entries?select=id,title,summary,score,processing_score&category=eq.${encodeURIComponent(cat)}&order=idx.asc&limit=80`
    );
    renderList(data);
    showBackHome(false);
    currentEntryId = null;
    setUrlId(null);
  } catch (e) {
    console.error("loadCategory failed:", e);
  }
}

/* ================= REPORT (Modal + Insert) ================= */
function initReport() {
  const btn = $("reportBtn");
  const modal = $("reportModal");
  const closeBtn = $("closeReportModal");
  const form = $("reportForm");

  if (!btn || !modal || !closeBtn || !form) return;

  // status text (ohne alerts)
  let status = $("reportStatus");
  if (!status) {
    status = document.createElement("div");
    status.id = "reportStatus";
    status.style.marginTop = "8px";
    status.style.fontSize = "12px";
    status.style.opacity = ".8";
    form.appendChild(status);
  }

  btn.addEventListener("click", () => {
    status.textContent = "";
    modal.style.display = "flex";
  });

  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const desc = (form.description?.value || "").trim();
    if (desc.length < 5) {
      status.textContent = "Bitte eine kurze Beschreibung eingeben (mind. 5 Zeichen).";
      return;
    }

    status.textContent = "Sende …";

    try {
      // Minimal payload für maximale Kompatibilität:
      // erwartet typischerweise: description (text), entry_id (uuid nullable)
      await supaPost("reports", {
        description: desc,
        entry_id: currentEntryId || null
      });

      form.reset();
      status.textContent = "Danke! Meldung wurde gesendet.";
      setTimeout(() => {
        modal.style.display = "none";
        status.textContent = "";
      }, 600);
    } catch (err) {
      console.error("report insert failed:", err);
      status.textContent = "Fehler beim Senden. Bitte später erneut versuchen.";
    }
  });
}

/* ================= BACK HOME ================= */
function initBackHome() {
  const back = $("backHome");
  if (!back) return;
  back.addEventListener("click", () => {
    renderHome();
  });
}

/* ================= NAV (Cards + Browser Back/Forward) ================= */
function initNavigation() {
  document.addEventListener("click", (e) => {
    const card = e.target.closest(".entry-card");
    if (!card) return;
    const id = card.dataset.id;
    if (!id) return;
    loadEntry(id);
  });

  window.addEventListener("popstate", () => {
    const id = new URLSearchParams(location.search).get("id");
    if (id) loadEntry(id);
    else renderHome();
  });
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  ensureTopLegalLink();   // oben als Link auf der Startseite
  loadCategories();       // Kategorien
  initSearch();           // Suche
  initReport();           // Report-Button + Modal
  initBackHome();         // ← Zur Startseite
  initNavigation();       // Karten-Klick + Browser Back/Forward

  // initial state
  const id = new URLSearchParams(location.search).get("id");
  if (id) loadEntry(id);
  else renderHome();
});
