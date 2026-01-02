/* =====================================================
   MarketShield – app.js (STABIL / CRASH-PROOF)
===================================================== */

let currentEntryId = null;

/* ================= SUPABASE ================= */
const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
const SUPABASE_KEY = "sb_publishable_JHb4LBhP26eI7BgDS1jIkw_4OYn3-F9";

async function supa(query) {
  const url = `${SUPABASE_URL}/rest/v1/${query}`;
  const r = await fetch(url, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  // Wenn Supabase Fehler liefert, zeigen wir ihn statt still weiterzumachen:
  const txt = await r.text();
  try {
    const json = JSON.parse(txt || "[]");
    if (!r.ok) throw new Error(`Supabase ${r.status}: ${txt}`);
    return json;
  } catch (e) {
    if (!r.ok) throw new Error(`Supabase ${r.status}: ${txt}`);
    throw e;
  }
}

/* ================= SAFE DOM ================= */
const getEl = (id) => document.getElementById(id);
const getResultsEl = () => getEl("results");

function showFatal(msg) {
  const box = getResultsEl();
  if (box) {
    box.innerHTML = `
      <div style="padding:12px;border:2px solid #c00;background:#fff3f3;border-radius:10px;">
        <div style="font-weight:900;margin-bottom:6px;">MarketShield Fehler</div>
        <div style="white-space:pre-wrap;line-height:1.5;">${escapeHtml(String(msg))}</div>
        <div style="margin-top:8px;opacity:.75;">Tipp: Öffne die Browser-Konsole (F12) für Details.</div>
      </div>
    `;
  } else {
    alert("MarketShield Fehler: " + msg);
  }
}

window.addEventListener("error", (e) => showFatal(e.message || e.error || "Unbekannter JS-Fehler"));
window.addEventListener("unhandledrejection", (e) => showFatal(e.reason || "Promise Fehler"));

/* ================= HELPERS ================= */
function escapeHtml(s = "") {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function shortText(text, max = 160) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max) + " …" : text;
}
function normalizeText(text) {
  if (!text) return "";
  return String(text)
    // doppelt oder einfach escapte Zeilenumbrüche → echte Umbrüche
    .replace(/\\n\\n/g, "\n\n")
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

function renderTextBlock(title, text) {
  if (!text) return "";
  return `
    <h3>${escapeHtml(title)}</h3>
    <div style="white-space:pre-wrap;line-height:1.6;">
      ${escapeHtml(normalizeText(text))}
    </div>
  `;
}
function renderJsonList(title, data) {
  if (!data) return "";
  let arr;
  try { arr = Array.isArray(data) ? data : JSON.parse(data); } catch { return ""; }
  if (!arr.length) return "";
  return `
    <h3>${escapeHtml(title)}</h3>
    <ul style="line-height:1.6;padding-left:18px;">
      ${arr.map(v => `<li>${escapeHtml(v)}</li>`).join("")}
    </ul>
  `;
}

async function saveSearchQuery(query) {
  if (!query || query.length < 2) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/search_queue`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query: query.trim() })
    });
  } catch {
    // niemals blockieren
  }
}
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
      padding:18px 20px;
      border-radius:12px;
      font-size:14px;
      line-height:1.45;
    ">
      <div style="font-weight:900;margin-bottom:8px;">
        Rechtlicher Hinweis
      </div>

      <div style="margin-bottom:14px;">
        MarketShield darf rechtlich keine absolute Wahrheit darstellen.
        Alle Inhalte dienen der sachlichen Einordnung auf Basis verfügbarer
        Informationen, typischer Zusammensetzungen und öffentlicher Quellen.
        Rezepturen, Chargen, Herstellerangaben und individuelle Verträglichkeiten
        können abweichen. Inhalte ersetzen keine medizinische oder rechtliche Beratung.
      </div>

      <button type="button" onclick="closeLegalPopup()">Schließen</button>
    </div>
  `;

  document.body.appendChild(div);
}

function openLegalPopup() {
  ensureLegalPopup();
  const p = document.getElementById("legalPopup");
  if (p) p.style.display = "flex";
}

function closeLegalPopup() {
  const p = document.getElementById("legalPopup");
  if (p) p.style.display = "none";
}
function renderMiniLegalPopupLink() {
  return `
    <div style="
      font-size:11px;
      line-height:1.2;
      opacity:0.6;
      margin:4px 0 6px 0;
      cursor:pointer;
      text-decoration:underline;"
      onclick="openLegalPopup()">
      Rechtlicher Hinweis!
    </div>
  `;
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

  const w = Math.round((Math.min(Math.max(n, 0), 10) / 10) * 80);

  let color = "#2e7d32";      // grün
  if (n >= 4 && n <= 7) color = "#f9a825"; // gelb
  if (n >= 8) color = "#c62828";           // rot

  return `
    <div style="width:80px;height:8px;background:#e0e0e0;border-radius:6px;overflow:hidden;">
      <div style="width:${w}px;height:8px;background:${color};"></div>
    </div>
  `;
}

function renderScoreBlock(score, processing, size = 13) {
  const h = renderHealth(score);
  const i = renderIndustry(processing);
  if (!h && !i) return "";

  const colW = 90;
  const labelStyle = `font-size:${size}px;opacity:0.85;line-height:1.2;`;
  const rowGap = 6;
  const colGap = 8;

  return `
    <div style="margin:12px 0;">
      ${h ? `
        <div style="display:grid;grid-template-columns:${colW}px 1fr;column-gap:${colGap}px;align-items:center;margin-bottom:${i ? rowGap : 0}px;">
          <div style="white-space:nowrap;">${h}</div>
          <div style="${labelStyle}">Gesundheitsscore</div>
        </div>
      ` : ""}

      ${i ? `
        <div style="display:grid;grid-template-columns:${colW}px 1fr;column-gap:${colGap}px;align-items:center;">
          <div style="white-space:nowrap;">${i}</div>
          <div style="${labelStyle}">Industrie-Verarbeitungsgrad</div>
        </div>
      ` : ""}
    </div>
  `;
}
function renderRatingBlock(avg = 0, count = 0) {
  const a = Number(avg) || 0;
  const c = Number(count) || 0;

  return `
    <div id="ratingBox"
         style="margin:6px 0 10px 0;font-size:12.5px;line-height:1.35;"
         itemprop="aggregateRating"
         itemscope
         itemtype="https://schema.org/AggregateRating">

      <meta itemprop="ratingValue" content="${a.toFixed(1)}">
      <meta itemprop="bestRating" content="5">
      <meta itemprop="ratingCount" content="${c}">

      <span style="opacity:.85;">
        <strong>Nutzerbewertung:</strong>
        ${a.toFixed(1).replace(".", ",")} von 5
        <span style="opacity:.7;">(${c})</span>
      </span>

      <!-- Sterne bewusst in eigener Zeile -->
      <div id="ratingStars"
           style="
             margin-top:2px;
             font-size:12px;
             line-height:1;
             letter-spacing:-0.5px;
             cursor:pointer;
             user-select:none;
           ">
        ${[1,2,3,4,5].map(n =>
          `<span data-star="${n}">${Math.round(a) >= n ? "★" : "☆"}</span>`
        ).join("")}
      </div>
    </div>
  `;
}



/* ================= KATEGORIEN ================= */
async function loadCategories() {
  const grid = document.querySelector(".category-grid");
  if (!grid) return; // wenn es nicht existiert, bricht nichts

  const data = await fetch("categories.json").then(r => r.json());
  grid.innerHTML = "";

  (data.categories || []).forEach(c => {
    const b = document.createElement("button");
    b.textContent = c.title;
    b.onclick = () => loadCategory(c.title);
    grid.appendChild(b);
  });
}

/* ================= LISTE ================= */
function renderList(data) {
  const results = getResultsEl();
  if (!results) return;

  results.innerHTML = (data || []).map(e => `
    <div class="entry-card" data-id="${e.id}">
      <div style="font-size:20px;font-weight:800;">${escapeHtml(e.title)}</div>
      ${renderScoreBlock(e.score, e.processing_score, 13)}
      <div style="font-size:15px;line-height:1.4;">${escapeHtml(shortText(e.summary, 160))}</div>
    </div>
  `).join("");
}

/* ================= DETAIL ================= */
async function loadEntry(id) {
  const results = getResultsEl();
  if (!results) return;

  const data = await supa(`entries_with_ratings?id=eq.${id}`);
  const e = data && data[0];
  if (!e) return;

  currentEntryId = id;

  results.innerHTML = `
    <h2>${escapeHtml(e.title)}</h2>
    ${renderRatingBlock(e.rating_avg, e.rating_count)}
    ${renderScoreBlock(e.score, e.processing_score, 14)}
    ${renderMiniLegalPopupLink()}
    ${renderTextBlock("Zusammenfassung", e.summary)}
    ${renderTextBlock("Wirkmechanismus", e.mechanism)}
    ${renderTextBlock("Wissenschaftlicher Hinweis", e.scientific_note)}
    ${renderJsonList("Positive Effekte", e.effects_positive)}
    ${renderJsonList("Negative Effekte", e.effects_negative)}
    ${renderJsonList("Risikogruppen", e.risk_groups)}
    ${renderJsonList("Synergien / Wechselwirkungen", e.synergy)}
    ${renderJsonList("Natürliche Quellen", e.natural_sources)}
    ${renderJsonList("Tags", e.tags)}
    <div id="entryActions"></div>
  `;

  renderEntryActions(e.title);
  updateBackHome();
}
const stars = document.getElementById("ratingStars");
if (stars) {
  stars.querySelectorAll("span").forEach(star => {
    star.addEventListener("click", async (ev) => {
      ev.preventDefault();
      ev.stopPropagation();

      const rating = Number(star.dataset.star);
      if (!rating || !currentEntryId) return;

      try {
        await fetch(`${SUPABASE_URL}/rest/v1/entry_ratings`, {
          method: "POST",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            entry_id: currentEntryId,
            rating
          })
        });

        // 🔁 neu laden → Durchschnitt + Anzahl aktualisiert
        loadEntry(currentEntryId);

      } catch (err) {
        showFatal(err);
      }
    });
  });
}

