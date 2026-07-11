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
REPORT_PATH = Path(r"D:\Semester\Semester7\Skripsi\Projek-Skripsi\analysis_outputs\swagger_cleanup_183\apply_report.json")

NS = {
    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
}

DELETE_CAPTIONS = {
    69: "Gambar 69. Request Pesanan Member",
    71: "Gambar 71. Response Endpoint GET Events",
    72: "Gambar 72. Response Login Owner",
    73: "Gambar 73. Response Endpoint Protected",
    74: "Gambar 74. Response Pesanan Member",
}

INTRO_OLD = "Gambar 67 sampai Gambar 71 memperlihatkan bukti implementasi endpoint API melalui dokumentasi Swagger."
INTRO_NEW = "Gambar 67 sampai Gambar 70 memperlihatkan beberapa contoh dokumentasi endpoint API melalui Swagger/OpenAPI."


def qn(tag: str) -> str:
    prefix, local = tag.split(":", 1)
    return f"{{{NS[prefix]}}}{local}"


def is_para(el: etree._Element) -> bool:
    return el.tag == qn("w:p")


def para_text(p: etree._Element) -> str:
    return "".join(p.xpath(".//w:t/text()", namespaces=NS))


def style_id(p: etree._Element) -> str:
    pstyle = p.find("./w:pPr/w:pStyle", namespaces=NS)
    if pstyle is None:
        return ""
    return pstyle.get(qn("w:val"), "")


def has_media(p: etree._Element) -> bool:
    return bool(
        p.xpath(
            ".//w:drawing | .//w:pict | .//w:object",
            namespaces=NS,
        )
    )


def has_field(p: etree._Element) -> bool:
    return bool(p.xpath(".//w:fldChar | .//w:instrText | .//w:fldSimple", namespaces=NS))


def set_paragraph_text(p: etree._Element, text: str) -> None:
    text_nodes = p.xpath(".//w:t", namespaces=NS)
    if text_nodes:
        text_nodes[0].text = text
        for node in text_nodes[1:]:
            node.text = ""
        return

    run = etree.SubElement(p, qn("w:r"))
    t = etree.SubElement(run, qn("w:t"))
    t.text = text


def map_figure_number(number: int) -> int:
    if number == 70:
        return 69
    if number == 75:
        return 70
    if number >= 76:
        return number - 5
    return number


def transform_refs(text: str) -> str:
    def repl(match: re.Match[str]) -> str:
        number = int(match.group(1))
        mapped = map_figure_number(number)
        return f"Gambar {mapped}"

    return re.sub(r"Gambar\s+(\d+)", repl, text)


def replace_text_in_plain_para(p: etree._Element, old: str, new: str) -> bool:
    original = para_text(p)
    if old not in original:
        return False
    set_paragraph_text(p, original.replace(old, new))
    return True


def main() -> None:
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(DOCX_PATH, "r") as zin:
        document_xml = zin.read("word/document.xml")
        entries = {info.filename: zin.read(info.filename) for info in zin.infolist()}
        infos = zin.infolist()

    parser = etree.XMLParser(remove_blank_text=False, recover=False)
    root = etree.fromstring(document_xml, parser)
    body = root.find(".//w:body", namespaces=NS)
    if body is None:
        raise RuntimeError("word/document.xml has no w:body")

    children = list(body)
    swagger_start = None
    for i, child in enumerate(children):
        if is_para(child) and "Dokumentasi Endpoint API melalui Swagger" in para_text(child):
            swagger_start = i
            break
    if swagger_start is None:
        raise RuntimeError("Could not find Swagger section heading")

    ranges_to_delete: list[tuple[int, int, str]] = []
    for i, child in enumerate(children):
        if not is_para(child) or style_id(child) != "Caption":
            continue
        text = para_text(child).strip()
        for old_number, caption in DELETE_CAPTIONS.items():
            if not text.startswith(caption):
                continue
            start = i
            if i > 0 and is_para(children[i - 1]) and has_media(children[i - 1]) and not para_text(children[i - 1]).strip():
                start = i - 1

            end = i
            if i + 1 < len(children) and is_para(children[i + 1]):
                next_text = para_text(children[i + 1]).strip()
                if next_text.startswith(f"Berdasarkan Gambar {old_number}"):
                    end = i + 1

            ranges_to_delete.append((start, end, caption))

    if len(ranges_to_delete) != len(DELETE_CAPTIONS):
        found = [caption for _, _, caption in ranges_to_delete]
        raise RuntimeError(f"Expected {len(DELETE_CAPTIONS)} delete ranges, found {len(found)}: {found}")

    # Remove from bottom to top so earlier indexes remain stable.
    deleted = []
    for start, end, caption in sorted(ranges_to_delete, key=lambda item: item[0], reverse=True):
        deleted.append({"caption": caption, "start_index": start, "end_index": end})
        for child in children[start : end + 1]:
            body.remove(child)

    children = list(body)
    intro_replacements = 0
    ref_replacements = 0
    skipped_field_paragraphs = 0

    for i, child in enumerate(children):
        if not is_para(child):
            continue
        if i < swagger_start:
            continue
        if style_id(child) == "TableofFigures":
            continue

        original = para_text(child)
        if not original:
            continue

        if INTRO_OLD in original:
            if replace_text_in_plain_para(child, INTRO_OLD, INTRO_NEW):
                intro_replacements += 1
            continue

        transformed = transform_refs(original)
        if transformed == original:
            continue

        if has_field(child):
            skipped_field_paragraphs += 1
            continue

        set_paragraph_text(child, transformed)
        ref_replacements += 1

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
        "docx": str(DOCX_PATH),
        "deleted_blocks": deleted,
        "intro_replacements": intro_replacements,
        "reference_paragraphs_rewritten": ref_replacements,
        "field_paragraphs_skipped_for_word_update": skipped_field_paragraphs,
    }
    REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
