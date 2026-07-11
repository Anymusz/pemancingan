import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const OUT_DIR = path.resolve("..");
const SVG_PATH = path.join(OUT_DIR, "class_diagram_spaced_manual.svg");
const PNG_PATH = path.join(OUT_DIR, "class_diagram_spaced_manual.png");
const SLIDE_PNG_PATH = path.join(OUT_DIR, "class_diagram_spaced_slide.png");

const W = 5200;
const H = 3000;
const teal = "#08AEC5";
const dark = "#111827";
const muted = "#4B5563";
const gray = "#E5E7EB";
const ctrlFill = "#F5FBFD";

function esc(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function line(x1, y1, x2, y2, attrs = "") {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${attrs}/>`;
}

function poly(points, attrs = "") {
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
  return `<path d="${d}" ${attrs}/>`;
}

function text(value, x, y, size = 22, weight = "400", color = dark, anchor = "start") {
  return `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}" font-family="Arial, sans-serif">${esc(value)}</text>`;
}

function rect(x, y, w, h, fill = "white", stroke = teal, sw = 2) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
}

function labelBox(value, x, y, anchor = "middle") {
  return text(value, x, y, 20, "700", dark, anchor);
}

function ensureBoxMetrics(cls) {
  const rowH = 29;
  const headerH = 42;
  cls.w = cls.w || 430;
  const attrH = Math.max(32, cls.attrs.length * rowH + 18);
  const methodH = Math.max(32, cls.methods.length * rowH + 18);
  cls.h = headerH + attrH + methodH;
  return { w: cls.w, h: cls.h, rowH, headerH, attrH, methodH };
}

function classBox(cls) {
  const { name, x, y, attrs = [], methods = [], fill = "white" } = cls;
  const { w, h, rowH, headerH, attrH } = ensureBoxMetrics(cls);
  let out = "";
  out += rect(x, y, w, h, fill, teal, 2);
  out += rect(x, y, w, headerH, fill, teal, 2);
  out += text(name, x + w / 2, y + 28, 24, "700", dark, "middle");
  out += line(x, y + headerH + attrH, x + w, y + headerH + attrH, `stroke="${teal}" stroke-width="2"`);
  attrs.forEach((attr, i) => {
    out += text(`+ ${attr}`, x + 18, y + headerH + 31 + i * rowH, 18, "400", dark);
  });
  methods.forEach((method, i) => {
    out += text(`+ ${method}()`, x + 18, y + headerH + attrH + 31 + i * rowH, 18, "400", dark);
  });
  return out;
}

function center(cls) {
  return [cls.x + cls.w / 2, cls.y + cls.h / 2];
}

function side(cls, where) {
  ensureBoxMetrics(cls);
  if (where === "left") return [cls.x, cls.y + cls.h / 2];
  if (where === "right") return [cls.x + cls.w, cls.y + cls.h / 2];
  if (where === "top") return [cls.x + cls.w / 2, cls.y];
  if (where === "bottom") return [cls.x + cls.w / 2, cls.y + cls.h];
  return center(cls);
}

function routeEdge(points, label, lx, ly, options = {}) {
  const stroke = options.stroke || dark;
  const dash = options.dash ? `stroke-dasharray="${options.dash}"` : "";
  const marker = options.arrow === false ? "" : `marker-end="url(#arrow)"`;
  const width = options.width || 4.2;
  return `${poly(points, `fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="square" ${dash} ${marker}`)}${label ? labelBox(label, lx, ly, options.anchor || "middle") : ""}`;
}

