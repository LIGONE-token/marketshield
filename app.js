/* =====================================================
   MarketShield – app.js (FINAL / EXAKT)
===================================================== */
/* ================= HARD GUARD ================= */

// Repariert /marketshield/undefined/ VOR ALLER LOGIK
(function () {
  if (location.pathname.endsWith("/undefined/")) {
    history.replaceState(null, "", "/marketshield/");
  }
})();


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
function setMeta(name, content) {
  if (!content) return;
  let m = document.querySelector(`meta[name="${name}"]`);
  if (!m) {
    m = document.createElement("meta");
    m.setAttribute("name", name);
    document.head.appendChild(m);
  }
  m.setAttribute("content", content);
}

function setOG(property, content) {
  if (!content) return;
  let m = document.querySelector(`meta[property="${property}"]`);
  if (!m) {
    m = document.createElement("meta");
    m.setAttribute("property", property);
    document.head.appendChild(m);
  }
  m.setAttribute("content", content);
}


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
    .replace(/\\n\\n/g, "\n\n")  // escaped doppelte Umbrüche
    .replace(/\\n/g, "\n")      // escaped einfache Umbrüche
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
function stripMarkdown(text) {
  return String(text)
    // Überschriften ### entfernen
    .replace(/^#{1,6}\s*/gm, "")
    // **fett** / *kursiv* entfernen
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    // __unterstrichen__ entfernen
    .replace(/__(.*?)__/g, "$1");
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
  summary:            "Einordnung & Hintergrund",
  mechanism:          "Wirkweise",

  effects_positive:   "Positive Wirkungen",
  effects_negative:   "Negative Wirkungen / Risiken",
  risk_groups:        "Risikogruppen",

  scientific_note:    "Wissenschaftliche Einordnung",

  benefits:           "Vorteile",                // optional / legacy
  risks:              "Risiken",                 // optional / legacy
  warnings:           "Wichtige Hinweise",
  target_groups:      "Geeignet für / Zielgruppen",

  alternatives:       "Bessere Alternativen",
  legal:              "Rechtliche Einordnung",
  sources:            "Quellen & Studien",
  notes:              "Zusätzliche Hinweise"
};

function renderPipeTableWithContext(text) {
  const raw = text.replace(/\r\n/g, "\n");
  const lines = raw.split("\n");

  for (let i = 0; i < lines.length - 2; i++) {
    const header = lines[i];
    const divider = lines[i + 1];

    if (header.includes("|") && /^[-\s|]{5,}$/.test(divider)) {
      const tableLines = [header];
      let end = i + 2;

      for (; end < lines.length; end++) {
        if (!lines[end].includes("|")) break;
        tableLines.push(lines[end]);
      }

      const before = lines.slice(0, i).join("\n").trim();
      const after  = lines.slice(end).join("\n").trim();

      const rows = tableLines.map(r =>
        r.split("|").map(c => escapeHtml(c.trim()))
      );

      const thead = rows[0];
      const tbody = rows.slice(1);

      const tableHtml = `
        <table class="ms-table">
          <thead>
            <tr>${thead.map(h => `<th>${h}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${tbody.map(r =>
              `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`
            ).join("")}
          </tbody>
        </table>
      `;

      return { before, tableHtml, after };
    }
  }

  return null;
}



function renderEntryBlock(key, value) {
  if (!value || String(value).trim() === "") return "";

  const title = ENTRY_LABELS[key] || key;
  const raw = String(value);

  // Tabelle + Kontext (falls vorhanden)
  const parsed = renderPipeTableWithContext(raw);
  const clean = stripMarkdown(normalizeText(value));


  // 👉 HIER die Klasse setzen
  const sectionClass =
    key === "quick_facts"
      ? "entry-block quick-facts"
      : "entry-block";

  return `
    <section class="${sectionClass}">
      <h3>${title}</h3>

      ${
        parsed
          ? `
              ${parsed.before ? renderParagraphs(parsed.before) : ""}
              ${parsed.tableHtml}
              ${parsed.after ? renderParagraphs(parsed.after) : ""}
            `
          : renderParagraphs(clean)
      }
    </section>
  `;
}




function parseArray(val) {
  if (!val) return "";
  try {
    const arr = typeof val === "string" ? JSON.parse(val) : val;
    if (!Array.isArray(arr) || arr.length === 0) return "";
    return arr.map(v => `• ${v}`).join("\n");
  } catch {
    return "";
  }
}
function generateQuickFacts(e) {
  const facts = [];

  // Positive Wirkungen
  if (Array.isArray(e.effects_positive) && e.effects_positive.length > 0) {
    facts.push("🟢 Positive Wirkungen vorhanden");
  }

  // Negative Wirkungen / Risiken
  if (Array.isArray(e.effects_negative) && e.effects_negative.length > 0) {
    facts.push("🔴 Kritische Aspekte zu beachten");
  }

  // Risikogruppen
  if (Array.isArray(e.risk_groups) && e.risk_groups.length > 0) {
    facts.push("🟡 Nicht für alle Zielgruppen unproblematisch");
  }

  // Verarbeitungsgrad (nur bei Stoffen sinnvoll)
  if (Number(e.processing_score) >= 7) {
    facts.push("🟡 Stark verarbeitet / technologisch optimiert");
  }

  return facts.slice(0, 3).join("\n");
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

  const filled = c > 0 ? Math.round(a) : 0;

  return `
    <div class="rating-wrapper">
      <div class="rating-box">

        <div class="rating-stars" aria-label="Bewertung">
          ${[1,2,3,4,5].map(n => {
            const isFilled = c > 0 && n <= filled;
            return `
              <span class="rating-star ${isFilled ? "filled" : "empty"}"
                    data-star="${n}">
                ${isFilled ? "★" : "☆"}
              </span>
            `;
          }).join("")}
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

      loadEntry(location.pathname.replace(/^\/marketshield\/|\/$/g, ""));
    });
  });
}


