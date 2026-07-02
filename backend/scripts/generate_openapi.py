from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OPENAPI_PATH = ROOT / "public" / "openapi.json"
SWAGGER_HTML_PATH = ROOT / "public" / "swagger.html"


def field(type_: str, example, **extra):
    schema = {"type": type_, "example": example}
    schema.update({key: value for key, value in extra.items() if value is not None})
    return schema


def array_field(items: dict, example=None, **extra):
    schema = {"type": "array", "items": items}
    if example is not None:
        schema["example"] = example
    schema.update(extra)
    return schema


def object_field(properties: dict, required=None, example=None, **extra):
    schema = {"type": "object", "properties": properties}
    if required:
        schema["required"] = required
    if example is not None:
        schema["example"] = example
    schema.update(extra)
    return schema


def query(name: str, type_: str, example, description: str = "", enum=None):
    schema = {"type": type_}
    if enum:
        schema["enum"] = enum
    return {
        "name": name,
        "in": "query",
        "required": False,
        "description": description,
        "schema": schema,
        "example": example,
    }


def request_body(content_type: str, properties: dict, required=None, example=None):
    schema = object_field(properties, required=required or [])
    body = {
        "required": True,
        "content": {
            content_type: {
                "schema": schema,
            }
        },
    }
    if example is not None:
        body["content"][content_type]["example"] = example
    return body


def json_body(properties: dict, required=None, example=None):
    return request_body("application/json", properties, required, example)


def multipart_body(properties: dict, required=None, example=None):
    return request_body("multipart/form-data", properties, required, example)


def bool_query(name: str, example=False, description: str = ""):
    return query(name, "boolean", example, description)


def int_query(name: str, example=1, description: str = ""):
    return query(name, "integer", example, description)


def str_query(name: str, example: str, description: str = "", enum=None):
    return query(name, "string", example, description, enum=enum)


def date_query(name: str, example: str, description: str = ""):
    return query(name, "string", example, description, enum=None) | {
        "schema": {"type": "string", "format": "date"}
    }


def id_example(name: str):
    examples = {
        "id": 1,
        "arrival_id": 1,
        "arrivalId": 1,
        "memberId": 1,
        "fishTypeId": 1,
        "employee": 2,
        "feature": "employee.menu_availability",
    }
    return examples.get(name, 1)


def path_parameter(name: str):
    example = id_example(name)
    schema = {"type": "integer"} if isinstance(example, int) else {"type": "string"}
    return {
        "name": name,
        "in": "path",
        "required": True,
        "description": f"Contoh {name} siap pakai untuk Swagger Try it out.",
        "schema": schema,
        "example": example,
    }


def base_responses(created=False, binary=False):
    if binary:
        return {
            "200": {
                "description": "File berhasil dibuat",
                "content": {
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
                        "schema": {"type": "string", "format": "binary"}
                    }
                },
            },
            "401": {"$ref": "#/components/responses/Unauthorized"},
            "403": {"$ref": "#/components/responses/Forbidden"},
            "422": {"$ref": "#/components/responses/ValidationError"},
            "500": {"$ref": "#/components/responses/ServerError"},
        }

    code = "201" if created else "200"
    responses = {
        code: {"$ref": "#/components/responses/Success"},
        "400": {"$ref": "#/components/responses/BadRequest"},
        "401": {"$ref": "#/components/responses/Unauthorized"},
        "403": {"$ref": "#/components/responses/Forbidden"},
        "404": {"$ref": "#/components/responses/NotFound"},
        "409": {"$ref": "#/components/responses/Conflict"},
        "422": {"$ref": "#/components/responses/ValidationError"},
        "500": {"$ref": "#/components/responses/ServerError"},
    }
    return responses


