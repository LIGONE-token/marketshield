/* =====================================================
   MarketShield – app.js (STABIL / REPARIERT)
===================================================== */

let currentEntryId = null;

/* ================= SUPABASE ================= */
const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
const SUPABASE_KEY = "sb_publishable_JHb4LBhP26eI7BgDS1jIkw_4OYn3-F9";

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

function renderMarkdownTable(text) {
  if (!text.includes("|") || !text.includes("---")) return text;

  const lines = text.trim().split("\n").filter(l => l.trim());
  if (lines.length < 3) return text;

  const header = lines[0].split("|").map(c => c.trim()).filter(Boolean);
  const rows = lines.slice(2).map(line =>
    line.split("|").map(c => c.trim()).filter(Boolean)
  );

  let html = `<table class="ms-table"><thead><tr>`;
  header.forEach(h => html += `<th>${h}</th>`);
  html += `</tr></thead><tbody>`;

  rows.forEach(r => {
    html += `<tr>`;
    r.forEach(c => html += `<td>${c}</td>`);
    html += `</tr>`;
  });

  html += `</tbody></table>`;
  return html;
}
function renderContent(text) {
  if (!text) return "";
  if (text.includes("|") && text.includes("---")) {
    return renderMarkdownTable(text);
  }
  return text
    .split("\n\n")
    .map(p => `<p>${p}</p>`)
    .join("");
}

