# Montafon Moonlight — Agent Instructions

## What This Project Is

English translation of *Montafon Moonlight*, a serialized Korean novel by Jeong Chanju (정찬주). The story follows Author Jeong and his wife Mrs. Park on a journey through Austria, weaving Buddhist philosophy, music, and cross-cultural friendship.

- **Live site:** https://omatty123.github.io/MontafonMoonlight/
- **Korean source:** http://www.mediabuddha.net/m/news/section.php?section=40
- **Repo:** `~/workspaces/MontafonMoonlight`

---

## Standard Chapter Workflow

The user delivers: an HWP file + illustration JPG (e.g., `몬타폰의 달빛27.hwp` + `몬타폰27.jpg`).

### Step 1 — Git pull

```bash
cd ~/workspaces/MontafonMoonlight && git pull
```

Always pull first. Chapters may have been added outside this session.

### Step 2 — Extract Korean text

```bash
hwp5txt "path/to/file.hwp"
```

If `hwp5txt` is missing: `pip3 install pyhwp`

### Step 3 — Read reference materials before translating

Read all three before writing a single word:

1. `TRANSLATION_STYLE_GUIDE.md` — voice, tone, formatting rules
2. `translation-glossary.json` — character names and terms
3. The most recent `content/chapter-{N}.html` — for paragraph/HTML format reference

### Step 4 — Translate and prepare review CSV

**DO NOT publish the translation directly.** The user must review it first.

Create a bilingual review file at `~/Desktop/{N}/chapter-{N}-review.csv`:
- Two columns: Korean paragraph | English translation
- No header row
- One row per original Korean paragraph, preserving the source paragraph breaks exactly
- Never merge adjacent Korean paragraphs into one English cell
- Never split one Korean paragraph across multiple English cells

Prepare the CSV mechanically from the source first, so the row breaks are locked before translation:

```bash
cd ~/workspaces/MontafonMoonlight
python3 scripts/prepare_review_csv.py create path/to/source.hwp ~/Desktop/{N}/chapter-{N}-review.csv
python3 scripts/prepare_review_csv.py validate path/to/source.hwp ~/Desktop/{N}/chapter-{N}-review.csv
```

Then fill column B only, keeping the row structure unchanged.

Then upload it automatically to a new Google Sheet and open the sheet URL in the browser:

```bash
cd ~/workspaces/MontafonMoonlight
python3 scripts/create_review_sheet.py ~/Desktop/{N}/chapter-{N}-review.csv --chapter {N}
```

This wrapper uses the Codex-wide `google-workspace` skill under `~/.codex/skills/google-workspace/`.
If Google OAuth opens in the browser, complete it once and continue.

The Google Sheet should open directly on the `Review` tab with no leading blank `Sheet1`.
If the English CSV uses `*...*` while drafting titles or terms that need italics, the sheet
upload must strip the literal asterisks and apply real Google Sheets italic formatting.

### Step 5 — Wait for user approval

Do not proceed until the user says the translation is ready to publish (e.g., "ready to push," "looks good," "publish it").

### Step 6 — Create the chapter HTML file

Path: `content/chapter-{N}.html`

Format rules:
- Wrap each paragraph in `<p>` tags
- Use `<em>` for italics (Korean terms on first use, book/art titles, internal thoughts)
- Chapters end with `<em>To be continued</em>`
- No chapter title in the HTML — numbered only. Title goes in `chapters.json`.

### Step 7 — Copy the illustration

```bash
cp "path/to/illustration.jpg" assets/ch{N}-cover.jpg
cp "path/to/illustration.jpg" assets/ch{N}-hero.jpg
```

Both cover and hero get the same image.

### Step 8 — Update chapters.json

Add a new entry at the end of the array:

```json
{
  "title": "Chapter Title",
  "slug": "slug-name",
  "href": "chapter.html?slug=slug-name",
  "date": "YYYY-MM-DD",
  "cover": "assets/ch{N}-cover.jpg",
  "hero": "assets/ch{N}-hero.jpg",
  "summary": "One-line teaser.",
  "status": "published",
  "contentHtml": "content/chapter-{N}.html",
  "koreanLink": "http://www.mediabuddha.net/m/news/view.php?number=XXXXX"
}
```

`chapters.json` is the single source of truth. Everything flows from it.

Before finalizing this entry, ask the user for the chapter tagline:

> What tagline should I use for Chapter {N}?

