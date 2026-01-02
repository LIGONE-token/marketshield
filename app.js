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

function renderSummary(summary = "") {
  const text = normalizeText(summary);
  if (!text) return "";

  const lines = text.split("\n");
  let html = "";

  let paragraph = [];
  let kvBlock = [];
  let pipeBlock = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html += `<p style="margin:0 0 12px;line-height:1.55;">${
      escapeHtml(paragraph.join(" ")).replace(/\n/g, "<br>")
    }</p>`;
    paragraph = [];
  };

  const flushKV = () => {
    if (kvBlock.length < 2) {
      paragraph.push(...kvBlock);
    } else {
      html += `
        <table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:14px;">
          <tbody>
            ${kvBlock.map(l => {
              const [k, v] = l.split(":");
              return `
                <tr>
                  <td style="width:35%;padding:6px;border-bottom:1px solid #eee;"><strong>${escapeHtml(k)}</strong></td>
                  <td style="padding:6px;border-bottom:1px solid #eee;">${escapeHtml(v)}</td>
                </tr>`;
            }).join("")}
          </tbody>
        </table>`;
    }
    kvBlock = [];
  };

  const flushPipe = () => {
    const rows = pipeBlock
      .map(l => l.split("|").map(c => c.trim()).filter(Boolean))
      .filter(r => r.length >= 2);

    if (rows.length < 2) {
      paragraph.push(...pipeBlock);
    } else {
      const head = rows[0];
      const body = rows.slice(1);

      html += `
        <table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:14px;">
          <thead>
            <tr>${head.map(h => `<th style="text-align:left;border-bottom:2px solid #ccc;padding:6px;">${escapeHtml(h)}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${body.map(r => `
              <tr>${r.map(c => `<td style="padding:6px;border-bottom:1px solid #eee;">${escapeHtml(c)}</td>`).join("")}</tr>
            `).join("")}
          </tbody>
        </table>`;
    }
    pipeBlock = [];
  };

  for (const line of lines) {
    const l = line.trim();

    if (!l) {
      flushPipe(); flushKV(); flushParagraph();
      continue;
    }

    if (l.includes("|")) {
      flushParagraph(); flushKV();
      pipeBlock.push(l);
      continue;
    }

    if (/^[^:]{2,40}:\s+.+$/.test(l)) {
      flushParagraph(); flushPipe();
      kvBlock.push(l);
      continue;
    }

    flushPipe(); flushKV();
    paragraph.push(l);
  }

  flushPipe(); flushKV(); flushParagraph();
  return html;
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

   <div id="ratingBox" style="margin:8px 0;">
  <span style="font-size:14px;">
    <strong>Nutzerbewertung:</strong>
    ${avg.toFixed(1).replace(".",",")}/5 (${cnt})
  </span>
  <span id="ratingStars" style="font-size:22px;cursor:pointer;margin-left:6px;vertical-align:middle;">
    ${[1,2,3,4,5].map(n =>
      `<span data-star="${n}">${Math.round(avg)>=n?"⭐":"☆"}</span>`
    ).join("")}
  </span>
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
