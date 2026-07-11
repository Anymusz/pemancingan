from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


OUT = Path(__file__).with_name("class-diagram-revisi-rapi.png")
W, H = 4400, 2700
CYAN = (0, 188, 196)
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)


Point = tuple[int, int]


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\calibrib.ttf" if bold else r"C:\Windows\Fonts\calibri.ttf",
    ]
    for candidate in candidates:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()


FONT_TITLE = font(21, True)
FONT_ATTR = font(17, True)
FONT_METHOD = font(17, True)
FONT_CARD = font(20, True)
FONT_ROLE = font(18, True)
FONT_CTRL_TITLE = font(15, True)
FONT_CTRL = font(13, True)


@dataclass(frozen=True)
class Box:
    key: str
    title: str
    attrs: list[str]
    methods: list[str]
    x: int
    y: int
    w: int
    h: int


@dataclass(frozen=True)
class ControllerBox:
    key: str
    title: str
    methods: list[str]
    x: int
    y: int
    w: int
    h: int


@dataclass(frozen=True)
class Label:
    text: str
    x: int
    y: int
    role: bool = False


@dataclass(frozen=True)
class ModelRelation:
    key: str
    points: list[Point]
    labels: list[Label]
    diamond: tuple[int, int, str] | None = None


@dataclass(frozen=True)
class Dependency:
    key: str
    points: list[Point]


