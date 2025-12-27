/* =====================================================
   MarketShield – app.js (STABIL / FINAL / REPORT FORM OK)
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
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;");
}

function normalizeText(text) {
  if (!text) return "";
  return String(text)
    .replace(/\*\*/g,"")
    .replace(/##+/g,"")
    .replace(/__+/g,"")
    .replace(/~~+/g,"")
    .replace(/`+/g,"")
    .replace(/\r\n/g,"\n")
    .replace(/\r/g,"\n")
    .replace(/\n{3,}/g,"\n\n")
    .trim();
}

function shortText(t, max = 160) {
  t = normalizeText(t).replace(/\s+/g," ").trim();
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
  const v = Math.max(0, Math.min(10, n));
  const w = Math.round((v / 10) * 80);

  let color = "#2e7d32";
  if (v >= 4) color = "#f9a825";
  if (v >= 7) color = "#c62828";

  return `
    <div style="width:80px;height:8px;background:#e0e0e0;border-radius:6px;">
      <div style="width:${w}px;height:8px;background:${color};border-radius:6px;"></div>
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
      ${i ? `<div style="display:grid;grid-template-columns:90px 1fr;gap:8px;margin-top:6px;">
        <div>${i}</div><div>Industrie-Verarbeitungsgrad</div></div>` : ""}
    </div>`;
}

/* ================= LISTE ================= */
function renderList(data) {
  const box = $("results");
  if (!box) return;

  box.innerHTML = (data || []).map(e => `
    <div class="entry-card" data-id="${e.id}">
      <div style="font-size:20px;font-weight:800;">
        ${escapeHtml(e.title)}
      </div>
      ${renderScoreBlock(e.score, e.processing_score)}
      <div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
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
    <div class="entry-card" data-id="${e.id}">
      <h2>${escapeHtml(e.title)}</h2>
      ${renderScoreBlock(e.score, e.processing_score)}

      <h3>Zusammenfassung</h3>
      <div style="white-space:pre-wrap;">
        ${escapeHtml(normalizeText(e.summary))}
      </div>

      <!-- REPORT BUTTON: TEXT & POSITION UNVERÄNDERT -->
      <button id="reportBtn" type="button">
        Produkt / Problem melden<br>
        <small>Anonym · in 1 Minute · hilft allen</small>
      </button>

      <div id="entryActions"></div>
    </div>
  `;
}

/* ================= REPORT FORM (JETZT VOLLSTÄNDIG) ================= */
function ensureReportModal() {
  if ($("reportModal")) return;

  const m = document.createElement("div");
  m.id = "reportModal";
  m.style.cssText =
    "display:none;position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.45);align-items:center;justify-content:center;";

  m.innerHTML = `
    <form id="reportForm"
      style="background:#fff;padding:16px;border-radius:12px;width:90%;max-width:420px">
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

  m.addEventListener("click", e => {
    if (e.target === m) m.style.display = "none";
  });

  document.body.appendChild(m);

  $("closeReport").onclick = () => m.style.display = "none";

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

/* Klick auf Reportbutton */
document.addEventListener("click", (e) => {
  const btn = e.target.closest("#reportBtn");
  if (!btn) return;

  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  ensureReportModal();
  $("reportModal").style.display = "flex";
});

/* ================= SEARCH ================= */
async function smartSearch(q) {
  const t = q.trim();
  if (t.length < 2) return [];
  const enc = encodeURIComponent(t);
  return await supa(
    `entries?select=id,title,summary,score,processing_score&or=(title.ilike.%25${enc}%25,summary.ilike.%25${enc}%25)`
  );
}

function initSearch() {
  const i = $("searchInput");
  if (!i) return;

  i.addEventListener("input", async () => {
    const q = i.value.trim();
    if (q.length < 2) return;
    renderList(await smartSearch(q));
  });
}

/* ================= KATEGORIEN ================= */
async function loadCategories() {
  const g = document.querySelector(".category-grid");
  if (!g) return;

  const d = await fetch("categories.json").then(r => r.json());
  g.innerHTML = "";
  (d.categories || []).forEach(c => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = c.title;
    b.onclick = () => loadCategory(c.title);
    g.appendChild(b);
  });
}

async function loadCategory(cat) {
  renderList(await supa(
    `entries?select=id,title,summary,score,processing_score&category=eq.${encodeURIComponent(cat)}`
  ));
}

/* ================= NAVIGATION ================= */
document.addEventListener("click", (e) => {
  if (e.target.closest("#reportBtn")) return;

  const card = e.target.closest(".entry-card");
  if (!card) return;

  history.pushState(null, "", "?id=" + card.dataset.id);
  loadEntry(card.dataset.id);
});

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
  initSearch();

  const id = new URLSearchParams(location.search).get("id");
  if (id) loadEntry(id);
});