/* ================= SHARE / ACTIONS ================= */
function renderEntryActions(title) {
  const box = document.getElementById("entryActions");
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
    </div>
  `;
}

/* ================= REPORT ================= */
function initReport() {
  const btn = document.getElementById("reportBtn");
  const modal = document.getElementById("reportModal");
  const close = document.getElementById("closeReportModal");
  const form = document.getElementById("reportForm");
  if (!btn || !modal || !form || !close) return;

  btn.onclick = () => modal.classList.add("active");
  close.onclick = () => modal.classList.remove("active");

  form.onsubmit = async (e) => {
    e.preventDefault();
    const description = (form.description?.value || "").trim();
    if (!description) return alert("Bitte Beschreibung eingeben.");

    await fetch(`${SUPABASE_URL}/rest/v1/reports`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        description,
        source: "community",
        status: "new",
        entry_id: currentEntryId || null
      })
    });

    form.reset();
    modal.classList.remove("active");
    alert("Meldung gesendet. Danke!");
  };
}

/* ================= BACK HOME ================= */
function initBackHome() {
  const back = document.getElementById("backHome");
  if (!back) return;

  back.onclick = () => {
    history.pushState(null, "", location.pathname);
    const results = getResultsEl();
    if (results) results.innerHTML = "";
    updateBackHome();
  };

  window.addEventListener("popstate", updateBackHome);
}

function updateBackHome() {
  const back = document.getElementById("backHome");
  if (!back) return;
  back.style.display = location.search.includes("id=") ? "block" : "none";
}

/* ================= SEARCH ================= */
function initSearch() {
  const input = document.getElementById("searchInput");
  const results = getResultsEl();

  if (!input || !results) return;

  input.addEventListener("input", async () => {
    try {
      const q = input.value.trim();
      if (q.length < 2) { results.innerHTML = ""; return; }
      const enc = encodeURIComponent(q);
      const data = await supa(
        `entries?select=id,title,summary,score,processing_score&or=(title.ilike.%25${enc}%25,summary.ilike.%25${enc}%25)`
      );
      renderList(data);
    } catch (err) {
      showFatal(err);
    }
  });

  input.addEventListener("keydown", async (e) => {
    if (e.key !== "Enter") return;
    try {
      const q = input.value.trim();
      if (q.length < 2) return;
      saveSearchQuery(q);
      const enc = encodeURIComponent(q);
      const data = await supa(
        `entries?select=id,title,summary,score,processing_score&or=(title.ilike.%25${enc}%25,summary.ilike.%25${enc}%25)`
      );
      renderList(data);
    } catch (err) {
      showFatal(err);
    }
  });
}

/* ================= LOAD CATEGORY ================= */
async function loadCategory(cat) {
  try {
    const data = await supa(`entries?select=id,title,summary,score,processing_score&category=eq.${cat}`);
    renderList(data);
  } catch (err) {
    showFatal(err);
  }
}

/* ================= CARD CLICK ================= */
document.addEventListener("click", (e) => {
  const card = e.target.closest(".entry-card");
  if (!card) return;
  const id = card.dataset.id;
  history.pushState(null, "", "?id=" + id);
  loadEntry(id).catch(showFatal);
});

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  try {
    loadCategories().catch(showFatal);
    initSearch();
    initReportFabFinal();
    initBackHome();

    const params = new URLSearchParams(location.search);
    const id = params.get("id");
    if (id) loadEntry(id).catch(showFatal);
  } catch (err) {
    showFatal(err);
  }
});
function initReportFabFinal() {
  const fab   = document.getElementById("msReportFab");
  const modal = document.getElementById("reportModal");
  const close = document.getElementById("closeReportModal");
  const form  = document.getElementById("reportForm");

  if (!fab || !modal || !form) {
    console.error("ReportFab: Elemente fehlen");
    return;
  }

  // 🔹 FAB klickbar erzwingen
  fab.style.pointerEvents = "auto";
  fab.style.cursor = "pointer";
  fab.style.zIndex = "99999";

  // 🔹 Modal öffnen
  fab.onclick = (e) => {
    e.preventDefault();
    modal.classList.add("open");
  };

  // 🔹 Modal schließen
  if (close) {
    close.onclick = () => modal.classList.remove("open");
  }

  // 🔹 Report senden → Supabase
  form.onsubmit = async (e) => {
    e.preventDefault();

    const description = form.description?.value?.trim();
    if (!description) {
      alert("Bitte Beschreibung eingeben.");
      return;
    }

    await fetch(`${SUPABASE_URL}/rest/v1/reports`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        description,
        source: "community",
        status: "new",
        entry_id: currentEntryId || null
      })
    });

    form.reset();
    modal.classList.remove("open");
    alert("Meldung gesendet. Danke!");
  };
}
