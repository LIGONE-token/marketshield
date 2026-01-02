
/* =====================================================
   MarketShield – app.js (FINAL / KOMPLETT / STABIL)
   - Keine globalen document-click Fallen für Navigation
   - Entry-Klicks werden NACH Render gebunden
   - ReportFab per Event-Delegation (robust)
   - Kategorien, Bewertungen, Socials klickbar
   - KEIN zusätzlicher "Zur Startseite"-Button unten
===================================================== */

/* ================= GLOBAL ================= */
let currentEntryId = null;
let lastSearchLogged = "";

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
  const clamped = Math.max(0, Math.min(10, n));
  const w = Math.round((clamped / 10) * 80);
  let color = "#2e7d32";
  if (clamped >= 4 && clamped <= 7) color = "#f9a825";
  if (clamped >= 8) color = "#c62828";
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
        <div style="
          display:grid;
          grid-template-columns:90px 1fr;
          gap:8px;
          align-items:center;
          margin-bottom:${i ? 6 : 0}px;
        ">
          <div style="font-size:20px;line-height:1;">${h}</div>
          <div style="font-size:${size}px;opacity:.85;">Gesundheitsscore</div>
        </div>
      ` : ""}

      ${i ? `
        <div style="
          display:grid;
          grid-template-columns:90px 1fr;
          gap:8px;
          align-items:center;
        ">
          <div>${i}</div>
          <div style="font-size:${size}px;opacity:.85;">Industrie-Verarbeitungsgrad</div>
        </div>
      ` : ""}
    </div>
  `;
}


function renderUserRating(avg, count) {
  const c = Number.isFinite(+count) ? +count : 0;
  const avgNum = Number.isFinite(+avg) ? +avg : 0;

  const stars = Math.round(avgNum);
  const avgText = avgNum ? avgNum.toFixed(1).replace(".", ",") : "0,0";

  return `
    <div class="user-rating">
      <div style="font-size:20px;line-height:1;">
        ${Array.from({ length: 5 }, (_, i) => i < stars ? "⭐" : "☆").join("")}
      </div>

      <div class="rating-open"
     data-rating-trigger="1"
     style="margin-top:4px;font-size:14px;cursor:pointer;text-decoration:underline;">

        <strong>${avgText}</strong> von <strong>5</strong>
        <span style="opacity:.75;">
          · ${c} Bewertung${c === 1 ? "" : "en"}
        </span>
      </div>
    </div>
  `;
}

/* ================= ENTRY CLICK BINDING ================= */
function bindEntryClicks(root = document) {
  root.querySelectorAll(".entry-card").forEach(card => {
    card.onclick = (e) => {

      // 👉 WICHTIG: NUR reagieren, wenn DIREKT die Card angeklickt wird
      if (e.target !== card) return;

      const id = card.dataset.id;
      if (!id) return;

      history.pushState({}, "", "?id=" + id);
      loadEntry(id);
    };
  });
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
  bindEntryClicks(box);
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
    <div id="similarEntries"></div>
  `;

  renderEntryActions(e.title);
  await loadSimilarEntries(e);
  bindEntryClicks(box);
}

/* ================= ÄHNLICHE EINTRÄGE ================= */
async function loadSimilarEntries(entry) {
  const box = document.getElementById("similarEntries");
  if (!box || !entry?.category) return;

  const data = await supa(
    `entries_with_ratings?select=id,title,summary,rating_avg,rating_count` +
    `&category=eq.${entry.category}` +
    `&id=neq.${entry.id}` +
    `&limit=5`
  );

  if (!data.length) { box.innerHTML = ""; return; }

  box.innerHTML = `
    <h3>Ähnliche Einträge</h3>
    ${data.map(e => `
      <div class="entry-card" data-id="${e.id}">
        <strong>${escapeHtml(e.title)}</strong><br>
        ${renderUserRating(e.rating_avg, e.rating_count)}
        <div style="font-size:14px;opacity:.8;">
          ${escapeHtml(shortText(e.summary))}
        </div>
      </div>
    `).join("")}
  `;
  bindEntryClicks(box);
}

/* ================= SOCIAL / KOPIEREN / DRUCKEN ================= */
function renderEntryActions(title) {
  const box = $("entryActions");
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
    </div>`;
}

/* ================= SEARCH ================= */
async function logSearch(term) {
  if (!term || term.length < 2 || term === lastSearchLogged) return;
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
      body: JSON.stringify({ query: term })
    });
  } catch (e) { console.warn("Search logging failed:", e); }
}

async function smartSearch(q) {
  const term = q.trim();
  if (term.length < 2) return [];
  const enc = encodeURIComponent(term);
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
    const res = await smartSearch(q);
    renderList(res);
    logSearch(q);
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
    b.type = "button";
    b.textContent = c.title;
    b.onclick = () => loadCategory(c.title);
    grid.appendChild(b);
  });
}