def text_center(
    draw: ImageDraw.ImageDraw,
    text: str,
    box: tuple[int, int, int, int],
    used_font: ImageFont.FreeTypeFont,
) -> None:
    x1, y1, x2, y2 = box
    bbox = draw.textbbox((0, 0), text, font=used_font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text((x1 + (x2 - x1 - tw) / 2, y1 + (y2 - y1 - th) / 2 - 1), text, fill=BLACK, font=used_font)


def draw_box(draw: ImageDraw.ImageDraw, b: Box) -> None:
    header_h = 44
    attr_h = 22 + (len(b.attrs) * 23)
    method_y = b.y + header_h + attr_h

    draw.rectangle([b.x, b.y, b.x + b.w, b.y + b.h], outline=CYAN, width=3, fill=WHITE)
    draw.line([(b.x, b.y + header_h), (b.x + b.w, b.y + header_h)], fill=CYAN, width=3)
    draw.line([(b.x, method_y), (b.x + b.w, method_y)], fill=CYAN, width=3)
    text_center(draw, b.title, (b.x, b.y, b.x + b.w, b.y + header_h), FONT_TITLE)

    ty = b.y + header_h + 10
    for attr in b.attrs:
        draw.text((b.x + 13, ty), attr, fill=BLACK, font=FONT_ATTR)
        ty += 23

    ty = method_y + 11
    for method in b.methods:
        draw.text((b.x + 13, ty), method, fill=BLACK, font=FONT_METHOD)
        ty += 24


def draw_controller_box(draw: ImageDraw.ImageDraw, b: ControllerBox) -> None:
    header_h = 32
    stereo_h = 25
    method_y = b.y + header_h + stereo_h

    draw.rectangle([b.x, b.y, b.x + b.w, b.y + b.h], outline=CYAN, width=2, fill=WHITE)
    draw.line([(b.x, b.y + header_h), (b.x + b.w, b.y + header_h)], fill=CYAN, width=2)
    draw.line([(b.x, method_y), (b.x + b.w, method_y)], fill=CYAN, width=2)
    text_center(draw, b.title, (b.x, b.y, b.x + b.w, b.y + header_h), FONT_CTRL_TITLE)
    text_center(draw, "<<controller>>", (b.x, b.y + header_h, b.x + b.w, method_y), FONT_CTRL)

    ty = method_y + 7
    for method in b.methods:
        draw.text((b.x + 9, ty), method, fill=BLACK, font=FONT_CTRL)
        ty += 18


def draw_polyline(draw: ImageDraw.ImageDraw, points: list[Point], *, width: int = 4, dashed: bool = False) -> None:
    if not dashed:
        draw.line(points, fill=BLACK, width=width, joint="curve")
        return

    dash = 13
    gap = 9
    for start, end in zip(points, points[1:]):
        x1, y1 = start
        x2, y2 = end
        dx, dy = x2 - x1, y2 - y1
        length = (dx * dx + dy * dy) ** 0.5
        if length == 0:
            continue
        ux, uy = dx / length, dy / length
        pos = 0.0
        while pos < length:
            seg_end = min(pos + dash, length)
            draw.line(
                [
                    (x1 + ux * pos, y1 + uy * pos),
                    (x1 + ux * seg_end, y1 + uy * seg_end),
                ],
                fill=BLACK,
                width=width,
            )
            pos += dash + gap


def draw_open_arrow(draw: ImageDraw.ImageDraw, prev: Point, point: Point) -> None:
    x, y = point
    px, py = prev
    dx, dy = x - px, y - py
    if abs(dx) >= abs(dy):
        if dx >= 0:
            pts = [((x, y), (x - 18, y - 10)), ((x, y), (x - 18, y + 10))]
        else:
            pts = [((x, y), (x + 18, y - 10)), ((x, y), (x + 18, y + 10))]
    else:
        if dy >= 0:
            pts = [((x, y), (x - 10, y - 18)), ((x, y), (x + 10, y - 18))]
        else:
            pts = [((x, y), (x - 10, y + 18)), ((x, y), (x + 10, y + 18))]
    for a, b in pts:
        draw.line([a, b], fill=BLACK, width=3)


def draw_diamond(draw: ImageDraw.ImageDraw, point: Point, direction: str) -> None:
    x, y = point
    if direction == "right":
        pts = [(x, y), (x + 13, y - 10), (x + 27, y), (x + 13, y + 10)]
    elif direction == "left":
        pts = [(x, y), (x - 13, y - 10), (x - 27, y), (x - 13, y + 10)]
    elif direction == "down":
        pts = [(x, y), (x - 10, y + 13), (x, y + 27), (x + 10, y + 13)]
    else:
        pts = [(x, y), (x - 10, y - 13), (x, y - 27), (x + 10, y - 13)]
    draw.polygon(pts, fill=BLACK)


def label_rect(draw: ImageDraw.ImageDraw, label: Label) -> tuple[int, int, int, int]:
    used_font = FONT_ROLE if label.role else FONT_CARD
    bbox = draw.textbbox((0, 0), label.text, font=used_font)
    width = bbox[2] - bbox[0]
    height = bbox[3] - bbox[1]
    pad_x = 6 if label.role else 4
    pad_y = 4
    return (label.x - pad_x, label.y - pad_y, label.x + width + pad_x, label.y + height + pad_y)


def draw_label(draw: ImageDraw.ImageDraw, label: Label) -> None:
    used_font = FONT_ROLE if label.role else FONT_CARD
    rect = label_rect(draw, label)
    draw.rectangle(rect, fill=WHITE)
    draw.text((label.x, label.y), label.text, fill=BLACK, font=used_font)


def make_boxes() -> dict[str, Box]:
    return {
        "User": Box(
            "User",
            "User",
            [
                "- id : bigint {key}",
                "- name : varchar",
                "- email : varchar {unique}",
                "- phone : varchar {unique}",
                "- address : text",
                "- role : enum",
                "- status : enum",
                "- rejected_at : timestamp {nullable}",
                "- deactivated_at : timestamp {nullable}",
            ],
            ["+ member()", "+ scopePendingMembers()", "+ sendPasswordResetNotification()"],
            120,
            420,
            480,
            370,
        ),
        "Member": Box(
            "Member",
            "Member",
            [
                "- id : bigint {key}",
                "- user_id : bigint {fk, unique}",
                "- tier_id : bigint {fk}",
                "- member_id : varchar {unique}",
                "- total_points : int",
                "- total_fish_weight : decimal",
                "- qr_code_hash : varchar {unique}",
                "- last_transaction_date : timestamp {nullable}",
                "- points_expiry_warned_at : timestamp {nullable}",
                "- approved_at : timestamp {nullable}",
            ],
            ["+ user()", "+ tier()", "+ generateMemberId()", "+ generateQRHash()", "+ getCurrentTier()"],
            800,
            420,
            520,
            480,
        ),
        "Notification": Box(
            "Notification",
            "Notification",
            [
                "- id : bigint {key}",
                "- user_id : bigint {fk}",
                "- type : varchar",
                "- title : varchar",
                "- body : varchar",
                "- data : json {nullable}",
                "- is_read : boolean",
                "- read_at : timestamp {nullable}",
            ],
            ["+ user()"],
            120,
            1000,
            480,
            330,
        ),
        "MemberTier": Box(
            "MemberTier",
            "MemberTier",
            [
                "- id : bigint {key}",
                "- name : varchar {unique}",
                "- min_points : int",
                "- max_points : int {nullable}",
                "- discount_percentage : decimal",
            ],
            ["+ members()"],
            800,
            1040,
            520,
            285,
        ),
        "Voucher": Box(
            "Voucher",
            "Voucher",
            [
                "- id : bigint {key}",
                "- member_id : bigint {fk}",
                "- transaction_id : bigint {fk, nullable}",
                "- amount : decimal",
                "- source : enum",
                "- rank : tinyint",
                "- period_year : smallint",
                "- period_month : tinyint",
                "- status : enum",
                "- used_at : timestamp {nullable}",
                "- issued_at : timestamp {default: CURRENT_TIMESTAMP}",
            ],
            ["+ member()", "+ transaction()"],
            800,
            1660,
            520,
            460,
        ),
        "Arrival": Box(
            "Arrival",
            "Arrival",
            [
                "- id : bigint {key}",
                "- member_id : bigint {fk, nullable}",
                "- checked_in_by : bigint {fk}",
                "- guest_name : varchar {nullable}",
                "- deposit_amount : decimal",
                "- check_in_at : timestamp {default: CURRENT_TIMESTAMP}",
                "- check_out_at : timestamp {nullable}",
                "- status : enum",
                "- notes : text {nullable}",
            ],
            ["+ member()", "+ checkedInBy()", "+ transaction()", "+ isActive()", "+ checkout()"],
            1540,
            420,
            520,
            500,
        ),
        "PendingOrder": Box(
            "PendingOrder",
            "PendingOrder",
            [
                "- id : bigint {key}",
                "- arrival_id : bigint {fk}",
                "- item_type : enum",
                "- item_id : bigint {fk, nullable}",
                "- item_name_snapshot : varchar",
                "- quantity : smallint",
                "- unit_price_snapshot : decimal",
                "- subtotal : decimal",
                "- payment_status : enum",
                "- production_status : enum",
                "- order_source : enum",
                "- created_by : bigint {fk, nullable}",
                "- transaction_id : bigint {fk, nullable}",
            ],
            ["+ arrival()", "+ menu()", "+ createdBy()", "+ transaction()"],
            1540,
            1040,
            520,
            530,
        ),
        "Transaction": Box(
            "Transaction",
            "Transaction",
            [
                "- id : bigint {key}",
                "- transaction_code : varchar {unique}",
                "- arrival_id : bigint {fk}",
                "- processed_by : bigint {fk}",
                "- total_amount : decimal",
                "- discount_tier : decimal",
                "- discount_voucher : decimal",
                "- final_amount : decimal",
                "- tips : decimal",
                "- payment_method : enum",
                "- points_earned : int",
                "- status : varchar",
                "- transaction_date : timestamp {default: CURRENT_TIMESTAMP}",
            ],
            ["+ arrival()", "+ processedBy()", "+ items()", "+ voucher()"],
            1540,
            1710,
            520,
            540,
        ),
        "TransactionItem": Box(
            "TransactionItem",
            "TransactionItem",
            [
                "- id : bigint {key}",
                "- transaction_id : bigint {fk}",
                "- item_type : enum",
                "- item_id : bigint {nullable}",
                "- item_name_snapshot : varchar",
                "- quantity : decimal",
                "- unit_price_snapshot : decimal",
                "- subtotal : decimal",
            ],
            ["+ transaction()"],
            2250,
            1720,
            520,
            350,
        ),
        "FishType": Box(
            "FishType",
            "FishType",
            [
                "- id : bigint {key}",
                "- name : varchar {unique}",
                "- price_per_kg : decimal",
                "- is_active : boolean",
                "- deleted_at : timestamp {nullable}",
            ],
            ["+ stock()", "+ restockLogs()"],
            2920,
            420,
            520,
            310,
        ),
        "FishStock": Box(
            "FishStock",
            "FishStock",
            [
                "- id : bigint {key}",
                "- fish_type_id : bigint {fk, unique}",
                "- current_stock_kg : decimal",
                "- alert_threshold_kg : decimal",
            ],
            ["+ fishType()"],
            3600,
            420,
            520,
            250,
        ),
        "RestockLog": Box(
            "RestockLog",
            "RestockLog",
            [
                "- id : bigint {key}",
                "- fish_type_id : bigint {fk}",
                "- restocked_by : bigint {fk}",
                "- quantity_kg : decimal",
                "- stock_before : decimal",
                "- stock_after : decimal",
                "- notes : varchar {nullable}",
            ],
            ["+ fishType()", "+ restockedBy()"],
            3600,
            810,
            520,
            335,
        ),
        "Menu": Box(
            "Menu",
            "Menu",
            [
                "- id : bigint {key}",
                "- name : varchar",
                "- price : decimal",
                "- category : enum",
                "- availability : enum",
                "- is_special : boolean",
                "- description : text {nullable}",
                "- image : varchar {nullable}",
                "- deleted_at : timestamp {nullable}",
            ],
            ["+ getImageUrlAttribute()", "+ scopeAvailable()", "+ scopeCategory()"],
            2920,
            1090,
            520,
            400,
        ),
        "RentalItem": Box(
            "RentalItem",
            "RentalItem",
            [
                "- id : bigint {key}",
                "- name : varchar {unique}",
                "- price_per_unit : decimal",
                "- unit_label : varchar",
                "- description : text {nullable}",
                "- image : varchar {nullable}",
                "- is_active : boolean",
                "- deleted_at : timestamp {nullable}",
            ],
            ["+ getImageUrlAttribute()"],
            2920,
            1710,
            520,
            325,
        ),
        "Event": Box(
            "Event",
            "Event",
            [
                "- id : bigint {key}",
                "- title : varchar",
                "- description : text",
                "- category : enum",
                "- start_date : date {nullable}",
                "- end_date : date {nullable}",
                "- status : enum",
                "- image : varchar {nullable}",
                "- deleted_at : timestamp {nullable}",
            ],
            ["+ getImageUrlAttribute()", "+ getDisplayStatusAttribute()", "+ scopePublished()"],
            3600,
            1335,
            520,
            405,
        ),
        "GuestConfig": Box(
            "GuestConfig",
            "GuestConfig",
            [
                "- id : bigint {key}",
                "- deposit_amount : decimal",
            ],
            ["+ current()"],
            3860,
            1880,
            520,
            205,
        ),
        "QrisConfig": Box(
            "QrisConfig",
            "QrisConfig",
            [
                "- id : bigint {key}",
                "- image : varchar {nullable}",
            ],
            ["+ current()", "+ getImageUrlAttribute()"],
            3860,
            2260,
            520,
            235,
        ),
    }


def make_controllers() -> dict[str, ControllerBox]:
    return {
        "AuthController": ControllerBox("AuthController", "AuthController", ["+ register()", "+ login()", "+ me()", "+ logout()"], 220, 100, 280, 145),
        "MemberValidationController": ControllerBox(
            "MemberValidationController",
            "MemberValidationController",
            ["+ getPendingMembers()", "+ approveMember()", "+ rejectMember()"],
            880,
            100,
            380,
            145,
        ),
        "NotificationController": ControllerBox(
            "NotificationController",
            "NotificationController",
            ["+ index()", "+ markAsRead()", "+ markAllAsRead()"],
            10,
            830,
            330,
            140,
        ),
        "MemberController": ControllerBox(
            "MemberController",
            "MemberController",
            ["+ getProfile()", "+ getTransactionsHistory()", "+ getVouchers()"],
            1030,
            1355,
            350,
            145,
        ),
        "VoucherController": ControllerBox("VoucherController", "VoucherController", ["+ index()"], 910, 1530, 300, 105),
        "ArrivalController": ControllerBox(
            "ArrivalController",
            "ArrivalController",
            ["+ checkIn()", "+ checkOut()", "+ resolveQR()"],
            1650,
            100,
            300,
            135,
        ),
        "PendingOrderController": ControllerBox(
            "PendingOrderController",
            "PendingOrderController",
            ["+ store()", "+ index()", "+ updateStatus()"],
            2090,
            1045,
            360,
            130,
        ),
        "OrderController": ControllerBox("OrderController", "OrderController", ["+ store()", "+ getMyOrders()"], 2090, 1220, 280, 115),
        "TransactionController": ControllerBox(
            "TransactionController",
            "TransactionController",
            ["+ checkout()", "+ index()", "+ show()", "+ getMemberVoucher()"],
            2090,
            1530,
            360,
            145,
        ),
        "FishTypeController": ControllerBox(
            "FishTypeController",
            "FishTypeController",
            ["+ index()", "+ store()", "+ update()", "+ toggleActive()"],
            3020,
            100,
            320,
            150,
        ),
        "FishStockController": ControllerBox(
            "FishStockController",
            "FishStockController",
            ["+ index()", "+ restock()", "+ updateThreshold()"],
            3680,
            100,
            330,
            135,
        ),
        "MenuController": ControllerBox(
            "MenuController",
            "MenuController",
            ["+ index()", "+ store()", "+ updateAvailability()", "+ toggleSpecial()"],
            3500,
            1170,
            330,
            150,
        ),
        "RentalItemController": ControllerBox(
            "RentalItemController",
            "RentalItemController",
            ["+ index()", "+ store()", "+ toggleActive()"],
            3500,
            2105,
            330,
            135,
        ),
        "EventController": ControllerBox(
            "EventController",
            "EventController",
            ["+ index()", "+ store()", "+ update()", "+ destroy()"],
            3980,
            1160,
            330,
            150,
        ),
        "SettingController": ControllerBox(
            "SettingController",
            "SettingController",
            ["+ getGuestConfig()", "+ updateGuestConfig()"],
            3860,
            2105,
            330,
            120,
        ),
        "QrisConfigController": ControllerBox(
            "QrisConfigController",
            "QrisConfigController",
            ["+ show()", "+ update()"],
            3860,
            2520,
            330,
            120,
        ),
    }


def make_model_relations() -> list[ModelRelation]:
    return [
        ModelRelation("User-Member", [(600, 580), (800, 580)], [Label("1", 624, 544), Label("0..1", 718, 544)]),
        ModelRelation("User-Notification", [(360, 790), (360, 1000)], [Label("1", 378, 810), Label("0..*", 378, 955)]),
        ModelRelation("MemberTier-Member", [(1060, 1040), (1060, 900)], [Label("1", 1078, 1004), Label("0..*", 1078, 912)]),
        ModelRelation("Member-Arrival", [(1320, 640), (1540, 640)], [Label("1", 1340, 604), Label("0..*", 1460, 604)]),
        ModelRelation(
            "User-Arrival-checkedInBy",
            [(440, 420), (440, 320), (1660, 320), (1660, 420)],
            [Label("1", 458, 350), Label("0..*", 1678, 350), Label("checkedInBy", 980, 288, True)],
        ),
        ModelRelation("Arrival-PendingOrder", [(1800, 920), (1800, 1040)], [Label("1", 1818, 935), Label("0..*", 1818, 1002)]),
        ModelRelation(
            "User-PendingOrder-createdBy",
            [(520, 420), (520, 275), (1485, 275), (1485, 1280), (1540, 1280)],
            [Label("1", 538, 300), Label("0..*", 1498, 1240), Label("createdBy", 850, 285, True)],
        ),
        ModelRelation(
            "Arrival-Transaction",
            [(1540, 775), (1460, 775), (1460, 1980), (1540, 1980)],
            [Label("1", 1478, 790), Label("0..1", 1478, 1940)],
        ),
        ModelRelation(
            "User-Transaction-processedBy",
            [(600, 690), (650, 690), (650, 2310), (1800, 2310), (1800, 2250)],
            [Label("1", 615, 705), Label("0..*", 1818, 2265), Label("processedBy", 780, 2278, True)],
        ),
        ModelRelation("Transaction-PendingOrder", [(1920, 1570), (1920, 1710)], [Label("0..*", 1938, 1585), Label("0..1", 1938, 1675)]),
        ModelRelation(
            "Transaction-TransactionItem",
            [(2060, 1890), (2250, 1890)],
            [Label("1", 2095, 1854), Label("1..*", 2180, 1854)],
            diamond=(2060, 1890, "right"),
        ),
        ModelRelation(
            "Member-Voucher",
            [(800, 760), (720, 760), (720, 1880), (800, 1880)],
            [Label("1", 736, 775), Label("0..*", 736, 1840)],
        ),
        ModelRelation("Voucher-Transaction", [(1320, 1880), (1540, 1880)], [Label("0..1", 1340, 1844), Label("0..1", 1460, 1844)]),
        ModelRelation("FishType-FishStock", [(3440, 550), (3600, 550)], [Label("1", 3460, 514), Label("1", 3562, 514)]),
        ModelRelation(
            "FishType-RestockLog",
            [(3440, 650), (3520, 650), (3520, 970), (3600, 970)],
            [Label("1", 3458, 614), Label("0..*", 3540, 934)],
        ),
        ModelRelation(
            "User-RestockLog-restockedBy",
            [(120, 500), (40, 500), (40, 50), (4300, 50), (4300, 980), (4120, 980)],
            [Label("1", 58, 515), Label("0..*", 4138, 944), Label("restockedBy", 3700, 22, True)],
        ),
    ]


def make_dependencies() -> list[Dependency]:
    return [
        Dependency("AuthController-User", [(360, 245), (360, 420)]),
        Dependency("MemberValidationController-Member", [(1070, 245), (1070, 420)]),
        Dependency("NotificationController-Notification", [(175, 970), (175, 1000)]),
        Dependency("MemberController-Member", [(1205, 1355), (1205, 1328), (1410, 1328), (1410, 760), (1320, 760)]),
        Dependency("MemberController-Transaction", [(1380, 1428), (1500, 1428), (1500, 1850), (1540, 1850)]),
        Dependency("MemberController-Voucher", [(1205, 1500), (1205, 1515), (1425, 1515), (1425, 1710), (1320, 1710)]),
        Dependency("VoucherController-Voucher", [(1060, 1635), (1060, 1660)]),
        Dependency("ArrivalController-Arrival", [(1800, 235), (1800, 420)]),
        Dependency("PendingOrderController-PendingOrder", [(2090, 1110), (2060, 1110)]),
        Dependency("OrderController-PendingOrder", [(2090, 1278), (2060, 1278)]),
        Dependency("TransactionController-Transaction", [(2090, 1600), (2060, 1600), (2060, 1820)]),
        Dependency("TransactionController-Voucher", [(2090, 1585), (1450, 1585), (1450, 1740), (1320, 1740)]),
        Dependency("FishTypeController-FishType", [(3180, 250), (3180, 420)]),
        Dependency("FishStockController-FishStock", [(3845, 235), (3845, 420)]),
        Dependency("FishStockController-RestockLog", [(4010, 235), (4190, 235), (4190, 900), (4120, 900)]),
        Dependency("MenuController-Menu", [(3500, 1245), (3440, 1245)]),
        Dependency("RentalItemController-RentalItem", [(3500, 2172), (3440, 2172), (3440, 1872)]),
        Dependency("EventController-Event", [(3980, 1310), (3980, 1335)]),
        Dependency("SettingController-GuestConfig", [(4025, 2105), (4025, 2085)]),
        Dependency("QrisConfigController-QrisConfig", [(4025, 2520), (4025, 2495)]),
    ]


def rects_overlap(a: tuple[int, int, int, int], b: tuple[int, int, int, int], gap: int = 8) -> bool:
    ax1, ay1, ax2, ay2 = a
    bx1, by1, bx2, by2 = b
    return not (ax2 + gap < bx1 or bx2 + gap < ax1 or ay2 + gap < by1 or by2 + gap < ay1)


def segment_crosses_rect(a: Point, b: Point, rect: tuple[int, int, int, int], inset: int = 4) -> bool:
    x1, y1, x2, y2 = rect
    x1 += inset
    y1 += inset
    x2 -= inset
    y2 -= inset
    ax, ay = a
    bx, by = b
    if ax == bx:
        x = ax
        if not (x1 < x < x2):
            return False
        sy1, sy2 = sorted([ay, by])
        return max(sy1, y1) < min(sy2, y2)
    if ay == by:
        y = ay
        if not (y1 < y < y2):
            return False
        sx1, sx2 = sorted([ax, bx])
        return max(sx1, x1) < min(sx2, x2)
    return False


def validate_layout(draw: ImageDraw.ImageDraw, boxes: dict[str, Box], controllers: dict[str, ControllerBox]) -> None:
    all_boxes: dict[str, tuple[int, int, int, int]] = {
        key: (b.x, b.y, b.x + b.w, b.y + b.h) for key, b in boxes.items()
    }
    all_boxes.update({key: (b.x, b.y, b.x + b.w, b.y + b.h) for key, b in controllers.items()})

    keys = list(all_boxes)
    for i, key in enumerate(keys):
        for other in keys[i + 1 :]:
            if rects_overlap(all_boxes[key], all_boxes[other]):
                raise ValueError(f"Layout overlap: {key} and {other}")

    labels = [label for rel in make_model_relations() for label in rel.labels]
    for label in labels:
        rect = label_rect(draw, label)
        for key, box_rect in all_boxes.items():
            if rects_overlap(rect, box_rect, gap=0):
                raise ValueError(f"Label '{label.text}' overlaps {key}")

    paths = [rel.points for rel in make_model_relations()] + [dep.points for dep in make_dependencies()]
    for path in paths:
        for a, b in zip(path, path[1:]):
            for key, box_rect in all_boxes.items():
                if segment_crosses_rect(a, b, box_rect):
                    raise ValueError(f"Line segment {a}->{b} crosses {key}")


def main() -> None:
    img = Image.new("RGB", (W, H), WHITE)
    draw = ImageDraw.Draw(img)
    boxes = make_boxes()
    controllers = make_controllers()
    relations = make_model_relations()
    dependencies = make_dependencies()

    validate_layout(draw, boxes, controllers)

    for relation in relations:
        draw_polyline(draw, relation.points, width=4)

    for dependency in dependencies:
        draw_polyline(draw, dependency.points, width=3, dashed=True)

    for b in boxes.values():
        draw_box(draw, b)

    for b in controllers.values():
        draw_controller_box(draw, b)

    for relation in relations:
        if relation.diamond is not None:
            draw_diamond(draw, (relation.diamond[0], relation.diamond[1]), relation.diamond[2])
        for label in relation.labels:
            draw_label(draw, label)

    for dependency in dependencies:
        draw_open_arrow(draw, dependency.points[-2], dependency.points[-1])

    img.save(OUT)
    print(OUT)


if __name__ == "__main__":
    main()






