/* =====================================================
   MarketShield – app.js
   FINAL / STABIL / NOTFALL-REPAIR (ALLES MUSS LAUFEN)
===================================================== */

let currentEntryId = null;

/* ================= SUPABASE ================= */
const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
const SUPABASE_KEY = "sb_publishable_FBywhrypx6zt_0nMlFudyQ_zFiqZKTD";

async function supa(query, opts = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${query}`;

  const r = await fetch(url, {
    method: opts.method || "GET",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(opts.headers || {})
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });

  const t = await r.text();
  if (!r.ok) {
    // wir werfen absichtlich eine klare Fehlermeldung
    throw new Error(t || `HTTP ${r.status} ${r.statusText}`);
  }
  return t ? JSON.parse(t) : [];
}

/* ================= DOM ================= */
const elResults     = document.getElementById("results");
const elSearch      = document.getElementById("searchInput");
const elBackHome    = document.getElementById("backHome");
const elReportBtn   = document.getElementById("reportBtn");
const elReportModal = document.getElementById("reportModal");
const elReportForm  = document.getElementById("reportForm");
const elReportClose = document.getElementById("closeReportModal");

/* ================= UI HELPERS ================= */
function safeText(s) {
  // minimaler Schutz gegen kaputtes HTML aus Daten
  return String(s ?? "").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function showError(title, err) {
  if (!elResults) return;
  const msg = err?.message ? String(err.message) : String(err || "");
  elResults.innerHTML = `
    <div id="shareBox"></div>
    <div style="padding:14px;border:1px solid rgba(0,0,0,.15);border-radius:12px;">
      <div style="font-weight:800;font-size:16px;margin-bottom:6px;">${safeText(title)}</div>
      <div style="white-space:pre-wrap;opacity:.9;line-height:1.5;">${safeText(msg)}</div>
      <div style="margin-top:10px;opacity:.7;font-size:13px;">
        Hinweis: Wenn hier <b>401</b> oder <b>RLS</b> steht, blockt Supabase deine Abfrage (Policy/Key).
      </div>
    </div>
  `;
}

/* ================= SCORES ================= */
function renderHealthScore(score) {
  const n = Number(score);
  if (!Number.isFinite(n) || n < 1 || n > 100) return "";
  if (n >= 80) return "💚💚💚";
  if (n >= 60) return "💚💚";
  if (n >= 40) return "💚";
  if (n >= 20) return "💛";
  return "⚠️";
}

function renderIndustryScore(score) {
  const n = Number(score);
  if (!Number.isFinite(n) || n < 1) return "";
  const clamped = Math.min(10, n);
  const width = Math.round((clamped / 10) * 100);
  const hue = Math.round(120 - clamped * 12);
  return `
    <div style="margin-top:6px;">
      <div style="height:6px;background:#ddd;border-radius:4px;overflow:hidden;">
        <div style="width:${width}%;height:6px;background:hsl(${hue},85%,45%);"></div>
      </div>
    </div>`;
}

/* ================= RENDER LIST ================= */
function renderList(data = []) {
  if (!elResults) return;

  elResults.innerHTML = `
    <div id="shareBox"></div>
    ${data.map(e => `
      <div class="entry-card" data-id="${safeText(e.id)}">
        <div style="font-size:18px;font-weight:800;">${safeText(e.title)}</div>

        ${renderHealthScore(e.score) ? `<div>${renderHealthScore(e.score)}</div>` : ""}

        ${(e.type !== "thema" && Number(e.processing_score) > 0)
          ? renderIndustryScore(e.processing_score) : ""}

        <div style="font-size:14px;opacity:.85;">
          ${safeText((e.summary || "").slice(0,160))}…
        </div>
      </div>
    `).join("")}
  `;

  if (elBackHome) elBackHome.style.display = "none";
}

/* ================= HOME LOAD (WICHTIG!) ================= */
async function loadHome() {
  if (!elResults) return;
  currentEntryId = null;

  // Home darf NIE leer bleiben -> wir laden immer eine Liste
  try {
    const data = await supa(
      // wenn du ein idx Feld hast, kannst du auf idx sortieren. Wir sortieren sicher auf title.
      `entries?select=id,title,summary,score,processing_score,type&order=title.asc&limit=50`
    );
    renderList(data);
    if (elBackHome) elBackHome.style.display = "none";
  } catch (err) {
    showError("MarketShield konnte die Einträge nicht laden.", err);
  }
}

/* ================= DETAIL ================= */
async function loadEntry(id) {
  if (!elResults) return;

  try {
    const d = await supa(`entries?select=*&id=eq.${encodeURIComponent(id)}`);
    const e = d[0];
    if (!e) {
      showError("Eintrag nicht gefunden.", `ID: ${id}`);
      return;
    }

    currentEntryId = e.id;

    elResults.innerHTML = `
      <div id="shareBox"></div>
      <h2>${safeText(e.title)}</h2>

      <div style="margin:10px 0;">
        ${renderHealthScore(e.score) ? `<div>${renderHealthScore(e.score)}</div>` : ""}
        ${(e.type !== "thema" && Number(e.processing_score) > 0)
          ? renderIndustryScore(e.processing_score) : ""}
      </div>

      <div style="white-space:pre-wrap;line-height:1.6;">
        ${safeText(e.summary || "")}
      </div>
    `;

    if (elBackHome) elBackHome.style.display = "block";
  } catch (err) {
    showError("Eintrag konnte nicht geladen werden.", err);
  }
}

/* ================= ROUTER ================= */
function route() {
  const id = new URLSearchParams(location.search).get("id");
  if (id) loadEntry(id);
  else loadHome();
}

/* ================= EVENT DELEGATION: KLICK AUF KARTE ================= */
if (elResults) {
  elResults.addEventListener("click", (e) => {
    const card = e.target.closest(".entry-card");
    if (!card) return;
    const id = card.dataset.id;
    if (!id) return;

    history.pushState({ id }, "", "?id=" + encodeURIComponent(id));
    loadEntry(id);
  });
}

/* ================= SUCHE ================= */
async function smartSearch(q) {
  if (q.length < 2) return [];
  const enc = encodeURIComponent(q);

  // OR Titel oder Summary (wichtig, sonst wirkt es "kaputt")
  return await supa(
    `entries?select=id,title,summary,score,processing_score,type&or=(title.ilike.%25${enc}%25,summary.ilike.%25${enc}%25)&order=title.asc&limit=50`
  );
}

if (elSearch) {
  elSearch.addEventListener("input", async () => {
    const q = elSearch.value.trim();

    if (q.length < 2) {
      route(); // statt leer: zurück zur Startansicht
      return;
    }

    try {
      const res = await smartSearch(q);
      renderList(res);
    } catch (err) {
      showError("Suche fehlgeschlagen.", err);
    }
  });
}

/* ================= BACK HOME ================= */
if (elBackHome) {
  elBackHome.addEventListener("click", () => {
    history.pushState({}, "", location.pathname);
    if (elSearch) elSearch.value = "";
    loadHome();
  });
}

/* ================= REPORT ================= */
function openReport() {
  if (!elReportModal) return;
  elReportModal.style.display = "block";
}
function closeReport() {
  if (!elReportModal) return;
  elReportModal.style.display = "none";
}

if (elReportBtn) elReportBtn.addEventListener("click", openReport);
if (elReportClose) elReportClose.addEventListener("click", closeReport);

// ESC schließt Modal
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeReport();
});

if (elReportForm) {
  elReportForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const txt = (elReportForm.description?.value || "").trim();
    if (txt.length < 3) return;

    try {
      await supa("reports", {
        method: "POST",
        body: {
          description: txt,
          entry_id: currentEntryId || null
        }
      });

      elReportForm.reset();
      closeReport();
      alert("Danke! Meldung wurde gespeichert.");
    } catch (err) {
      showError("Report konnte nicht gespeichert werden.", err);
    }
  });
}

/* ================= HISTORY ================= */
window.addEventListener("popstate", route);

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  // Wenn results NICHT existiert -> das ist der Hauptgrund, warum „nichts geht“
  if (!elResults) {
    // fallback: versuche wenigstens eine Meldung in body
    const div = document.createElement("div");
    div.style.padding = "14px";
    div.style.fontFamily = "system-ui, Arial";
    div.style.border = "1px solid rgba(0,0,0,.15)";
    div.style.borderRadius = "12px";
    div.style.margin = "14px";
    div.innerHTML = `<b>Fehler:</b> Element mit id="results" nicht gefunden. Prüfe HTML-IDs.`;
    document.body.prepend(div);
    return;
  }

  route();
});
