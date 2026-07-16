#!/usr/bin/env python3
"""Synchronize approved source corrections into the tracked print DOCX.

The manuscript builder used for the July 2026 handoff was not retained in the
repository. This script performs guarded, exact OOXML substitutions so the
established print design is preserved while later approved chapter corrections
are carried into the editable manuscript.
"""

from __future__ import annotations

import argparse
import shutil
import tempfile
import zipfile
from pathlib import Path


REPLACEMENTS = {
    (
        "As a result of these efforts, 1989 became a year of dramatic professional "
        "advancement and growing recognition for Willi as a composer."
    ): (
        "Yet for Willi, this was a work he would have to complete under tremendous "
        "time pressure. He immediately loaded his materials into the car and, as if "
        "taking refuge, withdrew to a rented house in Hittisau, a village in the "
        "Bregenzerwald north of Montafon. It was a bitter winter, with snow pouring "
        "down. He also spent two weeks working at a recording studio in Lützelflüh, "
        "in Switzerland’s Emmental. As a result of these efforts, 1989 became a year "
        "of dramatic professional advancement and growing recognition for Willi as "
        "a composer."
    ),
    "Mussolini had declared Italy’s entry into World War I.": (
        "Mussolini had declared Italy’s entry into World War II."
    ),
}


def update_docx(path: Path) -> None:
    with tempfile.TemporaryDirectory(prefix="montafon-docx-") as temp_dir:
        source = Path(temp_dir) / "source.docx"
        shutil.copy2(path, source)

        with zipfile.ZipFile(source, "r") as archive:
            entries = {info.filename: (info, archive.read(info.filename)) for info in archive.infolist()}

        document_name = "word/document.xml"
        xml = entries[document_name][1].decode("utf-8")
        for old, new in REPLACEMENTS.items():
            count = xml.count(old)
            if count == 1:
                xml = xml.replace(old, new)
            elif count == 0 and new in xml:
                continue
            else:
                raise RuntimeError(f"Expected one source occurrence, found {count}: {old[:72]!r}")
        entries[document_name] = (entries[document_name][0], xml.encode("utf-8"))

        rebuilt = Path(temp_dir) / "rebuilt.docx"
        with zipfile.ZipFile(rebuilt, "w") as archive:
            for name, (info, payload) in entries.items():
                archive.writestr(info, payload)
        shutil.copy2(rebuilt, path)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("docx", type=Path)
    args = parser.parse_args()
    update_docx(args.docx)


if __name__ == "__main__":
    main()
