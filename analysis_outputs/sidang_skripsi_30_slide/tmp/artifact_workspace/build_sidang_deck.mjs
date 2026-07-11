import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const __filename = fileURLToPath(import.meta.url);
const WORKSPACE = path.dirname(__filename);
const ROOT = path.resolve(WORKSPACE, "..");
const SOURCE_DIR = path.join(ROOT, "source_extract");
const OUTPUT_DIR = path.resolve(ROOT, "..");
const FINAL_PPTX = path.join(
  OUTPUT_DIR,
  "Sidang_Skripsi_Raka_Bagaskara_Putra_30_Slide_Revisi_Class_Diagram.pptx",
);
const PREVIEW_DIR = path.join(ROOT, "preview");
const QA_DIR = path.join(ROOT, "qa");

const W = 1280;
const H = 720;
const WHITE = "#FFFFFF";
const BLACK = "#111111";
const MUTED = "#5F6368";
const LIGHT = "#F3F4F6";
const MID = "#E5E7EB";
const ORANGE = "#F47B20";
const YELLOW = "#F6B21A";
const DARK = "#1F2937";

async function writeBlob(filePath, blob) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, Buffer.from(await blob.arrayBuffer()));
}

async function readImageBlob(imagePath) {
  const bytes = await fs.readFile(imagePath);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return "image/png";
}

