from __future__ import annotations

import json
import re
import zipfile
from collections import Counter
from pathlib import Path
from xml.etree import ElementTree as ET

DOCX = Path(r"D:\Semester\Semester7\Skripsi\BAB1-5\183-Raka Bagaskara Putra.docx")
OUT_DIR = Path(r"D:\Semester\Semester7\Skripsi\Projek-Skripsi\analysis_outputs\docx_review_183")
NS = {
    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "wp": "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
    "pic": "http://schemas.openxmlformats.org/drawingml/2006/picture",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}


def qn(tag: str) -> str:
    prefix, name = tag.split(":")
    return f"{{{NS[prefix]}}}{name}"


def text_of(node: ET.Element) -> str:
    parts = []
    for t in node.findall(".//w:t", NS):
        if t.text:
            parts.append(t.text)
    return "".join(parts)


def para_style(p: ET.Element) -> str:
    pstyle = p.find("./w:pPr/w:pStyle", NS)
    if pstyle is None:
        return ""
    return pstyle.attrib.get(qn("w:val"), "")


def has_drawing(node: ET.Element) -> bool:
    return node.find(".//w:drawing", NS) is not None or node.find(".//w:pict", NS) is not None


def table_text(tbl: ET.Element) -> list[list[list[str]]]:
    rows: list[list[list[str]]] = []
    for tr in tbl.findall("./w:tr", NS):
        row = []
        for tc in tr.findall("./w:tc", NS):
            cell_paras = [text_of(p).strip() for p in tc.findall("./w:p", NS)]
            cell_paras = [p for p in cell_paras if p]
            row.append(cell_paras)
        rows.append(row)
    return rows


def iter_blocks(body: ET.Element):
    for child in list(body):
        if child.tag == qn("w:p"):
            yield {
                "type": "paragraph",
                "style": para_style(child),
                "text": text_of(child).strip(),
                "has_drawing": has_drawing(child),
            }
        elif child.tag == qn("w:tbl"):
            rows = table_text(child)
            yield {
                "type": "table",
                "rows": len(rows),
                "cols": max((len(r) for r in rows), default=0),
                "text": rows,
            }


def normalize_space(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(DOCX) as zf:
        document_xml = zf.read("word/document.xml")
    root = ET.fromstring(document_xml)
    body = root.find("w:body", NS)
    if body is None:
        raise RuntimeError("w:body not found")

    blocks = list(iter_blocks(body))
    lines = []
    caption_like = []
    headings = []
    image_paras = []
    tables = []
    styles = Counter()

    for idx, block in enumerate(blocks, start=1):
        if block["type"] == "paragraph":
            text = normalize_space(block["text"])
            style = block.get("style", "")
            styles[style] += 1
            if text:
                lines.append(f"[{idx:05d}] ({style or 'Normal'}) {text}")
            if style.lower().startswith("heading") or re.match(r"^\d+(\.\d+)*\s+", text):
                headings.append({"block": idx, "style": style, "text": text})
            if re.match(r"^(Gambar|Tabel|Lampiran)\s+\d+", text, flags=re.I):
                caption_like.append({"block": idx, "style": style, "text": text})
            if block.get("has_drawing"):
                image_paras.append({"block": idx, "style": style, "text": text})
        elif block["type"] == "table":
            flat = []
            for row in block["text"]:
                cells = [" / ".join(cell) for cell in row]
                flat.append(" | ".join(cells))
            tables.append({
                "block": idx,
                "rows": block["rows"],
                "cols": block["cols"],
                "preview": flat[:5],
            })
            lines.append(f"[{idx:05d}] (TABLE {block['rows']}x{block['cols']})")
            lines.extend(f"        {normalize_space(row)}" for row in flat[:12] if normalize_space(row))

    text = "\n".join(lines)
    summary = {
        "source": str(DOCX),
        "block_count": len(blocks),
        "paragraph_count": sum(1 for b in blocks if b["type"] == "paragraph"),
        "table_count": len(tables),
        "image_paragraph_count": len(image_paras),
        "caption_like_count": len(caption_like),
        "heading_like_count": len(headings),
        "styles_top": styles.most_common(30),
        "captions": caption_like,
        "headings": headings,
        "image_paragraphs": image_paras,
        "tables": tables,
    }
    (OUT_DIR / "docx_full_text.txt").write_text(text, encoding="utf-8")
    (OUT_DIR / "docx_structure_summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({
        "text": str(OUT_DIR / "docx_full_text.txt"),
        "summary": str(OUT_DIR / "docx_structure_summary.json"),
        "paragraphs": summary["paragraph_count"],
        "tables": summary["table_count"],
        "imageParagraphs": summary["image_paragraph_count"],
        "captions": summary["caption_like_count"],
        "headings": summary["heading_like_count"],
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
