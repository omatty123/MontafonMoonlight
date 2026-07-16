#!/usr/bin/env python3
"""Build the provenance-tracked Korean corpus for Montafon Moonlight.

The builder deliberately leaves chapters without a verified Korean source as
pending in the manifest. It never reconstructs Korean from the English text.
"""

from __future__ import annotations

import csv
import datetime as dt
import glob
import hashlib
import json
import re
import subprocess
import unicodedata
from pathlib import Path
from typing import Iterable


ROOT = Path(__file__).resolve().parents[1]
CORPUS_DIR = ROOT / "korean-corpus"
CHAPTER_DIR = CORPUS_DIR / "chapters"
HOME = Path.home()
WORKSPACE_CLI = HOME / ".codex/skills/google-workspace/scripts/google_workspace.py"

GOOGLE_DOC_ID = "1Th66D9cnOmPOfg4vzLuXUxGEHdOqiSFaNQ3ToyluFRo"
GOOGLE_DOC_URL = f"https://docs.google.com/document/d/{GOOGLE_DOC_ID}/edit"
GOOGLE_SHEET_ID = "1RRWoHrc2HVBmsjkKYIfWQNwuhF0UByGhM9wrktn0YXw"
GOOGLE_SHEET_URL = f"https://docs.google.com/spreadsheets/d/{GOOGLE_SHEET_ID}/edit"
CHAPTER_20_SHEET_ID = "1fvcloeYWyDuvEo4B5BWFIocJCJJU_h1JfzBalcK1PJ0"
CHAPTER_20_SHEET_URL = f"https://docs.google.com/spreadsheets/d/{CHAPTER_20_SHEET_ID}/edit"

SERIAL_MARKER_RE = re.compile(r"\s*[<〈]\s*계속\s*[>〉]\s*$")
HANGUL_RE = re.compile(r"[\u1100-\u11ff\u3130-\u318f\uac00-\ud7af]")
HANJA_RE = re.compile(r"[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]")
WEB_BOILERPLATE = {"크게보기", "작게보기", "목록", "이전기사", "다음기사"}


HWP_PATTERNS: dict[int, list[str]] = {
    2: ["~/Desktop/2/몬타폰의 달빛2.hwp"],
    9: ["~/Desktop/*9.hwp"],
    23: ["~/Desktop/MONTAFON/repo-cleanup-2026-06-02/몬타폰의 달빛23.hwp"],
    24: ["~/Desktop/MONTAFON/repo-cleanup-2026-06-02/몬타폰의 달빛24.hwp"],
    25: ["~/Desktop/MONTAFON/repo-cleanup-2026-06-02/chapter25-images/몬타폰의 달빛25.hwp"],
    26: ["~/Desktop/MONTAFON/Montafon Moonlight Images/몬타폰의 달빛26.hwp"],
    27: ["~/Desktop/MONTAFON/Montafon Moonlight Images/27/*.hwp"],
    28: ["~/Desktop/MONTAFON/repo-cleanup-2026-06-02/28/*.hwp"],
    29: ["~/Desktop/MONTAFON/repo-cleanup-2026-06-02/29/*.hwp"],
    30: ["~/Desktop/MONTAFON/repo-cleanup-2026-06-02/30/*.hwp"],
    31: ["~/Desktop/MONTAFON/repo-cleanup-2026-06-02/31/*.hwp"],
    32: ["~/Desktop/MONTAFON/repo-cleanup-2026-06-02/32/*.hwp"],
    33: ["~/Desktop/MONTAFON/repo-cleanup-2026-06-02/33/*.hwp"],
    34: ["~/Desktop/MONTAFON/repo-cleanup-2026-06-02/34/*.hwp"],
    35: ["~/Desktop/MONTAFON/repo-cleanup-2026-06-02/35/*.hwp"],
    36: ["~/Desktop/MONTAFON/repo-cleanup-2026-06-02/36/*.hwp"],
    40: ["~/Desktop/MONTAFON/40 2/*.hwp"],
    41: ["~/Desktop/MONTAFON/41/*.hwp"],
    42: ["~/Desktop/42/source/*.hwp"],
    43: ["~/Desktop/43/source/*.hwp"],
    44: ["~/Desktop/*44.hwp"],
    45: ["~/Desktop/45/*.hwp"],
}

TEXT_SOURCES: dict[int, tuple[str, str]] = {
    21: ("korean-corpus/source-transcriptions/chapter-21-mediabuddha.txt", "publisher_page_transcription"),
    22: ("korean-corpus/source-transcriptions/chapter-22-mediabuddha.txt", "publisher_page_transcription"),
    37: ("~/Desktop/MONTAFON/37/chapter-37-source.txt", "review_extraction"),
    39: ("~/Desktop/MONTAFON/39/chapter-39-source-from-image.txt", "image_transcription"),
}

