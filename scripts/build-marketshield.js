/* FINAL MarketShield Generator
 * - liest Supabase (anon)
 * - erzeugt fertige HTML-Seiten
 * - erzeugt OG-Bilder
 * - keine manuelle Pflege
 */

import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { createCanvas } from "canvas";

const SUPABASE_URL = "https://thrdlycfwlsegriduqvw.supabase.co";
const SUPABASE_KEY = "sb_publishable_JHb4LBhP26eI7BgDS1jIkw_4OYn3-F9";

const OUT_DIR = "marketshield/generated";
const OG_DIR = `${OUT_DIR}/og`;

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(OG_DIR, { recursive: true });

async function fetchEntries() {
  const url = `${SUPABASE_URL}/rest/v1/entries?select=slug,title,meta_title,meta_description,canonical_url,summary,mechanism,scientific_note,effects_positive,effects_negative,risk_groups,synergy,natural_sources,tags,score,processing_score`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });
  if (!res.ok) throw new Error("Supabase fetch failed");
  return res.json();
}

function renderHTML(e) {
  const title = (e.meta_title || e.title || "").trim();
  const desc = (e.meta_description || "").trim();
  const url = e.canonical_url || `https://ligone-token.github.io/marketshield/${e.slug}`;
  const ogImg = `${url}/og.png`;

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>${title} | MarketShield</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${url}">

<meta property="og:type" content="article">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ogImg}">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${ogImg}">
</head>
<body>
<h1>${e.title}</h1>
${e.summary ? `<p>${e.summary}</p>` : ""}
${e.mechanism ? `<h2>Mechanismus</h2><p>${e.mechanism}</p>` : ""}
${e.scientific_note ? `<h2>Wissenschaftliche Einordnung</h2><p>${e.scientific_note}</p>` : ""}
</body>
</html>`;
}

function renderOG(slug, title) {
  const c = createCanvas(1200, 630);
  const x = c.getContext("2d");
  x.fillStyle = "#0b0f19";
  x.fillRect(0, 0, 1200, 630);
  x.fillStyle = "#ffffff";
  x.font = "bold 56px sans-serif";
  x.fillText("MarketShield", 80, 120);
  x.font = "36px sans-serif";
  wrap(x, title, 80, 240, 1040, 44);
  fs.writeFileSync(`${OG_DIR}/${slug}.png`, c.toBuffer("image/png"));
}

function wrap(ctx, text, x, y, maxW, lh) {
  const words = text.split(" ");
  let line = "";
  for (let n = 0; n < words.length; n++) {
    const test = line + words[n] + " ";
    if (ctx.measureText(test).width > maxW && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + " ";
      y += lh;
    } else line = test;
  }
  ctx.fillText(line, x, y);
}

(async () => {
  const entries = await fetchEntries();
  for (const e of entries) {
    if (!e.slug) continue;
    const dir = path.join(OUT_DIR, e.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), renderHTML(e));
    renderOG(e.slug, e.meta_title || e.title);
  }
  console.log(`OK: ${entries.length} Seiten erzeugt`);
})();
