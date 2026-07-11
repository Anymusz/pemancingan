from __future__ import annotations

import json
import re
import zipfile
from pathlib import Path

from lxml import etree


DOCX_PATH = Path(r"D:\Semester\Semester7\Skripsi\BAB1-5\183-Raka Bagaskara Putra.docx")
OUT_PATH = Path(r"D:\Semester\Semester7\Skripsi\Projek-Skripsi\analysis_outputs\swagger_cleanup_183\audit_report.json")

NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}

STALE_PHRASES = [
    "Gambar 69. Request Pesanan Member",
    "Gambar 71. Response Endpoint GET Events",
    "Gambar 72. Response Login Owner",
    "Gambar 73. Response Endpoint Protected",
    "Gambar 74. Response Pesanan Member",
    "Gambar 75. Response Checkout Pegawai",
    "Berdasarkan Gambar 74",
    "Gambar 67 sampai Gambar 71",
    "Gambar 67 sampai Gambar 75",
]


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


def has_media(p: etree._Element) -> bool:
    return bool(p.xpath(".//w:drawing | .//w:pict | .//w:object", namespaces=NS))


def main() -> None:
    with zipfile.ZipFile(DOCX_PATH, "r") as zf:
        xml = zf.read("word/document.xml")

    root = etree.fromstring(xml)
    paragraphs = root.xpath(".//w:body/w:p", namespaces=NS)
    all_text = "\n".join(para_text(p) for p in paragraphs)

    tof_67_75 = []
    captions_67_80 = []
    swagger_context = []
    swagger_started = False
    for idx, p in enumerate(paragraphs):
        text = para_text(p).strip()
        style = style_id(p)
        if "Dokumentasi Endpoint API melalui Swagger" in text:
            swagger_started = True
        if style == "TableofFigures" and re.match(r"^Gambar\s+(6[7-9]|7[0-5])\.", text):
            tof_67_75.append({"index": idx, "text": text})
        if style == "Caption" and re.match(r"^Gambar\s+(6[7-9]|7[0-9]|80)\.", text):
            captions_67_80.append({"index": idx, "text": text})
        if swagger_started and len(swagger_context) < 20 and (text or has_media(p)):
            swagger_context.append(
                {"index": idx, "style": style, "text": text, "has_media": has_media(p)}
            )

    stale = {phrase: all_text.count(phrase) for phrase in STALE_PHRASES}
    report = {
        "docx": str(DOCX_PATH),
        "stale_phrase_counts": stale,
        "table_of_figures_67_to_75": tof_67_75,
        "body_captions_67_to_80": captions_67_80,
        "swagger_context_first_20_blocks": swagger_context,
    }
    OUT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
