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

function oneLine(t = "", max = 220) {
  t = cleanText(t).replace(/\s+/g, " ").trim();
  if (t.length > max) t = t.slice(0, max) + "…";
  return t;
}

function showBackHome(show) {
  const back = $("backHome");
  if (!back) return;
  back.style.display = show ? "block" : "none";
}

function setUrlId(idOrNull) {
  const base = location.pathname;
  if (!idOrNull) history.pushState(null, "", base);
  else history.pushState(null, "", `${base}?id=${encodeURIComponent(idOrNull)}`);
}

/* ================= RECHTLICHER HINWEIS (LINK + POPUP) ================= */
/*
  Du wolltest: Popup ja, aber KEIN falscher Text.
  -> Deshalb ist der Inhalt bewusst "neutral/leer" und kommt aus LEGAL_HTML.
  -> Du kannst LEGAL_HTML später exakt mit deinem Text füllen (ohne dass ich dir Müll reinsetze).
*/
const LEGAL_HTML = ""; // <- HIER deinen echten Hinweistext (HTML erlaubt) einfügen

function openLegalPopup() {
  const modal = $("msLegalModal");
  const box = $("msLegalBox");
  if (!modal || !box) return;

  box.innerHTML = LEGAL_HTML ? LEGAL_HTML : `
    <div style="opacity:.75;line-height:1.5">
      (Hier kommt dein eigener „Rechtlicher Hinweis“-Text rein.)
    </div>
  `;

  modal.style.display = "flex";
}

function closeLegalPopup() {
  const modal = $("msLegalModal");
  if (!modal) return;
  modal.style.display = "none";
}

function ensureLegalModal() {
  if ($("msLegalModal")) return;

  const modal = document.createElement("div");
  modal.id = "msLegalModal";
  modal.style.display = "none";
  modal.style.position = "fixed";
  modal.style.inset = "0";
  modal.style.zIndex = "99999";
  modal.style.background = "rgba(0,0,0,.45)";
  modal.style.alignItems = "center";
  modal.style.justifyContent = "center";
  modal.style.padding = "18px";

  const inner = document.createElement("div");
  inner.style.width = "min(900px, 96vw)";
  inner.style.maxHeight = "80vh";
  inner.style.overflow = "auto";
  inner.style.background = "#fff";
  inner.style.borderRadius = "14px";
  inner.style.boxShadow = "0 20px 80px rgba(0,0,0,.35)";
  inner.style.padding = "14px 16px";

  const top = document.createElement("div");
  top.style.display = "flex";
  top.style.justifyContent = "space-between";
  top.style.alignItems = "center";
  top.style.gap = "10px";

  const title = document.createElement("div");
  title.textContent = "Rechtlicher Hinweis";
  title.style.fontWeight = "800";
  title.style.fontSize = "16px";

  // Kein "Close"-Zwang: kleines X, aber optional
  const x = document.createElement("button");
  x.type = "button";
  x.textContent = "✕";
  x.style.border = "0";
  x.style.background = "transparent";
  x.style.fontSize = "18px";
  x.style.cursor = "pointer";
  x.onclick = closeLegalPopup;

  const box = document.createElement("div");
  box.id = "msLegalBox";
  box.style.marginTop = "10px";
  box.style.fontSize = "13px";

  top.appendChild(title);
  top.appendChild(x);
  inner.appendChild(top);
  inner.appendChild(box);
  modal.appendChild(inner);

  // Klick außerhalb schließt
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeLegalPopup();
  });

  document.body.appendChild(modal);
}

function renderLegalLinkHtml(linkId) {
  return `<a href="#" id="${linkId}" style="font-size:12px;opacity:.75;text-decoration:underline;">Rechtlicher Hinweis</a>`;
}

function bindLegalLink(linkId) {
  const a = $(linkId);
  if (!a) return;
  a.onclick = (ev) => {
    ev.preventDefault();
    openLegalPopup();
  };
}

