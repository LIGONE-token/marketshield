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

  const clamped = Math.max(0, Math.min(10, n));
  const w = Math.round((clamped / 10) * 80);

  let color = "#2e7d32"; // 🟢 grün (0–3)
  if (clamped >= 4 && clamped <= 7) color = "#f9a825"; // 🟡 gelb
  if (clamped >= 8) color = "#c62828"; // 🔴 rot

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
function renderUserRating(avg, count) {
  const c = Number.isFinite(+count) ? +count : 0;
  const avgNum = Number.isFinite(+avg) ? +avg : 0;

  // gerundete Sterne (nur Anzeige)
  const stars = Math.max(0, Math.min(5, Math.round(avgNum)));

  // Textwerte
  const avgText = avgNum ? avgNum.toFixed(1) : "0,0";
  const countText = c === 1 ? "1 Bewertung" : `${c} Bewertungen`;

  return `
    <div class="user-rating" aria-label="Nutzerbewertung">
      <div style="font-size:20px;line-height:1;">
        ${Array.from({ length: 5 }, (_, i) => i < stars ? "⭐" : "☆").join("")}
      </div>

      <div style="margin-top:4px;font-size:14px;">
        <strong>${avgText}</strong> von <strong>5</strong>
        <span style="opacity:.75;">(${countText})</span>
      </div>

      <div style="font-size:12px;opacity:.6;margin-top:2px;">
        Basierend auf echten Nutzerbewertungen
      </div>
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

const d = await supa(`entries_with_ratings?select=*&id=eq.${id}`);
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
let lastSearchLogged = "";

async function logSearch(term) {
  if (!term || term.length < 2) return;
  if (term === lastSearchLogged) return; // Duplikate vermeiden

  lastSearchLogged = term;

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
        query: term   // ✔ einziges Feld laut Schema
      })
    });
  } catch (e) {
    console.warn("Search logging failed:", e);
  }
}


async function smartSearch(q) {
  const term = q.trim();
  if (term.length < 2) return [];

  const enc = encodeURIComponent(term);

  // ✅ NUR Titel durchsuchen
  return await supa(
  `entries_with_ratings?select=id,title,summary,score,processing_score,rating_avg,rating_count&title=ilike.%25${enc}%25`
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
  `entries_with_ratings?select=id,title,summary,score,processing_score,rating_avg,rating_count&category=eq.${encodeURIComponent(cat)}`
));

}

/* ================= NAV ================= */
document.addEventListener("click", (e) => {
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
/* REPORT FAB – ROBUST FINAL */
document.addEventListener("DOMContentLoaded", () => {
  const fab = document.getElementById("msReportFab");
  const modal = document.getElementById("reportModal");
  if (!fab || !modal) return;

  fab.addEventListener("click", () => {
    modal.classList.add("open");
  });

  const close = document.getElementById("closeReportModal");
  if (close) {
    close.addEventListener("click", () => {
      modal.classList.remove("open");
    });
  }
});
/* REPORT FORM – SEND TO SUPABASE (SCHEMA-KONFORM) */
document.addEventListener("DOMContentLoaded", () => {
  const form  = document.getElementById("reportForm");
  const modal = document.getElementById("reportModal");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const textarea = form.querySelector("textarea[name='description']");
    const desc = textarea ? textarea.value.trim() : "";
    if (!desc) return;

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/reports`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal"
        },
        body: JSON.stringify({
          description: desc,                 // Pflichtfeld
          source: "community",               // passt zum Default
          entry_id: currentEntryId || null,  // TEXT (wie in Tabelle)
          page: location.href                // korrektes Feld
        })
      });

      if (!res.ok) throw new Error(await res.text());

      form.reset();
      modal.classList.remove("open");
      alert("Nachricht versendet! Vielen Dank für deine Mithilfe 💚");

    } catch (err) {
      console.error("Report submit failed:", err);
      alert("Fehler beim Senden der Meldung.");
    }
  });
});

/* PROGRESS – MANUAL & SAFE */
function showProgress(text = "Bitte warten …") {
  const p = document.getElementById("msProgressBox");
  if (!p) return;

  p.innerHTML = `
    <div class="box">
      <div style="font-weight:600;margin-bottom:8px;">${text}</div>
      <div style="font-size:13px;opacity:.7;">Vorgang läuft</div>
      <button id="closeProgress"
              style="margin-top:14px;padding:6px 10px;">
        Schließen
      </button>
    </div>
  `;

  p.classList.add("open");

  const btn = document.getElementById("closeProgress");
  if (btn) {
    btn.onclick = () => p.classList.remove("open");
  }
}

function hideProgress() {
  const p = document.getElementById("msProgressBox");
  if (p) p.classList.remove("open");
}
/* RATING – CLICK HANDLER */
document.addEventListener("click", async (e) => {
  const star = e.target.closest("[data-rate-star]");
  if (!star) return;

  const value = Number(star.dataset.rateStar);
  if (!value || !currentEntryId) return;

  showProgress("Bewertung wird gespeichert …");

  try {
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
        rating: value
      })
    });

    hideProgress();
    alert("Danke für deine Bewertung! ⭐");

    // Detailansicht neu laden → aktualisierte Sterne
    loadEntry(currentEntryId);

  } catch (err) {
    hideProgress();
    alert("Bewertung konnte nicht gespeichert werden.");
    console.error(err);
  }
});
