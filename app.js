/* =====================================================
   MarketShield – app.js (FINAL / EXAKT)
===================================================== */

/* ================= GLOBAL ================= */
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
  if (!r.ok) throw new Error(t || `Supabase error (${r.status})`);
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
  if (!r.ok) throw new Error(t || `Supabase POST error (${r.status})`);
  return true;
}

/* ================= HELPERS ================= */
const $ = (id) => document.getElementById(id);

function hideStaticEntries() {
  const s = $("static-entries");
  if (s) s.style.display = "none";
}

function showCategories() {
  const grid = document.querySelector(".category-grid");
  if (grid) grid.style.display = "grid";
}

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
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function shortText(t, max = 160) {
  if (!t) return "";
  t = String(t).replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max) + " …" : t;
}
function renderParagraphs(text = "") {
  if (!text) return "";

  return text
    .split(/\n{2,}/)
    .map(p => {
      const t = p.trim();

      // Großgeschriebene Abschnittsüberschriften hervorheben
      if (/^[A-ZÄÖÜ\s:]+$/.test(t)) {
        return `<p><strong>${escapeHtml(t)}</strong></p>`;
      }

      return `<p>${escapeHtml(t)}</p>`;
    })
    .join("");
}

function renderMarkdownTables(text) {
  if (!text.includes("|")) return null;

  const lines = text.split("\n").map(l => l.trim());
  const sepIndex = lines.findIndex(l => /^[-| ]+$/.test(l));
  if (sepIndex <= 0) return null;

  const header = lines[sepIndex - 1].split("|").map(s => s.trim()).filter(Boolean);
  const rows = [];

  for (let i = sepIndex + 1; i < lines.length; i++) {
    if (!lines[i].includes("|")) break;
    const cols = lines[i].split("|").map(s => s.trim()).filter(Boolean);
    if (cols.length) rows.push(cols);
  }

  if (!rows.length) return null;

  return `
    <div class="table-wrapper">
      <table class="ms-table">
        <thead>
          <tr>${header.map(h => `<th>${escapeHtml(h)}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${rows.map(r =>
            `<tr>${r.map(c => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`
          ).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderListSection(title, jsonString) {
  if (!jsonString) return "";

  let arr;
  try {
    arr = JSON.parse(jsonString);
  } catch {
    return "";
  }

  if (!Array.isArray(arr) || arr.length === 0) return "";

  return `
    <section class="entry-list">
      <h3>${escapeHtml(title)}</h3>
      <ul>
        ${arr.map(i => `<li>${escapeHtml(i)}</li>`).join("")}
      </ul>
    </section>
  `;
}
const ENTRY_LABELS = {
  summary:       "Einordnung & Hintergrund",
  mechanism:     "Wirkweise",
  benefits:      "Vorteile",
  risks:         "Risiken",
  warnings:      "Wichtige Hinweise",
  target_groups: "Geeignet für / Zielgruppen",
  alternatives:  "Bessere Alternativen",
  legal:         "Rechtliche Einordnung",
  sources:       "Quellen & Studien",
  notes:         "Zusätzliche Hinweise"
};
function renderEntryBlock(key, value) {
  if (!value || String(value).trim() === "") return "";

  const title = ENTRY_LABELS[key] || key;
  const clean = normalizeText(value);

  const table = renderMarkdownTables(clean);
  const content = table ? table : renderParagraphs(clean);

  return `
    <section class="entry-block">
      <h3>${title}</h3>
      ${content}
    </section>
  `;
}


/* ================= ZUR STARTSEITE ===================== */
document.addEventListener("DOMContentLoaded", () => {
  const backHome = document.getElementById("backHome");
  if (!backHome) return;

  // sichtbar machen
  backHome.style.display = "inline-block";
  backHome.style.cursor = "pointer";

  // Klick = Startseite
  backHome.addEventListener("click", () => {
    history.pushState(null, "", location.pathname);
    location.reload();
  });
});


/* ================= USER HASH (RATING) ================= */
function getUserHash() {
  let h = localStorage.getItem("ms_user_hash");
  if (!h) {
    h = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("ms_user_hash", h);
  }
  return h;
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

  const clamped = Math.min(Math.max(n, 0), 10);
  const w = Math.round((clamped / 10) * 80);

  let color = "#2e7d32"; // grün (0–2)
  if (clamped >= 3 && clamped <= 7) color = "#f9a825"; // gelb
  if (clamped >= 8) color = "#c62828"; // rot

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

/* ================= RATING ================= */
function renderRatingBlock(avg = 0, count = 0, title = "") {
  const a = Number(avg) || 0;
  const c = Number(count) || 0;

  const filled = Math.floor(a);

  return `
    <div class="rating-wrapper">

      <div class="rating-box">

        <div class="rating-stars" aria-label="Bewertung">
          ${[1,2,3,4,5].map(n => `
            <span class="rating-star ${n <= filled ? "filled" : ""}"
                  data-star="${n}">
              ★
            </span>
          `).join("")}
        </div>

        <span class="rating-info">
          ${c > 0
            ? `${a.toFixed(1).replace(".", ",")} von 5 (${c} Bewertung${c > 1 ? "en" : ""})`
            : "Bitte Eintrag bewerten!"}
        </span>

      </div>
    </div>
  `;
}



function bindRatingClicks() {
  const box = document.querySelector(".rating-stars");
  if (!box || !currentEntryId) return;

  box.querySelectorAll(".rating-star").forEach(star => {
    star.addEventListener("click", async () => {
      const rating = Number(star.dataset.star);
      if (!rating) return;

      await supaPost("entry_ratings", {
        entry_id: currentEntryId,
        rating,
        user_hash: getUserHash()
      });

      loadEntry(currentEntryId); // sofort aktualisieren
    });
  });
}


/* ================= LISTE ================= */
function renderList(data) {
  const box = $("results");
  if (!box) return;

  hideStaticEntries();

  box.innerHTML = (data || []).map(e => `
    <div class="entry-card" data-id="${e.id}">
      <div style="font-size:20px;font-weight:800;">${escapeHtml(e.title)}</div>
      ${renderRatingBlock(e.rating_avg, e.rating_count)}
      ${renderScoreBlock(e.score, e.processing_score)}
      <div style="font-size:15px;line-height:1.4;">
        ${escapeHtml(shortText(e.summary))}
      </div>
    </div>
  `).join("");
}

/* ================= DETAIL ================= */
async function loadEntry(id) {
  const box = document.getElementById("results");
  if (!box) return;

  const d = await supa(`entries_with_ratings?select=*&id=eq.${id}`);
  const e = d[0];
  if (!e) return;

  currentEntryId = id;

  box.innerHTML = `
    <article class="entry-detail">

      <h2>${escapeHtml(e.title)}</h2>

      ${renderRatingBlock(e.rating_avg, e.rating_count, e.title)}
      ${renderScoreBlock(e.score, e.processing_score, 14)}

      ${renderEntryBlock("summary", e.summary)}
      ${renderEntryBlock("mechanism", e.mechanism)}
      ${renderEntryBlock("benefits", e.benefits)}
      ${renderEntryBlock("risks", e.risks)}
      ${renderEntryBlock("warnings", e.warnings)}
      ${renderEntryBlock("target_groups", e.target_groups)}
      ${renderEntryBlock("alternatives", e.alternatives)}
      ${renderEntryBlock("legal", e.legal)}
      ${renderEntryBlock("sources", e.sources)}
      ${renderEntryBlock("notes", e.notes)}

      <div id="affiliateBox"></div>
      <div id="entryActions"></div>

    </article>
  `;

  bindRatingClicks();
  renderAffiliateBox(e);
  renderEntryActions(e.title);
  loadSimilarEntries(e);
}

async function loadSimilarEntries(current) {
  const box = document.getElementById("similarEntries");
  if (!box) return;

  const data = await supa(
    `entries_with_ratings?select=id,title,summary
     &category=eq.${encodeURIComponent(current.category)}
     &id=neq.${current.id}
     &limit=5`
  );

  if (!data || data.length === 0) {
    box.innerHTML = "";
    return;
  }

  box.innerHTML = `
    <h3>Ähnliche Einträge</h3>
    <div class="similar-list">
      ${data.map(e => `
        <div class="similar-card" data-id="${e.id}">
          <strong>${escapeHtml(e.title)}</strong>
          <div class="similar-summary">
            ${escapeHtml((e.summary || "").slice(0, 120))}…
          </div>
        </div>
      `).join("")}
    </div>
  `;

  box.querySelectorAll(".similar-card").forEach(card => {
    card.addEventListener("click", () => {
      const id = card.dataset.id;
      history.pushState({}, "", "?id=" + id);
      loadEntry(id);
    });
  });
}

/* ================= SOCIAL ================= */
function renderEntryActions(title) {
  const box = $("entryActions");
  if (!box) return;

  const url = location.href;
  const encUrl = encodeURIComponent(url);
  const encTitle = encodeURIComponent(`${title} – MarketShield`);

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

/* ================= AFFILIATE ================= */
function renderAffiliateBox(entry) {
  const box = $("affiliateBox");
  if (!box || !entry?.title) return;

  const query = encodeURIComponent(entry.title);
  const link = `https://www.amazon.de/s?k=${query}&tag=ligone-21`;

  box.innerHTML = `
    <div style="margin-top:40px;padding:16px;border:1px solid #ddd;border-radius:10px;">
      <strong>🛒 Passende Angebote bei Amazon</strong>

      <div style="margin:8px 0;font-weight:600;">
        Produkte zum Thema „${escapeHtml(entry.title)}“
      </div>

      <a href="${link}"
         target="_blank"
         rel="noopener sponsored"
         style="display:inline-block;padding:10px 14px;background:#ff9900;color:#000;border-radius:6px;text-decoration:none;font-weight:700;">
        Bei Amazon ansehen
      </a>

      <div style="margin-top:8px;font-size:12px;opacity:.7;">
        Hinweis: Affiliate-Link – unterstützt MarketShield ohne Mehrkosten.
      </div>
    </div>
  `;
}

/* ================= SEARCH ================= */
let searchTimer = null;

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

  input.addEventListener("focus", hideStaticEntries);

  input.addEventListener("input", () => {
    clearTimeout(searchTimer);
    const q = input.value.trim();

    searchTimer = setTimeout(async () => {
      if (q.length < 2) {
        box.innerHTML = "";
        return;
      }
      hideStaticEntries();
      const data = await smartSearch(q);
      renderList(data);
    }, 300);
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
    b.className = "cat-btn";
    b.addEventListener("click", () => loadCategory(c.title));
    grid.appendChild(b);
  });
}

async function loadCategory(cat) {
  hideStaticEntries();
  history.pushState(null, "", location.pathname);

  const encCat = encodeURIComponent(cat);
  const data = await supa(
    `entries_with_ratings?select=id,title,summary,score,processing_score,rating_avg,rating_count&category=eq.${encCat}`
  );

  renderList(data);
}

/* ================= NAV ================= */
document.addEventListener("click", (e) => {
  const c = e.target.closest(".entry-card");
  if (!c) return;

  const id = c.dataset.id;
  if (!id) return;

  history.pushState({}, "", "?id=" + encodeURIComponent(id));
  loadEntry(id);
});

/* ================= REPORT FAB ================= */
function initReport() {
  const fab = $("reportFab");
  const modal = $("reportModal");
  const close = $("closeReportModal");
  const send = $("sendReport");
  const text = $("reportText");

  if (!fab || !modal || !close || !send || !text) return;

  fab.addEventListener("click", () => {
    modal.classList.add("open");
    text.focus();
  });

  close.addEventListener("click", () => modal.classList.remove("open"));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("open");
  });

  send.addEventListener("click", async () => {
    const msg = (text.value || "").trim();
    if (msg.length < 5) {
      alert("Bitte beschreibe kurz das Problem (mind. 5 Zeichen).");
      return;
    }
    await supaPost("reports", {
      text: msg,
      page_url: location.href,
      entry_id: currentEntryId || null,
      created_at: new Date().toISOString()
    });
    text.value = "";
    modal.classList.remove("open");
    alert("Danke! Dein Hinweis wurde gespeichert.");
  });
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
   showCategories();
  initSearch();
  initReport();

  const id = new URLSearchParams(location.search).get("id");
  if (id) loadEntry(id);
});