/* ================= TABELLEN (ECHT) ================= */
/*
  Pipe-Table nur wenn:
  Header enthält |
  nächste Zeile ist Separator (----|----)
  danach mind. 1 Zeile mit |
*/
function renderSummary(text) {
  const lines = cleanText(text).split("\n");
  let html = "";
  let i = 0;

  const isSep = (s) => /^[-\s|:]+$/.test((s || "").trim());

  const splitRow = (line) => {
    let s = (line || "").trim();
    if (s.startsWith("|")) s = s.slice(1);
    if (s.endsWith("|")) s = s.slice(0, -1);
    return s.split("|").map(c => c.trim());
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.includes("|") && isSep(lines[i + 1])) {
      const header = splitRow(line);
      const cols = header.length;

      i += 2; // skip sep
      const rows = [];

      while (i < lines.length && lines[i].includes("|")) {
        rows.push(splitRow(lines[i]));
        i++;
      }

      if (rows.length >= 1 && cols >= 2) {
        const norm = (r) => {
          const out = r.slice(0, cols);
          while (out.length < cols) out.push("");
          return out;
        };

        html += `
          <table class="ms-table" style="width:100%;border-collapse:collapse;margin:12px 0;">
            <thead>
              <tr>
                ${norm(header).map(h => `<th style="border:1px solid #ccc;padding:6px 8px;background:#f4f4f4;text-align:left;">${escapeHtml(h)}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${rows.map(r => `
                <tr>
                  ${norm(r).map(c => `<td style="border:1px solid #ccc;padding:6px 8px;vertical-align:top;">${escapeHtml(c)}</td>`).join("")}
                </tr>
              `).join("")}
            </tbody>
          </table>
        `;
        continue;
      }
      // fallthrough: wenn keine echte Tabelle, als Text rendern
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

// Industrie 0–10: grün -> gelb -> rot
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

/* ================= SOCIAL (Detail) ================= */
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

/* ================= LISTE (Kurzansicht 1 Zeile) ================= */
function renderList(data) {
  const html = (data || []).map(e => `
    <div class="entry-card" data-id="${e.id}">
      <div style="font-size:18px;font-weight:800;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
        ${escapeHtml(e.title || "")}
      </div>
      ${renderScoreBlock(e.score, e.processing_score)}
      <div style="font-size:14px;opacity:.9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
        ${escapeHtml(oneLine(e.summary || ""))}
      </div>
    </div>
  `).join("");

  const box = $("results");
  if (box) box.innerHTML = html;
}

/* ================= HOME / BACK ================= */
function renderHome() {
  currentEntryId = null;
  showBackHome(false);
  setUrlId(null);

  const box = $("results");
  if (box) box.innerHTML = `<div id="shareBox"></div>`;
}

/* ================= DETAIL ================= */
async function loadEntry(id) {
  const d = await supa(`entries?select=*&id=eq.${encodeURIComponent(id)}`);
  const e = d && d[0];
  if (!e) return;

  currentEntryId = e.id;
  showBackHome(true);
  setUrlId(e.id);

  const box = $("results");
  if (!box) return;

  box.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
      <h2 style="margin:0;">${escapeHtml(e.title || "")}</h2>
      ${renderLegalLinkHtml("legalLinkDetail")}
    </div>

    ${renderScoreBlock(e.score, e.processing_score)}

    <h3>Zusammenfassung</h3>
    <div class="entry-content">
      ${renderSummary(e.summary || "")}
    </div>

    <div id="entryActions"></div>
  `;

  bindLegalLink("legalLinkDetail");
  renderEntryActions(e.title || "");
}

/* ================= SEARCH (title+summary OR + search_queue on Enter) ================= */
async function saveSearchQuery(q) {
  try {
    await supaPost("search_queue", { query: q });
  } catch (e) {
    // Suche darf NICHT kaputtgehen, wenn logging scheitert
    console.error("search_queue insert failed:", e);
  }
}

async function smartSearch(term) {
  const q = term.trim();
  if (q.length < 2) return [];

  const like = encodeURIComponent(`%${q}%`);
  const orExpr = `or=(title.ilike.${like},summary.ilike.${like})`;

  return await supa(
    `entries?select=id,title,summary,score,processing_score&${orExpr}&order=idx.asc&limit=60`
  );
}

function initSearch() {
  const input = $("searchInput");
  if (!input) return;

  let timer = null;

  input.addEventListener("input", () => {
    const q = input.value.trim();
    clearTimeout(timer);
    timer = setTimeout(async () => {
      if (q.length < 2) {
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
    }, 160);
  });

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

/* ================= REPORT (anklickbar + Insert) ================= */
function initReport() {
  const btn = $("reportBtn");
  const modal = $("reportModal");
  const closeBtn = $("closeReportModal");
  const form = $("reportForm");

  if (!btn || !modal || !closeBtn || !form) return;

  // Erzwinge, dass das Modal NICHT die Seite blockiert, wenn CSS kaputt ist
  modal.style.display = "none";
  modal.style.position = "fixed";
  modal.style.inset = "0";
  modal.style.zIndex = "99998";
  modal.style.background = "rgba(0,0,0,.45)";
  modal.style.alignItems = "center";
  modal.style.justifyContent = "center";

  // Falls CSS pointer-events vermurkst ist:
  btn.style.pointerEvents = "auto";
  btn.style.cursor = "pointer";

  // Statuszeile
  let status = $("reportStatus");
  if (!status) {
    status = document.createElement("div");
    status.id = "reportStatus";
    status.style.marginTop = "8px";
    status.style.fontSize = "12px";
    status.style.opacity = ".8";
    form.appendChild(status);
  }

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    status.textContent = "";
    modal.style.display = "flex";
  });

  closeBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    modal.style.display = "none";
  });

  // Klick außerhalb schließt
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const desc = (form.description?.value || "").trim();
    if (desc.length < 5) {
      status.textContent = "Bitte Beschreibung eingeben (mind. 5 Zeichen).";
      return;
    }

    status.textContent = "Sende …";

    try {
      await supaPost("reports", {
        description: desc,
        entry_id: currentEntryId || null,
        url: location.href
      });
      form.reset();
      status.textContent = "Gesendet. Danke!";
      setTimeout(() => {
        modal.style.display = "none";
        status.textContent = "";
      }, 450);
    } catch (err) {
      console.error("report insert failed:", err);
      status.textContent = "Fehler beim Senden. Bitte später erneut.";
    }
  });
}

