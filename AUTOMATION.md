# Automated Chapter Sync Documentation

## Overview

This repository has automated syncing from Google Sheets to `chapters.json`, which then triggers automatic chapter page generation.

## How It Works

### 1. **Google Sheets → chapters.json Sync**
- **Script**: `sync-from-sheets.js`
- **Workflow**: `.github/workflows/sync-from-sheets.yml`
- **Schedule**: Runs every Monday at 9:00 AM UTC
- **Manual Trigger**: Available via GitHub Actions tab

The sync script:
1. Fetches data from your Google Sheet as CSV
2. Parses the columns: Title, Date, Slug, Korean Link, Summary
3. Auto-generates the additional fields needed for chapters.json:
   - `href`: Generated from slug
   - `cover`: `assets/ch{N}-cover.jpg` (with `?v=2` for chapters 4-8)
   - `hero`: `assets/ch{N}-hero.jpg` (with `?v=2` for chapters 4-8)
   - `status`: Always set to "published"
   - `contentHtml`: `content/chapter-{N}.html`
4. Converts markdown formatting to HTML (`*text*` → `<em>text</em>`)
5. Writes the updated `chapters.json`
6. Commits and pushes if changes detected

### 2. **chapters.json → Chapter Pages**
- **Script**: `generate-chapters.js`
- **Workflow**: `.github/workflows/auto-generate.yml`
- **Trigger**: Automatically runs when `chapters.json` is updated

This generates individual `.html` files for each chapter with proper Open Graph metadata for social sharing.

## Workflow Sequence

```
Google Sheets (manual update)
    ↓
Weekly sync (or manual trigger)
    ↓
chapters.json updated
    ↓
Auto-generate workflow triggered
    ↓
Chapter .html pages created
    ↓
Changes pushed to GitHub
    ↓
Site deployed via GitHub Pages
```

## Manual Commands

```bash
# Sync from Google Sheets
npm run sync:sheets

# Generate chapter pages
npm run build:chapters
```

## Google Sheet Structure

Your sheet should have these columns in order:
1. **Title** - Chapter title
2. **Korean Title** - Korean translation (informational, not used in JSON)
3. **Date** - Publication date (YYYY-MM-DD format)
4. **Slug** - URL-friendly identifier (e.g., "vienna-bound-plane")
5. **Korean Link** - Link to Korean version on mediabuddha.net
6. **Summary** - Brief description (can use `*text*` for italic)

## Important Notes

- **Chapter Numbers**: Auto-assigned based on row order in the sheet (1st row = Chapter 1)
- **Assets**: Make sure image files exist at `assets/ch{N}-cover.jpg` and `assets/ch{N}-hero.jpg`
- **Content**: HTML content files should exist at `content/chapter-{N}.html`
- **Summary Formatting**: Use `*word*` for italic text (converted to `<em>word</em>`)

## Troubleshooting

- **Sync not running**: Check GitHub Actions tab for errors
- **Missing images**: Ensure assets follow the naming convention `ch{N}-cover.jpg`
- **Wrong data**: Verify your Google Sheet has the correct column headers
- **Manual sync needed**: Go to Actions → "Sync chapters.json from Google Sheets" → Run workflow

## Google Sheet URL

Your sheet: https://docs.google.com/spreadsheets/d/1rz1KvXpjPzf-hshLwg6PQG1aEGaogCGzULkiKN64Pd4/edit
