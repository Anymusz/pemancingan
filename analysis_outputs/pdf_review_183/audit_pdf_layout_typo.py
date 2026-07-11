from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from pathlib import Path

import pdfplumber
import pypdfium2 as pdfium
from PIL import ImageDraw

PDF = Path(r"D:\Semester\Semester7\Skripsi\BAB1-5\183-Raka Bagaskara Putra.pdf")
OUT_DIR = Path(r"D:\Semester\Semester7\Skripsi\Projek-Skripsi\analysis_outputs\pdf_review_183")
RENDER_DIR = OUT_DIR / "render_findings"
REPORT_JSON = OUT_DIR / "pdf_review_findings.json"
REPORT_TXT = OUT_DIR / "pdf_review_findings.txt"
FULL_TEXT = OUT_DIR / "pdf_full_text_by_page.txt"

CAPTION_RE = re.compile(r"^(Tabel|Gambar)\s+(\d+(?:\.\d+)?)\s*[\.:]\s*(.*)$", re.I)

COMMON_TYPO_PATTERNS = {
    r"\bdiatas\b": "di atas",
    r"\bdibawah\b": "di bawah",
    r"\bdiantara\b": "di antara",
    r"\bdidalam\b": "di dalam",
    r"\bkedalam\b": "ke dalam",
    r"\bdimana\b": "di mana",
    r"\baktifitas\b": "aktivitas",
    r"\banalisa\b": "analisis",
    r"\bresiko\b": "risiko",
    r"\bijin\b": "izin",
    r"\bpraktek\b": "praktik",
    r"\bkwalitas\b": "kualitas",
    r"\bobyek\b": "objek",
    r"\bsubyek\b": "subjek",
    r"\bsekedar\b": "sekadar",
}

TERM_PATTERNS = {
    "back-end/backend/back end": re.compile(r"\b(?:back[- ]?end|backend)\b", re.I),
    "front-end/frontend/front end": re.compile(r"\b(?:front[- ]?end|frontend)\b", re.I),
    "use case/use-case": re.compile(r"\buse[- ]case\b", re.I),
    "activity diagram": re.compile(r"\bactivity[- ]diagram\b", re.I),
    "QR Code/QR-Code/qrcode": re.compile(r"\bqr[- ]?code\b", re.I),
    "endpoint/end point": re.compile(r"\bend[- ]?point\b", re.I),
}


def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def group_words_into_lines(words: list[dict], tolerance: float = 3.0) -> list[dict]:
    if not words:
        return []
    sorted_words = sorted(words, key=lambda w: (round(w["top"] / tolerance), w["x0"]))
    groups: list[list[dict]] = []
    for word in sorted_words:
        if not groups:
            groups.append([word])
            continue
        last_top = sum(w["top"] for w in groups[-1]) / len(groups[-1])
        if abs(word["top"] - last_top) <= tolerance:
            groups[-1].append(word)
        else:
            groups.append([word])
    lines = []
    for group in groups:
        group = sorted(group, key=lambda w: w["x0"])
        text = normalize(" ".join(w["text"] for w in group))
        if not text:
            continue
        lines.append({
            "text": text,
            "x0": min(w["x0"] for w in group),
            "x1": max(w["x1"] for w in group),
            "top": min(w["top"] for w in group),
            "bottom": max(w["bottom"] for w in group),
        })
    return sorted(lines, key=lambda line: (line["top"], line["x0"]))


def safe_find_tables(page) -> list[dict]:
    tables = []
    settings = [
        {},
        {"vertical_strategy": "lines", "horizontal_strategy": "lines"},
        {"vertical_strategy": "text", "horizontal_strategy": "text", "snap_tolerance": 4, "join_tolerance": 4},
    ]
    seen = set()
    for setting in settings:
        try:
            found = page.find_tables(table_settings=setting)
        except Exception:
            continue
        for table in found:
            bbox = tuple(round(v, 2) for v in table.bbox)
            if bbox in seen:
                continue
            seen.add(bbox)
            tables.append({"bbox": list(bbox), "top": bbox[1], "bottom": bbox[3]})
    return tables


def page_footer_label(lines: list[dict], height: float) -> str:
    top_lines = [line["text"] for line in lines if line["top"] < height * 0.08]
    for text in top_lines:
        if re.fullmatch(r"\d{1,3}", text.strip()):
            return text.strip()
    bottom_lines = [line["text"] for line in lines if line["top"] > height * 0.82]
    for text in reversed(bottom_lines):
        m = re.search(r"\b([ivxlcdm]+|\d{1,3})\b$", text.strip(), re.I)
        if m:
            return m.group(1)
    return ""


def line_after(lines: list[dict], y: float) -> list[dict]:
    return [line for line in lines if line["top"] > y + 4]