function shortText(t, max = 160) {
  t = normalizeText(t);
  return t.length > max ? t.slice(0, max) + " …" : t;
}
/* ================= USER HASH ================= */
function getUserHash() {
  let h = localStorage.getItem("ms_user_hash");
  if (!h) {
    h = crypto.randomUUID();
    localStorage.setItem("ms_user_hash", h);
  }
  return h;
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

  const clamped = Math.min(Math.max(n, 0), 10);
  const w = Math.round((clamped / 10) * 80);

  let color = "#2e7d32"; // grün (wenig verarbeitet)
  if (clamped >= 4 && clamped <= 6) color = "#f9a825"; // gelb
  if (clamped >= 7) color = "#c62828"; // rot

  return `
    <div style="width:80px;height:8px;background:#e0e0e0;border-radius:6px;">
      <div style="width:${w}px;height:8px;background:${color};border-radius:6px;"></div>
    </div>
  `;
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
/* ================= USER RATING (DISPLAY + CLICK) ================= */
function renderUserRating(avg, count) {
  const c = Number(count) || 0;
  const a = Number(avg);

  const full = Number.isFinite(a) ? Math.round(a) : 0;
  const empty = 5 - full;

  return `
    <div class="user-rating"
         data-rate
         style="margin:6px 0;font-size:15px;cursor:pointer;">
      ${"⭐".repeat(full)}${"☆".repeat(empty)}
      <span style="font-size:13px;opacity:.7;">
        (${c} Bewertungen)
      </span>
    </div>
  `;
}


/* ================= LISTE ================= */
function renderList(data) {
  const box = $("results");
  if (!box) return;

  box.innerHTML = (data || []).map(e => `
    <div class="entry-card" data-id="${e.id}">
      <div style="font-size:20px;font-weight:800;">${escapeHtml(e.title)}</div>
      ${renderUserRating(e.rating_avg, e.rating_count)}
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

${renderUserRating(e.rating_avg, e.rating_count)}

${renderScoreBlock(e.score, e.processing_score)}


    <h3>Zusammenfassung</h3>
    <div style="white-space:pre-wrap;line-height:1.6;">
      ${escapeHtml(normalizeText(e.summary))}
    </div>

    <div id="entryActions"></div>
  `;

  renderEntryActions(e.title);
}

/* ================= SOCIAL ================= */
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


function initSearch() {
  const input = $("searchInput");
  const box = $("results");
  if (!input || !box) return;

  input.addEventListener("input", async () => {
    const q = input.value.trim();
    if (q.length < 2) return box.innerHTML = "";
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

/* ================= NAV (FIXED) ================= */
document.getElementById("results")?.addEventListener("click", (e) => {
  const c = e.target.closest(".entry-card");
  if (!c) return;

  e.preventDefault();
  e.stopPropagation();

  history.pushState(null, "", "?id=" + c.dataset.id);
  loadEntry(c.dataset.id);
});

/* ================= BACK TO HOME ================= */
document.addEventListener("click", (e) => {
  const btn = e.target.closest("#backHome, .back-home, [data-home]");
  if (!btn) return;

  e.preventDefault();
  history.pushState({}, "", location.pathname);
  currentEntryId = null;

  document.getElementById("results").innerHTML = "";
  loadCategories();
});
/* ================= REPORT BUTTON – WITH PAGE ================= */
document.addEventListener("click", (e) => {
  const btn = e.target.closest("#reportBtn, .report-btn, [data-report]");
  if (!btn) return;

  e.preventDefault();

  const overlay = document.createElement("div");
  overlay.style = `
    position:fixed;
    inset:0;
    background:rgba(0,0,0,0.55);
    display:flex;
    align-items:center;
    justify-content:center;
    z-index:9999;
  `;

  overlay.innerHTML = `
    <div style="
      background:#fff;
      padding:22px;
      border-radius:14px;
      max-width:440px;
      width:90%;
      box-shadow:0 12px 30px rgba(0,0,0,0.25);
    ">
      <h3>Problem oder Anregung melden</h3>

      <textarea id="reportText"
        placeholder="Beschreibe dein Anliegen …"
        style="
          width:100%;
          height:120px;
          padding:10px;
          border-radius:8px;
          border:1px solid #ccc;
          font-family:inherit;
        "></textarea>

      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:14px;">
        <button id="cancelReport">Abbrechen</button>
        <button id="sendReport" style="background:#2e7d32;color:#fff;">
          Senden
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector("#cancelReport").onclick = () => overlay.remove();

  overlay.querySelector("#sendReport").onclick = async () => {
    const text = overlay.querySelector("#reportText").value.trim();
    if (!text) return;

    const res = await fetch(`${SUPABASE_URL}/rest/v1/reports`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify({
        description: text,
        page: location.href,
        source: "community",
        status: "new",
        entry_id: currentEntryId || null
      })
    });

    if (!res.ok) {
      console.error("REPORT FAILED", await res.text());
      return;
    }

    overlay.remove();
  };
});


/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
  initSearch();

  const id = new URLSearchParams(location.search).get("id");
  if (id) loadEntry(id);
});
/* ================= OPEN RATING POPUP ================= */
document.addEventListener("click", (e) => {
  const rateBox = e.target.closest(".user-rating[data-rate]");
  if (!rateBox || !currentEntryId) return;

  e.preventDefault();
  openRatingPopup();
});
function openRatingPopup() {
  const overlay = document.createElement("div");
  overlay.style = `
    position:fixed;
    inset:0;
    background:rgba(0,0,0,0.55);
    display:flex;
    align-items:center;
    justify-content:center;
    z-index:9999;
  `;

  overlay.innerHTML = `
    <div style="
      background:#fff;
      padding:22px;
      border-radius:14px;
      max-width:360px;
      width:90%;
      text-align:center;
    ">
      <h3>Eintrag bewerten</h3>
      <p style="font-size:13px;opacity:.7;">
        Wie bewertest du diesen Eintrag?
      </p>

      <div id="rateStars" style="font-size:26px;cursor:pointer;">
        <span data-v="1">☆</span>
        <span data-v="2">☆</span>
        <span data-v="3">☆</span>
        <span data-v="4">☆</span>
        <span data-v="5">☆</span>
      </div>

      <div style="margin-top:14px;">
        <button id="cancelRate">Abbrechen</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector("#cancelRate").onclick = () => overlay.remove();

  overlay.querySelectorAll("#rateStars span").forEach(star => {
    star.onclick = async () => {
      const rating = Number(star.dataset.v);

      await fetch(`${SUPABASE_URL}/rest/v1/entry_ratings`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal"
        },
        body: JSON.stringify({
          entry_id: currentEntryId,
          rating,
          user_hash: getUserHash()
        })
      });

      overlay.remove();
      location.reload(); // bewusst: SEO & Konsistenz
    };
  });
}
