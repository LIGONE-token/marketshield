/* =====================================================
   MarketShield – app.js (FINAL / STABIL / SUPABASE-LOGISCH)
===================================================== */

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  loadCategories();

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (id) loadEntry(id);
});

/* ================= GLOBAL CLICK (Navigation) ================= */
document.addEventListener("click", (e) => {
  const card = e.target.closest("[data-id]");
  if (!card) return;

  const id = card.dataset.id;
  history.pushState(null, "", "?id=" + id);
  loadEntry(id);
});

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
function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/* === Kurztext für Suchergebnisse === */
function shortText(text, max = 160) {
  if (!text) return "";
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max
    ? clean.slice(0, max).replace(/\s+\S*$/, "") + " …"
    : clean;
}

/* ================= TEXT (DETAIL) ================= */
function renderTextFromSupabase(text) {
  if (!text) return "";

  const normalized = text
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  return `
    <div style="white-space:pre-wrap;font-size:16px;line-height:1.8;">
      ${escapeHtml(normalized)}
    </div>
  `;
}

/* ================= SCORE RENDER ================= */
function renderHealth(score) {
  if (score >= 80) return "💚💚💚";
  if (score >= 60) return "💚💚";
  if (score >= 40) return "💚";
  if (score >= 20) return "🧡";
  return "⚠️❗⚠️";
}

function renderIndustry(score) {
  const n = toNum(score);
  if (!n || n <= 0) return "";

  const s = Math.max(1, Math.min(10, Math.round(n)));
  let color = "#2e7d32";
  if (s >= 4) color = "#f9a825";
  if (s >= 7) color = "#c62828";

  const w = Math.round((s / 10) * 80);

  return `
    <div style="width:80px;height:8px;background:#e0e0e0;border-radius:6px;overflow:hidden;">
      <div style="width:${w}px;height:8px;background:${color};"></div>
    </div>
  `;
}

function renderScoreBlock(score, processing) {
  const showHealth = score > 0;
  const showIndustry = processing > 0;
  if (!showHealth && !showIndustry) return "";

  return `
    <div style="margin:16px 0 22px 0;">
      ${showHealth ? `
        <div style="display:grid;grid-template-columns:80px 1fr;gap:16px;align-items:center;">
          <div style="font-size:18px;">${renderHealth(score)}</div>
          <div style="font-size:13px;font-weight:700;">Gesundheitsscore</div>
        </div>` : ""}

      ${showIndustry ? `
        <div style="display:grid;grid-template-columns:80px 1fr;gap:16px;align-items:center;margin-top:8px;">
          <div>${renderIndustry(processing)}</div>
          <div style="font-size:13px;font-weight:700;opacity:.85;">
            Industrie Verarbeitungsgrad
          </div>
        </div>` : ""}
    </div>
  `;
}

/* ================= ARRAY NORMALIZER ================= */
/* Wandelt JSON-Strings ODER echte Arrays zuverlässig um */
function asArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/* ================= EXTRA DETAILS (Wirkung → Risiken) ================= */
function renderExtraDetails(e) {
  let out = "";

  const list = (title, raw) => {
    const arr = asArray(raw);
    return arr.length
      ? `<h3>${title}</h3><ul>${arr.map(v => `<li>${escapeHtml(v)}</li>`).join("")}</ul>`
      : "";
  };

  if (e.mechanism)
    out += `<h3>Wirkmechanismus</h3><p>${escapeHtml(e.mechanism)}</p>`;

  out += list("Positive Effekte", e.effects_positive);
  out += list("Synergien", e.synergy);

  if (e.scientific_note)
    out += `<h3>Wissenschaftliche Einordnung</h3><p>${escapeHtml(e.scientific_note)}</p>`;

  out += list("Mögliche Nachteile", e.effects_negative);
  out += list("Risikogruppen", e.risk_groups);
  out += list("Natürliche Quellen", e.natural_sources);

  return out;
}

