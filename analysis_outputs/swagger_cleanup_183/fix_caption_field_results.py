from __future__ import annotations

import json
import os
import re
import shutil
import tempfile
import zipfile
from pathlib import Path

from lxml import etree


DOCX_PATH = Path(r"D:\Semester\Semester7\Skripsi\BAB1-5\183-Raka Bagaskara Putra.docx")
REPORT_PATH = Path(r"D:\Semester\Semester7\Skripsi\Projek-Skripsi\analysis_outputs\swagger_cleanup_183\field_result_fix_report.json")

NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}

DELETED_TITLES = {
    "Gambar 69. Request Pesanan Member",
    "Gambar 71. Response Endpoint GET Events",
    "Gambar 72. Response Login Owner",
    "Gambar 73. Response Endpoint Protected",
    "Gambar 74. Response Pesanan Member",
}


def qn(tag: str) -> str:
    prefix, local = tag.split(":", 1)
    return f"{{{NS[prefix]}}}{local}"


def para_text(p: etree._Element) -> str:
    return "".join(p.xpath(".//w:t/text()", namespaces=NS))


def style_id(p: etree._Element) -> str:
    pstyle = p.find("./w:pPr/w:pStyle", namespaces=NS)
    if pstyle is None:
        return ""
    return pstyle.get(qn("w:val"), "")


def map_figure_number(number: int) -> int:
    if number == 70:
        return 69
    if number == 75:
        return 70
    if number >= 76:
        return number - 5
    return number


def mapped_caption_text(text: str) -> str:
    match = re.match(r"^(Gambar\s+)(\d+)(\.)", text)
    if not match:
        return text
    number = int(match.group(2))
    mapped = map_figure_number(number)
    if mapped == number:
        return text
    return f"{match.group(1)}{mapped}{match.group(3)}{text[match.end():]}"


def rewrite_caption_number_tokens(p: etree._Element, old_number: int, new_number: int) -> bool:
    changed = False
    old = str(old_number)
    new = str(new_number)
    for t in p.xpath(".//w:t", namespaces=NS):
        value = t.text or ""
        updated = re.sub(rf"(?<=Gambar\s){old}(?=\.)", new, value)
        if value == old:
            updated = new
        if updated != value:
            t.text = updated
            changed = True
    return changed


def rewrite_plain_refs(p: etree._Element) -> bool:
    changed = False
    for t in p.xpath(".//w:t", namespaces=NS):
        value = t.text or ""

        def repl(match: re.Match[str]) -> str:
            number = int(match.group(1))
            mapped = map_figure_number(number)
            return f"Gambar {mapped}"

        updated = re.sub(r"Gambar\s+(\d+)", repl, value)
        if updated != value:
            t.text = updated
            changed = True
    return changed


def main() -> None:
    with zipfile.ZipFile(DOCX_PATH, "r") as zin:
        document_xml = zin.read("word/document.xml")
        entries = {info.filename: zin.read(info.filename) for info in zin.infolist()}
        infos = zin.infolist()

    root = etree.fromstring(document_xml)
    body = root.find(".//w:body", namespaces=NS)
    if body is None:
        raise RuntimeError("word/document.xml has no w:body")

    children = list(body)
    removed_tof_entries = []
    caption_updates = []
    tof_updates = []
    ref_updates = 0

    for child in list(children):
        if child.tag != qn("w:p"):
            continue
        text = para_text(child).strip()
        style = style_id(child)

        if style == "TableofFigures" and any(text.startswith(title) for title in DELETED_TITLES):
            removed_tof_entries.append(text)
            body.remove(child)
            continue

        if style in {"Caption", "TableofFigures"}:
            match = re.match(r"^Gambar\s+(\d+)\.", text)
            if not match:
                continue
            old_number = int(match.group(1))
            new_number = map_figure_number(old_number)
            if new_number == old_number:
                continue
            if rewrite_caption_number_tokens(child, old_number, new_number):
                updated_text = para_text(child).strip()
                record = {"old": text, "new": updated_text}
                if style == "Caption":
                    caption_updates.append(record)
                else:
                    tof_updates.append(record)
            continue

        if rewrite_plain_refs(child):
            ref_updates += 1

    new_document_xml = etree.tostring(
        root,
        xml_declaration=True,
        encoding="UTF-8",
        standalone=True,
    )

    fd, tmp_name = tempfile.mkstemp(suffix=".docx", dir=str(DOCX_PATH.parent))
    os.close(fd)
    tmp_path = Path(tmp_name)
    try:
        with zipfile.ZipFile(tmp_path, "w") as zout:
            for info in infos:
                data = new_document_xml if info.filename == "word/document.xml" else entries[info.filename]
                zi = zipfile.ZipInfo(info.filename, date_time=info.date_time)
                zi.compress_type = info.compress_type
                zi.comment = info.comment
                zi.extra = info.extra
                zi.internal_attr = info.internal_attr
                zi.external_attr = info.external_attr
                zi.create_system = info.create_system
                zout.writestr(zi, data)
        with zipfile.ZipFile(tmp_path, "r") as zcheck:
            zcheck.testzip()
            zcheck.read("word/document.xml")
        shutil.move(str(tmp_path), DOCX_PATH)
    finally:
        if tmp_path.exists():
            tmp_path.unlink()

    report = {
        "removed_table_of_figures_entries": removed_tof_entries,
        "caption_updates": caption_updates,
        "table_of_figures_updates": tof_updates,
        "plain_reference_paragraphs_updated": ref_updates,
    }
    REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
