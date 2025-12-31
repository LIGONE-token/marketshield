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
/* ================= RATING (READ ONLY) ================= */
async function renderRating(entryId) {
  try {
    const data = await supa(
      `entry_ratings?select=rating&entry_id=eq.${entryId}`
    );

    if (!data || !data.length) {
      return `
        <div style="font-size:13px;color:#777;margin:6px 0;">
          Noch keine Bewertungen
        </div>`;
    }

    const count = data.length;
    const avg = data.reduce((s, r) => s + r.rating, 0) / count;
    const rounded = Math.round(avg * 10) / 10;

    const stars =
      "★★★★★".slice(0, Math.round(avg)) +
      "☆☆☆☆☆".slice(0, 5 - Math.round(avg));

    return `
      <div style="margin:6px 0 10px;">
        <div style="font-size:18px;color:#f5b301;">
          ${stars}
          <span style="font-size:14px;color:#555;margin-left:6px;">
            ${rounded} (${count})
          </span>
        </div>
        <div style="font-size:13px;color:#777;">
          Wie hilfreich war dieser Eintrag?
        </div>
      </div>`;
  } catch {
    return "";
  }
}

/* ================= LISTE ================= */
function renderList(data) {
  const box = $("results");
  if (!box) return;

  box.innerHTML = (data || []).map(e => `
    <div class="entry-card" data-id="${e.id}">
      <div style="font-size:20px;font-weight:800;">${escapeHtml(e.title)}</div>
      ${renderScoreBlock(e.score, e.processing_score)}
      <div style="
  font-size:15px;
  line-height:1.2;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
">
  ${escapeHtml(shortText(e.summary, 140))}
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

  // 🔥 erzwinge echte Benutzbarkeit
  input.style.pointerEvents = "auto";
  input.style.zIndex = "50";
  input.style.position = "relative";

  input.addEventListener("input", async (e) => {
    e.stopPropagation();

    const q = input.value.trim();

    // Startzustand: leer lassen (nur Kategorien sichtbar)
    if (q.length < 2) {
      box.innerHTML = "";
      return;
    }

    try {
      const data = await smartSearch(q);
      renderList(data);
    } catch (err) {
      console.error("Search error:", err);
      box.innerHTML = "<div style='opacity:.6'>Suche fehlgeschlagen</div>";
    }
  });
}


/* ================= KATEGORIEN ================= */
async function loadCategories() {
  const grid = document.querySelector(".category-grid");
  if (!grid) return;

  // 🔥 Klickbarkeit erzwingen
  grid.style.pointerEvents = "auto";
  grid.style.zIndex = "10";
  grid.style.position = "relative";

  const data = await fetch("categories.json").then(r => r.json());
  grid.innerHTML = "";

  (data.categories || []).forEach(c => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = c.title;

    // 🔥 Button explizit klickbar
    b.style.pointerEvents = "auto";
    b.style.cursor = "pointer";

    b.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      loadCategory(c.title);
    });

    grid.appendChild(b);
  });
}


async function loadCategory(cat) {
  const box = $("results");
  if (box) box.innerHTML = ""; // 🔒 sauberer Wechsel

  renderList(await supa(
    `entries?select=id,title,summary,score,processing_score&category=eq.${encodeURIComponent(cat)}`
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
  const box = $("results");
  if (box) box.innerHTML = ""; // 🔒 Start: KEINE Einträge

  loadCategories(); // ✅ nur Kategorien anzeigen
  initSearch();

  const id = new URLSearchParams(location.search).get("id");
  if (id) loadEntry(id);
});

document.addEventListener("DOMContentLoaded", () => {
  const reportBtn = document.getElementById("reportButton");
  if (reportBtn) {
    reportBtn.style.pointerEvents = "auto";
    reportBtn.addEventListener("click", () => {
      alert("Reportfunktion aktiv – Backend folgt");
    });
  }
});
// 🚨 Emergency click recovery (global)
document.addEventListener(
  "click",
  (e) => {
    const btn = e.target.closest("button");
    if (btn) {
      btn.style.pointerEvents = "auto";
    }
  },
  true // CAPTURE-Phase – vor allem anderen
);