def load_routes():
    result = subprocess.run(
        ["php", "artisan", "route:list", "--path=api", "--json"],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(result.stdout)


def route_to_path(uri: str):
    return "/" + uri.strip("/")


def route_methods(method: str):
    return [part.lower() for part in method.split("|") if part != "HEAD"]


def path_params(path: str):
    return re.findall(r"{([^}]+)}", path)


def infer_tag(path: str):
    if path.startswith("/api/owner/employees"):
        return "Owner - Employees"
    if path.startswith("/api/owner/reports"):
        return "Owner - Reports"
    if path.startswith("/api/owner/fish-stocks"):
        return "Owner - Fish Stocks"
    if path.startswith("/api/owner/fish-types"):
        return "Owner - Fish Types"
    if path.startswith("/api/owner/menus"):
        return "Owner - Menus"
    if path.startswith("/api/owner/events"):
        return "Owner - Events"
    if path.startswith("/api/owner/rental-items"):
        return "Owner - Rental Items"
    if path.startswith("/api/owner/voucher"):
        return "Owner - Vouchers"
    if path.startswith("/api/owner"):
        return "Owner"
    if path.startswith("/api/employee"):
        return "Employee"
    if path.startswith("/api/member"):
        return "Member"
    if path.startswith("/api/notifications"):
        return "Notifications"
    if path in ["/api/login", "/api/register", "/api/logout", "/api/me", "/api/forgot-password", "/api/reset-password"]:
        return "Auth"
    return "Public"


def is_secured(route):
    middleware = route.get("middleware", [])
    return any("Authenticate:sanctum" in item for item in middleware)


def op_key(method: str, path: str):
    return f"{method.upper()} {path}"


def route_operation_id(method: str, path: str):
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "_", path.strip("/"))
    return f"{method.lower()}_{cleaned}".strip("_")


def common_report_queries():
    return [
        str_query("period", "daily", "Periode laporan.", enum=["daily", "weekly", "monthly", "custom"]),
        date_query("start_date", "2026-06-01", "Wajib jika period=custom."),
        date_query("end_date", "2026-06-30", "Wajib jika period=custom."),
    ]


