/* =====================================================
   MarketShield – app.js (FINAL / SIMPLE / STABLE)
===================================================== */

/* ================= CONFIG ================= */
const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
const SUPABASE_KEY = "sb_publishable_FBywhrypx6zt_0nMlFudyQ_zFiqZKTD";

/* ================= DOM ================= */
const $ = (id) => document.getElementById(id);

/* ================= SUPABASE (READ) ================= */
async function supa(query) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });
  return r.json();
}

/* ================= LOGGING ================= */

/* Suche → search_queue */
function logSearch(query) {
  if (!query || query.length < 2) return;

  fetch(`${SUPABASE_URL}/rest/v1/search_queue`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    },
    body: JSON.stringify({
      query: query,
      status: "search"
    })
  }).catch(() => {});
}

/* Report → reports */
function logReport(text) {
  if (!text || text.length < 5) return;

  fetch(`${SUPABASE_URL}/rest/v1/reports`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    },
    body: JSON.stringify({
      description: text
    })
  }).catch(() => {});
}

/* ================= RENDER ================= */

function renderList(items) {
  const box = $("results");
  if (!box) return;

  if (!items || !items.length) {
    box.innerHTML = "";
    return;
  }

  box.innerHTML = items.map(e => `
    <div class="entry-card" data-id="${e.id}">
      <strong>${escapeHtml(e.title)}</strong><br>
      <small>${escapeHtml(e.category || "")}</small>
    </div>
  `).join("");
}

function renderEntry(e) {
  const box = $("results");
  if (!box) return;

  box.innerHTML = `
    <h2>${escapeHtml(e.title)}</h2>
    ${e.summary ? `<p style="white-space:pre-wrap;">${escapeHtml(e.summary)}</p>` : ""}
  `;

  const back = $("backHome");
  if (back) back.style.display = "block";
}

/* ================= HELPERS ================= */

function escapeHtml(s) {
  if (s == null) return "";
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ================= SEARCH ================= */

async function loadListBySearch(q) {
  if (!q || q.length < 2) return;

  const enc = encodeURIComponent(q);

  const data = await supa(
    `entries?select=id,title,category` +
    `&or=(title.ilike.%25${enc}%25,summary.ilike.%25${enc}%25)` +
    `&order=title.asc&limit=200`
  );

  renderList(data);
}

/* ================= DETAIL ================= */

async function loadEntry(id) {
  if (!id) return;

  const data = await supa(
    `entries?id=eq.${id}&limit=1`
  );

  if (data && data.length) {
    renderEntry(data[0]);
  }
}

/* ================= EVENTS ================= */

document.addEventListener("click", (e) => {

  /* Report Button NICHT abfangen */
  if (e.target.closest("#reportBtn")) return;

  const back = e.target.closest("#backHome");
  if (back) {
    history.pushState(null, "", location.pathname);
    back.style.display = "none";
    $("results").innerHTML = "";
    return;
  }

  const card = e.target.closest(".entry-card");
  if (!card) return;

  const id = card.dataset.id;
  history.pushState(null, "", "?id=" + id);
  loadEntry(id);
});

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", () => {

  /* Suche */
  const input = $("searchInput");
  if (input) {
    input.addEventListener("input", () => {
      const q = input.value.trim();
      if (q.length < 2) return;

      logSearch(q);        // ✅ immer speichern
      loadListBySearch(q);
    });
  }

  /* Report Form */
  const reportForm = $("reportForm");
  if (reportForm) {
    reportForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const txt = reportForm
        .querySelector("textarea[name='description']")
        .value
        .trim();

      logReport(txt);      // ✅ speichern

      reportForm.reset();
      $("reportModal").style.display = "none";
    });
  }

  /* Deep-Link */
  const id = new URLSearchParams(location.search).get("id");
  if (id) loadEntry(id);
});
