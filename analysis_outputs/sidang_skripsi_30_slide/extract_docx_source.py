import argparse
import csv
import json
import re
import shutil
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET


NS = {
    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "wp": "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
    "rel": "http://schemas.openxmlformats.org/package/2006/relationships",
}


def qname(name):
    prefix, local = name.split(":")
    return f"{{{NS[prefix]}}}{local}"


def paragraph_text(p):
    parts = []
    for node in p.iter():
        if node.tag == qname("w:t") and node.text:
            parts.append(node.text)
        elif node.tag == qname("w:tab"):
            parts.append("\t")
        elif node.tag == qname("w:br"):
            parts.append("\n")
    return "".join(parts).strip()


def paragraph_style(p):
    ppr = p.find("w:pPr", NS)
    if ppr is None:
        return ""
    pstyle = ppr.find("w:pStyle", NS)
    if pstyle is None:
        return ""
    return pstyle.attrib.get(qname("w:val"), "")


def blip_rids(p):
    rids = []
    for blip in p.findall(".//a:blip", NS):
        rid = blip.attrib.get(qname("r:embed")) or blip.attrib.get(qname("r:link"))
        if rid:
            rids.append(rid)
    return rids


def table_rows(tbl):
    rows = []
    for tr in tbl.findall("w:tr", NS):
        row = []
        for tc in tr.findall("w:tc", NS):
            texts = [paragraph_text(p) for p in tc.findall(".//w:p", NS)]
            row.append(" ".join([t for t in texts if t]).strip())
        if any(cell for cell in row):
            rows.append(row)
    return rows


def read_relationships(zf):
    rels = {}
    root = ET.fromstring(zf.read("word/_rels/document.xml.rels"))
    for rel in root.findall("rel:Relationship", NS):
        rels[rel.attrib["Id"]] = {
            "type": rel.attrib.get("Type", ""),
            "target": rel.attrib.get("Target", ""),
        }
    return rels


def normalize_caption_number(text, kind):
    m = re.match(rf"^\s*{kind}\s+([0-9]+(?:\.[0-9]+)*)\s*(.*)$", text, re.I)
    if not m:
        return None
    title = re.sub(r"^[\s\.\-:]+", "", m.group(2)).strip()
    return {"number": m.group(1), "title": title}


def nearest_caption(blocks, image_pos):
    for distance in range(1, 7):
        for pos in (image_pos + distance, image_pos - distance):
            if 0 <= pos < len(blocks) and blocks[pos]["type"] == "paragraph":
                text = blocks[pos].get("text", "")
                cap = normalize_caption_number(text, "Gambar")
                if cap:
                    return cap | {"caption": text, "caption_block": pos}
    return None


