import fs from "fs";
import fetch from "node-fetch";
import { execSync } from "child_process";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
};

// Zielordner für OG-Bilder
const OG_DIR = "./og";
if (!fs.existsSync(OG_DIR)) {
  fs.mkdirSync(OG_DIR, { recursive: true });
}

function esc(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function run() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/seo_pages?published=eq.true&select=slug,meta_title,h1`,
    { headers: HEADERS }
  );

  if (!res.ok) {
    console.error("Supabase error:", await res.text());
    process.exit(1);
  }

  const pages = await res.json();

  if (!Array.isArray(pages)) {
    console.error("Invalid Supabase response (expected array)");
    process.exit(1);
  }

  for (const p of pages) {
    if (!p.slug || !p.meta_title) continue;

    const name = `seo-${p.slug}`;
    const pngPath = `${OG_DIR}/${name}.png`;

    // ✅ nur einmal erzeugen
    if (fs.existsSync(pngPath)) {
      console.log("OG image exists, skipping:", pngPath);
      continue;
    }

    const svgPath = `${OG_DIR}/${name}.svg`;

    const svg = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>

  <text x="60" y="120"
        font-size="36"
        fill="#38bdf8"
        font-family="Arial, Helvetica, sans-serif">
    MarketShield
  </text>

  <foreignObject x="60" y="180" width="1080" height="300">
    <div xmlns="http://www.w3.org/1999/xhtml"
         style="
           color:white;
           font-size:64px;
           font-family:Arial, Helvetica, sans-serif;
           font-weight:bold;
           line-height:1.2;
         ">
      ${esc(p.meta_title)}
    </div>
  </foreignObject>

  <text x="60" y="560"
        font-size="28"
        fill="#94a3b8"
        font-family="Arial, Helvetica, sans-serif">
    marketshield.org
  </text>
</svg>`;

    fs.writeFileSync(svgPath, svg);
    execSync(`npx svgexport ${svgPath} ${pngPath}`, { stdio: "ignore" });

    console.log("OG image generated:", pngPath);
  }
}

run();
