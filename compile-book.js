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
    body { font-family: Georgia, serif; max-width: 700px; margin: 2rem auto; padding: 0 1rem; line-height: 1.8; }
    h1 { text-align: center; margin-top: 3rem; }
    h2 { text-align: center; color: #666; }
    .chapter { page-break-before: always; }
    .chapter-header { text-align: center; margin: 3rem 0; }
    .chapter-num { font-size: 0.9rem; color: #888; text-transform: uppercase; letter-spacing: 0.1em; }
    .chapter-title { font-size: 1.8rem; margin: 0.5rem 0; }
    .chapter-date { font-size: 0.9rem; color: #666; }
    .chapter-image { max-width: 100%; margin: 2rem auto; display: block; }
    p { text-indent: 1.5em; margin: 0.5rem 0; }
    p:first-of-type { text-indent: 0; }
    em { font-style: italic; }
    .glossary dt { font-weight: bold; }
    .glossary dd { margin-left: 1rem; margin-bottom: 1rem; }
  </style>
</head>
<body>
<h1>${BOOK_META.title}</h1>
<h2>${BOOK_META.subtitle}</h2>
<p style="text-align: center;"><strong>By ${BOOK_META.author}</strong></p>
<p style="text-align: center;"><em>${BOOK_META.translator}</em></p>
<p style="text-align: center;"><em>${BOOK_META.illustrator}</em></p>
<hr>
<p style="text-align: center;">${BOOK_META.description}</p>
<hr>
`;

  // Add table of contents
  markdown += '# Table of Contents\n\n';
  html += '<h2>Table of Contents</h2><ol>';

  for (const chapter of chapters) {
    if (chapter.status !== 'published') continue;
    markdown += `- ${chapter.title}\n`;
    html += `<li>${chapter.title}</li>`;
  }
  markdown += '\n\\newpage\n\n';
  html += '</ol><hr>';

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
    html += `<div class="chapter">
  <div class="chapter-header">
    <div class="chapter-num">Chapter ${chapterNum}</div>
    <h1 class="chapter-title">${chapter.title}</h1>
    <div class="chapter-date">${chapter.date}</div>
  </div>`;
    if (chapter.hero) {
      html += `<img src="${chapter.hero}" alt="${chapter.title}" class="chapter-image">`;
    }
    html += cleanedHtml.split('\n\n').map(p => `<p>${p}</p>`).join('\n');
    html += '</div>';

    console.log(`✅ Chapter ${chapterNum}: ${chapter.title}`);
  }

  // Add glossary
  markdown += generateGlossary(glossary);

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