def find_caption_splits(pages: list[dict]) -> list[dict]:
    findings = []
    for i, page in enumerate(pages[:-1]):
        next_page = pages[i + 1]
        page_text = " ".join(line["text"] for line in page["lines"][:12])
        if re.search(r"DAFTAR\s+(ISI|TABEL|GAMBAR|LAMPIRAN)|RINGKASAN|PRAKATA", page_text, re.I):
            continue
        for caption in page["captions"]:
            if (
                "...." in caption["text"]
                or caption["bottom"] < page["height"] * 0.68
                or len(caption.get("title", "")) < 4
            ):
                continue
            kind = caption["kind"].lower()
            y = caption["bottom"]
            after_lines = line_after(page["lines"], y)
            if kind == "tabel":
                same_page_objects = [t for t in page["tables"] if t["top"] > y + 4]
                next_objects = next_page["tables"]
                next_near_top = [t for t in next_objects if t["top"] < next_page["height"] * 0.42]
                # Text-only tables can be missed by extraction. Detect obvious header rows near top.
                first_next = " ".join(line["text"] for line in next_page["lines"][:8])
                header_next = bool(re.search(r"\b(No|Kode|Deskripsi|Method|Endpoint|Aktor)\b", first_next, re.I))
                sparse_after = len(after_lines) <= 2
                if not same_page_objects and sparse_after and (next_near_top or header_next):
                    findings.append({
                        "kind": "caption_object_split",
                        "object": "table",
                        "pdf_page": page["page"],
                        "printed_page": page["footer"],
                        "next_pdf_page": next_page["page"],
                        "next_printed_page": next_page["footer"],
                        "caption": caption["text"],
                        "caption_y": round(y, 2),
                        "lines_after_caption_same_page": [line["text"] for line in after_lines[:6]],
                        "next_page_first_lines": [line["text"] for line in next_page["lines"][:8]],
                    })
            elif kind == "gambar":
                same_page_images = page["images"]
                next_images = [img for img in next_page["images"] if img["top"] < next_page["height"] * 0.50]
                # Many captions are below images; only flag if caption is visibly high/alone and image begins next.
                if not same_page_images and next_images and y > page["height"] * 0.50 and len(after_lines) <= 2:
                    findings.append({
                        "kind": "caption_object_split",
                        "object": "image",
                        "pdf_page": page["page"],
                        "printed_page": page["footer"],
                        "next_pdf_page": next_page["page"],
                        "next_printed_page": next_page["footer"],
                        "caption": caption["text"],
                        "caption_y": round(y, 2),
                        "lines_after_caption_same_page": [line["text"] for line in after_lines[:6]],
                        "next_page_first_lines": [line["text"] for line in next_page["lines"][:8]],
                    })

    return findings


def typo_findings(page_texts: dict[int, str]) -> list[dict]:
    findings = []
    for pattern, suggestion in COMMON_TYPO_PATTERNS.items():
        rx = re.compile(pattern, re.I)
        hits = []
        for page_no, text in page_texts.items():
            for m in rx.finditer(text):
                context = normalize(text[max(0, m.start() - 60): min(len(text), m.end() + 60)])
                hits.append({"pdf_page": page_no, "match": m.group(0), "suggestion": suggestion, "context": context})
                if len(hits) >= 12:
                    break
            if len(hits) >= 12:
                break
        if hits:
            findings.append({"kind": "typo_candidate", "pattern": pattern, "suggestion": suggestion, "hits": hits})

    double_rx = re.compile(r"\b([A-Za-zÀ-ÿ]{3,})[ \t]+\1\b", re.I)
    hits = []
    ignore_words = {"tabel", "gambar", "lampiran", "laravel", "mysql", "include", "extend", "decision", "dependency", "asosiasi", "penelitian"}
    for page_no, text in page_texts.items():
        for m in double_rx.finditer(text):
            word = m.group(1).lower()
            context = normalize(text[max(0, m.start() - 70): min(len(text), m.end() + 70)])
            if word in ignore_words:
                continue
            hits.append({"pdf_page": page_no, "match": m.group(0), "context": context})
            if len(hits) >= 20:
                break
        if len(hits) >= 20:
            break
    if hits:
        findings.append({"kind": "duplicate_word_candidate", "suggestion": "cek apakah kata/nama berulang memang benar", "hits": hits})

    punct_rx = re.compile(r"[A-Za-zÀ-ÿ][.!?][A-ZÀ-Ý]")
    hits = []
    for page_no, text in page_texts.items():
        for m in punct_rx.finditer(text):
            context = normalize(text[max(0, m.start() - 65): min(len(text), m.end() + 65)])
            # Keep URL/capitalization cases because references often contain real typo style issues.
            hits.append({"pdf_page": page_no, "match": m.group(0), "context": context})
            if len(hits) >= 20:
                break
        if len(hits) >= 20:
            break
    if hits:
        findings.append({"kind": "punctuation_spacing_candidate", "suggestion": "cek spasi setelah tanda baca / format URL", "hits": hits})
    return findings


def term_consistency(full_text: str) -> list[dict]:
    findings = []
    for label, rx in TERM_PATTERNS.items():
        counts = Counter(m.group(0) for m in rx.finditer(full_text))
        if len(counts) > 1:
            findings.append({"term": label, "variants": dict(counts.most_common())})
    return findings


