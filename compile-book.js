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

  let html = '\n<!-- Glossary -->\n<div class="page glossary-page"><h1>Glossary</h1>';

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

  html += '</div>';
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
  <title>${BOOK_META.title}</title>
  <style>
    * { box-sizing: border-box; }

    body {
      font-family: Georgia, 'Times New Roman', serif;
      background: #4a4a4a;
      margin: 0;
      padding: 2rem;
      line-height: 1.8;
      font-size: 11pt;
    }

    /* Book page styling */
    .page {
      background: #fffef8;
      max-width: 550px;
      min-height: 750px;
      margin: 0 auto 3rem auto;
      padding: 60px 70px;
      box-shadow:
        0 0 20px rgba(0,0,0,0.3),
        inset 0 0 60px rgba(0,0,0,0.05);
      position: relative;
      border: 1px solid #d4d0c8;
    }

    .page::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 30px;
      background: linear-gradient(to right, rgba(0,0,0,0.08), transparent);
    }

    /* Title page */
    .title-page {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
    }

    .title-page h1 {
      font-size: 2.5rem;
      margin: 0 0 0.5rem 0;
      font-weight: normal;
      letter-spacing: 0.05em;
    }

    .title-page h2 {
      font-size: 1.2rem;
      font-weight: normal;
      font-style: italic;
      color: #555;
      margin: 0 0 3rem 0;
    }

    .title-page .author {
      font-size: 1.1rem;
      margin: 2rem 0 0.5rem 0;
    }

    .title-page .meta {
      font-size: 0.9rem;
      color: #666;
      font-style: italic;
    }

    .title-page hr {
      width: 40%;
      border: none;
      border-top: 1px solid #999;
      margin: 2rem 0;
    }

    .title-page .description {
      font-size: 0.95rem;
      max-width: 400px;
      color: #444;
      line-height: 1.6;
    }

    /* Table of contents */
    .toc-page h2 {
      text-align: center;
      font-size: 1.5rem;
      font-weight: normal;
      margin-bottom: 2rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    .toc-page ol {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .toc-page li {
      padding: 0.4rem 0;
      border-bottom: 1px dotted #ccc;
      display: flex;
      justify-content: space-between;
    }

    .toc-page li:last-child {
      border-bottom: none;
    }

    /* Chapter pages */
    .chapter-page .chapter-header {
      text-align: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #ddd;
    }

    .chapter-page .chapter-num {
      font-size: 0.8rem;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      margin-bottom: 0.5rem;
    }

    .chapter-page .chapter-title {
      font-size: 1.6rem;
      font-weight: normal;
      margin: 0.5rem 0;
      line-height: 1.3;
    }

    .chapter-page .chapter-date {
      font-size: 0.85rem;
      color: #888;
      font-style: italic;
    }

    .chapter-page .chapter-image {
      max-width: 100%;
      max-height: 250px;
      margin: 1.5rem auto;
      display: block;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }

    .chapter-page p {
      text-indent: 1.5em;
      margin: 0 0 0.8em 0;
      text-align: justify;
      hyphens: auto;
    }

    .chapter-page p:first-of-type {
      text-indent: 0;
    }

    .chapter-page p:first-of-type::first-letter {
      font-size: 3em;
      float: left;
      line-height: 0.8;
      padding-right: 0.1em;
      color: #333;
    }

    em { font-style: italic; }
    strong { font-weight: bold; }

    /* Glossary */
    .glossary-page h1 {
      text-align: center;
      font-size: 1.5rem;
      font-weight: normal;
      margin-bottom: 2rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    .glossary-page h2 {
      font-size: 1.1rem;
      margin: 1.5rem 0 0.75rem 0;
      color: #444;
      border-bottom: 1px solid #ddd;
      padding-bottom: 0.25rem;
    }

    .glossary dt {
      font-weight: bold;
      font-size: 0.95rem;
      margin-top: 0.75rem;
    }

    .glossary dd {
      margin: 0.25rem 0 0 1.5rem;
      font-size: 0.9rem;
      color: #555;
    }

    /* Page number */
    .page-number {
      position: absolute;
      bottom: 30px;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 0.85rem;
      color: #888;
    }

    /* Print styles */
    @media print {
      body { background: white; padding: 0; }
      .page {
        box-shadow: none;
        margin: 0;
        page-break-after: always;
        border: none;
      }
      .page::before { display: none; }
    }
  </style>
</head>
<body>
<!-- Title Page -->
<div class="page title-page">
  <h1>${BOOK_META.title}</h1>
  <h2>${BOOK_META.subtitle}</h2>
  <hr>
  <p class="author">By ${BOOK_META.author}</p>
  <p class="meta">${BOOK_META.translator}</p>
  <p class="meta">${BOOK_META.illustrator}</p>
  <hr>
  <p class="description">${BOOK_META.description}</p>
</div>
`;

  // Add table of contents
  markdown += '# Table of Contents\n\n';
  html += '<!-- Table of Contents -->\n<div class="page toc-page"><h2>Contents</h2><ol>';

  let tocNum = 0;
  for (const chapter of chapters) {
    if (chapter.status !== 'published') continue;
    tocNum++;
    markdown += `- ${chapter.title}\n`;
    html += `<li><span>${chapter.title}</span><span>${tocNum}</span></li>`;
  }
  markdown += '\n\\newpage\n\n';
  html += '</ol></div>';

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

    // HTML version
    html += `\n<!-- Chapter ${chapterNum} -->\n<div class="page chapter-page">
  <div class="chapter-header">
    <div class="chapter-num">Chapter ${chapterNum}</div>
    <h1 class="chapter-title">${chapter.title}</h1>
    <div class="chapter-date">${chapter.date}</div>
  </div>`;
    if (chapter.hero) {
      html += `\n  <img src="${chapter.hero}" alt="${chapter.title}" class="chapter-image">`;
    }
    html += '\n  <div class="chapter-content">\n';
    html += cleanedHtml.split('\n\n').map(p => `    <p>${p}</p>`).join('\n');
    html += '\n  </div>\n  <div class="page-number">' + chapterNum + '</div>\n</div>';

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