function addText(slide, text, x, y, width, height, style = {}) {
  const shape = slide.shapes.add({
    geometry: "textbox",
    position: { left: x, top: y, width, height },
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  shape.text = text;
  shape.text.style = {
    fontSize: style.fontSize ?? 20,
    color: style.color ?? BLACK,
    bold: style.bold ?? false,
    alignment: style.alignment ?? "left",
  };
  return shape;
}

function addRect(slide, x, y, width, height, fill, lineFill = "none", lineWidth = 0) {
  return slide.shapes.add({
    geometry: "rect",
    position: { left: x, top: y, width, height },
    fill,
    line: { style: "solid", fill: lineFill, width: lineWidth },
  });
}

function addChrome(slide, slideNo, section = "Sidang Skripsi") {
  slide.background.fill = WHITE;
  addRect(slide, 0, 0, W, 10, YELLOW);
  addRect(slide, 0, 10, 200, 8, ORANGE);
  addText(slide, section.toUpperCase(), 72, 30, 420, 24, {
    fontSize: 12,
    color: MUTED,
    bold: true,
  });
  addText(slide, String(slideNo).padStart(2, "0"), 1160, 650, 48, 24, {
    fontSize: 14,
    color: MUTED,
    bold: true,
    alignment: "right",
  });
  addRect(slide, 72, 682, 1136, 1, MID);
}

function addTitle(slide, title, subtitle) {
  addText(slide, title, 72, 58, 900, 80, {
    fontSize: 35,
    color: BLACK,
    bold: true,
  });
  if (subtitle) {
    addText(slide, subtitle, 74, 132, 760, 34, {
      fontSize: 18,
      color: MUTED,
    });
  }
  addRect(slide, 72, 156, 120, 5, ORANGE);
}

function addBulletList(slide, items, x, y, width, gap = 44, fontSize = 20) {
  items.forEach((item, index) => {
    const top = y + index * gap;
    addRect(slide, x, top + 8, 12, 12, index % 2 === 0 ? ORANGE : YELLOW);
    addText(slide, item, x + 26, top, width - 26, gap - 4, {
      fontSize,
      color: BLACK,
    });
  });
}

function addMetric(slide, label, value, x, y, width, accent = ORANGE, note = "") {
  addRect(slide, x, y, width, 118, WHITE, MID, 1);
  addRect(slide, x, y, 8, 118, accent);
  addText(slide, value, x + 26, y + 16, width - 40, 48, {
    fontSize: 36,
    color: BLACK,
    bold: true,
  });
  addText(slide, label, x + 28, y + 68, width - 40, 26, {
    fontSize: 16,
    color: MUTED,
    bold: true,
  });
  if (note) {
    addText(slide, note, x + 28, y + 94, width - 40, 18, {
      fontSize: 12,
      color: MUTED,
    });
  }
}

function addTag(slide, text, x, y, width, fill = LIGHT) {
  addRect(slide, x, y, width, 34, fill, MID, 1);
  addText(slide, text, x + 12, y + 7, width - 24, 20, {
    fontSize: 13,
    color: BLACK,
    bold: true,
    alignment: "center",
  });
}

async function addImage(slide, imagePath, x, y, width, height, alt, fit = "contain") {
  addRect(slide, x - 1, y - 1, width + 2, height + 2, WHITE, MID, 1);
  slide.images.add({
    blob: await readImageBlob(imagePath),
    contentType: contentTypeFor(imagePath),
    alt,
    fit,
    position: { left: x, top: y, width, height },
  });
}

async function addLabeledImage(
  slide,
  imagePath,
  label,
  x,
  y,
  width,
  height,
  fit = "contain",
) {
  await addImage(slide, imagePath, x, y, width, height, label, fit);
  addText(slide, label, x, y + height + 8, width, 22, {
    fontSize: 12,
    color: MUTED,
    bold: true,
    alignment: "center",
  });
}

function addProcess(slide, steps, x, y, width, accent = ORANGE) {
  const gap = 18;
  const stepW = (width - gap * (steps.length - 1)) / steps.length;
  steps.forEach((step, i) => {
    const left = x + i * (stepW + gap);
    addRect(slide, left, y, stepW, 78, WHITE, MID, 1);
    addRect(slide, left, y, stepW, 7, i % 2 ? YELLOW : accent);
    addText(slide, step, left + 12, y + 24, stepW - 24, 36, {
      fontSize: 16,
      color: BLACK,
      bold: true,
      alignment: "center",
    });
    if (i < steps.length - 1) {
      addText(slide, "->", left + stepW + 2, y + 27, gap + 14, 24, {
        fontSize: 18,
        color: MUTED,
        bold: true,
        alignment: "center",
      });
    }
  });
}

function addTwoColumn(slide, leftTitle, leftItems, rightTitle, rightItems) {
  addRect(slide, 72, 178, 540, 385, WHITE, MID, 1);
  addRect(slide, 668, 178, 540, 385, WHITE, MID, 1);
  addRect(slide, 72, 178, 540, 8, ORANGE);
  addRect(slide, 668, 178, 540, 8, YELLOW);
  addText(slide, leftTitle, 100, 206, 470, 34, { fontSize: 24, bold: true });
  addText(slide, rightTitle, 696, 206, 470, 34, { fontSize: 24, bold: true });
  addBulletList(slide, leftItems, 100, 262, 470, 48, 19);
  addBulletList(slide, rightItems, 696, 262, 470, 48, 19);
}

function addSource(slide, text) {
  addText(slide, text, 72, 650, 850, 20, {
    fontSize: 11,
    color: MUTED,
  });
}

async function loadFigures() {
  const raw = JSON.parse(await fs.readFile(path.join(SOURCE_DIR, "figures.json"), "utf8"));
  const map = new Map();
  for (const fig of raw) {
    if (fig.number && (fig.captioned_path || fig.path)) {
      map.set(String(fig.number), fig.captioned_path || fig.path);
    }
  }
  return map;
}

async function main() {
  await fs.mkdir(PREVIEW_DIR, { recursive: true });
  await fs.mkdir(QA_DIR, { recursive: true });
  const figures = await loadFigures();
  const logo = path.join(SOURCE_DIR, "assets", "image1.png");
  const spacedClassDiagram = path.resolve(
    ROOT,
    "..",
    "..",
    "class_diagram_spacing_revisi",
    "class_diagram_spaced_slide.png",
  );

  const deck = Presentation.create({ slideSize: { width: W, height: H } });

  {
    const slide = deck.slides.add();
    slide.background.fill = WHITE;
    addRect(slide, 0, 0, W, 12, YELLOW);
    addRect(slide, 0, 12, 260, 9, ORANGE);
    if (await fs.stat(logo).then(() => true).catch(() => false)) {
      await addImage(slide, logo, 78, 70, 104, 104, "Logo Universitas Jambi", "contain");
    }
    addText(
      slide,
      "Perancangan dan Implementasi Back-End Sistem Informasi untuk Mendukung Digitalisasi Bisnis Pemancingan S Menggunakan Metodologi Rapid Application Development (RAD)",
      78,
      160,
      1060,
      305,
      { fontSize: 50, bold: true, color: BLACK },
    );
    addRect(slide, 80, 486, 170, 6, ORANGE);
    addText(slide, "Raka Bagaskara Putra", 80, 516, 520, 32, {
      fontSize: 24,
      bold: true,
    });
    addText(slide, "F1E122183", 80, 552, 260, 26, { fontSize: 18, color: MUTED });
    addText(
      slide,
      "Program Studi Sistem Informasi\nJurusan Teknik Elektro dan Informatika\nFakultas Sains dan Teknologi\nUniversitas Jambi, 2026",
      80,
      586,
      560,
      96,
      { fontSize: 17, color: DARK },
    );
    addText(slide, "Sidang Skripsi", 1010, 620, 170, 26, {
      fontSize: 18,
      bold: true,
      color: MUTED,
      alignment: "right",
    });
  }

  {
    const slide = deck.slides.add();
    addChrome(slide, 2, "Konteks Masalah");
    addTitle(slide, "Operasional masih bertumpu pada catatan manual");
    addBulletList(
      slide,
      [
        "Transaksi dicatat di buku tulis tanpa format standar.",
        "Data diinput ulang ke aplikasi pihak ketiga oleh pemilik.",
        "Verifikasi pelanggan masih bergantung pada hafalan pegawai.",
        "Data transaksi, stok, rental, dan laporan belum berada di satu sistem.",
      ],
      86,
      210,
      520,
      56,
      22,
    );
    addProcess(slide, ["Buku tulis", "Input ulang", "Rekap terlambat"], 680, 246, 470);
    addMetric(slide, "Jeda rekap transaksi", "1-3 hari", 700, 390, 200, ORANGE);
    addMetric(slide, "Sumber data operasional", "Terpisah", 930, 390, 210, YELLOW);
    addSource(slide, "Sumber: Latar Belakang dan Ringkasan skripsi.");
  }

  {
    const slide = deck.slides.add();
    addChrome(slide, 3, "Urgensi");
    addTitle(slide, "Masalah manual menghambat kontrol operasional");
    addTwoColumn(
      slide,
      "Kondisi Lapangan",
      [
        "Pencatatan ganda antara catatan lapangan dan aplikasi.",
        "Pegawai menangani transaksi, timbang ikan, pesanan, dan rental sekaligus.",
        "Data stok dan laporan berada di proses yang terpisah.",
      ],
      "Risiko Operasional",
      [
        "Duplikasi kerja dan potensi data berbeda.",
        "Kesalahan identifikasi member saat pelanggan bertambah.",
        "Monitoring pemilik lambat ketika tidak berada di lokasi.",
      ],
    );
  }

  {
    const slide = deck.slides.add();
    addChrome(slide, 4, "Arah Penelitian");
    addTitle(slide, "Penelitian menjawab kebutuhan back-end yang terintegrasi");
    addText(slide, "Rumusan masalah", 86, 200, 360, 32, {
      fontSize: 24,
      bold: true,
    });
    addBulletList(
      slide,
      [
        "Bagaimana analisis kebutuhan back-end mendukung operasional Pemancingan S?",
        "Bagaimana rancangan dan implementasi back-end menggunakan RAD?",
      ],
      86,
      250,
      500,
      64,
      20,
    );
    addText(slide, "Tujuan penelitian", 700, 200, 360, 32, {
      fontSize: 24,
      bold: true,
    });
    addBulletList(
      slide,
      [
        "Menganalisis kebutuhan sistem sesuai proses operasional.",
        "Merancang dan mengimplementasikan back-end berbasis web yang terintegrasi.",
      ],
      700,
      250,
      470,
      64,
      20,
    );
    addProcess(slide, ["Analisis kebutuhan", "Rancangan back-end", "Implementasi API"], 230, 500, 820, YELLOW);
  }

  {
    const slide = deck.slides.add();
    addChrome(slide, 5, "Ruang Lingkup");
    addTitle(slide, "Batasan menjaga fokus pada layanan back-end");
    addBulletList(
      slide,
      [
        "Fokus pada analisis kebutuhan, perancangan, dan implementasi back-end.",
        "Metode pengembangan: RAD dengan model System Prototyping.",
        "Fitur inti: transaksi, stok ikan, penyewaan alat, dan laporan.",
        "Fitur pendukung: autentikasi, role, member, voucher, notifikasi, konfigurasi, API.",
        "Front-end dibahas sebagai prototype integrasi dari penelitian sebelumnya.",
      ],
      130,
      210,
      980,
      60,
      22,
    );
  }

  {
    const slide = deck.slides.add();
    addChrome(slide, 6, "Metodologi");
    addTitle(slide, "RAD dipakai untuk mengembangkan prototype secara iteratif");
    await addLabeledImage(
      slide,
      figures.get("2"),
      "Gambar 2. Tahapan System Prototyping dalam RAD",
      84,
      190,
      510,
      210,
    );
    await addLabeledImage(
      slide,
      figures.get("4"),
      "Gambar 4. Kerangka kerja penelitian",
      742,
      175,
      230,
      410,
    );
    addBulletList(
      slide,
      [
        "Planning mengidentifikasi masalah dan ruang lingkup.",
        "Analysis memetakan kebutuhan, aktor, data, serta proses bisnis.",
        "Design menerjemahkan kebutuhan ke UML, database, dan API.",
        "Implementation membangun Laravel, MySQL, integrasi, dan evaluasi.",
      ],
      84,
      455,
      560,
      42,
      18,
    );
  }

  {
    const slide = deck.slides.add();
    addChrome(slide, 7, "Pengumpulan Data");
    addTitle(slide, "Data lapangan dikumpulkan dari proses nyata Pemancingan S");
    addMetric(slide, "Lokasi", "The Hok", 90, 210, 230, ORANGE, "Kec. Jambi Selatan");
    addMetric(slide, "Periode", "Nov 2025-Mar 2026", 360, 210, 290, YELLOW);
    addText(slide, "Teknik pengumpulan data", 90, 382, 430, 34, {
      fontSize: 26,
      bold: true,
    });
    addBulletList(
      slide,
      [
        "Studi literatur untuk teori sistem informasi, RAD, Laravel, MySQL, dan evaluasi.",
        "Observasi aktivitas transaksi, stok, penyewaan, dan laporan.",
        "Wawancara pemilik dan pegawai untuk menggali masalah dan kebutuhan.",
        "Wawancara terbatas pelanggan untuk memahami alur layanan.",
      ],
      90,
      438,
      980,
      45,
      19,
    );
  }

  {
    const slide = deck.slides.add();
    addChrome(slide, 8, "Planning");
    addTitle(slide, "Planning menetapkan masalah, ruang lingkup, dan kebutuhan awal");
    addProcess(slide, ["Observasi", "Wawancara", "Identifikasi masalah", "Rencana kerja"], 105, 210, 980);
    addBulletList(
      slide,
      [
        "Masalah utama: transaksi manual, stok belum terhubung, laporan kurang efektif.",
        "Ruang lingkup ditetapkan pada back-end dan integrasi dengan prototype UI.",
        "Aktor awal: Owner, Employee, Member.",
        "Output tahap: kebutuhan awal, proses utama, dan acuan pengembangan berikutnya.",
      ],
      125,
      360,
      940,
      54,
      21,
    );
    addSource(slide, "Sumber: Tahap Perencanaan (Planning), BAB IV.");
  }

  {
    const slide = deck.slides.add();
    addChrome(slide, 9, "Analysis");
    addTitle(slide, "Analysis mengubah temuan lapangan menjadi kebutuhan sistem");
    addMetric(slide, "Kebutuhan fungsional", "12", 90, 200, 250, ORANGE, "Tabel 13");
    addMetric(slide, "Kebutuhan non-fungsional", "6", 372, 200, 270, YELLOW, "Tabel 14");
    addMetric(slide, "Kebutuhan data", "12", 674, 200, 230, ORANGE, "Tabel 15");
    addMetric(slide, "Aktor sistem", "3", 936, 200, 210, YELLOW, "Tabel 16");
    addBulletList(
      slide,
      [
        "Fungsi inti mencakup autentikasi, member, kedatangan, pesanan, checkout, stok, voucher, laporan, dan API.",
        "Kualitas sistem menekankan autentikasi, pembatasan role, validasi, integritas data, dan integrasi API.",
        "Data utama meliputi pengguna, member, ikan, stok, menu, rental, transaksi, voucher, notifikasi, dan konfigurasi.",
      ],
      110,
      395,
      980,
      55,
      19,
    );
  }

  {
    const slide = deck.slides.add();
    addChrome(slide, 10, "Analysis");
    addTitle(slide, "Sistem usulan menyatukan alur yang sebelumnya terpisah");
    addTwoColumn(
      slide,
      "Sistem Berjalan",
      [
        "Transaksi dicatat di buku tulis.",
        "Pemilik melakukan input ulang.",
        "Member divalidasi dari ingatan pegawai.",
        "Stok dan laporan tidak otomatis terhubung.",
      ],
      "Sistem Usulan",
      [
        "Data masuk melalui layanan back-end.",
        "Role menentukan hak akses setiap aktor.",
        "Member, transaksi, stok, voucher, dan laporan memakai basis data yang sama.",
        "Dashboard dan laporan mengambil data operasional terkini.",
      ],
    );
  }

  {
    const slide = deck.slides.add();
    addChrome(slide, 11, "Design");
    addTitle(slide, "Use case memusatkan tiga aktor pada proses operasional inti");
    await addLabeledImage(
      slide,
      figures.get("5"),
      "Gambar 5. Use Case Diagram Umum Sistem Informasi Pemancingan S",
      265,
      165,
      750,
      455,
    );
    addSource(slide, "Aktor: Pemilik, Pegawai, Member.");
  }

  {
    const slide = deck.slides.add();
    addChrome(slide, 12, "Design");
    addTitle(slide, "Class diagram menggambarkan relasi data dan logika domain");
    await addLabeledImage(
      slide,
      spacedClassDiagram,
      "Gambar 39. Class Diagram Sistem Informasi Pemancingan S - Revisi Layout",
      90,
      165,
      1100,
      455,
    );
  }

  {
    const slide = deck.slides.add();
    addChrome(slide, 13, "Design Database");
    addTitle(slide, "Rancangan database menata entitas utama operasional");
    addMetric(slide, "Entitas rancangan", "17", 88, 190, 230, ORANGE, "Tabel 48");
    addMetric(slide, "Kelompok data", "5", 350, 190, 220, YELLOW, "Pengguna, transaksi, stok, layanan, konfigurasi");
    addText(slide, "Entitas kunci", 90, 360, 260, 30, { fontSize: 24, bold: true });
    addBulletList(
      slide,
      [
        "User, Member, Member Tier",
        "Arrival, Pending Order, Transaksi, Transaction Item",
        "Tipe Ikan, Stok Ikan, Riwayat Restok",
        "Menu, Rental Item, Voucher, Notifikasi, Event",
        "Konfigurasi Guest dan QRIS",
      ],
      90,
      410,
      520,
      40,
      18,
    );
    addProcess(
      slide,
      ["Member", "Kedatangan", "Pesanan", "Transaksi", "Laporan"],
      665,
      325,
      490,
      ORANGE,
    );
  }

  {
    const slide = deck.slides.add();
    addChrome(slide, 14, "Design API");
    addTitle(slide, "Endpoint API dirancang sebagai jembatan data antarmuka dan back-end");
    addMetric(slide, "Endpoint rancangan utama", "10", 86, 190, 280, ORANGE, "Tabel 67");
    addBulletList(
      slide,
      [
        "POST /api/login untuk autentikasi pengguna.",
        "POST /api/register untuk registrasi member.",
        "GET /api/member/profile untuk profil dan dashboard member.",
        "POST /api/employee/check-in untuk mencatat kedatangan.",
        "POST /api/employee/checkout untuk menyelesaikan transaksi.",
        "GET /api/owner/reports/summary untuk laporan pemilik.",
      ],
      430,
      190,
      700,
      45,
      18,
    );
    addSource(slide, "Swagger hanya diposisikan sebagai dokumentasi endpoint, bukan fokus pembahasan utama.");
  }

  {
    const slide = deck.slides.add();
    addChrome(slide, 15, "Alur Proses");
    addTitle(slide, "Alur inti bergerak dari kedatangan hingga laporan");
    await addLabeledImage(
      slide,
      figures.get("22"),
      "Gambar 22. Activity Diagram Checkout Transaksi",
      745,
      160,
      330,
      430,
    );
    addProcess(
      slide,
      ["Check-in", "Pesanan", "Checkout", "Update stok", "Laporan"],
      90,
      245,
      580,
    );
    addBulletList(
      slide,
      [
        "Pegawai mencatat kedatangan member atau tamu.",
        "Pesanan menu/rental disimpan sebagai pending order.",
        "Checkout menghitung ikan, menu, rental, diskon, voucher, dan pembayaran.",
        "Transaksi memperbarui stok, poin member, riwayat, dan laporan.",
      ],
      100,
      390,
      555,
      44,
      18,
    );
  }

  {
    const slide = deck.slides.add();
    addChrome(slide, 16, "Arsitektur");
    addTitle(slide, "Back-end menjadi pusat integrasi antara UI dan data operasional");
    addProcess(slide, ["Prototype UI", "REST API", "Laravel Controller", "MySQL"], 175, 260, 930, ORANGE);
    addBulletList(
      slide,
      [
        "Frontend mengirim request untuk login, member, kedatangan, pesanan, checkout, dan laporan.",
        "REST API menjaga format komunikasi data dalam JSON.",
        "Laravel memproses autentikasi, validasi, role, dan logika bisnis.",
        "MySQL menyimpan data operasional sebagai sumber data terpusat.",
      ],
      160,
      420,
      940,
      44,
      19,
    );
  }

  {
    const slide = deck.slides.add();
    addChrome(slide, 17, "Teknologi");
    addTitle(slide, "Teknologi dipilih untuk back-end API yang terstruktur");
    await addLabeledImage(
      slide,
      figures.get("58"),
      "Gambar 58. Struktur Folder Controller Laravel",
      870,
      160,
      210,
      430,
    );
    addMetric(slide, "Framework", "Laravel", 90, 190, 250, ORANGE);
    addMetric(slide, "Database", "MySQL", 370, 190, 230, YELLOW);
    addMetric(slide, "Keamanan API", "Sanctum", 90, 350, 250, ORANGE);
    addMetric(slide, "Komunikasi", "REST API", 370, 350, 230, YELLOW);
    addText(
      slide,
      "Controller dipisahkan berdasarkan domain agar logika autentikasi, member, operasional pegawai, dan pemilik lebih mudah dipelihara.",
      90,
      530,
      620,
      60,
      { fontSize: 18, color: DARK },
    );
  }

  {
    const slide = deck.slides.add();
    addChrome(slide, 18, "Implementasi Database");
    addTitle(slide, "Implementasi MySQL menghasilkan 27 tabel operasional");
    await addLabeledImage(
      slide,
      figures.get("40"),
      "Gambar 40. Daftar tabel pada database pemancingan",
      665,
      160,
      430,
      430,
    );
    addMetric(slide, "Total tabel", "27", 90, 190, 230, ORANGE);
    addMetric(slide, "Tabel utama", "18", 350, 190, 230, YELLOW);
    addMetric(slide, "Tabel pendukung", "9", 90, 350, 230, ORANGE);
    addBulletList(
      slide,
      [
        "Tabel utama menyimpan domain pengguna, member, kedatangan, transaksi, stok, menu, voucher, event, dan konfigurasi.",
        "Tabel pendukung berasal dari Laravel untuk migration, token, session, cache, dan job queue.",
      ],
      350,
      355,
      250,
      72,
      16,
    );
  }

  {
    const slide = deck.slides.add();
    addChrome(slide, 19, "Autentikasi");
    addTitle(slide, "Sanctum dan middleware role menjaga akses tiap pengguna");
    await addLabeledImage(slide, figures.get("59"), "Gambar 59. Login dan token Sanctum", 62, 175, 260, 220, "contain");
    await addLabeledImage(slide, figures.get("64"), "Gambar 64. Middleware CheckRole", 350, 175, 260, 220, "contain");
    await addLabeledImage(slide, figures.get("65"), "Gambar 65. Alias middleware role", 638, 175, 260, 220, "contain");
    await addLabeledImage(slide, figures.get("66"), "Gambar 66. Route group API berdasarkan role", 926, 175, 260, 220, "contain");
    addBulletList(
      slide,
      [
        "Login membuat token akses untuk request API berikutnya.",
        "Middleware CheckRole membatasi akses berdasarkan Owner, Employee, dan Member.",
        "Route group mengelompokkan endpoint sesuai tanggung jawab aktor.",
      ],
      100,
      500,
      1010,
      38,
      18,
    );
  }

  {
    const slide = deck.slides.add();
    addChrome(slide, 20, "Logika Bisnis");
    addTitle(slide, "Controller menangani alur operasional, bukan sekadar CRUD");
    await addLabeledImage(slide, figures.get("60"), "Gambar 60. Check-in pelanggan", 70, 165, 255, 270, "cover");
    await addLabeledImage(slide, figures.get("61"), "Gambar 61. Validasi checkout", 350, 165, 255, 270, "cover");
    await addLabeledImage(slide, figures.get("62"), "Gambar 62. Perhitungan pembayaran", 630, 165, 255, 270, "cover");
    await addLabeledImage(slide, figures.get("63"), "Gambar 63. Update stok dan member", 910, 165, 255, 270, "cover");
    addBulletList(
      slide,
      [
        "ArrivalController mencatat pelanggan member/tamu dan status kedatangan.",
        "TransactionController memvalidasi checkout, menghitung pembayaran, memperbarui stok, serta poin member.",
      ],
      120,
      505,
      980,
      44,
      19,
    );
  }

  {
    const slide = deck.slides.add();
    addChrome(slide, 21, "Endpoint API");
    addTitle(slide, "Endpoint utama mengikuti alur kerja tiap role");
    addProcess(slide, ["Public", "Member", "Employee", "Owner"], 135, 195, 1010, YELLOW);
    addBulletList(
      slide,
      [
        "Public: leaderboard, event, informasi, dan menu spesial.",
        "Member: register, profile, dashboard, pesanan, riwayat transaksi.",
        "Employee: check-in, kedatangan hari ini, pending order, checkout, stok.",
        "Owner: laporan ringkas, member, menu, ikan, voucher, konfigurasi.",
      ],
      160,
      340,
      880,
      52,
      21,
    );
    addSource(slide, "Pembahasan Swagger diringkas pada fungsi dokumentasi endpoint.");
  }

  {
    const slide = deck.slides.add();
    addChrome(slide, 22, "Integrasi UI");
    addTitle(slide, "Prototype antarmuka membuktikan API dapat dipakai lintas role");
    await addLabeledImage(slide, figures.get("76"), "Gambar 76. Halaman utama", 68, 175, 180, 270, "cover");
    await addLabeledImage(slide, figures.get("78"), "Gambar 78. Dashboard member", 275, 175, 210, 150, "cover");
    await addLabeledImage(slide, figures.get("82"), "Gambar 82. Dashboard pegawai", 510, 175, 210, 150, "cover");
    await addLabeledImage(slide, figures.get("92"), "Gambar 92. Dashboard pemilik", 745, 175, 210, 150, "cover");
    await addLabeledImage(slide, figures.get("96"), "Gambar 96. Laporan keuangan", 980, 175, 180, 270, "cover");
    addBulletList(
      slide,
      [
        "Data publik, member, pegawai, dan pemilik mengambil sumber dari layanan back-end.",
        "Setiap tampilan menguji hubungan API dengan data operasional yang sama.",
        "Integrasi menunjukkan dampak pada informasi pelanggan, pesanan, transaksi, stok, dan laporan.",
      ],
      140,
      510,
      960,
      38,
      18,
    );
  }

  {
    const slide = deck.slides.add();
    addChrome(slide, 23, "Iterasi");
    addTitle(slide, "Masukan pengguna menghasilkan perbaikan operasional");
    await addLabeledImage(slide, figures.get("98"), "Gambar 98. Tambah pesanan", 72, 172, 210, 140, "cover");
    await addLabeledImage(slide, figures.get("99"), "Gambar 99. Pesanan masuk", 305, 172, 210, 140, "cover");
    await addLabeledImage(slide, figures.get("100"), "Gambar 100. Batal pending order", 538, 172, 210, 140, "cover");
    await addLabeledImage(slide, figures.get("101"), "Gambar 101. Menu spesial", 771, 172, 210, 140, "cover");
    await addLabeledImage(slide, figures.get("102"), "Gambar 102. Popup menu spesial", 1004, 172, 190, 140, "cover");
    addBulletList(
      slide,
      [
        "Role pegawai diperbaiki pada status pesanan dan pembayaran.",
        "Pending order dapat dibatalkan sebelum checkout.",
        "Nota transaksi disediakan setelah pembayaran berhasil.",
        "Menu spesial dari pemilik muncul kembali di halaman member dan publik.",
      ],
      135,
      420,
      960,
      42,
      19,
    );
  }

  {
    const slide = deck.slides.add();
    addChrome(slide, 24, "Dampak");
    addTitle(slide, "Implementasi menjawab pain point operasional");
    addTwoColumn(
      slide,
      "Sebelum Implementasi",
      [
        "Data dicatat dua kali dan tersebar.",
        "Member dikenali dari hafalan pegawai.",
        "Stok dan transaksi tidak otomatis saling mempengaruhi.",
        "Laporan menunggu rekap manual.",
      ],
      "Setelah Implementasi",
      [
        "Satu basis data menjadi sumber data bersama.",
        "Member dicari dan divalidasi oleh sistem.",
        "Checkout memperbarui stok, poin, tier, dan transaksi.",
        "Dashboard dan laporan memakai data operasional terkini.",
      ],
    );
  }

  {
    const slide = deck.slides.add();
    addChrome(slide, 25, "Demonstrasi");
    addTitle(slide, "Demo mengikuti alur Employee -> Member -> Employee -> Owner");
    await addLabeledImage(slide, figures.get("83"), "Employee: validasi member", 70, 174, 250, 150, "cover");
    await addLabeledImage(slide, figures.get("79"), "Member: membuat pesanan", 360, 174, 250, 150, "cover");
    await addLabeledImage(slide, figures.get("89"), "Employee: checkout", 650, 174, 250, 150, "cover");
    await addLabeledImage(slide, figures.get("92"), "Owner: monitoring", 940, 174, 250, 150, "cover");
    addProcess(slide, ["Check-in", "Order", "Checkout", "Report"], 155, 430, 900, ORANGE);
    addBulletList(
      slide,
      [
        "Alur demo menunjukkan data bergerak dari operasi harian menuju laporan pemilik.",
        "Setiap langkah menggunakan endpoint back-end yang terhubung dengan basis data.",
      ],
      160,
      560,
      900,
      38,
      18,
    );
  }

  {
    const slide = deck.slides.add();
    addChrome(slide, 26, "Pengujian");
    addTitle(slide, "Black Box Testing membuktikan fungsi utama valid");
    addMetric(slide, "Total test case", "105", 90, 195, 250, ORANGE, "Tabel 71");
    addMetric(slide, "Status valid", "105", 370, 195, 250, YELLOW, "100%");
    addMetric(slide, "Status tidak valid", "0", 650, 195, 250, ORANGE);
    addBulletList(
      slide,
      [
        "Login dan autentikasi: 10/10 valid.",
        "Halaman utama: 7/7 valid.",
        "Fitur Member: 16/16 valid.",
        "Fitur Employee: 42/42 valid.",
        "Fitur Owner: 30/30 valid.",
      ],
      130,
      390,
      900,
      40,
      19,
    );
  }

  {
    const slide = deck.slides.add();
    addChrome(slide, 27, "Evaluasi Usability");
    addTitle(slide, "SUS menilai penerimaan alur sistem terintegrasi");
    addMetric(slide, "Responden", "7", 90, 190, 220, ORANGE, "1 owner, 1 employee, 5 member");
    addMetric(slide, "Pertanyaan SUS", "10", 345, 190, 240, YELLOW);
    addMetric(slide, "Tanggal uji", "13 Juni 2026", 620, 190, 280, ORANGE);
    addBulletList(
      slide,
      [
        "Responden menjalankan skenario sesuai role sebelum mengisi kuesioner.",
        "Owner berfokus pada pemantauan operasional, data, dan informasi bisnis.",
        "Employee berfokus pada kedatangan, pesanan, dan pembayaran.",
        "Member berfokus pada akun, pemesanan, riwayat, dan leaderboard.",
      ],
      130,
      380,
      900,
      48,
      19,
    );
  }

  {
    const slide = deck.slides.add();
    addChrome(slide, 28, "Hasil SUS");
    addTitle(slide, "Skor SUS 89,6 menunjukkan sistem diterima sangat baik");
    await addLabeledImage(
      slide,
      figures.get("103"),
      "Gambar 103. Interpretasi Skor SUS Hasil Pengujian",
      90,
      190,
      660,
      220,
      "contain",
    );
    addMetric(slide, "Rata-rata SUS", "89,6", 815, 190, 260, ORANGE);
    addMetric(slide, "Adjective rating", "Excellent", 815, 335, 260, YELLOW);
    addMetric(slide, "Grade scale", "A", 815, 480, 260, ORANGE, "Acceptable");
    addBulletList(
      slide,
      [
        "Enam responden berada pada interpretasi Excellent.",
        "Satu responden berada pada interpretasi Good.",
      ],
      115,
      465,
      610,
      40,
      18,
    );
  }

  {
    const slide = deck.slides.add();
    addChrome(slide, 29, "Kesimpulan");
    addTitle(slide, "Pain point utama berhasil dijawab oleh back-end terintegrasi");
    addMetric(slide, "1", "Analisis kebutuhan", 98, 205, 300, ORANGE, "Masalah manual diterjemahkan menjadi kebutuhan sistem.");
    addMetric(slide, "2", "Design dan implementasi", 488, 205, 300, YELLOW, "Laravel, MySQL, Sanctum, REST API, role, validasi.");
    addMetric(slide, "3", "Pengujian dan evaluasi", 878, 205, 300, ORANGE, "105 test case valid dan SUS 89,6.");
    addBulletList(
      slide,
      [
        "Back-end mendukung pengelolaan data pengguna, kedatangan, pesanan, checkout, stok, voucher, notifikasi, konfigurasi, dan laporan.",
        "Integrasi API membuat prototype antarmuka memakai data operasional yang sama.",
        "Hasil pengujian menunjukkan fungsi valid dan alur sistem diterima pengguna.",
      ],
      135,
      430,
      980,
      44,
      19,
    );
  }

  {
    const slide = deck.slides.add();
    addChrome(slide, 30, "Saran");
    addTitle(slide, "Pengembangan berikutnya memperkuat adopsi dan kesiapan produksi");
    addTwoColumn(
      slide,
      "Untuk Pemancingan S",
      [
        "Terapkan sistem secara bertahap di operasional nyata.",
        "Lakukan demonstrasi dan pelatihan untuk pemilik, pegawai, dan member.",
        "Mulai dari alur login, kedatangan, pemesanan, checkout, stok, menu, dan laporan.",
      ],
      "Untuk Penelitian Selanjutnya",
      [
        "Integrasikan payment gateway atau QRIS dinamis.",
        "Uji performa, keamanan, deployment, monitoring, dan backup.",
        "Kembangkan aplikasi mobile, analitik bisnis, serta pengujian dengan periode lebih panjang.",
      ],
    );
  }

  for (const [index, slide] of deck.slides.items.entries()) {
    const stem = `slide-${String(index + 1).padStart(2, "0")}`;
    await writeBlob(path.join(PREVIEW_DIR, `${stem}.png`), await deck.export({ slide, format: "png", scale: 1 }));
    await fs.writeFile(
      path.join(PREVIEW_DIR, `${stem}.layout.json`),
      await (await slide.export({ format: "layout" })).text(),
      "utf8",
    );
  }
  await writeBlob(
    path.join(QA_DIR, "deck-montage.webp"),
    await deck.export({ format: "webp", montage: true, scale: 1 }),
  );
  const pptx = await PresentationFile.exportPptx(deck);
  await pptx.save(FINAL_PPTX);
  console.log(FINAL_PPTX);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});