Use the user's tagline as the `summary` value unless they explicitly ask you to draft one.

### Step 9 — Commit and push

Before staging, committing, or pushing, confirm that the user has approved the translation
and provided or approved the chapter tagline. Do not push until both are true.

Stage specific files only (never `git add -A`):

```bash
git add content/chapter-{N}.html assets/ch{N}-cover.jpg assets/ch{N}-hero.jpg chapters.json
git commit -m "Publish Chapter N: [Title]"
git push
```

The `auto-generate.yml` workflow runs automatically after push and creates `og/{slug}.html` for social sharing.

### Step 10 — Open the live page

After the workflow completes, provide both URLs:

- **Reader URL:** `https://omatty123.github.io/MontafonMoonlight/chapter.html?slug={slug}`
- **Shareable (OG preview):** `https://omatty123.github.io/MontafonMoonlight/og/{slug}.html`

---

## Push Conflict Fix (OG Workflow Race Condition)

The auto-generate workflow sometimes commits `og/` pages while you're pushing. If you get a rejection:

```bash
git stash && git pull --rebase && git stash pop && git push
```

---

## Translation Rules

### Voice and Tone

- **Literary, not academic.** The prose is contemplative and warm. Do not let it go stiff or choppy.
- **Sentences that breathe.** Vary length. Let descriptive passages flow; let dialogue break with precision.
- **Warmth between characters.** The narrator is intimate, not distant.
- **Preserve POV shifts.** Korean source sometimes switches 3rd→1st person mid-chapter. Keep them.

### What to Avoid

- Choppy short sentences that lose the original's rhythm
- Over-explaining cultural references
- Flattening Korean nuance into generic English equivalents
- Translationese — English that reads as if translated
- Overly formal or academic register

### The Test

> A successful translation should read as if it were originally written in English by a writer steeped in Korean Buddhist sensibility.

---

## Character Names (from `translation-glossary.json`)

Always use these exact names — never the Korean transliteration:

| Korean | English |
|--------|---------|
| 정찬주 | Jeong Chanju (Author Jeong) |
| 박명숙 | Mrs. Park |
| 헤르베르트 빌리 | Mr. Willi (Herbert Willi) |
| 권숙녀 | Chairwoman Kwon (Sonja Steindl-Kwon) |
| 베르너 슈토킹거 | Dr. Werner |

For the full list see `translation-glossary.json`.

---

## Korean Terms to Retain (Italicized)

These carry cultural weight that English flattens. Keep them:

| Korean | Romanization | Meaning |
|--------|-------------|---------|
| 정 | *jeong* | Deep affection/bond |
| 인연 | *inyeon* | Karmic connection |
| 화두 | *hwadu* | Zen koan / meditation question |
| 청심환 | *cheongsim-hwan* | Traditional herbal medicine |
| 이불재 | Ibuljae | Author Jeong's hermitage |

Italicize on first use in a chapter; subsequent uses may be roman.

---

## Geographic Names

- Korean places: standard romanization (e.g., Jeollanam-do, Haein-sa)
- Austrian places: standard German spelling (Montafon, St. Anton, Innsbruck)
- Use "the West Sea" not "Yellow Sea" (Korean perspective)

---

## Formatting Conventions

- **Em-dashes (—):** No spaces around them. Use for parenthetical insertions.
- **Ellipses (…):** Single character, not three periods.
- **Quotation marks:** Curly/smart quotes. Periods and commas inside.
- **Italics in HTML:** `<em>` tag.
- **Chapter structure:** Date stamp in italics when present (e.g., `<em>Morning, July 28, 2025</em>`). Ends with `<em>To be continued</em>`. No title in content HTML.

---

## Key Rules (Non-Negotiable)

1. **Read style guide + glossary + recent chapter HTML before translating.**
2. **Never publish without user review.** Always CSV → Google Sheet → wait for approval.
3. **Never use `git add -A`.** Stage specific files only.
4. **`chapters.json` is the single source of truth.** Do not modify chapter HTML files to add metadata.
5. **No chapter title in the content HTML.** Title lives in `chapters.json` only.
6. **Correct foreign transliterations.** If the Korean source writes "피치아노," render it as "Ficino" (the actual person's name), not the Korean phonetic spelling.
7. **Preserve original paragraph breaks exactly in translation review files and Google Sheets.** No merged rows, no split rows, no added header rows.
