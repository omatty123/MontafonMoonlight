# Montafon Moonlight — English Manuscript Handoff

Prepared July 16, 2026, from the 45 published English chapter files in the MontafonMoonlight repository at commit `be21d4750c12e014693a3a2b3dcee21ed22dde3d`.

## Included files

- `docx/Montafon_Moonlight_English_Manuscript.docx` — editable Word manuscript
- `pdf/Montafon_Moonlight_English_Manuscript.pdf` — fixed-layout 6 × 9 inch interior PDF

## Contents

- 45 chapters
- Approximately 76,000 words including front matter, notes, and glossary
- 209 PDF pages total; the main text begins on numbered page 1
- Contents pages with verified chapter-opening page numbers
- Running headers and continuous page numbers
- Four translator/editorial notes placed as true footnotes on the relevant pages
- Glossary of names, places, and Korean/Buddhist terms, with the original Korean forms

## Production decisions

- Rebuilt from the current chapter HTML files; the older partial `manuscript.md` export was not used.
- Removed all serial-publication endings reading “To be continued”; retained “The End” at the conclusion.
- Removed web hyperlinks while preserving their visible English text.
- Retained the Korean and Hanja that appear in the approved English chapters, translator/editorial notes, and glossary. A Korean-capable font is assigned in the Word file and embedded in the PDF.
- Omitted chapter illustrations. Twenty-five of the available hero images are under 1,500 pixels in at least one dimension and are not suitable for full-page print. Original high-resolution artwork should be supplied before an illustrated edition is typeset.
- No subtitle, translator credit, copyright notice, ISBN, publisher imprint, or cover has been added. These should be confirmed before commercial publication.

## Verification completed

- All 1,570 print-body paragraphs from the 45 published chapters are present.
- All 234 Korean/Hanja characters in the included chapter text, footnotes, and glossary are present; every page containing them was visually checked after rendering.
- All 45 chapter headings are present and ordered correctly.
- Contents page numbers match the rendered chapter openings.
- The PDF was rendered page by page and visually inspected, including the Chapter 28 verse layout.
- The PDF is tagged and all fonts used in the PDF are embedded.

## File checksums (SHA-256)

- DOCX: `f7ed6276688a17dc245f55f58a7b9f1f79c71e909bd5d0359264acfa8a765714`
- PDF: `d047c0874f22a0ec050146a03683447a9d325006f039b62e335fb92049b79a8c`

## Revision — July 16, 2026 (KUMA audit, chapters 1–3)

Sixty-seven author-approved corrections from a bilingual audit of chapters 1–3 against the Korean source, applied identically to the chapter HTML and the manuscript (one finding declined by the author: "Professor Matty" stands — it is what the author calls him). Highlights:

- Factual: hospital relocated from "Austria" to Germany (ch. 2, per 독일의 한 병원); September 10 restored as the departure date rather than a decision deadline (ch. 3); "park stand" → park bench with the temple-packed lunch restored; Mrs. Park's 숫자 감각 corrected to a head for numbers.
- Titles: Chapter 1 is now "Vienna-Bound Plane"; Chapter 2 is "Three Phone Calls" (headings, contents, and running headers updated; site slugs unchanged).
- Terminology: *cheongsim-hwan* and *inyeon* retained and italicized at first occurrence; "Venerable" restored to Beopjeong/Hyeonho dialogue tags; Jeollanam-do unified; Mr. Willi, Chairwoman Kwon, Ssangbong-sa regularized; Seven Years' War de-italicized.
- Style: chapter 1's comma splices and translationese repaired; hedges restored where the English had flattened the author's surmises; chapter 2's phone dialogue set one speaker per paragraph (+3 paragraphs; print-body total is now 1,577).
- Re-verified after re-render: 210 pages, contents entries match all 45 chapter openings, 0 stretched lines, 236 Korean/Hanja characters, all fonts embedded, full paragraph parity with the published chapters.

## Revision — July 16, 2026 (post-audit corrections)

Applied to both the manuscript and the source chapter HTML files (same edits in both, verified in parity):

- Fixed missing space: "wife,perhaps" → "wife, perhaps" (Chapter 1).
- Normalized British spellings to American across Chapters 12, 13, 15, 16, 17, 18 (realise(d), organis-, recognised, memorise, serialising, centred, ageing, theatre → US forms; 14 instances).
- Corrected romanization: jeongmyeol → jeokmyeol (적멸) in Chapters 10, 13, 30, the glossary, and translation-glossary.json; glossary entry re-sorted alphabetically.
- Work titles formerly in ASCII angle brackets now italicized per the style guide (The Sorrows of Young Werther ×2, Goethe in the Campagna, Faust, The Fool Novice).
- Embedded lecture/quotation blocks now use proper 〈 〉 brackets instead of ASCII < >.
- Fixed Chapter 1 justified-line stretch: dialogue lines formerly joined by forced line breaks are now separate paragraphs (4 paragraphs added; print-body total is now 1,574).
- PDF re-rendered with LibreOffice 26.2.3: still 210 pages, contents page numbers re-verified against all 45 chapter openings, 0 stretched lines, all 236 Korean/Hanja characters present, all fonts embedded. Body font now resolves to genuine Times New Roman (previously Liberation Serif substitute) and Korean to NanumMyeongjo; pagination unchanged.

## Revision — July 16, 2026 (Chapters 21–22 source reconciliation)

Regenerated the tracked DOCX and PDF after reconciling Chapters 21 and 22 against the recovered Korean corpus:

- Restored the omitted Chapter 21 passage describing Willi's work under severe deadline pressure in Hittisau and Lützelflüh.
- Corrected Chapter 22's historical reference from Italy's entry into World War I to World War II.
- Added `scripts/sync_print_manuscript.py`, a guarded OOXML synchronization utility, because the original July manuscript builder was not retained in the repository.
- Re-rendered with LibreOffice 26.2.4 using Times New Roman and NanumMyeongjo; all fonts remain embedded.
- Visually reviewed all 210 rendered pages, with full-resolution checks of the changed passages, affected chapter transitions, Notes, and Korean/Hanja glossary pages.
- Pagination is unchanged: Chapter 21 begins on page 81, Chapter 22 on page 85, and Chapter 23 on page 90; the contents remains accurate.

## Revision — July 16, 2026 (honorific consistency and true footnotes)

- Standardized the three isolated Chapter 8 direct addresses from “Teacher Willi” to the book-wide “Mr. Willi”; removed the obsolete note defending the inconsistent rendering.
- Recast the four remaining useful notes as true Word footnotes attached to their relevant text: *inyeon* on page 31, *Musoyu* on page 67, Francesca Donner-Rhee on page 69, and *DSONG* on page 176.
- Removed the standalone Notes section. The glossary now follows the novel directly, reducing the PDF from 210 to 209 physical pages; chapter-opening pagination and all 45 contents entries remain unchanged.
- Retained 234 Korean/Hanja characters across the chapter text, footnotes, and glossary. All fonts are embedded, including the Korean/Hanja fonts used in the footnotes.
- Visually reviewed all 209 rendered pages, with full-resolution checks of every footnote, all contents pages, the final chapter transition, and both glossary pages.
