# Chapter Workflow Tool - Test Walkthrough

## Testing with Chapter 19 Data

### What We Know About Chapter 19:
- **Title**: A Month Long Vacation
- **Korean Title**: 한달간의 휴가
- **Date**: 2025-12-17
- **Slug**: month-vacation
- **Korean Link**: http://www.mediabuddha.net/m/news/view.php?number=35373
- **Summary**: Thoughts of vacation bring the Author back to Mr. Willi

---

## Step-by-Step Test Workflow:

### 1. Open the Tool
Navigate to: `chapter-workflow-tool-v2.html` in your browser

### 2. Initial Setup (Settings)
- Tool auto-detects: "Next chapter is 20"
- Auto-fills:
  - Cover: `assets/ch20-cover.jpg`
  - Hero: `assets/ch20-hero.jpg`

✅ **Expected**: Chapter number and paths auto-populated

### 3. Input Korean Content (Step 1)
**Action**:
1. Go to http://www.mediabuddha.net/m/news/view.php?number=35373
2. Copy Korean text
3. Paste into "Korean Text" field
4. Enter URL: `http://www.mediabuddha.net/m/news/view.php?number=35373`
5. Upload or paste cover image URL
6. Click "Parse Korean Text"

✅ **Expected**:
- "✓ Parsed X paragraphs. Ready to translate!"
- Translation button enabled

### 4. Translate with Google Sheets (Step 3)
**Action**:
1. Click "📊 Generate Google Sheets Formula"
2. Open Google Sheets
3. Paste (Ctrl+V or Cmd+V)
4. Wait for GOOGLETRANSLATE formulas to execute
5. Copy all translations from column B
6. Return to tool
7. Click "📋 Paste Translations from Sheets"
8. Paste translations

✅ **Expected**:
- Korean text on left (yellow background)
- English text on right (editable)
- Parallel columns layout
- "✓ Imported X translations! Review and edit."

### 5. Review & Edit
**Action**:
1. Scroll through parallel columns
2. Edit any translations for quality/consistency
3. Click "📝 Apply Glossary Terms" if you have glossary

✅ **Expected**:
- Easy side-by-side comparison
- Glossary terms highlighted
- Edits saved automatically

### 6. Chapter Metadata (Step 4)
**Action**:
1. Title: `A Month Long Vacation`
2. Date: `2025-12-17`
3. Slug: Auto-generated or manual: `month-vacation`
4. Summary: `Thoughts of vacation bring the Author back to Mr. Willi`
5. Cover: `assets/ch19-cover.jpg` (already filled)
6. Hero: `assets/ch19-hero.jpg` (already filled)

✅ **Expected**: All fields filled, slug auto-generated from title

### 7. Generate Files (Step 5)
**Action**:
1. Click "Generate Files"
2. Review HTML preview
3. Review JSON preview
4. Click "Download Chapter HTML"
5. Click "Copy JSON to Clipboard"
6. Click "Download Image"

✅ **Expected**:
- `chapter-19.html` downloaded
- JSON entry copied to clipboard
- Image downloaded with correct name

### 8. Expected Output

**chapter-19.html format:**
```html
<p>First paragraph translated text...</p>

<p>Second paragraph translated text...</p>

<p>Third paragraph translated text...</p>
```

**JSON entry format:**
```json
{
  "title": "A Month Long Vacation",
  "slug": "month-vacation",
  "href": "chapter.html?slug=month-vacation",
  "date": "2025-12-17",
  "cover": "assets/ch19-cover.jpg",
  "hero": "assets/ch19-hero.jpg",
  "summary": "Thoughts of vacation bring the Author back to Mr. Willi",
  "status": "published",
  "contentHtml": "content/chapter-19.html",
  "koreanLink": "http://www.mediabuddha.net/m/news/view.php?number=35373"
}
```

---

## What to Test:

### ✅ Functionality Checklist:
- [ ] Chapter auto-detection works
- [ ] Korean text parsing works
- [ ] Google Sheets formula generation works
- [ ] Translation paste-back works
- [ ] Parallel columns display correctly (Korean left, English right)
- [ ] Glossary highlighting works
- [ ] Slug auto-generation works
- [ ] HTML output matches existing chapter format (no `<div class="gdoc">`)
- [ ] JSON entry has all required fields
- [ ] Image upload/download works
- [ ] Files download with correct names

### ✅ Edge Cases to Test:
- [ ] Korean text with special characters
- [ ] Long paragraphs (should wrap correctly)
- [ ] Empty translations (should show placeholder)
- [ ] Glossary with multiple matches per paragraph
- [ ] Very short chapters (1-2 paragraphs)
- [ ] Very long chapters (50+ paragraphs)

---

## Known Issues:
- ❌ Direct URL fetching blocked by browser security (expected)
  - **Workaround**: Copy/paste Korean text manually
- ❌ Image URL download may fail due to CORS
  - **Workaround**: Upload image file directly

---

## Success Criteria:
The tool is working correctly if:
1. ✅ You can translate a chapter in ~10 minutes
2. ✅ Output HTML format matches existing chapters
3. ✅ Output JSON format matches existing chapters.json
4. ✅ Parallel column editing is smooth
5. ✅ Google Sheets integration works without errors
6. ✅ All files download/copy correctly

---

## Next Tuesday's Chapter 20 Test:
Use this workflow for the actual Chapter 20 when it releases to verify the tool in production!