/* ================= BACK HOME + NAV ================= */
function initBackHome() {
  const back = $("backHome");
  if (!back) return;
  back.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    renderHome();
  });
}

function initNavigation() {
  document.addEventListener("click", (e) => {
    // Report / Modals dürfen NICHT als Entry-Click interpretiert werden
    if (e.target.closest("#reportModal") || e.target.closest("#reportBtn")) return;
    if (e.target.closest("#msLegalModal")) return;
    if (e.target.closest("#backHome")) return;
    if (e.target.closest("#legalLinkDetail") || e.target.closest("#msLegalTopLink")) return;

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

/* ================= TOP LEGAL LINK (Startseite) ================= */
function ensureTopLegalLink() {
  const header = document.querySelector("header");
  if (!header) return;
  if ($("msLegalTopLink")) return;

  const wrap = document.createElement("div");
  wrap.style.display = "flex";
  wrap.style.justifyContent = "center";
  wrap.style.marginTop = "6px";

  wrap.innerHTML = renderLegalLinkHtml("msLegalTopLink");
  header.appendChild(wrap);

  const a = $("msLegalTopLink");
  if (a) {
    a.onclick = (ev) => {
      ev.preventDefault();
      openLegalPopup();
    };
  }
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  ensureLegalModal();     // Popup-Struktur
  ensureTopLegalLink();   // Link oben
  loadCategories();       // Kategorien
  initSearch();           // Suche
  initReport();           // Report
  initBackHome();         // Back
  initNavigation();       // Navigation

  const id = new URLSearchParams(location.search).get("id");
  if (id) loadEntry(id);
  else renderHome();
});
