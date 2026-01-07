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

  let html = '\n<!-- Glossary -->\n<section class="glossary"><h1>Glossary</h1>';

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

  html += '</section>';
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
    /* === PAGED MEDIA CSS === */
    @page {
      size: 5.5in 8.5in;
      margin: 0.875in 0.75in 1in 0.875in;

      @bottom-center {
        content: counter(page);
        font-family: 'Inter', sans-serif;
        font-size: 9pt;
        color: #999;
      }
    }

    @page :left {
      margin-left: 1in;
      margin-right: 0.75in;

      @top-left {
        content: "${BOOK_META.author}";
        font-family: 'Inter', sans-serif;
        font-size: 8pt;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: #bbb;
      }
    }

    @page :right {
      margin-left: 0.75in;
      margin-right: 1in;

      @top-right {
        content: "${BOOK_META.title}";
        font-family: 'Inter', sans-serif;
        font-size: 8pt;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: #bbb;
      }
    }

    @page :first {
      @top-left { content: none; }
      @top-right { content: none; }
      @bottom-center { content: none; }
    }

    @page chapter-start {
      @top-left { content: none; }
      @top-right { content: none; }
    }

    /* === BASE STYLES === */
    :root {
      --font-serif: 'Literata', serif;
      --font-sans: 'Inter', sans-serif;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    html {
      font-size: 11pt;
    }

    body {
      font-family: var(--font-serif);
      color: #1a1a1a;
      line-height: 1.65;
      text-align: justify;
      hyphens: auto;
      font-variant-numeric: oldstyle-nums;
    }

    /* === TITLE PAGE === */
    .title-page {
      page: chapter-start;
      page-break-after: always;
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
    }

    .book-title {
      font-family: var(--font-sans);
      font-size: 3rem;
      line-height: 0.9;
      font-weight: 800;
      letter-spacing: -0.04em;
      margin-bottom: 0.5rem;
    }

    .book-subtitle {
      font-family: var(--font-serif);
      font-size: 1rem;
      font-style: italic;
      color: #666;
      margin-bottom: 3rem;
    }

    .author-name {
      font-family: var(--font-sans);
      font-size: 0.85rem;
      font-weight: 400;
      text-transform: uppercase;
      letter-spacing: 0.35em;
      color: #666;
    }

    .publisher-info {
      position: absolute;
      bottom: 1in;
      font-family: var(--font-sans);
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: #999;
    }

    /* === TABLE OF CONTENTS === */
    .toc {
      page-break-after: always;
    }

    .toc h2 {
      font-family: var(--font-sans);
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3em;
      text-align: center;
      margin-bottom: 2rem;
    }

    .toc ol {
      list-style: none;
      font-family: var(--font-sans);
      font-size: 10pt;
    }

    .toc li {
      padding: 0.3rem 0;
      display: flex;
      justify-content: space-between;
      border-bottom: 1px dotted #ddd;
    }

    .toc li:last-child { border-bottom: none; }
    .toc .num { color: #999; }

    /* === CHAPTERS === */
    .chapter {
      page: chapter-start;
      page-break-before: always;
    }

    .chapter-header {
      text-align: center;
      margin-bottom: 2.5rem;
    }

    .chapter-num {
      font-family: var(--font-sans);
      font-weight: 400;
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.3em;
      color: #999;
      display: block;
      margin-bottom: 0.5rem;
    }

    .chapter-title {
      font-family: var(--font-sans);
      font-weight: 700;
      font-size: 18pt;
      letter-spacing: -0.02em;
      color: #000;
      margin: 0;
    }

    .chapter-image {
      display: block;
      max-width: 100%;
      max-height: 2.5in;
      margin: 1.5rem auto;
    }

    /* === BODY TEXT === */
    p {
      margin-bottom: 0;
      text-indent: 1.5em;
      orphans: 2;
      widows: 2;
    }

    .chapter-header + p,
    .chapter-image + p {
      text-indent: 0;
    }

    em { font-style: italic; }
    strong { font-weight: 700; }

    /* === GLOSSARY === */
    .glossary {
      page-break-before: always;
    }

    .glossary h1 {
      font-family: var(--font-sans);
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3em;
      text-align: center;
      margin-bottom: 1.5rem;
    }

    .glossary h2 {
      font-family: var(--font-sans);
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      margin: 1.25rem 0 0.5rem 0;
      color: #666;
    }

    .glossary dl { font-size: 10pt; }

    .glossary dt {
      font-weight: 600;
      margin-top: 0.5rem;
    }

    .glossary dd {
      margin: 0.1rem 0 0 0;
      font-size: 9.5pt;
      color: #555;
    }

    /* === PREVIEW MODE (before Paged.js runs) === */
    @media screen {
      body {
        max-width: 5.5in;
        margin: 2rem auto;
        padding: 0 1rem;
        background: #f9f9f9;
      }

      .pagedjs_pages {
        max-width: none;
        margin: 0;
        padding: 0;
        background: #444;
      }

      .pagedjs_page {
        background: white;
        margin: 1rem auto;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      }
    }
  </style>
</head>
<body>
<!-- Title Page -->
<section class="title-page">
  <h1 class="book-title">Montafon<br>Moonlight</h1>
  <p class="book-subtitle">${BOOK_META.subtitle}</p>
  <p class="author-name">${BOOK_META.author}</p>
  <p class="publisher-info">Banglangdang Press · ${BOOK_META.year}</p>
</section>
`;

  // Add table of contents
  markdown += '# Table of Contents\n\n';
  html += '<!-- Table of Contents -->\n<nav class="toc"><h2>Contents</h2><ol>';

  let tocNum = 0;
  for (const chapter of chapters) {
    if (chapter.status !== 'published') continue;
    tocNum++;
    markdown += `- ${chapter.title}\n`;
    html += `<li><span>${chapter.title}</span><span class="num">${tocNum}</span></li>`;
  }
  markdown += '\n\\newpage\n\n';
  html += '</ol></nav>';

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

    // HTML version - semantic chapter structure for Paged.js
    html += `\n<!-- Chapter ${chapterNum}: ${chapter.title} -->
<section class="chapter">
  <header class="chapter-header">
    <span class="chapter-num">Chapter ${chapterNum}</span>
    <h1 class="chapter-title">${chapter.title}</h1>
  </header>`;
    if (chapter.hero) {
      html += `\n  <img src="${chapter.hero}" alt="${chapter.title}" class="chapter-image">`;
    }
    html += '\n' + cleanedHtml.split('\n\n').filter(p => p.trim()).map(p => `  <p>${p}</p>`).join('\n');
    html += '\n</section>';

    console.log(`✅ Chapter ${chapterNum}: ${chapter.title}`);
  }

  // Add glossary
  markdown += generateGlossary(glossary);
  html += generateGlossaryHtml(glossary);

  // Close HTML
  // Add Paged.js polyfill for pagination
  html += `
<script src="https://unpkg.com/pagedjs/dist/paged.polyfill.js"></script>
</body></html>`;

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