META = {
    "POST /api/register": {
        "summary": "Registrasi member baru",
        "body": json_body(
            {
                "name": field("string", "Budi Santoso"),
                "phone": field("string", "081234567899"),
                "email": field("string", "budi@example.com", format="email"),
                "password": field("string", "password123", format="password"),
                "password_confirmation": field("string", "password123", format="password"),
                "address": field("string", "Jl. Pemancingan No. 10"),
            },
            ["name", "phone", "email", "password", "password_confirmation", "address"],
        ),
        "created": True,
    },
    "POST /api/login": {
        "summary": "Login menggunakan email atau nomor telepon",
        "body": json_body(
            {
                "login": field("string", "owner@pemancingan.com"),
                "password": field("string", "password", format="password"),
            },
            ["login", "password"],
        ),
    },
    "POST /api/forgot-password": {
        "summary": "Kirim link reset password",
        "body": json_body({"email": field("string", "member@example.com", format="email")}, ["email"]),
    },
    "POST /api/reset-password": {
        "summary": "Reset password menggunakan token",
        "body": json_body(
            {
                "token": field("string", "reset-token-contoh"),
                "email": field("string", "member@example.com", format="email"),
                "password": field("string", "password123", format="password"),
                "password_confirmation": field("string", "password123", format="password"),
            },
            ["token", "email", "password", "password_confirmation"],
        ),
    },
    "PUT /api/user/profile": {
        "summary": "Update profil user login",
        "body": json_body(
            {
                "name": field("string", "Sutoyo Owner"),
                "email": field("string", "owner@pemancingan.com", format="email"),
                "phone": field("string", "081234567890"),
                "address": field("string", "Jl. Pemancingan Indah No. 1"),
            },
            ["name", "email", "phone", "address"],
        ),
    },
    "PUT /api/user/password": {
        "summary": "Update password user login",
        "body": json_body(
            {
                "current_password": field("string", "password", format="password"),
                "password": field("string", "password123", format="password"),
                "password_confirmation": field("string", "password123", format="password"),
            },
            ["current_password", "password", "password_confirmation"],
        ),
    },
    "GET /api/events": {
        "summary": "List event/info publik",
        "params": [
            int_query("page", 1, "Halaman data."),
            int_query("per_page", 6, "Jumlah data per halaman."),
            str_query("category", "event", "Filter kategori.", enum=["event", "info"]),
        ],
    },
    "GET /api/leaderboard": {
        "summary": "Leaderboard publik",
        "params": [int_query("page", 1), int_query("per_page", 50)],
    },
    "GET /api/member/transactions": {
        "summary": "Riwayat transaksi member login",
        "params": [date_query("start_date", "2026-06-01"), date_query("end_date", "2026-06-30"), int_query("per_page", 10)],
    },
    "POST /api/member/orders": {
        "summary": "Member membuat pesanan menu",
        "body": json_body(
            {
                "items": array_field(
                    object_field(
                        {
                            "menu_id": field("integer", 1),
                            "quantity": field("integer", 2, minimum=1),
                        },
                        ["menu_id", "quantity"],
                    ),
                    [{"menu_id": 1, "quantity": 2}],
                )
            },
            ["items"],
        ),
        "created": True,
    },
    "GET /api/notifications": {
        "summary": "List notifikasi user login",
        "params": [int_query("per_page", 15)],
    },
    "POST /api/owner/approve-member": {
        "summary": "Owner approve member pending",
        "body": json_body({"user_id": field("integer", 3)}, ["user_id"]),
    },
    "POST /api/owner/reject-member": {
        "summary": "Owner reject member pending",
        "body": json_body(
            {
                "user_id": field("integer", 3),
                "rejection_reason": field("string", "Data pendaftaran belum lengkap."),
            },
            ["user_id", "rejection_reason"],
        ),
    },
    "POST /api/owner/reactivate-rejected": {
        "summary": "Owner reaktivasi member deactivated",
        "body": json_body({"user_id": field("integer", 3)}, ["user_id"]),
    },
    "DELETE /api/owner/deactivate-member": {
        "summary": "Owner nonaktifkan member aktif",
        "body": json_body(
            {
                "user_id": field("integer", 3),
                "deactivated_reason": field("string", "Permintaan deaktivasi dari member."),
            },
            ["user_id", "deactivated_reason"],
        ),
    },
    "POST /api/owner/employees": {
        "summary": "Owner membuat akun pegawai",
        "body": json_body(
            {
                "name": field("string", "Pegawai Kolam"),
                "phone": field("string", "089911122233"),
                "email": field("string", "pegawai.kolam@example.com", format="email"),
                "password": field("string", "Password123", format="password"),
                "password_confirmation": field("string", "Password123", format="password"),
                "address": field("string", "Jl. Kolam No. 1"),
            },
            ["name", "phone", "email", "address", "password"],
        ),
        "created": True,
    },
    "PUT /api/owner/employees/{id}": {
        "summary": "Owner mengubah akun pegawai",
        "body": json_body(
            {
                "name": field("string", "Pegawai Kolam Updated"),
                "phone": field("string", "089944455566"),
                "email": field("string", "pegawai.updated@example.com", format="email"),
                "password": field("string", "Password456", format="password"),
                "password_confirmation": field("string", "Password456", format="password"),
                "address": field("string", "Jl. Pegawai Baru"),
            },
            [],
        ),
    },
    "PUT /api/owner/employees/{id}/password": {
        "summary": "Owner reset password pegawai",
        "body": json_body(
            {
                "password": field("string", "Password456", format="password"),
                "password_confirmation": field("string", "Password456", format="password"),
            },
            ["password"],
        ),
    },
    "PATCH /api/owner/employees/{id}/deactivate": {
        "summary": "Owner nonaktifkan akun pegawai",
        "body": json_body(
            {
                "reason": field("string", "testing"),
            },
            ["reason"],
        ),
    },
    "PATCH /api/owner/employees/{id}/reactivate": {
        "summary": "Owner aktifkan kembali akun pegawai",
    },
    "DELETE /api/owner/employees/{id}": {
        "summary": "Owner menghapus akun pegawai",
    },
    "GET /api/owner/leaderboard": {
        "summary": "Leaderboard versi owner",
        "params": [int_query("limit", 100)],
    },
    "GET /api/owner/menus": {
        "summary": "List menu owner",
        "params": [
            bool_query("include_deleted", False),
            str_query("category", "food", enum=["food", "beverage"]),
            str_query("availability", "available", enum=["available", "unavailable"]),
            str_query("search", "nasi", "Cari nama menu."),
        ],
    },
    "POST /api/owner/menus": {
        "summary": "Tambah menu",
        "body": multipart_body(
            {
                "name": field("string", "Nasi Goreng"),
                "price": field("number", 18000, minimum=0),
                "category": field("string", "food", enum=["food", "beverage"]),
                "availability": field("string", "available", enum=["available", "unavailable"]),
                "description": field("string", "Menu nasi goreng spesial."),
                "image": field("string", None, format="binary", nullable=True),
            },
            ["name", "price", "category"],
        ),
        "created": True,
    },
    "PUT /api/owner/menus/{id}": {
        "summary": "Update menu",
        "body": multipart_body(
            {
                "name": field("string", "Nasi Goreng Spesial"),
                "price": field("number", 20000, minimum=0),
                "category": field("string", "food", enum=["food", "beverage"]),
                "availability": field("string", "available", enum=["available", "unavailable"]),
                "description": field("string", "Menu nasi goreng spesial update."),
                "remove_image": field("boolean", False),
                "image": field("string", None, format="binary", nullable=True),
            },
            ["name", "price", "category"],
        ),
    },
    "PATCH /api/owner/menus/{id}/availability": {
        "summary": "Update status ketersediaan menu",
        "body": json_body({"availability": field("string", "available", enum=["available", "unavailable"])}, ["availability"]),
    },
    "GET /api/owner/fish-types": {
        "summary": "List jenis ikan owner",
        "params": [bool_query("include_deleted", False), str_query("search", "nila")],
    },
    "POST /api/owner/fish-types": {
        "summary": "Tambah jenis ikan",
        "body": json_body(
            {
                "name": field("string", "Nila"),
                "price_per_kg": field("number", 30000, minimum=1000),
            },
            ["name", "price_per_kg"],
        ),
        "created": True,
    },
    "PUT /api/owner/fish-types/{id}": {
        "summary": "Update jenis ikan",
        "body": json_body(
            {
                "name": field("string", "Nila Super"),
                "price_per_kg": field("number", 35000, minimum=1000),
            },
            ["name", "price_per_kg"],
        ),
    },
    "POST /api/owner/fish-stocks/{fishTypeId}/restock": {
        "summary": "Restock ikan",
        "body": json_body(
            {
                "quantity_kg": field("number", 20.5, minimum=0.1),
                "notes": field("string", "Restock pagi."),
            },
            ["quantity_kg"],
        ),
    },
    "PATCH /api/owner/fish-stocks/{fishTypeId}/threshold": {
        "summary": "Update threshold stok ikan",
        "body": json_body({"alert_threshold_kg": field("number", 5, minimum=0)}, ["alert_threshold_kg"]),
    },
    "GET /api/owner/events": {
        "summary": "List event owner",
        "params": [
            bool_query("include_deleted", False),
            str_query("status", "published", enum=["draft", "published"]),
            str_query("category", "event", enum=["event", "info"]),
            str_query("search", "lomba"),
        ],
    },
    "POST /api/owner/events": {
        "summary": "Tambah event/info",
        "body": multipart_body(
            {
                "title": field("string", "Lomba Mancing Mingguan"),
                "description": field("string", "Lomba mancing untuk semua member."),
                "category": field("string", "event", enum=["event", "info"]),
                "start_date": field("string", "2026-07-05", format="date"),
                "end_date": field("string", "2026-07-05", format="date"),
                "status": field("string", "draft", enum=["draft", "published"]),
                "image": field("string", None, format="binary", nullable=True),
            },
            ["title", "description", "category"],
        ),
        "created": True,
    },
    "POST /api/owner/events/{id}": {
        "summary": "Update event/info",
        "body": multipart_body(
            {
                "title": field("string", "Lomba Mancing Mingguan Update"),
                "description": field("string", "Deskripsi event terbaru."),
                "category": field("string", "event", enum=["event", "info"]),
                "start_date": field("string", "2026-07-05", format="date"),
                "end_date": field("string", "2026-07-05", format="date"),
                "status": field("string", "published", enum=["draft", "published"]),
                "remove_image": field("string", "0", enum=["0", "1"]),
                "image": field("string", None, format="binary", nullable=True),
            },
            ["title", "description", "category"],
        ),
    },
    "PATCH /api/owner/events/{id}/publish": {
        "summary": "Ubah status publish event",
        "body": json_body({"status": field("string", "published", enum=["draft", "published"])}, ["status"]),
    },
    "GET /api/owner/rental-items": {
        "summary": "List alat rental owner",
        "params": [bool_query("include_deleted", False), str_query("search", "joran")],
    },
    "POST /api/owner/rental-items": {
        "summary": "Tambah alat rental",
        "body": multipart_body(
            {
                "name": field("string", "Joran Premium"),
                "price_per_unit": field("number", 15000, minimum=1000),
                "unit_label": field("string", "jam"),
                "description": field("string", "Joran untuk disewa."),
                "is_active": field("boolean", True),
                "image": field("string", None, format="binary", nullable=True),
            },
            ["name", "price_per_unit", "unit_label"],
        ),
        "created": True,
    },
    "PUT /api/owner/rental-items/{id}": {
        "summary": "Update alat rental",
        "body": multipart_body(
            {
                "name": field("string", "Joran Premium Update"),
                "price_per_unit": field("number", 18000, minimum=1000),
                "unit_label": field("string", "jam"),
                "description": field("string", "Joran rental update."),
                "is_active": field("boolean", True),
                "remove_image": field("boolean", False),
                "image": field("string", None, format="binary", nullable=True),
            },
            ["name", "price_per_unit", "unit_label"],
        ),
    },
    "PUT /api/owner/guest-config": {
        "summary": "Update deposit tamu",
        "body": json_body({"deposit_amount": field("number", 50000, minimum=0)}, ["deposit_amount"]),
    },
    "PUT /api/owner/qris-config": {
        "summary": "Update gambar QRIS",
        "body": multipart_body({"image": field("string", None, format="binary", nullable=True)}, []),
    },
    "PUT /api/owner/voucher-configs": {
        "summary": "Update konfigurasi voucher leaderboard",
        "body": json_body(
            {
                "configs": array_field(
                    object_field(
                        {
                            "rank": field("integer", 1, enum=[1, 2, 3]),
                            "amount": field("number", 50000, minimum=1000),
                        },
                        ["rank", "amount"],
                    ),
                    [
                        {"rank": 1, "amount": 50000},
                        {"rank": 2, "amount": 30000},
                        {"rank": 3, "amount": 20000},
                    ],
                )
            },
            ["configs"],
        ),
    },
    "GET /api/owner/vouchers": {
        "summary": "List voucher owner",
        "params": [
            str_query("status", "unused", enum=["unused", "used", "expired"]),
            int_query("period_year", 2026),
            int_query("period_month", 6),
        ],
    },
    "GET /api/owner/reports/summary": {"summary": "Ringkasan laporan", "params": common_report_queries()},
    "GET /api/owner/reports/breakdown": {"summary": "Breakdown laporan", "params": common_report_queries()},
    "GET /api/owner/reports/transactions": {
        "summary": "Detail transaksi laporan",
        "params": common_report_queries() + [int_query("per_page", 10)],
    },
    "GET /api/owner/reports/export": {
        "summary": "Export laporan Excel",
        "params": common_report_queries(),
        "binary": True,
    },
    "GET /api/owner/reports/stock-summary": {"summary": "Ringkasan stok laporan", "params": common_report_queries()},
    "GET /api/employee/check-in": {},
    "POST /api/employee/check-in": {
        "summary": "Check-in member atau tamu",
        "body": json_body(
            {
                "type": field("string", "member", enum=["member", "guest"]),
                "member_id": field("integer", 1),
                "guest_name": field("string", "Tamu Harian"),
                "notes": field("string", "Datang pagi."),
            },
            ["type"],
        ),
        "created": True,
    },
    "POST /api/employee/check-out/{arrival_id}": {
        "summary": "Check-out kedatangan",
        "body": json_body({"notes": field("string", "Selesai memancing.")}, []),
    },
    "GET /api/employee/search-member": {"summary": "Cari member aktif", "params": [str_query("query", "Budi")]},
    "GET /api/employee/search-arrival": {"summary": "Cari kedatangan aktif", "params": [str_query("query", "Budi")]},
    "POST /api/employee/resolve-qr": {
        "summary": "Resolve QR member",
        "body": json_body(
            {
                "qr_hash": field("string", "qr_hash_contoh"),
                "member_id": field("string", "MBR-0001"),
            },
            ["qr_hash", "member_id"],
        ),
    },
    "POST /api/employee/pending-orders": {
        "summary": "Tambah pending order",
        "body": json_body(
            {
                "arrival_id": field("integer", 1),
                "items": array_field(
                    object_field(
                        {
                            "item_type": field("string", "menu", enum=["menu", "rental"]),
                            "item_id": field("integer", 1),
                            "quantity": field("integer", 2, minimum=1),
                        },
                        ["item_type", "quantity"],
                    ),
                    [{"item_type": "menu", "item_id": 1, "quantity": 2}],
                ),
            },
            ["arrival_id", "items"],
        ),
        "created": True,
    },
    "PATCH /api/employee/pending-orders/{id}/status": {
        "summary": "Update status produksi pending order",
        "body": json_body(
            {
                "status": field("string", "processing", enum=["pending", "processing", "done", "cancelled"]),
                "cancellation_reason": field("string", "Customer batal pesan."),
            },
            ["status"],
        ),
    },
    "POST /api/employee/checkout": {
        "summary": "Checkout transaksi",
        "body": multipart_body(
            {
                "arrival_id": field("integer", 1),
                "fish_items[0][item_id]": field("integer", 1),
                "fish_items[0][quantity]": field("number", 1.5, minimum=0.01),
                "penalty_items[0][name]": field("string", "Denda alat rusak"),
                "penalty_items[0][quantity]": field("integer", 1),
                "penalty_items[0][unit_price]": field("number", 10000),
                "payment_method": field("string", "cash", enum=["cash", "transfer", "qris"]),
                "tips": field("number", 5000),
                "notes": field("string", "Pembayaran lunas."),
                "payment_proof": field("string", None, format="binary", nullable=True),
            },
            ["arrival_id"],
        ),
        "created": True,
    },
    "GET /api/employee/transactions": {
        "summary": "Riwayat transaksi employee",
        "params": [
            date_query("date_from", "2026-06-01"),
            date_query("date_to", "2026-06-30"),
            str_query("payment_method", "cash", enum=["cash", "transfer", "qris"]),
            str_query("transaction_code", "TRX-20260630"),
            int_query("per_page", 10),
        ],
    },
}


