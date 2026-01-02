/* =====================================================
   MarketShield – app.js (STABIL / NEU)
===================================================== */

/* ========== GLOBAL ========= */
let currentEntryId = null;

/* ========== SUPABASE ========= */
const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
const SUPABASE_KEY = "sb_publishable_JHb4LBhP26eI7BgDS1jIkw_4OYn3-F9";

async function supa(query) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });
  if (!r.ok) throw new Error(await r.text());
  return await r.json();
}

/* ========== HELPERS ========= */
const $ = id => document.getElementById(id);

function escapeHtml(s = "") {
  return String(s).replace(/[&<>]/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;"
  })[c]);
}

function normalizeText(t="") {
  return t.replace(/\r/g,"").replace(/\n{3,}/g,"\n\n").trim();
}

function renderSummary(summary) {
  return normalizeText(summary)
    .split("\n\n")
    .map(p => `<p>${escapeHtml(p).replace(/\n/g,"<br>")}</p>`)
    .join("");
}

/* ========== LISTE ========= */
function renderList(data) {
  const box = $("results");
  box.innerHTML = data.map(e => `
    <div class="entry-card" data-id="${e.id}">
      <strong>${escapeHtml(e.title)}</strong>
      <div style="opacity:.8;font-size:14px;">
        ${escapeHtml(e.summary.slice(0,120))}…
      </div>
    </div>
  `).join("");

  box.querySelectorAll(".entry-card").forEach(card => {
    card.onclick = () => {
      const id = card.dataset.id;
      history.pushState({}, "", "?id=" + id);
      loadEntry(id);
    };
  });
}

/* ========== DETAIL ========= */
async function loadEntry(id) {
  const box = $("results");
  const [e] = await supa(`entries_with_ratings?id=eq.${id}`);
  if (!e) return;

  currentEntryId = id;

  const avg = Number(e.rating_avg)||0;
  const cnt = Number(e.rating_count)||0;

  box.innerHTML = `
    <h2>${escapeHtml(e.title)}</h2>

    <div id="ratingBox">
      <div>
        <strong>Nutzerbewertung:</strong>
        ${avg.toFixed(1).replace(".",",")}/5 (${cnt})
      </div>
      <div id="ratingStars" style="font-size:26px;cursor:pointer;">
        ${[1,2,3,4,5].map(n =>
          `<span data-star="${n}">${Math.round(avg)>=n?"⭐":"☆"}</span>`
        ).join("")}
      </div>
    </div>

    <h3>Zusammenfassung</h3>
    <div class="entry-summary">
      ${renderSummary(e.summary)}
    </div>
  `;

  $("ratingStars").querySelectorAll("span").forEach(star => {
    star.onclick = async ev => {
      ev.stopPropagation();
      const v = Number(star.dataset.star);
      await fetch(`${SUPABASE_URL}/rest/v1/entry_ratings`,{
        method:"POST",
        headers:{
          apikey:SUPABASE_KEY,
          Authorization:`Bearer ${SUPABASE_KEY}`,
          "Content-Type":"application/json"
        },
        body:JSON.stringify({ entry_id:id, rating:v })
      });
      loadEntry(id);
    };
  });
}

/* ========== START ========= */
document.addEventListener("DOMContentLoaded", async () => {
  const id = new URLSearchParams(location.search).get("id");
  if (id) {
    loadEntry(id);
  } else {
    const data = await supa("entries_with_ratings?limit=20");
    renderList(data);
  }
});