CSV_SOURCES: dict[int, tuple[str, str]] = {
    38: ("~/Desktop/MONTAFON/38/chapter-38-approved.csv", "approved_bilingual_review"),
}


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_text(text: str) -> str:
    return sha256_bytes(text.encode("utf-8"))


def display_path(path: Path) -> str:
    try:
        value = "~/" + str(path.resolve().relative_to(HOME))
    except ValueError:
        value = str(path.resolve())
    return unicodedata.normalize("NFC", value)


def run_json(args: list[str]) -> dict:
    command = ["python3", str(WORKSPACE_CLI), *args, "--json"]
    result = subprocess.run(command, check=True, capture_output=True, text=True)
    return json.loads(result.stdout)


def resolve_source(patterns: Iterable[str]) -> Path:
    matches: list[Path] = []
    for pattern in patterns:
        expanded = str(Path(pattern).expanduser())
        matches.extend(Path(p) for p in glob.glob(expanded))
    unique = sorted({p.resolve() for p in matches if p.is_file()})
    if len(unique) != 1:
        raise RuntimeError(f"Expected one source for {list(patterns)}, found {unique}")
    return unique[0]


def korean_score(value: str) -> int:
    return len(HANGUL_RE.findall(value)) * 4 + len(HANJA_RE.findall(value)) * 3


def remove_terminal_serial_marker(text: str) -> str:
    return SERIAL_MARKER_RE.sub("", text).rstrip()


def normalize_text(raw: str) -> str:
    """Normalize encoding and whitespace while preserving textual content."""
    raw = unicodedata.normalize("NFC", raw).replace("\r\n", "\n").replace("\r", "\n")
    raw = raw.replace("\u00a0", " ")
    raw = remove_terminal_serial_marker(raw)
    paragraphs: list[str] = []
    for line in raw.splitlines():
        line = re.sub(r"[ \t]+", " ", line).strip()
        if not line or line in WEB_BOILERPLATE:
            continue
        if re.fullmatch(r"[<〈]\s*계속\s*[>〉]", line):
            continue
        if re.fullmatch(r"\(삽화\s+[^)]+\)", line):
            continue
        paragraphs.append(line)
    return "\n\n".join(paragraphs).strip() + "\n"


def apply_editorial_corrections(chapter: int, text: str) -> str:
    """Apply documented corrections to edited corpus copies, never source files."""
    if chapter == 22:
        replacements = {
            "바시리아인들아, 바빌론을": "아시리아인들아, 바빌론을",
            "제1차 세계대전 때 독재자 무솔리니가 참전을 선언했던":
                "제2차 세계대전 때 독재자 무솔리니가 참전을 선언했던",
        }
        for source, corrected in replacements.items():
            if source not in text:
                raise RuntimeError(f"Chapter 22 editorial source text not found: {source}")
            text = text.replace(source, corrected, 1)
    return text


def google_doc_chapters() -> dict[int, str]:
    text = run_json(["docs-read", GOOGLE_DOC_ID])["text"]
    text = unicodedata.normalize("NFC", text)
    ch1_start = text.index("1.비엔나행")
    ch2_start = re.search(r"\n2\.\s+세 번의 전화", text[ch1_start:])
    if not ch2_start:
        raise RuntimeError("Could not locate Chapter 2 boundary in Google Doc")
    ch2_absolute = ch1_start + ch2_start.start()
    ch3_match = re.search(r"\n3\.\s*결심", text[ch2_absolute:])
    if not ch3_match:
        raise RuntimeError("Could not locate Chapter 3 boundary in Google Doc")
    ch3_absolute = ch2_absolute + ch3_match.start()
    end_match = re.search(r"[<〈]\s*계속\s*[>〉]", text[ch3_absolute:])
    if not end_match:
        raise RuntimeError("Could not locate final serial marker in Google Doc")
    end_absolute = ch3_absolute + end_match.end()

    ch1 = text[ch1_start:ch2_absolute]
    # The document has an English gloss appended to the Korean date line.
    ch1 = ch1.replace("Morning, July 28, 2025", "")
    ch3 = text[ch3_absolute:end_absolute]
    return {1: normalize_text(ch1), 3: normalize_text(ch3)}


