# 🚀 Montafon Moonlight - Full Automation Guide

NO MORE COPY/PASTE! True one-click automation from Korean URL to translated chapter.

---

## Option 1: Bookmarklet (Recommended - Instant, No Installation)

### Setup (One Time):
1. Open `korean-page-extractor.js` in your repo
2. Copy ALL the code
3. Create a new bookmark in your browser
4. Name it: "📚 Extract Chapter"
5. In the URL field, paste the copied code
6. Save the bookmark

### Usage Every Tuesday:
1. Go to the Korean chapter on mediabuddha.net
2. **Click the "📚 Extract Chapter" bookmark**
3. Tool opens automatically with everything filled in!
4. Click "🚀 Process Chapter"
5. Done!

**That's it! One click on the Korean page → Everything extracted**

---

## Option 2: Python Script (Most Reliable)

### Setup (One Time):
```bash
cd ~/Documents/MontafonMoonlight
pip3 install requests beautifulsoup4
```

### Usage Every Tuesday:
```bash
python3 scrape-chapter.py http://www.mediabuddha.net/m/news/view.php?number=35373
```

**Output:**
- Creates `chapter-data.json` with extracted text and image URL
- Open the tool and paste the JSON data

---

## Full Workflow (< 10 minutes):

### Tuesday Afternoon:
1. New chapter releases at mediabuddha.net
2. Click bookmarklet OR run Python script
3. Tool opens with data pre-filled
4. Click "🚀 Process Chapter"
5. Click "📊 Generate Google Sheets Formula"
6. Paste in Google Sheets → translations appear
7. Copy translations back to tool
8. Review/edit (apply glossary for consistency)
9. Fill metadata (title, summary)
10. Click "Generate Files"
11. Download HTML + Copy JSON + Download image
12. Save to repo, commit, push
13. **Done!**

---

## Troubleshooting

### Bookmarklet not working?
- Make sure you're ON the Korean page when you click it
- Check browser console for errors (F12 → Console)
- Try refreshing the Korean page first

### Python script errors?
```bash
# Install dependencies
pip3 install requests beautifulsoup4

# If SSL errors, update certificates:
pip3 install --upgrade certifi
```

### Image not extracting?
- Upload manually (it's quick)
- The tool still saves time on text extraction

---

## What Gets Automated:

✅ Extract Korean text from webpage
✅ Extract image URL
✅ Auto-fill chapter number
✅ Auto-name image files
✅ Parse into paragraphs
✅ Generate Google Sheets formulas
✅ Apply glossary terms
✅ Generate HTML file
✅ Generate JSON entry

**You only do:**
- Review translations (essential for quality)
- Add title/summary
- Commit to GitHub

---

## Tips for Speed:

1. **Save the bookmarklet** to your bookmarks bar for one-click access
2. **Keep Google Sheets open** on Tuesday - just paste the formula
3. **Pre-fill glossary** with character names (coming soon - auto-generated!)
4. **Use keyboard shortcuts**:
   - Cmd+V to paste
   - Cmd+C to copy
   - Tab to move between fields

---

## Next Level (Coming Soon):

- [ ] Auto-generated character glossary from all chapters
- [ ] Direct GitHub commit from tool
- [ ] Browser extension for even easier extraction
- [ ] AI-powered translation consistency checker

---

**Questions?** Check TEST-WALKTHROUGH.md for detailed step-by-step testing guide.
