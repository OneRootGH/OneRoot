from __future__ import annotations

import calendar
import base64
import csv
import hashlib
import html
import json
import time
from collections import defaultdict
from datetime import date, datetime, timedelta
from functools import wraps
from io import BytesIO, StringIO
from pathlib import Path
from threading import Lock
from typing import Any
from uuid import uuid4
from zipfile import ZIP_DEFLATED, ZipFile
from zoneinfo import ZoneInfo

from flask import Flask, Response, flash, g, jsonify, redirect, render_template, request, send_file, send_from_directory, session, url_for
from sqlalchemy import create_engine, desc, inspect, or_, select
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import scoped_session, selectinload, sessionmaker

from .config import AppConfig, load_config
from .importer import bootstrap_database
from .models import AuditLog, Base, ModuleRecord, PosOrder, PosOrderLine, Product, User
from .registry import (
    BUSINESS_AREA_LABELS,
    BUSINESS_AREA_OPTIONS,
    BUSINESS_AREA_SHORT,
    BUSINESS_AREAS,
    INVENTORY_CATEGORY_LIBRARY,
    JOB_VACANCY_STATUSES,
    MENU_GROUPS,
    MODULES,
    MODULE_TO_LEGACY,
    OCCUPANCY_STATUSES,
    FieldDefinition,
    ModuleDefinition,
    PAYMENT_METHODS,
    ROLE_ACCESS_KEYS,
    ROLE_DESCRIPTIONS,
    STAFF_WORK_ROLE_LABELS,
    STAFF_WORK_ROLES,
    SUITE_NAMES,
    USER_ROLE_LABELS,
    USER_ROLE_OPTIONS,
)

TENANCY_TEMPLATE_PATH = Path(__file__).resolve().parent.parent / "Tenancy_Agreement_Template.docx"
TENANCY_PROPERTY_LOCATION = "Medie New City (Parks and Gardens), Accra, Ghana"
TENANCY_PLACEHOLDER_LINE = "_______________________________"
APARTMENT_ACTIVE_STATUSES = {"Occupied", "Reserved"}
DATABASE_INIT_RETRIES = 1
DATABASE_INIT_DELAY_SECONDS = 1
DATABASE_RETRY_COOLDOWN_SECONDS = 15
SERVICE_PAYMENT_ENTRIES_KEY = "paymentEntries"
SERVICE_ITEM_FIELD_MAP = {
    "laundry_tickets": "laundryItem",
    "equipment_rental_bookings": "equipmentItem",
}
SERVICE_COST_FIELD_MAP = {
    "laundry_tickets": "costAmount",
    "equipment_rental_bookings": "costAmount",
}
SERVICE_LEGACY_PAYMENT_FIELDS = {
    "laundry_tickets": {"amountPaid", "paymentDate", "paymentMethod", "paymentReference"},
    "equipment_rental_bookings": {"amountPaid", "paymentDate", "paymentMethod", "paymentReference"},
}
LOCAL_TIMEZONE = ZoneInfo("Africa/Accra")
PRODUCT_IMAGE_MAX_BYTES = 2 * 1024 * 1024
PRODUCT_IMAGE_ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml",
}
PRODUCT_IMAGE_AREA_COLORS = {
    "water-equipment": "#2f6ea8",
    "cold-store-groceries": "#1f6b5b",
    "laundry-services": "#5f6fd8",
    "mobile-money": "#9a6a19",
    "rentals-apartments": "#8a4f74",
    "fresh-foods-drinks": "#ca5d27",
    "kitchen": "#8e5d23",
    "shared-operations": "#50606f",
}
PUBLIC_JOB_VACANCY_STATUSES = {
    status for status, _label in JOB_VACANCY_STATUSES if status not in {"Draft", "Filled", "Closed"}
}


def build_database_engine(database_url: str):
    engine_options: dict[str, Any] = {"future": True}
    if database_url.startswith("postgresql+psycopg://"):
        engine_options.update(
            pool_pre_ping=True,
            pool_recycle=300,
            pool_timeout=30,
            connect_args={"connect_timeout": 2},
        )
    return create_engine(database_url, **engine_options)


def ensure_schema_columns(engine) -> None:
    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())
    existing_columns = {column["name"] for column in inspector.get_columns("pos_order_lines")} if "pos_order_lines" in table_names else set()
    statements: list[str] = []
    if "pos_order_lines" in table_names and "unit_cost" not in existing_columns:
        statements.append("ALTER TABLE pos_order_lines ADD COLUMN unit_cost FLOAT DEFAULT 0")
    if "pos_order_lines" in table_names and "cost_amount" not in existing_columns:
        statements.append("ALTER TABLE pos_order_lines ADD COLUMN cost_amount FLOAT DEFAULT 0")
    product_columns = set()
    if "products" in table_names:
        product_columns = {column["name"] for column in inspector.get_columns("products")}
    if "products" in table_names and "image_url" not in product_columns:
        statements.append("ALTER TABLE products ADD COLUMN image_url TEXT DEFAULT ''")
    user_columns = set()
    if "app_users" in table_names:
        user_columns = {column["name"] for column in inspector.get_columns("app_users")}
    if "app_users" in table_names and "staff_role" not in user_columns:
        statements.append("ALTER TABLE app_users ADD COLUMN staff_role VARCHAR(100) DEFAULT ''")
    if not statements:
        return
    with engine.begin() as connection:
        for statement in statements:
            connection.exec_driver_sql(statement)


def initialize_database(engine, session_factory, app_config: AppConfig) -> None:
    retries = DATABASE_INIT_RETRIES if app_config.database_url.startswith("postgresql+psycopg://") else 1
    last_error: OperationalError | None = None

    for attempt in range(1, retries + 1):
        try:
            Base.metadata.create_all(engine)
            ensure_schema_columns(engine)
            with session_factory() as bootstrap_session:
                bootstrap_database(bootstrap_session, app_config)
                migrate_planning_workspace(bootstrap_session)
                normalize_product_catalog(bootstrap_session)
                backfill_pos_line_costs(bootstrap_session)
                bootstrap_session.commit()
            session_factory.remove()
            return
        except OperationalError as error:
            session_factory.remove()
            last_error = error
            if attempt >= retries:
                raise
            time.sleep(DATABASE_INIT_DELAY_SECONDS)

    if last_error:
        raise last_error


def inventory_category_map(products: list[Product] | None = None) -> dict[str, list[str]]:
    category_map: dict[str, set[str]] = {
        area_id: set(categories)
        for area_id, categories in INVENTORY_CATEGORY_LIBRARY.items()
    }
    if products:
        for product in products:
            area_id = normalize_text(product.business_area_id)
            category = normalize_text(product.category)
            if not area_id or not category:
                continue
            category_map.setdefault(area_id, set()).add(category)
    return {
        area_id: sorted(values)
        for area_id, values in category_map.items()
        if values
    }


def sku_code_token(value: Any) -> str:
    cleaned = "".join(character if str(character).isalnum() else " " for character in normalize_text(value).upper())
    return " ".join(cleaned.split())


def sku_segment(value: Any, length: int = 3, default: str = "GEN") -> str:
    tokens = [token for token in sku_code_token(value).split() if token]
    if not tokens:
        return default[:length]
    if len(tokens) == 1:
        single = tokens[0][:length]
        return single.ljust(length, "X")
    segment = "".join(token[0] for token in tokens[:length])
    if len(segment) < length:
        for token in tokens:
            remaining = token[1:]
            if not remaining:
                continue
            take = length - len(segment)
            segment += remaining[:take]
            if len(segment) >= length:
                break
    return segment[:length].ljust(length, "X")


def generate_auto_product_sku(*, product_id: str, name: Any, business_area_id: Any, category: Any) -> str:
    area_seed = BUSINESS_AREA_SHORT.get(normalize_text(business_area_id), normalize_text(business_area_id) or "Shared Operations")
    suffix_seed = "".join(character for character in normalize_text(product_id).upper() if character.isalnum()) or uuid4().hex.upper()
    suffix = suffix_seed[-4:].rjust(4, "0")
    return "-".join(
        [
            sku_segment(area_seed, default="ARE"),
            sku_segment(category, default="CAT"),
            sku_segment(name, default="ITM"),
            suffix,
        ]
    )


def ensure_product_sku(product: Product) -> str:
    existing_sku = sku_code_token(product.sku).replace(" ", "-")
    if existing_sku:
        return existing_sku
    return generate_auto_product_sku(
        product_id=product.id,
        name=product.name,
        business_area_id=product.business_area_id,
        category=product.category,
    )


def normalized_product_item_type(item_type: Any, track_inventory: Any = True) -> str:
    clean_item_type = normalize_text(item_type).lower()
    if clean_item_type in {"stock", "service"}:
        return clean_item_type
    return "service" if not bool(track_inventory) else "stock"


def product_tracks_inventory(item_or_type: Product | dict[str, Any] | str | None, track_inventory: Any = True) -> bool:
    if isinstance(item_or_type, Product):
        item_type = item_or_type.item_type
        track_value = item_or_type.track_inventory
    elif isinstance(item_or_type, dict):
        item_type = item_or_type.get("itemType") or item_or_type.get("item_type")
        track_value = item_or_type.get("trackInventory", item_or_type.get("track_inventory", True))
    else:
        item_type = item_or_type
        track_value = track_inventory
    return normalized_product_item_type(item_type, track_value) != "service"


def product_quantity_known(item_or_payload: Product | dict[str, Any]) -> bool:
    if isinstance(item_or_payload, Product):
        return bool(item_or_payload.quantity_known)
    return bool(item_or_payload.get("quantityKnown", item_or_payload.get("quantity_known", True)))


def format_product_stock_badge(item_or_payload: Product | dict[str, Any]) -> str:
    if not product_tracks_inventory(item_or_payload):
        return "Service"
    quantity_value = parse_amount(
        item_or_payload.quantity_on_hand if isinstance(item_or_payload, Product) else item_or_payload.get("quantityOnHand", 0)
    )
    if not product_quantity_known(item_or_payload):
        return "Stock"
    if abs(quantity_value - round(quantity_value)) < 0.001:
        quantity_display = str(int(round(quantity_value)))
    else:
        quantity_display = f"{quantity_value:.2f}".rstrip("0").rstrip(".")
    return f"Stock {quantity_display}"


def normalize_product_record(product: Product) -> bool:
    changed = False
    item_type = normalized_product_item_type(product.item_type, product.track_inventory)
    should_track_inventory = item_type != "service"
    image_url = normalize_text(product.image_url)
    sku_value = ensure_product_sku(product)
    if normalize_text(product.item_type) != item_type:
        product.item_type = item_type
        changed = True
    if bool(product.track_inventory) != should_track_inventory:
        product.track_inventory = should_track_inventory
        changed = True
    if bool(product.quantity_known) != should_track_inventory:
        product.quantity_known = should_track_inventory
        changed = True
    if item_type == "service" and parse_amount(product.quantity_on_hand) != 0:
        product.quantity_on_hand = 0
        changed = True
    if image_url != (product.image_url or ""):
        product.image_url = image_url
        changed = True
    if normalize_text(product.sku) != sku_value:
        product.sku = sku_value
        changed = True
    return changed


def normalize_product_image_value(value: Any) -> str:
    raw = normalize_text(value)
    if not raw:
        return ""
    lowered = raw.lower()
    if lowered.startswith("http://") or lowered.startswith("https://") or lowered.startswith("data:image/"):
        return raw
    raise ValueError("Use a valid image URL or upload an image file.")


def encode_uploaded_product_image(file_storage) -> str:
    if not file_storage or not getattr(file_storage, "filename", ""):
        return ""
    mime_type = normalize_text(getattr(file_storage, "mimetype", "")).lower()
    if mime_type not in PRODUCT_IMAGE_ALLOWED_MIME_TYPES:
        raise ValueError("Upload PNG, JPG, WEBP, GIF, or SVG images only.")
    data = file_storage.read()
    if not data:
        return ""
    if len(data) > PRODUCT_IMAGE_MAX_BYTES:
        raise ValueError("Keep product images under 2 MB each.")
    encoded = base64.b64encode(data).decode("ascii")
    return f"data:{mime_type};base64,{encoded}"


def product_placeholder_svg_payload(name: str, category: str, area_id: str) -> str:
    clean_name = normalize_text(name) or "OneRoot Item"
    clean_category = normalize_text(category) or "Product"
    initials = "".join(part[:1].upper() for part in clean_name.split()[:2]) or "OR"
    accent = PRODUCT_IMAGE_AREA_COLORS.get(normalize_text(area_id), PRODUCT_IMAGE_AREA_COLORS["shared-operations"])
    subtitle = BUSINESS_AREA_SHORT.get(normalize_text(area_id), clean_category) or clean_category
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" role="img" aria-label="{html.escape(clean_name)}">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="{accent}"/>
      <stop offset="100%" stop-color="#f4ede1"/>
    </linearGradient>
  </defs>
  <rect width="320" height="240" rx="28" fill="url(#g)"/>
  <circle cx="248" cy="56" r="38" fill="rgba(255,255,255,0.18)"/>
  <circle cx="68" cy="188" r="56" fill="rgba(255,255,255,0.12)"/>
  <rect x="26" y="28" width="116" height="112" rx="24" fill="rgba(255,255,255,0.20)"/>
  <text x="84" y="96" text-anchor="middle" font-family="Georgia, serif" font-size="48" font-weight="700" fill="#ffffff">{html.escape(initials[:2])}</text>
  <text x="26" y="176" font-family="Arial, sans-serif" font-size="14" letter-spacing="2" fill="rgba(255,255,255,0.92)">{html.escape(subtitle.upper()[:24])}</text>
  <text x="26" y="208" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#ffffff">{html.escape(clean_name[:26])}</text>
  <text x="26" y="228" font-family="Arial, sans-serif" font-size="13" fill="rgba(255,255,255,0.88)">{html.escape(clean_category[:34])}</text>
