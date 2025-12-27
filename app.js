/* =====================================================
   MarketShield – app.js (STABIL / REPARIERT)
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
  const w = Math.round((n / 10) * 80);
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

    <!-- LEGAL MINI LINK (wie gewünscht: kleiner Link zum Popup) -->
    <div
      style="
        font-size:11px;
        opacity:0.6;
        margin:4px 0 8px;
        cursor:pointer;
        text-decoration:underline;
      "
      onclick="event.stopPropagation(); openLegalPopup()">
      Rechtlicher Hinweis
    </div>

    <h3>Zusammenfassung</h3>
    <div style="white-space:pre-wrap;line-height:1.6;">
      ${escapeHtml(normalizeText(e.summary))}
    </div>

    <div id="entryActions"></div>
  `;

  renderEntryActions(e.title);

  // ✅ wichtig: nach Render der Detailansicht nochmal Report-Binding versuchen
  bindReportButton();
}

/* ================= SOCIAL (UNVERÄNDERT!) ================= */
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

  // ✅ NUR Titel durchsuchen
  return await supa(
    `entries?select=id,title,summary,score,processing_score&title=ilike.%25${enc}%25`
  );
}

/* ✅ Suchanfragen in search_queue speichern (wie früher) */
async function saveSearchQuery(q) {
  const term = (q || "").trim();
  if (term.length < 2) return;

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/search_queue`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify({
        query: term,
        url: location.href
      })
    });
  } catch (e) {
    // niemals UI kaputt machen, nur still loggen
    console.warn("search_queue insert failed", e);
  }
}

function initSearch() {
  const input = $("searchInput");
  const box = $("results");
  if (!input || !box) return;

  input.addEventListener("input", async () => {
    const q = input.value.trim();
    if (q.length < 2) return box.innerHTML = "";

    // ✅ ZWINGEND: Suchanfrage speichern
    saveSearchQuery(q);

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
  renderList(await supa(
    `entries?select=id,title,summary,score,processing_score&category=eq.${encodeURIComponent(cat)}`
  ));
}

/* ================= LEGAL POPUP (LOCKED) ================= */
function ensureLegalPopup() {
  if (document.getElementById("legalPopup")) return;

  const div = document.createElement("div");
  div.id = "legalPopup";
  div.style.cssText = `
    display:none;
    position:fixed;
    inset:0;
    background:rgba(0,0,0,0.45);
    z-index:99999;
    align-items:center;
    justify-content:center;
  `;

  div.innerHTML = `
    <div style="
      background:#fff;
      max-width:420px;
      padding:16px 18px;
      border-radius:12px;
      font-size:14px;
      line-height:1.45;
    ">
      <div style="font-weight:900;margin-bottom:6px;">
        Rechtlicher Hinweis
      </div>

      <div style="margin-bottom:12px;">
        MarketShield kann rechtlich nicht alle Informationen vollständig darstellen.
        Inhalte unterliegen gesetzlichen, regulatorischen und haftungsrechtlichen Grenzen
        sowie unvollständiger öffentlicher Informationslage.
        Die Informationen dienen der sachlichen Einordnung und ersetzen keine medizinische
        oder rechtliche Beratung.
      </div>

      <button onclick="closeLegalPopup()">Schließen</button>
    </div>
  `;

  document.body.appendChild(div);
}

function openLegalPopup() {
  ensureLegalPopup();
  document.getElementById("legalPopup").style.display = "flex";
}

function closeLegalPopup() {
  const p = document.getElementById("legalPopup");
  if (p) p.style.display = "none";
}

/* ================= REPORT (LOCKED) =================
   WICHTIG: Der Report-Button EXISTIERT bereits im HTML.
   Wir ersetzen ihn nicht. Wir machen ihn nur klickbar und senden an Supabase.
===================================================== */

function findReportButton() {
  // Unterstützt mehrere typische Varianten, ohne HTML ändern zu müssen:
  return (
    document.getElementById("reportBtn") ||
    document.getElementById("reportButton") ||
    document.querySelector("[data-action='report']") ||
    document.querySelector(".report-btn") ||
    document.querySelector("#report") ||
    null
  );
}

function bindReportButton() {
  const btn = findReportButton();
  if (!btn) return;

  // Mehrfach-Bind verhindern
  if (btn.dataset.bound === "1") return;
  btn.dataset.bound = "1";

  btn.addEventListener("click", (e) => {
    // ✅ sonst frisst dein globaler entry-card click-handler den Klick
    e.preventDefault();
    e.stopPropagation();
    openReportPopup();
  });
}

function ensureReportPopup() {
  if (document.getElementById("reportPopup")) return;

  const div = document.createElement("div");
  div.id = "reportPopup";
  div.style.cssText = `
    display:none;
    position:fixed;
    inset:0;
    background:rgba(0,0,0,0.45);
    z-index:99999;
    align-items:center;
    justify-content:center;
  `;

  div.innerHTML = `
    <div style="
      background:#fff;
      max-width:420px;
      padding:16px 18px;
      border-radius:12px;
      font-size:14px;
      line-height:1.45;
    ">
      <div style="font-weight:900;margin-bottom:8px;">
        Fehler melden
      </div>

      <textarea id="reportText"
        style="width:100%;height:90px;margin-bottom:10px;"
        placeholder="Was ist falsch oder problematisch?"></textarea>

      <div style="display:flex;gap:8px;">
        <button onclick="submitReport()">Absenden</button>
        <button onclick="closeReportPopup()">Abbrechen</button>
      </div>
    </div>
  `;

  document.body.appendChild(div);
}

function openReportPopup() {
  ensureReportPopup();
  document.getElementById("reportPopup").style.display = "flex";
}

function closeReportPopup() {
  const p = document.getElementById("reportPopup");
  if (p) p.style.display = "none";
}

async function submitReport() {
  const text = (document.getElementById("reportText")?.value || "").trim();
  if (!text) return alert("Bitte kurz beschreiben.");

  try {
    const payload = {
      entry_id: currentEntryId || null,
      text: text,
      url: location.href
    };

    const r = await fetch(`${SUPABASE_URL}/rest/v1/reports`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify(payload)
    });

    if (!r.ok) {
      const err = await r.text();
      throw new Error(err);
    }

    closeReportPopup();
    alert("Danke! Hinweis wurde übermittelt.");
  } catch (e) {
    console.error("REPORT ERROR:", e);
    alert("Fehler beim Senden. Bitte später erneut versuchen.");
  }
}

/* ================= NAV ================= */
document.addEventListener("click", (e) => {
  // ✅ Klicks auf Popups/Buttons dürfen NICHT zur Card-Navigation führen
  if (
    e.target.closest("#legalPopup") ||
    e.target.closest("#reportPopup") ||
    e.target.closest("#entryActions") // Social Buttons sollen nicht Navigation triggern
  ) return;

  // ✅ Report-Button (egal welche Variante) niemals durch Navigation kaputt machen
  if (
    e.target.closest("#reportBtn") ||
    e.target.closest("#reportButton") ||
    e.target.closest("[data-action='report']") ||
    e.target.closest(".report-btn") ||
    e.target.closest("#report")
  ) return;

  const c = e.target.closest(".entry-card");
  if (!c) return;
  history.pushState(null, "", "?id=" + c.dataset.id);
  loadEntry(c.dataset.id);
});

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
  initSearch();

  // ✅ Report-Button binding (falls er auf Startseite schon existiert)
  bindReportButton();

  const id = new URLSearchParams(location.search).get("id");
  if (id) loadEntry(id);
});
