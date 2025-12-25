/* =====================================================
   MarketShield – app.js (FINAL / STABIL)
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
  return r.json();
}

/* ================= HELPERS ================= */
const $ = (id) => document.getElementById(id);

function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* KI-Artefakte entfernen */
function cleanText(t = "") {
  return String(t)
    .replace(/:contentReference\[[^\]]*]\{[^}]*}/g, "")
    .replace(/\[oaicite:\d+]/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
}

function shortText(t, max = 160) {
  if (!t) return "";
  return t.length > max ? t.slice(0, max) + " …" : t;
}

/* ================= FIX-ZONE CSS (nach Monster-CSS) ================= */
(function injectFixCSS() {
  if (document.getElementById("ms-fix-css")) return;
  const s = document.createElement("style");
  s.id = "ms-fix-css";
  s.textContent = `
    .ms-fix-wrap{
      max-width:900px;
      margin:0 auto;
      padding:0 16px;
    }
    .ms-legal-tooltip{
      position:absolute!important;
      display:inline-block!important;
      width:max-content!important;
      max-width:260px!important;
      min-width:unset!important;
      padding:6px 8px!important;
      background:#222!important;
      color:#fff!important;
      font-size:12px!important;
      line-height:1.35!important;
      border-radius:4px!important;
      box-shadow:0 4px 10px rgba(0,0,0,.25)!important;
      white-space:normal!important;
      z-index:9999!important;
    }
    .ms-text p{
      margin:0 0 12px 0;
      line-height:1.6;
    }
    .ms-table-wrap{
      overflow-x:auto;
      margin:12px 0;
    }
    .ms-table-wrap table{
      border-collapse:collapse;
      min-width:600px;
      width:100%;
    }
    .ms-table-wrap th,
    .ms-table-wrap td{
      border:1px solid #ddd;
      padding:8px;
      text-align:left;
    }
    .ms-table-wrap th{
      background:#f5f5f5;
      font-weight:600;
    }
  `;
  document.head.appendChild(s);
})();

/* ================= BACK-HOME FIX (HTML-Element nutzen) ================= */
function fixBackHome() {
  const back = $("backHome");
  if (!back) return;

  if (!back.parentNode.classList.contains("ms-fix-wrap")) {
    const wrap = document.createElement("div");
    wrap.className = "ms-fix-wrap";
    back.parentNode.insertBefore(wrap, back);
    wrap.appendChild(back);
  }

  back.onclick = () => {
    history.pushState(null, "", location.pathname);
    $("results").innerHTML = "";
    loadCategories();
    back.style.display = "none";
  };
}

/* ================= TOOLTIP ================= */
function toggleLegalTooltip(btn) {
  let tip = $("legalTooltip");
  if (tip) {
    tip.remove();
    return;
  }

  tip = document.createElement("div");
  tip.id = "legalTooltip";
  tip.className = "ms-legal-tooltip";
  tip.textContent =
    "MarketShield darf rechtlich keine absolute Wahrheit darstellen. Inhalte dienen der Einordnung.";

  document.body.appendChild(tip);

  const r = btn.getBoundingClientRect();
  tip.style.top = `${window.scrollY + r.bottom + 6}px`;
  tip.style.left = `${window.scrollX + r.left}px`;

  document.addEventListener(
    "click",
    (e) => {
      if (!tip.contains(e.target) && e.target !== btn) tip.remove();
    },
    { once: true }
  );
}

