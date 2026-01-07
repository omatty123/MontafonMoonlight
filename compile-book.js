/**
 * compile-book.js
 * Compiles all chapters into a single manuscript for print/ebook
 *
 * Output formats:
 * - manuscript.md (Markdown for Pandoc)
 * - manuscript.html (Single HTML file)
 *
 * Usage:
 *   node compile-book.js
 *
 * Then convert with Pandoc:
 *   pandoc manuscript.md -o book.pdf --pdf-engine=xelatex
 *   pandoc manuscript.md -o book.epub
 */

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();

// Book metadata
const BOOK_META = {
  title: "Montafon Moonlight",
  subtitle: "A Journey of Friendship, Music, and Silence",
  author: "Jeong Chanju",
  translator: "English translation",
  illustrator: "Illustrations by Jeong Yun-gyeong",
  year: new Date().getFullYear(),
  description: "The story of a Buddhist novelist's friendship with Austrian composer Herbert Willi in the alpine Montafon valley."
};

// Load chapters.json
function loadChapters() {
  const chaptersPath = path.join(ROOT, 'chapters.json');
  const data = fs.readFileSync(chaptersPath, 'utf8');
  return JSON.parse(data);
}

// Load translation glossary
function loadGlossary() {
  const glossaryPath = path.join(ROOT, 'translation-glossary.json');
  if (fs.existsSync(glossaryPath)) {
    const data = fs.readFileSync(glossaryPath, 'utf8');
    return JSON.parse(data).glossary || [];
  }
  return [];
}

