# ⚠️ AUTOMATION DISABLED - DO NOT USE

## What Happened

The Google Sheets sync automation **FAILED** and corrupted chapters.json with empty data, breaking the live website.

### Root Cause
The CSV parser in sync-from-sheets.js had a critical bug that:
- Failed to parse CSV data correctly
- Created 52 empty chapters instead of 19 complete ones
- Overwrote all chapter titles, slugs, dates, summaries, and Korean links with empty strings

### Current Status
- ❌ **sync-from-sheets.js** - REMOVED (broken CSV parser)
- ❌ **sync-from-sheets.yml workflow** - REMOVED (automatic trigger disabled)
- ✅ **chapters.json** - RESTORED from backup
- ✅ **generate-chapters.js** - Still works (generates OG pages from chapters.json)
- ✅ **auto-generate.yml workflow** - Still enabled (safe)

## What Still Works

The chapter page generation is still automated:
1. Manually update `chapters.json`
2. Commit and push
3. GitHub Actions auto-generates the chapter pages

## If You Want to Fix the Automation

**DO NOT** re-enable the sync until:
1. The CSV parsing bug is identified and fixed
2. The script is thoroughly tested in debug mode
3. A backup/rollback strategy is in place
4. You understand the risks

**For now, manually edit chapters.json** - it's safer than a broken automation.

## Emergency Recovery Commands

If chapters.json gets corrupted again:
```bash
# Restore from git history
git checkout feabfaa -- chapters.json

# Or restore from last good commit
git log --oneline -- chapters.json
git checkout <good-commit-hash> -- chapters.json
```

## Google Sheet URL

Your sheet: https://docs.google.com/spreadsheets/d/1rz1KvXpjPzf-hshLwg6PQG1aEGaogCGzULkiKN64Pd4/edit

(Reference only - do not attempt to sync from this until the bug is fixed)
