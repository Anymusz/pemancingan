import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const __filename = fileURLToPath(import.meta.url);
const WORKSPACE = path.dirname(__filename);
const ROOT = path.resolve(WORKSPACE, "..");
const OUTPUT_DIR = path.resolve(ROOT, "..");
const FINAL_PPTX = path.join(
  OUTPUT_DIR,
  "Sidang_Skripsi_Raka_Bagaskara_Putra_30_Slide.pptx",
);
const RENDER_DIR = path.join(ROOT, "final_render");
const QA_DIR = path.join(ROOT, "qa");

async function writeBlob(filePath, blob) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, Buffer.from(await blob.arrayBuffer()));
}

function walkElements(layout) {
  const result = [];
  for (const element of layout.elements || []) result.push(element);
  for (const layer of layout.inheritedLayers || []) {
    for (const element of layer.elements || []) result.push(element);
  }
  return result;
}

function textFromLayout(layout) {
  const parts = [];
  for (const element of walkElements(layout)) {
    if (typeof element.text === "string" && element.text.trim()) {
      parts.push(element.text.trim());
    }
  }
  return parts;
}

function auditBounds(layout, slideNo) {
  const issues = [];
  const frame = layout.slide?.frame || { left: 0, top: 0, width: 1280, height: 720 };
  const right = frame.left + frame.width;
  const bottom = frame.top + frame.height;
  for (const element of walkElements(layout)) {
    if (!Array.isArray(element.bbox) || element.bbox.length !== 4) continue;
    const [left, top, bboxRight, bboxBottom] = element.bbox;
    if (left < frame.left - 1 || top < frame.top - 1 || bboxRight > right + 1 || bboxBottom > bottom + 1) {
      issues.push({
        slide: slideNo,
        kind: element.kind,
        name: element.name || element.id || element.aid,
        bbox: element.bbox,
      });
    }
  }
  return issues;
}

async function main() {
  await fs.mkdir(RENDER_DIR, { recursive: true });
  await fs.mkdir(QA_DIR, { recursive: true });
  const presentation = await PresentationFile.importPptx(await FileBlob.load(FINAL_PPTX));
  const report = {
    pptx: FINAL_PPTX,
    slideCount: presentation.slides.items.length,
    expectedSlideCount: 30,
    renderedPngCount: 0,
    outOfBounds: [],
    slideTitles: [],
  };
  const textLines = [];
  for (const [index, slide] of presentation.slides.items.entries()) {
    const slideNo = index + 1;
    const stem = `slide-${String(slideNo).padStart(2, "0")}`;
    await writeBlob(path.join(RENDER_DIR, `${stem}.png`), await presentation.export({ slide, format: "png", scale: 1 }));
    const layoutBlob = await slide.export({ format: "layout" });
    const layoutText = await layoutBlob.text();
    await fs.writeFile(path.join(RENDER_DIR, `${stem}.layout.json`), layoutText, "utf8");
    const layout = JSON.parse(layoutText);
    const texts = textFromLayout(layout);
    const title = texts.find((text) => text.length > 4 && !/^\d\d$/.test(text)) || "";
    report.slideTitles.push({ slide: slideNo, title });
    textLines.push(`--- Slide ${slideNo}: ${title}`);
    for (const text of texts) textLines.push(text);
    report.outOfBounds.push(...auditBounds(layout, slideNo));
  }
  report.renderedPngCount = (await fs.readdir(RENDER_DIR)).filter((name) => name.endsWith(".png")).length;
  await writeBlob(
    path.join(QA_DIR, "final-deck-montage.webp"),
    await presentation.export({ format: "webp", montage: true, scale: 1 }),
  );
  await fs.writeFile(path.join(QA_DIR, "final-slide-text.txt"), textLines.join("\n"), "utf8");
  await fs.writeFile(path.join(QA_DIR, "verification-report.json"), JSON.stringify(report, null, 2), "utf8");
  console.log(JSON.stringify(report, null, 2));
  if (report.slideCount !== report.expectedSlideCount || report.renderedPngCount !== 30 || report.outOfBounds.length) {
    process.exitCode = 1;
  } else {
    process.exit(0);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});