// Clean HTML content for print
function cleanHtmlForPrint(html) {
  return html
    // Remove wrapper divs
    .replace(/<div[^>]*>/gi, '')
    .replace(/<\/div>/gi, '')
    // Convert br tags to proper paragraph breaks
    .replace(/<br\s*\/?>/gi, '\n')
    // Keep em, strong, p tags
    // Remove image credits for now (will add as figure captions)
    .replace(/<p class="image-credit"[^>]*>.*?<\/p>/gi, '')
    // Clean up whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Convert HTML to Markdown
function htmlToMarkdown(html) {
  return html
    // Paragraphs
    .replace(/<p>/gi, '')
    .replace(/<\/p>/gi, '\n\n')
    // Emphasis
    .replace(/<em>/gi, '*')
    .replace(/<\/em>/gi, '*')
    // Strong
    .replace(/<strong>/gi, '**')
    .replace(/<\/strong>/gi, '**')
    // Line breaks
    .replace(/<br\s*\/?>/gi, '  \n')
    // Clean up
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Generate front matter
function generateFrontMatter() {
  return `---
title: "${BOOK_META.title}"
subtitle: "${BOOK_META.subtitle}"
author: "${BOOK_META.author}"
date: "${BOOK_META.year}"
lang: en
documentclass: book
fontsize: 11pt
geometry: margin=1in
toc: true
toc-depth: 1
---

# ${BOOK_META.title}

## ${BOOK_META.subtitle}

**By ${BOOK_META.author}**

*${BOOK_META.translator}*

*${BOOK_META.illustrator}*

---

${BOOK_META.description}

\\newpage

`;
}

// Generate glossary section
function generateGlossary(glossary) {
  if (glossary.length === 0) return '';

  let md = '\n\\newpage\n\n# Glossary of Korean and Buddhist Terms\n\n';

  // Group by type (people, places, concepts)
  const people = glossary.filter(g => g.note && (g.note.includes('Author') || g.note.includes('Mrs.') || g.note.includes('Mr.') || g.note.includes('Venerable') || g.note.includes('Professor') || g.note.includes('Chairwoman') || g.note.includes('Dr.')));
  const places = glossary.filter(g => g.note && (g.note.includes('Temple') || g.note.includes('Province') || g.note.includes('valley') || g.note.includes('Austria') || g.note.includes('residence') || g.note.includes('Hermitage')));
  const concepts = glossary.filter(g => !people.includes(g) && !places.includes(g));

  if (people.length > 0) {
    md += '## People\n\n';
    for (const term of people) {
      md += `**${term.english}** (${term.korean}) — ${term.note}\n\n`;
    }
  }

  if (places.length > 0) {
    md += '## Places\n\n';
    for (const term of places) {
      md += `**${term.english}** (${term.korean}) — ${term.note}\n\n`;
    }
  }

  if (concepts.length > 0) {
    md += '## Concepts and Terms\n\n';
    for (const term of concepts) {
      md += `**${term.english}** (${term.korean}) — ${term.note}\n\n`;
    }
  }

  return md;
}

// Generate glossary for HTML
function generateGlossaryHtml(glossary) {
  if (glossary.length === 0) return '';

  let html = '\n<!-- Glossary -->\n<div class="spread single"><article class="page recto glossary-page"><div class="spine-shadow-right"></div><div class="content"><h1>Glossary</h1>';

  // Group by type (people, places, concepts)
  const people = glossary.filter(g => g.note && (g.note.includes('Author') || g.note.includes('Mrs.') || g.note.includes('Mr.') || g.note.includes('Venerable') || g.note.includes('Professor') || g.note.includes('Chairwoman') || g.note.includes('Dr.')));
  const places = glossary.filter(g => g.note && (g.note.includes('Temple') || g.note.includes('Province') || g.note.includes('valley') || g.note.includes('Austria') || g.note.includes('residence') || g.note.includes('Hermitage')));
  const concepts = glossary.filter(g => !people.includes(g) && !places.includes(g));

  if (people.length > 0) {
    html += '<h2>People</h2><dl class="glossary">';
    for (const term of people) {
      html += `<dt>${term.english} (${term.korean})</dt><dd>${term.note}</dd>`;
    }
    html += '</dl>';
  }

  if (places.length > 0) {
    html += '<h2>Places</h2><dl class="glossary">';
    for (const term of places) {
      html += `<dt>${term.english} (${term.korean})</dt><dd>${term.note}</dd>`;
    }
    html += '</dl>';
  }

  if (concepts.length > 0) {
    html += '<h2>Concepts and Terms</h2><dl class="glossary">';
    for (const term of concepts) {
      html += `<dt>${term.english} (${term.korean})</dt><dd>${term.note}</dd>`;
    }
    html += '</dl>';
  }

  html += '</div></article></div>';
  return html;
}

// Main compilation function
function compileBook() {
  console.log('📚 Compiling Montafon Moonlight book...\n');

  const chapters = loadChapters();
  const glossary = loadGlossary();

  // Sort chapters by number (extract from contentHtml path)
  chapters.sort((a, b) => {
    const numA = parseInt(a.contentHtml.match(/chapter-(\d+)/)?.[1] || '0');
    const numB = parseInt(b.contentHtml.match(/chapter-(\d+)/)?.[1] || '0');
    return numA - numB;
  });

  console.log(`Found ${chapters.length} chapters`);
  console.log(`Found ${glossary.length} glossary terms\n`);

  // Start with front matter
  let markdown = generateFrontMatter();
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${BOOK_META.title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,700;1,7..72,400&display=swap" rel="stylesheet">
  <style>
    :root {
      --paper: #ffffff;
      --ink: #1a1a1a;
      --font-serif: 'Literata', serif;
      --font-sans: 'Inter', sans-serif;
      --page-width: 5.8in;
      --page-height: 8.7in;
      --margin-outer: 0.8in;
      --margin-inner: 1.1in;
      --margin-top: 1in;
      --margin-bottom: 1in;
      --line-height: 1.65;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      background: #111;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px 0;
      font-family: var(--font-serif);
      color: var(--ink);
    }

    /* Two-page spread */
    .spread {
      display: flex;
      gap: 2px;
      box-shadow: 0 40px 100px rgba(0, 0, 0, 0.8);
      margin-bottom: 60px;
    }

    /* Single page (title, etc) */
    .spread.single .page {
      border-radius: 4px;
    }

    /* Book page */
    .page {
      width: var(--page-width);
      min-height: var(--page-height);
      background: var(--paper);
      position: relative;
      display: flex;
      flex-direction: column;
      padding: var(--margin-top) 0 var(--margin-bottom) 0;
    }

    .page.verso {
      padding-left: var(--margin-outer);
      padding-right: var(--margin-inner);
      border-radius: 4px 0 0 4px;
    }

    .page.recto {
      padding-left: var(--margin-inner);
      padding-right: var(--margin-outer);
      border-radius: 0 4px 4px 0;
    }

    /* Content area */
    .content {
      flex: 1;
      text-align: justify;
      hyphens: auto;
      font-size: 11.5pt;
      line-height: var(--line-height);
      font-variant-numeric: oldstyle-nums;
    }

    /* Running headers */
    .running-head {
      position: absolute;
      top: 0.5in;
      width: calc(100% - var(--margin-inner) - var(--margin-outer));
      font-family: var(--font-sans);
      font-size: 8pt;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: #bbb;
      text-align: center;
    }

    .verso .running-head { left: var(--margin-outer); }
    .recto .running-head { left: var(--margin-inner); }

    /* Page numbers */
    .page-number {
      text-align: center;
      font-family: var(--font-sans);
      font-size: 9pt;
      font-weight: 400;
      color: #ccc;
      margin-top: 2rem;
      padding-bottom: 0.5in;
    }

    /* Spine shadows */
    .spine-shadow-left {
      position: absolute;
      top: 0; right: 0;
      width: 40px; height: 100%;
      background: linear-gradient(to right, transparent, rgba(0,0,0,0.05));
      pointer-events: none;
    }

    .spine-shadow-right {
      position: absolute;
      top: 0; left: 0;
      width: 40px; height: 100%;
      background: linear-gradient(to left, transparent, rgba(0,0,0,0.05));
      pointer-events: none;
    }

    /* Frontispiece */
    .frontispiece {
      justify-content: center;
      align-items: center;
      padding: 1in;
    }

    .frontispiece img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    /* Title page */
    .title-page {
      text-align: center;
      justify-content: space-between;
      padding: 1.25in 0.9in;
    }

    .book-title {
      font-family: var(--font-sans);
      font-size: 3.5rem;
      line-height: 0.85;
      font-weight: 800;
      letter-spacing: -0.04em;
      margin-top: 0.5in;
    }

    .author-name {
      font-family: var(--font-sans);
      font-size: 0.85rem;
      font-weight: 400;
      text-transform: uppercase;
      letter-spacing: 0.4em;
      margin-top: 2.5rem;
      color: #666;
    }

    .publisher-info {
      font-family: var(--font-sans);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: #999;
      margin-bottom: 0.2in;
    }

    /* Table of contents */
    .toc-page { font-family: var(--font-sans); }

    .toc-page h2 {
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3em;
      margin-bottom: 2rem;
      text-align: center;
    }

    .toc-page ol {
      list-style: none;
      font-size: 10pt;
    }

    .toc-page li {
      padding: 0.3rem 0;
      display: flex;
      justify-content: space-between;
      border-bottom: 1px dotted #ddd;
    }

    .toc-page li:last-child { border-bottom: none; }
    .toc-page .num { color: #999; }

    /* Chapter header */
    .chapter-header {
      text-align: center;
      margin-bottom: 50pt;
    }

    .chapter-num {
      font-family: var(--font-sans);
      font-weight: 400;
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.3em;
      color: #999;
      margin-bottom: 8pt;
      display: block;
    }

    h1.chapter-title {
      font-family: var(--font-sans);
      font-weight: 700;
      font-size: 20pt;
      letter-spacing: -0.03em;
      color: #000;
      margin: 0;
    }

    .chapter-image {
      max-width: 100%;
      max-height: 180px;
      margin: 0 auto 1.5rem auto;
      display: block;
    }

    /* Body text */
    p {
      margin-bottom: 0.5em;
      text-indent: 1.5em;
    }

    p:first-of-type { text-indent: 0; }

    em { font-style: italic; }
    strong { font-weight: 700; }

    /* Glossary */
    .glossary-page h1 {
      font-family: var(--font-sans);
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3em;
      text-align: center;
      margin-bottom: 1.5rem;
    }

    .glossary-page h2 {
      font-family: var(--font-sans);
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      margin: 1.25rem 0 0.5rem 0;
      color: #666;
    }

    .glossary dt {
      font-weight: 600;
      font-size: 10pt;
      margin-top: 0.5rem;
    }

    .glossary dd {
      margin: 0.1rem 0 0 0;
      font-size: 9.5pt;
      color: #555;
    }

    /* Print styles */
    @media print {
      body { background: white; padding: 0; }
      .spread { box-shadow: none; gap: 0; margin: 0; page-break-after: always; }
      .page { border: 1px solid #eee; }
    }
  </style>
</head>
<body>
<!-- Title Page Spread -->
<div class="spread">
  <article class="page verso frontispiece">
    <div class="spine-shadow-left"></div>
    <img src="assets/og-cover.jpg" alt="Cover artwork">
  </article>
  <article class="page recto title-page">
    <div class="spine-shadow-right"></div>
    <div class="title-top">
      <h1 class="book-title">Montafon<br>Moonlight</h1>
      <p class="author-name">${BOOK_META.author}</p>
    </div>
    <div class="publisher-info">
      Banglangdang Press<br>
      ${BOOK_META.year}
    </div>
  </article>
</div>
`;

  // Add table of contents
  markdown += '# Table of Contents\n\n';
  html += '<!-- Table of Contents -->\n<div class="spread single"><article class="page recto toc-page"><div class="spine-shadow-right"></div><div class="content"><h2>Contents</h2><ol>';

  let tocNum = 0;
  for (const chapter of chapters) {
    if (chapter.status !== 'published') continue;
    tocNum++;
    markdown += `- ${chapter.title}\n`;
    html += `<li><span>${chapter.title}</span><span class="num">${tocNum}</span></li>`;
  }
  markdown += '\n\\newpage\n\n';
  html += '</ol></div></article></div>';

  // Compile each chapter
  let chapterNum = 0;
  for (const chapter of chapters) {
    if (chapter.status !== 'published') continue;
    chapterNum++;

    const contentPath = path.join(ROOT, chapter.contentHtml);

    if (!fs.existsSync(contentPath)) {
      console.log(`⚠️  Missing: ${chapter.contentHtml}`);
      continue;
    }

    const rawHtml = fs.readFileSync(contentPath, 'utf8');
    const cleanedHtml = cleanHtmlForPrint(rawHtml);
    const chapterMd = htmlToMarkdown(cleanedHtml);

    // Markdown version
    markdown += `# Chapter ${chapterNum}: ${chapter.title}\n\n`;
    markdown += `*${chapter.date}*\n\n`;
    if (chapter.hero) {
      markdown += `![${chapter.title}](${chapter.hero})\n\n`;
    }
    markdown += chapterMd;
    markdown += '\n\n\\newpage\n\n';

    // HTML version - single page per chapter that grows naturally
    html += `\n<!-- Chapter ${chapterNum}: ${chapter.title} -->
<div class="spread single">
  <article class="page recto chapter-page">
    <div class="running-head">${BOOK_META.title}</div>
    <div class="spine-shadow-right"></div>
    <div class="content">
      <div class="chapter-header">
        <span class="chapter-num">Chapter ${chapterNum}</span>
        <h1 class="chapter-title">${chapter.title}</h1>
      </div>`;
    if (chapter.hero) {
      html += `\n      <img src="${chapter.hero}" alt="${chapter.title}" class="chapter-image">`;
    }
    html += '\n' + cleanedHtml.split('\n\n').filter(p => p.trim()).map(p => `      <p>${p}</p>`).join('\n');
    html += `
    </div>
    <div class="page-number">${chapterNum}</div>
  </article>
</div>`;

    console.log(`✅ Chapter ${chapterNum}: ${chapter.title}`);
  }

  // Add glossary
  markdown += generateGlossary(glossary);
  html += generateGlossaryHtml(glossary);

  // Close HTML
  html += '</body></html>';

  // Write output files
  fs.writeFileSync(path.join(ROOT, 'manuscript.md'), markdown);
  fs.writeFileSync(path.join(ROOT, 'manuscript.html'), html);

  console.log('\n✨ Book compilation complete!');
  console.log('   📄 manuscript.md - Markdown for Pandoc');
  console.log('   📄 manuscript.html - Single HTML file');
  console.log('\nNext steps:');
  console.log('   pandoc manuscript.md -o book.pdf --pdf-engine=xelatex');
  console.log('   pandoc manuscript.md -o book.epub');
}

// Run
compileBook();