def render_pages(pdf_path: Path, findings: list[dict]) -> list[str]:
    RENDER_DIR.mkdir(parents=True, exist_ok=True)
    doc = pdfium.PdfDocument(str(pdf_path))
    rendered = []
    needed = set()
    for finding in findings:
        for key in ("pdf_page", "next_pdf_page"):
            if key in finding:
                needed.add(int(finding[key]))
    for page_no in sorted(needed):
        page = doc[page_no - 1]
        bitmap = page.render(scale=1.8)
        pil = bitmap.to_pil()
        out = RENDER_DIR / f"page-{page_no:03d}.png"
        pil.save(out)
        rendered.append(str(out))
    return rendered


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    pages = []
    page_texts = {}

    with pdfplumber.open(PDF) as pdf:
        for idx, page in enumerate(pdf.pages, start=1):
            words = page.extract_words(x_tolerance=2, y_tolerance=3, keep_blank_chars=False)
            lines = group_words_into_lines(words)
            captions = []
            for line in lines:
                m = CAPTION_RE.match(line["text"])
                if m:
                    captions.append({
                        "kind": m.group(1),
                        "number": m.group(2),
                        "text": line["text"],
                        "title": normalize(m.group(3)),
                        "top": line["top"],
                        "bottom": line["bottom"],
                    })
            tables = safe_find_tables(page)
            images = []
            for image in page.images:
                images.append({
                    "x0": image.get("x0"),
                    "x1": image.get("x1"),
                    "top": image.get("top"),
                    "bottom": image.get("bottom"),
                    "width": image.get("width"),
                    "height": image.get("height"),
                })
            text = "\n".join(line["text"] for line in lines)
            page_texts[idx] = text
            pages.append({
                "page": idx,
                "width": page.width,
                "height": page.height,
                "footer": page_footer_label(lines, page.height),
                "lineCount": len(lines),
                "lines": lines,
                "captions": captions,
                "tables": tables,
                "images": images,
            })

    full_text_lines = []
    for page_no, text in page_texts.items():
        full_text_lines.append(f"--- PDF PAGE {page_no} ---")
        full_text_lines.append(text)
    FULL_TEXT.write_text("\n".join(full_text_lines), encoding="utf-8")
    full_text = "\n".join(page_texts.values())

    layout = find_caption_splits(pages)
    typos = typo_findings(page_texts)
    terms = term_consistency(full_text)
    rendered = render_pages(PDF, layout)

    report = {
        "source": str(PDF),
        "pdf_page_count": len(pages),
        "caption_count": sum(len(page["captions"]) for page in pages),
        "table_detection_count": sum(len(page["tables"]) for page in pages),
        "image_detection_count": sum(len(page["images"]) for page in pages),
        "layout_findings": layout,
        "typo_findings": typos,
        "term_consistency_findings": terms,
        "rendered_finding_pages": rendered,
    }
    REPORT_JSON.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    lines = [
        f"Source: {PDF}",
        f"PDF pages: {report['pdf_page_count']}",
        f"Captions: {report['caption_count']} | Tables detected: {report['table_detection_count']} | Images detected: {report['image_detection_count']}",
        "",
        "LAYOUT FINDINGS",
    ]
    if not layout:
        lines.append("- Tidak ditemukan kandidat caption/judul yang terpisah dari tabel/gambar halaman berikutnya.")
    else:
        for item in layout:
            label = item.get("caption") or item.get("heading")
            printed = f" printed {item.get('printed_page')}" if item.get("printed_page") else ""
            nprinted = f" printed {item.get('next_printed_page')}" if item.get("next_printed_page") else ""
            lines.append(f"- PDF p.{item['pdf_page']}{printed} -> PDF p.{item['next_pdf_page']}{nprinted}: {item['kind']} | {label}")
            lines.append(f"  Next first: {' / '.join(item.get('next_page_first_lines', [])[:5])}")
        lines.append("")
        lines.append("Rendered evidence:")
        for path in rendered:
            lines.append(f"- {path}")

    lines.append("")
    lines.append("TYPO FINDINGS")
    if not typos:
        lines.append("- Tidak ada kandidat typo dari pola yang dicek.")
    else:
        for group in typos:
            lines.append(f"- {group['kind']}: {group.get('suggestion', group.get('pattern', ''))}")
            for hit in group["hits"][:8]:
                lines.append(f"  PDF p.{hit['pdf_page']}: {hit['context']}")

    lines.append("")
    lines.append("TERM CONSISTENCY FINDINGS")
    if not terms:
        lines.append("- Tidak ada inkonsistensi istilah dari pola yang dicek.")
    else:
        for item in terms:
            variants = ", ".join(f"{k}={v}" for k, v in item["variants"].items())
            lines.append(f"- {item['term']}: {variants}")

    REPORT_TXT.write_text("\n".join(lines), encoding="utf-8")
    print(json.dumps({
        "report_json": str(REPORT_JSON),
        "report_txt": str(REPORT_TXT),
        "pages": report["pdf_page_count"],
        "layout_findings": len(layout),
        "typo_groups": len(typos),
        "term_groups": len(terms),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