/* ================= LISTE ================= */
function renderList(data) {
  const box = $("results");
  if (!box) return;

  hideStaticEntries();
  currentEntryId = null;

  box.innerHTML = (data || [])
    .filter(e => e.slug) // 🔑 ABSOLUT KRITISCH
    .map(e => `
      <div class="entry-card" data-slug="${e.slug}">
        <div style="font-size:20px;font-weight:800;">
          ${escapeHtml(e.title)}
        </div>
        ${renderRatingBlock(e.rating_avg, e.rating_count)}
        ${renderScoreBlock(e.score, e.processing_score)}
        <div style="font-size:15px;line-height:1.4;">
          ${escapeHtml(shortText(e.summary))}
        </div>
      </div>
    `).join("");

  if (!box.innerHTML.trim()) {
    box.innerHTML = "<p style='opacity:.6'>Keine passenden Einträge gefunden.</p>";
  }
}


/* ================= DETAIL ================= */
async function loadEntry(slug) {
  const box = document.getElementById("results");
  if (!box || !slug) return;

   const grid = document.querySelector(".category-grid");
  if (grid) grid.style.display = "none";

  const d = await supa(
    `entries_with_ratings?select=*&slug=eq.${encodeURIComponent(slug)}`
  );

  const e = d[0];
  if (!e) return;
currentEntryId = e.id;


  const canonicalPath = `/marketshield/${e.slug}/`;
if (location.pathname !== canonicalPath) {
  history.replaceState(null, "", canonicalPath);
}

  if (!e) return;
const url  = `${location.origin}/marketshield/${slug}/`;
const img  = `${location.origin}/marketshield/images/${slug}.jpg`;

// Title
document.title = `${e.title} – MarketShield`;

// Description
setMeta("description", shortText(e.summary, 155));

// OpenGraph
setOG("og:title", e.title);
setOG("og:description", shortText(e.summary, 155));
setOG("og:url", url);
setOG("og:image", img);
setOG("og:type", "article");
setOG("og:site_name", "MarketShield");

// Twitter / X
setOG("twitter:card", "summary_large_image");
setOG("twitter:title", e.title);
setOG("twitter:description", shortText(e.summary, 155));
setOG("twitter:image", img);

  if (!e.quick_facts) {
    e.quick_facts = generateQuickFacts(e);
  }

  box.innerHTML = `
    <article class="entry-detail">


      <h2>${escapeHtml(e.title)}</h2>

      ${renderRatingBlock(e.rating_avg, e.rating_count, e.title)}
      ${renderScoreBlock(e.score, e.processing_score, 14)}

      ${renderEntryBlock("summary", e.summary)}
      ${renderEntryBlock("mechanism", e.mechanism)}
      ${renderEntryBlock("effects_positive", parseArray(e.effects_positive))}
      ${renderEntryBlock("effects_negative", parseArray(e.effects_negative))}
      ${renderEntryBlock("risk_groups", parseArray(e.risk_groups))}

      ${renderEntryBlock("scientific_note", e.scientific_note)}
      ${renderEntryBlock("synergy", parseArray(e.synergy))}
      ${renderEntryBlock("natural_sources", parseArray(e.natural_sources))}

      ${renderEntryBlock("benefits", e.benefits)}
      ${renderEntryBlock("risks", e.risks)}
      ${renderEntryBlock("warnings", e.warnings)}
      ${renderEntryBlock("target_groups", e.target_groups)}
      ${renderEntryBlock("alternatives", e.alternatives)}
      ${renderEntryBlock("legal", e.legal)}
      ${renderEntryBlock("sources", e.sources)}
      ${renderEntryBlock("notes", e.notes)}

      <!-- ================= SUPPORT BOX ================= -->
      <section class="support-box">
        <h3>💚 MarketShield unterstützen</h3>

        <p class="support-text">
          MarketShield ist ein unabhängiges Aufklärungsprojekt.
          Es gibt keine Investoren, keine Industrie-Finanzierung
          und keine bezahlten Bewertungen.
        </p>

        <a
          class="support-paypal"
          href="https://paypal.me/wahrheitgewinnt"
          target="_blank"
          rel="noopener"
        >
          Über PayPal unterstützen
        </a>

        <div class="support-crypto">
          <strong>🔐 Alternativ: Unterstützung per Kryptowährung</strong>
          <p>Für Nutzer, die bewusst dezentral unterstützen möchten.</p>

          <code class="crypto-address">
            ETH / Polygon (ERC20)<br>
            <span>0x5883C4013B4051e7f47624dC81B7118dE8fbD0FF</span>
          </code>

          <small>
            Die Adresse gehört ausschließlich dem Projekt MarketShield.
          </small>
        </div>
      </section>

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
    `entries_with_ratings?select=id,slug,title,summary
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
        <div class="similar-card" data-slug="${e.slug}">
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
  const slug = card.dataset.slug;
  if (!slug) return;

  history.pushState(null, "", `/marketshield/${slug}/`);
  loadEntry(slug);
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
  `entries_with_ratings?select=id,slug,title,summary,score,processing_score,rating_avg,rating_count&slug=not.is.null&title=ilike.%25${enc}%25`
);

}

