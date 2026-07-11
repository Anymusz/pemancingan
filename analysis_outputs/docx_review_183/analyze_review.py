from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path

OUT_DIR = Path(r"D:\Semester\Semester7\Skripsi\Projek-Skripsi\analysis_outputs\docx_review_183")
PAGES_JSON = OUT_DIR / "word_pages_audit.json"
PAGES_TEXT = OUT_DIR / "word_pages_text.txt"
FULL_TEXT = OUT_DIR / "docx_full_text.txt"
REPORT_JSON = OUT_DIR / "review_findings.json"
REPORT_TXT = OUT_DIR / "review_findings.txt"


COMMON_TYPOS = {
    r"\bdiatas\b": "di atas",
    r"\bdibawah\b": "di bawah",
    r"\bdiantara\b": "di antara",
    r"\bdidalam\b": "di dalam",
    r"\bkedalam\b": "ke dalam",
    r"\bkeatas\b": "ke atas",
    r"\bkebawah\b": "ke bawah",
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
    r"\bstandarisasi\b": "standardisasi",
}

TERM_PATTERNS = {
    "back-end/backend/back end": re.compile(r"\b(back[- ]?end|backend)\b", re.I),
    "front-end/frontend/front end": re.compile(r"\b(front[- ]?end|frontend)\b", re.I),
    "use case/use-case": re.compile(r"\buse[- ]case\b", re.I),
    "activity diagram": re.compile(r"\bactivity[- ]diagram\b", re.I),
    "QR Code/QR-Code/qrcode": re.compile(r"\bqr[- ]?code\b", re.I),
    "endpoint/end point": re.compile(r"\bend[- ]?point\b", re.I),
    "Rapid Application Development/RAD": re.compile(r"\bRapid Application Development\b|\bRAD\b", re.I),
}


def parse_page_text(text: str) -> dict[int, str]:
    pages: dict[int, list[str]] = defaultdict(list)
    current = None
    for line in text.splitlines():
        marker = re.match(r"^--- PAGE (\d+) ---$", line.strip())
        if marker:
            current = int(marker.group(1))
            continue
        if current is not None:
            pages[current].append(line)
    return {page: "\n".join(lines) for page, lines in pages.items()}


