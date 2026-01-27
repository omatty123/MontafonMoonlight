/**
 * generate-chapters.js
 * Fully automated static page generator for Montafon Moonlight
 */

import fs from "fs";
import path from "path";

const BASE_URL = "https://omatty123.github.io/MontafonMoonlight/";
const ROOT = process.cwd();
const OG_DIR = path.join(ROOT, "og");

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
  <meta property="og:url" content="${BASE_URL}og/${chapter.slug}.html">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Montafon Moonlight – ${chapter.title}">
  <meta name="twitter:description" content="${chapter.summary.replace(/"/g, '&quot;')}">
  <meta name="twitter:image" content="${BASE_URL}${chapter.cover}">

  <link rel="stylesheet" href="../assets/all-serif.css">
</head>
<body>
  <script>
    window.location.href = "${BASE_URL}chapter.html?slug=${chapter.slug}";
  </script>
  <noscript>
    <p>This chapter: <a href="${BASE_URL}chapter.html?slug=${chapter.slug}">${chapter.title}</a></p>
  </noscript>
</body>
</html>
`;

function cleanOldChapters() {
  // Clean old chapter files from root directory
  console.log("🧹 Cleaning old chapter files from root...");
  const rootFiles = fs.readdirSync(ROOT);
  // IMPORTANT: Keep this allowlist updated with all non-chapter HTML files!
  const PROTECTED_FILES = [
    "index.html",
    "chapter.html",
    "chapter-template.html",
    "chapter-maker.html",
    "chapter-workflow-tool-v2.html",
    "cast.html",
    "places.html",
    "404.html",
    "book.html",
    "read.html"
  ];
  const htmlFiles = rootFiles.filter(f =>
    f.endsWith(".html") && !PROTECTED_FILES.includes(f)
  );
  for (const f of htmlFiles) {
    fs.unlinkSync(path.join(ROOT, f));
    console.log(`   🗑️  Removed ${f} from root`);
  }

  // Clean old chapter files from og directory
  if (fs.existsSync(OG_DIR)) {
    console.log("🧹 Cleaning old chapter files from og/...");
    const ogFiles = fs.readdirSync(OG_DIR);
    for (const f of ogFiles.filter(f => f.endsWith(".html"))) {
      fs.unlinkSync(path.join(OG_DIR, f));
      console.log(`   🗑️  Removed ${f} from og/`);
    }
  }
}

function main() {
  const chapters = JSON.parse(fs.readFileSync(path.join(ROOT, "chapters.json"), "utf8"));

  cleanOldChapters();

  // Create og directory if it doesn't exist
  if (!fs.existsSync(OG_DIR)) {
    fs.mkdirSync(OG_DIR);
    console.log("📁 Created og/ directory");
  }

  console.log("🪶 Generating chapter OG pages in og/...");
  const links = [];
  for (const ch of chapters) {
    const filePath = path.join(OG_DIR, `${ch.slug}.html`);
    fs.writeFileSync(filePath, template(ch));
    const link = `${BASE_URL}og/${ch.slug}.html`;
    links.push(link);
    console.log(`   ✅  Created og/${ch.slug}.html`);
  }

  console.log("\n✨ All static OG pages ready for deploy.");
  console.log("📤 Share-ready links:\n");
  links.forEach(l => console.log("   " + l));
  console.log("\n");
}

main();
