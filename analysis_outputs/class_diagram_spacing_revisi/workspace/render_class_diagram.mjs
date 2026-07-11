import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { instance } from "@viz-js/viz";

const OUT_DIR = path.resolve("..");
const DOT_PATH = path.join(OUT_DIR, "class_diagram_spaced.dot");
const SVG_PATH = path.join(OUT_DIR, "class_diagram_spaced.svg");
const PNG_PATH = path.join(OUT_DIR, "class_diagram_spaced.png");

const teal = "#00AFC8";
const dark = "#111827";
const muted = "#4B5563";
const soft = "#F8FAFC";
const ctrl = "#F3F7F9";

function esc(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function classNode(name, attrs = [], methods = [], fill = "white") {
  const attrRows = attrs.map((attr) => `<TR><TD ALIGN="LEFT"><FONT POINT-SIZE="15">+ ${esc(attr)}</FONT></TD></TR>`).join("");
  const methodRows = methods.map((method) => `<TR><TD ALIGN="LEFT"><FONT POINT-SIZE="15">+ ${esc(method)}()</FONT></TD></TR>`).join("");
  const methodBlock = methodRows || `<TR><TD ALIGN="LEFT"><FONT POINT-SIZE="15" COLOR="${muted}"> </FONT></TD></TR>`;
  return `${name} [label=<
    <TABLE BORDER="1" CELLBORDER="0" CELLSPACING="0" CELLPADDING="8" COLOR="${teal}">
      <TR><TD BGCOLOR="${fill}"><B><FONT POINT-SIZE="18">${esc(name)}</FONT></B></TD></TR>
      <TR><TD><TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0">${attrRows}</TABLE></TD></TR>
      <TR><TD BORDER="1" COLOR="${teal}"><TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0">${methodBlock}</TABLE></TD></TR>
    </TABLE>
  >];`;
}

const modelNodes = [
  classNode("User", [
    "id: bigint",
    "name: varchar",
    "phone: varchar",
    "email: varchar",
    "role: enum",
    "status: enum",
  ], ["member", "scopePendingMembers", "sendPasswordResetNotification"]),
  classNode("Member", [
    "id: bigint",
    "user_id: bigint",
    "member_id: varchar",
    "tier_id: bigint",
    "total_points: int",
    "total_fish_weight: decimal",
    "qr_code_hash: varchar",
  ], ["user", "tier", "generateMemberId", "generateQRHash", "getCurrentTier"]),
  classNode("MemberTier", [
    "id: bigint",
    "name: varchar",
    "min_points: int",
    "max_points: int",
    "discount_percentage: decimal",
  ], ["members"]),
  classNode("Arrival", [
    "id: bigint",
    "member_id: bigint",
    "guest_name: varchar",
    "deposit_amount: decimal",
    "check_in_at: timestamp",
    "check_out_at: timestamp",
    "status: enum",
    "checked_in_by: bigint",
  ], ["member", "checkedInBy", "transaction", "isActive", "checkout"]),
  classNode("PendingOrder", [
    "id: bigint",
    "arrival_id: bigint",
    "item_type: enum",
    "item_id: bigint",
    "quantity: int",
    "subtotal: decimal",
    "payment_status: enum",
    "created_by: bigint",
    "transaction_id: bigint",
  ], ["arrival", "menu", "createdBy", "transaction"]),
  classNode("Transaction", [
    "id: bigint",
    "transaction_code: varchar",
    "arrival_id: bigint",
    "total_amount: decimal",
    "discount_tier: decimal",
    "discount_voucher: decimal",
    "final_amount: decimal",
    "payment_method: enum",
    "processed_by: bigint",
    "transaction_date: timestamp",
  ], ["voucher", "arrival", "processedBy", "items"]),
  classNode("TransactionItem", [
    "id: bigint",
    "transaction_id: bigint",
    "item_type: enum",
    "item_id: bigint",
    "quantity: decimal",
    "unit_price_snapshot: decimal",
    "subtotal: decimal",
  ], ["transaction"]),
  classNode("Voucher", [
    "id: bigint",
    "member_id: bigint",
    "amount: decimal",
    "source: enum",
    "rank: int",
    "period_year: smallint",
    "period_month: tinyint",
    "status: enum",
    "used_at: timestamp",
    "transaction_id: bigint",
  ], ["member", "transaction"]),
  classNode("Notification", [
    "id: bigint",
    "user_id: bigint",
    "type: varchar",
    "title: varchar",
    "body: text",
    "is_read: boolean",
  ], ["user"]),
  classNode("FishType", [
    "id: bigint",
    "name: varchar",
    "price_per_kg: decimal",
    "is_active: boolean",
    "deleted_at: timestamp",
  ], ["stock", "restockLogs"]),
  classNode("FishStock", [
    "id: bigint",
    "fish_type_id: bigint",
    "current_stock_kg: decimal",
    "alert_threshold_kg: decimal",
  ], ["fishType"]),
  classNode("RestockLog", [
    "id: bigint",
    "fish_type_id: bigint",
    "quantity_kg: decimal",
    "stock_before: decimal",
    "stock_after: decimal",
    "restocked_by: bigint",
  ], ["fishType", "restockedBy"]),
  classNode("Menu", [
    "id: bigint",
    "name: varchar",
    "price: decimal",
    "category: enum",
    "availability: enum",
    "is_special: boolean",
  ], ["getImageUrlAttribute", "scopeAvailable", "scopeCategory"]),
  classNode("RentalItem", [
    "id: bigint",
    "name: varchar",
    "price_per_unit: decimal",
    "unit_label: varchar",
    "is_active: boolean",
  ], ["getImageUrlAttribute"]),
  classNode("Event", [
    "id: bigint",
    "title: varchar",
    "description: text",
    "category: enum",
    "start_date: date",
    "end_date: date",
    "status: enum",
  ], ["getImageUrlAttribute", "scopeActive", "scopePublished"]),
  classNode("GuestConfig", [
    "id: bigint",
    "deposit_amount: decimal",
  ], ["current"]),
  classNode("QrisConfig", [
    "id: bigint",
    "image: varchar",
  ], ["current", "getImageUrlAttribute"]),
  classNode("VoucherConfig", [
    "id: bigint",
    "rank: int",
    "amount: decimal",
  ], ["current"]),
];

const controllerNodes = [
  classNode("AuthController", [], ["register", "login", "me", "logout"], ctrl),
  classNode("MemberValidationController", [], ["getPendingMembers", "approveMember", "rejectMember"], ctrl),
  classNode("MemberController", [], ["profile", "getRewardsHistory", "getVouchers"], ctrl),
  classNode("ArrivalController", [], ["checkIn", "searchMember", "resolveQr"], ctrl),
  classNode("PendingOrderController", [], ["store", "index", "updateStatus"], ctrl),
  classNode("OrderController", [], ["store", "myOrders"], ctrl),
  classNode("TransactionController", [], ["checkout", "show", "printReceipt"], ctrl),
  classNode("NotificationController", [], ["index", "markAsRead", "markAllAsRead"], ctrl),
  classNode("FishTypeController", [], ["index", "store", "update", "destroy"], ctrl),
  classNode("FishStockController", [], ["index", "restock", "updateThreshold"], ctrl),
  classNode("MenuController", [], ["index", "store", "updateAvailability"], ctrl),
  classNode("EventController", [], ["index", "store", "update"], ctrl),
  classNode("RentalItemController", [], ["index", "store", "update"], ctrl),
  classNode("SettingController", [], ["guestConfig", "qrisConfig"], ctrl),
];

const modelEdges = [
  ["User", "Member", "1", "0..1 member()"],
  ["MemberTier", "Member", "1", "0..* members()"],
  ["Member", "Arrival", "0..1", "0..* arrivals"],
  ["User", "Arrival", "1", "0..* checkedInBy()"],
  ["Arrival", "PendingOrder", "1", "0..* pendingOrders"],
  ["User", "PendingOrder", "1", "0..* createdBy()"],
  ["Menu", "PendingOrder", "1", "0..* menu()"],
  ["Arrival", "Transaction", "1", "0..1 transaction()"],
  ["User", "Transaction", "1", "0..* processedBy()"],
  ["Transaction", "PendingOrder", "0..1", "0..* pendingOrders"],
  ["Transaction", "TransactionItem", "1", "1..* items()"],
  ["Transaction", "Voucher", "0..1", "0..1 voucher()"],
  ["Member", "Voucher", "1", "0..* vouchers"],
  ["User", "Notification", "1", "0..* notifications"],
  ["FishType", "FishStock", "1", "1 stock()"],
  ["FishType", "RestockLog", "1", "0..* restockLogs()"],
  ["User", "RestockLog", "1", "0..* restockedBy()"],
];

const controllerEdges = [
  ["AuthController", "User"],
  ["AuthController", "Member"],
  ["MemberValidationController", "User"],
  ["MemberValidationController", "Member"],
  ["MemberController", "Member"],
  ["MemberController", "Transaction"],
  ["MemberController", "Voucher"],
  ["ArrivalController", "Arrival"],
  ["ArrivalController", "Member"],
  ["PendingOrderController", "PendingOrder"],
  ["PendingOrderController", "Arrival"],
  ["OrderController", "PendingOrder"],
  ["OrderController", "Menu"],
  ["TransactionController", "Transaction"],
  ["TransactionController", "TransactionItem"],
  ["TransactionController", "Arrival"],
  ["TransactionController", "FishStock"],
  ["NotificationController", "Notification"],
  ["FishTypeController", "FishType"],
  ["FishStockController", "FishStock"],
  ["FishStockController", "RestockLog"],
  ["MenuController", "Menu"],
  ["EventController", "Event"],
  ["RentalItemController", "RentalItem"],
  ["SettingController", "GuestConfig"],
  ["SettingController", "QrisConfig"],
  ["SettingController", "VoucherConfig"],
];

const modelEdgeDot = modelEdges
  .map(([from, to, tail, head], index) => {
    const angle = index % 2 === 0 ? 28 : -28;
    return `${from} -> ${to} [taillabel="${tail}", headlabel="${head}", labeldistance=2.8, labelangle=${angle}, minlen=2];`;
  })
  .join("\n");

const controllerEdgeDot = controllerEdges
  .map(([from, to]) => `${from} -> ${to} [style=dashed, color="#6B7280", arrowhead=open, arrowsize=0.7, minlen=1];`)
  .join("\n");

const dot = `digraph G {
  graph [
    rankdir=LR,
    bgcolor="white",
    pad="0.6",
    nodesep="1.15",
    ranksep="1.55",
    splines=polyline,
    outputorder=edgesfirst
  ];
  node [
    shape=plain,
    fontname="Arial",
    margin=0
  ];
  edge [
    fontname="Arial",
    fontsize=16,
    color="${dark}",
    penwidth=1.35,
    arrowsize=0.8,
    arrowhead=vee,
    decorate=false
  ];

  subgraph cluster_identity {
    label="Akun dan Member";
    color="#E5E7EB";
    margin=34;
    User; Member; MemberTier; Voucher; Notification;
  }

  subgraph cluster_operations {
    label="Operasional Transaksi";
    color="#E5E7EB";
    margin=34;
    Arrival; PendingOrder; Transaction; TransactionItem;
  }

  subgraph cluster_inventory {
    label="Inventaris dan Konten";
    color="#E5E7EB";
    margin=34;
    FishType; FishStock; RestockLog; Menu; RentalItem; Event;
  }

  subgraph cluster_config {
    label="Konfigurasi";
    color="#E5E7EB";
    margin=34;
    GuestConfig; QrisConfig; VoucherConfig;
  }

  subgraph cluster_controllers {
    label="Controller / Layanan API";
    color="#F3F4F6";
    margin=40;
    ${controllerNodes.join("\n")}
  }

  ${modelNodes.join("\n")}

  { rank=same; User; Member; MemberTier; }
  { rank=same; Arrival; PendingOrder; Transaction; TransactionItem; }
  { rank=same; FishType; FishStock; RestockLog; }
  { rank=same; Menu; RentalItem; Event; }
  { rank=same; GuestConfig; QrisConfig; VoucherConfig; }

  ${modelEdgeDot}
  ${controllerEdgeDot}

  legend [label=<
    <TABLE BORDER="1" CELLBORDER="0" CELLSPACING="0" CELLPADDING="8" COLOR="#D1D5DB">
      <TR><TD><B>Catatan relasi</B></TD></TR>
      <TR><TD ALIGN="LEFT">Label relasi dan kardinalitas diletakkan di ujung konektor.</TD></TR>
      <TR><TD ALIGN="LEFT">Garis solid = relasi model. Garis putus-putus = controller memakai model.</TD></TR>
    </TABLE>
  >];
  legend -> TransactionItem [style=invis];
}`;

await fs.mkdir(OUT_DIR, { recursive: true });
await fs.writeFile(DOT_PATH, dot, "utf8");
const viz = await instance();
const svg = viz.renderString(dot, { format: "svg", engine: "dot" });
await fs.writeFile(SVG_PATH, svg, "utf8");
await sharp(Buffer.from(svg)).resize({ width: 6200, withoutEnlargement: false }).png().toFile(PNG_PATH);

console.log(JSON.stringify({ dot: DOT_PATH, svg: SVG_PATH, png: PNG_PATH }, null, 2));