const classes = {
  User: { name: "User", x: 260, y: 920, attrs: ["id: bigint", "name: varchar", "phone: varchar", "email: varchar", "role: enum", "status: enum"], methods: ["member", "scopePendingMembers", "sendPasswordResetNotification"] },
  Member: { name: "Member", x: 840, y: 860, attrs: ["id: bigint", "user_id: bigint", "member_id: varchar", "tier_id: bigint", "total_points: int", "total_fish_weight: decimal", "qr_code_hash: varchar"], methods: ["user", "tier", "generateMemberId", "generateQRHash", "getCurrentTier"] },
  MemberTier: { name: "MemberTier", x: 840, y: 1370, attrs: ["id: bigint", "name: varchar", "min_points: int", "max_points: int", "discount_percentage: decimal"], methods: ["members"] },
  Notification: { name: "Notification", x: 260, y: 1440, attrs: ["id: bigint", "user_id: bigint", "type: varchar", "title: varchar", "body: text", "is_read: boolean"], methods: ["user"] },
  Voucher: { name: "Voucher", x: 840, y: 1940, attrs: ["id: bigint", "member_id: bigint", "amount: decimal", "source: enum", "rank: int", "period_year: smallint", "period_month: tinyint", "status: enum", "transaction_id: bigint"], methods: ["member", "transaction"] },

  Arrival: { name: "Arrival", x: 1570, y: 820, attrs: ["id: bigint", "member_id: bigint", "guest_name: varchar", "deposit_amount: decimal", "check_in_at: timestamp", "check_out_at: timestamp", "status: enum", "checked_in_by: bigint"], methods: ["member", "checkedInBy", "transaction", "isActive", "checkout"] },
  PendingOrder: { name: "PendingOrder", x: 2230, y: 780, attrs: ["id: bigint", "arrival_id: bigint", "item_type: enum", "item_id: bigint", "quantity: int", "subtotal: decimal", "payment_status: enum", "created_by: bigint", "transaction_id: bigint"], methods: ["arrival", "menu", "createdBy", "transaction"] },
  Transaction: { name: "Transaction", x: 2230, y: 1470, attrs: ["id: bigint", "transaction_code: varchar", "arrival_id: bigint", "total_amount: decimal", "discount_tier: decimal", "discount_voucher: decimal", "final_amount: decimal", "payment_method: enum", "processed_by: bigint", "transaction_date: timestamp"], methods: ["voucher", "arrival", "processedBy", "items"] },
  TransactionItem: { name: "TransactionItem", x: 2940, y: 1520, attrs: ["id: bigint", "transaction_id: bigint", "item_type: enum", "item_id: bigint", "quantity: decimal", "unit_price_snapshot: decimal", "subtotal: decimal"], methods: ["transaction"] },

  Menu: { name: "Menu", x: 2940, y: 760, attrs: ["id: bigint", "name: varchar", "price: decimal", "category: enum", "availability: enum", "is_special: boolean"], methods: ["getImageUrlAttribute", "scopeAvailable", "scopeCategory"] },
  FishType: { name: "FishType", x: 3620, y: 650, attrs: ["id: bigint", "name: varchar", "price_per_kg: decimal", "is_active: boolean", "deleted_at: timestamp"], methods: ["stock", "restockLogs"] },
  FishStock: { name: "FishStock", x: 4250, y: 650, attrs: ["id: bigint", "fish_type_id: bigint", "current_stock_kg: decimal", "alert_threshold_kg: decimal"], methods: ["fishType"] },
  RestockLog: { name: "RestockLog", x: 4250, y: 1120, attrs: ["id: bigint", "fish_type_id: bigint", "quantity_kg: decimal", "stock_before: decimal", "stock_after: decimal", "restocked_by: bigint"], methods: ["fishType", "restockedBy"] },
  Event: { name: "Event", x: 3620, y: 1600, attrs: ["id: bigint", "title: varchar", "description: text", "category: enum", "start_date: date", "end_date: date", "status: enum"], methods: ["getImageUrlAttribute", "scopeActive", "scopePublished"] },
  RentalItem: { name: "RentalItem", x: 4250, y: 1610, attrs: ["id: bigint", "name: varchar", "price_per_unit: decimal", "unit_label: varchar", "is_active: boolean"], methods: ["getImageUrlAttribute"] },
  GuestConfig: { name: "GuestConfig", x: 3620, y: 2240, attrs: ["id: bigint", "deposit_amount: decimal"], methods: ["current"] },
  QrisConfig: { name: "QrisConfig", x: 4130, y: 2240, attrs: ["id: bigint", "image: varchar"], methods: ["current", "getImageUrlAttribute"] },
  VoucherConfig: { name: "VoucherConfig", x: 4640, y: 2240, attrs: ["id: bigint", "rank: int", "amount: decimal"], methods: ["current"] },
};