def select_korean_rows(rows: list[list[str]]) -> str:
    selected: list[str] = []
    for row in rows:
        if not row:
            continue
        candidates = [(korean_score(str(cell)), str(cell)) for cell in row]
        score, value = max(candidates, default=(0, ""), key=lambda pair: pair[0])
        if score:
            selected.append(value)
    return normalize_text("\n".join(selected))


def google_sheet_chapter(chapter: int) -> str:
    payload = run_json(["sheets-read", GOOGLE_SHEET_ID, f"{chapter}!A:Z"])
    return select_korean_rows(payload.get("values", []))


def hwp_chapter(path: Path) -> str:
    result = subprocess.run(["hwp5txt", str(path)], check=True, capture_output=True, text=True)
    return normalize_text(result.stdout)


def csv_chapter(path: Path) -> str:
    with path.open(newline="", encoding="utf-8-sig") as handle:
        rows = list(csv.reader(handle))
    return select_korean_rows(rows)


def script_counts(text: str) -> dict[str, int]:
    return {
        "hangul": len(HANGUL_RE.findall(text)),
        "hanja": len(HANJA_RE.findall(text)),
    }


def make_entry(
    chapter: int,
    english_title: str,
    text: str,
    *,
    authority: str,
    source_type: str,
    source_locator: str,
    source_url: str | None = None,
    publisher_url: str | None = None,
    source_hash: str | None = None,
    notes: str | None = None,
) -> dict:
    path = CHAPTER_DIR / f"chapter-{chapter:02d}.txt"
    path.write_text(text, encoding="utf-8")
    entry = {
        "chapter": chapter,
        "english_title": english_title,
        "file": str(path.relative_to(CORPUS_DIR)),
        "status": "available",
        "authority": authority,
        "source_type": source_type,
        "source_locator": source_locator,
        "paragraph_count": len([p for p in text.strip().split("\n\n") if p]),
        "character_count": len(text.rstrip("\n")),
        "script_counts": script_counts(text),
        "sha256": sha256_text(text),
    }
    if source_url:
        entry["source_url"] = source_url
    if publisher_url:
        entry["publisher_url"] = publisher_url
    if source_hash:
        entry["source_sha256"] = source_hash
    if notes:
        entry["notes"] = notes
    return entry


