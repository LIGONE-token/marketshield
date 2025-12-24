/* =====================================================
   MarketShield – app.js (FINAL / STABIL / KOMPLETT)
===================================================== */

/* ================= CONFIG ================= */
const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
const SUPABASE_KEY = "sb_publishable_FBywhrypx6zt_0nMlFudyQ_zFiqZKTD";

/* ================= HELPERS ================= */

function normalizeText(text) {
  if (!text) return "";
  return String(text)
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isThema(e) {
  return String(e.type).toLowerCase() === "thema";
}

/* ================= SUMMARY (MIT TABELLEN) ================= */

function renderSummaryWithTables(summary) {
  if (!summary) return "";

  const lines = normalizeText(summary).split("\n");
  let html = "";
  let buffer = [];

  function flushParagraph() {
    if (!buffer.length) return;
    html += `<p>${buffer.join("<br>")}</p>`;
    buffer = [];
  }

  function isSeparator(line) {
    return /^[-\s|]+$/.test(line);
  }

  function isPipeRow(line) {
    return (line.match(/\|/g) || []).length >= 2;
  }

  for (let i = 0; i < lines.length; ) {
    const line = lines[i].trim();

    if (!line) {
      flushParagraph();
      i++;
      continue;
    }

    if (isPipeRow(line)) {
      flushParagraph();

      const rows = [];
      while (i < lines.length && (isPipeRow(lines[i]) || isSeparator(lines[i]))) {
        if (!isSeparator(lines[i])) {
          const cells = lines[i]
            .split("|")
            .map(c => c.trim())
            .filter(Boolean);
          rows.push(cells);
        }
        i++;
      }

      if (rows.length) {
        html += `<div class="summary-table-wrap"><table class="summary-table">`;

        html += "<thead><tr>";
        rows[0].forEach(c => html += `<th>${escapeHtml(c)}</th>`);
        html += "</tr></thead>";

        html += "<tbody>";
        for (let r = 1; r < rows.length; r++) {
          html += "<tr>";
          rows[r].forEach(c => html += `<td>${escapeHtml(c)}</td>`);
          html += "</tr>";
        }
        html += "</tbody></table></div>";
      }
      continue;
    }

    buffer.push(escapeHtml(line));
    i++;
  }

  flushParagraph();
  return html;
}

/* ================= TEXT BLOCK ================= */

function renderTextBlock(title, text) {
  if (!text) return "";
  return `
    <div class="text-block">
      <h3>${title}</h3>
      <div style="white-space:pre-wrap;line-height:1.6;">
        ${escapeHtml(normalizeText(text))}
      </div>
    </div>
  `;
}

/* ================= DATA FETCH ================= */

async function supa(query) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  return r.json();
}

/* ================= LISTE ================= */

async function loadList(filter = {}) {
  let q = "entries?select=id,title,summary,category,type&order=title.asc";

  if (filter.category) {
    q += `&category=eq.${encodeURIComponent(filter.category)}`;
  }

  if (filter.search) {
    const s = encodeURIComponent(`%${filter.search}%`);
    q += `&or=(title.ilike.${s},summary.ilike.${s})`;
  }

  const data = await supa(q);
  const container = document.getElementById("content");

  if (!data || !data.length) {
    container.innerHTML = "<p>Keine Einträge gefunden.</p>";
    return;
  }

  container.innerHTML = data.map(e => `
    <div class="entry-card" data-id="${e.id}">
      <h3>${escapeHtml(e.title)}</h3>
      <p>${escapeHtml(e.summary?.slice(0, 200) || "")}…</p>
      <small>${escapeHtml(e.category)} · ${escapeHtml(e.type)}</small>
    </div>
  `).join("");
}

/* ================= DETAIL ================= */

async function loadEntry(id) {
  const data = await supa(`entries?id=eq.${id}`);
  if (!data || !data.length) return;

  const e = data[0];
  const container = document.getElementById("content");

  container.innerHTML = `
    <h1>${escapeHtml(e.title)}</h1>

    <h3>Zusammenfassung</h3>
    ${renderSummaryWithTables(e.summary)}

    ${
      isThema(e)
        ? ""
        : renderTextBlock("Mechanismus", e.mechanism)
    }

    ${
      isThema(e)
        ? ""
        : renderTextBlock("Wissenschaftlicher Hinweis", e.scientific_note)
    }
  `;
}

/* ================= KATEGORIEN ================= */

async function loadCategories() {
  const cats = await supa("entries?select=category");
  const box = document.getElementById("categories");
  if (!box) return;

  const uniq = [...new Set(cats.map(c => c.category).filter(Boolean))].sort();

  box.innerHTML = uniq.map(c => `
    <button class="cat-btn" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>
  `).join("");
}

/* ================= SUCHE ================= */

function initSearch() {
  const input = document.getElementById("searchInput");
  if (!input) return;

  input.addEventListener("input", () => {
    const q = input.value.trim();
    if (q.length < 2) {
      loadList();
    } else {
      loadList({ search: q });
    }
  });
}

/* ================= NAVIGATION ================= */

document.addEventListener("click", (e) => {
  const card = e.target.closest(".entry-card");
  if (card) {
    const id = card.dataset.id;
    history.pushState(null, "", "?id=" + id);
    loadEntry(id);
  }

  const cat = e.target.closest(".cat-btn");
  if (cat) {
    loadList({ category: cat.dataset.cat });
  }
});

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", () => {
  console.log("MarketShield app.js loaded");

  loadCategories();
  initSearch();

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (id) {
    loadEntry(id);
  } else {
    loadList();
  }
});
