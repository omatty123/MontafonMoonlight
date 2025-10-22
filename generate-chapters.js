/**
 * generate-chapters.js
 * Generates one static OG-tag HTML file per chapter
 * and places them directly in the repo root.
 */

import fs from "fs";
import path from "path";

const BASE_URL = "https://omatty123.github.io/MontafonMoonlight/";
const ROOT = process.cwd();

const template = (chapter) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Montafon Moonlight – ${chapter.title}</title>

  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Montafon Moonlight">
  <meta property="og:title" content="Montafon Moonlight – ${chapter.title}">
  <meta property="og:description" content="${chapter.summary.replace(/"/g, '&quot;')}">
  <meta property="og:image" content="${BASE_URL}${chapter.cover}">
  <meta property="og:url" content="${BASE_URL}${chapter.slug}.html">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Montafon Moonlight – ${chapter.title}">
  <meta name="twitter:description" content="${chapter.summary.replace(/"/g, '&quot;')}">
  <meta name="twitter:image" content="${BASE_URL}${chapter.cover}">

  <link rel="stylesheet" href="assets/all-serif.css">
</head>
<body>
  <script>
    // Redirect human visitors to the dynamic reader
    window.location.href = "${BASE_URL}chapter.html?slug=${chapter.slug}";
  </script>
  <noscript>
    <p>This chapter: <a href="${BASE_URL}chapter.html?slug=${chapter.slug}">${chapter.title}</a></p>
  </noscript>
</body>
</html>
`;

function cleanOldChapters() {
  const files = fs.readdirSync(ROOT);
  const htmlFiles = files.filter(f => f.endsWith(".html") && !["index.html", "chapter.html", "chapter-template.html", "chapter-maker.html", "404.html"].includes(f));
  for (const f of htmlFiles) {
    fs.unlinkSync(path.join(ROOT, f));
    console.log(`🗑️  Removed old ${f}`);
  }
}

function main() {
  const chapters = JSON.parse(fs.readFileSync(path.join(ROOT, "chapters.json"), "utf8"));

  console.log("🧹 Cleaning old static chapter files...");
  cleanOldChapters();

  console.log("🪶 Generating new chapter pages...");
  for (const ch of chapters) {
    const filePath = path.join(ROOT, `${ch.slug}.html`);
    fs.writeFileSync(filePath, template(ch));
    console.log(`✅  Created ${filePath}`);
  }

  console.log("✨ Done. All static OG pages ready for deploy.");
}

main();
