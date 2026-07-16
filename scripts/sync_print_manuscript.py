#!/usr/bin/env python3
"""Synchronize approved corrections into the tracked print manuscript.

The original July 2026 manuscript builder was not retained. This utility makes
guarded, local OOXML edits so the established 6 x 9 print design is preserved.
It also converts the manuscript's collected editorial notes into true Word
footnotes and can refresh the static contents page from a rendered PDF.
"""

from __future__ import annotations

import argparse
import re
import shutil
import tempfile
import zipfile
from pathlib import Path

from lxml import etree


W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
PKGREL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
CT_NS = "http://schemas.openxmlformats.org/package/2006/content-types"
NS = {"w": W_NS}

FOOTNOTE_REL_TYPE = (
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/footnotes"
)
FOOTNOTE_CONTENT_TYPE = (
    "application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml"
)

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

FOOTNOTES = [
    (
        "The Korean term inyeon (인연) is often rendered as “fate” or “destiny,” but "
        "it carries the nuance of connections formed by many causes and conditions: "
        "meetings are not mere accidents, but the result of threads drawing people "
        "together."
    ),
    (
        "Musoyu (무소유 無所有) is the title of Venerable Beopjeong’s best-known essay "
        "collection and his teaching of non-possession: living with “enough” rather "
        "than always seeking “more.”"
    ),
    "Francesca Donner-Rhee was South Korea’s first First Lady.",
    (
        "Schott Music catalogs Herbert Willi’s work under the title DSONG and "
        "identifies it as an orchestral work."
    ),
]


def _xml_bytes(root: etree._Element) -> bytes:
    return etree.tostring(root, xml_declaration=True, encoding="UTF-8", standalone="yes")


def _paragraph_text(paragraph: etree._Element) -> str:
    return "".join(paragraph.xpath(".//w:t/text()", namespaces=NS))


def _reference_run(note_id: int) -> etree._Element:
    run = etree.Element(f"{{{W_NS}}}r")
    run_props = etree.SubElement(run, f"{{{W_NS}}}rPr")
    style = etree.SubElement(run_props, f"{{{W_NS}}}rStyle")
    style.set(f"{{{W_NS}}}val", "FootnoteReference")
    reference = etree.SubElement(run, f"{{{W_NS}}}footnoteReference")
    reference.set(f"{{{W_NS}}}id", str(note_id))
    return run


def _insert_after_run(run: etree._Element, new_run: etree._Element) -> None:
    parent = run.getparent()
    if parent is None:
        raise RuntimeError("Detached run while inserting footnote reference")
    parent.insert(parent.index(run) + 1, new_run)


def _insert_reference_after_run_text(
    doc_root: etree._Element, paragraph_snippet: str, run_text: str, note_id: int
) -> None:
    matches = [
        p
        for p in doc_root.xpath(".//w:body/w:p", namespaces=NS)
        if paragraph_snippet in _paragraph_text(p)
    ]
    if len(matches) != 1:
        raise RuntimeError(
            f"Expected one paragraph for footnote {note_id}, found {len(matches)}"
        )
    runs = [
        t.getparent()
        for t in matches[0].xpath(".//w:t", namespaces=NS)
        if t.text == run_text
    ]
    if len(runs) != 1:
        raise RuntimeError(f"Expected one anchor run for footnote {note_id}, found {len(runs)}")
    _insert_after_run(runs[0], _reference_run(note_id))


