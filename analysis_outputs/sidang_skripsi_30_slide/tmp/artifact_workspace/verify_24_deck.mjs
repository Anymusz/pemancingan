import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const ROOT = "D:/Semester/Semester7/Skripsi/Projek-Skripsi";
const FINAL_PPTX = path.join(ROOT, "outputs", "Sidang_Skripsi_Raka_Bagaskara_Putra.pptx");
const RENDER_DIR = path.join(ROOT, "outputs", "qa_sidang_skripsi_raka_24", "render_latest");
const REPORT_PATH = path.join(ROOT, "outputs", "qa_sidang_skripsi_raka_24", "verification-report.json");
const TEXT_PATH = path.join(ROOT, "outputs", "qa_sidang_skripsi_raka_24", "slide-text.txt");
const MONTAGE_PATH = path.join(ROOT, "outputs", "qa_sidang_skripsi_raka_24", "montage.webp");

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
  return walkElements(layout)
    .filter((element) => typeof element.text === "string" && element.text.trim())
    .map((element) => element.text.trim());
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
      issues.push({ slide: slideNo, kind: element.kind, bbox: element.bbox, text: element.textPreview || element.text || "" });
    }
  }
  return issues;
}

await fs.mkdir(RENDER_DIR, { recursive: true });

const presentation = await PresentationFile.importPptx(await FileBlob.load(FINAL_PPTX));
const report = {
  pptx: FINAL_PPTX,
  slideCount: presentation.slides.items.length,
  expectedSlideCount: 24,
  renderedPngCount: 0,
  outOfBounds: [],
  activityDiagramMentions: [],
  slide11Image: null,
  slideTitles: [],
};

const textLines = [];
for (const [index, slide] of presentation.slides.items.entries()) {
  const slideNo = index + 1;
  const stem = `slide-${String(slideNo).padStart(2, "0")}`;
  await writeBlob(path.join(RENDER_DIR, `${stem}.png`), await presentation.export({ slide, format: "png", scale: 1 }));

  const layoutText = await (await slide.export({ format: "layout" })).text();
  await fs.writeFile(path.join(RENDER_DIR, `${stem}.layout.json`), layoutText, "utf8");
  const layout = JSON.parse(layoutText);
  const texts = textFromLayout(layout);
  const title = texts.find((text) => text.length > 4 && !/^\d\d$/.test(text)) || "";
  report.slideTitles.push({ slide: slideNo, title });
  report.outOfBounds.push(...auditBounds(layout, slideNo));
  for (const text of texts) {
    if (/Activity Diagram|Gambar 22/i.test(text)) {
      report.activityDiagramMentions.push({ slide: slideNo, text });
    }
  }
  textLines.push(`--- Slide ${slideNo}: ${title}`);
  textLines.push(...texts);

  if (slideNo === 11) {
    const image = (layout.elements || []).find((element) => element.kind === "image");
    report.slide11Image = image ? {
      bbox: image.bbox,
      contentType: image.contentType,
      byteLength: image.asset?.byteLength || image.fillImage?.byteLength || null,
    } : null;
  }
}

report.renderedPngCount = (await fs.readdir(RENDER_DIR)).filter((name) => name.endsWith(".png")).length;
const failures = [];
if (report.slideCount !== report.expectedSlideCount) failures.push("slide-count");
if (report.renderedPngCount !== report.expectedSlideCount) failures.push("rendered-png-count");
if (report.outOfBounds.length) failures.push("out-of-bounds");
if (report.activityDiagramMentions.length) failures.push("activity-diagram-mentions");
if (!report.slide11Image) failures.push("missing-slide-11-image");
report.failures = failures;
await writeBlob(MONTAGE_PATH, await presentation.export({ format: "webp", montage: true, scale: 1 }));
await fs.writeFile(TEXT_PATH, textLines.join("\n"), "utf8");
await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2), "utf8");

console.log(JSON.stringify(report, null, 2));
process.exit(failures.length ? 1 : 0);
