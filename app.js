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

function normalizeText(text) {
  return String(text || "")
    .replace(/\*\*|##+|__+|~~+|`+/g, "")
    .replace(/\r\n|\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function shortText(t, max = 160) {
  t = normalizeText(t);
  return t.length > max ? t.slice(0, max) + " …" : t;
}

/* ================= SCORES (LOCKED) ================= */

/* Gesundheit:
   0 = nichts
   <20 = ❗⚠️❗  (EXAKT wie früher)
*/
function renderHealth(score) {
  const n = Number(score);
  if (!Number.isFinite(n) || n <= 0) return "";

  if (n >= 80) return "💚💚💚";
  if (n >= 60) return "💚💚";
  if (n >= 40) return "💚";
  if (n >= 20) return "💛";

  return "❗⚠️❗";
}

/* Industrie-Verarbeitungsgrad:
   1–10 | schmal | grün → rot
*/
function renderIndustry(score) {
  const n = Number(score);
  if (!Number.isFinite(n) || n <= 0) return "";

  const clamped = Math.min(10, Math.max(1, n));
  const MAX_WIDTH = 90;
  const width = Math.round((clamped / 10) * MAX_WIDTH);
  const hue = Math.round(120 - (clamped - 1) * (120 / 9));

  return `
    <div style="margin-top:6px;">
      <div style="display:flex;align-items:center;gap:8px;font-size:13px;opacity:.85;">
        <div style="width:${MAX_WIDTH}px;height:6px;background:#e0e0e0;border-radius:4px;overflow:hidden;">
          <div style="width:${width}px;height:6px;background:hsl(${hue},85%,45%);border-radius:4px;"></div>
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
          <div>${h}</div>
          <div style="opacity:.8;">Gesundheit</div>
        </div>
      ` : ""}
      ${i || ""}
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
      <div style="font-size:15px;">${escapeHtml(shortText(e.summary))}</div>
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
    <div style="white-space:pre-wrap;line-height:1.6;">
      ${escapeHtml(normalizeText(e.summary))}
    </div>
    <div id="entryActions" style="margin-top:28px;"></div>
  `;

  renderEntryActions(e.title);
}

/* ================= SOCIAL / ACTIONS ================= */
function renderEntryActions(title) {
  const box = $("entryActions");
  if (!box) return;

  const url = location.href;
  const encUrl = encodeURIComponent(url);
  const encTitle = encodeURIComponent(title + " – MarketShield");

  box.innerHTML = `
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <button id="btnCopy">🔗 Kopieren</button>
      <button id="btnPrint">🖨️ Drucken</button>
      <button id="btnTelegram">Telegram</button>
      <button id="btnWhatsapp">WhatsApp</button>
      <button id="btnX">X</button>
      <button id="btnFacebook">Facebook</button>
    </div>
  `;

  $("btnCopy").onclick = () => navigator.clipboard.writeText(url);
  $("btnPrint").onclick = () => window.print();
  $("btnTelegram").onclick = () => window.open(`https://t.me/share/url?url=${encUrl}&text=${encTitle}`, "_blank");
  $("btnWhatsapp").onclick = () => window.open(`https://wa.me/?text=${encTitle}%20${encUrl}`, "_blank");
  $("btnX").onclick = () => window.open(`https://twitter.com/intent/tweet?url=${encUrl}&text=${encTitle}`, "_blank");
  $("btnFacebook").onclick = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encUrl}`, "_blank");
}

/* ================= HOME ================= */
async function loadHome() {
  currentEntryId = null;
  renderList(await supa(
    "entries?select=id,title,summary,score,processing_score&order=title.asc&limit=50"
  ));
}

/* ================= SEARCH ================= */
function initSearch() {
  const input = $("searchInput");
  if (!input) return;

  input.addEventListener("input", async (e) => {
    const q = e.target.value.trim();
    if (q.length < 2) return loadHome();

    const enc = encodeURIComponent(q);
    renderList(await supa(
      `entries?select=id,title,summary,score,processing_score&title=ilike.%25${enc}%25`
    ));
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
    `entries?select=id,title,summary,score,processing_score&category=eq.${cat}`
  ));
}

/* ================= REPORT ================= */
const elReportBtn   = $("reportBtn");
const elReportModal = $("reportModal");
const elReportForm  = $("reportForm");
const elReportClose = $("closeReportModal");

if (elReportBtn && elReportModal) elReportBtn.onclick = () => elReportModal.style.display = "block";
if (elReportClose && elReportModal) elReportClose.onclick = () => elReportModal.style.display = "none";

if (elReportForm) {
  elReportForm.onsubmit = async (e) => {
    e.preventDefault();
    const txt = elReportForm.description?.value.trim();
    if (!txt || txt.length < 3) return;

    await supa("reports", {
      method: "POST",
      body: { description: txt, entry_id: currentEntryId }
    });

    elReportForm.reset();
    elReportModal.style.display = "none";
    alert("Danke! Meldung wurde gespeichert.");
  };
}

/* ================= RECHTLICHER HINWEIS ================= */
const elLegalLink  = $("legalLink");
const elLegalModal = $("legalModal");
const elLegalClose = $("closeLegalModal");

if (elLegalLink && elLegalModal) {
  elLegalLink.onclick = (e) => {
    e.preventDefault();
    elLegalModal.style.display = "block";
  };
}
if (elLegalClose && elLegalModal) elLegalClose.onclick = () => elLegalModal.style.display = "none";

/* ================= NAVIGATION ================= */
document.addEventListener("click", e => {
  const card = e.target.closest(".entry-card");
  if (!card) return;
  history.pushState({}, "", "?id=" + card.dataset.id);
  loadEntry(card.dataset.id);
});

const elBackHome = $("backHome");
if (elBackHome) {
  elBackHome.onclick = (e) => {
    e.preventDefault();
    history.pushState({}, "", location.pathname);
    loadHome();
  };
}

window.onpopstate = () => {
  const id = new URLSearchParams(location.search).get("id");
  if (id) loadEntry(id);
  else loadHome();
};

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
  initSearch();

  const id = new URLSearchParams(location.search).get("id");
  if (id) loadEntry(id);
  else loadHome();
});