const controllers = [
  { name: "AuthController", x: 260, y: 160, w: 360, methods: ["register", "login", "me", "logout"], target: "User" },
  { name: "MemberValidationController", x: 760, y: 160, w: 470, methods: ["getPendingMembers", "approveMember", "rejectMember"], target: "Member" },
  { name: "MemberController", x: 1260, y: 160, w: 390, methods: ["profile", "rewardsHistory", "vouchers"], target: "Member" },
  { name: "ArrivalController", x: 1570, y: 420, w: 390, methods: ["checkIn", "searchMember", "resolveQr"], target: "Arrival" },
  { name: "PendingOrderController", x: 2180, y: 420, w: 430, methods: ["store", "index", "updateStatus"], target: "PendingOrder" },
  { name: "TransactionController", x: 2180, y: 1120, w: 430, methods: ["checkout", "show", "printReceipt"], target: "Transaction" },
  { name: "OrderController", x: 2820, y: 420, w: 360, methods: ["store", "myOrders"], target: "PendingOrder" },
  { name: "MenuController", x: 2940, y: 160, w: 360, methods: ["index", "store", "updateAvailability"], target: "Menu" },
  { name: "FishTypeController", x: 3620, y: 160, w: 360, methods: ["index", "store", "update"], target: "FishType" },
  { name: "FishStockController", x: 4250, y: 160, w: 390, methods: ["index", "restock", "updateThreshold"], target: "FishStock" },
  { name: "EventController", x: 3620, y: 1250, w: 360, methods: ["index", "store", "update"], target: "Event" },
  { name: "SettingController", x: 4130, y: 2070, w: 380, methods: ["guestConfig", "qrisConfig"], target: "QrisConfig" },
];

function controllerBox(ctrl) {
  return classBox({ ...ctrl, attrs: [], fill: ctrlFill });
}

const edges = [];
function add(from, fromSide, to, toSide, points, label, lx, ly, opts = {}) {
  const start = side(classes[from], fromSide);
  const end = side(classes[to], toSide);
  edges.push(routeEdge([start, ...points, end], label, lx, ly, opts));
}

add("User", "right", "Member", "left", [], "1 -> 0..1 member()", 805, 1005, { anchor: "end", width: 5.2 });
add("Member", "bottom", "MemberTier", "top", [[1055, 1325]], "1 -> 0..* members()", 1090, 1340, { width: 5.2 });
add("Member", "right", "Arrival", "left", [], "0..1 -> 0..* arrivals", 1470, 1010, { anchor: "end", width: 5.2 });
add("User", "top", "Arrival", "top", [[475, 590], [1785, 590]], "1 -> 0..* checkedInBy()", 1720, 625, { width: 5.2 });
add("Arrival", "right", "PendingOrder", "left", [[2140, 1048], [2140, 1008]], "1 -> 0..* pendingOrders", 2180, 982, { anchor: "end", width: 5.2 });
add("User", "top", "PendingOrder", "top", [[475, 680], [2445, 680]], "1 -> 0..* createdBy()", 1270, 660, { width: 5.2 });
add("PendingOrder", "right", "Menu", "left", [[2795, 1008], [2795, 930]], "0..* menu()", 2880, 950, { anchor: "end", width: 5.2 });
add("PendingOrder", "bottom", "Transaction", "top", [], "0..* -> 0..1 transaction()", 2445, 1428, { width: 5.2 });
add("Arrival", "bottom", "Transaction", "left", [[1785, 1380], [2080, 1380], [2080, 1712]], "1 -> 0..1 transaction()", 2175, 1580, { anchor: "end", width: 5.2 });
add("User", "bottom", "Transaction", "bottom", [[475, 2600], [2445, 2600]], "1 -> 0..* processedBy()", 2475, 2025, { width: 5.2 });
add("Transaction", "right", "TransactionItem", "left", [[2805, 1712], [2805, 1675]], "1 -> 1..* items()", 2880, 1705, { anchor: "end", width: 5.2 });
add("Transaction", "left", "Voucher", "right", [[1500, 1712], [1500, 2138]], "0..1 voucher()", 1505, 1645, { width: 5.2 });
add("Member", "left", "Voucher", "left", [[760, 1073], [760, 2138]], "1 -> 0..* vouchers", 740, 1885, { anchor: "end", width: 5.2 });
add("User", "bottom", "Notification", "top", [], "1 -> 0..* notifications", 520, 1390, { anchor: "start", width: 5.2 });
add("FishType", "right", "FishStock", "left", [[4145, 790], [4145, 776]], "1 -> 1 stock()", 4190, 805, { anchor: "end", width: 5.2 });
add("FishType", "bottom", "RestockLog", "left", [[3835, 1040], [4080, 1040], [4080, 1275]], "1 -> 0..* restockLogs()", 4185, 1255, { anchor: "end", width: 5.2 });
add("User", "left", "RestockLog", "right", [[40, 1090], [40, 35], [4870, 35], [4870, 1275]], "1 -> 0..* restockedBy()", 4610, 24, { width: 5.2 });

