# 몬타폰의 달빛 — Korean Source Corpus

This directory is a provenance-tracked Korean corpus for Jeong Chanju’s
*Montafon Moonlight*. It is intended as the Korean source layer for editorial
comparison and print-manuscript preparation.

## Current scope

- All 45 chapters currently available
- Coverage is complete, with source authority recorded separately for every chapter
- One UTF-8, NFC-normalized text file per verified chapter in `chapters/`
- Korean and Hanja retained; no romanization or English substitution
- One blank line between source paragraphs
- Terminal web-serialization markers such as `<계속>` removed
- Documented corrections applied only to edited chapter files; diplomatic source transcriptions retained unchanged
- Chapter-level provenance, authority, hashes, and counts in `manifest.json`
- File-integrity hashes in `checksums.sha256`

The corpus is marked `coverage_complete_mixed_authority`: every chapter is now
represented, but the sources range from author-supplied HWP files to working
Google sources and publisher-page transcriptions. Missing Korean is never
reconstructed from the English translation.

## Source authority

The `authority` field in `manifest.json` distinguishes author-corrected or
author-supplied HWP files from Google working sources, approved review material,
publisher-page transcription, and image transcription. Chapters 2 and 9 use the
later corrected HWP files in preference to the older Google versions. Chapters
21 and 22 are transcribed from saved full-page MediaBuddha screenshots retained
in `source-images/`.

Editorial interventions are recorded in `EDITORIAL_NOTES.md` and, where
applicable, in the chapter's `editorial_changes` manifest field. The untouched
page transcriptions remain in `source-transcriptions/` for comparison.

## Rebuild

From the repository root:

```bash
python3 scripts/build_korean_corpus.py
```

The rebuild requires `hwp5txt`, the local source files recorded in the manifest,
and authenticated access to the linked Google Doc and Google Sheet.
