from __future__ import annotations

import json
import os
import shutil
import tempfile
import zipfile
from pathlib import Path

from lxml import etree


DOCX_PATH = Path(r"D:\Semester\Semester7\Skripsi\BAB1-5\183-Raka Bagaskara Putra.docx")
REPORT_PATH = Path(r"D:\Semester\Semester7\Skripsi\Projek-Skripsi\analysis_outputs\swagger_cleanup_183\crossref_fix_report.json")
NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}

INTRO_FINAL = "Gambar 67 sampai Gambar 70 memperlihatkan beberapa contoh dokumentasi endpoint API melalui Swagger/OpenAPI."


def para_text(p: etree._Element) -> str:
    return "".join(p.xpath(".//w:t/text()", namespaces=NS))


def set_first_text_node(p: etree._Element, text: str) -> None:
    nodes = p.xpath(".//w:t", namespaces=NS)
    if not nodes:
        return
    nodes[0].text = text
    for node in nodes[1:]:
        node.text = ""


def replace_exact_text_node(p: etree._Element, old: str, new: str) -> bool:
    changed = False
    for node in p.xpath(".//w:t", namespaces=NS):
        if node.text == old:
            node.text = new
            changed = True
    return changed


def main() -> None:
    with zipfile.ZipFile(DOCX_PATH, "r") as zin:
        document_xml = zin.read("word/document.xml")
        entries = {info.filename: zin.read(info.filename) for info in zin.infolist()}
        infos = zin.infolist()

    root = etree.fromstring(document_xml)
    paragraphs = root.xpath(".//w:body/w:p", namespaces=NS)
    changes = []

    for p in paragraphs:
        text = para_text(p).strip()
        if text.startswith("Gambar 67 sampai Gambar 69 memperlihatkan beberapa contoh dokumentasi endpoint API melalui Swagger/OpenAPI."):
            rest = text.split(".", 1)[1] if "." in text else ""
            set_first_text_node(p, INTRO_FINAL + rest)
            changes.append("intro_range_67_70")
            continue

        if text.startswith("Berdasarkan Gambar 70, Swagger digunakan untuk menguji endpoint checkout transaksi"):
            if replace_exact_text_node(p, "70", "69"):
                changes.append("checkout_request_reference_70_to_69")
            continue

        if text.startswith("Berdasarkan Gambar 75, endpoint POST /api/employee/checkout"):
            if replace_exact_text_node(p, "75", "70"):
                changes.append("checkout_response_reference_75_to_70")
            continue

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

    report = {"changes": changes}
    REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