/* ================= KATEGORIEN ================= */
async function loadCategories() {
  const grid = document.querySelector(".category-grid");
  if (!grid) return;

  const data = await fetch("categories.json").then(r => r.json());
  grid.innerHTML = "";

  data.categories.forEach(c => {
    const b = document.createElement("button");
    b.textContent = c.title;
    b.onclick = () => loadCategory(c.title);
    grid.appendChild(b);
  });
}

/* ================= SUCHE / KATEGORIE ================= */
const input = document.getElementById("searchInput");
const results = document.getElementById("results");

if (input) {
  input.addEventListener("input", async () => {
    const q = input.value.trim();
    if (q.length < 2) {
      results.innerHTML = "";
      return;
    }

    const enc = encodeURIComponent(q);
    const data = await supa(
      `entries?select=id,title,summary,score,processing_score&or=(title.ilike.%25${enc}%25,summary.ilike.%25${enc}%25)`
    );

    renderList(data);
  });
}

async function loadCategory(cat) {
  const data = await supa(
    `entries?select=id,title,summary,score,processing_score&category=eq.${encodeURIComponent(cat)}`
  );
  renderList(data);
}

/* ================= LISTE (Kurzansicht mit Scores) ================= */
function renderList(data) {
  results.innerHTML = data.map(e => `
    <div class="entry-card" data-id="${e.id}"
         style="padding:14px;border-bottom:1px solid #ddd;cursor:pointer;">
      <div style="font-size:20px;font-weight:800;">
        ${escapeHtml(e.title)}
      </div>

      ${(e.score || e.processing_score) ? `
        <div style="margin:6px 0 4px 0;display:flex;gap:10px;align-items:center;">
          ${e.score ? `<span style="font-size:15px;">${renderHealth(e.score)}</span>` : ""}
          ${e.processing_score ? renderIndustry(e.processing_score) : ""}
        </div>
      ` : ""}

      <div style="font-size:15px;color:#333;line-height:1.4;">
        ${escapeHtml(shortText(e.summary, 160))}
      </div>
    </div>
  `).join("");
}

/* ===============================
   COMMUNITY REPORT BUTTON
=============================== */

document.addEventListener("DOMContentLoaded", () => {
  const reportBtn = document.getElementById("reportBtn");
  if (!reportBtn) return;

  reportBtn.addEventListener("click", () => {
    // TEMPORÄR: Flow-Start
    console.log("Community-Report gestartet");

    // Platzhalter – gleich ersetzen wir das durch Modal oder Seite
    window.location.hash = "report";
  });
});


/* ================= DETAIL ================= */
async function loadEntry(id) {
  const data = await supa(`entries?select=*&id=eq.${id}`);
  const e = data[0];
  if (!e) return;

  history.replaceState(null, "", "?id=" + id);

  results.innerHTML = `
    <h2>${escapeHtml(e.title)}</h2>

    <div style="margin:4px 0 10px 0;">
      <span class="ms-tooltip" tabindex="0" style="font-size:12px;opacity:.85;">
        🛡️ Rechtssicher eingeordnet
        <span class="ms-tooltip-text">
          MarketShield informiert faktenbasiert und unabhängig.
          Wirkungen werden transparent beschrieben, ohne Heilversprechen,
          da Lebensmittel und Naturstoffe rechtlich nicht als Heilmittel
          dargestellt werden dürfen.
        </span>
      </span>
    </div>

    ${renderScoreBlock(toNum(e.score), toNum(e.processing_score))}
    ${e.summary ? `<h3>Zusammenfassung</h3>${renderTextFromSupabase(e.summary)}` : ""}
    ${renderExtraDetails(e)}
  `;
}
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("reportBtn");
  const modal = document.getElementById("reportModal");
  const close = document.getElementById("closeReportModal");

  if (!btn || !modal) {
    console.log("Report-Button oder Modal fehlt");
    return;
  }

  btn.onclick = () => {
    modal.style.display = "block";
  };

  if (close) {
    close.onclick = () => {
      modal.style.display = "none";
    };
  }
});