def main() -> None:
    chapters_metadata = json.loads((ROOT / "chapters.json").read_text(encoding="utf-8"))
    if len(chapters_metadata) < 45:
        raise RuntimeError("chapters.json does not contain all 45 chapter records")

    CHAPTER_DIR.mkdir(parents=True, exist_ok=True)
    for old in CHAPTER_DIR.glob("chapter-*.txt"):
        old.unlink()

    doc_texts = google_doc_chapters()
    entries: list[dict] = []

    for chapter in range(1, 46):
        metadata = chapters_metadata[chapter - 1]
        title = re.sub(r"<[^>]+>", "", metadata.get("title", ""))
        publisher_url = metadata.get("koreanLink") or None

        if chapter in doc_texts:
            entries.append(
                make_entry(
                    chapter,
                    title,
                    doc_texts[chapter],
                    authority="working_google_source",
                    source_type="google_doc",
                    source_locator=f"document {GOOGLE_DOC_ID}, primary tab",
                    source_url=GOOGLE_DOC_URL,
                    publisher_url=publisher_url,
                    notes=(
                        "Korean text extracted from the linked source document; English date gloss removed."
                        if chapter == 1
                        else "Korean text extracted from the linked source document."
                    ),
                )
            )
            continue

        if chapter in HWP_PATTERNS:
            path = resolve_source(HWP_PATTERNS[chapter])
            authority = "author_corrected_hwp" if chapter in {2, 9} else "author_supplied_hwp"
            note = (
                "Author-corrected HWP takes precedence over the older Google working source."
                if chapter in {2, 9}
                else "Extracted directly from the author-supplied HWP."
            )
            entries.append(
                make_entry(
                    chapter,
                    title,
                    hwp_chapter(path),
                    authority=authority,
                    source_type="hwp",
                    source_locator=display_path(path),
                    publisher_url=publisher_url,
                    source_hash=sha256_bytes(path.read_bytes()),
                    notes=note,
                )
            )
            continue

        if 4 <= chapter <= 19:
            entries.append(
                make_entry(
                    chapter,
                    title,
                    google_sheet_chapter(chapter),
                    authority="working_google_source",
                    source_type="google_sheet",
                    source_locator=f"spreadsheet {GOOGLE_SHEET_ID}, tab {chapter}",
                    source_url=GOOGLE_SHEET_URL,
                    publisher_url=publisher_url,
                    notes="Korean-rich cell selected from each populated row; English translation cells omitted.",
                )
            )
            continue

        if chapter == 20:
            payload = run_json(["sheets-read", CHAPTER_20_SHEET_ID, "Sheet1!A:B"])
            entries.append(
                make_entry(
                    chapter,
                    title,
                    select_korean_rows(payload.get("values", [])),
                    authority="working_bilingual_sheet",
                    source_type="google_sheet",
                    source_locator=f"spreadsheet {CHAPTER_20_SHEET_ID}, tab Sheet1, column A",
                    source_url=CHAPTER_20_SHEET_URL,
                    publisher_url=publisher_url,
                    notes=(
                        "Korean column extracted from the bilingual Chapter 20 working sheet; "
                        "its English column matches the repository's published Chapter 20."
                    ),
                )
            )
            continue

        if chapter in TEXT_SOURCES:
            pattern, authority = TEXT_SOURCES[chapter]
            if pattern.startswith("~/"):
                path = resolve_source([pattern])
            else:
                path = (ROOT / pattern).resolve()
                if not path.is_file():
                    raise RuntimeError(f"Missing source file: {path}")
            if chapter in {21, 22}:
                evidence = CORPUS_DIR / f"source-images/chapter-{chapter}-mediabuddha-page.png"
                note = (
                    "Manually verified transcription of the attached full-page MediaBuddha screenshot. "
                    f"Evidence image: {evidence.relative_to(CORPUS_DIR)}; "
                    f"evidence SHA-256: {sha256_bytes(evidence.read_bytes())}."
                )
            elif chapter == 39:
                note = "Korean source transcribed from chapter images; requires comparison with an author HWP if one is found."
            else:
                note = "Korean source retained from the chapter review workflow."
            source_text = normalize_text(path.read_text(encoding="utf-8-sig"))
            edited_text = apply_editorial_corrections(chapter, source_text)
            entry = make_entry(
                    chapter,
                    title,
                    edited_text,
                    authority=authority,
                    source_type="text_extraction",
                    source_locator=display_path(path),
                    publisher_url=publisher_url,
                    source_hash=sha256_bytes(path.read_bytes()),
                    notes=note,
                )
            if chapter == 22:
                entry["editorial_changes"] = [
                    {
                        "source": "바시리아인들아",
                        "edited": "아시리아인들아",
                        "reason": "Corrects an apparent typographical error in Martial's reference to Assyria and Babylon.",
                    },
                    {
                        "source": "제1차 세계대전",
                        "edited": "제2차 세계대전",
                        "reason": "Corrects the war associated with Mussolini's June 10, 1940 Piazza Venezia declaration.",
                    },
                ]
            entries.append(entry)
            continue

        if chapter in CSV_SOURCES:
            pattern, authority = CSV_SOURCES[chapter]
            path = resolve_source([pattern])
            entries.append(
                make_entry(
                    chapter,
                    title,
                    csv_chapter(path),
                    authority=authority,
                    source_type="approved_review_csv",
                    source_locator=display_path(path),
                    publisher_url=publisher_url,
                    source_hash=sha256_bytes(path.read_bytes()),
                    notes="Korean column extracted from the approved bilingual review file.",
                )
            )
            continue

        entries.append(
            {
                "chapter": chapter,
                "english_title": title,
                "file": None,
                "status": "pending_official_source",
                "authority": "unverified",
                "source_type": "publisher_page",
                "source_locator": publisher_url,
                "publisher_url": publisher_url,
                "notes": "No verified local Korean text was available; English was not back-translated.",
            }
        )

    available = sum(entry["status"] == "available" for entry in entries)
    manifest = {
        "corpus": "몬타폰의 달빛",
        "author": "정찬주",
        "corpus_version": dt.date.today().isoformat(),
        "status": "provisional" if available < 45 else "coverage_complete_mixed_authority",
        "coverage": {"available": available, "total": 45, "pending": 45 - available},
        "normalization": {
            "encoding": "UTF-8",
            "unicode": "NFC",
            "paragraph_separator": "one blank line",
            "terminal_serial_marker_removed": True,
            "hanja_policy": "preserved exactly as present in the selected Korean source",
            "translation_policy": "no Korean text reconstructed from English",
        },
        "chapters": entries,
    }
    (CORPUS_DIR / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    checksum_lines = [
        f'{entry["sha256"]}  {entry["file"]}'
        for entry in entries
        if entry["status"] == "available"
    ]
    (CORPUS_DIR / "checksums.sha256").write_text("\n".join(checksum_lines) + "\n", encoding="utf-8")
    print(f"Built {available}/45 Korean chapter files in {CORPUS_DIR}")


if __name__ == "__main__":
    main()
