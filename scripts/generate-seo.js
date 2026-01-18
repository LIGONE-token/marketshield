import fs from "fs";
import fetch from "node-fetch";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

function escapeHtml(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function run() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/seo_pages?published=eq.true`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    }
  );

 const pages = await res.json();

if (!Array.isArray(pages)) {
  console.error("Supabase response is not an array:", pages);
  process.exit(1);
}

for (const p of pages) {

    const contentHtml = p.content
      .map(
        s =>
          `<h2>${escapeHtml(s.h2)}</h2><p>${escapeHtml(s.text)}</p>`
      )
      .join("");

    const faqHtml = (p.faq || [])
      .map(
        f =>
          `<h3>${escapeHtml(f.question)}</h3><p>${escapeHtml(f.answer)}</p>`
      )
      .join("");

    const faqSchema =
      p.faq && p.faq.length
        ? `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": ${JSON.stringify(
    p.faq.map(f => ({
      "@type": "Question",
      "name": f.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.answer
      }
    }))
  )}
}
</script>`
        : "";

    const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(p.meta_title)}</title>
  <meta name="description" content="${escapeHtml(
    p.meta_description
  )}">
  ${faqSchema}
</head>
<body>
  <h1>${escapeHtml(p.h1)}</h1>

  ${contentHtml}

  ${
    p.faq && p.faq.length
      ? `<section><h2>Häufige Fragen</h2>${faqHtml}</section>`
      : ""
  }
</body>
</html>`;

    fs.writeFileSync(`./${p.slug}.html`, html);
    console.log(`✔ generated ${p.slug}.html`);
  }
}

run();