</svg>"""


def product_image_src(item_or_payload: Product | dict[str, Any]) -> str:
    if isinstance(item_or_payload, Product):
        image_url = normalize_text(item_or_payload.image_url)
        product_id = item_or_payload.id
        name = item_or_payload.name
        category = item_or_payload.category
        area_id = item_or_payload.business_area_id
    else:
        image_url = normalize_text(item_or_payload.get("imageUrl") or item_or_payload.get("image_url"))
        product_id = normalize_text(item_or_payload.get("id"))
        name = normalize_text(item_or_payload.get("name"))
        category = normalize_text(item_or_payload.get("category"))
        area_id = normalize_text(item_or_payload.get("businessAreaId") or item_or_payload.get("business_area_id"))
    if image_url:
        return image_url
    if product_id:
        return url_for("product_placeholder_image", product_id=product_id)
    svg = product_placeholder_svg_payload(name, category, area_id)
    encoded = base64.b64encode(svg.encode("utf-8")).decode("ascii")
    return f"data:image/svg+xml;base64,{encoded}"


PROFIT_SOURCE_LABELS = {
    "manual-sale": "Manual Sales",
    "pos-summary": "POS Counter Sales",
    "online-order-payments": "Online Orders",
    "laundry-payment": "Laundry Payments",
    "equipment-rental-payment": "Equipment Rentals",
    "apartment-rent-payment": "Apartment Rent",
    "apartment-bill-payment": "Apartment Bills",
    "security-deposit-payment": "Security Deposits",
    "tenant-charge-payment": "Tenant Charges",
}


def profit_source_label(value: Any) -> str:
    source_key = normalize_text(value).lower()
    if not source_key:
        return "Unspecified"
    return PROFIT_SOURCE_LABELS.get(source_key, source_key.replace("-", " ").title())


def normalize_text(value: Any) -> str:
    return " ".join(str(value or "").split())


def normalize_phone(value: Any) -> str:
    digits = "".join(character for character in str(value or "") if character.isdigit())
    if digits.startswith("233") and len(digits) == 12:
        return f"0{digits[3:]}"
    return digits


def phone_variants(value: Any) -> set[str]:
    normalized = normalize_phone(value)
    if not normalized:
        return set()
    variants = {normalized}
    if normalized.startswith("0") and len(normalized) == 10:
        variants.add(f"233{normalized[1:]}")
    if normalized.startswith("233") and len(normalized) == 12:
        variants.add(f"0{normalized[3:]}")
    return variants


def phones_match(left: Any, right: Any) -> bool:
    left_variants = phone_variants(left)
    right_variants = phone_variants(right)
    return bool(left_variants and right_variants and left_variants.intersection(right_variants))


def parse_amount(value: Any) -> float:
    try:
        return round(float(value or 0), 2)
    except (TypeError, ValueError):
        return 0.0


def parse_date(value: Any) -> date | None:
    raw = normalize_text(value)
    if not raw:
        return None
    try:
        return date.fromisoformat(raw[:10])
    except ValueError:
        return None


def parse_month(value: Any) -> str:
    raw = normalize_text(value)
    return raw[:7] if len(raw) >= 7 else ""


def parse_time_value(value: Any) -> tuple[int, int] | None:
    raw = normalize_text(value)
    if len(raw) < 4 or ":" not in raw:
        return None
    try:
        hour_text, minute_text = raw[:5].split(":", 1)
        hour = int(hour_text)
        minute = int(minute_text)
    except (TypeError, ValueError):
        return None
    if hour < 0 or hour > 23 or minute < 0 or minute > 59:
        return None
    return hour, minute


def hours_between_times(start_value: Any, end_value: Any, *, break_minutes: float = 0.0) -> float:
    start_parts = parse_time_value(start_value)
    end_parts = parse_time_value(end_value)
    if not start_parts or not end_parts:
        return 0.0
    start_total = start_parts[0] * 60 + start_parts[1]
    end_total = end_parts[0] * 60 + end_parts[1]
    if end_total < start_total:
        end_total += 24 * 60
    minutes = max(end_total - start_total - max(int(parse_amount(break_minutes)), 0), 0)
    return round(minutes / 60, 2)


def minutes_late(scheduled_start: Any, check_in_value: Any) -> int:
    start_parts = parse_time_value(scheduled_start)
    check_in_parts = parse_time_value(check_in_value)
    if not start_parts or not check_in_parts:
        return 0
    start_total = start_parts[0] * 60 + start_parts[1]
    check_in_total = check_in_parts[0] * 60 + check_in_parts[1]
    if check_in_total < start_total:
        check_in_total += 24 * 60
    return max(check_in_total - start_total, 0)


def current_local_datetime() -> datetime:
    return datetime.now(LOCAL_TIMEZONE)


def align_date_to_month(date_value: Any, month_value: Any, fallback_day: int = 5) -> str:
    month_key = parse_month(month_value)
    if not month_key:
        return ""
    try:
        year_text, month_text = month_key.split("-", 1)
        year = int(year_text)
        month_number = int(month_text)
    except (TypeError, ValueError):
        return ""
    base_date = parse_date(date_value)
    day = base_date.day if base_date else max(int(fallback_day), 1)
    day = min(day, calendar.monthrange(year, month_number)[1])
    return date(year, month_number, day).isoformat()


def backfill_pos_line_costs(db_session) -> None:
    lines = db_session.scalars(
        select(PosOrderLine).where(
            or_(
                PosOrderLine.unit_cost == 0,
                PosOrderLine.cost_amount == 0,
            )
        )
    ).all()
    if not lines:
        return

    product_ids = {line.product_id for line in lines if normalize_text(line.product_id)}
    products = {
        product.id: product
        for product in db_session.scalars(select(Product).where(Product.id.in_(product_ids))).all()
    }
    for line in lines:
        product = products.get(line.product_id)
        if not product:
            continue
        if parse_amount(line.unit_cost) <= 0:
            line.unit_cost = round(parse_amount(product.cost_price), 2)
        if parse_amount(line.cost_amount) <= 0:
            line.cost_amount = round(parse_amount(line.quantity) * parse_amount(line.unit_cost), 2)


def normalize_product_catalog(db_session) -> None:
    products = db_session.scalars(select(Product)).all()
    for product in products:
        normalize_product_record(product)


def service_item_field_name(module_key: str) -> str:
    return SERVICE_ITEM_FIELD_MAP.get(module_key, "item")


def service_cost_field_name(module_key: str) -> str:
    return SERVICE_COST_FIELD_MAP.get(module_key, "costAmount")


def service_total_due(module_key: str, payload: dict[str, Any]) -> float:
    if module_key == "laundry_tickets":
        return round(parse_amount(payload.get("amountDue")), 2)
    if module_key == "equipment_rental_bookings":
        return round(parse_amount(payload.get("rentalFee")) + parse_amount(payload.get("damageCharge")), 2)
    return 0.0


def service_cost_amount(module_key: str, payload: dict[str, Any]) -> float:
    return round(parse_amount(payload.get(service_cost_field_name(module_key))), 2)


def laundry_piece_count(payload: dict[str, Any]) -> int:
    pieces = int(round(parse_amount(payload.get("pieces"))))
    return pieces if pieces > 0 else 1


def equipment_rental_days(payload: dict[str, Any]) -> int:
    out_date = parse_date(payload.get("outDate"))
    due_date = parse_date(payload.get("dueDate"))
    if out_date and due_date and due_date >= out_date:
        return max((due_date - out_date).days, 1)
    saved_days = int(round(parse_amount(payload.get("rentalDays"))))
    return saved_days if saved_days > 0 else 1


def service_pricing_multiplier(module_key: str, payload: dict[str, Any]) -> float:
    if module_key == "laundry_tickets":
        pieces = laundry_piece_count(payload)
        payload["pieces"] = pieces
        return float(pieces)
    if module_key == "equipment_rental_bookings":
        rental_days = equipment_rental_days(payload)
        payload["rentalDays"] = rental_days
        return float(rental_days)
    return 1.0


def service_reference_products(db_session, module_key: str) -> list[Product]:
    service_area = SERVICE_MODULE_AREA_IDS.get(module_key, "")
    if not service_area:
        return []
    return db_session.scalars(
        select(Product)
        .where(Product.business_area_id == service_area, Product.active.is_(True))
        .order_by(Product.name.asc())
    ).all()


def match_service_reference_product(products: list[Product], item_name: str) -> Product | None:
    normalized_item_name = normalize_text(item_name).lower()
    if not normalized_item_name:
        return None
    return next((product for product in products if normalize_text(product.name).lower() == normalized_item_name), None)


def service_payment_entries(module_key: str, payload: dict[str, Any]) -> list[dict[str, Any]]:
    raw_entries = payload.get(SERVICE_PAYMENT_ENTRIES_KEY) if isinstance(payload.get(SERVICE_PAYMENT_ENTRIES_KEY), list) else []
    entries: list[dict[str, Any]] = []
    for raw_entry in raw_entries:
        if not isinstance(raw_entry, dict):
            continue
        amount_paid = round(parse_amount(raw_entry.get("amountPaid")), 2)
        if amount_paid <= 0:
            continue
        entries.append(
            {
                "id": normalize_text(raw_entry.get("id")) or uuid4().hex,
                "amountPaid": amount_paid,
                "paymentDate": normalize_text(raw_entry.get("paymentDate")),
                "paymentMethod": normalize_text(raw_entry.get("paymentMethod")),
                "paymentReference": normalize_text(raw_entry.get("paymentReference")),
                "receivedBy": normalize_text(raw_entry.get("receivedBy")),
                "notes": normalize_text(raw_entry.get("notes")),
                "createdAt": normalize_text(raw_entry.get("createdAt")),
                "isLegacy": False,
            }
        )

    if entries:
        entries.sort(
            key=lambda item: (
                normalize_text(item.get("paymentDate")) or "9999-12-31",
                normalize_text(item.get("createdAt")) or "",
                normalize_text(item.get("id")) or "",
            )
        )
        return entries

    legacy_amount = round(parse_amount(payload.get("amountPaid")), 2)
    if legacy_amount <= 0:
        return []
    return [
        {
            "id": "legacy",
            "amountPaid": legacy_amount,
            "paymentDate": normalize_text(payload.get("paymentDate")),
            "paymentMethod": normalize_text(payload.get("paymentMethod")),
            "paymentReference": normalize_text(payload.get("paymentReference")),
            "receivedBy": normalize_text(payload.get("receivedBy")),
            "notes": "Imported from the earlier single-payment service capture.",
            "createdAt": normalize_text(payload.get("updatedAt")) or normalize_text(payload.get("createdAt")),
            "isLegacy": True,
        }
    ]


def service_payment_summary(module_key: str, payload: dict[str, Any]) -> dict[str, Any]:
    payments = service_payment_entries(module_key, payload)
    total_due = service_total_due(module_key, payload)
    total_cost = service_cost_amount(module_key, payload)
    paid_total = 0.0
    cost_recognized_total = 0.0
    balance = total_due
    rows: list[dict[str, Any]] = []

    for payment in payments:
        paid_amount = round(parse_amount(payment.get("amountPaid")), 2)
        prior_paid = paid_total
        paid_total = round(paid_total + paid_amount, 2)
        if total_due > 0 and total_cost > 0:
            prior_cost = round(total_cost * min(prior_paid / total_due, 1), 2)
            running_cost = round(total_cost * min(paid_total / total_due, 1), 2)
            payment_cost = round(max(running_cost - prior_cost, 0), 2)
        else:
            payment_cost = 0.0
        cost_recognized_total = round(cost_recognized_total + payment_cost, 2)
        payment_profit = round(paid_amount - payment_cost, 2)
        balance = round(max(total_due - paid_total, 0), 2)
        rows.append(
            {
                **payment,
                "costAmount": payment_cost,
                "profitAmount": payment_profit,
                "balanceAfter": balance,
            }
        )

    return {
        "payments": rows,
        "paidTotal": round(paid_total, 2),
        "costRecognized": round(cost_recognized_total, 2),
        "profitRecognized": round(sum(parse_amount(entry.get("profitAmount")) for entry in rows), 2),
        "balance": round(max(total_due - paid_total, 0), 2),
        "totalDue": round(total_due, 2),
        "totalCost": round(total_cost, 2),
    }


def apply_service_payment_rollup(module_key: str, payload: dict[str, Any]) -> None:
    summary = service_payment_summary(module_key, payload)
    last_payment = summary["payments"][-1] if summary["payments"] else {}
    payload["amountPaid"] = summary["paidTotal"]
    payload["paymentDate"] = normalize_text(last_payment.get("paymentDate"))
    payload["paymentMethod"] = normalize_text(last_payment.get("paymentMethod"))
    payload["paymentReference"] = normalize_text(last_payment.get("paymentReference"))


def hydrate_service_cost_payload(db_session, module_key: str, payload: dict[str, Any]) -> None:
    cost_field = service_cost_field_name(module_key)
    multiplier = service_pricing_multiplier(module_key, payload)
    item_name = normalize_text(payload.get(service_item_field_name(module_key)))
    if not item_name:
        return
    products = service_reference_products(db_session, module_key)
    match = match_service_reference_product(products, item_name)
    if not match:
        return
    payload[cost_field] = round(parse_amount(match.cost_price) * multiplier, 2)
    if module_key == "laundry_tickets":
        payload["amountDue"] = round(parse_amount(match.sales_price) * multiplier, 2)
        if normalize_text(match.category):
            payload["serviceCategory"] = normalize_text(match.category)
    elif module_key == "equipment_rental_bookings":
        payload["rentalFee"] = round(parse_amount(match.sales_price) * multiplier, 2)
        if normalize_text(match.category):
            payload["equipmentCategory"] = normalize_text(match.category)


def sales_cost_amount(payload: dict[str, Any]) -> float:
    return round(parse_amount(payload.get("costAmount")), 2)


def sales_profit_amount(payload: dict[str, Any]) -> float:
    amount = round(parse_amount(payload.get("amount")), 2)
    cost_amount = sales_cost_amount(payload)
    profit_amount = round(parse_amount(payload.get("profitAmount")), 2)
    if profit_amount or normalize_text(payload.get("profitAmount")):
        return profit_amount
    if amount <= 0:
        return 0.0
    source_type = normalize_text(payload.get("sourceType")).lower()
    if source_type in {"manual-sale", "pos-summary", "online-order-payments", "laundry-payment", "equipment-rental-payment"}:
        return round(amount - cost_amount, 2)
    return 0.0


def module_record_profit_amount(record: ModuleRecord) -> float:
    if record.module_key != "sales":
        return 0.0
    return sales_profit_amount(record.payload or {})


def module_record_cost_amount(record: ModuleRecord) -> float:
    if record.module_key != "sales":
        return 0.0
    return sales_cost_amount(record.payload or {})


def salary_rollup(payload: dict[str, Any]) -> None:
    base_salary = parse_amount(payload.get("baseSalary"))
    allowance = parse_amount(payload.get("allowance"))
    bonus = parse_amount(payload.get("bonus"))
    overtime_hours = parse_amount(payload.get("overtimeHours"))
    overtime_rate = parse_amount(payload.get("overtimeRate"))
    overtime_pay = parse_amount(payload.get("overtimePay"))
    if overtime_hours > 0 and overtime_rate > 0:
        overtime_pay = round(overtime_hours * overtime_rate, 2)
    payload["overtimePay"] = round(overtime_pay, 2)
    gross_pay = round(base_salary + allowance + bonus + overtime_pay, 2)
    payload["grossPay"] = gross_pay
    total_deductions = round(
        parse_amount(payload.get("taxAmount"))
        + parse_amount(payload.get("ssnitAmount"))
        + parse_amount(payload.get("loanDeduction"))
        + parse_amount(payload.get("deductions")),
        2,
    )
    payload["totalDeductions"] = total_deductions
    net_pay = round(max(gross_pay - total_deductions, 0), 2)
    payload["netPay"] = net_pay
    amount_paid = round(parse_amount(payload.get("amountPaid")), 2)
    payload["balanceDue"] = round(max(net_pay - amount_paid, 0), 2)
    payload["status"] = salary_payment_status(payload)


def salary_payment_status(payload: dict[str, Any]) -> str:
    net_pay = round(parse_amount(payload.get("netPay")), 2)
    amount_paid = round(parse_amount(payload.get("amountPaid")), 2)
    if net_pay > 0 and amount_paid >= net_pay:
        return "Paid"
    if amount_paid > 0:
        return "Part Paid"
    return "Pending"


def salary_open_balance(payload: dict[str, Any]) -> float:
    salary_rollup(payload)
    return round(max(parse_amount(payload.get("balanceDue")), 0), 2)


def salary_cost_for_reporting(payload: dict[str, Any]) -> float:
    salary_rollup(payload)
    gross_pay = parse_amount(payload.get("grossPay"))
    return gross_pay if gross_pay > 0 else parse_amount(payload.get("amountPaid"))


def months_between(start_date: date | None, end_date: date | None) -> int:
    if not start_date or not end_date or end_date < start_date:
        return 0
    months = (end_date.year - start_date.year) * 12 + (end_date.month - start_date.month)
    if end_date.day < start_date.day:
        months -= 1
    return max(months, 0)


def add_months(base_date: date, months: int) -> date:
    month_index = base_date.month - 1 + max(months, 0)
    year = base_date.year + month_index // 12
    month_number = month_index % 12 + 1
    day = min(base_date.day, calendar.monthrange(year, month_number)[1])
    return date(year, month_number, day)


def month_end_date(month_value: str) -> date | None:
    month_key = parse_month(month_value)
    if not month_key:
        return None
    try:
        year_text, month_text = month_key.split("-", 1)
        year = int(year_text)
        month_number = int(month_text)
    except (TypeError, ValueError):
        return None
    return date(year, month_number, calendar.monthrange(year, month_number)[1])


def asset_rollup(payload: dict[str, Any]) -> None:
    purchase_cost = parse_amount(payload.get("purchaseCost"))
    salvage_value = max(parse_amount(payload.get("salvageValue")), 0)
    existing_current_value = parse_amount(payload.get("currentValue"))
    useful_life_months = int(parse_amount(payload.get("usefulLifeMonths")))
    depreciation_method = normalize_text(payload.get("depreciationMethod")) or "Straight Line"
    acquired_date = parse_date(payload.get("acquiredDate"))
    today = date.today()
    if acquired_date and acquired_date > today:
        payload["monthlyDepreciation"] = 0.0
        payload["annualDepreciation"] = 0.0
        payload["accumulatedDepreciation"] = 0.0
        payload["currentValue"] = round(purchase_cost or existing_current_value, 2)
        if acquired_date and useful_life_months > 0:
            payload["replacementDueDate"] = add_months(acquired_date, useful_life_months).isoformat()
        return
    months_elapsed = months_between(acquired_date, today)
    depreciable_base = max(purchase_cost - salvage_value, 0)

    monthly_depreciation = 0.0
    accumulated = 0.0
    if useful_life_months > 0 and depreciable_base > 0:
        if depreciation_method == "Reducing Balance":
            straight_rate = depreciable_base / useful_life_months
            monthly_rate = (straight_rate / purchase_cost) if purchase_cost > 0 else 0
            current_value = purchase_cost
            for _ in range(min(months_elapsed, useful_life_months)):
                reduction = round(current_value * monthly_rate, 2)
                floor_value = salvage_value
                if current_value - reduction < floor_value:
                    reduction = max(current_value - floor_value, 0)
                current_value = round(current_value - reduction, 2)
                accumulated += reduction
            monthly_depreciation = round(purchase_cost * monthly_rate, 2) if monthly_rate > 0 else 0.0
        else:
            monthly_depreciation = round(depreciable_base / useful_life_months, 2)
            accumulated = round(min(monthly_depreciation * months_elapsed, depreciable_base), 2)
    current_value = round(max(purchase_cost - accumulated, salvage_value if purchase_cost > 0 else existing_current_value), 2)
    payload["monthlyDepreciation"] = monthly_depreciation
    payload["annualDepreciation"] = round(monthly_depreciation * 12, 2)
    payload["accumulatedDepreciation"] = round(accumulated, 2)
    payload["currentValue"] = current_value
    if acquired_date and useful_life_months > 0:
        payload["replacementDueDate"] = add_months(acquired_date, useful_life_months).isoformat()


def asset_depreciation_charge_for_month(payload: dict[str, Any], month_value: str) -> float:
    month_end = month_end_date(month_value)
    if not month_end:
        return 0.0
    acquired_date = parse_date(payload.get("acquiredDate"))
    if acquired_date and acquired_date > month_end:
        return 0.0
    status = normalize_text(payload.get("status"))
    if status in {"Retired", "Sold"}:
        return 0.0
    asset_rollup(payload)
    return round(parse_amount(payload.get("monthlyDepreciation")), 2)


def maintenance_rollup(payload: dict[str, Any]) -> None:
    generated_id = normalize_text(payload.get("id"))[:6].upper() or "WORK"
    reported_date = parse_date(payload.get("reportedDate")) or date.today()
    if not normalize_text(payload.get("workOrderNumber")):
        payload["workOrderNumber"] = f"WO-{reported_date.strftime('%Y%m%d')}-{generated_id}"
    rolled_cost = round(
        parse_amount(payload.get("laborCost"))
        + parse_amount(payload.get("partsCost"))
        + parse_amount(payload.get("otherCost")),
        2,
    )
    if rolled_cost > 0 or not normalize_text(payload.get("actualCost")):
        payload["actualCost"] = rolled_cost
    if parse_date(payload.get("completedDate")):
        payload["status"] = "Completed"
    elif normalize_text(payload.get("status")) == "Completed":
        payload["completedDate"] = payload.get("completedDate") or date.today().isoformat()
    elif parse_date(payload.get("scheduledDate")) and normalize_text(payload.get("status")) == "Open":
        payload["status"] = "Scheduled"


def knowledge_rollup(payload: dict[str, Any]) -> None:
    pass_score = parse_amount(payload.get("passScore"))
    actual_score = parse_amount(payload.get("actualScore"))
    completion_percent = parse_amount(payload.get("completionPercent"))
    if pass_score > 0 and actual_score > 0:
        completion_percent = round(min((actual_score / pass_score) * 100, 100), 2)
    elif parse_date(payload.get("completionDate")):
        completion_percent = 100.0
    payload["completionPercent"] = round(max(completion_percent, 0), 2)

    explicit_status = normalize_text(payload.get("status"))
    if explicit_status in {"Archived", "Under Review"}:
        return
    if parse_date(payload.get("completionDate")) or payload["completionPercent"] >= 100:
        payload["status"] = "Completed"
    elif (due_date := parse_date(payload.get("dueDate"))) and due_date <= date.today():
        payload["status"] = "Training Due"
    elif normalize_text(payload.get("title")):
        payload["status"] = "Active"
    else:
        payload["status"] = explicit_status or "Draft"


def workforce_rollup(payload: dict[str, Any]) -> None:
    break_minutes = parse_amount(payload.get("breakMinutes"))
    scheduled_hours = hours_between_times(payload.get("shiftStart"), payload.get("shiftEnd"), break_minutes=break_minutes)
    worked_hours = hours_between_times(payload.get("checkInTime"), payload.get("checkOutTime"), break_minutes=break_minutes)
    late_minutes = minutes_late(payload.get("shiftStart"), payload.get("checkInTime"))
    payload["scheduledHours"] = scheduled_hours
    payload["workedHours"] = worked_hours
    payload["overtimeHours"] = round(max(worked_hours - scheduled_hours, 0), 2)
    payload["lateMinutes"] = late_minutes

    explicit_status = normalize_text(payload.get("attendanceStatus"))
    if explicit_status == "Off Duty":
        return
    if parse_time_value(payload.get("checkOutTime")):
        payload["attendanceStatus"] = "Checked Out"
    elif parse_time_value(payload.get("checkInTime")):
        payload["attendanceStatus"] = "Late" if late_minutes > 0 else "Present"
    elif explicit_status in {"Absent", "Scheduled"}:
        payload["attendanceStatus"] = explicit_status
    elif parse_time_value(payload.get("shiftStart")):
        payload["attendanceStatus"] = "Scheduled"
    else:
        payload["attendanceStatus"] = explicit_status or "Scheduled"


def password_hash(password: str) -> str:
    return f"sha256:{hashlib.sha256(password.encode('utf-8')).hexdigest()}"


def verify_password(raw_password: str, stored_hash: str) -> bool:
    stored = normalize_text(stored_hash)
    candidate = normalize_text(raw_password)
    if not stored or not candidate:
        return False
    if stored.startswith("sha256:"):
        return password_hash(candidate) == stored
    return stored == candidate


def normalize_role_key(value: Any) -> str:
    raw = normalize_text(value).strip().lower().replace("_", "-")
    role_aliases = {
        "owner": "owner",
        "admin": "admin",
        "finance": "finance",
        "operations": "operations",
        "apartment-manager": "apartment-manager",
        "apartment manager": "apartment-manager",
        "sales-stock-operator": "sales-stock-operator",
        "sales & stock operator": "sales-stock-operator",
        "sales and stock operator": "sales-stock-operator",
        "cashier": "cashier",
        "viewer": "viewer",
    }
    return role_aliases.get(raw, "viewer")


def role_label(value: Any) -> str:
    return USER_ROLE_LABELS.get(normalize_role_key(value), "Viewer")


def default_staff_role_for_access_role(value: Any) -> str:
    role_key = normalize_role_key(value)
    role_map = {
        "owner": "Manager",
        "admin": "Manager",
        "finance": "Finance Officer",
        "operations": "Manager",
        "apartment-manager": "Apartment Manager",
        "sales-stock-operator": "Stock Officer",
        "cashier": "Cashier",
        "viewer": "Support Staff",
    }
    return role_map.get(role_key, "Support Staff")


def normalize_staff_role(value: Any, *, fallback_role: Any = "viewer") -> str:
    raw = normalize_text(value)
    if raw in STAFF_WORK_ROLE_LABELS:
        return raw
    normalized = raw.lower()
    for option_value, option_label in STAFF_WORK_ROLES:
        if normalized in {option_value.lower(), option_label.lower()}:
            return option_value
    return default_staff_role_for_access_role(fallback_role)


def staff_role_label(value: Any, *, fallback_role: Any = "viewer") -> str:
    return normalize_staff_role(value, fallback_role=fallback_role)


def access_keys_for_role(value: Any) -> set[str]:
    return set(ROLE_ACCESS_KEYS.get(normalize_role_key(value), ROLE_ACCESS_KEYS["viewer"]))


def user_access_keys(user: User | None) -> set[str]:
    if not user:
        return set()
    return access_keys_for_role(getattr(user, "role", "viewer"))


def user_has_access(user: User | None, key: str) -> bool:
    return key in user_access_keys(user)


def build_chart_rows(
    items: list[dict[str, Any]],
    *,
    label_key: str,
    value_key: str,
    short_key: str | None = None,
    positive_color: str = "var(--green)",
) -> list[dict[str, Any]]:
    normalized_rows: list[dict[str, Any]] = []
    for item in items:
        label = normalize_text(item.get(label_key))
        if not label:
            continue
        value = round(parse_amount(item.get(value_key)), 2)
        short_label = normalize_text(item.get(short_key)) if short_key else label
        normalized_rows.append(
            {
                **item,
                "chartLabel": label,
                "chartShort": short_label or label,
                "chartValue": value,
            }
        )

    if not normalized_rows:
        return []

    max_value = max(abs(row["chartValue"]) for row in normalized_rows) or 1.0
    for row in normalized_rows:
        row["chartWidth"] = round((abs(row["chartValue"]) / max_value) * 100, 2) if max_value else 0
        row["chartNegative"] = row["chartValue"] < 0
        row["chartColor"] = "var(--danger)" if row["chartNegative"] else positive_color
    return normalized_rows


def module_amount_label(definition: ModuleDefinition) -> str:
    return {
        "salary_records": "Gross Pay",
        "knowledge_base": "Progress",
        "workforce_attendance": "Worked Hours",
        "job_vacancies": "Openings",
    }.get(definition.key, "Amount")


def format_module_amount(definition: ModuleDefinition, value: Any) -> str:
    amount = round(parse_amount(value), 2)
    if definition.key == "knowledge_base":
        return f"{amount:.0f}%"
    if definition.key == "workforce_attendance":
        return f"{amount:,.2f} hrs"
    if definition.key == "job_vacancies":
        return f"{amount:.0f}"
    return format_currency(amount)


SIDEBAR_LINK_LABELS = {
    "dashboard": ("Dashboard", "dashboard", None),
    "profits": ("Profit Center", "profits_page", None),
    "category_performance": ("Category Performance", "category_performance_page", None),
    "reports": ("Management Reporting", "reports_page", None),
    "search": ("Global Search", "search_page", None),
    "inventory": ("Inventory", "inventory", None),
    "pos": ("POS", "pos_page", None),
    "workbook": ("Excel Workbook", "download_workbook", None),
    "audit": ("Audit Trail", "audit_page", None),
    "online_orders": ("Online Orders", "online_orders_desk", None),
    "users": ("User Accounts", "users_page", None),
}

MODULE_FILTER_CATEGORY_FIELDS = {
    "expenses": "category",
    "petty_cash": "transactionTypeId",
    "cashbook_entries": "entryType",
    "laundry_tickets": "serviceCategory",
    "equipment_rental_bookings": "equipmentCategory",
    "mobile_money_reconciliations": "provider",
    "suppliers": "category",
    "asset_records": "assetCategory",
    "salary_records": "staffRole",
    "maintenance_records": "workOrderType",
    "forecast_plans": "planType",
    "customer_crm": "customerSegment",
    "promotions": "promotionType",
    "whatsapp_campaigns": "channelType",
    "campaign_roi": "channelType",
    "delivery_dispatch": "dispatchType",
    "recurring_controls": "category",
    "knowledge_base": "entryType",
    "workforce_attendance": "shiftType",
    "job_vacancies": "employmentType",
}

MODULE_FILTER_CATEGORY_LABELS = {
    "category": "Category",
    "transactionTypeId": "Transaction Type",
    "entryType": "Entry Type",
    "serviceType": "Service Type",
    "serviceCategory": "Laundry Category",
    "equipmentItem": "Equipment Item",
    "equipmentCategory": "Rental Category",
    "provider": "Provider",
    "assetCategory": "Asset Category",
    "staffRole": "Staff Role",
    "workOrderType": "Work Order Type",
    "planType": "Plan Type",
    "customerSegment": "Customer Segment",
    "promotionType": "Promotion Type",
    "channelType": "Channel",
    "dispatchType": "Dispatch Type",
    "entryType": "Entry Type",
    "shiftType": "Shift Type",
    "employmentType": "Employment Type",
    "status": "Status",
}

SERVICE_MODULE_AREA_IDS = {
    "laundry_tickets": "laundry-services",
    "equipment_rental_bookings": "water-equipment",
}

SERVICE_MODULE_SECTIONS = {
    "laundry_tickets": [
        (
            "Ticket Intake",
            "Capture the customer, speed, and laundry category first so the front desk can issue the job quickly.",
            ["ticketDate", "customerName", "customerPhone", "serviceType", "serviceCategory", "deliveryMode"],
        ),
        (
            "Items & Pricing",
            "Select the laundry item and pieces so amount due and service cost can auto-calculate from the saved catalog.",
            ["laundryItem", "itemSummary", "pieces", "amountDue", "costAmount"],
        ),
        (
            "Promise & Completion",
            "Track when the job is due, when it is ready, and the current delivery status.",
            ["dueDate", "readyDate", "status", "notes"],
        ),
    ],
    "equipment_rental_bookings": [
        (
            "Booking Intake",
            "Record the renter, rental category, and exact item so staff can hand over the right equipment fast.",
            ["bookingDate", "customerName", "customerPhone", "equipmentCategory", "equipmentItem", "reference"],
        ),
        (
            "Charges & Payment",
            "Select the equipment and rental days so the rental fee and service cost can auto-calculate from the saved catalog.",
            ["rentalDays", "rentalFee", "costAmount", "depositAmount", "damageCharge"],
        ),
        (
            "Movement & Return",
            "Track when the item goes out, when it is due back, and how it returns.",
            ["outDate", "dueDate", "returnDate", "conditionOut", "conditionIn", "status", "notes"],
        ),
    ],
}


def module_has_field(definition: ModuleDefinition, field_name: str) -> bool:
    return any(field.name == field_name for field in definition.fields)


def module_filter_category_field(definition: ModuleDefinition) -> str:
    return MODULE_FILTER_CATEGORY_FIELDS.get(definition.key, "category" if module_has_field(definition, "category") else "")


def module_filter_category_label(definition: ModuleDefinition) -> str:
    field_name = module_filter_category_field(definition)
    return MODULE_FILTER_CATEGORY_LABELS.get(field_name, "Category")


def module_record_date_value(definition: ModuleDefinition, record: ModuleRecord) -> date | None:
    if record.record_date:
        return record.record_date
    if definition.date_field:
        parsed = parse_date((record.payload or {}).get(definition.date_field))
        if parsed:
            return parsed
    if definition.month_field:
        month_key = normalize_text((record.payload or {}).get(definition.month_field)) or normalize_text(record.month)
        if month_key:
            return parse_date(f"{month_key}-01")
    return None


def module_record_month_value(definition: ModuleDefinition, record: ModuleRecord) -> str:
    if record.month:
        return normalize_text(record.month)
    if definition.month_field:
        month_key = normalize_text((record.payload or {}).get(definition.month_field))
        if month_key:
            return month_key
    record_date = module_record_date_value(definition, record)
    return record_date.strftime("%Y-%m") if record_date else ""


def module_record_category_value(definition: ModuleDefinition, record: ModuleRecord) -> str:
    payload = record.payload or {}
    category_field = module_filter_category_field(definition)
    if category_field:
        return normalize_text(payload.get(category_field))
    return ""


def module_record_open_balance(definition: ModuleDefinition, payload: dict[str, Any]) -> float:
    if definition.key == "laundry_tickets":
        return service_payment_summary(definition.key, payload)["balance"]
    if definition.key == "equipment_rental_bookings":
        return service_payment_summary(definition.key, payload)["balance"]
    if definition.key == "salary_records":
        return salary_open_balance(payload)
    if definition.key == "suppliers":
        return round(max(parse_amount(payload.get("amountDue")) - parse_amount(payload.get("amountPaid")), 0), 2)
    if definition.key == "security_deposit_records":
        return round(max(parse_amount(payload.get("chargesRaised")) - parse_amount(payload.get("chargesPaid")), 0), 2)
    return 0.0


def is_pos_eligible_product(product: Product) -> bool:
    area_id = normalize_text(product.business_area_id)
    item_type = normalized_product_item_type(product.item_type, product.track_inventory)
    if area_id == "laundry-services":
        return False
    if area_id == "water-equipment" and item_type == "service":
        return False
    return bool(product.active)


def load_pos_products(
    db_session,
    *,
    area_filter: str = "",
    category_filter: str = "",
    search: str = "",
) -> list[Product]:
    products = db_session.scalars(
        select(Product).where(Product.active.is_(True)).order_by(Product.business_area_id.asc(), Product.category.asc(), Product.name.asc())
    ).all()
    query_text = normalize_text(search).lower()
    filtered_products: list[Product] = []
    for product in products:
        normalize_product_record(product)
        if not is_pos_eligible_product(product):
            continue
        if area_filter and normalize_text(product.business_area_id) != area_filter:
            continue
        if category_filter and normalize_text(product.category) != category_filter:
            continue
        if query_text:
            haystack = " ".join(
                [
                    normalize_text(product.name),
                    normalize_text(product.sku),
                    normalize_text(product.barcode),
                    normalize_text(product.category),
                    normalize_text(product.business_area_id),
                ]
            ).lower()
            if query_text not in haystack:
                continue
        filtered_products.append(product)
    return filtered_products


def pos_business_area_options() -> list[tuple[str, str]]:
    return [(value, label) for value, label in BUSINESS_AREA_OPTIONS if value != "laundry-services"]


def service_module_field_sections(definition: ModuleDefinition) -> list[dict[str, Any]]:
    field_map = {field.name: field for field in definition.fields}
    sections = []
    for title, description, field_names in SERVICE_MODULE_SECTIONS.get(definition.key, []):
        sections.append(
            {
                "title": title,
                "description": description,
                "fields": [field_map[name] for name in field_names if name in field_map],
            }
        )
    return sections


def build_laundry_service_rows(records: list[ModuleRecord]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    today = date.today()
    for record in records:
        payload = record.payload or {}
        payment_summary = service_payment_summary("laundry_tickets", payload)
        amount_due = payment_summary["totalDue"]
        amount_paid = payment_summary["paidTotal"]
        balance = payment_summary["balance"]
        status = normalize_text(payload.get("status")) or "Received"
        due_date = parse_date(payload.get("dueDate"))
        ready_date = parse_date(payload.get("readyDate"))
        laundry_item = normalize_text(payload.get("laundryItem"))
        item_detail = normalize_text(payload.get("itemSummary"))
        item_summary = laundry_item or item_detail or "Laundry Job"
        if item_detail == item_summary:
            item_detail = ""
        pieces = int(parse_amount(payload.get("pieces"))) if parse_amount(payload.get("pieces")) else 0
        rows.append(
            {
                "record": record,
                "id": record.id,
                "customerName": normalize_text(payload.get("customerName")) or record.title or "Walk-in Customer",
                "customerPhone": normalize_phone(payload.get("customerPhone")),
                "serviceType": normalize_text(payload.get("serviceType")) or "Normal",
                "serviceCategory": normalize_text(payload.get("serviceCategory")) or "General Items",
                "laundryItem": laundry_item,
                "itemSummary": item_summary,
                "itemDetail": item_detail,
                "pieces": pieces,
                "ticketDate": parse_date(payload.get("ticketDate")),
                "dueDate": due_date,
                "readyDate": ready_date,
                "deliveryMode": normalize_text(payload.get("deliveryMode")) or "Walk-in",
                "status": status,
                "amountDue": amount_due,
                "amountPaid": amount_paid,
                "costAmount": payment_summary["totalCost"],
                "profitAmount": payment_summary["profitRecognized"],
                "unitRate": round(amount_due / pieces, 2) if pieces > 0 else amount_due,
                "paymentCount": len(payment_summary["payments"]),
                "latestPaymentDate": payment_summary["payments"][-1]["paymentDate"] if payment_summary["payments"] else "",
                "payments": payment_summary["payments"],
                "balance": balance,
                "isReady": status == "Ready",
                "isDelivered": status == "Delivered",
                "isOverdue": bool(balance > 0 and due_date and due_date < today and status not in {"Delivered", "Cancelled"}),
                "isDueToday": bool(balance > 0 and due_date == today and status not in {"Delivered", "Cancelled"}),
            }
        )
    return rows


def build_equipment_service_rows(records: list[ModuleRecord]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    today = date.today()
    for record in records:
        payload = record.payload or {}
        rental_fee = round(parse_amount(payload.get("rentalFee")), 2)
        payment_summary = service_payment_summary("equipment_rental_bookings", payload)
        amount_paid = payment_summary["paidTotal"]
        deposit_amount = round(parse_amount(payload.get("depositAmount")), 2)
        damage_charge = round(parse_amount(payload.get("damageCharge")), 2)
        billed_total = round(rental_fee + damage_charge, 2)
        balance = payment_summary["balance"]
        status = normalize_text(payload.get("status")) or "Booked"
        rental_days = equipment_rental_days(payload)
        due_date = parse_date(payload.get("dueDate"))
        return_date = parse_date(payload.get("returnDate"))
        rows.append(
            {
                "record": record,
                "id": record.id,
                "equipmentItem": normalize_text(payload.get("equipmentItem")) or record.title or "Equipment Rental",
                "equipmentCategory": normalize_text(payload.get("equipmentCategory")) or "Construction Support",
                "customerName": normalize_text(payload.get("customerName")) or "Customer",
                "customerPhone": normalize_phone(payload.get("customerPhone")),
                "bookingDate": parse_date(payload.get("bookingDate")),
                "outDate": parse_date(payload.get("outDate")),
                "dueDate": due_date,
                "returnDate": return_date,
                "reference": normalize_text(payload.get("reference")),
                "status": status,
                "rentalDays": rental_days,
                "rentalFee": rental_fee,
                "damageCharge": damage_charge,
                "depositAmount": deposit_amount,
                "amountPaid": amount_paid,
                "costAmount": payment_summary["totalCost"],
                "profitAmount": payment_summary["profitRecognized"],
                "dailyRate": round(rental_fee / rental_days, 2) if rental_days > 0 else rental_fee,
                "totalDue": billed_total,
                "paymentCount": len(payment_summary["payments"]),
                "latestPaymentDate": payment_summary["payments"][-1]["paymentDate"] if payment_summary["payments"] else "",
                "payments": payment_summary["payments"],
                "balance": balance,
                "isOut": status == "Out",
                "isDueToday": bool(status in {"Booked", "Out"} and due_date == today and not return_date),
                "isOverdue": bool(status == "Out" and due_date and due_date < today and not return_date),
            }
        )
    return rows


def build_service_module_context(definition: ModuleDefinition, rows: list[dict[str, Any]]) -> dict[str, Any]:
    if definition.key == "laundry_tickets":
        status_counts: dict[str, int] = defaultdict(int)
        category_counts: dict[str, int] = defaultdict(int)
        for row in rows:
            status_counts[row["status"]] += 1
            category_counts[row["serviceCategory"]] += 1
        status_chart = build_chart_rows(
            [{"label": status, "short": status, "amount": count} for status, count in sorted(status_counts.items()) if count > 0],
            label_key="label",
            value_key="amount",
            short_key="short",
            positive_color="var(--accent)",
        )
        type_chart = build_chart_rows(
            [{"label": name, "short": name, "amount": count} for name, count in sorted(category_counts.items()) if count > 0],
            label_key="label",
            value_key="amount",
            short_key="short",
        )
        return {
            "intro": "Capture each laundry request first, then record each collection separately so balances, daily sales, and realized profit stay aligned.",
            "cards": [
                {"label": "Tickets In View", "value": f"{len(rows)}", "note": "Filtered laundry jobs"},
                {"label": "Ready For Pickup", "value": f"{sum(1 for row in rows if row['isReady'])}", "note": "Jobs marked ready"},
                {"label": "Open Balance", "value": format_currency(sum(row["balance"] for row in rows)), "note": "Unpaid laundry still open"},
                {"label": "Collected Profit", "value": format_currency(sum(row["profitAmount"] for row in rows)), "note": "Profit recognized from captured payments"},
            ],
            "statusChart": status_chart,
            "mixChart": type_chart,
            "mixEyebrow": "Laundry Category Mix",
            "mixTitle": "Most Common Laundry Work",
            "watchTitle": "Laundry Attention Queue",
            "watchItems": [
                row for row in rows if row["isOverdue"] or row["isDueToday"] or row["isReady"]
            ][:10],
            "table": {
                "primaryHeading": "Customer",
                "secondaryHeading": "Laundry Item",
                "dateHeading": "Ticket Date",
                "eventHeading": "Due / Ready",
                "amountHeading": "Due / Paid / Balance",
            },
        }

    status_counts: dict[str, int] = defaultdict(int)
    category_counts: dict[str, int] = defaultdict(int)
    for row in rows:
        status_counts[row["status"]] += 1
        category_counts[row["equipmentCategory"]] += 1
    return {
        "intro": "Track every rental from booking to return, then post payments separately so sales and realized profit only move when the customer pays.",
        "cards": [
            {"label": "Bookings In View", "value": f"{len(rows)}", "note": "Filtered rental bookings"},
            {"label": "Equipment Out", "value": f"{sum(1 for row in rows if row['isOut'])}", "note": "Currently out with customers"},
            {"label": "Open Balance", "value": format_currency(sum(row["balance"] for row in rows)), "note": "Outstanding rental collections"},
            {"label": "Collected Profit", "value": format_currency(sum(row["profitAmount"] for row in rows)), "note": "Profit recognized from captured payments"},
        ],
        "statusChart": build_chart_rows(
            [{"label": status, "short": status, "amount": count} for status, count in sorted(status_counts.items()) if count > 0],
            label_key="label",
            value_key="amount",
            short_key="short",
            positive_color="var(--accent)",
        ),
        "mixChart": build_chart_rows(
            [{"label": name, "short": name, "amount": count} for name, count in sorted(category_counts.items()) if count > 0],
            label_key="label",
            value_key="amount",
            short_key="short",
        ),
        "mixEyebrow": "Rental Category Mix",
        "mixTitle": "Most Used Rental Types",
        "watchTitle": "Return & Payment Watch",
        "watchItems": [row for row in rows if row["isOverdue"] or row["isDueToday"] or row["balance"] > 0][:10],
        "table": {
            "primaryHeading": "Equipment",
            "secondaryHeading": "Customer",
            "dateHeading": "Booking Date",
            "eventHeading": "Out / Due / Return",
            "amountHeading": "Fee / Paid / Balance",
        },
    }


def module_status_options(definition: ModuleDefinition, records: list[ModuleRecord]) -> list[tuple[str, str]]:
    if definition.status_field:
        for field in definition.fields:
            if field.name == definition.status_field and field.options:
                return field.options
    values = sorted(
        {
            normalize_text((record.payload or {}).get(definition.status_field)) or normalize_text(record.status)
            for record in records
            if normalize_text((record.payload or {}).get(definition.status_field)) or normalize_text(record.status)
        }
    )
    return [(value, value) for value in values]


def module_category_options(definition: ModuleDefinition, records: list[ModuleRecord], area_filter: str = "") -> list[str]:
    category_field = module_filter_category_field(definition)
    if not category_field:
        return []
    values: list[str] = []
    if category_field == "category":
        if area_filter and area_filter in INVENTORY_CATEGORY_LIBRARY:
            values.extend(INVENTORY_CATEGORY_LIBRARY[area_filter])
        else:
            for categories in INVENTORY_CATEGORY_LIBRARY.values():
                values.extend(categories)
    values.extend(
        normalize_text((record.payload or {}).get(category_field))
        for record in records
        if normalize_text((record.payload or {}).get(category_field))
    )
    seen: set[str] = set()
    normalized: list[str] = []
    for value in values:
        if value and value not in seen:
            normalized.append(value)
            seen.add(value)
    return normalized


def filter_module_records(
    records: list[ModuleRecord],
    definition: ModuleDefinition,
    *,
    search: str = "",
    area_filter: str = "",
    status_filter: str = "",
    category_filter: str = "",
    month_filter: str = "",
    date_from: date | None = None,
    date_to: date | None = None,
) -> list[ModuleRecord]:
    filtered_records: list[ModuleRecord] = []
    query_text = search.lower()

    for record in records:
        payload = record.payload or {}
        record_area = normalize_text(record.business_area_id) or normalize_text(payload.get("businessAreaId"))
        record_status = normalize_text(payload.get(definition.status_field)) or normalize_text(record.status)
        record_category = module_record_category_value(definition, record)
        record_date = module_record_date_value(definition, record)
        record_month = module_record_month_value(definition, record)

        if area_filter and record_area != area_filter:
            continue
        if status_filter and record_status != status_filter:
            continue
        if category_filter and record_category != category_filter:
            continue
        if month_filter and record_month != month_filter:
            continue
        if date_from and (not record_date or record_date < date_from):
            continue
        if date_to and (not record_date or record_date > date_to):
            continue
        if query_text:
            payload_text = " ".join(
                normalize_text(value)
                for value in payload.values()
                if isinstance(value, (str, int, float))
            )
            haystack = " ".join(
                value
                for value in [
                    normalize_text(record.title),
                    normalize_text(record.reference),
                    normalize_text(record.status),
                    normalize_text(record.business_area_id),
                    normalize_text(record.month),
                    payload_text,
                ]
                if value
            ).lower()
            if query_text not in haystack:
                continue
        filtered_records.append(record)

    return filtered_records


def build_target_progress_rows(records: list[ModuleRecord], month_value: str, *, area_filter: str = "") -> list[dict[str, Any]]:
    month_key = parse_month(month_value)
    if not month_key:
        return []

    sales_lookup = {
        row["areaId"]: round(parse_amount(row["salesTotal"]), 2)
        for row in report_area_rows(records, month_key)
    }
    target_lookup: dict[str, float] = defaultdict(float)
    expense_budget_lookup: dict[str, float] = defaultdict(float)

    for record in records:
        if record.module_key != "forecast_plans" or record.month != month_key:
            continue
        area_id = normalize_text(record.business_area_id) or normalize_text((record.payload or {}).get("businessAreaId")) or "shared-operations"
        payload = dict(record.payload or {})
        planning_rollup(payload)
        target_lookup[area_id] += parse_amount(payload.get("revenueTarget"))
        expense_budget_lookup[area_id] += parse_amount(payload.get("totalBudget"))

    rows: list[dict[str, Any]] = []
    for area in BUSINESS_AREAS:
        area_id = area["id"]
        if area_filter and area_id != area_filter:
            continue
        actual = round(sales_lookup.get(area_id, 0), 2)
        target = round(target_lookup.get(area_id, 0), 2)
        expense_budget = round(expense_budget_lookup.get(area_id, 0), 2)
        if target <= 0 and actual <= 0 and expense_budget <= 0:
            continue
        attainment = round((actual / target) * 100, 1) if target > 0 else 0.0
        variance = round(actual - target, 2)
        rows.append(
            {
                "areaId": area_id,
                "areaLabel": area["label"],
                "areaShort": area["short"],
                "actual": actual,
                "target": target,
                "expenseBudget": expense_budget,
                "variance": variance,
                "attainment": attainment,
                "progressWidth": min(attainment, 100) if target > 0 else 100 if actual > 0 else 0,
                "progressTone": "var(--green)" if target > 0 and actual >= target else "var(--accent)",
                "isOnTarget": target > 0 and actual >= target,
                "targetNote": "No target set" if target <= 0 else f"{attainment:.1f}% of target",
            }
        )
    return rows


def build_module_overview(definition: ModuleDefinition, records: list[ModuleRecord]) -> dict[str, Any]:
    total_amount = round(sum(parse_amount(record.amount) for record in records), 2)
    this_month_key = date.today().strftime("%Y-%m")
    month_amount = round(
        sum(parse_amount(record.amount) for record in records if module_record_month_value(definition, record) == this_month_key),
        2,
    )
    open_balance = round(sum(module_record_open_balance(definition, record.payload or {}) for record in records), 2)
    status_counts: dict[str, int] = defaultdict(int)
    area_totals: dict[str, float] = defaultdict(float)
    custom_area_chart: list[dict[str, Any]] | None = None
    for record in records:
        status_value = normalize_text((record.payload or {}).get(definition.status_field)) or normalize_text(record.status) or "Unspecified"
        status_counts[status_value] += 1
        area_key = normalize_text(record.business_area_id) or normalize_text((record.payload or {}).get("businessAreaId")) or "shared-operations"
        area_totals[area_key] += parse_amount(record.amount)

    if definition.key == "sales":
        total_cost = round(sum(module_record_cost_amount(record) for record in records), 2)
        total_profit = round(sum(module_record_profit_amount(record) for record in records), 2)
        cards = [
            {"label": "Sales Records", "value": f"{len(records)}", "note": "Current filtered sales rows"},
            {"label": "Revenue", "value": format_currency(total_amount), "note": "Sales captured in this list"},
            {"label": "Cost", "value": format_currency(total_cost), "note": "Linked item or service cost in this view"},
            {"label": "Profit", "value": format_currency(total_profit), "note": "Realized gross profit in this view"},
        ]
    elif definition.key == "forecast_plans":
        total_target = round(sum(parse_amount((record.payload or {}).get("revenueTarget")) for record in records), 2)
        total_budget = round(sum(planning_total_budget(record.payload or {}) for record in records), 2)
        marketing_budget = round(sum(parse_amount((record.payload or {}).get("marketingBudget")) for record in records), 2)
        cards = [
            {"label": "Planning Rows", "value": f"{len(records)}", "note": "Current planning records in view"},
            {"label": "Revenue Target", "value": format_currency(total_target), "note": "Total target set for this view"},
            {"label": "Budget Total", "value": format_currency(total_budget), "note": "Combined budgets across these records"},
            {"label": "Marketing Budget", "value": format_currency(marketing_budget), "note": "Marketing spend planned in this view"},
        ]
    elif definition.key == "salary_records":
        gross_pay_total = round(sum(parse_amount((record.payload or {}).get("grossPay")) for record in records), 2)
        net_pay_total = round(sum(parse_amount((record.payload or {}).get("netPay")) for record in records), 2)
        paid_total = round(sum(parse_amount((record.payload or {}).get("amountPaid")) for record in records), 2)
        balance_total = round(sum(salary_open_balance(record.payload or {}) for record in records), 2)
        cards = [
            {"label": "Payroll Rows", "value": f"{len(records)}", "note": "Salary and wage records in the current view"},
            {"label": "Gross Pay", "value": format_currency(gross_pay_total), "note": "Total payroll before deductions"},
            {"label": "Net Pay", "value": format_currency(net_pay_total), "note": "Take-home pay captured in view"},
            {"label": "Balance Due", "value": format_currency(balance_total), "note": f"Paid so far: {format_currency(paid_total)}"},
        ]
    elif definition.key == "maintenance_records":
        completed_count = sum(1 for record in records if normalize_text((record.payload or {}).get("status")) == "Completed")
        open_count = sum(1 for record in records if normalize_text((record.payload or {}).get("status")) in {"Open", "Scheduled", "In Progress"})
        downtime_total = round(sum(parse_amount((record.payload or {}).get("downtimeHours")) for record in records), 2)
        cards = [
            {"label": "Work Orders", "value": f"{len(records)}", "note": "Maintenance and repair tickets in view"},
            {"label": "Open Work Orders", "value": f"{open_count}", "note": "Items still being scheduled or fixed"},
            {"label": "Completed", "value": f"{completed_count}", "note": "Work orders already closed"},
            {"label": "Downtime", "value": f"{downtime_total:,.2f} hrs", "note": f"Tracked maintenance cost: {format_currency(total_amount)}"},
        ]
    elif definition.key == "asset_records":
        purchase_total = round(sum(parse_amount((record.payload or {}).get("purchaseCost")) for record in records), 2)
        depreciation_total = round(sum(parse_amount((record.payload or {}).get("accumulatedDepreciation")) for record in records), 2)
        next_service_due = sum(
            1 for record in records if (due_date := parse_date((record.payload or {}).get("nextServiceDate"))) and due_date <= date.today() + timedelta(days=30)
        )
        cards = [
            {"label": "Assets In View", "value": f"{len(records)}", "note": "Tracked equipment, tools, and fixtures"},
            {"label": "Purchase Cost", "value": format_currency(purchase_total), "note": "Original cost of assets in this view"},
            {"label": "Current Value", "value": format_currency(total_amount), "note": f"Accumulated depreciation: {format_currency(depreciation_total)}"},
            {"label": "Service Due Soon", "value": f"{next_service_due}", "note": "Assets needing service within 30 days"},
        ]
    elif definition.key == "knowledge_base":
        active_count = sum(1 for record in records if normalize_text((record.payload or {}).get("status")) in {"Active", "Training Due"})
        completed_count = sum(1 for record in records if normalize_text((record.payload or {}).get("status")) == "Completed")
        review_due = sum(
            1 for record in records if (review_date := parse_date((record.payload or {}).get("reviewDate"))) and review_date <= date.today()
        )
        average_completion = round(total_amount / len(records), 2) if records else 0.0
        completion_by_area: dict[str, list[float]] = defaultdict(list)
        for record in records:
            area_key = normalize_text(record.business_area_id) or normalize_text((record.payload or {}).get("businessAreaId")) or "shared-operations"
            completion_by_area[area_key].append(parse_amount((record.payload or {}).get("completionPercent")))
        custom_area_chart = build_chart_rows(
            [
                {
                    "label": BUSINESS_AREA_LABELS.get(area_id, area_id),
                    "short": BUSINESS_AREA_SHORT.get(area_id, area_id),
                    "amount": round(sum(values) / len(values), 2),
                }
                for area_id, values in completion_by_area.items()
                if values
            ],
            label_key="label",
            value_key="amount",
            short_key="short",
            positive_color="var(--accent)",
        )
        cards = [
            {"label": "Entries In View", "value": f"{len(records)}", "note": "SOPs, policies, and training records"},
            {"label": "Active Items", "value": f"{active_count}", "note": "Items currently in use or due for training"},
            {"label": "Completed", "value": f"{completed_count}", "note": "Training entries marked completed"},
            {"label": "Average Progress", "value": f"{average_completion:.0f}%", "note": f"Review due now: {review_due}"},
        ]
    elif definition.key == "workforce_attendance":
        total_worked = round(sum(parse_amount((record.payload or {}).get("workedHours")) for record in records), 2)
        overtime_total = round(sum(parse_amount((record.payload or {}).get("overtimeHours")) for record in records), 2)
        late_count = sum(1 for record in records if parse_amount((record.payload or {}).get("lateMinutes")) > 0)
        completed_shifts = sum(1 for record in records if normalize_text((record.payload or {}).get("attendanceStatus")) == "Checked Out")
        cards = [
            {"label": "Shifts In View", "value": f"{len(records)}", "note": "Scheduled and attended shifts in this scope"},
            {"label": "Worked Hours", "value": f"{total_worked:,.2f} hrs", "note": "Tracked hours based on check-in and check-out"},
            {"label": "Overtime", "value": f"{overtime_total:,.2f} hrs", "note": "Hours worked above scheduled time"},
            {"label": "Late Cases", "value": f"{late_count}", "note": f"Completed shifts: {completed_shifts}"},
        ]
    elif definition.key == "customer_crm":
        follow_up_due = sum(
            1
            for record in records
            if (follow_up := parse_date((record.payload or {}).get("followUpDate"))) and follow_up <= date.today()
            and normalize_text((record.payload or {}).get("status")) != "Inactive"
        )
        active_count = sum(1 for record in records if normalize_text((record.payload or {}).get("status")) == "Active")
        cards = [
            {"label": "Customers In View", "value": f"{len(records)}", "note": "Current CRM contacts"},
            {"label": "Active Customers", "value": f"{active_count}", "note": "Contacts marked active"},
            {"label": "Follow-Ups Due", "value": f"{follow_up_due}", "note": "Customers needing a touchpoint now"},
            {"label": "Lifetime Value", "value": format_currency(total_amount), "note": "Tracked customer value in this view"},
        ]
    elif definition.key == "promotions":
        running_count = sum(
            1
            for record in records
            if normalize_text((record.payload or {}).get("status")) in {"Running", "Scheduled"}
        )
        promo_budget = round(sum(parse_amount((record.payload or {}).get("budgetAmount")) for record in records), 2)
        cards = [
            {"label": "Promo Records", "value": f"{len(records)}", "note": "Campaigns and offers in view"},
            {"label": "Running / Scheduled", "value": f"{running_count}", "note": "Promotions currently active or upcoming"},
            {"label": "Promo Budget", "value": format_currency(promo_budget), "note": "Budget assigned to these promotions"},
            {"label": "Expected Revenue", "value": format_currency(total_amount), "note": "Revenue expected from the filtered offers"},
        ]
    elif definition.key == "whatsapp_campaigns":
        sent_total = round(sum(parse_amount((record.payload or {}).get("sentCount")) for record in records), 2)
        response_total = round(sum(parse_amount((record.payload or {}).get("responseCount")) for record in records), 2)
        order_total = round(sum(parse_amount((record.payload or {}).get("orderCount")) for record in records), 2)
        response_rate = round((response_total / sent_total) * 100, 2) if sent_total > 0 else 0.0
        cards = [
            {"label": "Campaign Records", "value": f"{len(records)}", "note": "Saved WhatsApp and message campaigns"},
            {"label": "Messages Sent", "value": f"{int(sent_total)}", "note": "Total messages captured in view"},
            {"label": "Response Rate", "value": f"{response_rate:.2f}%", "note": "Responses compared with messages sent"},
            {"label": "Revenue Generated", "value": format_currency(total_amount), "note": f"Orders won: {int(order_total)}"},
        ]
    elif definition.key == "campaign_roi":
        total_spend = round(sum(parse_amount((record.payload or {}).get("amountSpent")) for record in records), 2)
        total_revenue = round(sum(parse_amount((record.payload or {}).get("revenueGenerated")) for record in records), 2)
        conversion_total = round(sum(parse_amount((record.payload or {}).get("conversionsCount")) for record in records), 2)
        cards = [
            {"label": "ROI Records", "value": f"{len(records)}", "note": "Saved campaign performance rows"},
            {"label": "Campaign Spend", "value": format_currency(total_spend), "note": "Total spend captured in view"},
            {"label": "Revenue Generated", "value": format_currency(total_revenue), "note": "Revenue attributed to these campaigns"},
            {"label": "ROI", "value": format_currency(total_amount), "note": f"Tracked conversions: {int(conversion_total)}"},
        ]
    elif definition.key == "delivery_dispatch":
        delivered_count = sum(1 for record in records if normalize_text((record.payload or {}).get("dispatchStatus")) == "Delivered")
        delivery_margin = round(sum(parse_amount((record.payload or {}).get("deliveryMargin")) for record in records), 2)
        outstanding_total = round(sum(parse_amount((record.payload or {}).get("outstandingAmount")) for record in records), 2)
        cards = [
            {"label": "Dispatch Records", "value": f"{len(records)}", "note": "Current delivery and dispatch rows"},
            {"label": "Delivered", "value": f"{delivered_count}", "note": "Orders marked delivered"},
            {"label": "Cash Collected", "value": format_currency(total_amount), "note": "Cash captured through dispatch records"},
            {"label": "Delivery Margin", "value": format_currency(delivery_margin), "note": f"Outstanding: {format_currency(outstanding_total)}"},
        ]
    else:
        cards = [
            {"label": "Records In View", "value": f"{len(records)}", "note": "Current filtered records"},
            {"label": "Value In View", "value": format_currency(total_amount), "note": "Amount captured in this list"},
            {"label": "This Month", "value": format_currency(month_amount), "note": f"Captured in {this_month_key}"},
        ]
        if open_balance > 0:
            cards.append({"label": "Open Balance", "value": format_currency(open_balance), "note": "Still outstanding in this view"})
        else:
            cards.append({"label": "Areas In View", "value": f"{len([value for value in area_totals.values() if value or records])}", "note": "Business areas represented"})

    status_chart = build_chart_rows(
        [{"label": label, "short": label, "amount": count} for label, count in sorted(status_counts.items()) if count > 0],
        label_key="label",
        value_key="amount",
        short_key="short",
        positive_color="var(--accent)",
    )
    area_chart = custom_area_chart or build_chart_rows(
        [
            {
                "label": BUSINESS_AREA_LABELS.get(area_id, area_id),
                "short": BUSINESS_AREA_SHORT.get(area_id, area_id),
                "amount": round(amount, 2),
            }
            for area_id, amount in sorted(area_totals.items(), key=lambda item: item[1], reverse=True)
            if abs(amount) > 0
        ],
        label_key="label",
        value_key="amount",
        short_key="short",
    )

    return {
        "cards": cards,
        "statusChart": status_chart,
        "areaChart": area_chart,
    }


APARTMENT_FORM_SECTIONS = [
    (
        "Capture Window",
        "Use one record per suite per month. For retrospective capture, enter what was actually paid. For prospective capture, enter the upcoming due amounts and due dates.",
        ["month", "suite", "occupancyStatus", "moveInDate", "noticeDate", "moveOutDate"],
    ),
    (
        "Tenant Profile",
        "Keep the tenant and contact details here so apartment follow-up does not depend on memory.",
        [
            "tenantName",
            "tenantPhone",
            "tenantEmail",
            "tenantAddress",
            "tenantIdNumber",
            "emergencyContactName",
            "emergencyContactPhone",
            "guarantorName",
            "guarantorPhone",
            "occupantsCount",
        ],
    ),
    (
        "Lease & Rent Cycle",
        "Capture the rent period, cycle, and review dates so 6-month, yearly, and longer cycles are easy to manage.",
        [
            "leaseStartDate",
            "leaseEndDate",
            "rentCycleType",
            "rentCycleMonths",
            "rentCycleAmount",
            "rentDue",
            "rentPaid",
            "rentPaymentDate",
            "rentPaymentMethod",
            "rentPaymentReference",
            "rentReceivedBy",
            "rentCoverageStartDate",
            "rentCoverageEndDate",
            "nextRentDueDate",
            "creditBroughtForward",
            "arrearsBroughtForward",
            "lateFee",
        ],
    ),
    (
        "Monthly Bills & Custom Charges",
        "Enter the bills paid every month here. Add any other repeating or one-off property charge using the custom charge fields.",
        [
            "waterBill",
            "toiletBill",
            "sweepingBill",
            "wasteBill",
            "customChargeLabel",
            "customChargeAmount",
            "customChargeTwoLabel",
            "customChargeTwoAmount",
            "billDueDate",
            "billAmountPaid",
            "billPaymentDate",
            "billPaymentMethod",
            "billPaymentReference",
            "billReceivedBy",
        ],
    ),
    (
        "Controls & Follow-Up",
        "Use this area for deposit visibility, inspections, renewal planning, and any apartment notes.",
        [
            "securityDepositHeld",
            "nextInspectionDate",
            "rentReviewDate",
            "renewalDate",
            "renewalStatus",
            "notes",
        ],
    ),
]


def title_for_module_record(definition: ModuleDefinition, payload: dict[str, Any]) -> str:
    if definition.key == "forecast_plans":
        return planning_name(payload)
    for candidate in (
        definition.title_field,
        "title",
        "reference",
        "vendor",
        "tenantName",
        "customerName",
        "supplierName",
        "assetName",
        "staffName",
        "suite",
        "issue",
        "businessAreaId",
    ):
        value = normalize_text(payload.get(candidate)) if candidate else ""
        if value:
            if candidate == "businessAreaId":
                return BUSINESS_AREA_SHORT.get(value, BUSINESS_AREA_LABELS.get(value, value))
            return value
    return definition.label


def supplier_outstanding(payload: dict[str, Any]) -> float:
    return round(max(parse_amount(payload.get("amountDue")) - parse_amount(payload.get("amountPaid")), 0), 2)


def supplier_payment_status(payload: dict[str, Any]) -> str:
    amount_due = parse_amount(payload.get("amountDue"))
    amount_paid = parse_amount(payload.get("amountPaid"))
    outstanding = supplier_outstanding(payload)

    if amount_due > 0 and outstanding == 0:
        return "Paid"
    if amount_paid > 0:
        return "Part Paid"

    due_date = parse_date(payload.get("dueDate"))
    if due_date and due_date < date.today():
        return "Overdue"
    return "Due"


def mobile_money_expected_closing(payload: dict[str, Any]) -> float:
    expected = (
        parse_amount(payload.get("openingCash"))
        + parse_amount(payload.get("cashTopUp"))
        + parse_amount(payload.get("cashInValue"))
        + parse_amount(payload.get("serviceFees"))
        - parse_amount(payload.get("cashOutValue"))
        - parse_amount(payload.get("cashRemoved"))
        - parse_amount(payload.get("operatingExpense"))
    )
    return round(expected, 2)


def mobile_money_variance(payload: dict[str, Any]) -> float:
    return round(parse_amount(payload.get("closingCashCounted")) - mobile_money_expected_closing(payload), 2)


def mobile_money_status(payload: dict[str, Any]) -> str:
    variance = mobile_money_variance(payload)
    if abs(variance) < 0.01:
        return "Balanced"
    return "Over Counted" if variance > 0 else "Short"


def recurring_control_status(payload: dict[str, Any]) -> str:
    active_state = normalize_text(payload.get("activeState") or payload.get("state")).lower()
    is_active = active_state != "paused" if active_state else bool(payload.get("active", True))

    if not is_active:
        return "Paused"

    next_due_date = parse_date(payload.get("nextDueDate"))
    if next_due_date:
        if next_due_date < date.today():
            return "Overdue"
        if (next_due_date - date.today()).days <= 7:
            return "Due Soon"
    return "Scheduled"


def maintenance_amount(payload: dict[str, Any]) -> float:
    maintenance_rollup(payload)
    actual_cost = parse_amount(payload.get("actualCost"))
    return actual_cost if actual_cost > 0 else parse_amount(payload.get("estimatedCost"))


def planning_total_budget(payload: dict[str, Any]) -> float:
    return round(
        parse_amount(payload.get("budgetAmount"))
        + parse_amount(payload.get("expenseBudget"))
        + parse_amount(payload.get("salaryBudget"))
        + parse_amount(payload.get("marketingBudget"))
        + parse_amount(payload.get("pettyCashBudget"))
        + parse_amount(payload.get("stockBudget")),
        2,
    )


def planning_type(payload: dict[str, Any]) -> str:
    explicit = normalize_text(payload.get("planType"))
    if explicit:
        return explicit
    if normalize_text(payload.get("category")) and parse_amount(payload.get("budgetAmount")) > 0:
        return "Budget Line"
    if parse_amount(payload.get("marketingBudget")) > 0:
        return "Marketing Push"
    if any(parse_amount(payload.get(field)) > 0 for field in ("revenueTarget", "expenseBudget", "salaryBudget", "stockBudget", "pettyCashBudget")):
        return "Area Target"
    return "Operations Plan"


def planning_name(payload: dict[str, Any]) -> str:
    return (
        normalize_text(payload.get("planName"))
        or normalize_text(payload.get("category"))
        or planning_type(payload)
        or BUSINESS_AREA_SHORT.get(normalize_text(payload.get("businessAreaId")), "")
        or "Planning Target"
    )


def planning_rollup(payload: dict[str, Any]) -> None:
    payload["planType"] = planning_type(payload)
    payload["planName"] = planning_name(payload)
    payload["totalBudget"] = planning_total_budget(payload)


def whatsapp_campaign_rollup(payload: dict[str, Any]) -> None:
    sent_count = parse_amount(payload.get("sentCount"))
    response_count = parse_amount(payload.get("responseCount"))
    order_count = parse_amount(payload.get("orderCount"))
    payload["responseRate"] = round((response_count / sent_count) * 100, 2) if sent_count > 0 else 0.0
    payload["conversionRate"] = round((order_count / sent_count) * 100, 2) if sent_count > 0 else 0.0


def campaign_roi_rollup(payload: dict[str, Any]) -> None:
    amount_spent = parse_amount(payload.get("amountSpent"))
    revenue_generated = parse_amount(payload.get("revenueGenerated"))
    roi_amount = round(revenue_generated - amount_spent, 2)
    payload["roiAmount"] = roi_amount
    payload["roiPercent"] = round((roi_amount / amount_spent) * 100, 2) if amount_spent > 0 else 0.0


def delivery_dispatch_rollup(payload: dict[str, Any]) -> None:
    order_total = parse_amount(payload.get("orderTotal"))
    cash_collected = parse_amount(payload.get("cashCollected"))
    delivery_fee = parse_amount(payload.get("deliveryFee"))
    rider_cost = parse_amount(payload.get("riderCost"))
    payload["deliveryMargin"] = round(delivery_fee - rider_cost, 2)
    payload["outstandingAmount"] = round(max(order_total - cash_collected, 0), 2)


def status_for_module_record(definition: ModuleDefinition, payload: dict[str, Any]) -> str:
    if definition.key == "forecast_plans":
        return planning_type(payload)
    if definition.key == "salary_records":
        salary_rollup(payload)
        return salary_payment_status(payload)
    if definition.key == "asset_records":
        asset_rollup(payload)
    if definition.key == "maintenance_records":
        maintenance_rollup(payload)
    if definition.key == "knowledge_base":
        knowledge_rollup(payload)
    if definition.key == "workforce_attendance":
        workforce_rollup(payload)
    if definition.key == "suppliers":
        return supplier_payment_status(payload)
    if definition.key == "mobile_money_reconciliations":
        return mobile_money_status(payload)
    if definition.key == "recurring_controls":
        return recurring_control_status(payload)

    for candidate in (
        definition.status_field,
        "status",
        "occupancyStatus",
        "sourceType",
        "receiptStatus",
    ):
        value = normalize_text(payload.get(candidate)) if candidate else ""
        if value:
            return value
    return ""


def reference_for_module_record(definition: ModuleDefinition, payload: dict[str, Any]) -> str:
    if definition.key == "sales" and normalize_text(payload.get("sourceType")) == "pos-summary":
        return normalize_text(payload.get("linkedGeneratedSalesKey"))
    if definition.key == "apartments":
        suite = normalize_text(payload.get("suite"))
        month_key = parse_month(payload.get("month"))
        payload_id = normalize_text(payload.get("id"))
        if suite and month_key and payload_id:
            return f"{suite}|{month_key}|{payload_id[:8]}"
        if suite and month_key:
            return f"{suite}|{month_key}"
        if suite:
            return suite

    for candidate in ("reference", "orderNumber", "linkedGeneratedSalesKey", "suite", "staffName"):
        value = normalize_text(payload.get(candidate))
        if value:
            return value
    return ""


def amount_for_module_record(definition: ModuleDefinition, payload: dict[str, Any]) -> float:
    if definition.key == "forecast_plans":
        planning_rollup(payload)
        total_budget = parse_amount(payload.get("totalBudget"))
        revenue_target = parse_amount(payload.get("revenueTarget"))
        return total_budget if total_budget > 0 else revenue_target
    if definition.key == "salary_records":
        salary_rollup(payload)
        gross_pay = parse_amount(payload.get("grossPay"))
        return gross_pay if gross_pay > 0 else parse_amount(payload.get("amountPaid"))
    if definition.key == "asset_records":
        asset_rollup(payload)
        return parse_amount(payload.get("currentValue"))
    if definition.key == "knowledge_base":
        knowledge_rollup(payload)
        return parse_amount(payload.get("completionPercent"))
    if definition.key == "workforce_attendance":
        workforce_rollup(payload)
        return parse_amount(payload.get("workedHours"))
    if definition.key == "campaign_roi":
        campaign_roi_rollup(payload)
    if definition.key == "whatsapp_campaigns":
        whatsapp_campaign_rollup(payload)
    if definition.key == "delivery_dispatch":
        delivery_dispatch_rollup(payload)
    if definition.key == "mobile_money_reconciliations":
        return abs(mobile_money_variance(payload))
    if definition.key == "maintenance_records":
        return maintenance_amount(payload)

    if definition.amount_field:
        return parse_amount(payload.get(definition.amount_field))
    for candidate in ("amount", "totalAmount", "amountDue", "amountPaid", "currentValue"):
        value = parse_amount(payload.get(candidate))
        if value:
            return value
    return 0.0


def record_date_for_module_record(definition: ModuleDefinition, payload: dict[str, Any]) -> date | None:
    for candidate in (definition.date_field, "date", "ticketDate", "bookingDate", "orderDate", "createdAt"):
        value = parse_date(payload.get(candidate)) if candidate else None
        if value:
            return value
    return None


def apply_module_record_metadata(record: ModuleRecord, definition: ModuleDefinition, payload: dict[str, Any]) -> None:
    record.title = title_for_module_record(definition, payload)
    record.reference = reference_for_module_record(definition, payload) or None
    record.status = status_for_module_record(definition, payload)
    record.business_area_id = business_area_for_payload(payload)
    record.month = record_month_for_module_record(definition, payload)
    record.record_date = record_date_for_module_record(definition, payload)
    record.amount = amount_for_module_record(definition, payload)
    record.payload = payload
    record.updated_at = datetime.utcnow()


def migrate_planning_workspace(db_session) -> None:
    planning_definition = MODULES.get("forecast_plans")
    if not planning_definition:
        return

    planning_records = db_session.scalars(
        select(ModuleRecord)
        .where(ModuleRecord.module_key == "forecast_plans")
        .order_by(desc(ModuleRecord.updated_at), desc(ModuleRecord.created_at))
    ).all()

    migrated_source_ids = {
        normalize_text((record.payload or {}).get("mergedSourceRecordId"))
        for record in planning_records
        if normalize_text((record.payload or {}).get("mergedSourceRecordId"))
    }

    for record in planning_records:
        payload = dict(record.payload or {})
        planning_rollup(payload)
        payload.setdefault("month", record.month or normalize_text(payload.get("month")))
        payload.setdefault("businessAreaId", record.business_area_id or normalize_text(payload.get("businessAreaId")))
        apply_module_record_metadata(record, planning_definition, payload)

    legacy_budget_records = db_session.scalars(
        select(ModuleRecord)
        .where(ModuleRecord.module_key == "budgets")
        .order_by(desc(ModuleRecord.updated_at), desc(ModuleRecord.created_at))
    ).all()

    for legacy_record in legacy_budget_records:
        if legacy_record.id in migrated_source_ids:
            continue
        source_payload = dict(legacy_record.payload or {})
        legacy_note = normalize_text(source_payload.get("notes"))
        merged_payload = {
            "id": uuid4().hex,
            "createdAt": legacy_record.created_at.isoformat(),
            "updatedAt": legacy_record.updated_at.isoformat(),
            "month": normalize_text(source_payload.get("month")) or legacy_record.month,
            "businessAreaId": normalize_text(source_payload.get("businessAreaId")) or legacy_record.business_area_id,
            "planType": "Budget Line",
            "planName": normalize_text(source_payload.get("category")) or "Legacy Budget Line",
            "category": normalize_text(source_payload.get("category")),
            "budgetAmount": parse_amount(source_payload.get("budgetAmount")) or legacy_record.amount,
            "revenueTarget": 0,
            "expenseBudget": 0,
            "salaryBudget": 0,
            "marketingBudget": 0,
            "pettyCashBudget": 0,
            "stockBudget": 0,
            "notes": f"Migrated from the legacy Budget Planner.{f' {legacy_note}' if legacy_note else ''}",
            "mergedSourceRecordId": legacy_record.id,
            "mergedSourceModule": "budgets",
        }
        planning_rollup(merged_payload)
        merged_record = ModuleRecord(
            id=merged_payload["id"],
            module_key="forecast_plans",
            created_at=legacy_record.created_at,
        )
        apply_module_record_metadata(merged_record, planning_definition, merged_payload)
        db_session.add(merged_record)


def record_month_for_module_record(definition: ModuleDefinition, payload: dict[str, Any]) -> str:
    for candidate in (definition.month_field, "month"):
        value = parse_month(payload.get(candidate)) if candidate else ""
        if value:
            return value
    return ""


def business_area_for_payload(payload: dict[str, Any]) -> str:
    area = normalize_text(payload.get("businessAreaId") or payload.get("businessArea"))
    if area in BUSINESS_AREA_LABELS:
        return area
    if any(key in payload for key in ("rentCycleType", "nextRentDueDate", "billDueDate", "waterBill", "tenantName")):
        return "rentals-apartments"
    if any(key in payload for key in ("depositExpected", "depositPaid", "chargesRaised", "refundDue")):
        return "rentals-apartments"
    return ""


def apartment_cycle_label(payload: dict[str, Any]) -> str:
    cycle_type = normalize_text(payload.get("rentCycleType"))
    custom_months = int(parse_amount(payload.get("rentCycleMonths")))
    cycle_map = {
        "6-month": "6 Months",
        "12-month": "12 Months",
        "24-month": "24 Months",
        "custom": f"{custom_months} Months" if custom_months > 0 else "Custom Cycle",
    }
    return cycle_map.get(cycle_type, cycle_type or "Not set")


def apartment_custom_charge_rows(payload: dict[str, Any]) -> list[dict[str, Any]]:
    rows = []
    for label_key, amount_key, fallback in (
        ("customChargeLabel", "customChargeAmount", "Custom Charge"),
        ("customChargeTwoLabel", "customChargeTwoAmount", "Extra Charge"),
    ):
        amount = parse_amount(payload.get(amount_key))
        if amount <= 0:
            continue
        rows.append(
            {
                "label": normalize_text(payload.get(label_key)) or fallback,
                "amount": amount,
            }
        )
    return rows


def apartment_bills_due(payload: dict[str, Any]) -> float:
    total = (
        parse_amount(payload.get("waterBill"))
        + parse_amount(payload.get("toiletBill"))
        + parse_amount(payload.get("sweepingBill"))
        + parse_amount(payload.get("wasteBill"))
    )
    total += sum(item["amount"] for item in apartment_custom_charge_rows(payload))
    return round(total, 2)


def apartment_total_due_before_payments(payload: dict[str, Any]) -> float:
    return round(
        parse_amount(payload.get("rentDue"))
        + apartment_bills_due(payload)
        + parse_amount(payload.get("arrearsBroughtForward"))
        + parse_amount(payload.get("lateFee")),
        2,
    )


def apartment_balance_after_payments(payload: dict[str, Any]) -> float:
    return round(
        apartment_total_due_before_payments(payload)
        - parse_amount(payload.get("rentPaid"))
        - parse_amount(payload.get("billAmountPaid"))
        - parse_amount(payload.get("creditBroughtForward")),
        2,
    )


def apartment_rent_balance(payload: dict[str, Any]) -> float:
    return round(
        max(
            parse_amount(payload.get("rentDue"))
            + parse_amount(payload.get("arrearsBroughtForward"))
            + parse_amount(payload.get("lateFee"))
            - parse_amount(payload.get("rentPaid"))
            - parse_amount(payload.get("creditBroughtForward")),
            0,
        ),
        2,
    )


def apartment_bills_balance(payload: dict[str, Any]) -> float:
    return round(max(apartment_bills_due(payload) - parse_amount(payload.get("billAmountPaid")), 0), 2)


def apartment_credit_balance(payload: dict[str, Any]) -> float:
    return round(abs(min(apartment_balance_after_payments(payload), 0)), 2)


def apartment_outstanding(payload: dict[str, Any]) -> float:
    return round(max(apartment_balance_after_payments(payload), 0), 2)


def apartment_alert_summary(payload: dict[str, Any]) -> dict[str, Any]:
    occupancy = normalize_text(payload.get("occupancyStatus")) or "Unknown"
    occupancy_key = occupancy.lower()
    rent_due_date = parse_date(payload.get("nextRentDueDate"))
    bill_due_date = parse_date(payload.get("billDueDate"))
    notice_date = parse_date(payload.get("noticeDate"))
    move_out_date = parse_date(payload.get("moveOutDate"))
    rent_balance = apartment_rent_balance(payload)
    bills_balance = apartment_bills_balance(payload)
    total_balance = apartment_outstanding(payload)

    if occupancy_key == "vacant":
        return {"key": "vacant", "label": "Vacant", "rank": 8, "date": None}
    if occupancy_key == "maintenance":
        return {"key": "maintenance", "label": "Maintenance", "rank": 7, "date": None}
    if occupancy_key == "reserved":
        return {"key": "reserved", "label": "Reserved", "rank": 6, "date": None}

    rent_overdue = bool(rent_due_date and rent_balance > 0 and rent_due_date < date.today())
    bills_overdue = bool(bill_due_date and bills_balance > 0 and bill_due_date < date.today())
    rent_due_soon = bool(rent_due_date and rent_balance > 0 and 0 <= (rent_due_date - date.today()).days <= 7)
    bills_due_soon = bool(bill_due_date and bills_balance > 0 and 0 <= (bill_due_date - date.today()).days <= 7)

    if rent_overdue and bills_overdue:
        return {"key": "rent-bills-overdue", "label": "Rent & Bills Overdue", "rank": 0, "date": min(rent_due_date, bill_due_date)}
    if rent_overdue:
        return {"key": "rent-overdue", "label": "Rent Overdue", "rank": 1, "date": rent_due_date}
    if bills_overdue:
        return {"key": "bills-overdue", "label": "Bills Overdue", "rank": 2, "date": bill_due_date}
    if notice_date:
        return {"key": "notice", "label": "Notice Given", "rank": 3, "date": move_out_date or notice_date}
    if rent_due_soon and bills_due_soon:
        return {"key": "rent-bills-due-soon", "label": "Rent & Bills Due Soon", "rank": 4, "date": min(rent_due_date, bill_due_date)}
    if rent_due_soon:
        return {"key": "rent-due-soon", "label": "Rent Due Soon", "rank": 5, "date": rent_due_date}
    if bills_due_soon:
        return {"key": "bills-due-soon", "label": "Bills Due Soon", "rank": 5, "date": bill_due_date}
    if total_balance > 0:
        return {"key": "open-balance", "label": "Open Balance", "rank": 6, "date": rent_due_date or bill_due_date}
    return {"key": "current", "label": "Current", "rank": 9, "date": rent_due_date or bill_due_date}


def apartment_profile(record: ModuleRecord) -> dict[str, Any]:
    payload = dict(record.payload or {})
    custom_charges = apartment_custom_charge_rows(payload)
    alert = apartment_alert_summary(payload)
    occupancy = normalize_text(payload.get("occupancyStatus")) or record.status or "Unknown"
    coverage_start = normalize_text(payload.get("rentCoverageStartDate"))
    coverage_end = normalize_text(payload.get("rentCoverageEndDate"))
    coverage_label = " to ".join(part for part in (coverage_start, coverage_end) if part)
    tenant = normalize_text(payload.get("tenantName")) or "No tenant"
    suite = normalize_text(payload.get("suite")) or record.reference or "Suite"

    return {
        "id": record.id,
        "suite": suite,
        "tenant": tenant,
        "month": record.month or parse_month(payload.get("month")),
        "occupancyStatus": occupancy,
        "occupancyKey": occupancy.lower(),
        "tenantPhone": normalize_text(payload.get("tenantPhone")),
        "tenantEmail": normalize_text(payload.get("tenantEmail")),
        "tenantAddress": normalize_text(payload.get("tenantAddress")),
        "tenantIdNumber": normalize_text(payload.get("tenantIdNumber")),
        "emergencyContactName": normalize_text(payload.get("emergencyContactName")),
        "emergencyContactPhone": normalize_text(payload.get("emergencyContactPhone")),
        "guarantorName": normalize_text(payload.get("guarantorName")),
        "guarantorPhone": normalize_text(payload.get("guarantorPhone")),
        "occupantsCount": int(parse_amount(payload.get("occupantsCount"))),
        "moveInDate": normalize_text(payload.get("moveInDate")),
        "moveOutDate": normalize_text(payload.get("moveOutDate")),
        "noticeDate": normalize_text(payload.get("noticeDate")),
        "leaseStartDate": normalize_text(payload.get("leaseStartDate")),
        "leaseEndDate": normalize_text(payload.get("leaseEndDate")),
        "rentCycleLabel": apartment_cycle_label(payload),
        "rentCycleAmount": parse_amount(payload.get("rentCycleAmount")),
        "rentDue": parse_amount(payload.get("rentDue")),
        "rentPaid": parse_amount(payload.get("rentPaid")),
        "rentBalance": apartment_rent_balance(payload),
        "rentPaymentDate": normalize_text(payload.get("rentPaymentDate")),
        "rentPaymentMethod": normalize_text(payload.get("rentPaymentMethod")),
        "rentPaymentReference": normalize_text(payload.get("rentPaymentReference")),
        "rentReceivedBy": normalize_text(payload.get("rentReceivedBy")),
        "rentCoverageLabel": coverage_label,
        "coverageStart": coverage_start,
        "coverageEnd": coverage_end,
        "nextRentDueDate": normalize_text(payload.get("nextRentDueDate")),
        "creditBroughtForward": parse_amount(payload.get("creditBroughtForward")),
        "billsDue": apartment_bills_due(payload),
        "billsPaid": parse_amount(payload.get("billAmountPaid")),
        "billsBalance": apartment_bills_balance(payload),
        "billDueDate": normalize_text(payload.get("billDueDate")),
        "billPaymentDate": normalize_text(payload.get("billPaymentDate")),
        "billPaymentMethod": normalize_text(payload.get("billPaymentMethod")),
        "billPaymentReference": normalize_text(payload.get("billPaymentReference")),
        "billReceivedBy": normalize_text(payload.get("billReceivedBy")),
        "waterBill": parse_amount(payload.get("waterBill")),
        "toiletBill": parse_amount(payload.get("toiletBill")),
        "sweepingBill": parse_amount(payload.get("sweepingBill")),
        "wasteBill": parse_amount(payload.get("wasteBill")),
        "customCharges": custom_charges,
        "arrearsBroughtForward": parse_amount(payload.get("arrearsBroughtForward")),
        "lateFee": parse_amount(payload.get("lateFee")),
        "totalDue": apartment_total_due_before_payments(payload),
        "outstanding": apartment_outstanding(payload),
        "creditBalance": apartment_credit_balance(payload),
        "securityDepositHeld": parse_amount(payload.get("securityDepositHeld")),
        "nextInspectionDate": normalize_text(payload.get("nextInspectionDate")),
        "rentReviewDate": normalize_text(payload.get("rentReviewDate")),
        "renewalDate": normalize_text(payload.get("renewalDate")),
        "renewalStatus": normalize_text(payload.get("renewalStatus")) or "Current",
        "alertKey": alert["key"],
        "alertLabel": alert["label"],
        "alertRank": alert["rank"],
        "alertDate": alert["date"].isoformat() if isinstance(alert["date"], date) else "",
        "notes": normalize_text(payload.get("notes")),
        "agreementReady": bool(
            tenant
            and occupancy in APARTMENT_ACTIVE_STATUSES
            and (
                parse_amount(payload.get("rentPaid")) > 0
                or normalize_text(payload.get("rentPaymentDate"))
                or normalize_text(payload.get("rentPaymentMethod"))
                or normalize_text(payload.get("rentPaymentReference"))
                or normalize_text(payload.get("rentReceivedBy"))
            )
        ),
        "updatedAt": record.updated_at,
        "record": record,
    }


def apartment_record_sort_key(record: ModuleRecord) -> tuple[str, str, str, str]:
    return (
        record.month or "",
        record.record_date.isoformat() if record.record_date else "",
        record.updated_at.isoformat(),
        record.created_at.isoformat(),
    )


def apartment_profile_matches_query(profile: dict[str, Any], query_text: str) -> bool:
    query_lower = normalize_text(query_text).lower()
    if not query_lower:
        return True
    haystack = " ".join(
        [
            profile.get("suite", ""),
            profile.get("tenant", ""),
            profile.get("tenantPhone", ""),
            profile.get("tenantEmail", ""),
            profile.get("tenantIdNumber", ""),
            profile.get("month", ""),
            profile.get("rentCycleLabel", ""),
            profile.get("alertLabel", ""),
            profile.get("notes", ""),
        ]
    ).lower()
    return query_lower in haystack


def apartment_profile_matches_alert(profile: dict[str, Any], alert_filter: str) -> bool:
    selected = normalize_text(alert_filter).lower()
    if not selected:
        return True
    if selected == "overdue":
        return profile["alertKey"] in {"rent-overdue", "bills-overdue", "rent-bills-overdue"}
    if selected == "due-soon":
        return profile["alertKey"] in {"rent-due-soon", "bills-due-soon", "rent-bills-due-soon"}
    if selected == "occupied":
        return profile["occupancyKey"] == "occupied"
    if selected == "vacant":
        return profile["occupancyKey"] == "vacant"
    if selected == "notice":
        return profile["alertKey"] == "notice"
    if selected == "balance-open":
        return profile["outstanding"] > 0
    return profile["alertKey"] == selected


def format_display_date(value: Any, *, long_month: bool = False) -> str:
    parsed = value if isinstance(value, date) else parse_date(value)
    if not parsed:
        return ""
    month_label = parsed.strftime("%B" if long_month else "%b")
    return f"{parsed.day} {month_label} {parsed.year}"


def safe_filename_segment(value: Any, fallback: str) -> str:
    cleaned = "".join(character if str(character).isalnum() else "_" for character in normalize_text(value))
    cleaned = cleaned.strip("_")
    return cleaned or fallback


def apartment_cycle_months(payload: dict[str, Any]) -> int:
    cycle_type = normalize_text(payload.get("rentCycleType"))
    custom_months = int(parse_amount(payload.get("rentCycleMonths")))
    return {
        "6-month": 6,
        "12-month": 12,
        "24-month": 24,
        "custom": custom_months,
    }.get(cycle_type, custom_months)


def shift_date_by_months(value: Any, months: int, *, day_offset: int = 0) -> str:
    parsed = parse_date(value)
    if not parsed or months == 0:
        return ""
    total_months = (parsed.year * 12) + (parsed.month - 1) + months
    year = total_months // 12
    month = (total_months % 12) + 1
    day = min(parsed.day, calendar.monthrange(year, month)[1])
    shifted = date(year, month, day) + timedelta(days=day_offset)
    return shifted.isoformat()


def apartment_tenant_identity(payload: dict[str, Any]) -> str:
    tenant_id = normalize_text(payload.get("tenantIdNumber")).lower()
    if tenant_id:
        return f"id:{tenant_id}"
    phone = normalize_phone(payload.get("tenantPhone"))
    if phone:
        return f"phone:{phone}"
    name = normalize_text(payload.get("tenantName")).lower()
    return f"name:{name}" if name else ""


def apartment_payment_confirmed(payload: dict[str, Any]) -> bool:
    return (
        parse_amount(payload.get("rentPaid")) > 0
        or bool(normalize_text(payload.get("rentPaymentDate")))
        or bool(normalize_text(payload.get("rentPaymentMethod")))
        or bool(normalize_text(payload.get("rentPaymentReference")))
        or bool(normalize_text(payload.get("rentReceivedBy")))
    )


def apartment_record_payload(record: ModuleRecord) -> dict[str, Any]:
    payload = dict(record.payload or {})
    payload.setdefault("id", record.id)
    payload.setdefault("month", record.month or parse_month(payload.get("month")))
    payload.setdefault("suite", normalize_text(payload.get("suite")) or normalize_text(record.reference))
    payload.setdefault("occupancyStatus", normalize_text(payload.get("occupancyStatus")) or normalize_text(record.status))
    return payload


def pick_latest_text(payloads: list[dict[str, Any]], key: str) -> str:
    for payload in payloads:
        value = normalize_text(payload.get(key))
        if value:
            return value
    return ""


def pick_latest_date(payloads: list[dict[str, Any]], key: str) -> str:
    for payload in payloads:
        value = normalize_text(payload.get(key))
        if parse_date(value):
            return value[:10]
    return ""


def pick_latest_amount(payloads: list[dict[str, Any]], key: str) -> float:
    for payload in payloads:
        value = parse_amount(payload.get(key))
        if value > 0:
            return value
    return 0.0


def pick_latest_integer(payloads: list[dict[str, Any]], key: str) -> int:
    for payload in payloads:
        value = int(parse_amount(payload.get(key)))
        if value > 0:
            return value
    return 0


def apartment_relevant_history(reference_record: ModuleRecord, suite_records: list[ModuleRecord]) -> list[ModuleRecord]:
    reference_payload = apartment_record_payload(reference_record)
    reference_key = apartment_tenant_identity(reference_payload)
    reference_name = normalize_text(reference_payload.get("tenantName")).lower()
    target_month = reference_record.month or parse_month(reference_payload.get("month"))
    relevant_records: list[ModuleRecord] = []

    for item in suite_records:
        if item.id == reference_record.id:
            continue
        payload = apartment_record_payload(item)
        if reference_key:
            if apartment_tenant_identity(payload) != reference_key:
                continue
        elif reference_name:
            if normalize_text(payload.get("tenantName")).lower() != reference_name:
                continue
        elif normalize_text(reference_payload.get("occupancyStatus")) not in APARTMENT_ACTIVE_STATUSES:
            continue
        if target_month and (item.month or parse_month(payload.get("month"))) >= target_month:
            continue
        relevant_records.append(item)

    return sorted(relevant_records, key=apartment_record_sort_key)


def apartment_statement_rows(reference_record: ModuleRecord, suite_records: list[ModuleRecord]) -> list[dict[str, Any]]:
    relevant_records = apartment_relevant_history(reference_record, suite_records)
    ordered_records = sorted([*relevant_records, reference_record], key=apartment_record_sort_key)
    rows: list[dict[str, Any]] = []
    running_balance = 0.0

    for index, record in enumerate(ordered_records):
        payload = apartment_record_payload(record)
        opening_arrears = parse_amount(payload.get("arrearsBroughtForward")) if index == 0 else running_balance
        late_fee = parse_amount(payload.get("lateFee"))
        rent_due = parse_amount(payload.get("rentDue"))
        rent_paid = parse_amount(payload.get("rentPaid"))
        bills_due = apartment_bills_due(payload)
        bills_paid = parse_amount(payload.get("billAmountPaid"))
        credit_applied = parse_amount(payload.get("creditBroughtForward"))
        running_balance = round(
            max(opening_arrears + late_fee + rent_due + bills_due - rent_paid - bills_paid - credit_applied, 0),
            2,
        )
        rows.append(
            {
                "record": record,
                "month": record.month or parse_month(payload.get("month")),
                "occupancyStatus": normalize_text(payload.get("occupancyStatus")) or "Unknown",
                "rentDue": rent_due,
                "rentPaid": rent_paid,
                "billsDue": bills_due,
                "billsPaid": bills_paid,
                "creditApplied": credit_applied,
                "openingArrears": opening_arrears,
                "lateFee": late_fee,
                "runningBalance": running_balance,
            }
        )
    return rows


def apartment_statement_totals(rows: list[dict[str, Any]]) -> dict[str, float]:
    return {
        "rentDue": round(sum(row["rentDue"] for row in rows), 2),
        "rentPaid": round(sum(row["rentPaid"] for row in rows), 2),
        "billsDue": round(sum(row["billsDue"] for row in rows), 2),
        "billsPaid": round(sum(row["billsPaid"] for row in rows), 2),
        "creditApplied": round(sum(row["creditApplied"] for row in rows), 2),
        "balance": round(rows[-1]["runningBalance"], 2) if rows else 0.0,
    }


def apartment_document_source_payload(reference_record: ModuleRecord, suite_records: list[ModuleRecord]) -> dict[str, Any]:
    current_payload = apartment_record_payload(reference_record)
    scoped_history = list(reversed(apartment_relevant_history(reference_record, suite_records)))
    payload_history = [apartment_record_payload(item) for item in scoped_history]
    source_payloads = [current_payload, *payload_history]
    payment_payload = next((payload for payload in source_payloads if apartment_payment_confirmed(payload)), None)
    bill_payload = next((payload for payload in source_payloads if apartment_bills_due(payload) > 0), None)
    payment_sources = ([payment_payload] if payment_payload else []) + source_payloads
    bill_sources = ([bill_payload] if bill_payload else []) + source_payloads
    rent_cycle_type = pick_latest_text(source_payloads, "rentCycleType")
    rent_cycle_months = apartment_cycle_months(
        {
            "rentCycleType": rent_cycle_type,
            "rentCycleMonths": pick_latest_integer(source_payloads, "rentCycleMonths"),
        }
    )
    rent_cycle_amount = (
        pick_latest_amount(source_payloads, "rentCycleAmount")
        or pick_latest_amount(source_payloads, "rentDue")
        or pick_latest_amount(source_payloads, "rentPaid")
    )
    rent_due = parse_amount((payment_payload or {}).get("rentDue")) or rent_cycle_amount or pick_latest_amount(source_payloads, "rentDue")

    return {
        **current_payload,
        "tenantName": pick_latest_text(source_payloads, "tenantName"),
        "tenantPhone": pick_latest_text(source_payloads, "tenantPhone"),
        "tenantEmail": pick_latest_text(source_payloads, "tenantEmail"),
        "tenantAddress": pick_latest_text(source_payloads, "tenantAddress"),
        "tenantIdNumber": pick_latest_text(source_payloads, "tenantIdNumber"),
        "emergencyContactName": pick_latest_text(source_payloads, "emergencyContactName"),
        "emergencyContactPhone": pick_latest_text(source_payloads, "emergencyContactPhone"),
        "guarantorName": pick_latest_text(source_payloads, "guarantorName"),
        "guarantorPhone": pick_latest_text(source_payloads, "guarantorPhone"),
        "moveInDate": pick_latest_date(source_payloads, "moveInDate"),
        "moveOutDate": pick_latest_date(source_payloads, "moveOutDate"),
        "leaseStartDate": pick_latest_date(source_payloads, "leaseStartDate"),
        "leaseEndDate": pick_latest_date(source_payloads, "leaseEndDate"),
        "rentCycleType": rent_cycle_type,
        "rentCycleMonths": rent_cycle_months,
        "rentCycleAmount": rent_cycle_amount,
        "rentDue": rent_due,
        "rentPaid": parse_amount((payment_payload or {}).get("rentPaid")) or pick_latest_amount(source_payloads, "rentPaid"),
        "rentCoverageStartDate": pick_latest_date(payment_sources, "rentCoverageStartDate"),
        "rentCoverageEndDate": pick_latest_date(payment_sources, "rentCoverageEndDate"),
        "nextRentDueDate": pick_latest_date(source_payloads, "nextRentDueDate"),
        "rentPaymentDate": pick_latest_date(payment_sources, "rentPaymentDate"),
        "rentPaymentMethod": pick_latest_text(payment_sources, "rentPaymentMethod"),
        "rentPaymentReference": pick_latest_text(payment_sources, "rentPaymentReference"),
        "rentReceivedBy": pick_latest_text(payment_sources, "rentReceivedBy"),
        "billDueDate": pick_latest_date(source_payloads, "billDueDate"),
        "billAmountPaid": parse_amount((bill_payload or {}).get("billAmountPaid")) or pick_latest_amount(source_payloads, "billAmountPaid"),
        "billPaymentDate": pick_latest_date(bill_sources, "billPaymentDate"),
        "billPaymentMethod": pick_latest_text(bill_sources, "billPaymentMethod"),
        "billPaymentReference": pick_latest_text(bill_sources, "billPaymentReference"),
        "billReceivedBy": pick_latest_text(bill_sources, "billReceivedBy"),
        "waterBill": parse_amount((bill_payload or {}).get("waterBill")) or pick_latest_amount(source_payloads, "waterBill"),
        "toiletBill": parse_amount((bill_payload or {}).get("toiletBill")) or pick_latest_amount(source_payloads, "toiletBill"),
        "sweepingBill": parse_amount((bill_payload or {}).get("sweepingBill")) or pick_latest_amount(source_payloads, "sweepingBill"),
        "wasteBill": parse_amount((bill_payload or {}).get("wasteBill")) or pick_latest_amount(source_payloads, "wasteBill"),
        "customChargeLabel": pick_latest_text(bill_sources, "customChargeLabel"),
        "customChargeAmount": pick_latest_amount(bill_sources, "customChargeAmount"),
        "customChargeTwoLabel": pick_latest_text(bill_sources, "customChargeTwoLabel"),
        "customChargeTwoAmount": pick_latest_amount(bill_sources, "customChargeTwoAmount"),
        "securityDepositHeld": pick_latest_amount(source_payloads, "securityDepositHeld"),
        "renewalDate": pick_latest_date(source_payloads, "renewalDate"),
        "renewalStatus": pick_latest_text(source_payloads, "renewalStatus"),
        "notes": pick_latest_text(source_payloads, "notes"),
    }


def apartment_agreement_commencement_date(payload: dict[str, Any]) -> str:
    return (
        normalize_text(payload.get("leaseStartDate"))
        or normalize_text(payload.get("moveInDate"))
        or normalize_text(payload.get("rentCoverageStartDate"))
        or normalize_text(payload.get("rentPaymentDate"))
    )


def apartment_agreement_expiry_date(payload: dict[str, Any]) -> str:
    for key in ("leaseEndDate", "moveOutDate", "rentCoverageEndDate"):
        value = normalize_text(payload.get(key))
        if parse_date(value):
            return value[:10]
    commencement = apartment_agreement_commencement_date(payload)
    cycle_months = apartment_cycle_months(payload)
    if commencement and cycle_months > 0:
        return shift_date_by_months(commencement, cycle_months, day_offset=-1)
    return ""


def format_agreement_currency(value: Any) -> str:
    amount = parse_amount(value)
    decimals = 0 if abs(amount - round(amount)) < 0.001 else 2
    return f"GHS {amount:,.{decimals}f}"


def agreement_interval_label(months: int) -> str:
    if months == 12:
        return "one (1) year"
    if months == 6:
        return "six (6) months"
    if months == 1:
        return "one (1) month"
    return f"{months} months" if months > 0 else "the agreed lease period"


def agreement_advance_label(months: int) -> str:
    if months == 12:
        return "one year in advance"
    if months == 6:
        return "six months in advance"
    if months == 1:
        return "monthly in advance"
    return f"{months} months in advance" if months > 0 else "in advance"


def apartment_custom_charge_note(payload: dict[str, Any]) -> str:
    rows = apartment_custom_charge_rows(payload)
    if not rows:
        return ""
    return " Additional monthly bill items currently on record: " + "; ".join(
        f'{item["label"]} {format_agreement_currency(item["amount"])}' for item in rows
    ) + "."


def apartment_agreement_placeholders(payload: dict[str, Any], app_config: AppConfig) -> dict[str, str]:
    cycle_months = apartment_cycle_months(payload)
    advance_rent_due = (
        parse_amount(payload.get("rentCycleAmount"))
        or parse_amount(payload.get("rentDue"))
        or parse_amount(payload.get("rentPaid"))
    )
    amount_received = parse_amount(payload.get("rentPaid")) or advance_rent_due
    monthly_rent = round(advance_rent_due / cycle_months, 2) if cycle_months > 0 and advance_rent_due > 0 else advance_rent_due
    commencement_date = apartment_agreement_commencement_date(payload)
    expiry_date = apartment_agreement_expiry_date(payload)
    payment_date = normalize_text(payload.get("rentPaymentDate"))
    effective_from_date = commencement_date or payment_date
    water_toilet_total = parse_amount(payload.get("waterBill")) + parse_amount(payload.get("toiletBill"))
    service_total = apartment_bills_due(payload)
    lease_term_label = agreement_interval_label(cycle_months)
    agreement_status_date = format_display_date(payment_date or date.today().isoformat(), long_month=True)
    payment_channel = f"MTN Mobile Money to {app_config.whatsapp_number}"

    return {
        "[[SUITE_NAME]]": normalize_text(payload.get("suite")) or "Apartment Suite",
        "[[PROPERTY_LOCATION]]": TENANCY_PROPERTY_LOCATION,
        "[[LEASE_TERM_LABEL]]": f"{lease_term_label} from the agreed commencement date to the matching expiry date.",
        "[[LEASE_TERM_TEXT]]": lease_term_label,
        "[[RENT_PLAN_SUMMARY]]": (
            f"{format_agreement_currency(monthly_rent)} per month, payable {agreement_advance_label(cycle_months)}."
            if monthly_rent > 0
            else TENANCY_PLACEHOLDER_LINE
        ),
        "[[ADVANCE_RENT_DUE]]": format_agreement_currency(advance_rent_due) if advance_rent_due > 0 else TENANCY_PLACEHOLDER_LINE,
        "[[AMOUNT_RECEIVED]]": format_agreement_currency(amount_received) if amount_received > 0 else TENANCY_PLACEHOLDER_LINE,
        "[[MONTHLY_SERVICE_TOTAL]]": format_agreement_currency(service_total),
        "[[PAYMENT_CHANNEL]]": payment_channel,
        "[[AGREEMENT_STATUS]]": f"Generated after payment confirmation on {agreement_status_date}.",
        "[[TENANT_NAME]]": normalize_text(payload.get("tenantName")) or TENANCY_PLACEHOLDER_LINE,
        "[[TENANT_ADDRESS]]": normalize_text(payload.get("tenantAddress")) or TENANCY_PLACEHOLDER_LINE,
        "[[TENANT_PHONE]]": normalize_text(payload.get("tenantPhone")) or TENANCY_PLACEHOLDER_LINE,
        "[[TENANT_ID_REF]]": normalize_text(payload.get("tenantIdNumber")) or TENANCY_PLACEHOLDER_LINE,
        "[[COMMENCEMENT_DATE]]": format_display_date(commencement_date, long_month=True) or TENANCY_PLACEHOLDER_LINE,
        "[[EXPIRY_DATE]]": format_display_date(expiry_date, long_month=True) or TENANCY_PLACEHOLDER_LINE,
        "[[CUSTOM_BILL_ITEMS_NOTE]]": apartment_custom_charge_note(payload),
        "[[WATER_TOILET_BILL]]": format_agreement_currency(water_toilet_total),
        "[[SWEEPING_BILL]]": format_agreement_currency(payload.get("sweepingBill")),
        "[[WASTE_BILL]]": format_agreement_currency(payload.get("wasteBill")),
        "[[PAYMENT_DATE]]": format_display_date(payment_date, long_month=True) or TENANCY_PLACEHOLDER_LINE,
        "[[PAYMENT_METHOD]]": normalize_text(payload.get("rentPaymentMethod")) or TENANCY_PLACEHOLDER_LINE,
        "[[PAYMENT_REFERENCE]]": normalize_text(payload.get("rentPaymentReference")) or TENANCY_PLACEHOLDER_LINE,
        "[[RECEIVED_BY]]": normalize_text(payload.get("rentReceivedBy")) or TENANCY_PLACEHOLDER_LINE,
        "[[AGREEMENT_EFFECTIVE_FROM]]": format_display_date(effective_from_date, long_month=True) or TENANCY_PLACEHOLDER_LINE,
    }


def build_tenancy_agreement_docx(placeholder_map: dict[str, str]) -> bytes:
    stream = BytesIO()
    with ZipFile(TENANCY_TEMPLATE_PATH, "r") as source_zip, ZipFile(stream, "w", compression=ZIP_DEFLATED) as output_zip:
        for info in source_zip.infolist():
            data = source_zip.read(info.filename)
            if info.filename == "word/document.xml":
                document_xml = data.decode("utf-8")
                for placeholder, value in placeholder_map.items():
                    document_xml = document_xml.replace(placeholder, html.escape(str(value or "")))
                data = document_xml.encode("utf-8")
            output_zip.writestr(info, data)
    stream.seek(0)
    return stream.getvalue()


def format_currency(value: Any) -> str:
    return f"GH₵{parse_amount(value):,.2f}"


def csv_cell(value: Any) -> str | float | int:
    if value is None:
        return ""
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    if isinstance(value, (list, dict)):
        return json.dumps(value, ensure_ascii=False)
    return value


def csv_download(filename: str, headers: list[str], rows: list[dict[str, Any]]) -> Response:
    stream = StringIO()
    writer = csv.DictWriter(stream, fieldnames=headers, extrasaction="ignore")
    writer.writeheader()
    for row in rows:
        writer.writerow({header: csv_cell(row.get(header)) for header in headers})
    return Response(
        stream.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def workbook_download_path(app_config: AppConfig) -> Path:
    return app_config.outputs_dir / "oneroot-essentials-register" / "OneRoot_Essentials_Operations_Register.xlsx"


def generated_sales_references_for_module_record(record: ModuleRecord) -> list[str]:
    if record.module_key == "apartments":
        return [
            f"apartment-rent-payment|{record.id}",
            f"apartment-bill-payment|{record.id}",
        ]
    if record.module_key == "laundry_tickets":
        return [
            f"laundry-payment|{record.id}",
            *[
                f"laundry-payment|{record.id}|{entry['id']}"
                for entry in service_payment_entries(record.module_key, record.payload or {})
            ],
        ]
    if record.module_key == "equipment_rental_bookings":
        return [
            f"equipment-rental-payment|{record.id}",
            *[
                f"equipment-rental-payment|{record.id}|{entry['id']}"
                for entry in service_payment_entries(record.module_key, record.payload or {})
            ],
        ]
    if record.module_key == "security_deposit_records":
        return [
            f"security-deposit-payment|{record.id}",
            f"tenant-charge-payment|{record.id}",
        ]
    return []


def record_in_month_scope(record: ModuleRecord, month_value: str) -> bool:
    month_key = parse_month(month_value)
    if not month_key:
        return True
    if record.month:
        return record.month == month_key
    if record.record_date:
        return record.record_date.strftime("%Y-%m") == month_key
    return False


def record_in_area_scope(record: ModuleRecord, area_id: str) -> bool:
    selected_area = normalize_text(area_id)
    if not selected_area:
        return True
    return normalize_text(record.business_area_id) == selected_area


def report_area_rows(records: list[ModuleRecord], month_value: str) -> list[dict[str, Any]]:
    rows = []
    scoped_month = parse_month(month_value)
    for area in BUSINESS_AREAS:
        area_id = area["id"]
        sales_total = round(
            sum(
                record.amount
                for record in records
                if record.module_key == "sales"
                and record_in_month_scope(record, month_value)
                and record.business_area_id == area_id
            ),
            2,
        )
        cost_total = round(
            sum(
                module_record_cost_amount(record)
                for record in records
                if record.module_key == "sales"
                and record_in_month_scope(record, month_value)
                and record.business_area_id == area_id
            ),
            2,
        )
        profit_total = round(
            sum(
                module_record_profit_amount(record)
                for record in records
                if record.module_key == "sales"
                and record_in_month_scope(record, month_value)
                and record.business_area_id == area_id
            ),
            2,
        )
        expense_total = round(
            sum(
                record.amount
                for record in records
                if record.module_key == "expenses"
                and record_in_month_scope(record, month_value)
                and record.business_area_id == area_id
            ),
            2,
        )
        salary_total = round(
            sum(
                salary_cost_for_reporting(record.payload or {})
                for record in records
                if record.module_key == "salary_records"
                and record.month == scoped_month
                and normalize_text(record.business_area_id) == area_id
            ),
            2,
        )
        petty_cash_total = round(
            sum(
                record.amount
                for record in records
                if record.module_key == "petty_cash"
                and record_in_month_scope(record, month_value)
                and record.business_area_id == area_id
            ),
            2,
        )
        maintenance_total = round(
            sum(
                maintenance_amount(record.payload or {})
                for record in records
                if record.module_key == "maintenance_records"
                and record_in_month_scope(record, month_value)
                and normalize_text(record.business_area_id) == area_id
            ),
            2,
        )
        depreciation_total = round(
            sum(
                asset_depreciation_charge_for_month(record.payload or {}, month_value)
                for record in records
                if record.module_key == "asset_records"
                and normalize_text(record.business_area_id) == area_id
            ),
            2,
        )
        supplier_balance = round(
            sum(
                supplier_outstanding(record.payload or {})
                for record in records
                if record.module_key == "suppliers" and normalize_text(record.business_area_id) == area_id
            ),
            2,
        )
        operating_total = round(profit_total - expense_total - petty_cash_total - salary_total - maintenance_total, 2)
        net_total = round(operating_total - depreciation_total, 2)
        rows.append(
            {
                "areaId": area_id,
                "areaLabel": area["label"],
                "areaShort": area["short"],
                "salesTotal": sales_total,
                "costTotal": cost_total,
                "profitTotal": profit_total,
                "expenseTotal": expense_total,
                "salaryTotal": salary_total,
                "pettyCashTotal": petty_cash_total,
                "maintenanceTotal": maintenance_total,
                "depreciationTotal": depreciation_total,
                "operatingTotal": operating_total,
                "supplierBalance": supplier_balance,
                "netTotal": net_total,
            }
        )
    rows.sort(key=lambda item: item["salesTotal"], reverse=True)
    return rows


def profit_detail_rows(records: list[ModuleRecord], month_value: str, area_id: str = "") -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for record in records:
        if record.module_key != "sales":
            continue
        if not record_in_month_scope(record, month_value) or not record_in_area_scope(record, area_id):
            continue
        payload = record.payload or {}
        business_area_id = normalize_text(record.business_area_id) or normalize_text(payload.get("businessAreaId")) or "shared-operations"
        source_type = normalize_text(payload.get("sourceType")).lower() or "manual-sale"
        amount = round(parse_amount(record.amount), 2)
        cost_total = round(module_record_cost_amount(record), 2)
        profit_total = round(module_record_profit_amount(record), 2)
        transaction_count = max(int(parse_amount(payload.get("transactionCount"))), 1)
        rows.append(
            {
                "id": record.id,
                "title": record.title,
                "reference": record.reference,
                "recordDate": record.record_date.isoformat() if record.record_date else normalize_text(payload.get("date")),
                "areaId": business_area_id,
                "areaLabel": BUSINESS_AREA_LABELS.get(business_area_id, business_area_id),
                "areaShort": BUSINESS_AREA_SHORT.get(business_area_id, business_area_id),
                "sourceType": source_type,
                "sourceLabel": normalize_text(payload.get("sourceLabel")) or profit_source_label(source_type),
                "transactionCount": transaction_count,
                "salesTotal": amount,
                "costTotal": cost_total,
                "profitTotal": profit_total,
                "marginPercent": round((profit_total / amount) * 100, 2) if amount > 0 else 0.0,
                "notes": normalize_text(payload.get("notes")),
            }
        )
    rows.sort(key=lambda item: (item["recordDate"], item["profitTotal"], item["title"]), reverse=True)
    return rows


def category_performance_rows(db_session, month_value: str, area_id: str = "") -> list[dict[str, Any]]:
    scoped_month = parse_month(month_value)
    selected_area = normalize_text(area_id)
    generated_source_types = {
        "pos-summary",
        "online-order-payments",
        "laundry-payment",
        "equipment-rental-payment",
        "apartment-rent-payment",
        "apartment-bill-payment",
        "security-deposit-payment",
        "tenant-charge-payment",
    }
    row_map: dict[tuple[str, str], dict[str, Any]] = {}

    def in_month_scope(target_date: date | None) -> bool:
        if not scoped_month:
            return True
        return bool(target_date and target_date.strftime("%Y-%m") == scoped_month)

    def add_category_row(
        *,
        area_id_value: str,
        category_label: str,
        sales_amount: Any,
        cost_amount: Any = 0.0,
        transaction_count: Any = 1,
        source_label: str = "",
    ) -> None:
        area_key = normalize_text(area_id_value) or "shared-operations"
        if selected_area and area_key != selected_area:
            return
        category_key = normalize_text(category_label) or "Uncategorized"
        clean_sales = round(parse_amount(sales_amount), 2)
        clean_cost = round(parse_amount(cost_amount), 2)
        if clean_sales <= 0 and clean_cost <= 0:
            return
        key = (area_key, category_key)
        row = row_map.setdefault(
            key,
            {
                "areaId": area_key,
                "areaLabel": BUSINESS_AREA_LABELS.get(area_key, area_key),
                "areaShort": BUSINESS_AREA_SHORT.get(area_key, area_key),
                "categoryLabel": category_key,
                "salesTotal": 0.0,
                "costTotal": 0.0,
                "profitTotal": 0.0,
                "transactionCount": 0,
                "sources": set(),
            },
        )
        row["salesTotal"] = round(row["salesTotal"] + clean_sales, 2)
        row["costTotal"] = round(row["costTotal"] + clean_cost, 2)
        row["profitTotal"] = round(row["profitTotal"] + (clean_sales - clean_cost), 2)
        row["transactionCount"] += max(int(parse_amount(transaction_count)), 1)
        if source_label:
            row["sources"].add(source_label)

    pos_orders = db_session.scalars(select(PosOrder).options(selectinload(PosOrder.lines))).all()
    for order in pos_orders:
        if not in_month_scope(order.order_date):
            continue
        for line in order.lines:
            add_category_row(
                area_id_value=normalize_text(line.business_area_id),
                category_label=normalize_text(line.category) or "Counter Sales",
                sales_amount=line.total_amount,
                cost_amount=line.cost_amount,
                transaction_count=1,
                source_label="POS",
            )

    online_orders = db_session.scalars(
        select(ModuleRecord).where(ModuleRecord.module_key == "online_orders").order_by(desc(ModuleRecord.record_date), desc(ModuleRecord.updated_at))
    ).all()
    for record in online_orders:
        payload = record.payload or {}
        if normalize_text(payload.get("paymentStatus")).lower() != "paid":
            continue
        paid_amount = round(parse_amount(payload.get("paidAmount")), 2)
        if paid_amount <= 0:
            continue
        payment_date = parse_date(payload.get("paymentDate")) or parse_date(payload.get("updatedAt")) or record.record_date
        if not in_month_scope(payment_date):
            continue
        items = payload.get("items") if isinstance(payload.get("items"), list) else []
        quoted_total = round(sum(parse_amount(item.get("lineTotal")) for item in items), 2)
        ratio = paid_amount / quoted_total if quoted_total > 0 else 0.0
        for item in items:
            quantity = max(parse_amount(item.get("quantity")), 1.0)
            line_total = round(parse_amount(item.get("lineTotal")) or (quantity * parse_amount(item.get("unitPrice"))), 2)
            line_cost = round(quantity * parse_amount(item.get("costPrice")), 2)
            sales_value = round(line_total * ratio if ratio else line_total, 2)
            cost_value = round(line_cost * ratio if ratio else line_cost, 2)
            add_category_row(
                area_id_value=normalize_text(item.get("businessAreaId")),
                category_label=normalize_text(item.get("category")) or "Online Order",
                sales_amount=sales_value,
                cost_amount=cost_value,
                transaction_count=1,
                source_label="Online Orders",
            )

    for module_key, default_area, category_field, source_label, date_getter in [
        ("laundry_tickets", "laundry-services", "serviceCategory", "Laundry", get_laundry_payment_date),
        ("equipment_rental_bookings", "water-equipment", "equipmentCategory", "Equipment Rental", get_equipment_payment_date),
    ]:
        service_records = db_session.scalars(
            select(ModuleRecord).where(ModuleRecord.module_key == module_key).order_by(desc(ModuleRecord.record_date), desc(ModuleRecord.updated_at))
        ).all()
        for record in service_records:
            payload = record.payload or {}
            category_value = (
                normalize_text(payload.get(category_field))
                or normalize_text(payload.get("serviceType"))
                or normalize_text(payload.get("equipmentItem"))
                or source_label
            )
            area_key = normalize_text(payload.get("businessAreaId")) or default_area
            for payment in service_payment_summary(module_key, payload)["payments"]:
                payment_date = parse_date(payment.get("paymentDate")) or date_getter(payload)
                if not in_month_scope(payment_date):
                    continue
                add_category_row(
                    area_id_value=area_key,
                    category_label=category_value,
                    sales_amount=payment.get("amountPaid"),
                    cost_amount=payment.get("costAmount"),
                    transaction_count=1,
                    source_label=source_label,
                )

    apartment_records = db_session.scalars(
        select(ModuleRecord).where(ModuleRecord.module_key == "apartments").order_by(desc(ModuleRecord.record_date), desc(ModuleRecord.updated_at))
    ).all()
    for record in apartment_records:
        payload = record.payload or {}
        apartment_area = normalize_text(payload.get("businessAreaId")) or "rentals-apartments"
        if in_month_scope(get_apartment_rent_payment_date(payload)):
            add_category_row(
                area_id_value=apartment_area,
                category_label="Rent",
                sales_amount=payload.get("rentPaid"),
                transaction_count=1,
                source_label="Apartment Rent",
            )
        if in_month_scope(get_apartment_bill_payment_date(payload)):
            add_category_row(
                area_id_value=apartment_area,
                category_label="Bills",
                sales_amount=payload.get("billAmountPaid"),
                transaction_count=1,
                source_label="Apartment Bills",
            )

    deposit_records = db_session.scalars(
        select(ModuleRecord).where(ModuleRecord.module_key == "security_deposit_records").order_by(desc(ModuleRecord.record_date), desc(ModuleRecord.updated_at))
    ).all()
    for record in deposit_records:
        payload = record.payload or {}
        apartment_area = normalize_text(payload.get("businessAreaId")) or "rentals-apartments"
        if in_month_scope(get_security_deposit_payment_date(payload)):
            add_category_row(
                area_id_value=apartment_area,
                category_label="Security Deposit",
                sales_amount=payload.get("depositPaid"),
                transaction_count=1,
                source_label="Security Deposit",
            )
        if in_month_scope(get_security_charge_payment_date(payload)):
            add_category_row(
                area_id_value=apartment_area,
                category_label="Tenant Charges",
                sales_amount=payload.get("chargesPaid"),
                transaction_count=1,
                source_label="Tenant Charges",
            )

    sales_records = db_session.scalars(
        select(ModuleRecord).where(ModuleRecord.module_key == "sales").order_by(desc(ModuleRecord.record_date), desc(ModuleRecord.updated_at))
    ).all()
    for record in sales_records:
        payload = record.payload or {}
        source_type = normalize_text(payload.get("sourceType")).lower() or "manual-sale"
        if source_type in generated_source_types:
            continue
        if not record_in_month_scope(record, scoped_month or month_value) or not record_in_area_scope(record, selected_area):
            continue
        add_category_row(
            area_id_value=normalize_text(record.business_area_id) or normalize_text(payload.get("businessAreaId")),
            category_label=normalize_text(payload.get("category")) or normalize_text(payload.get("sourceLabel")) or "General Sales",
            sales_amount=record.amount,
            cost_amount=module_record_cost_amount(record),
            transaction_count=payload.get("transactionCount") or 1,
            source_label=normalize_text(payload.get("sourceLabel")) or profit_source_label(source_type),
        )

    rows: list[dict[str, Any]] = []
    for row in row_map.values():
        row["marginPercent"] = round((row["profitTotal"] / row["salesTotal"]) * 100, 2) if row["salesTotal"] > 0 else 0.0
        row["sourceCount"] = len(row["sources"])
        row["sourceList"] = ", ".join(sorted(row["sources"])) if row["sources"] else "Direct"
        row.pop("sources", None)
        rows.append(row)

    rows.sort(key=lambda item: (item["profitTotal"], item["salesTotal"], item["categoryLabel"]), reverse=True)
    return rows


def search_target_for_module_record(record: ModuleRecord) -> str:
    if record.module_key == "online_orders":
        return url_for("online_orders_desk", order_id=record.id)
    if record.module_key == "pos_closeouts":
        return url_for("module_list", module_key="pos_closeouts")
    if record.module_key in MODULES and not MODULES[record.module_key].editable:
        return url_for("module_list", module_key=record.module_key)
    return url_for("module_form", module_key=record.module_key, record_id=record.id)


def build_module_export_rows(records: list[ModuleRecord], definition: ModuleDefinition) -> tuple[list[str], list[dict[str, Any]]]:
    base_headers = [
        "id",
        "title",
        "reference",
        "status",
        "businessAreaId",
        "month",
        "recordDate",
        "amount",
        "createdAt",
        "updatedAt",
    ]
    field_headers = [field.name for field in definition.fields if field.name not in base_headers]
    headers = base_headers + field_headers
    rows: list[dict[str, Any]] = []

    for record in records:
        payload = dict(record.payload or {})
        payload.setdefault("id", record.id)
        payload.setdefault("createdAt", record.created_at.isoformat())
        payload.setdefault("updatedAt", record.updated_at.isoformat())
        row = {
            "id": record.id,
            "title": record.title,
            "reference": record.reference or "",
            "status": record.status or "",
            "businessAreaId": record.business_area_id or payload.get("businessAreaId", ""),
            "month": record.month or payload.get("month", ""),
            "recordDate": record.record_date.isoformat() if record.record_date else "",
            "amount": record.amount,
            "createdAt": record.created_at.isoformat(),
            "updatedAt": record.updated_at.isoformat(),
        }
        for field_name in field_headers:
            row[field_name] = payload.get(field_name, "")
        rows.append(row)
    return headers, rows


def build_inventory_export_rows(products: list[Product]) -> tuple[list[str], list[dict[str, Any]]]:
    headers = [
        "id",
        "name",
        "businessAreaId",
        "category",
        "sku",
        "barcode",
        "itemType",
        "quantityOnHand",
        "minStockLevel",
        "salesPrice",
        "costPrice",
        "imageUrl",
        "trackInventory",
        "active",
        "notes",
        "createdAt",
        "updatedAt",
    ]
    rows = [
        {
            "id": item.id,
            "name": item.name,
            "businessAreaId": item.business_area_id,
            "category": item.category,
            "sku": item.sku,
            "barcode": item.barcode,
            "itemType": item.item_type,
            "quantityOnHand": item.quantity_on_hand,
            "minStockLevel": item.min_stock_level,
            "salesPrice": item.sales_price,
            "costPrice": item.cost_price,
            "imageUrl": item.image_url,
            "trackInventory": product_tracks_inventory(item),
            "active": item.active,
            "notes": item.notes,
            "createdAt": item.created_at.isoformat(),
            "updatedAt": item.updated_at.isoformat(),
        }
        for item in products
    ]
    return headers, rows


def build_online_order_export_rows(orders: list[dict[str, Any]]) -> tuple[list[str], list[dict[str, Any]]]:
    headers = [
        "orderNumber",
        "status",
        "paymentStatus",
        "customerName",
        "customerPhone",
        "customerEmail",
        "businessAreaSummary",
        "deliveryMode",
        "preferredDate",
        "preferredTime",
        "paymentMethod",
        "totalAmount",
        "paidAmount",
        "paymentDate",
        "staffNotes",
        "orderNotes",
        "createdAt",
        "updatedAt",
    ]
    rows = [
        {
            "orderNumber": order.get("orderNumber", ""),
            "status": order.get("status", ""),
            "paymentStatus": order.get("paymentStatus", ""),
            "customerName": order.get("customerName", ""),
            "customerPhone": order.get("customerPhone", ""),
            "customerEmail": order.get("customerEmail", ""),
            "businessAreaSummary": order.get("businessAreaSummary", ""),
            "deliveryMode": order.get("deliveryMode", ""),
            "preferredDate": order.get("preferredDate", ""),
            "preferredTime": order.get("preferredTime", ""),
            "paymentMethod": order.get("paymentMethod", ""),
            "totalAmount": order.get("totalAmount", 0),
            "paidAmount": order.get("paidAmount", 0),
            "paymentDate": order.get("paymentDate", ""),
            "staffNotes": order.get("staffNotes", ""),
            "orderNotes": order.get("orderNotes", ""),
            "createdAt": order.get("createdAt", ""),
            "updatedAt": order.get("updatedAt", ""),
        }
        for order in orders
    ]
    return headers, rows


def build_sidebar(user: User | None = None):
    allowed_keys = user_access_keys(user)
    items = []
    active_endpoint = request.endpoint or ""
    active_module = request.view_args.get("module_key") if request.view_args else ""
    for group_label, sections in MENU_GROUPS:
        rendered_sections = []
        group_active = False
        for section_label, keys in sections:
            links = []
            section_active = False
            for key in keys:
                if allowed_keys and key not in allowed_keys:
                    continue
                if key in SIDEBAR_LINK_LABELS:
                    label, endpoint, module = SIDEBAR_LINK_LABELS[key]
                elif key in MODULES:
                    label, endpoint, module = MODULES[key].label, "module_list", key
                else:
                    continue
                is_active = (module and active_module == module) or (not module and active_endpoint == endpoint)
                section_active = section_active or is_active
                links.append(
                    {
                        "label": label,
                        "endpoint": endpoint,
                        "module": module,
                        "is_active": is_active,
                    }
                )
            if links:
                rendered_sections.append({"label": section_label, "links": links, "is_active": section_active})
                group_active = group_active or section_active
        if rendered_sections:
            items.append({"group": group_label, "sections": rendered_sections, "is_active": group_active})
    return items


def is_orderable_area(area_id: str) -> bool:
    return area_id in {
        "water-equipment",
        "cold-store-groceries",
        "laundry-services",
        "mobile-money",
        "rentals-apartments",
        "fresh-foods-drinks",
        "kitchen",
    }


def create_app(config: AppConfig | None = None) -> Flask:
    app_config = config or load_config()
    engine = build_database_engine(app_config.database_url)
    SessionLocal = scoped_session(
        sessionmaker(bind=engine, autoflush=False, expire_on_commit=False, future=True)
    )

    app = Flask(
        __name__,
        template_folder="templates",
        static_folder="static",
    )
    app.config["SECRET_KEY"] = app_config.secret_key
    app.config["ONEROOT_CONFIG"] = app_config
    app.config["SESSION_LOCAL"] = SessionLocal
    app.config["DATABASE_READY"] = False
    app.config["DATABASE_NEXT_RETRY_AT"] = 0.0
    app.config["DATABASE_INIT_LOCK"] = Lock()

    app.jinja_env.globals.update(
        business_area_labels=BUSINESS_AREA_LABELS,
        business_area_short=BUSINESS_AREA_SHORT,
        current_year=datetime.utcnow().year,
        format_module_amount=format_module_amount,
        module_amount_label=module_amount_label,
        normalized_product_item_type=normalized_product_item_type,
        product_image_src=product_image_src,
        product_tracks_inventory=product_tracks_inventory,
        format_product_stock_badge=format_product_stock_badge,
        profit_source_label=profit_source_label,
    )
    app.jinja_env.filters["currency"] = format_currency
    app.jinja_env.filters["date_value"] = lambda value: value.isoformat() if isinstance(value, date) else ""
    app.jinja_env.filters["month_value"] = lambda value: value[:7] if isinstance(value, str) else ""
    app.jinja_env.filters["pretty_date"] = lambda value, long_month=False: format_display_date(value, long_month=long_month)

    def login_required(view):
        @wraps(view)
        def wrapped(*args, **kwargs):
            if not getattr(g, "current_user", None):
                if request.path.startswith("/app/api/"):
                    return jsonify({"ok": False, "error": "Sign in required."}), 401
                return redirect(url_for("login", next=request.path))
            return view(*args, **kwargs)

        return wrapped

    def access_required(key: str, *, api: bool = False):
        def decorator(view):
            @wraps(view)
            def wrapped(*args, **kwargs):
                if not getattr(g, "current_user", None):
                    if api or request.path.startswith("/app/api/"):
                        return jsonify({"ok": False, "error": "Sign in required."}), 401
                    return redirect(url_for("login", next=request.path))
                if not user_has_access(g.current_user, key):
                    if api or request.path.startswith("/app/api/"):
                        return jsonify({"ok": False, "error": "You do not have access to this area."}), 403
                    flash("You do not have access to that area.", "warning")
                    return redirect(url_for("dashboard"))
                attendance_gate = attendance_gate_response_for_request(
                    g.current_user,
                    key,
                    api=api or request.path.startswith("/app/api/"),
                )
                if attendance_gate is not None:
                    return attendance_gate
                return view(*args, **kwargs)

            return wrapped

        return decorator

    def database_required_for_path(path: str) -> bool:
        if path in {
            "/",
            "/track-order",
            "/track-order.html",
            "/icon.svg",
            "/operations",
            "/operations/",
            "/app/login",
            "/app/reconnecting",
            "/api/public-config",
            "/api/public/config",
        }:
            return False
        return not path.startswith(("/assets/", "/website/", "/static/"))

    def mark_database_unavailable() -> None:
        app.config["DATABASE_READY"] = False
        app.config["DATABASE_NEXT_RETRY_AT"] = time.monotonic() + DATABASE_RETRY_COOLDOWN_SECONDS

    def database_unavailable_response():
        message = "OneRoot is reconnecting to the database. Please refresh in a moment."
        if request.path.startswith("/api/") or request.path.startswith("/app/api/"):
            return jsonify({"ok": False, "error": message}), 503
        refresh_url = request.path
        if request.path == "/app/login" and request.method == "POST":
            refresh_url = url_for("login")
        return render_template(
            "workspace_reconnecting.html",
            page_title="Reconnecting",
            reconnect_message=message,
            refresh_url=refresh_url or "/",
        )

    def enforce_module_access(module_key: str):
        if user_has_access(g.current_user, module_key):
            return attendance_gate_response_for_request(g.current_user, module_key)
        flash("You do not have access to that module.", "warning")
        return redirect(url_for("dashboard"))

    def audit(module_key: str, module_label: str, action: str, title: str, record_id: str = "", detail: str = "") -> None:
        actor = getattr(g, "current_user", None)
        g.db.add(
            AuditLog(
                id=uuid4().hex,
                module_key=module_key,
                module_label=module_label,
                action=action,
                title=title,
                detail=detail,
                record_id=record_id,
                actor_id=getattr(actor, "id", ""),
                actor_name=getattr(actor, "full_name", "System") or getattr(actor, "username", "System"),
                actor_role=getattr(actor, "role", "system"),
            )
        )

    def find_user_by_username(username: str, exclude_user_id: str = "") -> User | None:
        clean_username = normalize_text(username).lower()
        if not clean_username:
            return None
        users = g.db.scalars(select(User).where(User.username.ilike(clean_username))).all()
        for user in users:
            if exclude_user_id and user.id == exclude_user_id:
                continue
            return user
        return None

    def active_owner_count(exclude_user_id: str = "") -> int:
        users = g.db.scalars(select(User)).all()
        return sum(
            1
            for user in users
            if user.id != exclude_user_id
            and normalize_role_key(user.role) == "owner"
            and user.active
            and user.login_enabled
        )

    def workspace_owner_name() -> str:
        users = g.db.scalars(select(User).order_by(User.created_at.asc())).all()
        for user in users:
            if not user.active:
                continue
            if normalize_role_key(user.role) == "owner":
                return normalize_text(user.full_name) or normalize_text(user.username) or "OneRoot Essentials"
        for user in users:
            if not user.active:
                continue
            if normalize_role_key(user.role) == "admin":
                return normalize_text(user.full_name) or normalize_text(user.username) or "OneRoot Essentials"
        return "OneRoot Essentials"

    def safe_next_path(value: Any, fallback: str) -> str:
        candidate = normalize_text(value)
        if candidate.startswith("/") and not candidate.startswith("//"):
            return candidate
        return fallback

    def attendance_display_name_for_user(user: User | None) -> str:
        return normalize_text(getattr(user, "full_name", "")) or normalize_text(getattr(user, "username", "")) or "Staff"

    def attendance_staff_role_for_user(user: User | None) -> str:
        if not user:
            return default_staff_role_for_access_role("viewer")
        return normalize_staff_role(getattr(user, "staff_role", ""), fallback_role=getattr(user, "role", "viewer"))

    def attendance_shift_type_for_timestamp(timestamp: datetime) -> str:
        hour = timestamp.hour
        if 5 <= hour < 12:
            return "Morning"
        if 12 <= hour < 17:
            return "Afternoon"
        if 17 <= hour < 22:
            return "Evening"
        return "Night"

    def attendance_reference_for_user(user: User | None, target_date: date) -> str:
        identity = normalize_text(getattr(user, "username", "")).lower() or normalize_text(getattr(user, "id", "")).lower() or "staff"
        return f"attendance|{target_date.isoformat()}|{identity}"

    def attendance_record_for_user(user: User | None, target_date: date) -> ModuleRecord | None:
        if not user:
            return None
        reference = attendance_reference_for_user(user, target_date)
        direct_match = g.db.scalar(
            select(ModuleRecord).where(
                ModuleRecord.module_key == "workforce_attendance",
                ModuleRecord.reference == reference,
            )
        )
        if direct_match:
            return direct_match

        match_names = {
            normalize_text(getattr(user, "full_name", "")).lower(),
            normalize_text(getattr(user, "username", "")).lower(),
        }
        match_names.discard("")
        if not match_names:
            return None

        candidate_records = g.db.scalars(
            select(ModuleRecord)
            .where(
                ModuleRecord.module_key == "workforce_attendance",
                ModuleRecord.record_date == target_date,
            )
            .order_by(desc(ModuleRecord.updated_at), desc(ModuleRecord.created_at))
        ).all()
        for candidate in candidate_records:
            payload = candidate.payload or {}
            candidate_names = {
                normalize_text(payload.get("staffName")).lower(),
                normalize_text(candidate.title).lower(),
                normalize_text(candidate.reference).lower(),
            }
            candidate_names.discard("")
            if match_names.intersection(candidate_names):
                return candidate
        return None

    def build_attendance_widget(user: User | None) -> dict[str, Any] | None:
        if not user or not user_has_access(user, "workforce_attendance"):
            return None

        target_date = current_local_datetime().date()
        record = attendance_record_for_user(user, target_date)
        payload = dict(record.payload if record else {})
        check_in_time = normalize_text(payload.get("checkInTime"))
        check_out_time = normalize_text(payload.get("checkOutTime"))
        worked_hours = parse_amount(payload.get("workedHours"))
        stored_status = normalize_text(payload.get("attendanceStatus")) or normalize_text(getattr(record, "status", ""))

        if check_out_time:
            status_label = "Checked Out"
            status_note = (
                f"{check_in_time or 'Start not saved'} to {check_out_time} · {worked_hours:.2f} hrs worked"
                if worked_hours > 0
                else f"Checked out at {check_out_time}"
            )
            tone = "success"
            can_check_in = False
            can_check_out = False
        elif check_in_time:
            status_label = "Checked In"
            status_note = f"Checked in at {check_in_time}. Tap Check Out when the shift ends."
            tone = "accent"
            can_check_in = False
            can_check_out = True
        elif record:
            status_label = stored_status or "Scheduled"
            if status_label == "Off Duty":
                status_note = "Marked off duty for today."
                tone = "muted"
                can_check_in = False
            else:
                status_note = "No check-in time saved yet for today."
                tone = "warning"
                can_check_in = True
            can_check_out = False
        else:
            status_label = "Not Checked In"
            status_note = f"No attendance has been saved for {target_date.strftime('%A, %d %b %Y')} yet."
            tone = "warning"
            can_check_in = True
            can_check_out = False

        return {
            "dateLabel": target_date.strftime("%A, %d %b %Y"),
            "staffName": attendance_display_name_for_user(user),
            "statusLabel": status_label,
            "statusNote": status_note,
            "tone": tone,
            "canCheckIn": can_check_in,
            "canCheckOut": can_check_out,
            "checkInTime": check_in_time,
            "checkOutTime": check_out_time,
            "workedHours": worked_hours,
            "recordId": getattr(record, "id", ""),
        }

    def attendance_gate_target_path() -> str:
        return url_for("module_list", module_key="workforce_attendance")

    def attendance_check_in_required(user: User | None) -> bool:
        if not user or not user_has_access(user, "workforce_attendance"):
            return False
        return normalize_role_key(getattr(user, "role", "viewer")) not in {"owner", "admin"}

    def attendance_is_checked_in(user: User | None, target_date: date | None = None) -> bool:
        if not attendance_check_in_required(user):
            return True
        record = attendance_record_for_user(user, target_date or current_local_datetime().date())
        if not record:
            return False
        payload = dict(record.payload or {})
        check_in_time = normalize_text(payload.get("checkInTime"))
        check_out_time = normalize_text(payload.get("checkOutTime"))
        stored_status = normalize_text(payload.get("attendanceStatus")) or normalize_text(getattr(record, "status", ""))
        if stored_status == "Off Duty" or check_out_time:
            return False
        return bool(check_in_time)

    def attendance_path_allowed(path: Any) -> bool:
        candidate = safe_next_path(path, attendance_gate_target_path())
        attendance_index = attendance_gate_target_path()
        attendance_form = url_for("module_form", module_key="workforce_attendance")
        return (
            candidate == attendance_index
            or candidate.startswith(f"{attendance_index}?")
            or candidate == attendance_form
            or candidate.startswith(f"{attendance_form}?")
            or candidate == url_for("logout")
        )

    def attendance_gate_response_for_request(user: User | None, module_key: str, *, api: bool = False):
        if not attendance_check_in_required(user):
            return None
        if module_key == "workforce_attendance" or attendance_is_checked_in(user):
            return None
        message = "Check in from Attendance before opening the rest of the workspace."
        if api:
            return jsonify(
                {
                    "ok": False,
                    "error": message,
                    "requiresCheckIn": True,
                    "redirect": attendance_gate_target_path(),
                }
            ), 403
        flash(message, "warning")
        return redirect(attendance_gate_target_path())

    def workspace_entry_path_for_user(user: User | None, next_value: Any = "") -> str:
        fallback = url_for("dashboard")
        next_path = safe_next_path(next_value, fallback)
        if attendance_check_in_required(user) and not attendance_is_checked_in(user) and not attendance_path_allowed(next_path):
            return attendance_gate_target_path()
        return next_path

    def apartment_document_bundle(record_id: str) -> dict[str, Any] | None:
        record = g.db.get(ModuleRecord, record_id)
        if not record or record.module_key != "apartments":
            return None
        suite = normalize_text((record.payload or {}).get("suite"))
        all_apartment_records = g.db.scalars(
            select(ModuleRecord)
            .where(ModuleRecord.module_key == "apartments")
            .order_by(desc(ModuleRecord.month), desc(ModuleRecord.updated_at))
        ).all()
        suite_records = [
            item
            for item in all_apartment_records
            if normalize_text((item.payload or {}).get("suite")) == suite
        ]
        profile = apartment_profile(record)
        source_payload = apartment_document_source_payload(record, suite_records)
        statement_rows = apartment_statement_rows(record, suite_records)
        return {
            "record": record,
            "profile": profile,
            "sourcePayload": source_payload,
            "statementRows": statement_rows,
            "statementTotals": apartment_statement_totals(statement_rows),
            "suiteRecords": suite_records,
        }

    def set_module_record_metadata(record: ModuleRecord, definition: ModuleDefinition, payload: dict[str, Any]) -> None:
        apply_module_record_metadata(record, definition, payload)

    def append_order_history(payload: dict[str, Any], status: str, note: str) -> None:
        history = payload.get("statusHistory")
        if not isinstance(history, list):
            history = []
        history.append(
            {
                "status": normalize_text(status) or "update",
                "at": datetime.utcnow().isoformat(),
                "note": normalize_text(note) or "Order updated.",
            }
        )
        payload["statusHistory"] = history[-40:]

    def compute_order_fixed_total(items: list[dict[str, Any]]) -> float:
        total = 0.0
        for item in items:
            quantity = max(parse_amount(item.get("quantity")), 1.0)
            line_total = parse_amount(item.get("lineTotal"))
            if line_total <= 0:
                line_total = round(quantity * parse_amount(item.get("unitPrice")), 2)
            total += line_total
        return round(total, 2)

    def serialize_online_order(record: ModuleRecord) -> dict[str, Any]:
        payload = serialize_module_record(record)
        items = payload.get("items") if isinstance(payload.get("items"), list) else []
        fixed_total = compute_order_fixed_total(items)
        quoted_total = parse_amount(payload.get("quotedTotal"))
        total_amount = quoted_total if quoted_total > 0 else fixed_total
        return {
            "id": record.id,
            "orderNumber": normalize_text(payload.get("orderNumber")),
            "status": normalize_text(payload.get("status")) or "new",
            "paymentStatus": normalize_text(payload.get("paymentStatus")) or "pending",
            "customerName": normalize_text(payload.get("customerName")),
            "customerPhone": normalize_text(payload.get("customerPhone")),
            "customerEmail": normalize_text(payload.get("customerEmail")),
            "deliveryMode": normalize_text(payload.get("deliveryMode")),
            "deliveryAddress": normalize_text(payload.get("deliveryAddress")),
            "preferredDate": normalize_text(payload.get("preferredDate")),
            "preferredTime": normalize_text(payload.get("preferredTime")),
            "paymentMethod": normalize_text(payload.get("paymentMethod")),
            "orderNotes": normalize_text(payload.get("orderNotes") or payload.get("notes")),
            "staffNotes": normalize_text(payload.get("staffNotes")),
            "businessAreaIds": payload.get("businessAreaIds") if isinstance(payload.get("businessAreaIds"), list) else [],
            "businessAreaSummary": normalize_text(payload.get("businessAreaSummary")),
            "quotedTotal": total_amount,
            "totalAmount": total_amount,
            "fixedTotal": fixed_total,
            "paidAmount": parse_amount(payload.get("paidAmount")),
            "paymentDate": normalize_text(payload.get("paymentDate")),
            "includesQuoteItems": any(parse_amount(item.get("unitPrice")) <= 0 for item in items),
            "items": items,
            "statusHistory": payload.get("statusHistory") if isinstance(payload.get("statusHistory"), list) else [],
            "createdAt": normalize_text(payload.get("createdAt")) or record.created_at.isoformat(),
            "updatedAt": normalize_text(payload.get("updatedAt")) or record.updated_at.isoformat(),
            "inventoryPostedAt": normalize_text(payload.get("inventoryPostedAt")),
        }

    def load_service_offers() -> list[dict[str, Any]]:
        service_path = Path(app_config.root_dir) / "website" / "service_offers.json"
        if not service_path.exists():
            return []
        try:
            payload = json.loads(service_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return []
        return payload if isinstance(payload, list) else []

    def build_public_config() -> dict[str, Any]:
        return {
            "domain": app_config.public_domain,
            "supportPhone": app_config.support_phone,
            "whatsappNumber": app_config.whatsapp_number,
            "supportEmail": app_config.support_email,
            "pickupNote": app_config.pickup_note,
            "paymentMethods": [
                "Cash On Delivery",
                "Mobile Money",
                "Bank Transfer",
                "Pay On Pickup",
            ],
            "deliveryModes": ["Pickup", "Delivery", "Call to Confirm"],
            "businessAreas": [area for area in BUSINESS_AREAS if is_orderable_area(area["id"])],
        }

    def build_public_catalog() -> list[dict[str, Any]]:
        items: list[dict[str, Any]] = []
        products = g.db.scalars(
            select(Product)
            .where(Product.active.is_(True))
            .order_by(Product.business_area_id.asc(), Product.category.asc(), Product.name.asc())
        ).all()
        for product in products:
            if not is_orderable_area(product.business_area_id):
                continue
            items.append(
                {
                    "id": product.id,
                    "sku": product.sku,
                    "name": product.name,
                    "businessAreaId": product.business_area_id,
                    "businessAreaLabel": BUSINESS_AREA_SHORT.get(product.business_area_id, product.business_area_id),
                    "category": product.category,
                    "salesPrice": product.sales_price,
                    "costPrice": product.cost_price,
                    "quantityOnHand": product.quantity_on_hand,
                    "quantityKnown": product.quantity_known,
                    "itemType": normalized_product_item_type(product.item_type, product.track_inventory),
                    "trackInventory": product_tracks_inventory(product),
                    "imageUrl": product_image_src(product),
                    "notes": product.notes,
                    "source": "inventory",
                }
            )
        for item in load_service_offers():
            business_area_id = normalize_text(item.get("businessAreaId"))
            if not is_orderable_area(business_area_id):
                continue
            items.append(
                {
                    "id": normalize_text(item.get("id")) or uuid4().hex,
                    "sku": normalize_text(item.get("sku")),
                    "name": normalize_text(item.get("name")),
                    "businessAreaId": business_area_id,
                    "businessAreaLabel": BUSINESS_AREA_SHORT.get(business_area_id, business_area_id),
                    "category": normalize_text(item.get("category")) or "Services",
                    "salesPrice": parse_amount(item.get("salesPrice")),
                    "costPrice": parse_amount(item.get("costPrice")),
                    "quantityOnHand": parse_amount(item.get("quantityOnHand")),
                    "quantityKnown": bool(item.get("quantityKnown", False)),
                    "itemType": normalize_text(item.get("itemType")) or "service",
                    "trackInventory": bool(item.get("trackInventory", False)),
                    "imageUrl": normalize_text(item.get("imageUrl")),
                    "notes": normalize_text(item.get("notes")),
                    "source": "service-offer",
                }
            )
        items.sort(key=lambda item: (item["businessAreaLabel"], item["category"], item["name"]))
        return items

    def serialize_public_vacancy(record: ModuleRecord) -> dict[str, Any] | None:
        payload = dict(record.payload or {})
        status = normalize_text(payload.get("vacancyStatus") or record.status)
        if status not in PUBLIC_JOB_VACANCY_STATUSES:
            return None
        business_area_id = normalize_text(payload.get("businessAreaId") or record.business_area_id)
        if not business_area_id:
            business_area_id = "shared-operations"
        staff_role = normalize_staff_role(payload.get("staffRole"), fallback_role="viewer")
        openings = max(int(parse_amount(payload.get("openings"))), 1)
        return {
            "id": record.id,
            "jobTitle": normalize_text(payload.get("jobTitle") or record.title),
            "staffRole": staff_role,
            "businessAreaId": business_area_id,
            "businessAreaLabel": BUSINESS_AREA_LABELS.get(business_area_id, business_area_id),
            "businessAreaShort": BUSINESS_AREA_SHORT.get(business_area_id, BUSINESS_AREA_LABELS.get(business_area_id, business_area_id)),
            "employmentType": normalize_text(payload.get("employmentType")),
            "vacancyStatus": status,
            "openings": openings,
            "location": normalize_text(payload.get("location")) or "Accra",
            "postedDate": normalize_text(payload.get("postedDate")) or (record.record_date.isoformat() if record.record_date else ""),
            "closingDate": normalize_text(payload.get("closingDate")),
            "salaryRange": normalize_text(payload.get("salaryRange")),
            "contactPerson": normalize_text(payload.get("contactPerson")),
            "applicationPhone": normalize_text(payload.get("applicationPhone")),
            "applicationEmail": normalize_text(payload.get("applicationEmail")) or app_config.support_email,
            "applicationLink": normalize_text(payload.get("applicationLink")),
            "summary": normalize_text(payload.get("summary")),
            "requirements": normalize_text(payload.get("requirements")),
            "howToApply": normalize_text(payload.get("howToApply")),
            "notes": normalize_text(payload.get("notes")),
        }

    def build_public_vacancies() -> list[dict[str, Any]]:
        records = g.db.scalars(
            select(ModuleRecord)
            .where(ModuleRecord.module_key == "job_vacancies")
            .order_by(desc(ModuleRecord.record_date), desc(ModuleRecord.updated_at))
        ).all()
        vacancies = [serialize_public_vacancy(record) for record in records]
        return [vacancy for vacancy in vacancies if vacancy]

    def build_catalog_lookup() -> dict[str, dict[str, Any]]:
        return {item["id"]: item for item in build_public_catalog()}

    def build_public_order_number() -> str:
        return f"ORO-{datetime.utcnow().strftime('%Y%m%d')}-{uuid4().hex[:4].upper()}"

    def build_online_order_area_totals(items: list[dict[str, Any]], order_total: float = 0.0) -> dict[str, float]:
        totals: dict[str, float] = defaultdict(float)
        quote_weights: dict[str, float] = defaultdict(float)
        priced_total = 0.0
        for item in items:
            area_id = normalize_text(item.get("businessAreaId"))
            if not area_id:
                continue
            quantity = max(parse_amount(item.get("quantity")), 1.0)
            line_total = parse_amount(item.get("lineTotal"))
            if line_total <= 0:
                unit_price = parse_amount(item.get("unitPrice"))
                if unit_price > 0:
                    line_total = round(quantity * unit_price, 2)
            if line_total > 0:
                totals[area_id] += line_total
                priced_total += line_total
            else:
                quote_weights[area_id] += quantity

        remaining_total = round(max(parse_amount(order_total) - priced_total, 0), 2)
        if remaining_total > 0 and quote_weights:
            weight_total = sum(quote_weights.values())
            running_total = 0.0
            area_ids = list(quote_weights.keys())
            for index, area_id in enumerate(area_ids):
                if index == len(area_ids) - 1:
                    share = round(remaining_total - running_total, 2)
                else:
                    share = round(remaining_total * (quote_weights[area_id] / weight_total), 2)
                    running_total += share
                totals[area_id] += share
        elif remaining_total > 0 and totals:
            first_area_id = next(iter(totals))
            totals[first_area_id] += remaining_total

        return {key: round(value, 2) for key, value in totals.items() if value > 0}

    def build_online_order_area_costs(items: list[dict[str, Any]]) -> dict[str, float]:
        totals: dict[str, float] = defaultdict(float)
        for item in items:
            area_id = normalize_text(item.get("businessAreaId"))
            if not area_id:
                continue
            quantity = max(parse_amount(item.get("quantity")), 1.0)
            unit_cost = parse_amount(item.get("costPrice"))
            if unit_cost <= 0:
                continue
            totals[area_id] += round(quantity * unit_cost, 2)
        return {key: round(value, 2) for key, value in totals.items() if value > 0}

    def month_anchor_date(month_value: Any) -> date | None:
        month_text = parse_month(month_value)
        if not month_text:
            return None
        try:
            return date.fromisoformat(f"{month_text}-01")
        except ValueError:
            return None

    def get_laundry_payment_date(payload: dict[str, Any]) -> date | None:
        return parse_date(payload.get("paymentDate")) or parse_date(payload.get("ticketDate"))

    def get_equipment_payment_date(payload: dict[str, Any]) -> date | None:
        return parse_date(payload.get("paymentDate")) or parse_date(payload.get("bookingDate"))

    def get_apartment_rent_payment_date(payload: dict[str, Any]) -> date | None:
        return (
            parse_date(payload.get("rentPaymentDate"))
            or parse_date(payload.get("rentCoverageStartDate"))
            or month_anchor_date(payload.get("month"))
        )

    def get_apartment_bill_payment_date(payload: dict[str, Any]) -> date | None:
        return (
            parse_date(payload.get("billPaymentDate"))
            or parse_date(payload.get("billDueDate"))
            or month_anchor_date(payload.get("month"))
        )

    def get_security_deposit_payment_date(payload: dict[str, Any]) -> date | None:
        return parse_date(payload.get("depositPaymentDate")) or parse_date(payload.get("captureDate"))

    def get_security_charge_payment_date(payload: dict[str, Any]) -> date | None:
        return parse_date(payload.get("chargePaymentDate")) or parse_date(payload.get("captureDate"))

    def upsert_generated_sale(
        db_session,
        *,
        reference: str,
        sale_date: date | None,
        business_area_id: str,
        amount: float,
        cost_amount: float = 0.0,
        profit_amount: float | None = None,
        source_type: str,
        source_label: str,
        note: str,
        transaction_count: int = 1,
    ) -> None:
        record = db_session.scalar(
            select(ModuleRecord).where(
                ModuleRecord.module_key == "sales",
                ModuleRecord.reference == reference,
            )
        )
        clean_amount = round(parse_amount(amount), 2)
        clean_cost = round(parse_amount(cost_amount), 2)
        clean_profit = round(parse_amount(clean_amount - clean_cost if profit_amount is None else profit_amount), 2)
        if clean_amount <= 0 or not sale_date or not business_area_id:
            if record:
                db_session.delete(record)
            return

        payload = {
            "id": record.id if record else uuid4().hex,
            "date": sale_date.isoformat(),
            "businessAreaId": business_area_id,
            "amount": clean_amount,
            "costAmount": clean_cost,
            "profitAmount": clean_profit,
            "notes": note,
            "sourceType": source_type,
            "sourceLabel": source_label,
            "transactionCount": max(int(parse_amount(transaction_count)), 1),
            "linkedGeneratedSalesKey": reference,
            "linkedPosAreaDateKey": "",
        }
        if not record:
            record = ModuleRecord(
                id=payload["id"],
                module_key="sales",
                created_at=datetime.utcnow(),
            )
            db_session.add(record)
        set_module_record_metadata(record, MODULES["sales"], payload)

    def sync_generated_sales_for_module_record(record: ModuleRecord, db_session=None) -> None:
        db = db_session or g.db
        payload = dict(record.payload or {})

        if record.module_key == "apartments":
            suite = normalize_text(payload.get("suite")) or "Suite"
            tenant = normalize_text(payload.get("tenantName")) or "Tenant"
            upsert_generated_sale(
                db,
                reference=f"apartment-rent-payment|{record.id}",
                sale_date=get_apartment_rent_payment_date(payload),
                business_area_id="rentals-apartments",
                amount=parse_amount(payload.get("rentPaid")),
                source_type="apartment-rent-payment",
                source_label="Apartment Rent Payment",
                note=f"[Apartment Sync] Rent payment for {tenant} in {suite}.",
            )
            upsert_generated_sale(
                db,
                reference=f"apartment-bill-payment|{record.id}",
                sale_date=get_apartment_bill_payment_date(payload),
                business_area_id="rentals-apartments",
                amount=parse_amount(payload.get("billAmountPaid")),
                source_type="apartment-bill-payment",
                source_label="Apartment Bills Payment",
                note=f"[Apartment Sync] Bills payment for {tenant} in {suite}.",
            )
            return

        if record.module_key == "laundry_tickets":
            area_id = normalize_text(payload.get("businessAreaId")) or "laundry-services"
            customer = normalize_text(payload.get("customerName")) or "Customer"
            service_type = normalize_text(payload.get("serviceType")) or "Laundry"
            prefix = f"laundry-payment|{record.id}"
            payment_summary = service_payment_summary(record.module_key, payload)
            kept_references = set()
            for index, payment in enumerate(payment_summary["payments"], start=1):
                reference = f"{prefix}|{payment['id']}"
                kept_references.add(reference)
                payment_date = parse_date(payment.get("paymentDate")) or get_laundry_payment_date(payload)
                upsert_generated_sale(
                    db,
                    reference=reference,
                    sale_date=payment_date,
                    business_area_id=area_id,
                    amount=payment.get("amountPaid", 0),
                    cost_amount=payment.get("costAmount", 0),
                    profit_amount=payment.get("profitAmount", 0),
                    source_type="laundry-payment",
                    source_label="Laundry Payment",
                    note=f"[Laundry Sync] Payment {index} for {service_type} from {customer}.",
                )
            stale_records = db.scalars(
                select(ModuleRecord).where(
                    ModuleRecord.module_key == "sales",
                    or_(
                        ModuleRecord.reference == prefix,
                        ModuleRecord.reference.ilike(f"{prefix}|%"),
                    ),
                )
            ).all()
            for stale_record in stale_records:
                if stale_record.reference not in kept_references:
                    db.delete(stale_record)
            return

        if record.module_key == "equipment_rental_bookings":
            area_id = normalize_text(payload.get("businessAreaId")) or "water-equipment"
            customer = normalize_text(payload.get("customerName")) or "Customer"
            equipment_item = normalize_text(payload.get("equipmentItem")) or "Equipment Rental"
            prefix = f"equipment-rental-payment|{record.id}"
            payment_summary = service_payment_summary(record.module_key, payload)
            kept_references = set()
            for index, payment in enumerate(payment_summary["payments"], start=1):
                reference = f"{prefix}|{payment['id']}"
                kept_references.add(reference)
                payment_date = parse_date(payment.get("paymentDate")) or get_equipment_payment_date(payload)
                upsert_generated_sale(
                    db,
                    reference=reference,
                    sale_date=payment_date,
                    business_area_id=area_id,
                    amount=payment.get("amountPaid", 0),
                    cost_amount=payment.get("costAmount", 0),
                    profit_amount=payment.get("profitAmount", 0),
                    source_type="equipment-rental-payment",
                    source_label="Equipment Rental Payment",
                    note=f"[Equipment Sync] Payment {index} for {equipment_item} by {customer}.",
                )
            stale_records = db.scalars(
                select(ModuleRecord).where(
                    ModuleRecord.module_key == "sales",
                    or_(
                        ModuleRecord.reference == prefix,
                        ModuleRecord.reference.ilike(f"{prefix}|%"),
                    ),
                )
            ).all()
            for stale_record in stale_records:
                if stale_record.reference not in kept_references:
                    db.delete(stale_record)
            return

        if record.module_key == "security_deposit_records":
            suite = normalize_text(payload.get("suite")) or "Suite"
            tenant = normalize_text(payload.get("tenantName")) or "Tenant"
            upsert_generated_sale(
                db,
                reference=f"security-deposit-payment|{record.id}",
                sale_date=get_security_deposit_payment_date(payload),
                business_area_id="rentals-apartments",
                amount=parse_amount(payload.get("depositPaid")),
                source_type="security-deposit-payment",
                source_label="Security Deposit Payment",
                note=f"[Deposit Sync] Security deposit payment for {tenant} in {suite}.",
            )
            upsert_generated_sale(
                db,
                reference=f"tenant-charge-payment|{record.id}",
                sale_date=get_security_charge_payment_date(payload),
                business_area_id="rentals-apartments",
                amount=parse_amount(payload.get("chargesPaid")),
                source_type="tenant-charge-payment",
                source_label="Tenant Charges Payment",
                note=f"[Deposit Sync] Tenant charges payment for {tenant} in {suite}.",
            )
            return

    def sync_online_order_sales(order_record: ModuleRecord, db_session=None) -> None:
        db = db_session or g.db
        payload = dict(order_record.payload or {})
        order_number = normalize_text(payload.get("orderNumber"))
        payment_status = normalize_text(payload.get("paymentStatus")).lower()
        paid_amount = parse_amount(payload.get("paidAmount"))
        items = payload.get("items") if isinstance(payload.get("items"), list) else []
        order_total = parse_amount(payload.get("quotedTotal")) or compute_order_fixed_total(items)
        area_totals = build_online_order_area_totals(items, order_total=order_total)
        area_costs = build_online_order_area_costs(items)
        payment_date = parse_date(payload.get("paymentDate")) or parse_date(payload.get("updatedAt")) or date.today()

        existing_records = db.scalars(
            select(ModuleRecord).where(
                ModuleRecord.module_key == "sales",
                ModuleRecord.reference.ilike(f"online-order-payments|{order_number}|%"),
            )
        ).all()

        if payment_status != "paid" or paid_amount <= 0 or not area_totals:
            for existing in existing_records:
                db.delete(existing)
            return

        grand_total = round(sum(area_totals.values()), 2)
        ratio = paid_amount / grand_total if grand_total > 0 else 0
        kept_references = set()
        for area_id, area_total in area_totals.items():
            amount = round(area_total * ratio if ratio else area_total, 2)
            cost_amount = round(parse_amount(area_costs.get(area_id)) * ratio if ratio else parse_amount(area_costs.get(area_id)), 2)
            reference = f"online-order-payments|{order_number}|{area_id}"
            kept_references.add(reference)
            existing = next((record for record in existing_records if record.reference == reference), None)
            sales_payload = {
                "id": existing.id if existing else uuid4().hex,
                "date": payment_date.isoformat(),
                "businessAreaId": area_id,
                "amount": amount,
                "costAmount": cost_amount,
                "profitAmount": round(amount - cost_amount, 2),
                "notes": f"[Online Order Sync] Paid online order {order_number} for {BUSINESS_AREA_SHORT.get(area_id, area_id)}.",
                "sourceType": "online-order-payments",
                "sourceLabel": "Online Order Payment",
                "transactionCount": 1,
                "linkedGeneratedSalesKey": reference,
                "linkedPosAreaDateKey": "",
            }
            if not existing:
                existing = ModuleRecord(
                    id=sales_payload["id"],
                    module_key="sales",
                    created_at=datetime.utcnow(),
                )
                db.add(existing)
            set_module_record_metadata(existing, MODULES["sales"], sales_payload)

        for existing in existing_records:
            if existing.reference not in kept_references:
                db.delete(existing)

    def post_online_order_inventory_if_needed(order_record: ModuleRecord, db_session=None) -> None:
        db = db_session or g.db
        payload = dict(order_record.payload or {})
        status = normalize_text(payload.get("status")).lower()
        payment_status = normalize_text(payload.get("paymentStatus")).lower()
        if payload.get("inventoryPostedAt"):
            return
        if payment_status != "paid" and status not in {"fulfilled", "completed"}:
            return

        items = payload.get("items") if isinstance(payload.get("items"), list) else []
        posted_any = False
        for item in items:
            if not item.get("trackInventory"):
                continue
            product_id = normalize_text(item.get("productId"))
            product = db.get(Product, product_id) if product_id else None
            if not product:
                continue
            quantity = max(parse_amount(item.get("quantity")), 1.0)
            product.quantity_on_hand = round(product.quantity_on_hand - quantity, 2)
            product.updated_at = datetime.utcnow()
            posted_any = True

        if posted_any:
            payload["inventoryPostedAt"] = datetime.utcnow().isoformat()
            order_record.payload = payload
            order_record.updated_at = datetime.utcnow()

    def create_online_order_record(payload: dict[str, Any]) -> ModuleRecord:
        catalog_lookup = build_catalog_lookup()
        raw_items = payload.get("items") if isinstance(payload.get("items"), list) else []
        order_items: list[dict[str, Any]] = []

        for raw_item in raw_items:
            item_id = normalize_text(raw_item.get("id") or raw_item.get("productId"))
            catalog_item = catalog_lookup.get(item_id)
            if not catalog_item:
                continue
            quantity = max(parse_amount(raw_item.get("quantity")), 1.0)
            unit_price = parse_amount(raw_item.get("unitPrice"))
            if unit_price <= 0:
                unit_price = parse_amount(catalog_item.get("salesPrice"))
            line_total = round(quantity * unit_price, 2)
            order_items.append(
                {
                    "productId": catalog_item["id"],
                    "sku": catalog_item.get("sku", ""),
                    "name": catalog_item["name"],
                    "businessAreaId": catalog_item["businessAreaId"],
                    "category": catalog_item.get("category", ""),
                    "itemType": catalog_item.get("itemType", "stock"),
                    "trackInventory": bool(catalog_item.get("trackInventory")),
                    "quantity": quantity,
                    "unitPrice": unit_price,
                    "costPrice": parse_amount(catalog_item.get("costPrice")),
                    "lineTotal": line_total,
                    "notes": normalize_text(raw_item.get("notes")),
                }
            )

        if not order_items:
            raise ValueError("Add at least one valid item to the online order.")

        area_ids = sorted({item["businessAreaId"] for item in order_items if item.get("businessAreaId")})
        order_number = build_public_order_number()
        quoted_total = round(sum(item["lineTotal"] for item in order_items), 2)
        order_payload = {
            "id": uuid4().hex,
            "orderNumber": order_number,
            "createdAt": datetime.utcnow().isoformat(),
            "updatedAt": datetime.utcnow().isoformat(),
            "status": "new",
            "paymentStatus": "pending",
            "paidAmount": 0.0,
            "paymentDate": "",
            "customerName": normalize_text(payload.get("customerName")),
            "customerPhone": normalize_text(payload.get("customerPhone")),
            "customerEmail": normalize_text(payload.get("customerEmail")),
            "deliveryMode": normalize_text(payload.get("deliveryMode")) or "Call to Confirm",
            "deliveryAddress": normalize_text(payload.get("deliveryAddress")),
            "preferredDate": normalize_text(payload.get("preferredDate")),
            "preferredTime": normalize_text(payload.get("preferredTime")),
            "paymentMethod": normalize_text(payload.get("paymentMethod")) or "Pay On Pickup",
            "orderNotes": normalize_text(payload.get("orderNotes") or payload.get("notes")),
            "staffNotes": "",
            "quotedTotal": quoted_total,
            "businessAreaIds": area_ids,
            "businessAreaSummary": ", ".join(BUSINESS_AREA_SHORT.get(area_id, area_id) for area_id in area_ids),
            "items": order_items,
            "source": "website",
        }
        append_order_history(order_payload, "new", "Order received from the OneRoot website.")
        record = ModuleRecord(
            id=order_payload["id"],
            module_key="online_orders",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        set_module_record_metadata(record, MODULES["online_orders"], order_payload)
        return record

    def parse_field_input(field: FieldDefinition, form_data) -> Any:
        raw = form_data.get(field.name, "")
        if field.field_type == "number":
            return parse_amount(raw)
        if field.field_type == "checkbox":
            return raw == "on"
        if field.field_type == "date":
            return normalize_text(raw)
        if field.field_type == "month":
            return parse_month(raw)
        return normalize_text(raw)

    def serialize_module_record(record: ModuleRecord) -> dict[str, Any]:
        payload = dict(record.payload or {})
        payload.setdefault("id", record.id)
        payload.setdefault("createdAt", record.created_at.isoformat())
        payload.setdefault("updatedAt", record.updated_at.isoformat())
        return payload

    def export_workspace_snapshot() -> dict[str, Any]:
        workspace = {legacy_key: [] for legacy_key in MODULE_TO_LEGACY.values()}
        workspace["inventoryItems"] = []
        workspace["posOrders"] = []
        workspace["auditTrail"] = []
        workspace["userProfiles"] = []

        module_records = g.db.scalars(select(ModuleRecord)).all()
        for record in module_records:
            legacy_key = MODULE_TO_LEGACY.get(record.module_key)
            if not legacy_key:
                continue
            workspace.setdefault(legacy_key, []).append(serialize_module_record(record))

        products = g.db.scalars(select(Product).order_by(Product.name)).all()
        for product in products:
            workspace["inventoryItems"].append(
                {
                    "id": product.id,
                    "createdAt": product.created_at.isoformat(),
                    "updatedAt": product.updated_at.isoformat(),
                    "sourceCatalogId": product.source_catalog_id,
                    "sku": product.sku,
                    "barcode": product.barcode,
                    "name": product.name,
                    "businessAreaId": product.business_area_id,
                    "category": product.category,
                    "sourceCategory": product.source_category,
                    "itemType": normalized_product_item_type(product.item_type, product.track_inventory),
                    "trackInventory": product_tracks_inventory(product),
                    "quantityOnHand": product.quantity_on_hand,
                    "quantityKnown": product_quantity_known(product),
                    "minStockLevel": product.min_stock_level,
                    "salesPrice": product.sales_price,
                    "costPrice": product.cost_price,
                    "imageUrl": product.image_url,
                    "active": product.active,
                    "notes": product.notes,
                    "userCreated": product.user_created,
                }
            )

        pos_orders = g.db.scalars(
            select(PosOrder).options(selectinload(PosOrder.lines)).order_by(desc(PosOrder.order_date), desc(PosOrder.updated_at))
        ).all()
        for order in pos_orders:
            workspace["posOrders"].append(
                {
                    "id": order.id,
                    "orderNumber": order.order_number,
                    "createdAt": order.created_at.isoformat(),
                    "updatedAt": order.updated_at.isoformat(),
                    "orderDate": order.order_date.isoformat(),
                    "businessAreaId": order.primary_business_area_id,
                    "businessAreaIds": list(order.business_area_ids or []),
                    "paymentMethod": order.payment_method,
                    "customerName": order.customer_name,
                    "customerPhone": order.customer_phone,
                    "notes": order.notes,
                    "itemCount": order.item_count,
                    "subtotal": order.subtotal,
                    "totalAmount": order.total_amount,
                    "items": [
                        {
                            "productId": line.product_id,
                            "businessAreaId": line.business_area_id,
                            "sku": line.sku,
                            "barcode": line.barcode,
                            "name": line.name,
                            "category": line.category,
                            "itemType": line.item_type,
                            "trackInventory": line.track_inventory,
                            "quantity": line.quantity,
                            "unitPrice": line.unit_price,
                            "unitCost": line.unit_cost,
                            "costAmount": line.cost_amount,
                            "totalAmount": line.total_amount,
                        }
                        for line in order.lines
                    ],
                }
            )

        audits = g.db.scalars(select(AuditLog).order_by(desc(AuditLog.created_at)).limit(2500)).all()
        workspace["auditTrail"] = [
            {
                "id": entry.id,
                "timestamp": entry.created_at.isoformat(),
                "moduleKey": entry.module_key,
                "moduleLabel": entry.module_label,
                "action": entry.action,
                "title": entry.title,
                "detail": entry.detail,
                "recordId": entry.record_id,
                "actorId": entry.actor_id,
                "actorName": entry.actor_name,
                "actorRole": entry.actor_role,
                "entryCount": entry.entry_count,
            }
            for entry in audits
        ]

        users = g.db.scalars(select(User).order_by(User.username)).all()
        workspace["userProfiles"] = [
            {
                "id": user.id,
                "createdAt": user.created_at.isoformat(),
                "updatedAt": user.updated_at.isoformat(),
                "fullName": user.full_name,
                "username": user.username,
                "role": user.role,
                "staffRole": normalize_staff_role(user.staff_role, fallback_role=user.role),
                "phone": user.phone,
                "active": user.active,
                "loginEnabled": user.login_enabled,
                "passwordHash": user.password_hash,
                "notes": user.notes,
            }
            for user in users
        ]

        return {
            "schemaVersion": 3,
            "app": "OneRoot Essentials Platform",
            "exportedAt": datetime.utcnow().isoformat() + "Z",
            "settings": {"currency": "GHS", "activeUserId": getattr(g.current_user, "id", "")},
            "workspace": workspace,
        }

    def build_pos_counter_summary(order_date: date, area_id: str = "") -> dict[str, Any]:
        selected_area = normalize_text(area_id)
        all_orders = g.db.scalars(
            select(PosOrder).options(selectinload(PosOrder.lines)).where(PosOrder.order_date == order_date).order_by(desc(PosOrder.updated_at))
        ).all()

        order_rows: list[dict[str, Any]] = []
        payment_mix: dict[str, float] = defaultdict(float)
        total_amount = 0.0
        total_cost = 0.0
        item_count = 0.0
        business_areas: set[str] = set()

        for order in all_orders:
            order_total = 0.0
            order_items = 0.0
            order_area_ids: set[str] = set()
            for line in order.lines:
                if selected_area and line.business_area_id != selected_area:
                    continue
                order_total += parse_amount(line.total_amount)
                total_cost += parse_amount(line.cost_amount)
                order_items += parse_amount(line.quantity)
                if line.business_area_id:
                    order_area_ids.add(line.business_area_id)

            if selected_area:
                if order_total <= 0:
                    continue
            else:
                order_total = parse_amount(order.total_amount)
                order_items = parse_amount(order.item_count)
                order_area_ids = set(order.business_area_ids or [])

            payment_method = normalize_text(order.payment_method) or "Unspecified"
            total_amount += order_total
            item_count += order_items
            payment_mix[payment_method] += order_total
            business_areas.update(order_area_ids)
            order_rows.append(
                {
                    "id": order.id,
                    "orderNumber": order.order_number,
                    "orderDate": order.order_date.isoformat(),
                    "paymentMethod": payment_method,
                    "customerName": order.customer_name,
                    "itemCount": round(order_items, 2),
                    "totalAmount": round(order_total, 2),
                    "businessAreaIds": sorted(order_area_ids),
                    "receiptUrl": url_for("pos_receipt", order_id=order.id),
                }
            )

        sales_query = select(ModuleRecord).where(
            ModuleRecord.module_key == "sales",
            ModuleRecord.record_date == order_date,
        )
        if selected_area:
            sales_query = sales_query.where(ModuleRecord.business_area_id == selected_area)
        sales_rows = g.db.scalars(sales_query).all()
        daily_sales_total = round(sum(parse_amount(record.amount) for record in sales_rows), 2)

        reference = f"pos-closeout|{order_date.isoformat()}|{selected_area or 'all'}"
        closeout_record = g.db.scalar(
            select(ModuleRecord).where(
                ModuleRecord.module_key == "pos_closeouts",
                ModuleRecord.reference == reference,
            )
        )
        closeout_payload = serialize_module_record(closeout_record) if closeout_record else None

        return {
            "orderDate": order_date.isoformat(),
            "areaId": selected_area,
            "areaLabel": BUSINESS_AREA_SHORT.get(selected_area, "All POS Areas") if selected_area else "All POS Areas",
            "orderCount": len(order_rows),
            "itemCount": round(item_count, 2),
            "totalAmount": round(total_amount, 2),
            "costAmount": round(total_cost, 2),
            "profitAmount": round(total_amount - total_cost, 2),
            "dailySalesLedgerTotal": daily_sales_total,
            "paymentMix": {key: round(value, 2) for key, value in sorted(payment_mix.items())},
            "orders": order_rows[:20],
            "businessAreaIds": sorted(business_areas),
            "lastCloseout": closeout_payload,
        }

    def sync_existing_pos_closeouts(order_date: date, area_ids: list[str] | None = None) -> None:
        scoped_area_ids = {normalize_text(area_id) for area_id in (area_ids or []) if normalize_text(area_id)}
        scoped_area_ids.add("")
        actor_name = getattr(g.current_user, "full_name", "") or getattr(g.current_user, "username", "") or "staff"

        for area_id in sorted(scoped_area_ids):
            reference = f"pos-closeout|{order_date.isoformat()}|{area_id or 'all'}"
            record = g.db.scalar(
                select(ModuleRecord).where(
                    ModuleRecord.module_key == "pos_closeouts",
                    ModuleRecord.reference == reference,
                )
            )
            if not record:
                continue

            summary = build_pos_counter_summary(order_date, area_id)
            if summary["orderCount"] <= 0:
                g.db.delete(record)
                continue

            existing_payload = dict(record.payload or {})
            closeout_payload = {
                "id": record.id,
                "orderDate": summary["orderDate"],
                "areaId": area_id,
                "areaLabel": summary["areaLabel"],
                "reference": reference,
                "status": "closed",
                "totalAmount": summary["totalAmount"],
                "costAmount": summary["costAmount"],
                "profitAmount": summary["profitAmount"],
                "orderCount": summary["orderCount"],
                "itemCount": summary["itemCount"],
                "dailySalesLedgerTotal": summary["dailySalesLedgerTotal"],
                "paymentMix": summary["paymentMix"],
                "orderNumbers": [order["orderNumber"] for order in summary["orders"]],
                "closedAt": existing_payload.get("closedAt") or datetime.utcnow().isoformat(),
                "closedBy": existing_payload.get("closedBy") or actor_name,
                "notes": normalize_text(existing_payload.get("notes"))
                or f"Counter closeout for {summary['areaLabel']} on {summary['orderDate']}.",
            }
            set_module_record_metadata(record, MODULES["pos_closeouts"], closeout_payload)

    def sync_generated_sales_for_pos(order_date: date, area_ids: list[str], db_session=None) -> None:
        db = db_session or g.db
        unique_area_ids = sorted({area_id for area_id in area_ids if area_id})
        for area_id in unique_area_ids:
            orders = db.scalars(
                select(PosOrder)
                .options(selectinload(PosOrder.lines))
                .where(PosOrder.order_date == order_date)
            ).all()
            total_amount = 0.0
            total_cost = 0.0
            order_count = 0
            for order in orders:
                order_area_total = 0.0
                order_area_cost = 0.0
                for line in order.lines:
                    if line.business_area_id == area_id:
                        order_area_total += parse_amount(line.total_amount)
                        order_area_cost += parse_amount(line.cost_amount)
                if order_area_total > 0:
                    total_amount += order_area_total
                    total_cost += order_area_cost
                    order_count += 1

            reference = f"pos-summary|{order_date.isoformat()}|{area_id}"
            record = db.scalar(
                select(ModuleRecord).where(
                    ModuleRecord.module_key == "sales",
                    ModuleRecord.reference == reference,
                )
            )

            if total_amount <= 0:
                if record:
                    db.delete(record)
                continue

            payload = {
                "id": record.id if record else uuid4().hex,
                "date": order_date.isoformat(),
                "businessAreaId": area_id,
                "amount": round(total_amount, 2),
                "costAmount": round(total_cost, 2),
                "profitAmount": round(total_amount - total_cost, 2),
                "notes": f"[POS Sync] {order_count} order{'s' if order_count != 1 else ''} captured in POS for {BUSINESS_AREA_SHORT.get(area_id, area_id)}.",
                "sourceType": "pos-summary",
                "sourceLabel": "POS Sync",
                "transactionCount": max(order_count, 1),
                "linkedGeneratedSalesKey": reference,
                "linkedPosAreaDateKey": f"{order_date.isoformat()}|{area_id}",
            }
            if not record:
                record = ModuleRecord(
                    id=payload["id"],
                    module_key="sales",
                    created_at=datetime.utcnow(),
                )
                db.add(record)
            set_module_record_metadata(record, MODULES["sales"], payload)

    def reconcile_generated_sales(db_session) -> None:
        pos_area_map: dict[date, set[str]] = defaultdict(set)
        pos_orders = db_session.scalars(select(PosOrder)).all()
        for order in pos_orders:
            for area_id in order.business_area_ids or []:
                if area_id:
                    pos_area_map[order.order_date].add(area_id)
        for order_date, area_ids in pos_area_map.items():
            sync_generated_sales_for_pos(order_date, sorted(area_ids), db_session=db_session)

        records = db_session.scalars(
            select(ModuleRecord).where(
                ModuleRecord.module_key.in_(
                    [
                        "online_orders",
                        "apartments",
                        "laundry_tickets",
                        "equipment_rental_bookings",
                        "security_deposit_records",
                    ]
                )
            )
        ).all()
        for record in records:
            if record.module_key == "online_orders":
                sync_online_order_sales(record, db_session=db_session)
            else:
                sync_generated_sales_for_module_record(record, db_session=db_session)

    def ensure_database_ready() -> bool:
        if app.config["DATABASE_READY"]:
            return True

        if time.monotonic() < app.config["DATABASE_NEXT_RETRY_AT"]:
            return False

        with app.config["DATABASE_INIT_LOCK"]:
            if app.config["DATABASE_READY"]:
                return True
            if time.monotonic() < app.config["DATABASE_NEXT_RETRY_AT"]:
                return False

            try:
                initialize_database(engine, SessionLocal, app_config)
            except OperationalError:
                SessionLocal.remove()
                mark_database_unavailable()
                return False

            app.config["DATABASE_READY"] = True
            app.config["DATABASE_NEXT_RETRY_AT"] = 0.0
            return True

    @app.before_request
    def open_session():
        g.db = app.config["SESSION_LOCAL"]()
        g.current_user = None
        needs_database = database_required_for_path(request.path or "/")
        if needs_database and not ensure_database_ready():
            g.db.close()
            app.config["SESSION_LOCAL"].remove()
            g.db = None
            return database_unavailable_response()

        user_id = session.get("user_id")
        pending_login_user = normalize_text(session.get("pending_login_user")).lower()
        if not user_id and pending_login_user and app.config["DATABASE_READY"]:
            pending_user = find_user_by_username(pending_login_user)
            if pending_user and pending_user.active and pending_user.login_enabled:
                session["user_id"] = pending_user.id
                session.pop("pending_login_user", None)
                user_id = pending_user.id

        if user_id and request.path.startswith(("/app", "/operations")):
            try:
                g.current_user = g.db.get(User, user_id)
            except OperationalError:
                session.clear()
                mark_database_unavailable()
                return database_unavailable_response()
            if not g.current_user or not g.current_user.active:
                session.clear()
                g.current_user = None

    @app.teardown_request
    def close_session(exception):
        db_session = getattr(g, "db", None)
        if not db_session:
            return
        try:
            if exception:
                db_session.rollback()
        finally:
            db_session.close()
            app.config["SESSION_LOCAL"].remove()

    @app.errorhandler(OperationalError)
    def handle_database_operational_error(_error):
        mark_database_unavailable()
        db_session = getattr(g, "db", None)
        if db_session:
            db_session.rollback()
        return database_unavailable_response()

    @app.route("/website/<path:filename>")
    def website_files(filename: str):
        return send_from_directory(Path(app_config.root_dir) / "website", filename, max_age=0)

    @app.route("/assets/<path:filename>")
    def public_asset_files(filename: str):
        return send_from_directory(Path(app_config.root_dir) / "assets", filename, max_age=0)

    @app.route("/icon.svg")
    def public_icon():
        return send_from_directory(app_config.root_dir, "icon.svg", max_age=0)

    @app.route("/app/products/<product_id>/placeholder.svg")
    def product_placeholder_image(product_id: str):
        product = None
        if ensure_database_ready():
            db_session = app.config["SESSION_LOCAL"]()
            try:
                product = db_session.get(Product, normalize_text(product_id))
            finally:
                db_session.close()
                app.config["SESSION_LOCAL"].remove()
        svg_payload = product_placeholder_svg_payload(
            product.name if product else "OneRoot Item",
            product.category if product else "Product",
            product.business_area_id if product else "shared-operations",
        )
        return Response(svg_payload, mimetype="image/svg+xml", headers={"Cache-Control": "no-store"})

    @app.route("/manifest.webmanifest")
    def public_manifest():
        return send_from_directory(app_config.root_dir, "manifest.webmanifest", max_age=0)

    @app.route("/service-worker.js")
    def public_service_worker():
        return send_from_directory(app_config.root_dir, "service-worker.js", max_age=0)

    @app.route("/")
    def home():
        return send_from_directory(Path(app_config.root_dir) / "website", "index.html", max_age=0)

    @app.route("/track-order")
    @app.route("/track-order.html")
    def track_order_page():
        return send_from_directory(Path(app_config.root_dir) / "website", "track-order.html", max_age=0)

    @app.route("/operations")
    @app.route("/operations/")
    def operations_alias():
        return redirect(url_for("dashboard") if session.get("user_id") else url_for("login"))

    @app.route("/api/public-config")
    @app.route("/api/public/config")
    def public_config_api():
        return jsonify(build_public_config())

    @app.route("/api/catalog")
    @app.route("/api/public/catalog")
    def public_catalog_api():
        catalog = build_public_catalog()
        area_counts: dict[str, int] = defaultdict(int)
        for item in catalog:
            area_id = normalize_text(item.get("businessAreaId"))
            if area_id:
                area_counts[area_id] += 1
        return jsonify(
            {
                "ok": True,
                "items": catalog,
                "paymentMethods": build_public_config()["paymentMethods"],
                "businessAreas": [
                    {
                        **area,
                        "shortLabel": BUSINESS_AREA_SHORT.get(area["id"], area["label"]),
                        "itemCount": area_counts.get(area["id"], 0),
                    }
                    for area in BUSINESS_AREAS
                    if is_orderable_area(area["id"])
                ],
            }
        )

    @app.route("/api/vacancies")
    @app.route("/api/public/vacancies")
    def public_vacancies_api():
        vacancies = build_public_vacancies()
        return jsonify(
            {
                "ok": True,
                "items": vacancies,
                "count": len(vacancies),
            }
        )

    @app.route("/api/orders", methods=["POST"])
    @app.route("/api/public/orders", methods=["POST"])
    def public_create_order():
        payload = request.get_json(silent=True) or {}
        errors: list[str] = []
        if not normalize_text(payload.get("customerName")):
            errors.append("Customer name is required.")
        if not normalize_text(payload.get("customerPhone")):
            errors.append("Phone number is required.")
        raw_items = payload.get("items")
        if not isinstance(raw_items, list) or not raw_items:
            errors.append("Add at least one item before sending the order.")
        if errors:
            return jsonify({"ok": False, "errors": errors}), 400

        try:
            record = create_online_order_record(payload)
        except ValueError as error:
            return jsonify({"ok": False, "errors": [str(error)]}), 400

        g.db.add(record)
        order = serialize_online_order(record)
        audit(
            "online_orders",
            "Online Orders",
            "create",
            order["orderNumber"],
            record.id,
            f'{order["customerName"]} · {format_currency(order["totalAmount"])}',
        )
        g.db.commit()
        return jsonify(
            {
                "ok": True,
                "orderNumber": order["orderNumber"],
                "totalAmount": order["totalAmount"],
                "includesQuoteItems": order["includesQuoteItems"],
            }
        )

    @app.route("/api/orders/track")
    @app.route("/api/public/orders/track")
    def public_track_order():
        order_number = normalize_text(request.args.get("orderNumber")).upper()
        phone = request.args.get("phone", "")
        if not order_number or not phone:
            return jsonify({"ok": False, "error": "Order number and phone number are required."}), 400

        record = g.db.scalar(
            select(ModuleRecord).where(
                ModuleRecord.module_key == "online_orders",
                ModuleRecord.reference == order_number,
            )
        )
        if not record:
            return jsonify({"ok": False, "error": "No order was found for that order number."}), 404

        order = serialize_online_order(record)
        if not phones_match(order.get("customerPhone"), phone):
            return jsonify({"ok": False, "error": "No order was found for that order number and phone."}), 404
        return jsonify({"ok": True, "order": order})

    @app.route("/app/login", methods=["GET", "POST"])
    def login():
        if request.method == "POST":
            if not ensure_database_ready():
                username = normalize_text(request.form.get("username")).lower()
                raw_password = request.form.get("password", "")
                admin_matches = (
                    username == app_config.admin_username.lower()
                    and raw_password == app_config.admin_password
                )
                if admin_matches:
                    session["pending_login_user"] = app_config.admin_username.lower()
                    flash("The live workspace is reconnecting. We will continue automatically as soon as the database is ready.", "warning")
                    return redirect(url_for("reconnecting_page"))
                flash("The live workspace is reconnecting. Please try again in a moment.", "warning")
                return render_template("login.html", page_title="Sign In")
            username = normalize_text(request.form.get("username")).lower()
            raw_password = request.form.get("password", "")
            user = find_user_by_username(username)
            if not user or not user.active or not user.login_enabled or not verify_password(raw_password, user.password_hash):
                flash("The username or password is not correct.", "error")
                return render_template("login.html", page_title="Sign In")
            session["user_id"] = user.id
            audit("access", "Access", "login", f"{user.full_name or user.username} signed in", user.id)
            g.db.commit()
            next_path = request.args.get("next")
            redirect_target = workspace_entry_path_for_user(user, next_path)
            if redirect_target == attendance_gate_target_path() and not attendance_path_allowed(next_path):
                flash("Check in first before opening the rest of the workspace.", "warning")
            return redirect(redirect_target)
        return render_template("login.html", page_title="Sign In")

    @app.route("/app/reconnecting")
    def reconnecting_page():
        if ensure_database_ready():
            pending_login_user = normalize_text(session.get("pending_login_user")).lower()
            if pending_login_user:
                user = find_user_by_username(pending_login_user)
                if user and user.active and user.login_enabled:
                    session["user_id"] = user.id
                    session.pop("pending_login_user", None)
                    return redirect(workspace_entry_path_for_user(user))
            if session.get("user_id"):
                return redirect(workspace_entry_path_for_user(g.current_user))
            return redirect(url_for("login"))
        return render_template(
            "workspace_reconnecting.html",
            page_title="Reconnecting",
            reconnect_message="OneRoot is reconnecting to the live workspace. This page will keep checking and open the app automatically when the database is ready.",
            refresh_url=url_for("reconnecting_page"),
        )

    @app.route("/app/logout", methods=["POST"])
    @login_required
    def logout():
        user = g.current_user
        audit("access", "Access", "logout", f"{user.full_name or user.username} signed out", user.id)
        g.db.commit()
        session.clear()
        return redirect(url_for("login"))

    @app.route("/app/attendance/clock", methods=["POST"])
    @access_required("workforce_attendance")
    def attendance_clock():
        action = normalize_text(request.form.get("action")).lower()
        next_path = safe_next_path(
            request.form.get("next"),
            request.referrer or url_for("module_list", module_key="workforce_attendance"),
        )
        if action not in {"check-in", "check-out"}:
            flash("Choose Check In or Check Out to save attendance.", "warning")
            return redirect(next_path)

        definition = MODULES["workforce_attendance"]
        now_local = current_local_datetime()
        attendance_date = now_local.date()
        clock_time = now_local.strftime("%H:%M")
        record = attendance_record_for_user(g.current_user, attendance_date)
        is_new = record is None

        if record:
            payload = dict(record.payload or {})
        else:
            payload = {
                "id": uuid4().hex,
                "createdAt": datetime.utcnow().isoformat(),
                "shiftDate": attendance_date.isoformat(),
                "businessAreaId": "shared-operations",
                "staffName": attendance_display_name_for_user(g.current_user),
                "staffRole": attendance_staff_role_for_user(g.current_user),
                "shiftType": attendance_shift_type_for_timestamp(now_local),
                "breakMinutes": 0,
                "approvalStatus": "Draft",
                "notes": "",
                "reference": attendance_reference_for_user(g.current_user, attendance_date),
            }
            record = ModuleRecord(id=payload["id"], module_key=definition.key, created_at=datetime.utcnow())
            g.db.add(record)

        payload.setdefault("id", record.id)
        payload.setdefault("createdAt", record.created_at.isoformat())
        payload["shiftDate"] = normalize_text(payload.get("shiftDate")) or attendance_date.isoformat()
        payload["reference"] = normalize_text(payload.get("reference")) or attendance_reference_for_user(g.current_user, attendance_date)
        payload["staffName"] = normalize_text(payload.get("staffName")) or attendance_display_name_for_user(g.current_user)
        payload["staffRole"] = normalize_text(payload.get("staffRole")) or attendance_staff_role_for_user(g.current_user)
        payload["shiftType"] = normalize_text(payload.get("shiftType")) or attendance_shift_type_for_timestamp(now_local)
        payload["businessAreaId"] = normalize_text(payload.get("businessAreaId")) or "shared-operations"
        payload["approvalStatus"] = normalize_text(payload.get("approvalStatus")) or "Draft"

        has_check_in = bool(parse_time_value(payload.get("checkInTime")))
        has_check_out = bool(parse_time_value(payload.get("checkOutTime")))

        if action == "check-in":
            if has_check_in and not has_check_out:
                flash(f"You are already checked in today at {normalize_text(payload.get('checkInTime'))}.", "warning")
                return redirect(next_path)
            if has_check_out:
                flash("You already checked out today. Open the attendance record if you need to adjust it.", "warning")
                return redirect(next_path)
            payload["checkInTime"] = clock_time
            payload["shiftStart"] = normalize_text(payload.get("shiftStart")) or clock_time
            success_message = f"Checked in at {clock_time}."
            audit_action = "check-in"
            audit_detail = f"{payload['staffName']} checked in at {clock_time}."
        else:
            if not has_check_in:
                flash("Check in first before checking out.", "warning")
                return redirect(next_path)
            if has_check_out:
                flash(f"You already checked out today at {normalize_text(payload.get('checkOutTime'))}.", "warning")
                return redirect(next_path)
            payload["checkOutTime"] = clock_time
            payload["shiftEnd"] = normalize_text(payload.get("shiftEnd")) or clock_time
            success_message = f"Checked out at {clock_time}."
            audit_action = "check-out"
            audit_detail = f"{payload['staffName']} checked out at {clock_time}."

        payload["updatedAt"] = datetime.utcnow().isoformat()
        workforce_rollup(payload)
        set_module_record_metadata(record, definition, payload)
        audit(
            "workforce_attendance",
            definition.label,
            audit_action,
            payload["staffName"],
            record.id,
            audit_detail if not is_new else f"{audit_detail} Daily attendance record opened automatically.",
        )
        g.db.commit()
        flash(success_message, "success")
        return redirect(next_path)

    @app.route("/app/")
    @access_required("dashboard")
    def dashboard():
        all_records = g.db.scalars(select(ModuleRecord)).all()
        current_month = date.today().strftime("%Y-%m")
        target_progress_rows = build_target_progress_rows(all_records, current_month)
        low_stock_items = g.db.scalars(
            select(Product)
            .where(Product.track_inventory.is_(True), Product.active.is_(True), Product.quantity_on_hand <= Product.min_stock_level)
            .order_by(Product.quantity_on_hand.asc(), Product.name.asc())
        ).all()
        low_stock = low_stock_items[:10]
        expenses_total = sum(record.amount for record in all_records if record.module_key == "expenses")
        sales_total = sum(record.amount for record in all_records if record.module_key == "sales")
        profit_total = sum(module_record_profit_amount(record) for record in all_records if record.module_key == "sales")
        today_sales_total = sum(
            record.amount for record in all_records if record.module_key == "sales" and record.record_date == date.today()
        )
        today_profit_total = sum(
            module_record_profit_amount(record)
            for record in all_records
            if record.module_key == "sales" and record.record_date == date.today()
        )
        petty_cash_total = sum(record.amount for record in all_records if record.module_key == "petty_cash")
        apartment_due = sum(apartment_outstanding(record.payload or {}) for record in all_records if record.module_key == "apartments")
        supplier_balance = sum(
            supplier_outstanding(record.payload or {}) for record in all_records if record.module_key == "suppliers"
        )
        recurring_due = [
            record
            for record in all_records
            if record.module_key == "recurring_controls"
            and recurring_control_status(record.payload or {}) in {"Due Soon", "Overdue"}
        ]
        maintenance_open = [
            record
            for record in all_records
            if record.module_key == "maintenance_records"
            and normalize_text((record.payload or {}).get("status")) in {"Open", "Scheduled", "In Progress"}
        ]
        training_due = [
            record
            for record in all_records
            if record.module_key == "knowledge_base"
            and normalize_text((record.payload or {}).get("status")) in {"Training Due", "Under Review"}
        ]
        attendance_today = [
            record
            for record in all_records
            if record.module_key == "workforce_attendance" and record.record_date == date.today()
        ]
        apartment_watch = sorted(
            [
                {
                    "suite": normalize_text(record.payload.get("suite")) or record.title,
                    "tenant": normalize_text(record.payload.get("tenantName")) or "No tenant",
                    "outstanding": apartment_outstanding(record.payload or {}),
                }
                for record in all_records
                if record.module_key == "apartments" and apartment_outstanding(record.payload or {}) > 0
            ],
            key=lambda item: item["outstanding"],
            reverse=True,
        )[:8]
        sales_by_area_map: dict[str, float] = defaultdict(float)
        profit_by_area_map: dict[str, float] = defaultdict(float)
        for record in all_records:
            if record.module_key == "sales" and record.record_date and record.record_date.strftime("%Y-%m") == current_month:
                sales_by_area_map[record.business_area_id or "shared-operations"] += record.amount
                profit_by_area_map[record.business_area_id or "shared-operations"] += module_record_profit_amount(record)
        monthly_sales_by_area = sorted(
            [
                {
                    "id": area["id"],
                    "label": area["label"],
                    "short": area["short"],
                    "amount": round(sales_by_area_map.get(area["id"], 0), 2),
                }
                for area in BUSINESS_AREAS
                if round(sales_by_area_map.get(area["id"], 0), 2) > 0
            ],
            key=lambda item: item["amount"],
            reverse=True,
        )
        dashboard_area_rows = [
            row
            for row in report_area_rows(all_records, current_month)
            if any(
                abs(parse_amount(row.get(metric)))
                for metric in ("salesTotal", "profitTotal", "expenseTotal", "salaryTotal", "pettyCashTotal", "maintenanceTotal", "depreciationTotal", "supplierBalance", "netTotal")
            )
        ]
        online_orders = [
            serialize_online_order(record) for record in all_records if record.module_key == "online_orders"
        ]
        order_follow_up = [
            order
            for order in online_orders
            if order.get("status") not in {"fulfilled", "cancelled"} or order.get("paymentStatus") != "paid"
        ]
        online_balance_total = round(
            sum(max(parse_amount(order.get("totalAmount")) - parse_amount(order.get("paidAmount")), 0) for order in online_orders),
            2,
        )
        latest_audit = g.db.scalars(select(AuditLog).order_by(desc(AuditLog.created_at)).limit(12)).all()
        counts = defaultdict(int)
        for record in all_records:
            counts[record.module_key] += 1

        return render_template(
            "dashboard.html",
            page_title="Dashboard",
            counts=counts,
            expenses_total=expenses_total,
            sales_total=sales_total,
            profit_total=round(profit_total, 2),
            today_sales_total=today_sales_total,
            today_profit_total=round(today_profit_total, 2),
            petty_cash_total=petty_cash_total,
            apartment_due=apartment_due,
            supplier_balance=supplier_balance,
            recurring_due_count=len(recurring_due),
            recurring_due=recurring_due[:8],
            maintenance_open_count=len(maintenance_open),
            maintenance_open=maintenance_open[:8],
            training_due_count=len(training_due),
            training_due=training_due[:8],
            attendance_today_count=len(attendance_today),
            apartment_watch=apartment_watch,
            monthly_sales_by_area=monthly_sales_by_area,
            monthly_sales_chart=build_chart_rows(
                monthly_sales_by_area,
                label_key="label",
                value_key="amount",
                short_key="short",
            ),
            monthly_profit_chart=build_chart_rows(
                [
                    {
                        "label": area["label"],
                        "short": area["short"],
                        "amount": round(profit_by_area_map.get(area["id"], 0), 2),
                    }
                    for area in BUSINESS_AREAS
                    if round(profit_by_area_map.get(area["id"], 0), 2) > 0
                ],
                label_key="label",
                value_key="amount",
                short_key="short",
                positive_color="var(--accent)",
            ),
            dashboard_net_chart=build_chart_rows(
                [
                    {"label": row["areaLabel"], "short": row["areaShort"], "amount": row["netTotal"]}
                    for row in dashboard_area_rows
                    if abs(parse_amount(row["netTotal"])) > 0
                ],
                label_key="label",
                value_key="amount",
                short_key="short",
                positive_color="var(--accent)",
            ),
            online_order_follow_up=len(order_follow_up),
            online_balance_total=online_balance_total,
            low_stock_count=len(low_stock_items),
            low_stock=low_stock,
            latest_audit=latest_audit,
            target_progress_rows=target_progress_rows,
            target_total=round(sum(row["target"] for row in target_progress_rows), 2),
            target_actual_total=round(sum(row["actual"] for row in target_progress_rows), 2),
            target_areas_on_track=sum(1 for row in target_progress_rows if row["isOnTarget"]),
            recent_pos_orders=g.db.scalars(
                select(PosOrder).order_by(desc(PosOrder.order_date), desc(PosOrder.updated_at)).limit(8)
            ).all(),
        )

    @app.route("/app/export/backup.json")
    @access_required("users")
    def export_backup():
        payload = export_workspace_snapshot()
        return Response(
            json.dumps(payload, indent=2),
            mimetype="application/json",
            headers={"Content-Disposition": f"attachment; filename=oneroot-platform-backup-{date.today().isoformat()}.json"},
        )

    @app.route("/app/downloads/workbook")
    @access_required("workbook")
    def download_workbook():
        workbook_path = workbook_download_path(app_config)
        if not workbook_path.exists():
            flash("The Excel workbook is not available yet in this build.", "warning")
            return redirect(url_for("dashboard"))
        return send_from_directory(workbook_path.parent, workbook_path.name, as_attachment=True)

    @app.route("/app/profits")
    @access_required("profits")
    def profits_page():
        month_filter = parse_month(request.args.get("month")) or date.today().strftime("%Y-%m")
        area_filter = normalize_text(request.args.get("area"))
        sales_records = g.db.scalars(
            select(ModuleRecord)
            .where(ModuleRecord.module_key == "sales")
            .order_by(desc(ModuleRecord.record_date), desc(ModuleRecord.updated_at))
        ).all()
        detail_rows = profit_detail_rows(sales_records, month_filter, area_filter)

        sales_total = round(sum(row["salesTotal"] for row in detail_rows), 2)
        cost_total = round(sum(row["costTotal"] for row in detail_rows), 2)
        profit_total = round(sum(row["profitTotal"] for row in detail_rows), 2)
        transaction_total = sum(row["transactionCount"] for row in detail_rows)
        gross_margin_percent = round((profit_total / sales_total) * 100, 2) if sales_total > 0 else 0.0

        area_map: dict[str, dict[str, Any]] = {}
        source_map: dict[str, dict[str, Any]] = {}
        daily_map: dict[str, dict[str, Any]] = {}
        for row in detail_rows:
            area_entry = area_map.setdefault(
                row["areaId"],
                {
                    "areaId": row["areaId"],
                    "areaLabel": row["areaLabel"],
                    "areaShort": row["areaShort"],
                    "salesTotal": 0.0,
                    "costTotal": 0.0,
                    "profitTotal": 0.0,
                    "transactionCount": 0,
                },
            )
            area_entry["salesTotal"] = round(area_entry["salesTotal"] + row["salesTotal"], 2)
            area_entry["costTotal"] = round(area_entry["costTotal"] + row["costTotal"], 2)
            area_entry["profitTotal"] = round(area_entry["profitTotal"] + row["profitTotal"], 2)
            area_entry["transactionCount"] += row["transactionCount"]

            source_entry = source_map.setdefault(
                row["sourceType"],
                {
                    "sourceType": row["sourceType"],
                    "sourceLabel": row["sourceLabel"],
                    "salesTotal": 0.0,
                    "costTotal": 0.0,
                    "profitTotal": 0.0,
                    "transactionCount": 0,
                },
            )
            source_entry["salesTotal"] = round(source_entry["salesTotal"] + row["salesTotal"], 2)
            source_entry["costTotal"] = round(source_entry["costTotal"] + row["costTotal"], 2)
            source_entry["profitTotal"] = round(source_entry["profitTotal"] + row["profitTotal"], 2)
            source_entry["transactionCount"] += row["transactionCount"]

            day_key = row["recordDate"] or month_filter
            daily_entry = daily_map.setdefault(
                day_key,
                {
                    "day": day_key,
                    "salesTotal": 0.0,
                    "costTotal": 0.0,
                    "profitTotal": 0.0,
                    "transactionCount": 0,
                },
            )
            daily_entry["salesTotal"] = round(daily_entry["salesTotal"] + row["salesTotal"], 2)
            daily_entry["costTotal"] = round(daily_entry["costTotal"] + row["costTotal"], 2)
            daily_entry["profitTotal"] = round(daily_entry["profitTotal"] + row["profitTotal"], 2)
            daily_entry["transactionCount"] += row["transactionCount"]

        area_rows = sorted(area_map.values(), key=lambda item: (item["profitTotal"], item["salesTotal"]), reverse=True)
        source_rows = sorted(source_map.values(), key=lambda item: (item["profitTotal"], item["salesTotal"]), reverse=True)
        daily_rows = sorted(daily_map.values(), key=lambda item: item["day"])

        best_area = area_rows[0] if area_rows else None
        weakest_area = min(area_rows, key=lambda item: item["profitTotal"]) if area_rows else None

        return render_template(
            "profits.html",
            page_title="Profit Center",
            month_filter=month_filter,
            area_filter=area_filter,
            business_area_options=BUSINESS_AREA_OPTIONS,
            sales_total=sales_total,
            cost_total=cost_total,
            profit_total=profit_total,
            gross_margin_percent=gross_margin_percent,
            transaction_total=transaction_total,
            best_area=best_area,
            weakest_area=weakest_area,
            area_rows=area_rows,
            source_rows=source_rows,
            daily_rows=daily_rows,
            recent_profit_rows=detail_rows[:40],
            profit_area_chart=build_chart_rows(
                [
                    {"label": row["areaLabel"], "short": row["areaShort"], "amount": row["profitTotal"]}
                    for row in area_rows
                    if abs(parse_amount(row["profitTotal"])) > 0
                ],
                label_key="label",
                value_key="amount",
                short_key="short",
                positive_color="var(--accent)",
            ),
            profit_source_chart=build_chart_rows(
                [
                    {"label": row["sourceLabel"], "short": row["sourceLabel"], "amount": row["profitTotal"]}
                    for row in source_rows
                    if abs(parse_amount(row["profitTotal"])) > 0
                ],
                label_key="label",
                value_key="amount",
                short_key="short",
                positive_color="var(--green)",
            ),
            profit_daily_chart=build_chart_rows(
                [
                    {"label": row["day"], "short": row["day"][5:] if len(row["day"]) >= 10 else row["day"], "amount": row["profitTotal"]}
                    for row in daily_rows
                    if abs(parse_amount(row["profitTotal"])) > 0
                ],
                label_key="label",
                value_key="amount",
                short_key="short",
                positive_color="var(--accent)",
            ),
        )

    @app.route("/app/profits/export.csv")
    @access_required("profits")
    def profits_export():
        month_filter = parse_month(request.args.get("month")) or date.today().strftime("%Y-%m")
        area_filter = normalize_text(request.args.get("area"))
        sales_records = g.db.scalars(
            select(ModuleRecord)
            .where(ModuleRecord.module_key == "sales")
            .order_by(desc(ModuleRecord.record_date), desc(ModuleRecord.updated_at))
        ).all()
        rows = profit_detail_rows(sales_records, month_filter, area_filter)
        headers = [
            "recordDate",
            "areaId",
            "areaLabel",
            "sourceType",
            "sourceLabel",
            "transactionCount",
            "salesTotal",
            "costTotal",
            "profitTotal",
            "marginPercent",
            "title",
            "reference",
            "notes",
        ]
        return csv_download(
            f"oneroot-profits-{month_filter}{'-' + area_filter if area_filter else ''}.csv",
            headers,
            rows,
        )

    @app.route("/app/category-performance")
    @access_required("category_performance")
    def category_performance_page():
        month_filter = parse_month(request.args.get("month")) or date.today().strftime("%Y-%m")
        area_filter = normalize_text(request.args.get("area"))
        rows = category_performance_rows(g.db, month_filter, area_filter)

        sales_total = round(sum(row["salesTotal"] for row in rows), 2)
        cost_total = round(sum(row["costTotal"] for row in rows), 2)
        profit_total = round(sum(row["profitTotal"] for row in rows), 2)
        transaction_total = sum(row["transactionCount"] for row in rows)
        margin_percent = round((profit_total / sales_total) * 100, 2) if sales_total > 0 else 0.0
        best_profit_row = rows[0] if rows else None
        best_sales_row = max(rows, key=lambda item: item["salesTotal"]) if rows else None

        def category_chart_label(row: dict[str, Any]) -> str:
            return row["categoryLabel"] if area_filter else f"{row['categoryLabel']} · {row['areaShort']}"

        sales_chart_rows = sorted(rows, key=lambda item: item["salesTotal"], reverse=True)[:12]
        profit_chart_rows = sorted(rows, key=lambda item: item["profitTotal"], reverse=True)[:12]

        return render_template(
            "category_performance.html",
            page_title="Category Performance",
            month_filter=month_filter,
            area_filter=area_filter,
            business_area_options=BUSINESS_AREA_OPTIONS,
            rows=rows,
            sales_total=sales_total,
            cost_total=cost_total,
            profit_total=profit_total,
            transaction_total=transaction_total,
            margin_percent=margin_percent,
            best_profit_row=best_profit_row,
            best_sales_row=best_sales_row,
            category_sales_chart=build_chart_rows(
                [
                    {
                        "label": category_chart_label(row),
                        "short": row["categoryLabel"],
                        "amount": row["salesTotal"],
                    }
                    for row in sales_chart_rows
                    if row["salesTotal"] > 0
                ],
                label_key="label",
                value_key="amount",
                short_key="short",
                positive_color="var(--green)",
            ),
            category_profit_chart=build_chart_rows(
                [
                    {
                        "label": category_chart_label(row),
                        "short": row["categoryLabel"],
                        "amount": row["profitTotal"],
                    }
                    for row in profit_chart_rows
                    if abs(parse_amount(row["profitTotal"])) > 0
                ],
                label_key="label",
                value_key="amount",
                short_key="short",
                positive_color="var(--accent)",
            ),
        )

    @app.route("/app/category-performance/export.csv")
    @access_required("category_performance")
    def category_performance_export():
        month_filter = parse_month(request.args.get("month")) or date.today().strftime("%Y-%m")
        area_filter = normalize_text(request.args.get("area"))
        rows = category_performance_rows(g.db, month_filter, area_filter)
        headers = [
            "areaId",
            "areaLabel",
            "categoryLabel",
            "salesTotal",
            "costTotal",
            "profitTotal",
            "marginPercent",
            "transactionCount",
            "sourceCount",
            "sourceList",
        ]
        return csv_download(
            f"oneroot-category-performance-{month_filter}{'-' + area_filter if area_filter else ''}.csv",
            headers,
            rows,
        )

    @app.route("/app/reports")
    @access_required("reports")
    def reports_page():
        month_filter = parse_month(request.args.get("month")) or date.today().strftime("%Y-%m")
        area_filter = normalize_text(request.args.get("area"))
        all_records = g.db.scalars(select(ModuleRecord).order_by(desc(ModuleRecord.updated_at))).all()
        filtered_records = [
            record
            for record in all_records
            if record_in_month_scope(record, month_filter) and record_in_area_scope(record, area_filter)
        ]
        area_rows = report_area_rows(all_records, month_filter)
        if area_filter:
            area_rows = [row for row in area_rows if row["areaId"] == area_filter]

        sales_total = round(sum(record.amount for record in filtered_records if record.module_key == "sales"), 2)
        cost_total = round(sum(module_record_cost_amount(record) for record in filtered_records if record.module_key == "sales"), 2)
        profit_total = round(sum(module_record_profit_amount(record) for record in filtered_records if record.module_key == "sales"), 2)
        expenses_total = round(sum(record.amount for record in filtered_records if record.module_key == "expenses"), 2)
        salary_total = round(sum(parse_amount(row["salaryTotal"]) for row in area_rows), 2)
        petty_cash_total = round(sum(record.amount for record in filtered_records if record.module_key == "petty_cash"), 2)
        maintenance_total = round(sum(parse_amount(row["maintenanceTotal"]) for row in area_rows), 2)
        depreciation_total = round(sum(parse_amount(row["depreciationTotal"]) for row in area_rows), 2)
        supplier_balance = round(
            sum(supplier_outstanding(record.payload or {}) for record in filtered_records if record.module_key == "suppliers"),
            2,
        )
        apartment_exposure = round(
            sum(apartment_outstanding(record.payload or {}) for record in filtered_records if record.module_key == "apartments"),
            2,
        )
        online_open_balance = round(
            sum(
                max(parse_amount((record.payload or {}).get("quotedTotal")) - parse_amount((record.payload or {}).get("paidAmount")), 0)
                for record in filtered_records
                if record.module_key == "online_orders"
            ),
            2,
        )
        operating_total = round(profit_total - expenses_total - petty_cash_total - salary_total - maintenance_total, 2)
        net_total = round(operating_total - depreciation_total, 2)
        gross_margin_percent = round((profit_total / sales_total) * 100, 2) if sales_total > 0 else 0.0
        operating_margin_percent = round((net_total / sales_total) * 100, 2) if sales_total > 0 else 0.0
        area_rows = [
            row
            for row in area_rows
            if any(
                abs(parse_amount(row.get(metric)))
                for metric in ("salesTotal", "profitTotal", "expenseTotal", "salaryTotal", "pettyCashTotal", "maintenanceTotal", "depreciationTotal", "supplierBalance", "netTotal")
            )
        ]
        low_stock_items = g.db.scalars(
            select(Product)
            .where(Product.track_inventory.is_(True), Product.active.is_(True), Product.quantity_on_hand <= Product.min_stock_level)
            .order_by(Product.quantity_on_hand.asc(), Product.name.asc())
            .limit(12)
        ).all()
        recurring_alerts = [
            record
            for record in g.db.scalars(
                select(ModuleRecord)
                .where(ModuleRecord.module_key == "recurring_controls")
                .order_by(desc(ModuleRecord.updated_at))
            ).all()
            if recurring_control_status(record.payload or {}) in {"Due Soon", "Overdue"}
            and record_in_area_scope(record, area_filter)
        ][:12]
        target_progress_rows = build_target_progress_rows(all_records, month_filter, area_filter=area_filter)

        return render_template(
            "reports.html",
            page_title="Management Reporting & Profitability",
            month_filter=month_filter,
            area_filter=area_filter,
            sales_total=sales_total,
            cost_total=cost_total,
            profit_total=profit_total,
            expenses_total=expenses_total,
            salary_total=salary_total,
            petty_cash_total=petty_cash_total,
            maintenance_total=maintenance_total,
            depreciation_total=depreciation_total,
            operating_total=operating_total,
            supplier_balance=supplier_balance,
            apartment_exposure=apartment_exposure,
            online_open_balance=online_open_balance,
            gross_margin_percent=gross_margin_percent,
            operating_margin_percent=operating_margin_percent,
            net_total=net_total,
            report_sales_chart=build_chart_rows(
                [
                    {"label": row["areaLabel"], "short": row["areaShort"], "amount": row["salesTotal"]}
                    for row in area_rows
                    if parse_amount(row["salesTotal"]) > 0
                ],
                label_key="label",
                value_key="amount",
                short_key="short",
            ),
            report_profit_chart=build_chart_rows(
                [
                    {"label": row["areaLabel"], "short": row["areaShort"], "amount": row["profitTotal"]}
                    for row in area_rows
                    if parse_amount(row["profitTotal"]) > 0
                ],
                label_key="label",
                value_key="amount",
                short_key="short",
                positive_color="var(--accent)",
            ),
            report_operating_chart=build_chart_rows(
                [
                    {"label": row["areaLabel"], "short": row["areaShort"], "amount": row["operatingTotal"]}
                    for row in area_rows
                    if abs(parse_amount(row["operatingTotal"])) > 0
                ],
                label_key="label",
                value_key="amount",
                short_key="short",
                positive_color="var(--accent)",
            ),
            report_net_chart=build_chart_rows(
                [
                    {"label": row["areaLabel"], "short": row["areaShort"], "amount": row["netTotal"]}
                    for row in area_rows
                    if abs(parse_amount(row["netTotal"])) > 0
                ],
                label_key="label",
                value_key="amount",
                short_key="short",
                positive_color="var(--accent)",
            ),
            low_stock_items=low_stock_items,
            recurring_alerts=recurring_alerts,
            area_rows=area_rows,
            target_progress_rows=target_progress_rows,
            target_total=round(sum(row["target"] for row in target_progress_rows), 2),
            target_actual_total=round(sum(row["actual"] for row in target_progress_rows), 2),
            target_areas_on_track=sum(1 for row in target_progress_rows if row["isOnTarget"]),
            business_area_options=BUSINESS_AREA_OPTIONS,
            recent_audits=g.db.scalars(select(AuditLog).order_by(desc(AuditLog.created_at)).limit(10)).all(),
        )

    @app.route("/app/reports/export.csv")
    @access_required("reports")
    def reports_export():
        month_filter = parse_month(request.args.get("month")) or date.today().strftime("%Y-%m")
        area_filter = normalize_text(request.args.get("area"))
        all_records = g.db.scalars(select(ModuleRecord)).all()
        area_rows = report_area_rows(all_records, month_filter)
        if area_filter:
            area_rows = [row for row in area_rows if row["areaId"] == area_filter]
        headers = [
            "month",
            "areaId",
            "areaLabel",
            "salesTotal",
            "costTotal",
            "profitTotal",
            "expenseTotal",
            "salaryTotal",
            "pettyCashTotal",
            "maintenanceTotal",
            "depreciationTotal",
            "operatingTotal",
            "supplierBalance",
            "netTotal",
        ]
        rows = [{"month": month_filter, **row} for row in area_rows]
        return csv_download(
            f"oneroot-reports-{month_filter}{'-' + area_filter if area_filter else ''}.csv",
            headers,
            rows,
        )

    @app.route("/app/users", methods=["GET", "POST"])
    @access_required("users")
    def users_page():
        editing_id = normalize_text(request.args.get("edit"))
        search_text = normalize_text(request.args.get("q"))
        editing_user = g.db.get(User, editing_id) if editing_id else None
        form_user = {
            "id": editing_user.id if editing_user else "",
            "full_name": editing_user.full_name if editing_user else "",
            "username": editing_user.username if editing_user else "",
            "role": normalize_role_key(editing_user.role) if editing_user else "viewer",
            "staff_role": normalize_staff_role(editing_user.staff_role if editing_user else "", fallback_role=editing_user.role if editing_user else "viewer"),
            "phone": editing_user.phone if editing_user else "",
            "active": bool(editing_user.active) if editing_user else True,
            "login_enabled": bool(editing_user.login_enabled) if editing_user else True,
            "notes": editing_user.notes if editing_user else "",
        }

        if request.method == "POST":
            user_id = normalize_text(request.form.get("id")) or uuid4().hex
            user = g.db.get(User, user_id)
            is_new = user is None
            full_name = normalize_text(request.form.get("full_name"))
            username = normalize_text(request.form.get("username")).lower()
            role = normalize_role_key(request.form.get("role"))
            staff_role = normalize_staff_role(request.form.get("staff_role"), fallback_role=role)
            phone = normalize_text(request.form.get("phone"))
            active = request.form.get("active") == "on"
            login_enabled = request.form.get("login_enabled") == "on" and active
            notes = normalize_text(request.form.get("notes"))
            new_password = request.form.get("password", "")

            form_user = {
                "id": user_id,
                "full_name": full_name,
                "username": username,
                "role": role,
                "staff_role": staff_role,
                "phone": phone,
                "active": active,
                "login_enabled": login_enabled,
                "notes": notes,
            }

            errors: list[str] = []
            if not full_name:
                errors.append("Full name is required.")
            if not username:
                errors.append("Username is required.")
            if find_user_by_username(username, exclude_user_id=user_id):
                errors.append("That username is already in use.")
            if is_new and not normalize_text(new_password):
                errors.append("Set a password when creating a new user.")
            if normalize_text(new_password) and len(normalize_text(new_password)) < 4:
                errors.append("Use a password with at least 4 characters.")

            if user and normalize_role_key(user.role) == "owner" and user.active and user.login_enabled:
                still_owner = role == "owner" and active and login_enabled
                if not still_owner and active_owner_count(exclude_user_id=user.id) == 0:
                    errors.append("Keep at least one active owner account with login enabled.")

            if errors:
                for message in errors:
                    flash(message, "error")
            else:
                if not user:
                    user = User(id=user_id, created_at=datetime.utcnow())
                    g.db.add(user)
                user.updated_at = datetime.utcnow()
                user.full_name = full_name
                user.username = username
                user.role = role
                user.staff_role = staff_role
                user.phone = phone
                user.active = active
                user.login_enabled = login_enabled
                user.notes = notes
                if normalize_text(new_password):
                    user.password_hash = password_hash(normalize_text(new_password))

                audit(
                    "users",
                    "User Accounts",
                    "create" if is_new else "update",
                    full_name or username,
                    user.id,
                    f"{role_label(role)} account saved.",
                )
                g.db.commit()
                flash("User account saved.", "success")
                return redirect(url_for("users_page", edit=user.id, q=search_text))

        users = g.db.scalars(select(User).order_by(User.full_name.asc(), User.username.asc())).all()
        if search_text:
            query_lower = search_text.lower()
            users = [
                user
                for user in users
                if query_lower in " ".join(
                    [
                        user.full_name or "",
                        user.username or "",
                        role_label(user.role),
                        staff_role_label(user.staff_role, fallback_role=user.role),
                        user.phone or "",
                    ]
                ).lower()
            ]

        role_counts: dict[str, int] = defaultdict(int)
        staff_role_counts: dict[str, int] = defaultdict(int)
        for user in users:
            if user.active:
                role_counts[normalize_role_key(user.role)] += 1
                staff_role_counts[normalize_staff_role(user.staff_role, fallback_role=user.role)] += 1

        role_rows = sorted(
            [
                {
                    "label": USER_ROLE_LABELS[role_key],
                    "short": USER_ROLE_LABELS[role_key],
                    "count": count,
                    "description": ROLE_DESCRIPTIONS.get(role_key, ""),
                }
                for role_key, count in role_counts.items()
                if count > 0
            ],
            key=lambda item: (-item["count"], item["label"]),
        )
        staff_role_rows = sorted(
            [
                {
                    "label": staff_role,
                    "short": staff_role,
                    "count": count,
                }
                for staff_role, count in staff_role_counts.items()
                if count > 0
            ],
            key=lambda item: (-item["count"], item["label"]),
        )

        return render_template(
            "users.html",
            page_title="User Accounts",
            users=users,
            editing_user=editing_user,
            form_user=form_user,
            search_text=search_text,
            total_users=len(users),
            active_users=sum(1 for user in users if user.active),
            login_enabled_users=sum(1 for user in users if user.active and user.login_enabled),
            owner_users=sum(1 for user in users if normalize_role_key(user.role) == "owner"),
            role_chart=build_chart_rows(
                role_rows,
                label_key="label",
                value_key="count",
                short_key="short",
                positive_color="var(--accent)",
            ),
            staff_role_chart=build_chart_rows(
                staff_role_rows,
                label_key="label",
                value_key="count",
                short_key="short",
                positive_color="var(--green)",
            ),
            role_options=USER_ROLE_OPTIONS,
            role_descriptions=ROLE_DESCRIPTIONS,
            staff_role_options=STAFF_WORK_ROLES,
        )

    @app.route("/app/users/<user_id>/delete", methods=["POST"])
    @access_required("users")
    def user_delete(user_id: str):
        user = g.db.get(User, user_id)
        if not user:
            flash("That user account could not be found.", "error")
            return redirect(url_for("users_page", q=normalize_text(request.form.get("q"))))
        if user.id == getattr(g.current_user, "id", ""):
            flash("Delete another account first. You cannot delete the account you are using right now.", "warning")
            return redirect(url_for("users_page", edit=user.id, q=normalize_text(request.form.get("q"))))
        if normalize_role_key(user.role) == "owner" and user.active and user.login_enabled and active_owner_count(exclude_user_id=user.id) == 0:
            flash("Keep at least one active owner account with login enabled.", "warning")
            return redirect(url_for("users_page", edit=user.id, q=normalize_text(request.form.get("q"))))

        title = user.full_name or user.username
        g.db.delete(user)
        audit("users", "User Accounts", "delete", title, user_id, "User account deleted.")
        g.db.commit()
        flash("User account deleted.", "success")
        return redirect(url_for("users_page", q=normalize_text(request.form.get("q"))))

    @app.route("/app/search")
    @access_required("search")
    def search_page():
        query_text = normalize_text(request.args.get("q"))
        module_results = []
        product_results = []
        pos_results = []
        audit_results = []

        if query_text:
            like_value = f"%{query_text}%"
            module_records = g.db.scalars(
                select(ModuleRecord)
                .where(
                    or_(
                        ModuleRecord.title.ilike(like_value),
                        ModuleRecord.reference.ilike(like_value),
                        ModuleRecord.status.ilike(like_value),
                    )
                )
                .order_by(desc(ModuleRecord.updated_at))
                .limit(40)
            ).all()
            module_results = [
                {
                    "title": record.title,
                    "moduleLabel": MODULES.get(record.module_key).label if MODULES.get(record.module_key) else record.module_key,
                    "reference": record.reference or "",
                    "status": record.status or "",
                    "amount": record.amount,
                    "updatedAt": record.updated_at,
                    "target": search_target_for_module_record(record),
                }
                for record in module_records
                if record.module_key in MODULES and user_has_access(g.current_user, record.module_key)
            ]

            products = g.db.scalars(
                select(Product)
                .where(
                    or_(
                        Product.name.ilike(like_value),
                        Product.sku.ilike(like_value),
                        Product.barcode.ilike(like_value),
                        Product.category.ilike(like_value),
                    )
                )
                .order_by(Product.active.desc(), Product.name.asc())
                .limit(24)
            ).all()
            for product in products:
                normalize_product_record(product)
            product_results = [
                {
                    "name": product.name,
                    "area": BUSINESS_AREA_SHORT.get(product.business_area_id, product.business_area_id),
                    "category": product.category,
                    "stock": product.quantity_on_hand,
                    "stockLabel": format_product_stock_badge(product),
                    "imageUrl": product_image_src(product),
                    "target": url_for("inventory", edit=product.id, q=query_text),
                }
                for product in products
            ]
            if not user_has_access(g.current_user, "inventory"):
                product_results = []

            pos_orders = g.db.scalars(
                select(PosOrder)
                .where(
                    or_(
                        PosOrder.order_number.ilike(like_value),
                        PosOrder.customer_name.ilike(like_value),
                        PosOrder.customer_phone.ilike(like_value),
                        PosOrder.notes.ilike(like_value),
                    )
                )
                .order_by(desc(PosOrder.order_date), desc(PosOrder.updated_at))
                .limit(20)
            ).all()
            pos_results = [
                {
                    "orderNumber": order.order_number,
                    "orderDate": order.order_date,
                    "customer": order.customer_name,
                    "paymentMethod": order.payment_method,
                    "totalAmount": order.total_amount,
                    "target": url_for("pos_page"),
                }
                for order in pos_orders
            ]
            if not user_has_access(g.current_user, "pos"):
                pos_results = []

            audits = g.db.scalars(
                select(AuditLog)
                .where(
                    or_(
                        AuditLog.title.ilike(like_value),
                        AuditLog.detail.ilike(like_value),
                        AuditLog.actor_name.ilike(like_value),
                    )
                )
                .order_by(desc(AuditLog.created_at))
                .limit(20)
            ).all()
            audit_results = audits
            if not user_has_access(g.current_user, "audit"):
                audit_results = []

        return render_template(
            "search.html",
            page_title="Global Search",
            query_text=query_text,
            module_results=module_results,
            product_results=product_results,
            pos_results=pos_results,
            audit_results=audit_results,
        )

    @app.route("/app/online-orders")
    @access_required("online_orders")
    def online_orders_desk():
        query_text = normalize_text(request.args.get("q"))
        status_filter = normalize_text(request.args.get("status")).lower()
        payment_filter = normalize_text(request.args.get("payment")).lower()
        selected_id = normalize_text(request.args.get("order_id"))

        records = g.db.scalars(
            select(ModuleRecord)
            .where(ModuleRecord.module_key == "online_orders")
            .order_by(desc(ModuleRecord.updated_at), desc(ModuleRecord.created_at))
        ).all()
        orders = [serialize_online_order(record) for record in records]

        if query_text:
            query_lower = query_text.lower()
            orders = [
                order
                for order in orders
                if query_lower in " ".join(
                    [
                        order.get("orderNumber", ""),
                        order.get("customerName", ""),
                        order.get("customerPhone", ""),
                        order.get("businessAreaSummary", ""),
                    ]
                ).lower()
            ]
        if status_filter:
            orders = [order for order in orders if normalize_text(order.get("status")).lower() == status_filter]
        if payment_filter:
            orders = [order for order in orders if normalize_text(order.get("paymentStatus")).lower() == payment_filter]

        selected_order = next((order for order in orders if order["id"] == selected_id), orders[0] if orders else None)
        total_paid = round(sum(parse_amount(order.get("paidAmount")) for order in orders), 2)
        total_open = round(sum(parse_amount(order.get("totalAmount")) for order in orders if order.get("paymentStatus") != "paid"), 2)

        return render_template(
            "online_orders.html",
            page_title="Online Orders",
            orders=orders,
            selected_order=selected_order,
            query_text=query_text,
            status_filter=status_filter,
            payment_filter=payment_filter,
            total_paid=total_paid,
            total_open=total_open,
            status_options=["new", "confirmed", "preparing", "ready", "fulfilled", "cancelled"],
            payment_status_options=["pending", "part-paid", "paid", "refunded"],
        )

    @app.route("/app/online-orders/export.csv")
    @access_required("online_orders")
    def online_orders_export():
        query_text = normalize_text(request.args.get("q"))
        status_filter = normalize_text(request.args.get("status")).lower()
        payment_filter = normalize_text(request.args.get("payment")).lower()

        records = g.db.scalars(
            select(ModuleRecord)
            .where(ModuleRecord.module_key == "online_orders")
            .order_by(desc(ModuleRecord.updated_at), desc(ModuleRecord.created_at))
        ).all()
        orders = [serialize_online_order(record) for record in records]

        if query_text:
            query_lower = query_text.lower()
            orders = [
                order
                for order in orders
                if query_lower in " ".join(
                    [
                        order.get("orderNumber", ""),
                        order.get("customerName", ""),
                        order.get("customerPhone", ""),
                        order.get("businessAreaSummary", ""),
                    ]
                ).lower()
            ]
        if status_filter:
            orders = [order for order in orders if normalize_text(order.get("status")).lower() == status_filter]
        if payment_filter:
            orders = [order for order in orders if normalize_text(order.get("paymentStatus")).lower() == payment_filter]

        headers, rows = build_online_order_export_rows(orders)
        return csv_download(
            f"oneroot-online-orders-{date.today().isoformat()}.csv",
            headers,
            rows,
        )

    @app.route("/app/online-orders/<record_id>", methods=["POST"])
    @access_required("online_orders")
    def online_order_update(record_id: str):
        record = g.db.get(ModuleRecord, record_id)
        if not record or record.module_key != "online_orders":
            flash("Online order was not found.", "error")
            return redirect(url_for("online_orders_desk"))

        payload = dict(record.payload or {})
        order_before = serialize_online_order(record)
        new_status = normalize_text(request.form.get("status")).lower() or order_before["status"]
        payment_status = normalize_text(request.form.get("payment_status")).lower() or order_before["paymentStatus"]
        quoted_total_raw = normalize_text(request.form.get("quoted_total"))
        paid_amount_raw = normalize_text(request.form.get("paid_amount"))
        payment_date = normalize_text(request.form.get("payment_date"))
        staff_notes = normalize_text(request.form.get("staff_notes"))
        history_note = normalize_text(request.form.get("history_note"))

        quoted_total = parse_amount(quoted_total_raw) if quoted_total_raw else order_before["totalAmount"]
        if quoted_total <= 0:
            quoted_total = order_before["fixedTotal"]
        paid_amount = parse_amount(paid_amount_raw) if paid_amount_raw else order_before["paidAmount"]
        if payment_status == "paid" and paid_amount <= 0:
            paid_amount = quoted_total
        if payment_status == "paid" and not payment_date:
            payment_date = date.today().isoformat()

        payload["status"] = new_status
        payload["paymentStatus"] = payment_status
        payload["quotedTotal"] = quoted_total
        payload["paidAmount"] = paid_amount
        payload["paymentDate"] = payment_date
        payload["staffNotes"] = staff_notes
        payload["updatedAt"] = datetime.utcnow().isoformat()

        if new_status != order_before["status"]:
            append_order_history(
                payload,
                new_status,
                history_note or f"Order moved to {new_status.replace('-', ' ')}.",
            )
        if payment_status != order_before["paymentStatus"]:
            append_order_history(
                payload,
                f"payment-{payment_status}",
                f"Payment status changed to {payment_status.replace('-', ' ')}.",
            )
        elif history_note:
            append_order_history(payload, new_status, history_note)

        set_module_record_metadata(record, MODULES["online_orders"], payload)
        sync_online_order_sales(record)
        post_online_order_inventory_if_needed(record)
        audit(
            "online_orders",
            "Online Orders",
            "update",
            normalize_text(payload.get("orderNumber")) or record.title,
            record.id,
            f'{new_status} · {payment_status} · {format_currency(quoted_total)}',
        )
        g.db.commit()
        flash("Online order updated.", "success")
        return redirect(
            url_for(
                "online_orders_desk",
                order_id=record.id,
                q=normalize_text(request.form.get("q")),
                status=normalize_text(request.form.get("status_filter")),
                payment=normalize_text(request.form.get("payment_filter")),
            )
        )

    @app.route("/app/modules/<module_key>")
    @login_required
    def module_list(module_key: str):
        definition = MODULES.get(module_key)
        if not definition:
            return redirect(url_for("dashboard"))
        access_response = enforce_module_access(module_key)
        if access_response:
            return access_response
        search = normalize_text(request.args.get("q"))
        if module_key == "apartments":
            month_filter = parse_month(request.args.get("month"))
            status_filter = normalize_text(request.args.get("status"))
            alert_filter = normalize_text(request.args.get("alert"))
            records = g.db.scalars(
                select(ModuleRecord)
                .where(ModuleRecord.module_key == module_key)
                .order_by(desc(ModuleRecord.month), desc(ModuleRecord.record_date), desc(ModuleRecord.updated_at))
            ).all()

            apartment_profiles = [apartment_profile(record) for record in records]
            apartment_profiles = [
                profile
                for profile in apartment_profiles
                if apartment_profile_matches_query(profile, search)
                and (not month_filter or profile["month"] == month_filter)
                and (not status_filter or profile["occupancyStatus"] == status_filter)
                and apartment_profile_matches_alert(profile, alert_filter)
            ]

            suite_latest: dict[str, dict[str, Any]] = {}
            for profile in apartment_profiles:
                current = suite_latest.get(profile["suite"])
                if not current or apartment_record_sort_key(profile["record"]) > apartment_record_sort_key(current["record"]):
                    suite_latest[profile["suite"]] = profile
            suite_profiles = sorted(
                suite_latest.values(),
                key=lambda item: (
                    item["alertRank"],
                    item["alertDate"] or "9999-12-31",
                    item["suite"],
                ),
            )

            history_rows = sorted(
                apartment_profiles,
                key=lambda item: apartment_record_sort_key(item["record"]),
                reverse=True,
            )

            occupancy_counts: dict[str, int] = defaultdict(int)
            for profile in suite_profiles:
                occupancy_counts[profile["occupancyStatus"]] += 1

            occupancy_chart = build_chart_rows(
                [
                    {"label": label, "short": label, "amount": count}
                    for label, count in sorted(occupancy_counts.items())
                    if count > 0
                ],
                label_key="label",
                value_key="amount",
                short_key="short",
                positive_color="var(--accent)",
            )
            outstanding_chart = build_chart_rows(
                [
                    {"label": profile["suite"], "short": profile["suite"], "amount": profile["outstanding"]}
                    for profile in sorted(suite_profiles, key=lambda item: item["outstanding"], reverse=True)[:10]
                    if profile["outstanding"] > 0
                ],
                label_key="label",
                value_key="amount",
                short_key="short",
            )
            bills_chart = build_chart_rows(
                [
                    {"label": profile["suite"], "short": profile["suite"], "amount": profile["billsBalance"]}
                    for profile in sorted(suite_profiles, key=lambda item: item["billsBalance"], reverse=True)[:10]
                    if profile["billsBalance"] > 0
                ],
                label_key="label",
                value_key="amount",
                short_key="short",
                positive_color="var(--accent)",
            )
            due_watch = [
                profile
                for profile in suite_profiles
                if profile["alertKey"] not in {"current", "vacant", "maintenance", "reserved"}
            ][:10]

            return render_template(
                "apartments.html",
                page_title=definition.label,
                definition=definition,
                search=search,
                month_filter=month_filter,
                status_filter=status_filter,
                alert_filter=alert_filter,
                suite_profiles=suite_profiles,
                history_rows=history_rows,
                due_watch=due_watch,
                occupancy_chart=occupancy_chart,
                outstanding_chart=outstanding_chart,
                bills_chart=bills_chart,
                occupancy_options=OCCUPANCY_STATUSES,
                suite_names=SUITE_NAMES,
                alert_options=[
                    ("", "All Alerts"),
                    ("overdue", "All Overdue"),
                    ("due-soon", "All Due Soon"),
                    ("notice", "Notice Given"),
                    ("occupied", "Occupied"),
                    ("vacant", "Vacant"),
                    ("balance-open", "Open Balance"),
                ],
                occupied_count=sum(1 for item in suite_profiles if item["occupancyKey"] == "occupied"),
                vacant_count=sum(1 for item in suite_profiles if item["occupancyKey"] == "vacant"),
                overdue_count=sum(1 for item in suite_profiles if item["alertKey"] in {"rent-overdue", "bills-overdue", "rent-bills-overdue"}),
                due_soon_count=sum(1 for item in suite_profiles if item["alertKey"] in {"rent-due-soon", "bills-due-soon", "rent-bills-due-soon"}),
                total_outstanding=round(sum(item["outstanding"] for item in suite_profiles), 2),
                total_credit=round(sum(item["creditBalance"] for item in suite_profiles), 2),
                total_rent_collected=round(sum(item["rentPaid"] for item in history_rows), 2),
                total_bills_collected=round(sum(item["billsPaid"] for item in history_rows), 2),
            )

        if module_key in SERVICE_MODULE_AREA_IDS:
            status_filter = normalize_text(request.args.get("status"))
            category_filter = normalize_text(request.args.get("category"))
            date_from = parse_date(request.args.get("date_from"))
            date_to = parse_date(request.args.get("date_to"))
            service_area = SERVICE_MODULE_AREA_IDS[module_key]
            all_records = g.db.scalars(
                select(ModuleRecord)
                .where(ModuleRecord.module_key == module_key)
                .order_by(desc(ModuleRecord.record_date), desc(ModuleRecord.updated_at))
            ).all()
            records = filter_module_records(
                all_records,
                definition,
                search=search,
                area_filter=service_area,
                status_filter=status_filter,
                category_filter=category_filter,
                date_from=date_from,
                date_to=date_to,
            )
            service_rows = (
                build_laundry_service_rows(records)
                if module_key == "laundry_tickets"
                else build_equipment_service_rows(records)
            )
            service_context = build_service_module_context(definition, service_rows)
            module_quick_actions = []
            if definition.editable:
                module_quick_actions.append(
                    {
                        "label": "New Record",
                        "href": url_for("module_form", module_key=module_key),
                        "note": f"Capture a new {definition.label[:-1].lower() if definition.label.endswith('s') else definition.label.lower()} quickly.",
                    }
                )
            if user_has_access(g.current_user, "sales"):
                module_quick_actions.append(
                    {
                        "label": "Open Daily Sales",
                        "href": url_for("module_list", module_key="sales"),
                        "note": "Payments saved here continue to sync into Daily Sales automatically.",
                    }
                )
            if user_has_access(g.current_user, "inventory"):
                module_quick_actions.append(
                    {
                        "label": "Open Inventory",
                        "href": url_for("inventory", area=service_area),
                        "note": "Review the related supplies and stock for this service area.",
                    }
                )
            return render_template(
                "service_module.html",
                page_title=definition.label,
                definition=definition,
                search=search,
                status_filter=status_filter,
                category_filter=category_filter,
                date_from=date_from.isoformat() if date_from else "",
                date_to=date_to.isoformat() if date_to else "",
                service_rows=service_rows,
                service_context=service_context,
                status_options=module_status_options(definition, all_records),
                category_options=module_category_options(definition, all_records, service_area),
                category_filter_label=module_filter_category_label(definition),
                module_quick_actions=module_quick_actions,
            )

        area_filter = normalize_text(request.args.get("area"))
        status_filter = normalize_text(request.args.get("status"))
        category_filter = normalize_text(request.args.get("category"))
        month_filter = parse_month(request.args.get("month")) if definition.month_field else ""
        date_from = parse_date(request.args.get("date_from"))
        date_to = parse_date(request.args.get("date_to"))
        all_records = g.db.scalars(
            select(ModuleRecord)
            .where(ModuleRecord.module_key == module_key)
            .order_by(desc(ModuleRecord.month), desc(ModuleRecord.record_date), desc(ModuleRecord.updated_at))
        ).all()
        records = filter_module_records(
            all_records,
            definition,
            search=search,
            area_filter=area_filter,
            status_filter=status_filter,
            category_filter=category_filter,
            month_filter=month_filter,
            date_from=date_from,
            date_to=date_to,
        )
        module_overview = build_module_overview(definition, records)
        module_quick_actions = []
        if user_has_access(g.current_user, "sales"):
            module_quick_actions.append(
                {
                    "label": "Open Daily Sales",
                    "href": url_for("module_list", module_key="sales"),
                    "note": "Review the sales ledger that receives synced counter and service payments.",
                }
            )
        target_area = area_filter
        target_month = month_filter or (date_from.strftime("%Y-%m") if date_from else date.today().strftime("%Y-%m"))
        return render_template(
            "module_list.html",
            page_title=definition.label,
            definition=definition,
            records=records,
            search=search,
            area_filter=area_filter,
            status_filter=status_filter,
            category_filter=category_filter,
            month_filter=month_filter,
            date_from=date_from.isoformat() if date_from else "",
            date_to=date_to.isoformat() if date_to else "",
            show_area_filter=module_has_field(definition, "businessAreaId"),
            show_status_filter=bool(definition.status_field),
            show_category_filter=bool(module_filter_category_field(definition)) and module_filter_category_field(definition) != definition.status_field,
            show_month_filter=bool(definition.month_field),
            show_date_filters=bool(definition.date_field),
            status_options=module_status_options(definition, all_records),
            category_options=module_category_options(definition, all_records, area_filter),
            category_filter_label=module_filter_category_label(definition),
            module_overview=module_overview,
            module_quick_actions=module_quick_actions,
            business_area_options=BUSINESS_AREA_OPTIONS,
            target_progress_rows=build_target_progress_rows(g.db.scalars(select(ModuleRecord)).all(), target_month, area_filter=target_area) if target_area else [],
            target_month=target_month,
        )

    @app.route("/app/modules/<module_key>/export.csv")
    @login_required
    def module_export(module_key: str):
        definition = MODULES.get(module_key)
        if not definition:
            return redirect(url_for("dashboard"))
        access_response = enforce_module_access(module_key)
        if access_response:
            return access_response
        search = normalize_text(request.args.get("q"))
        if module_key == "apartments":
            month_filter = parse_month(request.args.get("month"))
            status_filter = normalize_text(request.args.get("status"))
            alert_filter = normalize_text(request.args.get("alert"))
            records = g.db.scalars(
                select(ModuleRecord)
                .where(ModuleRecord.module_key == module_key)
                .order_by(desc(ModuleRecord.month), desc(ModuleRecord.record_date), desc(ModuleRecord.updated_at))
            ).all()
            filtered_records = []
            for record in records:
                profile = apartment_profile(record)
                if not apartment_profile_matches_query(profile, search):
                    continue
                if month_filter and profile["month"] != month_filter:
                    continue
                if status_filter and profile["occupancyStatus"] != status_filter:
                    continue
                if not apartment_profile_matches_alert(profile, alert_filter):
                    continue
                filtered_records.append(record)
            headers, rows = build_module_export_rows(filtered_records, definition)
            return csv_download(
                f"oneroot-{module_key}-{date.today().isoformat()}.csv",
                headers,
                rows,
            )
        area_filter = normalize_text(request.args.get("area"))
        status_filter = normalize_text(request.args.get("status"))
        category_filter = normalize_text(request.args.get("category"))
        month_filter = parse_month(request.args.get("month")) if definition.month_field else ""
        date_from = parse_date(request.args.get("date_from"))
        date_to = parse_date(request.args.get("date_to"))
        all_records = g.db.scalars(
            select(ModuleRecord)
            .where(ModuleRecord.module_key == module_key)
            .order_by(desc(ModuleRecord.month), desc(ModuleRecord.record_date), desc(ModuleRecord.updated_at))
        ).all()
        records = filter_module_records(
            all_records,
            definition,
            search=search,
            area_filter=area_filter,
            status_filter=status_filter,
            category_filter=category_filter,
            month_filter=month_filter,
            date_from=date_from,
            date_to=date_to,
        )
        headers, rows = build_module_export_rows(records, definition)
        return csv_download(
            f"oneroot-{module_key}-{date.today().isoformat()}.csv",
            headers,
            rows,
        )

    @app.route("/app/modules/<module_key>/new", methods=["GET", "POST"])
    @app.route("/app/modules/<module_key>/<record_id>/edit", methods=["GET", "POST"])
    @login_required
    def module_form(module_key: str, record_id: str | None = None):
        definition = MODULES.get(module_key)
        if not definition:
            return redirect(url_for("dashboard"))
        access_response = enforce_module_access(module_key)
        if access_response:
            return access_response
        if not definition.editable:
            flash("This module is view-only in the new platform right now.", "warning")
            return redirect(url_for("module_list", module_key=module_key))

        record = g.db.get(ModuleRecord, record_id) if record_id else None
        if record and record.module_key != module_key:
            return redirect(url_for("module_list", module_key=module_key))

        if request.method == "POST":
            payload = dict(record.payload if record else {})
            payload.setdefault("id", record.id if record else uuid4().hex)
            payload.setdefault("createdAt", record.created_at.isoformat() if record else datetime.utcnow().isoformat())
            for field in definition.fields:
                if (
                    module_key in SERVICE_LEGACY_PAYMENT_FIELDS
                    and field.name in SERVICE_LEGACY_PAYMENT_FIELDS[module_key]
                    and field.name not in request.form
                ):
                    continue
                payload[field.name] = parse_field_input(field, request.form)
            if module_key == "apartments":
                payload["businessAreaId"] = "rentals-apartments"
            elif module_key in SERVICE_MODULE_AREA_IDS:
                payload["businessAreaId"] = SERVICE_MODULE_AREA_IDS[module_key]
                hydrate_service_cost_payload(g.db, module_key, payload)
                apply_service_payment_rollup(module_key, payload)
            elif module_key == "forecast_plans":
                planning_rollup(payload)
            elif module_key == "salary_records":
                salary_rollup(payload)
            elif module_key == "asset_records":
                asset_rollup(payload)
            elif module_key == "maintenance_records":
                maintenance_rollup(payload)
            elif module_key == "knowledge_base":
                knowledge_rollup(payload)
            elif module_key == "workforce_attendance":
                workforce_rollup(payload)
            elif module_key == "whatsapp_campaigns":
                whatsapp_campaign_rollup(payload)
            elif module_key == "campaign_roi":
                campaign_roi_rollup(payload)
            elif module_key == "delivery_dispatch":
                delivery_dispatch_rollup(payload)
            elif module_key == "sales":
                payload["sourceType"] = normalize_text(payload.get("sourceType")) or "manual-sale"
                payload["profitAmount"] = round(parse_amount(payload.get("amount")) - parse_amount(payload.get("costAmount")), 2)
            payload["updatedAt"] = datetime.utcnow().isoformat()
            if not record:
                record = ModuleRecord(id=payload["id"], module_key=module_key, created_at=datetime.utcnow())
                g.db.add(record)
            set_module_record_metadata(record, definition, payload)
            sync_generated_sales_for_module_record(record)
            audit(module_key, definition.label, "update" if record_id else "create", record.title, record.id)
            g.db.commit()
            flash(f"{definition.label} saved.", "success")
            return redirect(url_for("module_list", module_key=module_key))

        record_payload = dict(record.payload if record else {})
        if module_key == "salary_records":
            salary_rollup(record_payload)
        elif module_key == "asset_records":
            asset_rollup(record_payload)
        elif module_key == "maintenance_records":
            maintenance_rollup(record_payload)
        elif module_key == "knowledge_base":
            knowledge_rollup(record_payload)
        elif module_key == "workforce_attendance":
            workforce_rollup(record_payload)
        if module_key == "apartments":
            record_payload.setdefault("businessAreaId", "rentals-apartments")
            field_map = {field.name: field for field in definition.fields}
            section_fields = []
            for title, description, field_names in APARTMENT_FORM_SECTIONS:
                section_fields.append(
                    {
                        "title": title,
                        "description": description,
                        "fields": [field_map[name] for name in field_names if name in field_map],
                    }
                )
            apartment_summary = apartment_profile(record) if record else None
            return render_template(
                "apartments_form.html",
                page_title=f"{definition.label} Form",
                definition=definition,
                record=record,
                payload=record_payload,
                section_fields=section_fields,
                apartment_summary=apartment_summary,
            )
        if module_key in SERVICE_MODULE_AREA_IDS:
            record_payload.setdefault("businessAreaId", SERVICE_MODULE_AREA_IDS[module_key])
            default_status = "Received" if module_key == "laundry_tickets" else "Booked"
            record_payload.setdefault(definition.status_field, default_status)
            service_area = SERVICE_MODULE_AREA_IDS[module_key]
            inventory_reference_products = service_reference_products(g.db, module_key)
            module_quick_actions = []
            if user_has_access(g.current_user, "sales"):
                module_quick_actions.append(
                    {
                        "label": "Open Daily Sales",
                        "href": url_for("module_list", module_key="sales"),
                        "note": "Payments recorded here will appear in Daily Sales automatically.",
                    }
                )
            if user_has_access(g.current_user, "inventory"):
                module_quick_actions.append(
                    {
                        "label": "Open Inventory",
                        "href": url_for("inventory", area=service_area),
                        "note": "Check related stock, supplies, and referenced equipment.",
                    }
                )
            return render_template(
                "service_form.html",
                page_title=f"{definition.label} Form",
                definition=definition,
                record=record,
                payload=record_payload,
                section_fields=service_module_field_sections(definition),
                module_quick_actions=module_quick_actions,
                reference_product_options=[product.name for product in inventory_reference_products],
                reference_product_catalog=[
                    {
                        "name": product.name,
                        "category": product.category,
                        "salesPrice": round(parse_amount(product.sales_price), 2),
                        "costPrice": round(parse_amount(product.cost_price), 2),
                    }
                    for product in inventory_reference_products
                ],
                service_payment_summary=service_payment_summary(module_key, record_payload),
            )
        module_quick_actions = []
        if module_key == "salary_records" and record:
            module_quick_actions.append(
                {
                    "label": "Open Payslip",
                    "href": url_for("salary_payslip", record_id=record.id),
                    "note": "Print or save the payslip for this payroll record.",
                }
            )
        return render_template(
            "module_form.html",
            page_title=f"{definition.label} Form",
            definition=definition,
            record=record,
            payload=record_payload,
            category_map=inventory_category_map(),
            dynamic_category_field="category" if module_has_field(definition, "category") else "",
            module_quick_actions=module_quick_actions,
        )

    @app.route("/app/services/<module_key>/<record_id>/payment", methods=["GET", "POST"])
    @login_required
    def service_payment_form(module_key: str, record_id: str):
        if module_key not in SERVICE_MODULE_AREA_IDS:
            return redirect(url_for("dashboard"))
        definition = MODULES.get(module_key)
        if not definition:
            return redirect(url_for("dashboard"))
        access_response = enforce_module_access(module_key)
        if access_response:
            return access_response
        record = g.db.get(ModuleRecord, record_id)
        if not record or record.module_key != module_key:
            flash("That service request could not be found.", "error")
            return redirect(url_for("module_list", module_key=module_key))

        payload = dict(record.payload or {})
        if request.method == "POST":
            payment_date = normalize_text(request.form.get("paymentDate")) or date.today().isoformat()
            amount_paid = round(parse_amount(request.form.get("amountPaid")), 2)
            if amount_paid <= 0:
                flash("Enter a payment amount greater than zero.", "error")
            else:
                entries = payload.get(SERVICE_PAYMENT_ENTRIES_KEY) if isinstance(payload.get(SERVICE_PAYMENT_ENTRIES_KEY), list) else []
                if not entries and parse_amount(payload.get("amountPaid")) > 0:
                    entries = [
                        {
                            "id": "legacy",
                            "paymentDate": normalize_text(payload.get("paymentDate")),
                            "amountPaid": round(parse_amount(payload.get("amountPaid")), 2),
                            "paymentMethod": normalize_text(payload.get("paymentMethod")),
                            "paymentReference": normalize_text(payload.get("paymentReference")),
                            "receivedBy": normalize_text(payload.get("receivedBy")),
                            "notes": "Imported from the earlier single-payment service capture.",
                            "createdAt": normalize_text(payload.get("updatedAt")) or normalize_text(payload.get("createdAt")),
                        }
                    ]
                entries.append(
                    {
                        "id": uuid4().hex,
                        "paymentDate": payment_date,
                        "amountPaid": amount_paid,
                        "paymentMethod": normalize_text(request.form.get("paymentMethod")),
                        "paymentReference": normalize_text(request.form.get("paymentReference")),
                        "receivedBy": normalize_text(request.form.get("receivedBy")) or g.current_user.full_name or g.current_user.username,
                        "notes": normalize_text(request.form.get("notes")),
                        "createdAt": datetime.utcnow().isoformat(),
                    }
                )
                payload[SERVICE_PAYMENT_ENTRIES_KEY] = entries
                apply_service_payment_rollup(module_key, payload)
                payload["updatedAt"] = datetime.utcnow().isoformat()
                set_module_record_metadata(record, definition, payload)
                sync_generated_sales_for_module_record(record)
                audit(
                    module_key,
                    definition.label,
                    "update",
                    record.title,
                    record.id,
                    f"Payment captured: {format_currency(amount_paid)} on {payment_date}.",
                )
                g.db.commit()
                flash("Service payment captured.", "success")
                return redirect(url_for("service_payment_form", module_key=module_key, record_id=record.id))

        service_row = (
            build_laundry_service_rows([record])[0]
            if module_key == "laundry_tickets"
            else build_equipment_service_rows([record])[0]
        )
        return render_template(
            "service_payment_form.html",
            page_title=f"{definition.label} Payment",
            definition=definition,
            record=record,
            payload=payload,
            service_row=service_row,
            payment_methods=PAYMENT_METHODS,
            today_iso=date.today().isoformat(),
        )

    @app.route("/app/services/<module_key>/<record_id>/payments/<payment_id>/delete", methods=["POST"])
    @login_required
    def service_payment_delete(module_key: str, record_id: str, payment_id: str):
        if module_key not in SERVICE_MODULE_AREA_IDS:
            return redirect(url_for("dashboard"))
        definition = MODULES.get(module_key)
        if not definition:
            return redirect(url_for("dashboard"))
        access_response = enforce_module_access(module_key)
        if access_response:
            return access_response
        record = g.db.get(ModuleRecord, record_id)
        if not record or record.module_key != module_key:
            flash("That service request could not be found.", "error")
            return redirect(url_for("module_list", module_key=module_key))

        payload = dict(record.payload or {})
        entries = payload.get(SERVICE_PAYMENT_ENTRIES_KEY) if isinstance(payload.get(SERVICE_PAYMENT_ENTRIES_KEY), list) else []
        if not entries and normalize_text(payment_id) == "legacy" and parse_amount(payload.get("amountPaid")) > 0:
            payload[SERVICE_PAYMENT_ENTRIES_KEY] = []
            payload["amountPaid"] = 0.0
            payload["paymentDate"] = ""
            payload["paymentMethod"] = ""
            payload["paymentReference"] = ""
            payload["updatedAt"] = datetime.utcnow().isoformat()
            set_module_record_metadata(record, definition, payload)
            sync_generated_sales_for_module_record(record)
            audit(
                module_key,
                definition.label,
                "update",
                record.title,
                record.id,
                "A legacy single-payment entry was removed.",
            )
            g.db.commit()
            flash("Service payment removed.", "success")
            return redirect(url_for("service_payment_form", module_key=module_key, record_id=record.id))
        next_entries = [
            entry
            for entry in entries
            if normalize_text(entry.get("id")) != normalize_text(payment_id)
        ]
        if len(next_entries) == len(entries):
            flash("That payment entry could not be found.", "error")
            return redirect(url_for("service_payment_form", module_key=module_key, record_id=record.id))

        payload[SERVICE_PAYMENT_ENTRIES_KEY] = next_entries
        apply_service_payment_rollup(module_key, payload)
        payload["updatedAt"] = datetime.utcnow().isoformat()
        set_module_record_metadata(record, definition, payload)
        sync_generated_sales_for_module_record(record)
        audit(
            module_key,
            definition.label,
            "update",
            record.title,
            record.id,
            "A saved service payment was removed.",
        )
        g.db.commit()
        flash("Service payment removed.", "success")
        return redirect(url_for("service_payment_form", module_key=module_key, record_id=record.id))

    @app.route("/app/modules/<module_key>/<record_id>/delete", methods=["POST"])
    @login_required
    def module_delete(module_key: str, record_id: str):
        definition = MODULES.get(module_key)
        if not definition or not definition.editable:
            flash("That record cannot be deleted here.", "warning")
            return redirect(url_for("dashboard"))
        access_response = enforce_module_access(module_key)
        if access_response:
            return access_response

        record = g.db.get(ModuleRecord, record_id)
        if not record or record.module_key != module_key:
            flash("That record could not be found.", "error")
            return redirect(url_for("module_list", module_key=module_key))

        if module_key == "sales" and (
            normalize_text((record.payload or {}).get("linkedGeneratedSalesKey"))
            or normalize_text((record.payload or {}).get("sourceType"))
            in {
                "pos-summary",
                "online-order-payments",
                "apartment-rent-payment",
                "apartment-bill-payment",
                "laundry-payment",
                "equipment-rental-payment",
                "security-deposit-payment",
                "tenant-charge-payment",
            }
        ):
            flash("Delete the source record instead of deleting a generated sales sync row directly.", "warning")
            return redirect(
                url_for(
                    "module_list",
                    module_key=module_key,
                    q=normalize_text(request.form.get("q")),
                    area=normalize_text(request.form.get("area")),
                    status=normalize_text(request.form.get("status")),
                    category=normalize_text(request.form.get("category")),
                    month=parse_month(request.form.get("month")),
                    date_from=normalize_text(request.form.get("date_from")),
                    date_to=normalize_text(request.form.get("date_to")),
                )
            )

        for reference in generated_sales_references_for_module_record(record):
            linked_sales = g.db.scalars(
                select(ModuleRecord).where(
                    ModuleRecord.module_key == "sales",
                    ModuleRecord.reference == reference,
                )
            ).all()
            for linked_record in linked_sales:
                g.db.delete(linked_record)

        title = record.title
        g.db.delete(record)
        audit(module_key, definition.label, "delete", title, record_id)
        g.db.commit()
        flash(f"{definition.label} record deleted.", "success")
        if module_key == "apartments":
            return redirect(
                url_for(
                    "module_list",
                    module_key=module_key,
                    q=normalize_text(request.form.get("q")),
                    month=parse_month(request.form.get("month")),
                    status=normalize_text(request.form.get("status")),
                    alert=normalize_text(request.form.get("alert")),
                )
            )
        return redirect(
            url_for(
                "module_list",
                module_key=module_key,
                q=normalize_text(request.form.get("q")),
                area=normalize_text(request.form.get("area")),
                status=normalize_text(request.form.get("status")),
                category=normalize_text(request.form.get("category")),
                month=parse_month(request.form.get("month")),
                date_from=normalize_text(request.form.get("date_from")),
                date_to=normalize_text(request.form.get("date_to")),
            )
        )

    @app.route("/app/salaries/<record_id>/payslip")
    @access_required("salary_records")
    def salary_payslip(record_id: str):
        record = g.db.get(ModuleRecord, record_id)
        if not record or record.module_key != "salary_records":
            flash("That payroll record could not be found.", "error")
            return redirect(url_for("module_list", module_key="salary_records"))
        payload = dict(record.payload or {})
        salary_rollup(payload)
        return render_template(
            "salary_payslip.html",
            page_title=f"Payslip - {normalize_text(payload.get('staffName')) or record.title}",
            back_url=url_for("module_form", module_key="salary_records", record_id=record.id),
            record=record,
            payload=payload,
            generated_on=date.today().isoformat(),
            payroll_month=record.month or parse_month(payload.get("month")),
        )

    @app.route("/app/apartments/<record_id>/receipt")
    @access_required("apartments")
    def apartment_receipt(record_id: str):
        bundle = apartment_document_bundle(record_id)
        if not bundle:
            flash("That apartment record could not be found.", "error")
            return redirect(url_for("module_list", module_key="apartments"))
        profile = bundle["profile"]
        source_payload = bundle["sourcePayload"]
        bill_items = [
            {"label": "Water Bill", "amount": profile["waterBill"]},
            {"label": "Toilet Bill", "amount": profile["toiletBill"]},
            {"label": "Sweeping & Gutter Cleaning", "amount": profile["sweepingBill"]},
            {"label": "Waste Management", "amount": profile["wasteBill"]},
            *profile["customCharges"],
        ]
        receipt_total = round(profile["rentPaid"] + profile["billsPaid"], 2)
        return render_template(
            "apartment_receipt.html",
            page_title=f"Apartment Receipt - {profile['suite']}",
            back_url=url_for("module_form", module_key="apartments", record_id=record_id),
            profile=profile,
            source=source_payload,
            bill_items=bill_items,
            receipt_total=receipt_total,
            generated_on=date.today().isoformat(),
        )

    @app.route("/app/apartments/<record_id>/statement")
    @access_required("apartments")
    def apartment_statement(record_id: str):
        bundle = apartment_document_bundle(record_id)
        if not bundle:
            flash("That apartment record could not be found.", "error")
            return redirect(url_for("module_list", module_key="apartments"))
        return render_template(
            "apartment_statement.html",
            page_title=f"Tenant Statement - {bundle['profile']['suite']}",
            back_url=url_for("module_form", module_key="apartments", record_id=record_id),
            profile=bundle["profile"],
            source=bundle["sourcePayload"],
            statement_rows=bundle["statementRows"],
            totals=bundle["statementTotals"],
            generated_on=date.today().isoformat(),
        )

    @app.route("/app/apartments/<record_id>/agreement")
    @access_required("apartments")
    def apartment_agreement(record_id: str):
        bundle = apartment_document_bundle(record_id)
        if not bundle:
            flash("That apartment record could not be found.", "error")
            return redirect(url_for("module_list", module_key="apartments"))
        source_payload = bundle["sourcePayload"]
        agreement_ready = bool(
            normalize_text(source_payload.get("tenantName"))
            and normalize_text(source_payload.get("occupancyStatus")) in APARTMENT_ACTIVE_STATUSES
            and apartment_payment_confirmed(source_payload)
        )
        return render_template(
            "apartment_agreement.html",
            page_title=f"Tenancy Agreement - {bundle['profile']['suite']}",
            back_url=url_for("module_form", module_key="apartments", record_id=record_id),
            profile=bundle["profile"],
            source=source_payload,
            owner_name=workspace_owner_name(),
            agreement_ready=agreement_ready,
            template_ready=TENANCY_TEMPLATE_PATH.exists(),
            docx_url=url_for("apartment_agreement_docx", record_id=record_id),
            payment_channel=f"MTN Mobile Money to {app_config.whatsapp_number}",
            property_location=TENANCY_PROPERTY_LOCATION,
            commencement_date=apartment_agreement_commencement_date(source_payload),
            expiry_date=apartment_agreement_expiry_date(source_payload),
            cycle_months=apartment_cycle_months(source_payload),
            generated_on=date.today().isoformat(),
        )

    @app.route("/app/apartments/<record_id>/agreement.docx")
    @access_required("apartments")
    def apartment_agreement_docx(record_id: str):
        bundle = apartment_document_bundle(record_id)
        if not bundle:
            flash("That apartment record could not be found.", "error")
            return redirect(url_for("module_list", module_key="apartments"))
        if not TENANCY_TEMPLATE_PATH.exists():
            flash("The tenancy agreement template file is missing.", "error")
            return redirect(url_for("apartment_agreement", record_id=record_id))
        source_payload = bundle["sourcePayload"]
        if not (
            normalize_text(source_payload.get("tenantName"))
            and normalize_text(source_payload.get("occupancyStatus")) in APARTMENT_ACTIVE_STATUSES
            and apartment_payment_confirmed(source_payload)
        ):
            flash("Capture rent payment before downloading the tenancy agreement.", "warning")
            return redirect(url_for("apartment_agreement", record_id=record_id))
        document_bytes = build_tenancy_agreement_docx(apartment_agreement_placeholders(source_payload, app_config))
        filename = (
            f"{safe_filename_segment(source_payload.get('suite'), 'Suite')}_"
            f"{safe_filename_segment(source_payload.get('tenantName'), 'Tenant')}_Tenancy_Agreement.docx"
        )
        return send_file(
            BytesIO(document_bytes),
            mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            as_attachment=True,
            download_name=filename,
        )

    @app.route("/app/apartments/<record_id>/bill-notice")
    @access_required("apartments")
    def apartment_bill_notice(record_id: str):
        bundle = apartment_document_bundle(record_id)
        if not bundle:
            flash("That apartment record could not be found.", "error")
            return redirect(url_for("module_list", module_key="apartments"))
        profile = bundle["profile"]
        bill_items = [
            {"label": "Water Bill", "amount": profile["waterBill"]},
            {"label": "Toilet Bill", "amount": profile["toiletBill"]},
            {"label": "Sweeping & Gutter Cleaning", "amount": profile["sweepingBill"]},
            {"label": "Waste Management", "amount": profile["wasteBill"]},
            *profile["customCharges"],
        ]
        return render_template(
            "apartment_bill_notice.html",
            page_title=f"Monthly Bill Notice - {profile['suite']}",
            back_url=url_for("module_form", module_key="apartments", record_id=record_id),
            profile=profile,
            source=bundle["sourcePayload"],
            bill_items=bill_items,
            payment_channel=f"MTN Mobile Money to {app_config.whatsapp_number}",
            generated_on=date.today().isoformat(),
        )

    @app.route("/app/apartments/report/print")
    @access_required("apartments")
    def apartment_report_print():
        search = normalize_text(request.args.get("q"))
        month_filter = parse_month(request.args.get("month"))
        status_filter = normalize_text(request.args.get("status"))
        alert_filter = normalize_text(request.args.get("alert"))
        records = g.db.scalars(
            select(ModuleRecord)
            .where(ModuleRecord.module_key == "apartments")
            .order_by(desc(ModuleRecord.month), desc(ModuleRecord.record_date), desc(ModuleRecord.updated_at))
        ).all()
        apartment_profiles = [apartment_profile(record) for record in records]
        apartment_profiles = [
            profile
            for profile in apartment_profiles
            if apartment_profile_matches_query(profile, search)
            and (not month_filter or profile["month"] == month_filter)
            and (not status_filter or profile["occupancyStatus"] == status_filter)
            and apartment_profile_matches_alert(profile, alert_filter)
        ]
        suite_latest: dict[str, dict[str, Any]] = {}
        for profile in apartment_profiles:
            current = suite_latest.get(profile["suite"])
            if not current or apartment_record_sort_key(profile["record"]) > apartment_record_sort_key(current["record"]):
                suite_latest[profile["suite"]] = profile
        suite_profiles = sorted(
            suite_latest.values(),
            key=lambda item: (item["alertRank"], item["alertDate"] or "9999-12-31", item["suite"]),
        )
        history_rows = sorted(apartment_profiles, key=lambda item: apartment_record_sort_key(item["record"]), reverse=True)
        due_watch = [
            profile
            for profile in suite_profiles
            if profile["alertKey"] not in {"current", "vacant", "maintenance", "reserved"}
        ][:20]
        return render_template(
            "apartment_report.html",
            page_title="Apartment Report",
            back_url=url_for("module_list", module_key="apartments", q=search, month=month_filter, status=status_filter, alert=alert_filter),
            suite_profiles=suite_profiles,
            history_rows=history_rows,
            due_watch=due_watch,
            search=search,
            month_filter=month_filter,
            status_filter=status_filter,
            alert_filter=alert_filter,
            total_outstanding=round(sum(item["outstanding"] for item in suite_profiles), 2),
            total_credit=round(sum(item["creditBalance"] for item in suite_profiles), 2),
            total_rent_collected=round(sum(item["rentPaid"] for item in history_rows), 2),
            total_bills_collected=round(sum(item["billsPaid"] for item in history_rows), 2),
            occupied_count=sum(1 for item in suite_profiles if item["occupancyKey"] == "occupied"),
            vacant_count=sum(1 for item in suite_profiles if item["occupancyKey"] == "vacant"),
            overdue_count=sum(1 for item in suite_profiles if item["alertKey"] in {"rent-overdue", "bills-overdue", "rent-bills-overdue"}),
            due_soon_count=sum(1 for item in suite_profiles if item["alertKey"] in {"rent-due-soon", "bills-due-soon", "rent-bills-due-soon"}),
            generated_on=date.today().isoformat(),
        )

    @app.route("/app/apartments/apply-monthly-bills", methods=["POST"])
    @access_required("apartments")
    def apartment_apply_monthly_bills():
        month_value = parse_month(request.form.get("month")) or date.today().strftime("%Y-%m")
        explicit_due_date = normalize_text(request.form.get("bill_due_date"))
        records = g.db.scalars(
            select(ModuleRecord)
            .where(ModuleRecord.module_key == "apartments")
            .order_by(desc(ModuleRecord.month), desc(ModuleRecord.record_date), desc(ModuleRecord.updated_at))
        ).all()

        suite_latest: dict[str, ModuleRecord] = {}
        for record in records:
            profile = apartment_profile(record)
            if profile["occupancyStatus"] not in APARTMENT_ACTIVE_STATUSES or not profile["tenant"]:
                continue
            current = suite_latest.get(profile["suite"])
            if not current or apartment_record_sort_key(record) > apartment_record_sort_key(current):
                suite_latest[profile["suite"]] = record

        created_count = 0
        skipped_count = 0
        for suite, source_record in suite_latest.items():
            existing = g.db.scalar(
                select(ModuleRecord).where(
                    ModuleRecord.module_key == "apartments",
                    ModuleRecord.month == month_value,
                    ModuleRecord.reference.ilike(f"{suite}|{month_value}|%"),
                )
            )
            if existing:
                skipped_count += 1
                continue

            source_payload = dict(source_record.payload or {})
            new_payload = dict(source_payload)
            new_payload["id"] = uuid4().hex
            new_payload["month"] = month_value
            new_payload["rentDue"] = 0.0
            new_payload["rentPaid"] = 0.0
            new_payload["rentPaymentDate"] = ""
            new_payload["rentPaymentMethod"] = ""
            new_payload["rentPaymentReference"] = ""
            new_payload["rentReceivedBy"] = ""
            new_payload["rentCoverageStartDate"] = ""
            new_payload["rentCoverageEndDate"] = ""
            new_payload["arrearsBroughtForward"] = apartment_rent_balance(source_payload)
            new_payload["creditBroughtForward"] = apartment_credit_balance(source_payload)
            new_payload["lateFee"] = 0.0
            new_payload["billAmountPaid"] = 0.0
            new_payload["billPaymentDate"] = ""
            new_payload["billPaymentMethod"] = ""
            new_payload["billPaymentReference"] = ""
            new_payload["billReceivedBy"] = ""
            new_payload["nextRentDueDate"] = align_date_to_month(source_payload.get("nextRentDueDate"), month_value, fallback_day=5)
            new_payload["billDueDate"] = (
                explicit_due_date
                if parse_date(explicit_due_date)
                else align_date_to_month(source_payload.get("billDueDate"), month_value, fallback_day=10)
            )
            new_payload["updatedAt"] = datetime.utcnow().isoformat()
            note_prefix = f"Monthly bills issued in bulk for {month_value}."
            existing_notes = normalize_text(source_payload.get("notes"))
            new_payload["notes"] = f"{note_prefix} {existing_notes}".strip()

            record = ModuleRecord(
                id=new_payload["id"],
                module_key="apartments",
                created_at=datetime.utcnow(),
            )
            g.db.add(record)
            set_module_record_metadata(record, MODULES["apartments"], new_payload)
            sync_generated_sales_for_module_record(record)
            created_count += 1

        if created_count:
            audit(
                "apartments",
                "Apartment Rentals",
                "create",
                f"Bulk monthly bills {month_value}",
                detail=f"{created_count} suite bills issued in bulk.",
            )
        g.db.commit()
        if created_count:
            flash(f"Issued monthly bills for {created_count} suite(s) for {month_value}.", "success")
        if skipped_count:
            flash(f"Skipped {skipped_count} suite(s) because a {month_value} record already exists.", "warning")
        return redirect(
            url_for(
                "module_list",
                module_key="apartments",
                q=normalize_text(request.form.get("q")),
                month=month_value,
                status=normalize_text(request.form.get("status")),
                alert=normalize_text(request.form.get("alert")),
            )
        )

    @app.route("/app/inventory", methods=["GET", "POST"])
    @access_required("inventory")
    def inventory():
        editing_id = normalize_text(request.args.get("edit"))
        editing_product = g.db.get(Product, editing_id) if editing_id else None
        all_products = g.db.scalars(select(Product).order_by(Product.business_area_id.asc(), Product.category.asc(), Product.name.asc())).all()
        for product in all_products:
            normalize_product_record(product)
        if editing_product:
            normalize_product_record(editing_product)
        category_map = inventory_category_map(all_products)
        category_groups = [
            {
                "areaId": area["id"],
                "label": area["label"],
                "short": area["short"],
                "categories": category_map.get(area["id"], []),
            }
            for area in BUSINESS_AREAS
            if category_map.get(area["id"])
        ]

        if request.method == "POST":
            product_id = normalize_text(request.form.get("id")) or uuid4().hex
            product = g.db.get(Product, product_id)
            is_new = product is None
            if not product:
                product = Product(id=product_id, created_at=datetime.utcnow())
                g.db.add(product)
            try:
                existing_image_url = normalize_text(product.image_url)
                existing_sku = normalize_text(product.sku)
                product.updated_at = datetime.utcnow()
                product.sku = existing_sku or normalize_text(request.form.get("sku"))
                product.barcode = normalize_text(request.form.get("barcode"))
                product.name = normalize_text(request.form.get("name"))
                product.business_area_id = normalize_text(request.form.get("business_area_id"))
                product.category = normalize_text(request.form.get("category"))
                product.item_type = normalized_product_item_type(request.form.get("item_type"), True)
                product.quantity_on_hand = parse_amount(request.form.get("quantity_on_hand"))
                product.min_stock_level = int(parse_amount(request.form.get("min_stock_level")))
                product.sales_price = parse_amount(request.form.get("sales_price"))
                product.cost_price = parse_amount(request.form.get("cost_price"))
                product.active = request.form.get("active") == "on"
                product.notes = normalize_text(request.form.get("notes"))
                product.user_created = True

                if request.form.get("clear_image") == "on":
                    product.image_url = ""
                else:
                    uploaded_image = encode_uploaded_product_image(request.files.get("image_file"))
                    if uploaded_image:
                        product.image_url = uploaded_image
                    else:
                        typed_image_url = normalize_text(request.form.get("image_url"))
                        product.image_url = normalize_product_image_value(typed_image_url) if typed_image_url else existing_image_url

                if not product.name or not product.business_area_id or not product.category:
                    raise ValueError("Name, business area, and category are required.")

                normalize_product_record(product)
                audit("inventory", "Inventory", "create" if is_new else "update", product.name, product.id)
                g.db.commit()
                flash("Inventory item saved.", "success")
                return redirect(
                    url_for(
                        "inventory",
                        q=normalize_text(request.args.get("q")),
                        area=normalize_text(request.args.get("area")),
                        category=normalize_text(request.args.get("category")),
                    )
                )
            except ValueError as error:
                g.db.rollback()
                if is_new:
                    g.db.expunge(product)
                editing_product = product
                flash(str(error), "error")
            except Exception:
                g.db.rollback()
                if is_new:
                    g.db.expunge(product)
                editing_product = product
                app.logger.exception("Inventory save failed for %s", product_id)
                flash("That item could not be saved. Please check the item type, category, and image fields.", "error")

        q = normalize_text(request.args.get("q"))
        area_filter = normalize_text(request.args.get("area"))
        category_filter = normalize_text(request.args.get("category"))
        query = select(Product)
        if area_filter:
            query = query.where(Product.business_area_id == area_filter)
        if category_filter:
            query = query.where(Product.category == category_filter)
        if q:
            like_value = f"%{q}%"
            query = query.where(
                or_(
                    Product.name.ilike(like_value),
                    Product.sku.ilike(like_value),
                    Product.barcode.ilike(like_value),
                    Product.category.ilike(like_value),
                )
            )
        products = g.db.scalars(query.order_by(Product.active.desc(), Product.business_area_id.asc(), Product.name.asc()).limit(300)).all()
        for item in products:
            normalize_product_record(item)
        low_stock_count = sum(
            1
            for item in products
            if product_tracks_inventory(item) and item.active and item.quantity_on_hand <= item.min_stock_level
        )
        active_count = sum(1 for item in products if item.active)
        service_count = sum(1 for item in products if normalized_product_item_type(item.item_type, item.track_inventory) == "service")
        stock_value = round(sum(item.quantity_on_hand * item.cost_price for item in products if product_tracks_inventory(item)), 2)
        return render_template(
            "inventory.html",
            page_title="Inventory",
            products=products,
            editing_product=editing_product,
            business_area_options=BUSINESS_AREA_OPTIONS,
            inventory_category_map=category_map,
            inventory_category_groups=category_groups,
            search=q,
            area_filter=area_filter,
            category_filter=category_filter,
            low_stock_count=low_stock_count,
            active_count=active_count,
            service_count=service_count,
            stock_value=stock_value,
            product_image_src=product_image_src,
            product_tracks_inventory=product_tracks_inventory,
            format_product_stock_badge=format_product_stock_badge,
        )

    @app.route("/app/inventory/<product_id>/delete", methods=["POST"])
    @access_required("inventory")
    def inventory_delete(product_id: str):
        product = g.db.get(Product, product_id)
        if not product:
            flash("That inventory item could not be found.", "error")
            return redirect(url_for("inventory"))

        product_name = product.name
        g.db.delete(product)
        audit("inventory", "Inventory", "delete", product_name, product_id)
        g.db.commit()
        flash("Inventory item deleted.", "success")
        return redirect(
            url_for(
                "inventory",
                q=normalize_text(request.form.get("q")),
                area=normalize_text(request.form.get("area")),
                category=normalize_text(request.form.get("category")),
            )
        )

    @app.route("/app/inventory/export.csv")
    @access_required("inventory")
    def inventory_export():
        q = normalize_text(request.args.get("q"))
        area_filter = normalize_text(request.args.get("area"))
        category_filter = normalize_text(request.args.get("category"))
        query = select(Product)
        if area_filter:
            query = query.where(Product.business_area_id == area_filter)
        if category_filter:
            query = query.where(Product.category == category_filter)
        if q:
            like_value = f"%{q}%"
            query = query.where(
                or_(
                    Product.name.ilike(like_value),
                    Product.sku.ilike(like_value),
                    Product.barcode.ilike(like_value),
                    Product.category.ilike(like_value),
                )
            )
        products = g.db.scalars(query.order_by(Product.active.desc(), Product.business_area_id.asc(), Product.name.asc())).all()
        headers, rows = build_inventory_export_rows(products)
        return csv_download(
            f"oneroot-inventory-{date.today().isoformat()}.csv",
            headers,
            rows,
        )

    @app.route("/app/pos")
    @access_required("pos")
    def pos_page():
        order_date = parse_date(request.args.get("date")) or date.today()
        initial_area = normalize_text(request.args.get("area"))
        initial_category = normalize_text(request.args.get("category"))
        initial_search = normalize_text(request.args.get("q"))
        summary = build_pos_counter_summary(order_date, initial_area)
        recent_orders = g.db.scalars(
            select(PosOrder).options(selectinload(PosOrder.lines)).order_by(desc(PosOrder.order_date), desc(PosOrder.updated_at)).limit(20)
        ).all()
        active_products = load_pos_products(
            g.db,
            area_filter=initial_area,
            category_filter=initial_category,
            search=initial_search,
        )
        top_products = active_products[:8]
        pos_category_counts: dict[str, int] = defaultdict(int)
        for product in active_products:
            category = normalize_text(product.category)
            if category:
                pos_category_counts[category] += 1
        return render_template(
            "pos.html",
            page_title="POS",
            top_products=top_products,
            recent_orders=recent_orders,
            payment_methods=PAYMENT_METHODS,
            business_area_options=pos_business_area_options(),
            pos_categories=[
                {"name": name, "count": count}
                for name, count in sorted(pos_category_counts.items(), key=lambda item: (-item[1], item[0]))
            ],
            today_iso=order_date.isoformat(),
            counter_summary=summary,
            initial_area=initial_area,
            initial_category=initial_category,
            initial_search=initial_search,
        )

    @app.route("/app/pos/<order_id>/receipt")
    @access_required("pos")
    def pos_receipt(order_id: str):
        order = g.db.scalar(
            select(PosOrder)
            .options(selectinload(PosOrder.lines))
            .where(PosOrder.id == order_id)
        )
        if not order:
            flash("That POS order could not be found.", "error")
            return redirect(url_for("pos_page"))
        line_items = [
            {
                "name": line.name,
                "category": line.category,
                "quantity": parse_amount(line.quantity),
                "unitPrice": parse_amount(line.unit_price),
                "totalAmount": parse_amount(line.total_amount),
                "businessAreaLabel": BUSINESS_AREA_SHORT.get(line.business_area_id, line.business_area_id),
            }
            for line in order.lines
        ]
        return render_template(
            "pos_receipt.html",
            page_title=f"POS Receipt - {order.order_number}",
            back_url=url_for("pos_page"),
            order={
                "orderNumber": order.order_number,
                "orderDate": order.order_date.isoformat(),
                "paymentMethod": normalize_text(order.payment_method) or "Unspecified",
                "customerName": normalize_text(order.customer_name) or "Walk-in Customer",
                "customerPhone": normalize_text(order.customer_phone),
                "notes": normalize_text(order.notes),
                "itemCount": parse_amount(order.item_count),
                "totalAmount": parse_amount(order.total_amount),
                "createdAt": order.created_at.isoformat(),
                "updatedAt": order.updated_at.isoformat(),
            },
            line_items=line_items,
            generated_on=date.today().isoformat(),
        )

    @app.route("/app/api/pos/products")
    @access_required("pos", api=True)
    def pos_products_api():
        q = normalize_text(request.args.get("q"))
        area = normalize_text(request.args.get("area"))
        category = normalize_text(request.args.get("category"))
        products = load_pos_products(
            g.db,
            area_filter=area,
            category_filter=category,
            search=q,
        )[:60]
        return jsonify(
            {
                "ok": True,
                "products": [
                    {
                        "id": product.id,
                        "name": product.name,
                        "sku": product.sku,
                        "barcode": product.barcode,
                        "businessAreaId": product.business_area_id,
                        "businessAreaLabel": BUSINESS_AREA_SHORT.get(product.business_area_id, product.business_area_id),
                        "category": product.category,
                        "salesPrice": product.sales_price,
                        "quantityOnHand": product.quantity_on_hand,
                        "trackInventory": product_tracks_inventory(product),
                        "itemType": normalized_product_item_type(product.item_type, product.track_inventory),
                        "stockLabel": format_product_stock_badge(product),
                        "imageUrl": product_image_src(product),
                    }
                    for product in products
                ],
            }
        )

    @app.route("/app/api/pos/summary")
    @access_required("pos", api=True)
    def pos_summary_api():
        order_date = parse_date(request.args.get("orderDate")) or date.today()
        area_id = normalize_text(request.args.get("area"))
        return jsonify({"ok": True, "summary": build_pos_counter_summary(order_date, area_id)})

    @app.route("/app/api/pos/orders", methods=["POST"])
    @access_required("pos", api=True)
    def pos_create_order():
        payload = request.get_json(silent=True) or {}
        order_date = parse_date(payload.get("orderDate")) or date.today()
        payment_method = normalize_text(payload.get("paymentMethod")) or "Cash"
        items = payload.get("items") if isinstance(payload.get("items"), list) else []
        if not items:
            return jsonify({"ok": False, "error": "Add at least one item."}), 400

        product_ids = [normalize_text(item.get("productId")) for item in items if normalize_text(item.get("productId"))]
        products = {
            product.id: product
            for product in g.db.scalars(select(Product).where(Product.id.in_(product_ids))).all()
        }
        if len(products) != len(set(product_ids)):
            return jsonify({"ok": False, "error": "One or more items could not be found."}), 400

        order_id = uuid4().hex
        order_number = f"POS-{order_date.strftime('%Y%m%d')}-{order_id[:4].upper()}"
        order = PosOrder(
            id=order_id,
            order_number=order_number,
            order_date=order_date,
            business_area_ids=[],
            primary_business_area_id="",
            payment_method=payment_method,
            customer_name=normalize_text(payload.get("customerName")),
            customer_phone=normalize_text(payload.get("customerPhone")),
            notes=normalize_text(payload.get("notes")),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

        subtotal = 0.0
        item_count = 0.0
        area_ids = []
        for position, item in enumerate(items, start=1):
            product = products[normalize_text(item.get("productId"))]
            quantity = max(parse_amount(item.get("quantity")), 1.0)
            unit_price = parse_amount(item.get("unitPrice")) or product.sales_price
            unit_cost = parse_amount(product.cost_price)
            cost_amount = round(quantity * unit_cost, 2)
            line_total = round(quantity * unit_price, 2)
            line_tracks_inventory = product_tracks_inventory(product)
            line = PosOrderLine(
                id=f"{order_id}:{position}",
                position=position,
                product_id=product.id,
                business_area_id=product.business_area_id,
                sku=product.sku,
                barcode=product.barcode,
                name=product.name,
                category=product.category,
                item_type=normalized_product_item_type(product.item_type, product.track_inventory),
                track_inventory=line_tracks_inventory,
                quantity=quantity,
                unit_price=unit_price,
                unit_cost=unit_cost,
                cost_amount=cost_amount,
                total_amount=line_total,
            )
            order.lines.append(line)
            subtotal += line_total
            item_count += quantity
            if product.business_area_id:
                area_ids.append(product.business_area_id)
            if line_tracks_inventory:
                product.quantity_on_hand = round(product.quantity_on_hand - quantity, 2)
                product.updated_at = datetime.utcnow()

        order.business_area_ids = sorted(set(area_ids))
        order.primary_business_area_id = order.business_area_ids[0] if order.business_area_ids else ""
        order.subtotal = round(subtotal, 2)
        order.total_amount = round(subtotal, 2)
        order.item_count = round(item_count, 2)
        g.db.add(order)
        g.db.flush()
        sync_generated_sales_for_pos(order_date, order.business_area_ids)
        sync_existing_pos_closeouts(order_date, order.business_area_ids)
        audit("pos", "POS", "create", f"{order.order_number} saved", order.id, f"{order.item_count:g} items · {format_currency(order.total_amount)}")
        g.db.commit()
        saved_order = {
            "id": order.id,
            "orderNumber": order.order_number,
            "orderDate": order.order_date.isoformat(),
            "paymentMethod": order.payment_method,
            "customerName": order.customer_name,
            "itemCount": order.item_count,
            "totalAmount": order.total_amount,
            "businessAreaIds": list(order.business_area_ids or []),
            "receiptUrl": url_for("pos_receipt", order_id=order.id),
        }
        return jsonify(
            {
                "ok": True,
                "orderNumber": order.order_number,
                "totalAmount": order.total_amount,
                "itemCount": order.item_count,
                "order": saved_order,
                "summary": build_pos_counter_summary(order_date, ""),
            }
        )

    @app.route("/app/api/pos/orders/<order_id>", methods=["DELETE"])
    @access_required("pos", api=True)
    def pos_delete_order(order_id: str):
        order = g.db.scalar(
            select(PosOrder)
            .options(selectinload(PosOrder.lines))
            .where(PosOrder.id == order_id)
        )
        if not order:
            return jsonify({"ok": False, "error": "That POS order could not be found."}), 404

        affected_area_ids = {normalize_text(area_id) for area_id in (order.business_area_ids or []) if normalize_text(area_id)}
        affected_area_ids.update(
            normalize_text(line.business_area_id)
            for line in order.lines
            if normalize_text(line.business_area_id)
        )
        order_number = normalize_text(order.order_number)
        customer_name = normalize_text(order.customer_name) or "Walk-in"
        total_amount = round(parse_amount(order.total_amount), 2)
        item_count = round(parse_amount(order.item_count), 2)
        order_date = order.order_date

        for line in order.lines:
            if not line.track_inventory:
                continue
            product = g.db.get(Product, line.product_id)
            if not product:
                continue
            product.quantity_on_hand = round(parse_amount(product.quantity_on_hand) + parse_amount(line.quantity), 2)
            product.updated_at = datetime.utcnow()

        g.db.delete(order)
        g.db.flush()

        sync_generated_sales_for_pos(order_date, sorted(affected_area_ids))
        sync_existing_pos_closeouts(order_date, sorted(affected_area_ids))
        audit(
            "pos",
            "POS",
            "delete",
            order_number or "POS Order",
            order_id,
            f"{customer_name} · {item_count:g} items removed · {format_currency(total_amount)}",
        )
        g.db.commit()
        return jsonify(
            {
                "ok": True,
                "deleted": {
                    "id": order_id,
                    "orderNumber": order_number,
                    "orderDate": order_date.isoformat(),
                    "itemCount": item_count,
                    "totalAmount": total_amount,
                },
            }
        )

    @app.route("/app/api/pos/closeout", methods=["POST"])
    @access_required("pos", api=True)
    def pos_closeout_api():
        payload = request.get_json(silent=True) or {}
        order_date = parse_date(payload.get("orderDate")) or date.today()
        area_id = normalize_text(payload.get("areaId"))
        summary = build_pos_counter_summary(order_date, area_id)
        if summary["orderCount"] <= 0:
            return jsonify({"ok": False, "error": "No POS orders are available for this date and area."}), 400

        reference = f"pos-closeout|{summary['orderDate']}|{area_id or 'all'}"
        record = g.db.scalar(
            select(ModuleRecord).where(
                ModuleRecord.module_key == "pos_closeouts",
                ModuleRecord.reference == reference,
            )
        )
        is_existing = record is not None
        closeout_payload = {
            "id": record.id if record else uuid4().hex,
            "orderDate": summary["orderDate"],
            "areaId": area_id,
            "areaLabel": summary["areaLabel"],
            "reference": reference,
            "status": "closed",
            "totalAmount": summary["totalAmount"],
            "orderCount": summary["orderCount"],
            "itemCount": summary["itemCount"],
            "dailySalesLedgerTotal": summary["dailySalesLedgerTotal"],
            "paymentMix": summary["paymentMix"],
            "orderNumbers": [order["orderNumber"] for order in summary["orders"]],
            "closedAt": datetime.utcnow().isoformat(),
            "closedBy": g.current_user.full_name or g.current_user.username,
            "notes": normalize_text(payload.get("notes")) or f"Counter closeout for {summary['areaLabel']} on {summary['orderDate']}.",
        }
        if not record:
            record = ModuleRecord(
                id=closeout_payload["id"],
                module_key="pos_closeouts",
                created_at=datetime.utcnow(),
            )
            g.db.add(record)
        set_module_record_metadata(record, MODULES["pos_closeouts"], closeout_payload)
        audit(
            "pos_closeouts",
            "POS Counter Closeouts",
            "update" if is_existing else "create",
            closeout_payload["areaLabel"],
            record.id,
            f"{summary['orderCount']} orders · {format_currency(summary['totalAmount'])}",
        )
        g.db.commit()
        return jsonify({"ok": True, "closeout": closeout_payload, "summary": build_pos_counter_summary(order_date, area_id)})

    @app.route("/app/audit")
    @access_required("audit")
    def audit_page():
        audits = g.db.scalars(select(AuditLog).order_by(desc(AuditLog.created_at)).limit(250)).all()
        return render_template("audit.html", page_title="Audit Trail", audits=audits)

    def current_static_asset_version() -> str:
        static_dir = Path(app.static_folder or "")
        version_parts: list[str] = []
        for asset_name in ("app.css", "app.js"):
            asset_path = static_dir / asset_name
            if asset_path.exists():
                version_parts.append(str(int(asset_path.stat().st_mtime)))
        return "-".join(version_parts) or str(int(time.time()))

    @app.context_processor
    def inject_common():
        current_user = getattr(g, "current_user", None)
        return {
            "current_user": current_user,
            "current_access_keys": user_access_keys(current_user),
            "attendance_widget": build_attendance_widget(current_user),
            "sidebar_items": build_sidebar(current_user),
            "module_definitions": MODULES,
            "normalize_role_key": normalize_role_key,
            "user_role_label": role_label,
            "user_role_labels": USER_ROLE_LABELS,
            "staff_role_label": staff_role_label,
            "staff_role_labels": STAFF_WORK_ROLE_LABELS,
            "static_asset_version": current_static_asset_version(),
        }

    return app
