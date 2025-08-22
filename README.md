# MontafonMoonlight (static site)

This repo hosts your novel translation website with **dark/light mode**, **JSON-synced metadata**, **prev/next**, **floating TOC**, and **RSS/sitemap** generation (client-side).

## Files
- `index.html` — renders chapter cards from `chapters.json`, shows stats, drafts toggle, and buttons to download `feed.xml` and `sitemap.xml`.
- `chapter.html` — shows a single chapter page; header metadata comes from `chapters.json` via `?slug=...`.
- `chapters.json` — the single source of truth for chapter metadata.
- `assets/placeholder-*.jpg` — placeholder images.
- `robots.txt`, `404.html` — optional niceties for SEO and navigation.

## Live URL (GitHub Pages)
Project site will be available at:
**https://omatty123.github.io/MontafonMoonlight/**

### Enable Pages
Repo → Settings → Pages → Source: *Deploy from a branch* → Branch: `main` → Folder: `/ (root)` → Save.

## Edit base URL (only if you change repo/name)
Open `index.html` and set:
```js
const SITE = {
  title: 'The Chronicles of Ethereal Realm',
  description: 'Serialized translation project — new chapters every Monday.',
  baseUrl: 'https://omatty123.github.io/MontafonMoonlight/',
};
```

## Add a new chapter (2 steps)
1. Paste the prose into `chapter.html` inside `<article id="contentRoot">…</article>`.
2. Append a new object to `chapters.json` with fields:
```json
{
  "title": "Chapter 4: ...",
  "slug": "chapter-4-...",
  "href": "chapter.html?slug=chapter-4-...",
  "date": "2025-09-01",
  "readTime": 9,
  "words": 3100,
  "cover": "assets/ch4.jpg",
  "caption": "Optional caption",
  "summary": "One-line teaser",
  "status": "published"
}
```
Commit + push. Index, stats, prev/next, RSS, and sitemap update automatically.