def _insert_reference_after_prefix(
    doc_root: etree._Element, paragraph_snippet: str, prefix: str, note_id: int
) -> None:
    matches = [
        p
        for p in doc_root.xpath(".//w:body/w:p", namespaces=NS)
        if paragraph_snippet in _paragraph_text(p)
    ]
    if len(matches) != 1:
        raise RuntimeError(
            f"Expected one paragraph for footnote {note_id}, found {len(matches)}"
        )
    for text_node in matches[0].xpath(".//w:t", namespaces=NS):
        if text_node.text and text_node.text.startswith(prefix):
            run = text_node.getparent()
            remainder = text_node.text[len(prefix) :]
            text_node.text = prefix
            reference = _reference_run(note_id)
            _insert_after_run(run, reference)
            if remainder:
                remainder_run = etree.fromstring(etree.tostring(run))
                remainder_node = remainder_run.find(f"{{{W_NS}}}t")
                if remainder_node is None:
                    raise RuntimeError("Could not split footnote anchor run")
                remainder_node.text = remainder
                _insert_after_run(reference, remainder_run)
            return
    raise RuntimeError(f"Could not find prefix anchor for footnote {note_id}")


def _replace_asterisk_with_reference(
    doc_root: etree._Element, paragraph_snippet: str, note_id: int
) -> None:
    matches = [
        p
        for p in doc_root.xpath(".//w:body/w:p", namespaces=NS)
        if paragraph_snippet in _paragraph_text(p)
    ]
    if len(matches) != 1:
        raise RuntimeError(
            f"Expected one paragraph for footnote {note_id}, found {len(matches)}"
        )
    stars = [
        t.getparent()
        for t in matches[0].xpath(".//w:t", namespaces=NS)
        if t.text == "*"
    ]
    if len(stars) != 1:
        raise RuntimeError(f"Expected one asterisk for footnote {note_id}, found {len(stars)}")
    run = stars[0]
    parent = run.getparent()
    if parent is None:
        raise RuntimeError("Detached asterisk run")
    parent.replace(run, _reference_run(note_id))


def _remove_collected_notes(doc_root: etree._Element) -> None:
    body = doc_root.find("w:body", namespaces=NS)
    if body is None:
        raise RuntimeError("DOCX has no document body")
    children = list(body)
    notes_index = next(
        (i for i, child in enumerate(children) if _paragraph_text(child) == "NOTES"),
        None,
    )
    if notes_index is None:
        return
    glossary_index = next(
        (
            i
            for i, child in enumerate(children[notes_index + 1 :], notes_index + 1)
            if _paragraph_text(child) == "GLOSSARY"
        ),
        None,
    )
    if glossary_index is None:
        raise RuntimeError("Found NOTES without the following GLOSSARY section")
    start = notes_index
    previous = children[notes_index - 1] if notes_index else None
    if (
        previous is not None
        and not _paragraph_text(previous)
        and previous.xpath(".//w:br[@w:type='page']", namespaces=NS)
    ):
        start -= 1
    for child in children[start:glossary_index]:
        body.remove(child)


