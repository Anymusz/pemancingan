from __future__ import annotations

import json
import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

DOCX = Path(r"D:\Semester\Semester7\Skripsi\BAB1-5\183-Raka Bagaskara Putra.docx")
OUT_DIR = Path(r"D:\Semester\Semester7\Skripsi\Projek-Skripsi\analysis_outputs\swagger_cleanup_183")
NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}


def qn(tag: str) -> str:
    prefix, local = tag.split(":")
    return f"{{{NS[prefix]}}}{local}"


def text_of(el: ET.Element) -> str:
    return "".join(t.text or "" for t in el.findall(".//w:t", NS))


def style_of(p: ET.Element) -> str:
    style = p.find("./w:pPr/w:pStyle", NS)
    return "" if style is None else style.attrib.get(qn("w:val"), "")


def has_drawing(p: ET.Element) -> bool:
    return p.find(".//w:drawing", NS) is not None or p.find(".//w:pict", NS) is not None


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(DOCX) as zf:
        xml = zf.read("word/document.xml")
    root = ET.fromstring(xml)
    body = root.find("w:body", NS)
    blocks = []
    for child in list(body):
        if child.tag == qn("w:p"):
            blocks.append({
                "type": "p",
                "style": style_of(child),
                "text": re.sub(r"\s+", " ", text_of(child)).strip(),
                "hasDrawing": has_drawing(child),
            })
        elif child.tag == qn("w:tbl"):
            blocks.append({
                "type": "tbl",
                "style": "",
                "text": re.sub(r"\s+", " ", text_of(child)).strip()[:250],
                "hasDrawing": child.find(".//w:drawing", NS) is not None,
            })
        else:
            blocks.append({"type": child.tag, "style": "", "text": "", "hasDrawing": False})

    matches = []
    target_re = re.compile(r"Gambar\s+(6[7-9]|7[0-5])\b")
    for i, block in enumerate(blocks):
        if target_re.search(block["text"]):
            start = max(0, i - 5)
            end = min(len(blocks), i + 8)
            matches.append({
                "index": i,
                "text": block["text"],
                "context": [
                    {"index": j, **blocks[j]} for j in range(start, end)
                ],
            })

    # Also collect figure list lines and all figure captions around/after Swagger.
    all_figures = []
    for i, block in enumerate(blocks):
        m = re.match(r"^Gambar\s+(\d+)\.\s*(.+)$", block["text"])
        if m:
            all_figures.append({
                "index": i,
                "number": int(m.group(1)),
                "text": block["text"],
                "hasDrawingPrev": blocks[i - 1]["hasDrawing"] if i > 0 else False,
                "style": block["style"],
            })

    report = {
        "blockCount": len(blocks),
        "matches": matches,
        "figures67plus": [f for f in all_figures if f["number"] >= 67],
    }
    out = OUT_DIR / "swagger_blocks_report.json"
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({
        "out": str(out),
        "matches": len(matches),
        "figures67plus": len(report["figures67plus"]),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
