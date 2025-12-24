/* =====================================================
   MarketShield – app.js (FINAL / FEHLERFREI)
   PASSEND ZUR BESTEHENDEN index.html
===================================================== */

/* ================= CONFIG ================= */
const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
const SUPABASE_KEY = "sb_publishable_FBywhrypx6zt_0nMlFudyQ_zFiqZKTD";

/* ================= BASIS ================= */

function $(id) {
  return document.getElementById(id);
}

function mainContainer() {
  return $("results");
}

function escapeHtml(s) {
  if (!s) return "";
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

function isThema(e) {
  return String(e.type).toLowerCase() === "thema";
}

/* ================= SUPABASE ================= */

async function supa(query) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  return res.json();
}

/* ================= SUMMARY MIT TABELLEN ================= */

function renderSummaryWithTables(summary) {
  if (!summary) return "";

  const lines = normalizeText(summary).split("\n");
  let html = "";
  let buffer = [];

  const flush = () => {
    if (buffer.length) {
      html += `<p>${buffer.join("<br>")}</p>`;
      buffer = [];
    }
  };

  const isSeparator = l => /^[-\s|]+$/.test(l);
  const isPipeRow = l => (l.match(/\|/g) || []).length >= 2;

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
              .map(c => c.trim())
              .filter(Boolean)
          );
        }
        i++;
      }

      if (rows.length) {
        html += `<table class="summary-table"><tr>`;
        rows[0].forEach(c => (html += `<th>${escapeHtml(c)}</th>`));
        html += "</tr>";

        for (let r = 1; r < rows.length; r++) {
          html += "<tr>";
          rows[r].forEach(c => (html += `<td>${escapeHtml(c)}</td>`));
          html += "</tr>";
        }
        html += "</table>";
      }
      continue;
    }

    buffer.push(escapeHtml(line));
    i++;
  }

  flush();
  return html;
}

/* ================= LISTE ================= */

async function loadList(search = "", category = "") {
  let query = "entries?select=id,title,summary,category,type&order=title.asc";

  if (search) {
    const s = encodeURIComponent(`%${search}%`);
    query += `&or=(title.ilike.${s},summary.ilike.${s})`;
  }

  if (category) {
    query += `&category=eq.${encodeURIComponent(category)}`;
  }

  const data = await supa(query);
  const box = mainContainer();
  if (!box) return;

  if (!data || !data.length) {
    box.innerHTML = "<p>Keine Einträge gefunden.</p>";
    return;
  }

  box.innerHTML = data
    .map(
      e => `
      <div class="entry-card" data-id="${e.id}">
        <strong>${escapeHtml(e.title)}</strong><br>
        <small>${escapeHtml(e.category)} · ${escapeHtml(e.type)}</small>
      </div>
    `
    )
    .join("");
}

/* ================= DETAIL ================= */

async function loadEntry(id) {
  const data = await supa(`entries?id=eq.${id}`);
  if (!data || !data.length) return;

  const e = data[0];
  const box = mainContainer();
  if (!box) return;

  box.innerHTML = `
    <h2>${escapeHtml(e.title)}</h2>
    ${renderSummaryWithTables(e.summary)}
    ${
      isThema(e)
        ? ""
        : e.mechanism
        ? `<h3>Mechanismus</h3><p>${escapeHtml(e.mechanism)}</p>`
        : ""
    }
  `;

  const back = $("backHome");
  if (back) back.style.display = "block";
}

/* ================= KATEGORIEN ================= */

async function loadCategories() {
  const data = await supa("entries?select=category");
  const grid = document.querySelector(".category-grid");
  if (!grid) return;

  const cats = [...new Set(data.map(d => d.category).filter(Boolean))].sort();

  grid.innerHTML = cats
    .map(c => `<button class="cat-btn" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`)
    .join("");
}

/* ================= SUCHE ================= */

function initSearch() {
  const input = $("searchInput");
  if (!input) return;

  input.addEventListener("input", () => {
    const q = input.value.trim();
    if (q.length < 2) {
      loadList();
    } else {
      loadList(q);
    }
  });
}

/* ================= NAVIGATION ================= */

document.addEventListener("click", e => {
  // Report-Button UNANTASTBAR
  if (e.target.closest("#reportBtn")) return;

  const card = e.target.closest(".entry-card");
  if (card) {
    history.pushState(null, "", "?id=" + card.dataset.id);
    loadEntry(card.dataset.id);
    return;
  }

  const cat = e.target.closest(".cat-btn");
  if (cat) {
    loadList("", cat.dataset.cat);
    return;
  }

  const back = e.target.closest("#backHome");
  if (back) {
    back.style.display = "none";
    history.pushState(null, "", location.pathname);
    loadList();
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
    loadList();
  }
});