def snippet(text: str, start: int, end: int, width: int = 120) -> str:
    left = max(0, start - width // 2)
    right = min(len(text), end + width // 2)
    value = text[left:right].replace("\n", " ")
    value = re.sub(r"\s+", " ", value).strip()
    return value


def first_occurrences(page_text: dict[int, str], pattern: re.Pattern, max_hits: int = 10):
    hits = []
    for page, text in page_text.items():
        for match in pattern.finditer(text):
            hits.append({
                "page": page,
                "match": match.group(0),
                "context": snippet(text, match.start(), match.end()),
            })
            if len(hits) >= max_hits:
                return hits
    return hits


def audit_typos(page_text: dict[int, str]) -> list[dict]:
    findings = []
    for pattern, suggestion in COMMON_TYPOS.items():
        regex = re.compile(pattern, re.I)
        hits = first_occurrences(page_text, regex, max_hits=8)
        if hits:
            findings.append({
                "kind": "typo-candidate",
                "pattern": pattern,
                "suggestion": suggestion,
                "count_sampled": len(hits),
                "hits": hits,
            })

    duplicate = re.compile(r"\b([A-Za-zÀ-ÿ]{3,})[ \t]+\1\b", re.I)
    hits = first_occurrences(page_text, duplicate, max_hits=20)
    hits = [
        hit for hit in hits
        if not re.search(r"\b(DAFTAR|Tabel|Gambar|Lampiran|Framework|Basis Data|Asosiasi|Include|Extend|Decision|Dependency|Penelitian)\b", hit["context"], re.I)
    ]
    if hits:
        findings.append({
            "kind": "duplicate-word",
            "pattern": "kata ganda berurutan",
            "suggestion": "hapus salah satu kata",
            "count_sampled": len(hits),
            "hits": hits,
        })

    missing_space = re.compile(r"[a-zà-ÿ][.!?][A-ZÀ-Ý]", re.U)
    hits = first_occurrences(page_text, missing_space, max_hits=20)
    if hits:
        findings.append({
            "kind": "punctuation-spacing",
            "pattern": "tanda baca tanpa spasi setelahnya",
            "suggestion": "tambahkan spasi setelah tanda baca jika bukan singkatan/kode",
            "count_sampled": len(hits),
            "hits": hits,
        })
    return findings


def audit_terms(full_text: str) -> list[dict]:
    findings = []
    for label, regex in TERM_PATTERNS.items():
        variants = defaultdict(int)
        for match in regex.finditer(full_text):
            variants[match.group(0)] += 1
        if len(variants) > 1:
            findings.append({
                "kind": "term-consistency",
                "term": label,
                "variants": dict(sorted(variants.items(), key=lambda kv: (-kv[1], kv[0].lower()))),
            })
    return findings


def is_caption_or_title(line: str) -> str | None:
    clean = re.sub(r"\s+", " ", line).strip()
    if re.match(r"^Tabel\s+\d+(\.\d+)?[.\s:]", clean, re.I):
        return "tabel-caption"
    if re.match(r"^Gambar\s+\d+(\.\d+)?[.\s:]", clean, re.I):
        return "gambar-caption"
    if re.match(r"^\d+(\.\d+){1,4}\s+\S", clean):
        return "heading-numbered"
    return None


def audit_layout(pages_data: dict) -> list[dict]:
    pages = pages_data["pages"]
    findings = []
    for idx, page in enumerate(pages[:-1]):
        next_page = pages[idx + 1]
        last_lines = [line for line in page.get("lastLines", []) if line and line.strip()]
        first_next = [line for line in next_page.get("firstLines", []) if line and line.strip()]
        next_has_table = next_page.get("tableCount", 0) > 0
        next_has_image = next_page.get("inlineShapeCount", 0) > 0 or next_page.get("shapeCount", 0) > 0
        current_has_table = page.get("tableCount", 0) > 0
        current_has_image = page.get("inlineShapeCount", 0) > 0 or page.get("shapeCount", 0) > 0

        for offset, line in enumerate(last_lines[-4:], start=max(1, len(last_lines) - 3)):
            title_kind = is_caption_or_title(line)
            if not title_kind:
                continue
            expected_object = None
            if title_kind == "tabel-caption":
                expected_object = "table"
            elif title_kind == "gambar-caption":
                expected_object = "image"
            elif title_kind == "heading-numbered":
                expected_object = "table/image"

            split = False
            if title_kind == "tabel-caption" and next_has_table and not current_has_table:
                split = True
            elif title_kind == "gambar-caption" and next_has_image and not current_has_image:
                split = True
            elif title_kind == "heading-numbered" and (next_has_table or next_has_image):
                split = True

            if split:
                findings.append({
                    "kind": "caption-object-page-split",
                    "page": page["page"],
                    "next_page": next_page["page"],
                    "title_kind": title_kind,
                    "expected_object": expected_object,
                    "title": line,
                    "current_page_objects": {
                        "tables": page.get("tableCount", 0),
                        "images": page.get("inlineShapeCount", 0) + page.get("shapeCount", 0),
                    },
                    "next_page_objects": {
                        "tables": next_page.get("tableCount", 0),
                        "images": next_page.get("inlineShapeCount", 0) + next_page.get("shapeCount", 0),
                    },
                    "next_page_first_lines": first_next[:5],
                })

    return findings


def main() -> None:
    pages_data = json.loads(PAGES_JSON.read_text(encoding="utf-8-sig"))
    page_text = parse_page_text(PAGES_TEXT.read_text(encoding="utf-8-sig"))
    full_text = FULL_TEXT.read_text(encoding="utf-8")

    typo_findings = audit_typos(page_text)
    term_findings = audit_terms(full_text)
    layout_findings = audit_layout(pages_data)

    report = {
        "source": pages_data["source"],
        "pageCount": pages_data["pageCount"],
        "paragraphCount_word": pages_data["paragraphCount"],
        "tableCount": pages_data["tableCount"],
        "inlineShapeCount": pages_data["inlineShapeCount"],
        "shapeCount": pages_data["shapeCount"],
        "layout_findings": layout_findings,
        "typo_findings": typo_findings,
        "term_consistency_findings": term_findings,
    }
    REPORT_JSON.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    lines = []
    lines.append(f"Source: {report['source']}")
    lines.append(f"Pages: {report['pageCount']} | Tables: {report['tableCount']} | Images: {report['inlineShapeCount'] + report['shapeCount']}")
    lines.append("")
    lines.append("LAYOUT FINDINGS")
    if not layout_findings:
        lines.append("- Tidak ditemukan kandidat caption/judul yang terpisah dari objek pada halaman berikutnya berdasarkan audit per halaman.")
    else:
        for item in layout_findings:
            lines.append(f"- Page {item['page']} -> {item['next_page']}: {item['title_kind']} | {item['title']}")
            lines.append(f"  Next first: {' / '.join(item['next_page_first_lines'])}")
    lines.append("")
    lines.append("TYPO FINDINGS")
    if not typo_findings:
        lines.append("- Tidak ada kandidat typo dari pola umum yang dicek.")
    else:
        for item in typo_findings:
            lines.append(f"- {item['kind']}: {item['pattern']} -> {item['suggestion']}")
            for hit in item["hits"][:5]:
                lines.append(f"  p.{hit['page']}: {hit['context']}")
    lines.append("")
    lines.append("TERM CONSISTENCY FINDINGS")
    if not term_findings:
        lines.append("- Tidak ada inkonsistensi istilah dari pola yang dicek.")
    else:
        for item in term_findings:
            variants = ", ".join(f"{k}={v}" for k, v in item["variants"].items())
            lines.append(f"- {item['term']}: {variants}")
    REPORT_TXT.write_text("\n".join(lines), encoding="utf-8")
    print(json.dumps({
        "report_json": str(REPORT_JSON),
        "report_txt": str(REPORT_TXT),
        "layout_findings": len(layout_findings),
        "typo_groups": len(typo_findings),
        "term_groups": len(term_findings),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
