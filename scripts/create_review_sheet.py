#!/usr/bin/env python3
"""Create a Google Sheets review sheet from a bilingual CSV and open it."""

from __future__ import annotations

import argparse
import csv
import json
import subprocess
import sys
import tempfile
from pathlib import Path


GOOGLE_WORKSPACE_SCRIPT = (
    Path.home()
    / ".codex"
    / "skills"
    / "google-workspace"
    / "scripts"
    / "google_workspace.py"
)


def run_google_workspace(*args: str) -> dict:
    if not GOOGLE_WORKSPACE_SCRIPT.exists():
        raise FileNotFoundError(
            f"Google Workspace skill not found at {GOOGLE_WORKSPACE_SCRIPT}"
        )

    cmd = ["python3", str(GOOGLE_WORKSPACE_SCRIPT), *args]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip() or "Unknown error")
    return json.loads(result.stdout)


def google_workspace_module():
    sys.path.insert(0, str(GOOGLE_WORKSPACE_SCRIPT.parent))
    import google_workspace

    return google_workspace


def default_title(csv_path: Path, chapter: int | None) -> str:
    if chapter is not None:
        return f"Montafon Moonlight Chapter {chapter} Review"
    return f"Montafon Moonlight {csv_path.stem.replace('-', ' ').title()}"


def maybe_open(url: str) -> None:
    try:
        subprocess.run(["open", url], check=False)
    except FileNotFoundError:
        pass


def markdown_italic_spans(text: str) -> tuple[str, list[tuple[int, int]]]:
    """Convert simple *italic* markers to clean text plus Sheets span indexes."""
    clean: list[str] = []
    spans: list[tuple[int, int]] = []
    italic_start: int | None = None
    index = 0

    while index < len(text):
        char = text[index]
        if char == "*":
            if italic_start is None:
                italic_start = len(clean)
            else:
                spans.append((italic_start, len(clean)))
                italic_start = None
            index += 1
            continue
        clean.append(char)
        index += 1

    if italic_start is not None:
        return text, []
    return "".join(clean), [(start, end) for start, end in spans if start < end]


def cleaned_rows_and_italic_cells(
    csv_path: Path,
) -> tuple[list[list[str]], list[tuple[int, int, str, list[tuple[int, int]]]]]:
    with csv_path.open(encoding="utf-8", newline="") as fh:
        rows = list(csv.reader(fh))

    italic_cells: list[tuple[int, int, str, list[tuple[int, int]]]] = []
    for row_index, row in enumerate(rows):
        if len(row) < 2:
            continue
        clean_text, spans = markdown_italic_spans(row[1])
        row[1] = clean_text
        if spans:
            italic_cells.append((row_index, 1, clean_text, spans))
    return rows, italic_cells


def write_temp_csv(rows: list[list[str]]) -> Path:
    temp_file = tempfile.NamedTemporaryFile(
        "w",
        encoding="utf-8",
        newline="",
        suffix=".csv",
        delete=False,
    )
    with temp_file:
        csv.writer(temp_file).writerows(rows)
    return Path(temp_file.name)


def text_format_runs(spans: list[tuple[int, int]], text_length: int) -> list[dict]:
    runs: list[dict] = [{"startIndex": 0, "format": {"italic": False}}]
    for start, end in spans:
        runs.append({"startIndex": start, "format": {"italic": True}})
        if end < text_length:
            runs.append({"startIndex": end, "format": {"italic": False}})

    deduped: list[dict] = []
    for run in runs:
        if deduped and deduped[-1]["startIndex"] == run["startIndex"]:
            deduped[-1] = run
        else:
            deduped.append(run)
    return deduped


def apply_italic_cells(
    spreadsheet_id: str,
    sheet_title: str,
    italic_cells: list[tuple[int, int, str, list[tuple[int, int]]]],
) -> None:
    if not italic_cells:
        return

    google_workspace = google_workspace_module()
    service = google_workspace.sheets_service()
    spreadsheet = service.spreadsheets().get(spreadsheetId=spreadsheet_id).execute()
    sheet_id = None
    for sheet in spreadsheet.get("sheets", []):
        props = sheet.get("properties", {})
        if props.get("title") == sheet_title:
            sheet_id = props["sheetId"]
            break
    if sheet_id is None:
        raise RuntimeError(f"Sheet not found: {sheet_title}")

    requests = []
    for row_index, col_index, text, spans in italic_cells:
        requests.append(
            {
                "updateCells": {
                    "range": {
                        "sheetId": sheet_id,
                        "startRowIndex": row_index,
                        "endRowIndex": row_index + 1,
                        "startColumnIndex": col_index,
                        "endColumnIndex": col_index + 1,
                    },
                    "rows": [
                        {
                            "values": [
                                {
                                    "userEnteredValue": {"stringValue": text},
                                    "textFormatRuns": text_format_runs(
                                        spans,
                                        len(text),
                                    ),
                                }
                            ]
                        }
                    ],
                    "fields": "userEnteredValue,textFormatRuns",
                }
            }
        )

    service.spreadsheets().batchUpdate(
        spreadsheetId=spreadsheet_id,
        body={"requests": requests},
    ).execute()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Create a review spreadsheet from a CSV and open it in the browser."
    )
    parser.add_argument("csv_path", help="Absolute or relative path to the review CSV")
    parser.add_argument("--chapter", type=int, help="Chapter number for the sheet title")
    parser.add_argument(
        "--title",
        help="Spreadsheet title. Defaults to 'Montafon Moonlight Chapter N Review'.",
    )
    parser.add_argument(
        "--sheet-title",
        default="Review",
        help="Worksheet tab name inside the spreadsheet.",
    )
    parser.add_argument(
        "--no-open",
        action="store_true",
        help="Do not open the resulting sheet URL in the browser.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    csv_path = Path(args.csv_path).expanduser().resolve()
    if not csv_path.exists():
        print(f"error: CSV not found: {csv_path}", file=sys.stderr)
        return 2

    title = args.title or default_title(csv_path, args.chapter)
    cleaned_rows, italic_cells = cleaned_rows_and_italic_cells(csv_path)
    import_csv_path = write_temp_csv(cleaned_rows)

    try:
        created = run_google_workspace(
            "sheets-create",
            "--title",
            title,
            "--sheet-title",
            args.sheet_title,
        )
        spreadsheet_id = created["spreadsheetId"]
        imported = run_google_workspace(
            "sheets-import-csv",
            spreadsheet_id,
            str(import_csv_path),
            "--sheet-title",
            args.sheet_title,
            "--clear",
        )
        apply_italic_cells(spreadsheet_id, args.sheet_title, italic_cells)
        run_google_workspace(
            "sheets-resize-columns",
            spreadsheet_id,
            "--sheet-title",
            args.sheet_title,
            "--start-index",
            "0",
            "--end-index",
            "1",
            "--pixel-size",
            "420",
        )
        run_google_workspace(
            "sheets-resize-columns",
            spreadsheet_id,
            "--sheet-title",
            args.sheet_title,
            "--start-index",
            "1",
            "--end-index",
            "2",
            "--pixel-size",
            "560",
        )
    except (FileNotFoundError, RuntimeError, KeyError, json.JSONDecodeError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    finally:
        import_csv_path.unlink(missing_ok=True)

    url = imported.get("url") or created.get("url")
    print(url)
    if url and not args.no_open:
        maybe_open(url)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