def _make_footnotes_part() -> etree._Element:
    root = etree.Element(f"{{{W_NS}}}footnotes", nsmap={"w": W_NS, "r": R_NS})
    for note_id, separator_tag in ((-1, "separator"), (0, "continuationSeparator")):
        note = etree.SubElement(root, f"{{{W_NS}}}footnote")
        note.set(f"{{{W_NS}}}id", str(note_id))
        note.set(f"{{{W_NS}}}type", separator_tag)
        paragraph = etree.SubElement(note, f"{{{W_NS}}}p")
        run = etree.SubElement(paragraph, f"{{{W_NS}}}r")
        etree.SubElement(run, f"{{{W_NS}}}{separator_tag}")

    for note_id, note_text in enumerate(FOOTNOTES, 1):
        note = etree.SubElement(root, f"{{{W_NS}}}footnote")
        note.set(f"{{{W_NS}}}id", str(note_id))
        paragraph = etree.SubElement(note, f"{{{W_NS}}}p")
        paragraph_props = etree.SubElement(paragraph, f"{{{W_NS}}}pPr")
        spacing = etree.SubElement(paragraph_props, f"{{{W_NS}}}spacing")
        spacing.set(f"{{{W_NS}}}after", "0")
        spacing.set(f"{{{W_NS}}}line", "190")
        spacing.set(f"{{{W_NS}}}lineRule", "auto")
        indent = etree.SubElement(paragraph_props, f"{{{W_NS}}}ind")
        indent.set(f"{{{W_NS}}}left", "288")
        indent.set(f"{{{W_NS}}}hanging", "288")

        ref_run = etree.SubElement(paragraph, f"{{{W_NS}}}r")
        ref_props = etree.SubElement(ref_run, f"{{{W_NS}}}rPr")
        ref_style = etree.SubElement(ref_props, f"{{{W_NS}}}rStyle")
        ref_style.set(f"{{{W_NS}}}val", "FootnoteReference")
        etree.SubElement(ref_run, f"{{{W_NS}}}footnoteRef")

        text_run = etree.SubElement(paragraph, f"{{{W_NS}}}r")
        run_props = etree.SubElement(text_run, f"{{{W_NS}}}rPr")
        fonts = etree.SubElement(run_props, f"{{{W_NS}}}rFonts")
        fonts.set(f"{{{W_NS}}}ascii", "Times New Roman")
        fonts.set(f"{{{W_NS}}}hAnsi", "Times New Roman")
        fonts.set(f"{{{W_NS}}}eastAsia", "Nanum Myeongjo")
        size = etree.SubElement(run_props, f"{{{W_NS}}}sz")
        size.set(f"{{{W_NS}}}val", "17")
        size_cs = etree.SubElement(run_props, f"{{{W_NS}}}szCs")
        size_cs.set(f"{{{W_NS}}}val", "17")
        text = etree.SubElement(text_run, f"{{{W_NS}}}t")
        text.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
        text.text = "  " + note_text
    return root


def _ensure_footnote_relationship(rels_root: etree._Element) -> None:
    relationship_tag = f"{{{PKGREL_NS}}}Relationship"
    if any(rel.get("Type") == FOOTNOTE_REL_TYPE for rel in rels_root.findall(relationship_tag)):
        return
    max_id = 0
    for rel in rels_root.findall(relationship_tag):
        match = re.fullmatch(r"rId(\d+)", rel.get("Id") or "")
        if match:
            max_id = max(max_id, int(match.group(1)))
    relationship = etree.SubElement(rels_root, relationship_tag)
    relationship.set("Id", f"rId{max_id + 1}")
    relationship.set("Type", FOOTNOTE_REL_TYPE)
    relationship.set("Target", "footnotes.xml")


def _ensure_footnote_content_type(content_types: etree._Element) -> None:
    override_tag = f"{{{CT_NS}}}Override"
    if any(
        item.get("PartName") == "/word/footnotes.xml"
        for item in content_types.findall(override_tag)
    ):
        return
    override = etree.SubElement(content_types, override_tag)
    override.set("PartName", "/word/footnotes.xml")
    override.set("ContentType", FOOTNOTE_CONTENT_TYPE)


def _add_footnotes(entries: dict[str, tuple[zipfile.ZipInfo, bytes]]) -> None:
    if "word/footnotes.xml" in entries:
        root = etree.fromstring(entries["word/footnotes.xml"][1])
        for note_id, separator_type in (("-1", "separator"), ("0", "continuationSeparator")):
            matches = root.xpath(
                f"./w:footnote[@w:id='{note_id}']",
                namespaces=NS,
            )
            if len(matches) != 1:
                raise RuntimeError(f"Expected one footnote separator with id {note_id}")
            matches[0].set(f"{{{W_NS}}}type", separator_type)
        entries["word/footnotes.xml"] = (
            entries["word/footnotes.xml"][0],
            _xml_bytes(root),
        )
        return
    doc_root = etree.fromstring(entries["word/document.xml"][1])
    _insert_reference_after_prefix(
        doc_root,
        "our meeting is not coincidence but a deep connection",
        ")",
        1,
    )
    _insert_reference_after_run_text(
        doc_root,
        "These include Mountains Are Mountains, Water Is Water",
        "Musoyu - the Novel",
        2,
    )
    _replace_asterisk_with_reference(
        doc_root,
        "Most of the audience also showed great interest in the fact",
        3,
    )
    _replace_asterisk_with_reference(
        doc_root,
        "began to speak of his symphony",
        4,
    )
    _remove_collected_notes(doc_root)
    info = entries["word/document.xml"][0]
    entries["word/document.xml"] = (info, _xml_bytes(doc_root))

    rels_name = "word/_rels/document.xml.rels"
    rels = etree.fromstring(entries[rels_name][1])
    _ensure_footnote_relationship(rels)
    entries[rels_name] = (entries[rels_name][0], _xml_bytes(rels))

    types_name = "[Content_Types].xml"
    content_types = etree.fromstring(entries[types_name][1])
    _ensure_footnote_content_type(content_types)
    entries[types_name] = (entries[types_name][0], _xml_bytes(content_types))

    footnote_info = zipfile.ZipInfo("word/footnotes.xml")
    footnote_info.compress_type = zipfile.ZIP_DEFLATED
    entries["word/footnotes.xml"] = (footnote_info, _xml_bytes(_make_footnotes_part()))


