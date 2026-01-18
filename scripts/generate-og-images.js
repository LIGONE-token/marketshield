import fs from "fs";
import fetch from "node-fetch";
import { execSync } from "child_process";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
};

if (!fs.existsSync("./og")) fs.mkdirSync("./og");

function esc(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

(async () => {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/pages?seo_enabled=eq.true&select=slug,path,seo_title,category_name`,
    { headers: HEADERS }
  );

  const pages = await res.json();

  for (const p of pages) {
    const name = `${p.path}-${p.slug}`.replace(/\//g, "-");
    const svgPath = `./og/${name}.svg`;
    const pngPath = `./og/${name}.png`;

    const svg = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <text x="60" y="120" font-size="36" fill="#38bdf8" font-family="Arial">
    ${esc(p.category_name || "MarketShield")}
  </text>
  <foreignObject x="60" y="180" width="1080" height="300">
    <div xmlns="http://www.w3.org/1999/xhtml"
         style="color:white;font-size:64px;font-family:Arial;font-weight:bold;line-height:1.2">
      ${esc(p.seo_title)}
    </div>
  </foreignObject>
  <text x="60" y="560" font-size="28" fill="#94a3b8" font-family="Arial">
    marketshield.org
  </text>
</svg>`;

    fs.writeFileSync(svgPath, svg);

    execSync(`npx svgexport ${svgPath} ${pngPath}`);

    console.log("OG image generated:", pngPath);
  }
})();