const dashed = [];
for (const ctrl of controllers) {
  const cls = classes[ctrl.target];
  const start = [ctrl.x + ctrl.w / 2, ctrl.y + 42 + Math.max(32, ctrl.methods.length * 29 + 18)];
  const end = side(cls, "top");
  dashed.push(routeEdge([start, [start[0], end[1] - 48], [end[0], end[1] - 48], end], "", 0, 0, { stroke: "#4B5563", dash: "16 12", width: 3.4 }));
}

const groupRects = [
  rect(210, 820, 1160, 1480, "none", gray, 2) + text("Akun dan Member", 790, 850, 22, "700", muted, "middle"),
  rect(1530, 740, 1860, 1210, "none", gray, 2) + text("Operasional Transaksi", 2460, 770, 22, "700", muted, "middle"),
  rect(3580, 600, 1150, 1430, "none", gray, 2) + text("Inventaris dan Konten", 4155, 630, 22, "700", muted, "middle"),
  rect(3580, 2190, 1480, 310, "none", gray, 2) + text("Konfigurasi", 4320, 2220, 22, "700", muted, "middle"),
];

let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  <marker id="arrow" markerWidth="12" markerHeight="12" refX="10" refY="4" orient="auto" markerUnits="strokeWidth">
    <path d="M0,0 L0,8 L10,4 z" fill="${dark}" />
  </marker>
</defs>
<rect width="${W}" height="${H}" fill="white"/>
${text("Class Diagram Sistem Informasi Pemancingan S", 80, 80, 38, "700")}
${text("Versi revisi: posisi kotak dibuat longgar, jalur relasi diperjelas seperti referensi", 80, 120, 24, "400", muted)}
${groupRects.join("\n")}
${dashed.join("\n")}
${edges.join("\n")}
${Object.values(classes).map(classBox).join("\n")}
${controllers.map(controllerBox).join("\n")}
${rect(80, 2670, 780, 190, "white", gray, 2)}
${text("Legend", 110, 2720, 24, "700")}
${line(120, 2760, 300, 2760, `stroke="${dark}" stroke-width="4.8" marker-end="url(#arrow)"`)}
${text("Relasi model. Label ada di ujung konektor.", 330, 2768, 20)}
${line(120, 2810, 300, 2810, `stroke="#4B5563" stroke-width="3.4" stroke-dasharray="16 12" marker-end="url(#arrow)"`)}
${text("Controller memakai model.", 330, 2818, 20)}
</svg>`;

await fs.mkdir(OUT_DIR, { recursive: true });
await fs.writeFile(SVG_PATH, svg, "utf8");
await sharp(Buffer.from(svg)).png().toFile(PNG_PATH);
await sharp(Buffer.from(svg)).resize({ width: 2600 }).png().toFile(SLIDE_PNG_PATH);

console.log(JSON.stringify({ svg: SVG_PATH, png: PNG_PATH, slidePng: SLIDE_PNG_PATH }, null, 2));