def _chapter_pages_from_pdf(pdf_path: Path) -> dict[int, int]:
    from pypdf import PdfReader

    pages: dict[int, int] = {}
    for page in PdfReader(pdf_path).pages:
        text = page.extract_text() or ""
        chapter = re.search(r"CHAPTER\s+(\d+)\b", text)
        printed_numbers = [
            int(value) for value in re.findall(r"(?m)^\s*(\d{1,3})\s*$", text)
        ]
        if chapter and printed_numbers:
            pages[int(chapter.group(1))] = printed_numbers[-1]
    if set(pages) != set(range(1, 46)):
        raise RuntimeError(f"Expected 45 chapter openings in PDF, found {len(pages)}")
    return pages


def _update_contents(doc_root: etree._Element, pages: dict[int, int]) -> None:
    found: set[int] = set()
    for paragraph in doc_root.xpath(".//w:body/w:p", namespaces=NS):
        text = _paragraph_text(paragraph)
        match = re.match(r"^(\d+)\.\s{2}", text)
        if not match:
            continue
        chapter = int(match.group(1))
        if chapter not in pages:
            continue
        text_nodes = paragraph.xpath(".//w:t", namespaces=NS)
        if not text_nodes or not text_nodes[-1].text or not text_nodes[-1].text.isdigit():
            raise RuntimeError(f"Could not locate contents page number for Chapter {chapter}")
        text_nodes[-1].text = str(pages[chapter])
        found.add(chapter)
    if found != set(range(1, 46)):
        raise RuntimeError(f"Updated {len(found)} of 45 contents entries")


def update_docx(path: Path, toc_from_pdf: Path | None = None) -> None:
    with tempfile.TemporaryDirectory(prefix="montafon-docx-") as temp_dir:
        source = Path(temp_dir) / "source.docx"
        shutil.copy2(path, source)

        with zipfile.ZipFile(source, "r") as archive:
            entries = {
                info.filename: (info, archive.read(info.filename))
                for info in archive.infolist()
            }

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
        xml = xml.replace("Teacher Willi", "Mr. Willi")
        entries[document_name] = (entries[document_name][0], xml.encode("utf-8"))

        _add_footnotes(entries)

        if toc_from_pdf is not None:
            doc_root = etree.fromstring(entries[document_name][1])
            _update_contents(doc_root, _chapter_pages_from_pdf(toc_from_pdf))
            entries[document_name] = (entries[document_name][0], _xml_bytes(doc_root))

        rebuilt = Path(temp_dir) / "rebuilt.docx"
        with zipfile.ZipFile(rebuilt, "w") as archive:
            for _, (info, payload) in entries.items():
                archive.writestr(info, payload)
        shutil.copy2(rebuilt, path)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("docx", type=Path)
    parser.add_argument("--toc-from-pdf", type=Path)
    args = parser.parse_args()
    update_docx(args.docx, args.toc_from_pdf)


if __name__ == "__main__":
    main()
