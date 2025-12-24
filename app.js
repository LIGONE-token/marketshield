/* =====================================================
   MarketShield – app.js (FINAL / STABIL)
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

/* ================= SUMMARY WITH TABLES ================= */

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

    // ===== Tabelle erkannt =====
    if (isPipeRow(line)) {
      flushParagraph();

      const rows = [];
      while (i < lines.length && (isPipeRow(lines[i]) || isSeparator(lines[i]))) {
        if (!isSeparator(lines[i])) {
          const cells = lines[i]
            .split("|")
            .map(c => c.trim())
            .filter(c => c !== "");
          rows.push(cells);
        }
        i++;
      }

      if (rows.length) {
        html += `<div class="summary-table-wrap"><table class="summary-table">`;

        // Header
        html += "<thead><tr>";
        rows[0].forEach(c => html += `<th>${escapeHtml(c)}</th>`);
        html += "</tr></thead>";

        // Body
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

/* ================= GENERIC TEXT BLOCK ================= */

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

/* ================= LOAD ENTRY ================= */

async function loadEntry(id) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/entries?id=eq.${id}`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    }
  );

  const data = await res.json();
  if (!data || !data.length) return;

  const e = data[0];
  const container = document.getElementById("content");

  container.innerHTML = `
    <h1>${escapeHtml(e.title)}</h1>

    <!-- SUMMARY (MIT TABELLEN) -->
    <h3>Zusammenfassung</h3>
    ${renderSummaryWithTables(e.summary)}

    ${renderTextBlock("Mechanismus", e.mechanism)}
    ${renderTextBlock("Wissenschaftlicher Hinweis", e.scientific_note)}
  `;
}

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (id) loadEntry(id);
});
