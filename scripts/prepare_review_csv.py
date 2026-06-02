#!/usr/bin/env python3
"""Prepare and validate paragraph-aligned review CSVs for Montafon chapters."""

from __future__ import annotations

import argparse
import csv
import subprocess
import sys
from pathlib import Path


def extract_text(source_path: Path) -> str:
    if source_path.suffix.lower() == ".txt":
        return source_path.read_text()
    if source_path.suffix.lower() == ".hwp":
        result = subprocess.run(
            ["hwp5txt", str(source_path)],
            capture_output=True,
            text=True,
            check=False,
        )
        if result.returncode != 0:
            raise RuntimeError(result.stderr.strip() or "hwp5txt failed")
        return result.stdout
    raise ValueError(f"Unsupported source type: {source_path.suffix}")


def split_paragraphs(text: str) -> list[str]:
    normalized = text.replace("\r\n", "\n").replace("\r", "\n")
    return [line.strip() for line in normalized.split("\n") if line.strip()]


def command_create(args: argparse.Namespace) -> int:
    source_path = Path(args.source).expanduser().resolve()
    output_path = Path(args.output).expanduser().resolve()
    paragraphs = split_paragraphs(extract_text(source_path))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        for paragraph in paragraphs:
            writer.writerow([paragraph, ""])

    print(f"{output_path}\nparagraphs={len(paragraphs)}")
    return 0


def command_validate(args: argparse.Namespace) -> int:
    source_path = Path(args.source).expanduser().resolve()
    csv_path = Path(args.csv_path).expanduser().resolve()
    source_paragraphs = split_paragraphs(extract_text(source_path))

    with csv_path.open(newline="", encoding="utf-8") as fh:
        rows = list(csv.reader(fh))

    korean_rows = [row[0] if row else "" for row in rows]
    errors: list[str] = []

    if len(rows) != len(source_paragraphs):
        errors.append(
            f"row count mismatch: csv has {len(rows)} rows, source has {len(source_paragraphs)} paragraphs"
        )

    for index, source_paragraph in enumerate(source_paragraphs):
        if index >= len(korean_rows):
            break
        if korean_rows[index] != source_paragraph:
            errors.append(f"row {index + 1} does not match source paragraph exactly")
            break

    if rows and rows[0] and rows[0][0] == "Korean paragraph":
        errors.append("header row detected; review CSV must not include headers")

    if errors:
        for error in errors:
            print(f"error: {error}", file=sys.stderr)
        return 1

    print(f"OK: {csv_path} matches source paragraph breaks exactly ({len(source_paragraphs)} rows)")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Prepare or validate paragraph-aligned Montafon review CSV files."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    create = subparsers.add_parser("create", help="Create a blank-English review CSV from source")
    create.add_argument("source", help="Path to .hwp or extracted .txt source")
    create.add_argument("output", help="Path to output CSV")
    create.set_defaults(func=command_create)

    validate = subparsers.add_parser(
        "validate", help="Validate that a review CSV preserves source paragraph breaks exactly"
    )
    validate.add_argument("source", help="Path to .hwp or extracted .txt source")
    validate.add_argument("csv_path", help="Path to review CSV")
    validate.set_defaults(func=command_validate)

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    try:
        return args.func(args)
    except (RuntimeError, ValueError, FileNotFoundError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