/* ================= TEXT + TABELLEN ================= */
function renderText(text) {
  const lines = cleanText(text).split("\n");
  let html = "";
  let i = 0;

  const isSep = (s) =>
    /^(\|?\s*:?-{3,}:?\s*)+(\|?\s*)$/.test((s || "").trim());

  const splitRow = (r) => {
    let a = r.split("|").map((v) => v.trim());
    if (a[0] === "") a.shift();
    if (a[a.length - 1] === "") a.pop();
    return a;
  };

  while (i < lines.length) {
    if (lines[i].includes("|") && isSep(lines[i + 1])) {
      const head = splitRow(lines[i]);
      html += `<div class="ms-table-wrap"><table><thead><tr>`;
      head.forEach((h) => (html += `<th>${escapeHtml(h)}</th>`));
      html += `</tr></thead><tbody>`;
      i += 2;
      while (lines[i] && lines[i].includes("|")) {
        const c = splitRow(lines[i]);
        html += "<tr>";
        head.forEach((_, k) => {
          html += `<td>${escapeHtml(c[k] || "")}</td>`;
        });
        html += "</tr>";
        i++;
      }
      html += "</tbody></table></div>";
      continue;
    }

    if (lines[i].trim() === "") {
      html += `<p></p>`;
    } else {
      html += `<p>${escapeHtml(lines[i])}</p>`;
    }
    i++;
  }
  return `<div class="ms-text">${html}</div>`;
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
    <div style="width:80px;height:8px;background:#e0e0e0;border-radius:6px;overflow:hidden">
      <div style="width:${w}px;height:8px;background:#2e7d32"></div>
    </div>`;
}

function renderScoreBlock(score, processing) {
  const h = renderHealth(score);
  const i = renderIndustry(processing);
  if (!h && !i) return "";
  return `
    <div style="margin:12px 0">
      ${h ? `<div>${h} <span style="opacity:.7">Gesundheitsscore</span></div>` : ""}
      ${i ? `<div style="margin-top:6px">${i} <span style="opacity:.7">Industrie-Verarbeitungsgrad</span></div>` : ""}
    </div>`;
}

/* ================= LISTE ================= */
function renderList(data) {
  $("results").innerHTML = (data || [])
    .map(
      (e) => `
    <div class="entry-card" data-id="${e.id}">
      <div style="font-size:20px;font-weight:800">${escapeHtml(e.title)}</div>
      ${renderScoreBlock(e.score, e.processing_score)}
      <div>${escapeHtml(shortText(cleanText(e.summary)))}</div>
    </div>`
    )
    .join("");
}

/* Klick-Delegation */
document.addEventListener("click", (e) => {
  const card = e.target.closest(".entry-card");
  if (!card) return;
  history.pushState(null, "", "?id=" + card.dataset.id);
  loadEntry(card.dataset.id);
});

/* ================= DETAIL ================= */
async function loadEntry(id) {
  const d = await supa(`entries?select=*&id=eq.${id}`);
  const e = d && d[0];
  if (!e) return;

  currentEntryId = id;

  $("results").innerHTML = `
    <h2>${escapeHtml(e.title)}</h2>
    ${renderScoreBlock(e.score, e.processing_score)}

    <button
      type="button"
      onclick="toggleLegalTooltip(this)"
      style="margin:6px 0 8px 0;padding:2px 6px;font-size:12px;cursor:pointer">
      Rechtliche Info
    </button>

    ${renderText(e.summary)}
    ${e.mechanism ? `<h3>Wirkmechanismus</h3>${renderText(e.mechanism)}` : ""}
    ${e.scientific_note ? `<h3>Wissenschaftlicher Hinweis</h3>${renderText(e.scientific_note)}` : ""}
  `;

  const back = $("backHome");
  if (back) back.style.display = "block";
}

/* ================= KATEGORIEN ================= */
async function loadCategories() {
  const grid = document.querySelector(".category-grid");
  if (!grid) return;
  const data = await fetch("categories.json").then((r) => r.json());
  grid.innerHTML = "";
  (data.categories || []).forEach((c) => {
    const b = document.createElement("button");
    b.textContent = c.title;
    b.onclick = () => loadCategory(c.title);
    grid.appendChild(b);
  });
}

async function loadCategory(cat) {
  const d = await supa(
    `entries?select=id,title,summary,score,processing_score&category=eq.${encodeURIComponent(
      cat
    )}`
  );
  renderList(d);
}

/* ================= SUCHE ================= */
function initSearch() {
  const input = $("searchInput");
  if (!input) return;
  input.addEventListener("input", async () => {
    const q = input.value.trim();
    if (q.length < 2) {
      $("results").innerHTML = "";
      return;
    }
    const e = encodeURIComponent(q);
    const d = await supa(
      `entries?select=id,title,summary,score,processing_score&or=(title.ilike.%25${e}%25,summary.ilike.%25${e}%25)`
    );
    renderList(d);
  });
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  fixBackHome();
  loadCategories();
  initSearch();

  const p = new URLSearchParams(location.search);
  const id = p.get("id");
  if (id) loadEntry(id);
});