def add_default_meta(method: str, path: str):
    key = op_key(method, path)
    meta = META.get(key, {})

    if "summary" not in meta:
        title = path.replace("/api/", "").replace("/", " ").replace("-", " ")
        meta["summary"] = f"{method.upper()} {title}".strip()

    return meta


def build_operation(route, method: str, path: str):
    meta = add_default_meta(method, path)
    params = [path_parameter(name) for name in path_params(path)]
    params.extend(meta.get("params", []))

    operation = {
        "tags": [meta.get("tag", infer_tag(path))],
        "summary": meta["summary"],
        "operationId": route_operation_id(method, path),
        "parameters": params,
        "responses": base_responses(created=meta.get("created", False), binary=meta.get("binary", False)),
    }

    description_parts = []
    middleware = route.get("middleware", [])
    if is_secured(route):
        operation["security"] = [{"bearerAuth": []}]
        description_parts.append("Butuh Bearer token dari endpoint login.")

    if description_parts:
        operation["description"] = "\n".join(description_parts)

    if "body" in meta:
        operation["requestBody"] = meta["body"]

    return operation


def build_spec():
    routes = load_routes()
    paths = {}

    for route in routes:
        path = route_to_path(route["uri"])
        for method in route_methods(route["method"]):
            paths.setdefault(path, {})[method] = build_operation(route, method, path)

    return {
        "openapi": "3.0.3",
        "info": {
            "title": "Sistem Informasi Pemancingan Sutoyo API",
            "version": "1.0.0",
            "description": "Dokumentasi Swagger/OpenAPI untuk seluruh route API Laravel. Semua parameter dan request body diberi contoh agar Swagger Try it out langsung terisi nilai contoh.",
        },
        "servers": [
            {"url": "/", "description": "Same-origin backend"},
            {"url": "http://127.0.0.1:8000", "description": "Laravel local server"},
        ],
        "tags": [
            {"name": "Auth"},
            {"name": "Public"},
            {"name": "Member"},
            {"name": "Notifications"},
            {"name": "Owner"},
            {"name": "Owner - Employees"},
            {"name": "Owner - Reports"},
            {"name": "Owner - Menus"},
            {"name": "Owner - Fish Types"},
            {"name": "Owner - Fish Stocks"},
            {"name": "Owner - Events"},
            {"name": "Owner - Rental Items"},
            {"name": "Owner - Vouchers"},
            {"name": "Employee"},
        ],
        "paths": dict(sorted(paths.items())),
        "components": {
            "securitySchemes": {
                "bearerAuth": {
                    "type": "http",
                    "scheme": "bearer",
                    "bearerFormat": "Sanctum token",
                    "description": "Masukkan token dari POST /api/login. Contoh: Bearer 1|sanctum-token",
                }
            },
            "schemas": {
                "ApiSuccess": object_field(
                    {
                        "success": field("boolean", True),
                        "message": field("string", "Operasi berhasil"),
                        "data": object_field({}, example={}),
                    }
                ),
                "ApiError": object_field(
                    {
                        "success": field("boolean", False),
                        "message": field("string", "Terjadi kesalahan"),
                    },
                    ["success", "message"],
                ),
                "ValidationError": object_field(
                    {
                        "success": field("boolean", False),
                        "message": field("string", "Validation error"),
                        "errors": object_field(
                            {"field": array_field(field("string", "Field wajib diisi."), ["Field wajib diisi."])},
                            example={"field": ["Field wajib diisi."]},
                        ),
                    },
                    ["success", "message"],
                ),
            },
            "responses": {
                "Success": {
                    "description": "Response sukses",
                    "content": {
                        "application/json": {
                            "schema": {"$ref": "#/components/schemas/ApiSuccess"},
                            "example": {"success": True, "message": "Operasi berhasil", "data": {}},
                        }
                    },
                },
                "BadRequest": {"description": "Bad request", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ApiError"}}}},
                "Unauthorized": {"description": "Unauthenticated", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ApiError"}, "example": {"success": False, "message": "Unauthenticated"}}}},
                "Forbidden": {"description": "Forbidden", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ApiError"}, "example": {"success": False, "message": "Anda tidak memiliki akses ke fitur ini"}}}},
                "NotFound": {"description": "Data tidak ditemukan", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ApiError"}}}},
                "Conflict": {"description": "Conflict", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ApiError"}}}},
                "ValidationError": {
                    "description": "Validasi gagal",
                    "content": {
                        "application/json": {
                            "schema": {"$ref": "#/components/schemas/ValidationError"},
                            "example": {"success": False, "message": "Validation error", "errors": {"field": ["Field wajib diisi."]}},
                        }
                    },
                },
                "ServerError": {"description": "Server error", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ApiError"}}}},
            },
        },
    }


def write_swagger_html():
    html = """<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Sutoyo API Swagger</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      body { margin: 0; background: #f7fafc; }
      .swagger-ui .topbar { display: none; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: "/openapi.json",
        dom_id: "#swagger-ui",
        deepLinking: true,
        displayOperationId: false,
        persistAuthorization: true,
        tryItOutEnabled: true,
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 2
      });
    </script>
  </body>
</html>
"""
    SWAGGER_HTML_PATH.write_text(html, encoding="utf-8")


def main():
    OPENAPI_PATH.parent.mkdir(parents=True, exist_ok=True)
    spec = build_spec()
    OPENAPI_PATH.write_text(json.dumps(spec, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    write_swagger_html()
    route_count = sum(len(methods) for methods in spec["paths"].values())
    print(f"Wrote {OPENAPI_PATH.relative_to(ROOT)} with {route_count} operations")
    print(f"Wrote {SWAGGER_HTML_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