async function loadCategory(cat) {
  const data = await supa(
    `entries_with_ratings?select=id,title,summary,score,processing_score,rating_avg,rating_count&category=eq.${cat}`
  );
  renderList(data);
}

/* ================= PROGRESS ================= */
function showProgress(text = "Wird gesendet …") {
  const box = document.getElementById("msProgressBox");
  if (!box) return;
  box.innerHTML = `<div class="box">${text}</div>`;
  box.style.display = "flex";
}
function hideProgress() {
  const box = document.getElementById("msProgressBox");
  if (!box) return;
  box.style.display = "none";
  box.innerHTML = "";
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
  initSearch();

  // Oberer "Zur Startseite"-Link (falls vorhanden)
  const backHome = document.getElementById("backHome");
  if (backHome) {
    backHome.addEventListener("click", (e) => {
      e.preventDefault();
      history.pushState({}, "", location.pathname);
      currentEntryId = null;
      const input = $("searchInput"); if (input) input.value = "";
      const results = $("results"); if (results) results.innerHTML = "";
    });
  }

  const id = new URLSearchParams(location.search).get("id");
  if (id) loadEntry(id);
});

/* ================= REPORT FAB – ROBUST ================= */
document.addEventListener("click", (e) => {
  const fab = e.target.closest("#msReportFab");
  if (!fab) return;
  e.preventDefault(); e.stopPropagation();
  const modal = document.getElementById("reportModal");
  if (!modal) { console.error("reportModal fehlt"); return; }
  modal.classList.add("open");
});

/* ================= REPORT FORM – SENDEN ================= */
document.addEventListener("DOMContentLoaded", () => {
  const form  = document.getElementById("reportForm");
  const modal = document.getElementById("reportModal");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const textarea = form.querySelector("textarea[name='description']");
    const desc = textarea ? textarea.value.trim() : "";
    if (!desc) return;

    showProgress("Nachricht wird gesendet …");

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
          description: desc,
          source: "community",
          entry_id: currentEntryId || null,
          page: currentEntryId ? `entry:${currentEntryId}` : "home"
        })
      });

      if (!res.ok) throw new Error(await res.text());

      form.reset();

      // ✅ EINZIGES Feedback – intern, ruhig, ohne Browserfenster
      const msg = document.createElement("div");
      msg.textContent = "Nachricht gesendet.";
      msg.style.cssText = `
        margin-top:12px;
        padding:10px;
        background:#f1f8f3;
        color:#2e7d32;
        border-radius:6px;
        font-size:14px;
        text-align:center;
      `;
      form.appendChild(msg);

      setTimeout(() => {
        msg.remove();
        if (modal) modal.classList.remove("open");
      }, 1200);

    } catch (err) {
      console.error("Report submit failed:", err);
    } finally {
      hideProgress();
    }
  });
});


/* =====================================================
   REPORT MODAL – SCHLIESSEN (ROBUST)
===================================================== */
document.addEventListener("click", (e) => {
  const closeBtn = e.target.closest("#closeReportModal");
  if (!closeBtn) return;

  e.preventDefault();
  e.stopPropagation();

  const modal = document.getElementById("reportModal");
  if (modal) modal.classList.remove("open");
});
/* =====================================================
   RATING – SAUBERES MODAL (FINAL)
===================================================== */

// Öffnen des Rating-Modals – PRIORITÄT
document.addEventListener("click", (e) => {
  const trigger = e.target.closest("[data-rating-trigger]");
  if (!trigger) return;

  e.preventDefault();
  e.stopPropagation();

  const modal = document.getElementById("ratingModal");
  if (modal) modal.classList.add("open");
});


// Schließen-Button
document.getElementById("closeRatingModal")?.addEventListener("click", () => {
  document.getElementById("ratingModal")?.classList.remove("open");
});

// Sterne-Logik
document.querySelectorAll("#ratingStars span").forEach(star => {

  // Hover-Vorschau
  star.addEventListener("mouseenter", () => {
    const n = Number(star.dataset.star);
    highlightStars(n);
  });

  star.addEventListener("mouseleave", () => {
    highlightStars(0);
  });

  // Klick = Bewertung speichern
  star.addEventListener("click", async () => {
    const value = Number(star.dataset.star);
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

      document.getElementById("ratingModal")?.classList.remove("open");
      await loadEntry(currentEntryId);

    } catch (err) {
      console.error("Rating failed:", err);
    } finally {
      hideProgress();
    }
  });
});

// Sterne einfärben
function highlightStars(n) {
  document.querySelectorAll("#ratingStars span").forEach(s => {
    s.textContent = (Number(s.dataset.star) <= n) ? "⭐" : "☆";
  });
}
