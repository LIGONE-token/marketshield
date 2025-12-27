/* =====================================================
   MarketShield – app.js (STABIL / TABELLEN ENDLICH RICHTIG)
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

function cleanText(text = "") {
  return String(text)
    .replace(/\*\*/g, "")
    .replace(/##+/g, "")
    .replace(/__+/g, "")
    .replace(/~~+/g, "")
    .replace(/`+/g, "")
    .replace(/:contentReference\[[^\]]*\]\{[^}]*\}/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

/* ================= TABELLEN – ENDGÜLTIG KORREKT ================= */
function renderSummary(text) {
  const lines = cleanText(text).split("\n");
  let html = "";
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 👉 echte Markdown-Tabelle erkennen
    if (
      line.includes("|") &&
      lines[i + 1] &&
      /^[-\s|]+$/.test(lines[i + 1])
    ) {
      const tableLines = [];
      tableLines.push(line); // Header
      i += 2;                // Separator überspringen

      while (i < lines.length && lines[i].includes("|")) {
        tableLines.push(lines[i]);
        i++;
      }

      const rows = tableLines.map(l =>
        l.split("|").map(c => c.trim()).filter(Boolean)
      );

      if (rows.length >= 2) {
        const head = rows.shift();
        const cols = head.length;

        const norm = r => {
          const out = r.slice(0, cols);
          while (out.length < cols) out.push("");
          return out;
        };

        html += `
          <table class="ms-table">
            <thead>
              <tr>${norm(head).map(h => `<th>${escapeHtml(h)}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${rows.map(r =>
                `<tr>${norm(r).map(c => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`
              ).join("")}
            </tbody>
          </table>
        `;
      }
      continue;
    }

    // 👉 normaler Text
    if (line.trim()) {
      html += `<p>${escapeHtml(line)}</p>`;
    }
    i++;
  }

  return html;
}

/* ================= DETAIL ================= */
async function loadEntry(id) {
  const e = (await supa(`entries?select=*&id=eq.${id}`))[0];
  if (!e) return;

  $("results").innerHTML = `
    <h2>${escapeHtml(e.title)}</h2>
    <div class="entry-content">
      ${renderSummary(e.summary)}
    </div>
  `;
}

/* ================= NAV ================= */
document.addEventListener("click", (e) => {
  const card = e.target.closest(".entry-card");
  if (!card) return;
  loadEntry(card.dataset.id);
});

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  const id = new URLSearchParams(location.search).get("id");
  if (id) loadEntry(id);
});
