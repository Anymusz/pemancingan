import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const ROOT = "D:/Semester/Semester7/Skripsi/Projek-Skripsi";
const MAIN_PPTX = path.join(ROOT, "outputs", "Sidang_Skripsi_Raka_Bagaskara_Putra.pptx");
const COPY_PPTX = path.join(ROOT, "outputs", "Sidang_Skripsi_Raka_Bagaskara_Putra_24_Slide.pptx");
const FALLBACK_COPY_PPTX = path.join(
  ROOT,
  "outputs",
  "Sidang_Skripsi_Raka_Bagaskara_Putra_24_Slide_Revisi_Garis.pptx",
);
const DIAGRAM_PNG = path.join(
  ROOT,
  "analysis_outputs",
  "class_diagram_spacing_revisi",
  "class_diagram_spaced_slide.png",
);

async function readImageBlob(imagePath) {
  const bytes = await fs.readFile(imagePath);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

async function saveDeck(presentation, outputPath) {
  const exported = await PresentationFile.exportPptx(presentation);
  await exported.save(outputPath);
}

const presentation = await PresentationFile.importPptx(await FileBlob.load(MAIN_PPTX));
const slide = presentation.slides.items[10];
if (!slide) throw new Error("Slide 11 tidak ditemukan.");

const oldImage = slide.images.items[0];
if (!oldImage) throw new Error("Image utama pada slide 11 tidak ditemukan.");

const frame = oldImage.resolveFrame();
oldImage.delete();

slide.images.add({
  blob: await readImageBlob(DIAGRAM_PNG),
  contentType: "image/png",
  alt: "Class Diagram Sistem Informasi Pemancingan S - relasi diperjelas",
  fit: "contain",
  position: frame,
});

await saveDeck(presentation, MAIN_PPTX);
let copyOutput = COPY_PPTX;
try {
  await saveDeck(presentation, COPY_PPTX);
} catch (error) {
  if (error?.code !== "EBUSY") throw error;
  copyOutput = FALLBACK_COPY_PPTX;
  await saveDeck(presentation, FALLBACK_COPY_PPTX);
}

console.log(JSON.stringify({
  updated: [MAIN_PPTX, copyOutput],
  slide: 11,
  frame,
  diagram: DIAGRAM_PNG,
  slideCount: presentation.slides.items.length,
}, null, 2));