// Event-Listener zur Suche
function initSearch() {
  const input = $("searchInput");
  const box = $("results");
  if (!input || !box) return;

  input.addEventListener("input", async () => {
    const q = input.value.trim();

    // 🔑 DAS FEHLTE
    const grid = document.querySelector(".category-grid");
    if (grid) grid.style.display = "none";

    if (q.length < 2) {
      showCategories();
      box.innerHTML = "";
      return;
    }

    const data = await smartSearch(q);
    renderList(data);
  });
}



/* ================= KATEGORIEN ================= */
async function loadCategories() {
  const grid = document.querySelector(".category-grid");
  if (!grid) return;

  const data = await supa('categories');  // Holen der Kategorien aus Supabase
  grid.innerHTML = "";

  if (data && Array.isArray(data)) {
    data.forEach(c => {
      const button = document.createElement("button");
      button.textContent = c.title;
      button.className = "cat-btn";
      button.addEventListener("click", () => loadCategory(c.title));
      grid.appendChild(button);
    });
  } else {
    console.error("Kategorien konnten nicht abgerufen werden.");
  }

  grid.style.display = "grid";
}


// Funktion zum Laden der Einträge einer Kategorie
async function loadCategory(cat) {
  hideStaticEntries();
  history.pushState(null, "", location.pathname);

  const encCat = encodeURIComponent(cat);
  const data = await supa(
  `entries_with_ratings?select=id,slug,title,summary,score,processing_score,rating_avg,rating_count&category=eq.${encCat}&slug=not.is.null`
);

  renderList(data);  // Anzeige der Einträge
}

/* ================= NAV ================= */

/* ================= NAV (FINAL / SAFE) ================= */

// Helper: sichere Navigation zu einem Slug
function goToSlug(slug) {
  if (!slug || slug === "undefined") return;

  const clean = String(slug).trim();
  if (!clean) return;

  history.pushState(null, "", `/marketshield/${clean}/`);
  loadEntry(clean);
}

document.addEventListener("click", (e) => {
  // ✅ Niemals UI-Controls kapern
  if (e.target.closest("button, a, input, textarea, select, label")) return;

  // ✅ Niemals Ratings/Support/Share kapern (deine Klassen/IDs)
  if (e.target.closest(".rating-wrapper, .rating-stars, .rating-star")) return;
  if (e.target.closest(".support-box, .support-paypal, .crypto-address")) return;
  if (e.target.closest("#entryActions, #affiliateBox")) return;

  // ✅ Wenn Kategorien sichtbar sind: keine Karten-Navigation erzwingen
  // (Buttons regeln das selbst)
  if (e.target.closest(".category-grid")) return;

  // ✅ Entry-Karten (Liste) klicken
  const card = e.target.closest(".entry-card");
  if (!card) return;

  const slug = card.dataset.slug;
  if (!slug || slug === "undefined") return;

  e.preventDefault();
  goToSlug(slug);
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
document.addEventListener("DOMContentLoaded", async () => {
  loadCategories();
  initSearch();
  initReport();

  const params = new URLSearchParams(location.search);
  const slug =
    params.get("p") ||
    location.pathname.replace(/^\/marketshield\/|\/$/g, "");

  if (slug && slug !== "undefined") {
    loadEntry(slug);
  } else {
    showCategories(); // ✅ HIER JA
  }
});



 

function copyCryptoAddress(el) {
  const addr = el.querySelector("span")?.innerText;
  if (!addr) return;

  navigator.clipboard.writeText(addr).then(() => {
    const old = el.innerHTML;
    el.innerHTML = "✅ Adresse kopiert";
    setTimeout(() => {
      el.innerHTML = old;
    }, 1200);
  });
}
document.addEventListener("click", function (e) {
  const el = e.target.closest(".crypto-address");
  if (!el) return;

  const addr = el.querySelector("span")?.innerText;
  if (!addr) return;

  navigator.clipboard.writeText(addr).then(() => {
    const old = el.innerHTML;
    el.innerHTML = "✅ Adresse kopiert";
    setTimeout(() => {
      el.innerHTML = old;
    }, 1200);
  });
});