def clean_filename(text, max_len=90):
    text = re.sub(r"[^\w\-. ]+", "_", text, flags=re.UNICODE)
    text = re.sub(r"\s+", "_", text.strip())
    return text[:max_len] or "untitled"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--docx", required=True)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()

    docx_path = Path(args.docx)
    out_dir = Path(args.out)
    assets_dir = out_dir / "assets"
    tables_dir = out_dir / "tables"
    assets_dir.mkdir(parents=True, exist_ok=True)
    tables_dir.mkdir(parents=True, exist_ok=True)

    blocks = []
    figures = []
    tables = []
    headings = []
    full_text_parts = []

    with zipfile.ZipFile(docx_path) as zf:
        rels = read_relationships(zf)
        for name in zf.namelist():
            if name.startswith("word/media/"):
                dest = assets_dir / Path(name).name
                dest.write_bytes(zf.read(name))

        document = ET.fromstring(zf.read("word/document.xml"))
        body = document.find("w:body", NS)
        image_serial = 0
        table_serial = 0

        for child in body:
            if child.tag == qname("w:p"):
                text = paragraph_text(child)
                style = paragraph_style(child)
                rids = blip_rids(child)
                block = {
                    "type": "paragraph",
                    "block": len(blocks),
                    "style": style,
                    "text": text,
                    "image_rids": rids,
                }
                blocks.append(block)
                if text:
                    full_text_parts.append(text)
                    if style.lower().startswith("heading") or re.match(r"^(BAB\s+[IVX]+|[0-9]+(?:\.[0-9]+)+)\b", text, re.I):
                        headings.append({"block": block["block"], "style": style, "text": text})
                for rid in rids:
                    image_serial += 1
                    target = rels.get(rid, {}).get("target", "")
                    image_path = assets_dir / Path(target).name if target else None
                    figures.append(
                        {
                            "image_index": image_serial,
                            "block": block["block"],
                            "rid": rid,
                            "target": target,
                            "path": str(image_path) if image_path else "",
                            "caption": None,
                        }
                    )
            elif child.tag == qname("w:tbl"):
                table_serial += 1
                rows = table_rows(child)
                table_block = {
                    "type": "table",
                    "block": len(blocks),
                    "table_index": table_serial,
                    "rows": rows,
                    "row_count": len(rows),
                    "col_count": max((len(r) for r in rows), default=0),
                }
                blocks.append(table_block)
                if rows:
                    full_text_parts.append(f"[TABLE {table_serial}]")
                    full_text_parts.extend([" | ".join(row) for row in rows])
                tables.append(table_block)

        for fig in figures:
            cap = nearest_caption(blocks, fig["block"])
            if cap:
                fig["caption"] = cap["caption"]
                fig["number"] = cap["number"]
                fig["title"] = cap["title"]
                source = Path(fig["path"])
                if source.exists():
                    ext = source.suffix.lower()
                    dest = assets_dir / f"gambar_{cap['number'].replace('.', '_')}_{clean_filename(cap['title'])}{ext}"
                    if dest != source:
                        shutil.copyfile(source, dest)
                    fig["captioned_path"] = str(dest)

        for idx, tbl in enumerate(tables):
            cap = None
            for distance in range(1, 5):
                for pos in (tbl["block"] - distance, tbl["block"] + distance):
                    if 0 <= pos < len(blocks) and blocks[pos]["type"] == "paragraph":
                        parsed = normalize_caption_number(blocks[pos].get("text", ""), "Tabel")
                        if parsed:
                            cap = parsed | {"caption": blocks[pos]["text"], "caption_block": pos}
                            break
                if cap:
                    break
            tbl["caption"] = cap["caption"] if cap else ""
            tbl["number"] = cap["number"] if cap else ""
            tbl["title"] = cap["title"] if cap else ""
            csv_name = f"table_{tbl.get('number') or tbl['table_index']}_{clean_filename(tbl.get('title') or 'table')}.csv"
            csv_path = tables_dir / csv_name
            with csv_path.open("w", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerows(tbl["rows"])
            tbl["csv_path"] = str(csv_path)

    (out_dir / "document_text.txt").write_text("\n".join(full_text_parts), encoding="utf-8")
    (out_dir / "outline.txt").write_text("\n".join(f"{h['block']:05d}\t{h['style']}\t{h['text']}" for h in headings), encoding="utf-8")
    (out_dir / "blocks.json").write_text(json.dumps(blocks, ensure_ascii=False, indent=2), encoding="utf-8")
    (out_dir / "figures.json").write_text(json.dumps(figures, ensure_ascii=False, indent=2), encoding="utf-8")
    (out_dir / "tables.json").write_text(json.dumps(tables, ensure_ascii=False, indent=2), encoding="utf-8")

    summary = {
        "docx": str(docx_path),
        "paragraph_blocks": sum(1 for b in blocks if b["type"] == "paragraph"),
        "table_blocks": sum(1 for b in blocks if b["type"] == "table"),
        "image_refs": len(figures),
        "captioned_figures": sum(1 for f in figures if f.get("caption")),
        "captioned_tables": sum(1 for t in tables if t.get("caption")),
        "full_text_chars": len("\n".join(full_text_parts)),
    }
    (out_dir / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
