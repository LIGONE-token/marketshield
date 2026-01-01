/* =====================================================
   MarketShield – app.js
   STABIL / BEREINIGT / FUNKTIONSIDENTISCH
===================================================== */

let currentEntryId = null;

/* ================= SUPABASE ================= */
const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
const SUPABASE_KEY = "sb_publishable_JHb4LBhP26eI7BgDS1jIkw_4OYn3-F9";

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
    .replace(/>/g, "&gt;");
}

function normalizeText(text) {
  if (!text) return "";
  return String(text)
    .replace(/\*\*/g, "")
    .replace(/##+/g, "")
    .replace(/__+/g, "")
    .replace(/~~+/g, "")
    .replace(/`+/g, "")
    .replace(/\r\n|\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanId(id) {
  return String(id || "").trim();
}

function shortText(t, max = 160) {
  t = normalizeText(t);
  return t.length > max ? t.slice(0, max) + " …" : t;
}

/* ================= USER HASH ================= */
function getUserHash() {
  let h = localStorage.getItem("ms_user_hash");
  if (!h) {
    h = crypto.randomUUID
      ? crypto.randomUUID()
      : "ms-" + Math.random().toString(36).slice(2) + Date.now();
    localStorage.setItem("ms_user_hash", h);
  }
  return h;
}

/* ================= SCORES (UNVERÄNDERT) ================= */
function renderHealth(score) {
  const n = Number(score);
  if (!Number.isFinite(n) || n === 0) return "";
  if (n >= 80) return "💚💚💚";
  if (n >= 60) return "💚💚";
  if (n >= 40) return "💚";
  if (n >= 20) return "💛";
  return "⚠️❗⚠️";
}

function renderIndustry(score) {
  const n = Number(score);
  if (!Number.isFinite(n) || n === 0) return "";

  const clamped = Math.min(Math.max(n, 0), 10);
  const w = Math.round((clamped / 10) * 80);

  let color = "#2e7d32";
  if (clamped >= 4 && clamped <= 6) color = "#f9a825";
  if (clamped >= 7) color = "#c62828";

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
        <div style="display:grid;grid-template-columns:90px 1fr;gap:8px;">
          <div>${h}</div>
          <div style="font-size:${size}px;opacity:.85;">Gesundheitsscore</div>
        </div>` : ""}
      ${i ? `
        <div style="display:grid;grid-template-columns:90px 1fr;gap:8px;">
          <div>${i}</div>
          <div style="font-size:${size}px;opacity:.85;">Industrie-Verarbeitungsgrad</div>
        </div>` : ""}
    </div>`;
}

/* ================= USER RATING ================= */
function renderUserRating(avg, count) {
  const full = Number.isFinite(avg) ? Math.round(avg) : 0;
  const empty = 5 - full;
  return `
    <div class="user-rating" data-rate style="cursor:pointer;">
      ${"⭐".repeat(full)}${"☆".repeat(empty)}
      <span style="font-size:13px;opacity:.7;">(${count || 0} Bewertungen)</span>
    </div>`;
}

/* ================= LISTE ================= */
function renderList(data) {
  const box = $("results");
  if (!box) return;
  box.innerHTML = (data || []).map(e => `
    <div class="entry-card" data-id="${e.id}">
      <strong>${escapeHtml(e.title)}</strong>
      ${renderUserRating(e.rating_avg, e.rating_count)}
      ${renderScoreBlock(e.score, e.processing_score)}
      <div>${escapeHtml(shortText(e.summary))}</div>
    </div>`).join("");
}

/* ================= ENTRY ================= */
async function loadEntry(id) {
  const box = $("results");
  if (!box) return;

  const d = await supa(`entries_with_ratings?select=*&id=eq.${cleanId(id)}`);
  const e = d[0];
  if (!e) return;

  currentEntryId = e.id;

  box.innerHTML = `
    <h2>${escapeHtml(e.title)}</h2>
    ${renderUserRating(e.rating_avg, e.rating_count)}
    ${renderScoreBlock(e.score, e.processing_score)}
    <div>${normalizeText(e.summary)}</div>
    <div id="entryActions"></div>`;

  renderEntryActions(e.title);
}

/* ================= SOCIAL ================= */
function renderEntryActions(title) {
  const box = $("entryActions");
  if (!box) return;

  const url = location.href;
  const t = encodeURIComponent(title + " – MarketShield");
  const u = encodeURIComponent(url);

  box.innerHTML = `
    <button onclick="navigator.clipboard.writeText('${url}')">🔗 Kopieren</button>
    <button onclick="window.print()">🖨️ Drucken</button>
    <button onclick="window.open('https://t.me/share/url?url=${u}&text=${t}')">Telegram</button>`;
}

/* ================= NAV ================= */
document.addEventListener("click", (e) => {
  const card = e.target.closest(".entry-card");
  if (!card) return;
  history.pushState({}, "", "?id=" + card.dataset.id);
  loadEntry(card.dataset.id);
});

/* ================= PROGRESS (FIXIERT) ================= */
function initProgress() {
  const box = document.getElementById("msProgressBox");
  if (!box) return;

  box.innerHTML = `
    <div id="msProgressToggle">🛡 Dein Beitrag ▸</div>
    <div id="msProgressContent" style="display:none">
      <strong>🛡 Dein Beitrag</strong><br><br>
      <button id="msProgressClose">schließen</button>
    </div>`;

  const t = $("msProgressToggle");
  const c = $("msProgressContent");
  const x = $("msProgressClose");

  t.onclick = () => { t.style.display="none"; c.style.display="block"; };
  x.onclick = () => { c.style.display="none"; t.style.display="block"; };
}

/* ================= REPORT FAB (FIXIERT) ================= */
function initReportFab() {
  const fab = $("msReportFab");
  const modal = $("reportModal");
  if (!fab || !modal) return;

  fab.style.position = "fixed";
  fab.style.zIndex = "2147483647";
  fab.style.pointerEvents = "auto";

  fab.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    modal.style.display = "flex";
  };
}

/* ================= INIT (EINMALIG) ================= */
document.addEventListener("DOMContentLoaded", () => {
  initProgress();
  initReportFab();

  const id = new URLSearchParams(location.search).get("id");
  if (id) loadEntry(id);
});
/* =====================================================
   EMERGENCY: PROGRESS DISABLE
   (stellt Systemzustand vor Progress wieder her)
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const box = document.getElementById("msProgressBox");
  if (box) {
    box.innerHTML = "";
    box.style.display = "none";
  }
});
/* =====================================================
   FINAL: REPORT FAB – SAFE RESTORE
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const fab = document.getElementById("msReportFab");
  const modal = document.getElementById("reportModal");

  if (!fab || !modal) return;

  // Schutz gegen Überschreibung
  if (fab.dataset.bound === "1") return;
  fab.dataset.bound = "1";

  // Erzwinge Klickbarkeit
  fab.style.position = "fixed";
  fab.style.zIndex = "2147483647";
  fab.style.pointerEvents = "auto";

  // EINZIGER Klick-Handler
  fab.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    modal.style.display = "flex";
  };
});
