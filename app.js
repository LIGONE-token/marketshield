/* =====================================================
   MarketShield – app.js (FINAL / STABIL / KORREKT)
   PASSEND ZUR BESTEHENDEN index.html
===================================================== */

/* ================= CONFIG ================= */
const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
const SUPABASE_KEY = "sb_publishable_FBywhrypx6zt_0nMlFudyQ_zFiqZKTD";

/* ================= DOM HELPERS ================= */
const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelector(sel);

function resultsBox() {
  return $("results"); // existiert in index.html
}
function backHomeBtn() {
  return $("backHome");
}

/* ================= TEXT HELPERS ================= */
function escapeHtml(s) {
  if (s === null || s === undefined) return "";
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeText(text) {
  if (!text) return "";
  return String(text)
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isThema(entry) {
  return String(entry?.type || "").toLowerCase() === "thema";
}

/* ================= SUPABASE ================= */
async function supa(pathAndQuery) {
  const url = `${SUPABASE_URL}/rest/v1/${pathAndQuery}`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    const msg = data?.message || data?.error || text || "Unbekannter Fehler";
    throw new Error(`Supabase (${res.status}): ${msg}`);
  }
  return data || [];
}

/* ================= RENDER CORE ================= */
function setResultsHTML(innerHtml) {
  const box = resultsBox();
  if (!box) return;
  // ShareBox bleibt immer erhalten (index.html enthält sie)
  box.innerHTML = `<div id="shareBox"></div>${innerHtml || ""}`;
}

function clearResults(showHint = true) {
  if (showHint) {
    setResultsHTML(`
      <p style="margin-top:12px;">
        Tippe oben in die Suche (mind. 2 Zeichen) oder wähle eine Kategorie.
      </p>
    `);
  } else {
    setResultsHTML("");
  }
}

function showBackHome(show) {
  const el = backHomeBtn();
  if (!el) return;
  el.style.display = show ? "block" : "none";
}

/* ================= SUMMARY WITH TABLES ================= */
function renderSummaryWithTables(summary) {
  if (!summary) return "";

  const lines = normalizeText(summary).split("\n");
  let html = "";
  let buffer = [];

  const flush = () => {
    if (!buffer.length) return;
    html += `<p>${buffer.join("<br>")}</p>`;
    buffer = [];
  };

  const isSeparator = (l) => /^[-\s|]+$/.test(l);
  const isPipeRow = (l) => (l.match(/\|/g) || []).length >= 2;

  for (let i = 0; i < lines.length; ) {
    const line = lines[i].trim();

    if (!line) {
      flush();
      i++;
      continue;
    }

    if (isPipeRow(line)) {
      flush();
      const rows = [];
      while (i < lines.length && (isPipeRow(lines[i]) || isSeparator(lines[i]))) {
        if (!isSeparator(lines[i])) {
          rows.push(
            lines[i]
              .split("|")
              .map((c) => c.trim())
              .filter(Boolean)
          );
        }
        i++;
      }
      if (rows.length) {
        html += `<div class="summary-table-wrap"><table class="summary-table">`;
        html += "<thead><tr>";
        rows[0].forEach((c) => (html += `<th>${escapeHtml(c)}</th>`));
        html += "</tr></thead><tbody>";
        for (let r = 1; r < rows.length; r++) {
          html += "<tr>";
          rows[r].forEach((c) => (html += `<td>${escapeHtml(c)}</td>`));
          html += "</tr>";
        }
        html += "</tbody></table></div>";
      }
      continue;
    }

    buffer.push(escapeHtml(line));
    i++;
  }

  flush();
  return html;
}

/* ================= LIST RENDER ================= */
function renderList(items) {
  if (!items || !items.length) {
    setResultsHTML(`<p>Keine Treffer gefunden.</p>`);
    return;
  }

  setResultsHTML(
    items
      .map((e) => {
        const title = escapeHtml(e.title);
        const category = escapeHtml(e.category || "");
        const type = escapeHtml(e.type || "");
        const snippet = escapeHtml((e.summary || "").slice(0, 200));
        const dots = (e.summary || "").length > 200 ? "…" : "";

        return `
          <div class="entry-card" data-id="${e.id}">
            <div style="font-weight:700;">${title}</div>
            ${snippet ? `<div style="margin-top:6px;opacity:.9;">${snippet}${dots}</div>` : ""}
            <div style="margin-top:8px;font-size:13px;opacity:.7;">
              ${category}${category && type ? " · " : ""}${type}
            </div>
          </div>
        `;
      })
      .join("")
  );
}

/* ================= DATA LOADERS ================= */
async function loadListBySearch(q) {
  const query = q.trim();
  if (query.length < 2) {
    clearResults(true);
    return;
  }
  const enc = encodeURIComponent(`%${query}%`);
  const data = await supa(
    `entries?select=id,title,summary,category,type&or=(title.ilike.${enc},summary.ilike.${enc})&order=title.asc&limit=200`
  );
  showBackHome(false);
  renderList(data);
}

async function loadListByCategory(category) {
  const cat = String(category || "").trim();
  if (!cat) return;
  const data = await supa(
    `entries?select=id,title,summary,category,type&category=eq.${encodeURIComponent(cat)}&order=title.asc&limit=500`
  );
  showBackHome(false);
  renderList(data);
}

async function loadEntry(id) {
  const entryId = String(id || "").trim();
  if (!entryId) return;

  const data = await supa(`entries?id=eq.${entryId}&limit=1`);
  if (!data || !data.length) {
    setResultsHTML(`<p>Eintrag nicht gefunden.</p>`);
    return;
  }

  const e = data[0];
  showBackHome(true);

  // Themen: keine Scores/Extra-Fachblöcke erzwingen
  const blocks = [];
  if (!isThema(e)) {
    if (e.mechanism) {
      blocks.push(`<h3>Mechanismus</h3><p>${escapeHtml(normalizeText(e.mechanism))}</p>`);
    }
    if (e.scientific_note) {
      blocks.push(`<h3>Wissenschaftlicher Hinweis</h3><p>${escapeHtml(normalizeText(e.scientific_note))}</p>`);
    }
  }

  setResultsHTML(`
    <div class="entry-detail" data-id="${escapeHtml(e.id)}">
      <h2 style="margin-top:10px;">${escapeHtml(e.title)}</h2>
      <div style="margin:6px 0 14px;opacity:.7;">
        ${escapeHtml(e.category || "")}${e.category && e.type ? " · " : ""}${escapeHtml(e.type || "")}
      </div>

      <h3>Zusammenfassung</h3>
      <div class="entry-summary">
        ${renderSummaryWithTables(e.summary)}
      </div>

      ${blocks.length ? `<div class="entry-blocks">${blocks.join("")}</div>` : ""}
    </div>
  `);
}

/* ================= CATEGORIES ================= */
async function loadCategories() {
  const grid = $$(".category-grid");
  if (!grid) return;

  const data = await supa("entries?select=category");
  const cats = [...new Set(data.map((d) => d.category).filter(Boolean))].sort();

  grid.innerHTML = cats
    .map(
      (c) => `<button class="cat-btn" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`
    )
    .join("");
}

/* ================= SEARCH ================= */
function initSearch() {
  const input = $("searchInput");
  if (!input) return;

  input.addEventListener("input", () => {
    const q = input.value.trim();
    if (q.length < 2) {
      clearResults(true);
      return;
    }
    loadListBySearch(q);
  });
}

/* ================= NAVIGATION ================= */
document.addEventListener("click", (e) => {
  // Report-Button bleibt UNANTASTBAR
  if (e.target.closest("#reportBtn")) return;

  const card = e.target.closest(".entry-card");
  if (card) {
    history.pushState(null, "", "?id=" + card.dataset.id);
    loadEntry(card.dataset.id);
    return;
  }

  const cat = e.target.closest(".cat-btn");
  if (cat) {
    loadListByCategory(cat.dataset.cat);
    return;
  }

  const back = e.target.closest("#backHome");
  if (back) {
    back.style.display = "none";
    history.pushState(null, "", location.pathname);
    clearResults(true);
  }
});

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
  initSearch();

  const id = new URLSearchParams(location.search).get("id");
  if (id) {
    loadEntry(id);
  } else {
    // Startseite bewusst leer (suchgetrieben)
    clearResults(true);
  }
});
