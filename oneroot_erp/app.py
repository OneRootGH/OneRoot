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
from urllib.parse import quote
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
    STAFF_ROLE_DESCRIPTIONS,
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
SERVICE_LINE_ITEMS_KEY = "lineItems"
# Food Sales on the POS ribbon should reflect kitchen trading only:
# online food orders, direct kitchen checkout, and manual OneRoot Kitchen sales.
POS_FOOD_SALES_AREA_IDS = {"kitchen"}
POS_LAUNDRY_SALES_AREA_IDS = {"laundry-services"}
POS_EQUIPMENT_SALES_AREA_IDS = {"water-equipment"}
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
POS_CASH_PAYMENT_METHODS = {"cash", "cash on delivery"}
INVENTORY_EXPIRY_SOON_DAYS = 30
MOBILE_MONEY_STARTUP_PROFILES = {
    "MTN Mobile Money": {
        "simPurchaseCost": 3000.0,
        "openingCash": 900.0,
        "openingECash": 1040.0,
        "cashTopUpSource": "Opening startup float",
        "eCashTopUpSource": "Opening startup float",
    }
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
ICONIFY_API_BASE = "https://api.iconify.design"
PUBLIC_JOB_VACANCY_STATUSES = {
    status for status, _label in JOB_VACANCY_STATUSES if status not in {"Draft", "Filled", "Closed"}
}
KITCHEN_MENU_SOURCE_ID = "oneroot-kitchen-menu"
KITCHEN_MENU_PRODUCTS = [
    {
        "id": "kitchen-main-jollof-regular",
        "name": "Jollof Rice - Regular Serve",
        "category": "Main Meals",
        "salesPrice": 10.0,
        "notes": "Starting kitchen price for one regular serve.",
    },
    {
        "id": "kitchen-main-jollof-large",
        "name": "Jollof Rice - Large Serve",
        "category": "Main Meals",
        "salesPrice": 15.0,
        "notes": "Larger portion. Add Takeaway Pack if it should be packed to go.",
    },
    {
        "id": "kitchen-addon-takeaway-pack",
        "name": "Takeaway Pack",
        "category": "Packaging & Add-ons",
        "salesPrice": 3.0,
        "notes": "Use this add-on when the meal should be packed for takeaway.",
    },
    {
        "id": "kitchen-main-plain-rice-stew",
        "name": "Plain Rice With Stew",
        "category": "Main Meals",
        "salesPrice": 10.0,
        "notes": "Starting kitchen price for one plate.",
    },
    {
        "id": "kitchen-main-fried-rice",
        "name": "Fried Rice",
        "category": "Main Meals",
        "salesPrice": 25.0,
        "notes": "Starting kitchen price for one plate.",
    },
    {
        "id": "kitchen-main-banku-soup",
        "name": "Banku With Soup",
        "category": "Main Meals",
        "salesPrice": 5.0,
        "notes": "Price is per ball. Increase quantity to match the number of balls needed.",
    },
    {
        "id": "kitchen-main-banku-stew",
        "name": "Banku With Stew",
        "category": "Main Meals",
        "salesPrice": 5.0,
        "notes": "Price is per ball. Increase quantity to match the number of balls needed.",
    },
    {
        "id": "kitchen-main-spaghetti-indomie",
        "name": "Spaghetti / Indomie",
        "category": "Main Meals",
        "salesPrice": 20.0,
        "notes": "Starting kitchen price for one plate.",
    },
    {
        "id": "kitchen-protein-chicken-thigh-regular",
        "name": "Fried Chicken - Thigh (Regular)",
        "category": "Proteins & Extras",
        "salesPrice": 10.0,
        "notes": "Regular portion.",
    },
    {
        "id": "kitchen-protein-chicken-thigh-large",
        "name": "Fried Chicken - Thigh (Large)",
        "category": "Proteins & Extras",
        "salesPrice": 15.0,
        "notes": "Large portion.",
    },
    {
        "id": "kitchen-protein-chicken-drumstick-regular",
        "name": "Fried Chicken - Drumstick (Regular)",
        "category": "Proteins & Extras",
        "salesPrice": 10.0,
        "notes": "Regular portion.",
    },
    {
        "id": "kitchen-protein-chicken-drumstick-large",
        "name": "Fried Chicken - Drumstick (Large)",
        "category": "Proteins & Extras",
        "salesPrice": 15.0,
        "notes": "Large portion.",
    },
    {
        "id": "kitchen-protein-chicken-back-regular",
        "name": "Fried Chicken - Back (Regular)",
        "category": "Proteins & Extras",
        "salesPrice": 7.0,
        "notes": "Regular portion.",
    },
    {
        "id": "kitchen-protein-chicken-back-large",
        "name": "Fried Chicken - Back (Large)",
        "category": "Proteins & Extras",
        "salesPrice": 10.0,
        "notes": "Large portion.",
    },
    {
        "id": "kitchen-protein-fried-fish-small",
        "name": "Fried Fish (Small)",
        "category": "Proteins & Extras",
        "salesPrice": 5.0,
        "notes": "Starting size. Add quantity or leave a note if you need a larger piece.",
    },
    {
        "id": "kitchen-protein-fried-fish-medium",
        "name": "Fried Fish (Medium)",
        "category": "Proteins & Extras",
        "salesPrice": 10.0,
        "notes": "Medium size. Staff can confirm larger pieces if needed.",
    },
    {
        "id": "kitchen-protein-chicken-wings-soup",
        "name": "Chicken Wings In Soup",
        "category": "Proteins & Extras",
        "salesPrice": 10.0,
        "notes": "Per serving.",
    },
    {
        "id": "kitchen-protein-cow-strips",
        "name": "Cow Strips",
        "category": "Proteins & Extras",
        "salesPrice": 5.0,
        "notes": "Starting kitchen price for one add-on portion.",
    },
    {
        "id": "kitchen-protein-sausage",
        "name": "Sausage",
        "category": "Proteins & Extras",
        "salesPrice": 3.0,
        "notes": "Price is per piece.",
    },
    {
        "id": "kitchen-protein-boiled-egg",
        "name": "Boiled Egg",
        "category": "Proteins & Extras",
        "salesPrice": 3.0,
        "notes": "Price is per egg.",
    },
    {
        "id": "kitchen-side-fried-yam",
        "name": "Fried Yam",
        "category": "Sides",
        "salesPrice": 5.0,
        "notes": "Starting kitchen price for one side portion.",
    },
    {
        "id": "kitchen-drink-voltic-water",
        "name": "Voltic Water",
        "category": "Drinks",
        "salesPrice": 5.0,
        "notes": "Bottle water.",
    },
    {
        "id": "kitchen-drink-bel-aqua-water",
        "name": "Bel-Aqua Water",
        "category": "Drinks",
        "salesPrice": 4.0,
        "notes": "Bottle water.",
    },
    {
        "id": "kitchen-drink-coca-cola",
        "name": "Coca-Cola",
        "category": "Drinks",
        "salesPrice": 6.0,
        "notes": "Cold drink.",
    },
    {
        "id": "kitchen-drink-bel-cola",
        "name": "Bel Cola",
        "category": "Drinks",
        "salesPrice": 4.0,
        "notes": "Cold drink.",
    },
    {
        "id": "kitchen-drink-bigoo-cola",
        "name": "Bigoo Cola",
        "category": "Drinks",
        "salesPrice": 4.0,
        "notes": "Cold drink.",
    },
    {
        "id": "kitchen-drink-bigoo-apple",
        "name": "Bigoo Apple",
        "category": "Drinks",
        "salesPrice": 4.0,
        "notes": "Cold drink.",
    },
    {
        "id": "kitchen-drink-bigoo-orange",
        "name": "Bigoo Orange",
        "category": "Drinks",
        "salesPrice": 4.0,
        "notes": "Cold drink.",
    },
    {
        "id": "kitchen-drink-bigoo-cocktail",
        "name": "Bigoo Cocktail",
        "category": "Drinks",
        "salesPrice": 4.0,
        "notes": "Cold drink.",
    },
    {
        "id": "kitchen-drink-bel-squeeze",
        "name": "Bel Squeeze",
        "category": "Drinks",
        "salesPrice": 11.0,
        "notes": "Fruit drink.",
    },
    {
        "id": "kitchen-drink-bel-malt",
        "name": "Bel Malt",
        "category": "Drinks",
        "salesPrice": 8.0,
        "notes": "Malt drink.",
    },
    {
        "id": "kitchen-drink-malta-guinness",
        "name": "Malta Guinness",
        "category": "Drinks",
        "salesPrice": 15.0,
        "notes": "Malt drink.",
    },
    {
        "id": "kitchen-drink-kiki-cocktail",
        "name": "Kiki Cocktail",
        "category": "Drinks",
        "salesPrice": 4.0,
        "notes": "Cold drink.",
    },
    {
        "id": "kitchen-drink-voltic-cool",
        "name": "Voltic Cool",
        "category": "Drinks",
        "salesPrice": 0.5,
        "notes": "Sachet water.",
    },
]


def default_job_vacancy_apply_text(app_config: AppConfig) -> str:
    return (
        "Apply through the OneRoot vacancies page or send your CV and a short application message "
        f"by WhatsApp to {app_config.whatsapp_number} or {app_config.support_phone}. "
        f"You can also email {app_config.support_email}."
    )


def build_default_job_vacancies(app_config: AppConfig) -> list[dict[str, Any]]:
    common_vacancy = {
        "vacancyStatus": "Open",
        "employmentType": "Full-Time",
        "openings": 1,
        "salaryRange": "",
        "contactPerson": "OneRoot Essentials Recruitment",
        "applicationPhone": app_config.whatsapp_number,
        "applicationEmail": app_config.support_email,
        "applicationLink": "",
        "howToApply": default_job_vacancy_apply_text(app_config),
    }
    return [
        {
            **common_vacancy,
            "reference": "vacancy-business-manager-operations-lead",
            "displayOrder": 1,
            "businessAreaId": "shared-operations",
            "jobTitle": "Business Manager & Operations Lead",
            "staffRole": "Business Manager & Operations Lead",
            "location": "On-site at OneRoot Essentials",
            "workingHours": "Full-time with oversight across business hours, including peak and weekend support when needed.",
            "summary": "Lead OneRoot Essentials and supervise day-to-day operations across sales, services, staff, stock, customer experience, and business growth.",
            "keyResponsibilities": "\n".join(
                [
                    "Supervise all business areas and daily operations.",
                    "Review sales, service performance, cash control, and stock movement.",
                    "Lead staff, assign priorities, and resolve escalated customer or team issues.",
                    "Enforce operating controls, reporting discipline, and service standards.",
                    "Drive growth, efficiency, and profitability across the business.",
                ]
            ),
            "requirements": "\n".join(
                [
                    "Strong leadership and business supervision experience.",
                    "Good financial awareness and decision-making ability.",
                    "Confidence managing staff and fast-moving operations.",
                    "Ability to use business systems, reports, and daily controls well.",
                ]
            ),
        },
        {
            **common_vacancy,
            "reference": "vacancy-finance-hr-payroll-officer",
            "displayOrder": 2,
            "businessAreaId": "shared-operations",
            "jobTitle": "Finance, HR & Payroll Officer",
            "staffRole": "Finance, HR & Payroll Officer",
            "location": "On-site at OneRoot Essentials",
            "workingHours": "Full-time, mostly office-based with regular reporting and payroll support deadlines.",
            "summary": "Manage expense records, payroll support, attendance-linked administration, reconciliations, and core staff documentation.",
            "keyResponsibilities": "\n".join(
                [
                    "Maintain expense records, petty cash, cashbook, and bankbook entries.",
                    "Support payroll preparation using attendance and salary records.",
                    "Manage staff files, onboarding support, leave tracking, and vacancy administration.",
                    "Review financial entries from business areas and prepare summaries for management.",
                    "Help enforce documentation standards, internal controls, and timely reporting.",
                ]
            ),
            "requirements": "\n".join(
                [
                    "Background in accounting, finance, administration, or HR support.",
                    "Strong attention to detail and recordkeeping discipline.",
                    "High level of confidentiality, honesty, and accountability.",
                    "Confidence using spreadsheets or business systems accurately.",
                ]
            ),
        },
        {
            **common_vacancy,
            "reference": "vacancy-front-desk-service-desk-officer",
            "displayOrder": 3,
            "businessAreaId": "shared-operations",
            "jobTitle": "Front Desk / Service Desk Officer",
            "staffRole": "Front Desk / Service Desk Officer",
            "location": "On-site at OneRoot Essentials",
            "workingHours": "Full-time or shift-based, including busy counter periods and weekends where scheduled.",
            "summary": "Serve as the main customer-facing desk officer for counter sales, laundry intake, equipment rental requests, receipts, and payment capture.",
            "keyResponsibilities": "\n".join(
                [
                    "Handle walk-in POS checkout and issue receipts accurately.",
                    "Receive laundry jobs and equipment rental bookings from customers.",
                    "Calculate charges, capture payments, and update service status correctly.",
                    "Support pickup, return, and customer follow-up from the front desk.",
                    "Keep the service desk tidy, fast, and customer-friendly at all times.",
                ]
            ),
            "requirements": "\n".join(
                [
                    "Good customer service and communication skills.",
                    "Honesty, confidence handling cash and digital payments, and good numeracy.",
                    "Ability to work quickly and accurately in a busy service environment.",
                    "Comfort using POS or service-entry systems is an advantage.",
                ]
            ),
        },
        {
            **common_vacancy,
            "reference": "vacancy-stock-dispatch-officer",
            "displayOrder": 4,
            "businessAreaId": "shared-operations",
            "jobTitle": "Stock & Dispatch Officer",
            "staffRole": "Stock & Dispatch Officer",
            "location": "On-site at OneRoot Essentials",
            "workingHours": "Full-time with support during stock counts, order peaks, and dispatch windows.",
            "summary": "Keep stock accurate and coordinate order preparation and handover for delivery and pickup.",
            "keyResponsibilities": "\n".join(
                [
                    "Update stock quantities and keep product records accurate.",
                    "Receive items, track stock movement, and monitor expiry or damaged stock.",
                    "Prepare customer orders for dispatch and coordinate handover timing.",
                    "Support barcode-based stock updates and inventory control.",
                    "Flag low stock, stock errors, and fulfillment issues early.",
                ]
            ),
            "requirements": "\n".join(
                [
                    "Inventory or store support experience is an advantage.",
                    "Strong attention to detail and counting accuracy.",
                    "Ability to organize stock well and work with delivery preparation.",
                    "Willingness to support physical stock handling where needed.",
                ]
            ),
        },
        {
            **common_vacancy,
            "reference": "vacancy-crm-marketing-support-officer",
            "displayOrder": 5,
            "businessAreaId": "shared-operations",
            "jobTitle": "CRM, Marketing & Support Officer",
            "staffRole": "CRM, Marketing & Support Officer",
            "location": "On-site at OneRoot Essentials",
            "workingHours": "Full-time with campaign follow-up and customer support across business hours.",
            "summary": "Grow repeat sales through customer follow-up, WhatsApp promotions, campaign support, and shared operational assistance.",
            "keyResponsibilities": "\n".join(
                [
                    "Maintain customer records and follow up on leads or inactive customers.",
                    "Support promotions, WhatsApp campaigns, and customer reactivation efforts.",
                    "Track campaign response and help improve repeat business.",
                    "Assist with customer complaint follow-up and service communication.",
                    "Provide general support for shared operational tasks when needed.",
                ]
            ),
            "requirements": "\n".join(
                [
                    "Strong communication and follow-up discipline.",
                    "Basic marketing, sales support, or customer engagement experience.",
                    "Creativity, consistency, and willingness to support different teams.",
                    "Comfort using WhatsApp, spreadsheets, or business systems for outreach.",
                ]
            ),
        },
        {
            **common_vacancy,
            "reference": "vacancy-mobile-money-agent",
            "displayOrder": 6,
            "businessAreaId": "mobile-money",
            "jobTitle": "Mobile Money Agent",
            "staffRole": "Mobile Money Agent",
            "location": "On-site at OneRoot Essentials",
            "workingHours": "Full-time or shift-based during mobile money service hours.",
            "summary": "Run MTN Mobile Money services and manage e-cash, physical cash, float movement, and daily reconciliation carefully.",
            "keyResponsibilities": "\n".join(
                [
                    "Handle cash-in, cash-out, transfers, top-ups, and other mobile money services.",
                    "Record each transaction correctly and track fees or commissions earned.",
                    "Manage opening and closing cash, e-cash, and float movement accurately.",
                    "Complete daily reconciliation and report any variance immediately.",
                    "Serve customers quickly while keeping strong fraud and cash controls.",
                ]
            ),
            "requirements": "\n".join(
                [
                    "High level of trustworthiness and cash-handling discipline.",
                    "Good numeracy, speed, and accuracy under pressure.",
                    "Prior mobile money experience is an advantage.",
                    "Ability to keep transaction records clean and fully accountable.",
                ]
            ),
        },
        {
            **common_vacancy,
            "reference": "vacancy-kitchen-staff",
            "displayOrder": 7,
            "businessAreaId": "kitchen",
            "jobTitle": "Kitchen Staff",
            "staffRole": "Kitchen Staff",
            "location": "On-site at OneRoot Essentials",
            "workingHours": "Shift-based, especially around meal rush periods and customer peak hours.",
            "summary": "Prepare, portion, and package food for OneRoot Kitchen while maintaining hygiene and fast order fulfillment.",
            "keyResponsibilities": "\n".join(
                [
                    "Prepare meals to standard and support quick food order fulfillment.",
                    "Portion and package food correctly for walk-in and online customers.",
                    "Maintain cleanliness, hygiene, and ingredient handling standards.",
                    "Support kitchen workflow during peak periods and reduce waste.",
                    "Keep the kitchen ready for smooth service throughout the day.",
                ]
            ),
            "requirements": "\n".join(
                [
                    "Food preparation experience is preferred.",
                    "Cleanliness, speed, and strong teamwork.",
                    "Ability to work well during busy meal periods.",
                    "Willingness to follow kitchen standards and portion control.",
                ]
            ),
        },
        {
            **common_vacancy,
            "reference": "vacancy-delivery-rider",
            "displayOrder": 8,
            "businessAreaId": "shared-operations",
            "jobTitle": "Delivery Rider",
            "staffRole": "Delivery Rider",
            "location": "Field-based from OneRoot Essentials",
            "workingHours": "Shift-based and demand-based, including peak delivery periods.",
            "summary": "Deliver customer orders safely, quickly, and professionally while representing OneRoot Essentials well in the field.",
            "keyResponsibilities": "\n".join(
                [
                    "Pick up assigned deliveries and confirm order details before leaving.",
                    "Deliver to customers safely and on time.",
                    "Collect or confirm payment where required and record proof of handover.",
                    "Communicate delivery delays or customer issues promptly.",
                    "Represent the OneRoot brand well during every delivery trip.",
                ]
            ),
            "requirements": "\n".join(
                [
                    "Reliable riding ability and good route knowledge.",
                    "Punctuality, responsibility, and strong customer manners.",
                    "Ability to handle orders with care and follow delivery instructions.",
                    "Comfort working during busy or changing delivery schedules.",
                ]
            ),
        },
    ]


def ensure_default_job_vacancies(db_session, app_config: AppConfig) -> None:
    definition = MODULES.get("job_vacancies")
    if not definition:
        return

    existing_records = db_session.scalars(
        select(ModuleRecord)
        .where(ModuleRecord.module_key == "job_vacancies")
        .order_by(desc(ModuleRecord.updated_at), desc(ModuleRecord.created_at))
    ).all()
    records_by_reference = {
        normalize_text(record.reference): record
        for record in existing_records
        if normalize_text(record.reference)
    }
    today_iso = date.today().isoformat()
    excluded_titles = {
        "apartment manager",
        "apartment & tenant relations officer",
    }

    for existing_record in existing_records:
        payload = dict(existing_record.payload or {})
        title_key = normalize_text(payload.get("jobTitle") or existing_record.title).lower()
        role_key = normalize_text(payload.get("staffRole")).lower()
        if title_key not in excluded_titles and role_key not in excluded_titles:
            continue
        if normalize_text(payload.get("vacancyStatus")) == "Closed":
            continue
        payload["vacancyStatus"] = "Closed"
        apply_module_record_metadata(existing_record, definition, payload)

    for seed in build_default_job_vacancies(app_config):
        reference = normalize_text(seed.get("reference"))
        if not reference:
            continue
        record = records_by_reference.get(reference)
        payload = dict(record.payload or {}) if record else {}
        payload_changed = False
        created_at = record.created_at if record else datetime.utcnow()
        payload_defaults = {
            "id": record.id if record else uuid4().hex,
            "createdAt": normalize_text(payload.get("createdAt")) or created_at.isoformat(),
            "postedDate": today_iso,
            **seed,
        }
        for key, value in payload_defaults.items():
            if key == "id":
                if not normalize_text(payload.get("id")):
                    payload["id"] = value
                    payload_changed = True
                continue
            current_value = payload.get(key)
            if isinstance(value, (int, float)):
                if current_value in (None, ""):
                    payload[key] = value
                    payload_changed = True
                continue
            if not normalize_text(current_value):
                payload[key] = value
                payload_changed = True
        payload["updatedAt"] = normalize_text(payload.get("updatedAt")) or datetime.utcnow().isoformat()
        if not record:
            record = ModuleRecord(
                id=payload["id"],
                module_key="job_vacancies",
                created_at=created_at,
            )
            db_session.add(record)
            payload_changed = True
        if payload_changed:
            apply_module_record_metadata(record, definition, payload)


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
    if "products" in table_names and "expiry_date" not in product_columns:
        statements.append("ALTER TABLE products ADD COLUMN expiry_date DATE")
    user_columns = set()
    if "app_users" in table_names:
        user_columns = {column["name"] for column in inspector.get_columns("app_users")}
    if "app_users" in table_names and "staff_role" not in user_columns:
        statements.append("ALTER TABLE app_users ADD COLUMN staff_role VARCHAR(100) DEFAULT ''")
    if "audit_logs" in table_names and engine.dialect.name == "postgresql":
        audit_columns = {column["name"]: column for column in inspector.get_columns("audit_logs")}
        record_id_column = audit_columns.get("record_id")
        record_id_length = getattr(record_id_column.get("type"), "length", None) if record_id_column else None
        if record_id_column and record_id_length and record_id_length < 255:
            statements.append("ALTER TABLE audit_logs ALTER COLUMN record_id TYPE VARCHAR(255)")
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
                sync_kitchen_menu_catalog(bootstrap_session)
                reclassify_legacy_inventory_products(bootstrap_session)
                normalize_product_catalog(bootstrap_session)
                backfill_pos_line_costs(bootstrap_session)
                ensure_default_job_vacancies(bootstrap_session, app_config)
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


LEGACY_SHARED_OPERATION_STOCK_NAMES = {
    "bine hand wash multipurpose",
    "topco big multipurpose soap",
    "topco jumbo multipurpose soap",
    "viva plus multipurpose soap",
}
LEGACY_SHARED_OPERATION_STOCK_SOURCE_CATEGORIES = {"household items"}
LEGACY_SHARED_OPERATION_SERVICE_NAMES = {"tip", "gift card"}


def reclassify_legacy_inventory_products(db_session) -> bool:
    changed = False
    shared_operation_products = db_session.scalars(
        select(Product).where(Product.business_area_id == "shared-operations")
    ).all()
    for product in shared_operation_products:
        name_key = normalize_text(product.name).lower()
        source_category_key = normalize_text(product.source_category).lower()
        category_key = normalize_text(product.category).lower()
        product_changed = False

        if name_key in LEGACY_SHARED_OPERATION_STOCK_NAMES or (
            source_category_key in LEGACY_SHARED_OPERATION_STOCK_SOURCE_CATEGORIES
            and category_key == "service charges"
        ):
            if normalize_text(product.business_area_id) != "cold-store-groceries":
                product.business_area_id = "cold-store-groceries"
                product_changed = True
            if normalize_text(product.category) != "Household & Cleaning":
                product.category = "Household & Cleaning"
                product_changed = True
            if normalize_text(product.source_category) != "Household & Cleaning":
                product.source_category = "Household & Cleaning"
                product_changed = True
            if normalize_text(product.item_type) != "stock":
                product.item_type = "stock"
                product_changed = True
        elif name_key in LEGACY_SHARED_OPERATION_SERVICE_NAMES:
            expected_category = "Gift Cards" if name_key == "gift card" else "Service Charges"
            if normalize_text(product.category) != expected_category:
                product.category = expected_category
                product_changed = True
            if normalize_text(product.item_type) != "service":
                product.item_type = "service"
                product_changed = True

        if product_changed:
            product.updated_at = datetime.utcnow()
            product.sku = generate_auto_product_sku(
                product_id=product.id,
                name=product.name,
                business_area_id=product.business_area_id,
                category=product.category,
            )
            normalize_product_record(product)
            changed = True
    return changed


def find_inventory_product(db_session, lookup_value: Any) -> Product | None:
    clean_lookup = normalize_text(lookup_value)
    if not clean_lookup:
        return None
    direct_match = db_session.get(Product, clean_lookup)
    if direct_match:
        return direct_match
    for condition in (
        Product.source_catalog_id.ilike(clean_lookup),
        Product.sku.ilike(clean_lookup),
        Product.barcode.ilike(clean_lookup),
        Product.name.ilike(clean_lookup),
    ):
        match = db_session.scalar(select(Product).where(condition))
        if match:
            return match
    return None


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


def product_expiry_date_value(item_or_payload: Product | dict[str, Any]) -> date | None:
    if isinstance(item_or_payload, Product):
        raw_value = item_or_payload.expiry_date
    else:
        raw_value = item_or_payload.get("expiryDate", item_or_payload.get("expiry_date"))
    if isinstance(raw_value, date):
        return raw_value
    return parse_date(raw_value)


def product_expiry_status(item_or_payload: Product | dict[str, Any], today_value: date | None = None) -> dict[str, Any]:
    today_key = today_value or date.today()
    expiry_value = product_expiry_date_value(item_or_payload)
    if not expiry_value:
        return {
            "expiryDate": None,
            "label": "No Expiry",
            "tone": "muted",
            "daysLeft": None,
            "isExpired": False,
            "isExpiringSoon": False,
            "discardNow": False,
        }

    days_left = (expiry_value - today_key).days
    if days_left < 0:
        return {
            "expiryDate": expiry_value,
            "label": "Expired - Discard",
            "tone": "danger",
            "daysLeft": days_left,
            "isExpired": True,
            "isExpiringSoon": False,
            "discardNow": True,
        }
    if days_left <= INVENTORY_EXPIRY_SOON_DAYS:
        return {
            "expiryDate": expiry_value,
            "label": "Expiring Soon",
            "tone": "warning",
            "daysLeft": days_left,
            "isExpired": False,
            "isExpiringSoon": True,
            "discardNow": False,
        }
    return {
        "expiryDate": expiry_value,
        "label": "Fresh",
        "tone": "ok",
        "daysLeft": days_left,
        "isExpired": False,
        "isExpiringSoon": False,
        "discardNow": False,
    }


def product_matches_expiry_filter(item_or_payload: Product | dict[str, Any], expiry_filter: str, today_value: date | None = None) -> bool:
    clean_filter = normalize_text(expiry_filter).lower()
    if not clean_filter:
        return True
    expiry_meta = product_expiry_status(item_or_payload, today_value)
    if clean_filter == "expired":
        return expiry_meta["isExpired"]
    if clean_filter == "expiring-soon":
        return expiry_meta["isExpiringSoon"]
    if clean_filter == "fresh":
        return bool(expiry_meta["expiryDate"]) and not expiry_meta["isExpired"] and not expiry_meta["isExpiringSoon"]
    if clean_filter == "no-expiry":
        return expiry_meta["expiryDate"] is None
    return True


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


def pos_cash_sales_total(payment_mix: dict[str, Any]) -> float:
    return round(
        sum(
            parse_amount(amount)
            for label, amount in (payment_mix or {}).items()
            if normalize_text(label).lower() in POS_CASH_PAYMENT_METHODS
        ),
        2,
    )


def pos_expected_closing_cash(opening_cash: Any, cash_sales_total: Any) -> float:
    return round(parse_amount(opening_cash) + parse_amount(cash_sales_total), 2)


def pos_cash_variance(opening_cash: Any, closing_cash_counted: Any, cash_sales_total: Any) -> float:
    return round(parse_amount(closing_cash_counted) - pos_expected_closing_cash(opening_cash, cash_sales_total), 2)


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


def iconify_svg_url(icon_name: str, *, color: str = "", width: int = 320, height: int = 240) -> str:
    query_parts = [f"width={max(int(width), 64)}", f"height={max(int(height), 64)}"]
    if normalize_text(color):
        query_parts.append(f"color={quote(normalize_text(color), safe='')}")
    return f"{ICONIFY_API_BASE}/{quote(icon_name, safe=':-')}.svg?{'&'.join(query_parts)}"


def mapped_online_product_image(name: str, category: str, area_id: str, item_type: str = "") -> str:
    text_blob = " ".join(
        value.lower()
        for value in (
            normalize_text(name),
            normalize_text(category),
            normalize_text(area_id),
            normalize_text(item_type),
        )
        if normalize_text(value)
    )
    if not text_blob:
        return ""

    if "sim" in text_blob:
        return iconify_svg_url("material-symbols-light:sim-card-outline", color="#12803b")
    if any(keyword in text_blob for keyword in ("momo", "mobile money", "wallet", "ewallet", "top-up", "top - up", "cash in", "cash out", "transfer")):
        return iconify_svg_url("flat-color-icons:money-transfer", width=288, height=216)

    if "wheelbarrow" in text_blob:
        return iconify_svg_url("game-icons:wheelbarrow", color="#2f6ea8")
    if any(keyword in text_blob for keyword in ("drill", "impact")):
        return iconify_svg_url("game-icons:drill", color="#2f6ea8")
    if any(keyword in text_blob for keyword in ("shovel", "head pan", "headpan", "nails", "concrete", "cutting machine", "cutter", "vibrator", "equipment rental")):
        return iconify_svg_url("fa6-solid:trowel", color="#2f6ea8")
    if "water" in text_blob and area_id == "water-equipment":
        return iconify_svg_url("fa6-solid:bottle-water", color="#2f6ea8")

    if any(keyword in text_blob for keyword in ("shirt", "dress", "trouser", "suit", "jacket", "t-shirt", "t shirt", "clothes", "garment")):
        return iconify_svg_url("game-icons:shirt", color="#5f6fd8")
    if area_id == "laundry-services" or any(
        keyword in text_blob
        for keyword in (
            "laundry",
            "washing",
            "bedsheet",
            "blanket",
            "duvet",
            "pillow",
            "curtain",
            "carpet",
            "rug",
            "shoe",
            "bag",
            "towel",
            "mattress",
        )
    ):
        return iconify_svg_url("streamline-freehand-color:laundry-washing-machine", width=288, height=216)
    if area_id == "kitchen" and any(
        keyword in text_blob
        for keyword in ("jollof", "rice", "banku", "stew", "soup", "spaghetti", "indomie", "yam", "meal", "takeaway")
    ):
        return iconify_svg_url("noto:pot-of-food", width=288, height=216)

    if any(keyword in text_blob for keyword in ("baby", "diaper", "wipes")):
        return iconify_svg_url("fxemoji:babybottle", width=288, height=216)
    if any(keyword in text_blob for keyword in ("fish", "meat", "gizzard", "sausage", "sausages", "chicken", "protein", "frozen")):
        return iconify_svg_url("fa-solid:fish", color="#1f6b5b")
    if any(keyword in text_blob for keyword in ("ice cream", "ice-cream", "frozen treats")):
        return iconify_svg_url("fa-solid:ice-cream", color="#ca5d27")
    if any(keyword in text_blob for keyword in ("bread", "groceries", "pantry", "groundnut", "shea butter", "oil", "rice", "sugar", "salt", "milk", "cereal")):
        return iconify_svg_url("game-icons:bread", color="#1f6b5b")
    if any(keyword in text_blob for keyword in ("drink", "refreshment", "water", "sobolo", "juice", "voltic", "beverage", "bottle")):
        return iconify_svg_url("fa6-solid:bottle-water", color="#2f6ea8")
    if any(keyword in text_blob for keyword in ("soap", "clean", "detergent", "bleach", "tissue", "sanitary", "personal care", "household")):
        return iconify_svg_url("fa-solid:soap", color="#1f6b5b")
    if any(keyword in text_blob for keyword in ("school", "stationery", "pen", "pencil", "exercise book", "book")):
        return iconify_svg_url("material-symbols:school-outline", color="#50606f")
    if any(keyword in text_blob for keyword in ("gift card", "gift")):
        return iconify_svg_url("tabler:gift-card-filled", color="#8e5d23")
    if area_id == "kitchen":
        return iconify_svg_url("game-icons:bread", color="#8e5d23")
    if area_id == "fresh-foods-drinks":
        return iconify_svg_url("fa6-solid:bottle-water", color="#ca5d27")

    return ""


def product_image_src(item_or_payload: Product | dict[str, Any]) -> str:
    if isinstance(item_or_payload, Product):
        image_url = normalize_text(item_or_payload.image_url)
        product_id = item_or_payload.id
        name = item_or_payload.name
        category = item_or_payload.category
        area_id = item_or_payload.business_area_id
        item_type = normalize_text(item_or_payload.item_type)
    else:
        image_url = normalize_text(item_or_payload.get("imageUrl") or item_or_payload.get("image_url"))
        product_id = normalize_text(item_or_payload.get("id"))
        name = normalize_text(item_or_payload.get("name"))
        category = normalize_text(item_or_payload.get("category"))
        area_id = normalize_text(item_or_payload.get("businessAreaId") or item_or_payload.get("business_area_id"))
        item_type = normalize_text(item_or_payload.get("itemType") or item_or_payload.get("item_type"))
    if image_url:
        return image_url
    online_image = mapped_online_product_image(name, category, area_id, item_type)
    if online_image:
        return online_image
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
    "mobile-money-transaction": "Mobile Money",
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


def whatsapp_phone_target(value: Any) -> str:
    normalized = normalize_phone(value)
    if normalized.startswith("0") and len(normalized) == 10:
        return f"233{normalized[1:]}"
    return normalized


def whatsapp_chat_url(phone_number: Any, message: str) -> str:
    target = whatsapp_phone_target(phone_number)
    if not target:
        return ""
    return f"https://wa.me/{target}?text={quote(normalize_text(message))}"


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


def normalize_email(value: Any) -> str:
    return normalize_text(value).lower()


def first_non_empty_text(*values: Any) -> str:
    for value in values:
        normalized = normalize_text(value)
        if normalized:
            return normalized
    return ""


def customer_reference_key(name: Any = "", phone: Any = "", email: Any = "") -> str:
    phone_key = normalize_phone(phone)
    if phone_key:
        return f"customer|phone|{phone_key}"
    email_key = normalize_email(email)
    if email_key:
        return f"customer|email|{email_key}"
    name_key = normalize_text(name).lower()
    if name_key:
        return f"customer|name|{name_key.replace(' ', '-')}"
    return ""


def business_area_summary(area_ids: list[str] | set[str] | tuple[str, ...]) -> str:
    clean_ids = [normalize_text(area_id) for area_id in area_ids if normalize_text(area_id)]
    if not clean_ids:
        return ""
    ordered = sorted(set(clean_ids), key=lambda area_id: BUSINESS_AREA_SHORT.get(area_id, area_id))
    return ", ".join(BUSINESS_AREA_SHORT.get(area_id, area_id) for area_id in ordered)


def customer_cross_sell_area(area_id: str) -> str:
    mapping = {
        "cold-store-groceries": "laundry-services",
        "laundry-services": "cold-store-groceries",
        "water-equipment": "kitchen",
        "fresh-foods-drinks": "cold-store-groceries",
        "kitchen": "fresh-foods-drinks",
        "mobile-money": "cold-store-groceries",
        "rentals-apartments": "laundry-services",
    }
    return mapping.get(normalize_text(area_id), "cold-store-groceries")


def customer_offer_copy(area_id: str) -> str:
    offers = {
        "cold-store-groceries": "weekly grocery restock offers and family essentials bundles",
        "laundry-services": "pickup laundry offers for busy households and tenants",
        "water-equipment": "water delivery and equipment support follow-up for homes and work sites",
        "fresh-foods-drinks": "fast-moving drinks, frozen treats, and quick refreshment bundles",
        "kitchen": "prepared meals, soups, and family kitchen packs",
        "mobile-money": "mobile money support and convenience transaction follow-up",
        "rentals-apartments": "tenant service bundles covering laundry, groceries, and support follow-up",
    }
    return offers.get(normalize_text(area_id), "OneRoot essentials bundles across daily needs")


def marketing_lead_source(values: set[str]) -> str:
    priority = [
        "Referral",
        "Website",
        "Online Order",
        "WhatsApp",
        "Social Media",
        "POS",
        "Walk-in",
        "Apartment",
        "Laundry",
        "Equipment Rental",
    ]
    for label in priority:
        if label in values:
            return label
    return sorted(values)[0] if values else "Walk-in"


def build_customer_growth_message(snapshot: dict[str, Any], *, support_phone: str = "") -> str:
    customer_name = first_non_empty_text(snapshot.get("customerName"), "Customer")
    action_tag = normalize_text(snapshot.get("automationTag"))
    top_area_label = BUSINESS_AREA_SHORT.get(normalize_text(snapshot.get("topAreaId")), "OneRoot")
    offer_copy = customer_offer_copy(snapshot.get("recommendedAreaId") or snapshot.get("topAreaId"))
    support_line = f" Please call {support_phone} if you want us to help quickly." if normalize_text(support_phone) else ""
    if action_tag == "pending-order":
        return (
            f"Hello {customer_name}, this is OneRoot Essentials following up on your recent {top_area_label} request. "
            f"We are ready to help you complete the order whenever you are ready.{support_line}"
        )
    if action_tag == "new-lead":
        return (
            f"Hello {customer_name}, welcome to OneRoot Essentials. "
            f"We would be glad to help you with {offer_copy}. "
            f"Reply here and our team will support your first order or enquiry.{support_line}"
        )
    if action_tag == "win-back":
        return (
            f"Hello {customer_name}, we miss serving you at OneRoot Essentials. "
            f"We currently have support available for {offer_copy}. "
            f"Reply here if you would like us to help you place another order.{support_line}"
        )
    if action_tag == "cross-sell":
        return (
            f"Hello {customer_name}, thank you for choosing OneRoot Essentials for {top_area_label}. "
            f"We can also help with {offer_copy}. "
            f"Reply here if you want us to prepare an offer for you.{support_line}"
        )
    if action_tag == "vip-care":
        return (
            f"Hello {customer_name}, thank you for being one of OneRoot Essentials' valued customers. "
            f"Our team is ready to support your next {top_area_label} order quickly.{support_line}"
        )
    return (
        f"Hello {customer_name}, this is OneRoot Essentials checking in. "
        f"We are available to support you with {offer_copy}.{support_line}"
    )


def build_customer_activity_snapshots(db_session) -> list[dict[str, Any]]:
    snapshots: dict[str, dict[str, Any]] = {}

    def ensure_bucket(
        *,
        name: Any = "",
        phone: Any = "",
        email: Any = "",
        record_date: date | None = None,
    ) -> dict[str, Any] | None:
        reference = customer_reference_key(name, phone, email)
        if not reference:
            return None
        bucket = snapshots.get(reference)
        if not bucket:
            bucket = {
                "reference": reference,
                "customerName": normalize_text(name),
                "customerPhone": normalize_text(phone),
                "customerEmail": normalize_text(email),
                "preferredContact": "",
                "leadSources": set(),
                "businessAreaIds": set(),
                "areaOrderCount": defaultdict(int),
                "areaRevenue": defaultdict(float),
                "orderCount": 0,
                "paidOrderCount": 0,
                "lifetimeValue": 0.0,
                "pendingValue": 0.0,
                "hasApartmentProfile": False,
                "firstCaptureDate": record_date,
                "lastActivityDate": record_date,
                "lastOrderDate": None,
                "manualStatus": "",
                "manualFollowUpDate": None,
                "manualNotes": "",
                "crmRecordId": "",
                "crmCreatedAt": "",
                "leadSource": "",
                "topAreaId": "",
                "recommendedAreaId": "",
                "recommendedOffer": "",
                "businessAreaSummary": "",
                "automationTag": "",
                "automationLabel": "",
                "daysSinceLastOrder": "",
                "followUpDate": "",
                "status": "Active",
                "customerSegment": "Walk-in",
                "whatsappUrl": "",
                "reminderMessage": "",
                "sortRank": 99,
            }
            snapshots[reference] = bucket
        if normalize_text(name) and len(normalize_text(name)) >= len(normalize_text(bucket.get("customerName"))):
            bucket["customerName"] = normalize_text(name)
        if normalize_text(phone) and not normalize_text(bucket.get("customerPhone")):
            bucket["customerPhone"] = normalize_text(phone)
        if normalize_text(email) and not normalize_text(bucket.get("customerEmail")):
            bucket["customerEmail"] = normalize_text(email)
        if record_date:
            existing_first = bucket.get("firstCaptureDate")
            if not existing_first or record_date < existing_first:
                bucket["firstCaptureDate"] = record_date
            existing_last = bucket.get("lastActivityDate")
            if not existing_last or record_date > existing_last:
                bucket["lastActivityDate"] = record_date
        return bucket

    def register_order_activity(
        *,
        name: Any,
        phone: Any,
        email: Any,
        activity_date: date | None,
        lead_source: str,
        area_ids: list[str] | set[str] | tuple[str, ...],
        revenue_amount: float = 0.0,
        pending_amount: float = 0.0,
        count_order: bool = True,
        count_paid_order: bool = False,
        preferred_contact: str = "",
        apartment_customer: bool = False,
        notes: Any = "",
    ) -> None:
        bucket = ensure_bucket(name=name, phone=phone, email=email, record_date=activity_date)
        if not bucket:
            return
        if lead_source:
            bucket["leadSources"].add(lead_source)
        if preferred_contact and not normalize_text(bucket.get("preferredContact")):
            bucket["preferredContact"] = normalize_text(preferred_contact)
        if apartment_customer:
            bucket["hasApartmentProfile"] = True
        if normalize_text(notes) and not normalize_text(bucket.get("manualNotes")):
            bucket["manualNotes"] = normalize_text(notes)
        clean_area_ids = [normalize_text(area_id) for area_id in area_ids if normalize_text(area_id)]
        for area_id in clean_area_ids:
            bucket["businessAreaIds"].add(area_id)
            if count_order:
                bucket["areaOrderCount"][area_id] += 1
            if revenue_amount > 0:
                bucket["areaRevenue"][area_id] += round(parse_amount(revenue_amount), 2)
        if count_order:
            bucket["orderCount"] += 1
        if count_paid_order:
            bucket["paidOrderCount"] += 1
            bucket["lifetimeValue"] = round(bucket["lifetimeValue"] + parse_amount(revenue_amount), 2)
        if pending_amount > 0:
            bucket["pendingValue"] = round(bucket["pendingValue"] + parse_amount(pending_amount), 2)
        if activity_date:
            if count_order:
                last_order_date = bucket.get("lastOrderDate")
                if not last_order_date or activity_date > last_order_date:
                    bucket["lastOrderDate"] = activity_date

    crm_records = db_session.scalars(
        select(ModuleRecord)
        .where(ModuleRecord.module_key == "customer_crm")
        .order_by(desc(ModuleRecord.updated_at), desc(ModuleRecord.created_at))
    ).all()
    for record in crm_records:
        payload = dict(record.payload or {})
        capture_date = parse_date(payload.get("captureDate")) or record.record_date
        bucket = ensure_bucket(
            name=payload.get("customerName"),
            phone=payload.get("customerPhone"),
            email=payload.get("customerEmail"),
            record_date=capture_date,
        )
        if not bucket:
            continue
        if not bucket["crmRecordId"]:
            bucket["crmRecordId"] = record.id
            bucket["crmCreatedAt"] = normalize_text(payload.get("createdAt")) or record.created_at.isoformat()
        manual_status = normalize_text(payload.get("status"))
        if manual_status in {"Do Not Disturb", "Inactive"}:
            bucket["manualStatus"] = manual_status
        manual_follow_up = parse_date(payload.get("followUpDate"))
        if manual_follow_up and (not bucket["manualFollowUpDate"] or manual_follow_up < bucket["manualFollowUpDate"]):
            bucket["manualFollowUpDate"] = manual_follow_up
        bucket["manualNotes"] = first_non_empty_text(bucket.get("manualNotes"), payload.get("notes"))
        bucket["preferredContact"] = first_non_empty_text(bucket.get("preferredContact"), payload.get("preferredContact"))
        bucket["leadSources"].add(normalize_text(payload.get("leadSource")) or "Walk-in")
        if normalize_text(payload.get("businessAreaId")):
            bucket["businessAreaIds"].add(normalize_text(payload.get("businessAreaId")))

    pos_orders = db_session.scalars(select(PosOrder).order_by(desc(PosOrder.order_date), desc(PosOrder.updated_at))).all()
    for order in pos_orders:
        if not normalize_text(order.customer_name) and not normalize_text(order.customer_phone):
            continue
        register_order_activity(
            name=order.customer_name,
            phone=order.customer_phone,
            email="",
            activity_date=order.order_date,
            lead_source="POS",
            area_ids=order.business_area_ids or [],
            revenue_amount=parse_amount(order.total_amount),
            count_order=True,
            count_paid_order=True,
            preferred_contact="WhatsApp",
        )

    relevant_records = db_session.scalars(
        select(ModuleRecord).where(
            ModuleRecord.module_key.in_(
                [
                    "online_orders",
                    "laundry_tickets",
                    "equipment_rental_bookings",
                    "apartments",
                ]
            )
        )
    ).all()
    for record in relevant_records:
        payload = dict(record.payload or {})
        if record.module_key == "online_orders":
            order_date = parse_date(payload.get("createdAt")) or record.record_date
            payment_status = normalize_text(payload.get("paymentStatus")).lower()
            order_items = payload.get("items") if isinstance(payload.get("items"), list) else []
            quoted_total = parse_amount(payload.get("quotedTotal"))
            if quoted_total <= 0:
                quoted_total = round(
                    sum(
                        (
                            parse_amount(item.get("lineTotal"))
                            or round(max(parse_amount(item.get("quantity")), 1.0) * parse_amount(item.get("unitPrice")), 2)
                        )
                        for item in order_items
                    ),
                    2,
                )
            paid_amount = parse_amount(payload.get("paidAmount"))
            register_order_activity(
                name=payload.get("customerName"),
                phone=payload.get("customerPhone"),
                email=payload.get("customerEmail"),
                activity_date=order_date,
                lead_source="Online Order",
                area_ids=payload.get("businessAreaIds") if isinstance(payload.get("businessAreaIds"), list) else [],
                revenue_amount=paid_amount if payment_status == "paid" and paid_amount > 0 else 0.0,
                pending_amount=0.0 if payment_status == "paid" else quoted_total,
                count_order=True,
                count_paid_order=payment_status == "paid" and paid_amount > 0,
                preferred_contact="WhatsApp",
                notes=payload.get("orderNotes"),
            )
            continue
        if record.module_key == "laundry_tickets":
            payment_summary = service_payment_summary(record.module_key, payload)
            register_order_activity(
                name=payload.get("customerName"),
                phone=payload.get("customerPhone"),
                email="",
                activity_date=parse_date(payload.get("ticketDate")) or record.record_date,
                lead_source="Laundry",
                area_ids=[normalize_text(payload.get("businessAreaId")) or "laundry-services"],
                revenue_amount=payment_summary["paidTotal"],
                pending_amount=payment_summary["balance"],
                count_order=parse_amount(payload.get("amountDue")) > 0,
                count_paid_order=payment_summary["paidTotal"] > 0,
                preferred_contact="WhatsApp",
                notes=payload.get("notes"),
            )
            continue
        if record.module_key == "equipment_rental_bookings":
            payment_summary = service_payment_summary(record.module_key, payload)
            register_order_activity(
                name=payload.get("customerName"),
                phone=payload.get("customerPhone"),
                email="",
                activity_date=parse_date(payload.get("bookingDate")) or record.record_date,
                lead_source="Equipment Rental",
                area_ids=[normalize_text(payload.get("businessAreaId")) or "water-equipment"],
                revenue_amount=payment_summary["paidTotal"],
                pending_amount=payment_summary["balance"],
                count_order=parse_amount(payload.get("rentalFee")) > 0,
                count_paid_order=payment_summary["paidTotal"] > 0,
                preferred_contact="WhatsApp",
                notes=payload.get("notes"),
            )
            continue
        if record.module_key == "apartments":
            register_order_activity(
                name=payload.get("tenantName"),
                phone=payload.get("tenantPhone"),
                email=payload.get("tenantEmail"),
                activity_date=parse_date(payload.get("moveInDate")) or parse_date(payload.get("leaseStartDate")) or record.record_date,
                lead_source="Apartment",
                area_ids=["rentals-apartments"],
                count_order=False,
                preferred_contact="WhatsApp",
                apartment_customer=True,
                notes=payload.get("notes"),
            )

    today = date.today()
    finalized: list[dict[str, Any]] = []
    for bucket in snapshots.values():
        lead_source = marketing_lead_source(bucket["leadSources"])
        top_area_id = ""
        if bucket["areaRevenue"]:
            top_area_id = max(
                bucket["areaRevenue"].items(),
                key=lambda item: (parse_amount(item[1]), bucket["areaOrderCount"].get(item[0], 0), item[0]),
            )[0]
        elif bucket["areaOrderCount"]:
            top_area_id = max(bucket["areaOrderCount"].items(), key=lambda item: (item[1], item[0]))[0]
        elif bucket["businessAreaIds"]:
            top_area_id = sorted(bucket["businessAreaIds"])[0]

        days_since_last_order = ""
        if bucket["lastOrderDate"]:
            days_since_last_order = (today - bucket["lastOrderDate"]).days

        segment = "Walk-in"
        if bucket["hasApartmentProfile"]:
            segment = "Apartment Tenant"
        elif bucket["paidOrderCount"] == 0:
            segment = "Lead"
        elif bucket["paidOrderCount"] >= 6 or bucket["lifetimeValue"] >= 1500:
            segment = "VIP"
        elif days_since_last_order != "" and days_since_last_order >= 45:
            segment = "Dormant"
        elif bucket["paidOrderCount"] >= 2:
            segment = "Repeat"
        elif len(bucket["businessAreaIds"]) >= 3:
            segment = "Community Account"

        status = bucket["manualStatus"] or "Active"
        automation_tag = "check-in"
        automation_label = "Check in"
        follow_up_date = bucket["manualFollowUpDate"]
        if status != "Do Not Disturb":
            if bucket["pendingValue"] > 0:
                status = "Follow Up"
                automation_tag = "pending-order"
                automation_label = "Complete pending order"
                follow_up_date = follow_up_date or today
            elif bucket["paidOrderCount"] == 0:
                status = "Follow Up"
                automation_tag = "new-lead"
                automation_label = "Welcome new lead"
                follow_up_date = follow_up_date or min((bucket["firstCaptureDate"] or today) + timedelta(days=1), today + timedelta(days=2))
            elif days_since_last_order != "" and days_since_last_order >= 45:
                status = "Follow Up"
                automation_tag = "win-back"
                automation_label = "Win back dormant customer"
                follow_up_date = follow_up_date or today
            elif segment == "VIP" and days_since_last_order != "" and days_since_last_order >= 14:
                status = "Follow Up"
                automation_tag = "vip-care"
                automation_label = "VIP care follow-up"
                follow_up_date = follow_up_date or (today + timedelta(days=1))
            elif bucket["paidOrderCount"] >= 2 and len(bucket["businessAreaIds"]) == 1:
                status = "Follow Up"
                automation_tag = "cross-sell"
                automation_label = "Cross-sell another service"
                follow_up_date = follow_up_date or (today + timedelta(days=2))

        recommended_area_id = customer_cross_sell_area(top_area_id) if top_area_id else ""
        reminder_message = build_customer_growth_message(
            {
                **bucket,
                "topAreaId": top_area_id,
                "recommendedAreaId": recommended_area_id,
                "automationTag": automation_tag,
            }
        )
        whatsapp_url = whatsapp_chat_url(bucket.get("customerPhone"), reminder_message) if bucket.get("customerPhone") else ""
        business_summary = business_area_summary(bucket["businessAreaIds"])
        finalized.append(
            {
                **bucket,
                "leadSource": lead_source,
                "topAreaId": top_area_id,
                "recommendedAreaId": recommended_area_id,
                "recommendedOffer": customer_offer_copy(recommended_area_id or top_area_id),
                "businessAreaSummary": business_summary,
                "automationTag": automation_tag,
                "automationLabel": automation_label,
                "followUpDate": follow_up_date.isoformat() if follow_up_date else "",
                "status": status,
                "customerSegment": segment,
                "daysSinceLastOrder": days_since_last_order,
                "whatsappUrl": whatsapp_url,
                "reminderMessage": reminder_message,
                "sortRank": {
                    "pending-order": 1,
                    "new-lead": 2,
                    "win-back": 3,
                    "cross-sell": 4,
                    "vip-care": 5,
                    "check-in": 6,
                }.get(automation_tag, 9),
            }
        )

    finalized.sort(
        key=lambda item: (
            item.get("sortRank", 99),
            normalize_text(item.get("followUpDate")) or "9999-12-31",
            -(parse_amount(item.get("lifetimeValue"))),
            normalize_text(item.get("customerName")),
        )
    )
    return finalized


def sync_customer_crm_automation(db_session) -> None:
    existing_records = db_session.scalars(select(ModuleRecord).where(ModuleRecord.module_key == "customer_crm")).all()
    record_by_reference = {normalize_text(record.reference): record for record in existing_records if normalize_text(record.reference)}
    seen_references: set[str] = set()

    for snapshot in build_customer_activity_snapshots(db_session):
        reference = normalize_text(snapshot.get("reference"))
        if not reference:
            continue
        seen_references.add(reference)
        record = record_by_reference.get(reference)
        payload = dict(record.payload or {}) if record else {}
        payload.update(
            {
                "id": payload.get("id") or (record.id if record else uuid4().hex),
                "captureDate": normalize_text(payload.get("captureDate"))
                or (snapshot.get("firstCaptureDate").isoformat() if snapshot.get("firstCaptureDate") else date.today().isoformat()),
                "businessAreaId": normalize_text(payload.get("businessAreaId")) or normalize_text(snapshot.get("topAreaId")) or "shared-operations",
                "customerName": snapshot.get("customerName"),
                "customerPhone": snapshot.get("customerPhone"),
                "customerEmail": snapshot.get("customerEmail"),
                "customerSegment": snapshot.get("customerSegment"),
                "leadSource": snapshot.get("leadSource"),
                "preferredContact": first_non_empty_text(snapshot.get("preferredContact"), "WhatsApp" if snapshot.get("customerPhone") else "Email"),
                "lastOrderDate": snapshot.get("lastOrderDate").isoformat() if snapshot.get("lastOrderDate") else "",
                "followUpDate": snapshot.get("followUpDate"),
                "lifetimeValue": round(parse_amount(snapshot.get("lifetimeValue")), 2),
                "status": snapshot.get("status"),
                "notes": first_non_empty_text(
                    payload.get("notes"),
                    snapshot.get("manualNotes"),
                    f"Auto-updated from OneRoot activity. Focus: {snapshot.get('automationLabel')}."
                    if snapshot.get("automationLabel")
                    else "Auto-updated from OneRoot activity.",
                ),
                "orderCount": int(snapshot.get("orderCount", 0)),
                "paidOrderCount": int(snapshot.get("paidOrderCount", 0)),
                "pendingValue": round(parse_amount(snapshot.get("pendingValue")), 2),
                "businessAreaSummary": snapshot.get("businessAreaSummary"),
                "recommendedOffer": snapshot.get("recommendedOffer"),
                "automationTag": snapshot.get("automationTag"),
                "automationLabel": snapshot.get("automationLabel"),
                "daysSinceLastOrder": snapshot.get("daysSinceLastOrder"),
                "whatsappUrl": snapshot.get("whatsappUrl"),
                "reminderMessage": snapshot.get("reminderMessage"),
            }
        )
        if not record:
            record = ModuleRecord(
                id=payload["id"],
                module_key="customer_crm",
                created_at=datetime.utcnow(),
            )
            db_session.add(record)
        set_module_record_metadata(record, MODULES["customer_crm"], payload)

    for record in existing_records:
        reference = normalize_text(record.reference)
        if not reference:
            continue
        if reference in seen_references:
            continue
        payload = dict(record.payload or {})
        if normalize_text(payload.get("status")) == "Do Not Disturb":
            continue
        payload["status"] = normalize_text(payload.get("status")) or "Inactive"
        set_module_record_metadata(record, MODULES["customer_crm"], payload)


def build_growth_automation_context(db_session, *, area_filter: str = "") -> dict[str, Any]:
    crm_records = db_session.scalars(
        select(ModuleRecord)
        .where(ModuleRecord.module_key == "customer_crm")
        .order_by(desc(ModuleRecord.updated_at), desc(ModuleRecord.created_at))
    ).all()
    if area_filter:
        crm_records = [
            record
            for record in crm_records
            if normalize_text((record.payload or {}).get("businessAreaId")) == normalize_text(area_filter)
            or normalize_text(area_filter) in normalize_text((record.payload or {}).get("businessAreaSummary"))
        ]

    follow_up_rows: list[dict[str, Any]] = []
    segment_counts: dict[str, int] = defaultdict(int)
    source_counts: dict[str, int] = defaultdict(int)
    active_promo_count = 0
    ready_campaign_count = 0
    sent_campaign_count = 0
    for record in crm_records:
        payload = dict(record.payload or {})
        segment = normalize_text(payload.get("customerSegment")) or "Walk-in"
        source = normalize_text(payload.get("leadSource")) or "Walk-in"
        segment_counts[segment] += 1
        source_counts[source] += 1
        follow_up_rows.append(
            {
                "id": record.id,
                "customerName": normalize_text(payload.get("customerName")) or record.title or "Customer",
                "customerPhone": normalize_text(payload.get("customerPhone")),
                "customerSegment": segment,
                "status": normalize_text(payload.get("status")) or "Active",
                "leadSource": source,
                "followUpDate": normalize_text(payload.get("followUpDate")),
                "automationLabel": normalize_text(payload.get("automationLabel")) or "Check in",
                "automationTag": normalize_text(payload.get("automationTag")) or "check-in",
                "lifetimeValue": parse_amount(payload.get("lifetimeValue")),
                "pendingValue": parse_amount(payload.get("pendingValue")),
                "orderCount": int(parse_amount(payload.get("orderCount"))),
                "paidOrderCount": int(parse_amount(payload.get("paidOrderCount"))),
                "businessAreaSummary": normalize_text(payload.get("businessAreaSummary")),
                "recommendedOffer": normalize_text(payload.get("recommendedOffer")),
                "whatsappUrl": normalize_text(payload.get("whatsappUrl")),
            }
        )

    promotion_records = db_session.scalars(select(ModuleRecord).where(ModuleRecord.module_key == "promotions")).all()
    for record in promotion_records:
        if area_filter and normalize_text((record.payload or {}).get("businessAreaId")) != normalize_text(area_filter):
            continue
        if normalize_text((record.payload or {}).get("status")) in {"Running", "Scheduled"}:
            active_promo_count += 1

    campaign_records = db_session.scalars(select(ModuleRecord).where(ModuleRecord.module_key == "whatsapp_campaigns")).all()
    for record in campaign_records:
        if area_filter and normalize_text((record.payload or {}).get("businessAreaId")) != normalize_text(area_filter):
            continue
        status = normalize_text((record.payload or {}).get("status"))
        if status == "Ready":
            ready_campaign_count += 1
        elif status == "Sent":
            sent_campaign_count += 1

    follow_up_rows.sort(
        key=lambda item: (
            {
                "pending-order": 1,
                "new-lead": 2,
                "win-back": 3,
                "cross-sell": 4,
                "vip-care": 5,
            }.get(item["automationTag"], 9),
            item["followUpDate"] or "9999-12-31",
            -(item["lifetimeValue"]),
            item["customerName"],
        )
    )
    counts = {
        "contacts": len(crm_records),
        "newLeads": sum(1 for item in follow_up_rows if item["automationTag"] == "new-lead"),
        "pendingOrders": sum(1 for item in follow_up_rows if item["automationTag"] == "pending-order"),
        "winBack": sum(1 for item in follow_up_rows if item["automationTag"] == "win-back"),
        "crossSell": sum(1 for item in follow_up_rows if item["automationTag"] == "cross-sell"),
        "vip": sum(1 for item in follow_up_rows if item["customerSegment"] == "VIP"),
        "whatsappReady": sum(1 for item in follow_up_rows if item["whatsappUrl"]),
        "activePromotions": active_promo_count,
        "readyCampaigns": ready_campaign_count,
        "sentCampaigns": sent_campaign_count,
    }
    playbooks = []
    if counts["newLeads"] > 0:
        playbooks.append(
            {
                "title": "Welcome New Leads",
                "audience": f"{counts['newLeads']} fresh lead(s)",
                "note": "Use WhatsApp or a quick call within 24 hours so first-time prospects do not go cold.",
                "href": url_for("module_form", module_key="whatsapp_campaigns"),
            }
        )
    if counts["winBack"] > 0:
        playbooks.append(
            {
                "title": "Win Back Dormant Customers",
                "audience": f"{counts['winBack']} dormant customer(s)",
                "note": "Offer a simple restock, laundry pickup, or fresh-food follow-up to bring them back.",
                "href": url_for("module_form", module_key="promotions"),
            }
        )
    if counts["crossSell"] > 0:
        playbooks.append(
            {
                "title": "Cross-Sell The Ecosystem",
                "audience": f"{counts['crossSell']} one-area customer(s)",
                "note": "Move customers from one OneRoot service into a second one to deepen repeat buying.",
                "href": url_for("module_list", module_key="customer_crm"),
            }
        )
    if counts["vip"] > 0:
        playbooks.append(
            {
                "title": "VIP Retention Touch",
                "audience": f"{counts['vip']} VIP customer(s)",
                "note": "Give priority support, appreciation messages, and bundle offers to keep your best customers close.",
                "href": url_for("module_form", module_key="whatsapp_campaigns"),
            }
        )

    segment_chart = build_chart_rows(
        [{"label": key, "short": key, "amount": value} for key, value in sorted(segment_counts.items()) if value > 0],
        label_key="label",
        value_key="amount",
        short_key="short",
        positive_color="var(--accent)",
    )
    source_chart = build_chart_rows(
        [{"label": key, "short": key, "amount": value} for key, value in sorted(source_counts.items()) if value > 0],
        label_key="label",
        value_key="amount",
        short_key="short",
        positive_color="var(--warning)",
    )
    return {
        "counts": counts,
        "followUps": follow_up_rows[:12],
        "playbooks": playbooks[:4],
        "segmentChart": segment_chart,
        "sourceChart": source_chart,
    }


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


def sync_kitchen_menu_catalog(db_session) -> None:
    for seed in KITCHEN_MENU_PRODUCTS:
        product = db_session.get(Product, seed["id"])
        is_new = product is None
        if not product:
            product = Product(id=seed["id"], created_at=datetime.utcnow())
            db_session.add(product)

        if product.user_created and not is_new:
            normalize_product_record(product)
            continue

        product.source_catalog_id = KITCHEN_MENU_SOURCE_ID
        product.name = normalize_text(seed["name"])
        product.business_area_id = "kitchen"
        product.category = normalize_text(seed["category"]) or "Kitchen"
        product.source_category = "OneRoot Kitchen Menu"
        product.item_type = "service"
        product.track_inventory = False
        product.quantity_on_hand = 0
        product.quantity_known = False
        product.min_stock_level = 0
        product.sales_price = round(parse_amount(seed.get("salesPrice")), 2)
        product.cost_price = round(parse_amount(seed.get("costPrice")), 2)
        product.notes = normalize_text(seed.get("notes"))
        product.active = True if is_new else bool(product.active)
        product.user_created = False
        product.updated_at = datetime.utcnow()
        normalize_product_record(product)


def service_item_field_name(module_key: str) -> str:
    return SERVICE_ITEM_FIELD_MAP.get(module_key, "item")


def service_cost_field_name(module_key: str) -> str:
    return SERVICE_COST_FIELD_MAP.get(module_key, "costAmount")


def service_total_due(module_key: str, payload: dict[str, Any]) -> float:
    line_items = service_line_items(module_key, payload)
    if line_items:
        return round(sum(parse_amount(item.get("lineTotal")) for item in line_items), 2)
    if module_key == "laundry_tickets":
        return round(parse_amount(payload.get("amountDue")), 2)
    if module_key == "equipment_rental_bookings":
        return round(parse_amount(payload.get("rentalFee")) + parse_amount(payload.get("damageCharge")), 2)
    return 0.0


def service_cost_amount(module_key: str, payload: dict[str, Any]) -> float:
    line_items = service_line_items(module_key, payload)
    if line_items:
        return round(sum(parse_amount(item.get("lineCost")) for item in line_items), 2)
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


def service_line_items(module_key: str, payload: dict[str, Any]) -> list[dict[str, Any]]:
    raw_items = payload.get(SERVICE_LINE_ITEMS_KEY) if isinstance(payload.get(SERVICE_LINE_ITEMS_KEY), list) else []
    normalized_items: list[dict[str, Any]] = []
    rental_days = equipment_rental_days(payload) if module_key == "equipment_rental_bookings" else 1
    service_area = SERVICE_MODULE_AREA_IDS.get(module_key, "")

    for raw_item in raw_items:
        if not isinstance(raw_item, dict):
            continue
        item_name = normalize_text(
            raw_item.get("name")
            or raw_item.get("item")
            or raw_item.get("laundryItem")
            or raw_item.get("equipmentItem")
        )
        if not item_name:
            continue
        quantity = max(int(round(parse_amount(raw_item.get("quantity") or raw_item.get("pieces") or 1))), 1)
        unit_price = round(parse_amount(raw_item.get("unitPrice") or raw_item.get("salesPrice")), 2)
        cost_price = round(parse_amount(raw_item.get("costPrice")), 2)
        days = max(int(round(parse_amount(raw_item.get("rentalDays") or rental_days or 1))), 1)
        line_total = round(parse_amount(raw_item.get("lineTotal")), 2)
        line_cost = round(parse_amount(raw_item.get("lineCost") or raw_item.get("costAmount")), 2)
        if line_total <= 0 and unit_price > 0:
            line_total = round(unit_price * quantity * (days if module_key == "equipment_rental_bookings" else 1), 2)
        if line_cost <= 0 and cost_price > 0:
            line_cost = round(cost_price * quantity * (days if module_key == "equipment_rental_bookings" else 1), 2)
        category_value = normalize_text(raw_item.get("category"))
        image_url = normalize_text(raw_item.get("imageUrl")) or product_image_src(
            {
                "name": item_name,
                "category": category_value,
                "businessAreaId": service_area or normalize_text(payload.get("businessAreaId")),
                "itemType": "service",
            }
        )
        normalized_items.append(
            {
                "name": item_name,
                "category": category_value,
                "quantity": quantity,
                "unitPrice": unit_price,
                "costPrice": cost_price,
                "rentalDays": days if module_key == "equipment_rental_bookings" else 1,
                "lineTotal": line_total,
                "lineCost": line_cost,
                "imageUrl": image_url,
            }
        )

    if normalized_items:
        return normalized_items

    if module_key == "laundry_tickets":
        item_name = normalize_text(payload.get("laundryItem")) or normalize_text(payload.get("itemSummary"))
        if not item_name:
            return []
        quantity = laundry_piece_count(payload)
        total_due = round(parse_amount(payload.get("amountDue")), 2)
        total_cost = round(parse_amount(payload.get("costAmount")), 2)
        divisor = quantity if quantity > 0 else 1
        return [
            {
                "name": item_name,
                "category": normalize_text(payload.get("serviceCategory")),
                "quantity": quantity,
                "unitPrice": round(total_due / divisor, 2) if total_due > 0 else 0.0,
                "costPrice": round(total_cost / divisor, 2) if total_cost > 0 else 0.0,
                "rentalDays": 1,
                "lineTotal": total_due,
                "lineCost": total_cost,
                "imageUrl": product_image_src(
                    {
                        "name": item_name,
                        "category": normalize_text(payload.get("serviceCategory")),
                        "businessAreaId": "laundry-services",
                        "itemType": "service",
                    }
                ),
            }
        ]

    if module_key == "equipment_rental_bookings":
        item_name = normalize_text(payload.get("equipmentItem"))
        if not item_name:
            return []
        quantity = max(int(round(parse_amount(payload.get("itemQuantityTotal") or 1))), 1)
        days = rental_days
        total_due = round(parse_amount(payload.get("rentalFee")), 2)
        total_cost = round(parse_amount(payload.get("costAmount")), 2)
        divisor = max(quantity * days, 1)
        return [
            {
                "name": item_name,
                "category": normalize_text(payload.get("equipmentCategory")),
                "quantity": quantity,
                "unitPrice": round(total_due / divisor, 2) if total_due > 0 else 0.0,
                "costPrice": round(total_cost / divisor, 2) if total_cost > 0 else 0.0,
                "rentalDays": days,
                "lineTotal": total_due,
                "lineCost": total_cost,
                "imageUrl": product_image_src(
                    {
                        "name": item_name,
                        "category": normalize_text(payload.get("equipmentCategory")),
                        "businessAreaId": "water-equipment",
                        "itemType": "service",
                    }
                ),
            }
        ]

    return []


def service_line_items_brief(module_key: str, payload: dict[str, Any], *, max_items: int = 2) -> str:
    items = service_line_items(module_key, payload)
    if not items:
        return "No items selected"
    visible_items = items[:max_items]
    parts = [
        f"{item['quantity']} x {item['name']}"
        if module_key == "laundry_tickets"
        else f"{item['quantity']} x {item['name']}"
        for item in visible_items
    ]
    if len(items) > max_items:
        parts.append(f"+{len(items) - max_items} more")
    return ", ".join(parts)


def sync_service_line_item_rollup(module_key: str, payload: dict[str, Any]) -> None:
    items = service_line_items(module_key, payload)
    if not items:
        payload.pop(SERVICE_LINE_ITEMS_KEY, None)
        return

    payload[SERVICE_LINE_ITEMS_KEY] = items
    categories = [normalize_text(item.get("category")) for item in items if normalize_text(item.get("category"))]

    if module_key == "laundry_tickets":
        payload["pieces"] = sum(max(int(parse_amount(item.get("quantity"))), 0) for item in items) or 1
        payload["amountDue"] = round(sum(parse_amount(item.get("lineTotal")) for item in items), 2)
        payload["costAmount"] = round(sum(parse_amount(item.get("lineCost")) for item in items), 2)
        payload["laundryItem"] = (
            items[0]["name"]
            if len(items) == 1
            else f"{items[0]['name']} (+{len(items) - 1} more)"
        )
        payload["serviceCategory"] = categories[0] if len(set(categories)) == 1 and categories else "Mixed Items"
        return

    if module_key == "equipment_rental_bookings":
        rental_days = equipment_rental_days(payload)
        payload["rentalDays"] = rental_days
        payload["itemQuantityTotal"] = sum(max(int(parse_amount(item.get("quantity"))), 0) for item in items) or 1
        payload["rentalFee"] = round(sum(parse_amount(item.get("lineTotal")) for item in items), 2)
        payload["costAmount"] = round(sum(parse_amount(item.get("lineCost")) for item in items), 2)
        payload["equipmentItem"] = (
            items[0]["name"]
            if len(items) == 1
            else f"{items[0]['name']} (+{len(items) - 1} more)"
        )
        payload["equipmentCategory"] = categories[0] if len(set(categories)) == 1 and categories else "Mixed Equipment"


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
    line_items = service_line_items(module_key, payload)
    if line_items:
        products = service_reference_products(db_session, module_key)
        matched_by_name = {
            normalize_text(product.name).lower(): product
            for product in products
        }
        rental_days = equipment_rental_days(payload) if module_key == "equipment_rental_bookings" else 1
        hydrated_items: list[dict[str, Any]] = []
        for item in line_items:
            match = matched_by_name.get(normalize_text(item.get("name")).lower())
            quantity = max(int(round(parse_amount(item.get("quantity")))), 1)
            unit_price = round(parse_amount(item.get("unitPrice")), 2)
            cost_price = round(parse_amount(item.get("costPrice")), 2)
            category = normalize_text(item.get("category"))
            if match:
                unit_price = round(parse_amount(match.sales_price), 2)
                cost_price = round(parse_amount(match.cost_price), 2)
                category = normalize_text(match.category) or category
            item_days = max(int(round(parse_amount(item.get("rentalDays") or rental_days))), 1)
            line_total = round(unit_price * quantity * (item_days if module_key == "equipment_rental_bookings" else 1), 2)
            line_cost = round(cost_price * quantity * (item_days if module_key == "equipment_rental_bookings" else 1), 2)
            hydrated_items.append(
                {
                    "name": normalize_text(item.get("name")),
                    "category": category,
                    "quantity": quantity,
                    "unitPrice": unit_price,
                    "costPrice": cost_price,
                    "rentalDays": item_days if module_key == "equipment_rental_bookings" else 1,
                    "lineTotal": line_total,
                    "lineCost": line_cost,
                    "imageUrl": (
                        product_image_src(match)
                        if match
                        else product_image_src(
                            {
                                "name": normalize_text(item.get("name")),
                                "category": category,
                                "businessAreaId": SERVICE_MODULE_AREA_IDS.get(module_key, ""),
                                "itemType": "service",
                            }
                        )
                    ),
                }
            )
        payload[SERVICE_LINE_ITEMS_KEY] = hydrated_items
        sync_service_line_item_rollup(module_key, payload)
        return

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
    sync_service_line_item_rollup(module_key, payload)


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
        "platform admin": "admin",
        "finance": "finance",
        "finance & controls": "finance",
        "operations": "operations",
        "operations manager": "operations",
        "apartment-manager": "apartment-manager",
        "apartment manager": "apartment-manager",
        "sales-stock-operator": "sales-stock-operator",
        "sales & stock operator": "sales-stock-operator",
        "sales and stock operator": "sales-stock-operator",
        "sales & stock": "sales-stock-operator",
        "cashier": "cashier",
        "pos cashier": "cashier",
        "mobile-money-agent": "mobile-money-agent",
        "mobile money agent": "mobile-money-agent",
        "laundry-desk": "laundry-desk",
        "laundry desk": "laundry-desk",
        "equipment-desk": "equipment-desk",
        "equipment desk": "equipment-desk",
        "delivery-dispatch": "delivery-dispatch",
        "delivery & dispatch": "delivery-dispatch",
        "marketing-crm": "marketing-crm",
        "crm & marketing": "marketing-crm",
        "hr-payroll": "hr-payroll",
        "hr & payroll": "hr-payroll",
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
        "operations": "Operations Manager",
        "apartment-manager": "Apartment Manager",
        "sales-stock-operator": "Stock Officer",
        "cashier": "POS Cashier",
        "mobile-money-agent": "Mobile Money Agent",
        "laundry-desk": "Laundry Desk Officer",
        "equipment-desk": "Equipment Rental Officer",
        "delivery-dispatch": "Dispatch Coordinator",
        "marketing-crm": "CRM & Marketing Officer",
        "hr-payroll": "HR & Payroll Officer",
        "viewer": "Support Staff",
    }
    return role_map.get(role_key, "Support Staff")


def normalize_staff_role(value: Any, *, fallback_role: Any = "viewer") -> str:
    raw = normalize_text(value)
    if raw in STAFF_WORK_ROLE_LABELS:
        return raw
    normalized = raw.lower()
    legacy_aliases = {
        "cashier": "POS Cashier",
        "laundry attendant": "Laundry Desk Officer",
        "equipment officer": "Equipment Rental Officer",
    }
    if normalized in legacy_aliases:
        return legacy_aliases[normalized]
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
    "sales_summary": ("Daily Sales Summary", "sales_summary_page", None),
    "search": ("Global Search", "search_page", None),
    "inventory": ("Inventory", "inventory", None),
    "inventory_barcode": ("Barcode Stock Update", "inventory_barcode", None),
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
    "mobile_money_transactions": "serviceType",
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
        line_items = service_line_items("laundry_tickets", payload)
        payment_summary = service_payment_summary("laundry_tickets", payload)
        amount_due = payment_summary["totalDue"]
        amount_paid = payment_summary["paidTotal"]
        balance = payment_summary["balance"]
        status = normalize_text(payload.get("status")) or "Received"
        due_date = parse_date(payload.get("dueDate"))
        ready_date = parse_date(payload.get("readyDate"))
        laundry_item = normalize_text(payload.get("laundryItem"))
        item_detail = normalize_text(payload.get("itemSummary"))
        item_summary = service_line_items_brief("laundry_tickets", payload) if line_items else (laundry_item or item_detail or "Laundry Job")
        pieces = (
            sum(max(int(parse_amount(item.get("quantity"))), 0) for item in line_items)
            if line_items
            else (int(parse_amount(payload.get("pieces"))) if parse_amount(payload.get("pieces")) else 0)
        )
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
                "lineItems": line_items,
                "lineItemCount": len(line_items),
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
                "linkedOnlineOrderId": normalize_text(payload.get("linkedOnlineOrderId")),
                "linkedOnlineOrderNumber": normalize_text(payload.get("linkedOnlineOrderNumber")),
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
        line_items = service_line_items("equipment_rental_bookings", payload)
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
                "equipmentItem": service_line_items_brief("equipment_rental_bookings", payload) if line_items else (normalize_text(payload.get("equipmentItem")) or record.title or "Equipment Rental"),
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
                "itemQuantityTotal": sum(max(int(parse_amount(item.get("quantity"))), 0) for item in line_items) if line_items else max(int(parse_amount(payload.get("itemQuantityTotal") or 1)), 1),
                "lineItems": line_items,
                "lineItemCount": len(line_items),
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
                "linkedOnlineOrderId": normalize_text(payload.get("linkedOnlineOrderId")),
                "linkedOnlineOrderNumber": normalize_text(payload.get("linkedOnlineOrderNumber")),
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


def mobile_money_transaction_is_completed(payload: dict[str, Any]) -> bool:
    status_value = normalize_text(payload.get("status")).lower()
    return status_value in {"completed", "complete", "successful", "success", "paid", "done"}


def mobile_money_transaction_profit(payload: dict[str, Any]) -> float:
    sales_amount = parse_amount(payload.get("salesAmount"))
    cost_amount = parse_amount(payload.get("costAmount"))
    profit_amount = parse_amount(payload.get("profitAmount"))
    if abs(profit_amount) >= 0.01 or sales_amount <= 0:
        return profit_amount
    return round(sales_amount - cost_amount, 2)


MOBILE_MONEY_FEE_BASED_SERVICE_TYPES = {
    "Cash In",
    "Cash Out",
    "Send Money",
    "Receive Money / Remittance",
    "Merchant Pay / Bill Pay",
    "ECG / Utility Payment",
    "School Fees / Institutional Payment",
    "Airtime / Data",
    "Wallet Top-Up",
    "SIM Sale",
    "SIM Replacement",
    "SIM Sale / Replacement",
    "SIM Registration / Update",
    "PIN Reset / Account Support",
    "Statement / Balance Check",
    "Bank To Wallet",
    "Wallet To Bank",
}

MOBILE_MONEY_DEFAULT_FLOAT_IMPACT = {
    "Cash In": "Cash In",
    "Send Money": "Cash In",
    "Merchant Pay / Bill Pay": "Cash In",
    "ECG / Utility Payment": "Cash In",
    "School Fees / Institutional Payment": "Cash In",
    "Airtime / Data": "Cash In",
    "Wallet Top-Up": "Cash In",
    "SIM Sale": "Cash In",
    "SIM Replacement": "Cash In",
    "SIM Sale / Replacement": "Cash In",
    "SIM Registration / Update": "Cash In",
    "PIN Reset / Account Support": "Cash In",
    "Statement / Balance Check": "Cash In",
    "Cash Out": "Cash Out",
    "Receive Money / Remittance": "Cash Out",
    "Bank To Wallet": "No Cash Movement",
    "Wallet To Bank": "No Cash Movement",
    "Other Service": "No Cash Movement",
}


def mobile_money_default_float_impact(service_type: Any) -> str:
    return MOBILE_MONEY_DEFAULT_FLOAT_IMPACT.get(normalize_text(service_type), "No Cash Movement")


def mobile_money_resolved_float_impact(payload: dict[str, Any]) -> str:
    explicit_value = normalize_text(payload.get("floatImpact"))
    if explicit_value in {"Cash In", "Cash Out", "No Cash Movement"}:
        return explicit_value
    return mobile_money_default_float_impact(payload.get("serviceType"))


def mobile_money_transaction_breakdown(records: list[ModuleRecord | dict[str, Any]]) -> dict[str, Any]:
    transaction_count = 0
    completed_count = 0
    pending_count = 0
    reversed_count = 0
    cancelled_count = 0
    other_count = 0
    handled_value_total = 0.0
    fee_total = 0.0
    cost_total = 0.0
    profit_total = 0.0
    cash_in_total = 0.0
    cash_out_total = 0.0
    no_cash_movement_total = 0.0
    service_fee_totals: dict[str, float] = defaultdict(float)

    for record in records:
        payload = dict(record.payload or {}) if isinstance(record, ModuleRecord) else dict(record or {})
        status_value = normalize_text(payload.get("status")).lower()
        transaction_count += 1
        if mobile_money_transaction_is_completed(payload):
            completed_count += 1
        elif status_value == "pending":
            pending_count += 1
        elif status_value == "reversed":
            reversed_count += 1
        elif status_value == "cancelled":
            cancelled_count += 1
        else:
            other_count += 1

        if not mobile_money_transaction_is_completed(payload):
            continue

        transaction_value = round(parse_amount(payload.get("transactionValue")), 2)
        sales_amount = round(parse_amount(payload.get("salesAmount")), 2)
        direct_cost = round(parse_amount(payload.get("costAmount")), 2)
        profit_amount = round(mobile_money_transaction_profit(payload), 2)
        float_impact = mobile_money_resolved_float_impact(payload)
        service_type = normalize_text(payload.get("serviceType")) or "Other Service"

        handled_value_total = round(handled_value_total + transaction_value, 2)
        fee_total = round(fee_total + sales_amount, 2)
        cost_total = round(cost_total + direct_cost, 2)
        profit_total = round(profit_total + profit_amount, 2)
        service_fee_totals[service_type] = round(service_fee_totals[service_type] + sales_amount, 2)

        if float_impact == "Cash In":
            cash_in_total = round(cash_in_total + transaction_value, 2)
        elif float_impact == "Cash Out":
            cash_out_total = round(cash_out_total + transaction_value, 2)
        else:
            no_cash_movement_total = round(no_cash_movement_total + transaction_value, 2)

    net_cash_movement_total = round(cash_in_total + fee_total - cash_out_total, 2)
    average_fee = round(fee_total / completed_count, 2) if completed_count > 0 else 0.0
    top_service_type = max(service_fee_totals.items(), key=lambda item: item[1])[0] if service_fee_totals else "No Completed Transactions"

    return {
        "transactionCount": transaction_count,
        "completedCount": completed_count,
        "pendingCount": pending_count,
        "reversedCount": reversed_count,
        "cancelledCount": cancelled_count,
        "otherCount": other_count,
        "handledValueTotal": handled_value_total,
        "feeTotal": fee_total,
        "costTotal": cost_total,
        "profitTotal": profit_total,
        "cashInValueTotal": cash_in_total,
        "cashOutValueTotal": cash_out_total,
        "noCashMovementValueTotal": no_cash_movement_total,
        "netCashMovementTotal": net_cash_movement_total,
        "averageFee": average_fee,
        "topServiceType": top_service_type,
        "serviceFeeTotals": dict(service_fee_totals),
        "hasData": bool(transaction_count),
    }


def mobile_money_reconciliation_breakdown(records: list[ModuleRecord | dict[str, Any]]) -> dict[str, Any]:
    record_count = 0
    opening_cash_total = 0.0
    opening_ecash_total = 0.0
    cash_top_up_total = 0.0
    ecash_top_up_total = 0.0
    cash_removed_total = 0.0
    ecash_removed_total = 0.0
    cash_in_total = 0.0
    cash_out_total = 0.0
    service_fees_total = 0.0
    operating_expense_total = 0.0
    expected_closing_total = 0.0
    closing_counted_total = 0.0
    variance_total = 0.0
    expected_ecash_total = 0.0
    closing_ecash_counted_total = 0.0
    ecash_variance_total = 0.0
    balanced_count = 0
    ecash_balanced_count = 0
    statuses: set[str] = set()

    for record in records:
        payload = dict(record.payload or {}) if isinstance(record, ModuleRecord) else dict(record or {})
        record_count += 1
        opening_cash_total = round(opening_cash_total + parse_amount(payload.get("openingCash")), 2)
        opening_ecash_total = round(opening_ecash_total + parse_amount(payload.get("openingECash")), 2)
        cash_top_up_total = round(cash_top_up_total + parse_amount(payload.get("cashTopUp")), 2)
        ecash_top_up_total = round(ecash_top_up_total + parse_amount(payload.get("eCashTopUp")), 2)
        cash_removed_total = round(cash_removed_total + parse_amount(payload.get("cashRemoved")), 2)
        ecash_removed_total = round(ecash_removed_total + parse_amount(payload.get("eCashRemoved")), 2)
        cash_in_total = round(cash_in_total + parse_amount(payload.get("cashInValue")), 2)
        cash_out_total = round(cash_out_total + parse_amount(payload.get("cashOutValue")), 2)
        service_fees_total = round(service_fees_total + parse_amount(payload.get("serviceFees")), 2)
        operating_expense_total = round(operating_expense_total + parse_amount(payload.get("operatingExpense")), 2)
        expected_closing_total = round(expected_closing_total + mobile_money_expected_closing(payload), 2)
        closing_counted_total = round(closing_counted_total + parse_amount(payload.get("closingCashCounted")), 2)
        expected_ecash_total = round(expected_ecash_total + mobile_money_expected_ecash(payload), 2)
        closing_ecash_counted_total = round(closing_ecash_counted_total + parse_amount(payload.get("closingECashCounted")), 2)
        variance = mobile_money_variance(payload)
        ecash_variance = mobile_money_ecash_variance(payload)
        variance_total = round(variance_total + variance, 2)
        ecash_variance_total = round(ecash_variance_total + ecash_variance, 2)
        status_label = mobile_money_status(payload)
        statuses.add(status_label)
        if status_label == "Balanced":
            balanced_count += 1
        if mobile_money_ecash_status(payload) == "Balanced":
            ecash_balanced_count += 1

    if not record_count:
        status_summary = "No Reconciliation"
    elif len(statuses) == 1:
        status_summary = next(iter(statuses))
    else:
        status_summary = "Mixed"

    return {
        "recordCount": record_count,
        "openingCashTotal": opening_cash_total,
        "openingECashTotal": opening_ecash_total,
        "cashTopUpTotal": cash_top_up_total,
        "eCashTopUpTotal": ecash_top_up_total,
        "cashRemovedTotal": cash_removed_total,
        "eCashRemovedTotal": ecash_removed_total,
        "cashInValueTotal": cash_in_total,
        "cashOutValueTotal": cash_out_total,
        "serviceFeesTotal": service_fees_total,
        "operatingExpenseTotal": operating_expense_total,
        "expectedClosingTotal": expected_closing_total,
        "closingCountedTotal": closing_counted_total,
        "varianceTotal": variance_total,
        "expectedECashTotal": expected_ecash_total,
        "closingECashCountedTotal": closing_ecash_counted_total,
        "eCashVarianceTotal": ecash_variance_total,
        "balancedCount": balanced_count,
        "eCashBalancedCount": ecash_balanced_count,
        "statusLabel": status_summary,
        "hasData": bool(record_count),
    }


def build_mobile_money_transaction_rows(records: list[ModuleRecord]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for record in records:
        payload = dict(record.payload or {})
        rows.append(
            {
                "id": record.id,
                "date": record.record_date.isoformat() if record.record_date else "",
                "provider": normalize_text(payload.get("provider")) or "MTN Mobile Money",
                "serviceType": normalize_text(payload.get("serviceType")) or "Mobile Money Service",
                "customerName": normalize_text(payload.get("customerName")) or record.title or "Walk-in Customer",
                "customerPhone": normalize_phone(payload.get("customerPhone")),
                "momoNumber": normalize_text(payload.get("momoNumber")),
                "transactionValue": round(parse_amount(payload.get("transactionValue")), 2),
                "feeAmount": round(parse_amount(payload.get("salesAmount")), 2),
                "costAmount": round(parse_amount(payload.get("costAmount")), 2),
                "profitAmount": round(mobile_money_transaction_profit(payload), 2) if mobile_money_transaction_is_completed(payload) else 0.0,
                "floatImpact": mobile_money_resolved_float_impact(payload),
                "reference": normalize_text(payload.get("reference")),
                "status": normalize_text(payload.get("status")) or "Pending",
                "notes": normalize_text(payload.get("notes")),
                "isCompleted": mobile_money_transaction_is_completed(payload),
            }
        )
    return rows


def build_mobile_money_reconciliation_rows(records: list[ModuleRecord]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for record in records:
        payload = dict(record.payload or {})
        rows.append(
            {
                "id": record.id,
                "date": record.record_date.isoformat() if record.record_date else "",
                "provider": normalize_text(payload.get("provider")) or "MTN Mobile Money",
                "openingCash": round(parse_amount(payload.get("openingCash")), 2),
                "openingECash": round(parse_amount(payload.get("openingECash")), 2),
                "cashTopUp": round(parse_amount(payload.get("cashTopUp")), 2),
                "eCashTopUp": round(parse_amount(payload.get("eCashTopUp")), 2),
                "cashRemoved": round(parse_amount(payload.get("cashRemoved")), 2),
                "eCashRemoved": round(parse_amount(payload.get("eCashRemoved")), 2),
                "serviceFees": round(parse_amount(payload.get("serviceFees")), 2),
                "cashInValue": round(parse_amount(payload.get("cashInValue")), 2),
                "cashOutValue": round(parse_amount(payload.get("cashOutValue")), 2),
                "closingCashCounted": round(parse_amount(payload.get("closingCashCounted")), 2),
                "closingECashCounted": round(parse_amount(payload.get("closingECashCounted")), 2),
                "expectedCash": mobile_money_expected_closing(payload),
                "expectedECash": mobile_money_expected_ecash(payload),
                "cashVariance": mobile_money_variance(payload),
                "eCashVariance": mobile_money_ecash_variance(payload),
                "cashStatus": mobile_money_status(payload),
                "eCashStatus": mobile_money_ecash_status(payload),
                "notes": normalize_text(payload.get("notes")),
            }
        )
    return rows


def mobile_money_transaction_day_rollup(
    db_session,
    target_date: date | None,
    provider: str = "",
    exclude_record_id: str = "",
) -> dict[str, Any]:
    if not target_date:
        return {
            "date": "",
            "provider": normalize_text(provider) or "MTN Mobile Money",
            "completedCount": 0,
            "handledValueTotal": 0.0,
            "cashInValueTotal": 0.0,
            "cashOutValueTotal": 0.0,
            "feeTotal": 0.0,
            "costTotal": 0.0,
            "profitTotal": 0.0,
            "hasData": False,
        }

    candidate_records = db_session.scalars(
        select(ModuleRecord)
        .where(
            ModuleRecord.module_key == "mobile_money_transactions",
            ModuleRecord.record_date == target_date,
        )
        .order_by(desc(ModuleRecord.updated_at))
    ).all()

    clean_provider = normalize_text(provider)
    completed_records = []
    for record in candidate_records:
        if exclude_record_id and record.id == exclude_record_id:
            continue
        payload = dict(record.payload or {})
        if clean_provider and normalize_text(payload.get("provider")) != clean_provider:
            continue
        if not mobile_money_transaction_is_completed(payload):
            continue
        completed_records.append(payload)

    transaction_summary = mobile_money_transaction_breakdown(completed_records)

    return {
        "date": target_date.isoformat(),
        "provider": clean_provider or "MTN Mobile Money",
        "completedCount": transaction_summary["completedCount"],
        "handledValueTotal": transaction_summary["handledValueTotal"],
        "cashInValueTotal": transaction_summary["cashInValueTotal"],
        "cashOutValueTotal": transaction_summary["cashOutValueTotal"],
        "noCashMovementValueTotal": transaction_summary["noCashMovementValueTotal"],
        "netCashMovementTotal": transaction_summary["netCashMovementTotal"],
        "feeTotal": transaction_summary["feeTotal"],
        "costTotal": transaction_summary["costTotal"],
        "profitTotal": transaction_summary["profitTotal"],
        "hasData": transaction_summary["hasData"],
    }


def mobile_money_form_errors(module_key: str, payload: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    target_date = parse_date(payload.get("date"))
    if target_date and target_date > date.today():
        errors.append("Mobile money date cannot be in the future.")

    if module_key != "mobile_money_transactions":
        return errors

    service_type = normalize_text(payload.get("serviceType"))
    transaction_value = parse_amount(payload.get("transactionValue"))
    fee_amount = parse_amount(payload.get("salesAmount"))

    if fee_amount < 0:
        errors.append("Fee earned cannot be below zero.")

    if (
        service_type in MOBILE_MONEY_FEE_BASED_SERVICE_TYPES
        and transaction_value > 0
        and fee_amount >= transaction_value
    ):
        errors.append(
            "Fee earned must be lower than the full transaction value. Put the customer amount in Transaction Value and only OneRoot's charge in Fee Earned / Commission."
        )

    return errors


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
    elif definition.key == "mobile_money_transactions":
        mobile_money_summary = mobile_money_transaction_breakdown(records)
        cards = [
            {
                "label": "MoMo Transactions",
                "value": f"{mobile_money_summary['transactionCount']}",
                "note": (
                    f"Completed {mobile_money_summary['completedCount']} · Pending {mobile_money_summary['pendingCount']} · "
                    f"Reversed {mobile_money_summary['reversedCount']} · Cancelled {mobile_money_summary['cancelledCount']}"
                ),
            },
            {
                "label": "Handled Value",
                "value": format_currency(mobile_money_summary["handledValueTotal"]),
                "note": f"No-cash services: {format_currency(mobile_money_summary['noCashMovementValueTotal'])}",
            },
            {
                "label": "Cash In Total",
                "value": format_currency(mobile_money_summary["cashInValueTotal"]),
                "note": "Customer cash collected into the till from completed MoMo services.",
            },
            {
                "label": "Cash Out Total",
                "value": format_currency(mobile_money_summary["cashOutValueTotal"]),
                "note": "Cash paid out to customers from completed MoMo services.",
            },
            {
                "label": "Fees Earned",
                "value": format_currency(mobile_money_summary["feeTotal"]),
                "note": (
                    f"Average fee {format_currency(mobile_money_summary['averageFee'])} · "
                    f"Top service {mobile_money_summary['topServiceType']}"
                ),
            },
            {
                "label": "Net Cash Movement",
                "value": format_currency(mobile_money_summary["netCashMovementTotal"]),
                "note": "Cash In + Fees Earned - Cash Out before float top-ups or cash removals.",
            },
            {
                "label": "Direct Cost",
                "value": format_currency(mobile_money_summary["costTotal"]),
                "note": "Direct charges linked to the completed mobile money transactions in this view.",
            },
            {
                "label": "Profit",
                "value": format_currency(mobile_money_summary["profitTotal"]),
                "note": "Fees earned minus direct cost for completed mobile money transactions.",
            },
        ]
    elif definition.key == "mobile_money_reconciliations":
        reconciliation_summary = mobile_money_reconciliation_breakdown(records)
        cards = [
            {
                "label": "Reconciliation Days",
                "value": f"{reconciliation_summary['recordCount']}",
                "note": f"Current status: {reconciliation_summary['statusLabel']}",
            },
            {
                "label": "Opening Float",
                "value": format_currency(reconciliation_summary["openingCashTotal"]),
                "note": "Opening cash available before any top-up or customer transaction.",
            },
            {
                "label": "Cash Top-Up",
                "value": format_currency(reconciliation_summary["cashTopUpTotal"]),
                "note": "Additional cash added to float during the filtered reconciliation period.",
            },
            {
                "label": "Opening E-Cash",
                "value": format_currency(reconciliation_summary["openingECashTotal"]),
                "note": "Wallet float available before serving customers.",
            },
            {
                "label": "E-Cash Top-Up",
                "value": format_currency(reconciliation_summary["eCashTopUpTotal"]),
                "note": "Extra wallet float added during the filtered reconciliation period.",
            },
            {
                "label": "Cash Removed",
                "value": format_currency(reconciliation_summary["cashRemovedTotal"]),
                "note": "Cash taken out from float for banking, handover, or safekeeping.",
            },
            {
                "label": "E-Cash Removed",
                "value": format_currency(reconciliation_summary["eCashRemovedTotal"]),
                "note": "Wallet float moved out to bank or another wallet source.",
            },
            {
                "label": "Cash In Total",
                "value": format_currency(reconciliation_summary["cashInValueTotal"]),
                "note": "Full customer value deposited into wallets according to reconciliation rows.",
            },
            {
                "label": "Cash Out Total",
                "value": format_currency(reconciliation_summary["cashOutValueTotal"]),
                "note": "Full customer value paid out from the float according to reconciliation rows.",
            },
            {
                "label": "Service Fees",
                "value": format_currency(reconciliation_summary["serviceFeesTotal"]),
                "note": f"Operating expense: {format_currency(reconciliation_summary['operatingExpenseTotal'])}",
            },
            {
                "label": "Expected Closing",
                "value": format_currency(reconciliation_summary["expectedClosingTotal"]),
                "note": "Calculated closing cash based on opening float, movements, fees, and expenses.",
            },
            {
                "label": "Counted Closing",
                "value": format_currency(reconciliation_summary["closingCountedTotal"]),
                "note": f"Balanced days: {reconciliation_summary['balancedCount']}",
            },
            {
                "label": "Variance",
                "value": format_currency(reconciliation_summary["varianceTotal"]),
                "note": "Difference between expected closing and counted closing cash.",
            },
            {
                "label": "Expected E-Cash",
                "value": format_currency(reconciliation_summary["expectedECashTotal"]),
                "note": "Calculated wallet balance based on opening e-cash and today's movements.",
            },
            {
                "label": "Counted E-Cash",
                "value": format_currency(reconciliation_summary["closingECashCountedTotal"]),
                "note": f"Balanced wallet days: {reconciliation_summary['eCashBalancedCount']}",
            },
            {
                "label": "E-Cash Variance",
                "value": format_currency(reconciliation_summary["eCashVarianceTotal"]),
                "note": "Difference between expected e-cash and counted e-cash.",
            },
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
            "bedRentDue",
            "bedRentPaid",
            "mattressRentDue",
            "mattressRentPaid",
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
    if definition.key == "mobile_money_transactions":
        return (
            normalize_text(payload.get("customerName"))
            or normalize_text(payload.get("serviceType"))
            or normalize_text(payload.get("provider"))
            or definition.label
        )
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


def mobile_money_expected_ecash(payload: dict[str, Any]) -> float:
    expected = (
        parse_amount(payload.get("openingECash"))
        + parse_amount(payload.get("eCashTopUp"))
        + parse_amount(payload.get("cashOutValue"))
        - parse_amount(payload.get("cashInValue"))
        - parse_amount(payload.get("eCashRemoved"))
    )
    return round(expected, 2)


def mobile_money_variance(payload: dict[str, Any]) -> float:
    return round(parse_amount(payload.get("closingCashCounted")) - mobile_money_expected_closing(payload), 2)


def mobile_money_ecash_variance(payload: dict[str, Any]) -> float:
    return round(parse_amount(payload.get("closingECashCounted")) - mobile_money_expected_ecash(payload), 2)


def mobile_money_status(payload: dict[str, Any]) -> str:
    variance = mobile_money_variance(payload)
    if abs(variance) < 0.01:
        return "Balanced"
    return "Over Counted" if variance > 0 else "Short"


def mobile_money_ecash_status(payload: dict[str, Any]) -> str:
    variance = mobile_money_ecash_variance(payload)
    if abs(variance) < 0.01:
        return "Balanced"
    return "Over Counted" if variance > 0 else "Short"


def mobile_money_live_balance_snapshot(db_session, target_date: date | None, provider: str = "") -> dict[str, Any]:
    clean_provider = normalize_text(provider) or "MTN Mobile Money"
    startup_profile = dict(MOBILE_MONEY_STARTUP_PROFILES.get(clean_provider) or {})
    startup_sim_cost = round(parse_amount(startup_profile.get("simPurchaseCost")), 2)
    startup_opening_cash = round(parse_amount(startup_profile.get("openingCash")), 2)
    startup_opening_ecash = round(parse_amount(startup_profile.get("openingECash")), 2)
    startup_float_total = round(startup_opening_cash + startup_opening_ecash, 2)
    startup_capital_total = round(startup_sim_cost + startup_float_total, 2)
    if not target_date:
        return {
            "date": "",
            "provider": clean_provider,
            "openingCash": startup_opening_cash,
            "openingECash": startup_opening_ecash,
            "physicalCashAvailable": 0.0,
            "eCashAvailable": 0.0,
            "workingFloatAvailable": 0.0,
            "cashInValueTotal": 0.0,
            "cashOutValueTotal": 0.0,
            "feeTotal": 0.0,
            "cashTopUp": 0.0,
            "cashTopUpSource": normalize_text(startup_profile.get("cashTopUpSource")),
            "cashRemoved": 0.0,
            "eCashTopUp": 0.0,
            "eCashTopUpSource": normalize_text(startup_profile.get("eCashTopUpSource")),
            "eCashRemoved": 0.0,
            "operatingExpense": 0.0,
            "hasBase": False,
            "startupSimCost": startup_sim_cost,
            "startupFloatTotal": startup_float_total,
            "startupCapitalTotal": startup_capital_total,
            "usesStartupDefaults": startup_float_total > 0,
            "basisNote": "No date selected yet.",
        }

    transaction_rollup = mobile_money_transaction_day_rollup(db_session, target_date, clean_provider)
    reconciliation_records = db_session.scalars(
        select(ModuleRecord)
        .where(
            ModuleRecord.module_key == "mobile_money_reconciliations",
            ModuleRecord.record_date <= target_date,
        )
        .order_by(desc(ModuleRecord.record_date), desc(ModuleRecord.updated_at))
    ).all()
    provider_records = [
        record
        for record in reconciliation_records
        if normalize_text((record.payload or {}).get("provider")) == clean_provider
    ]
    today_record = next((record for record in provider_records if record.record_date == target_date), None)
    carry_record = today_record or next((record for record in provider_records if record.record_date and record.record_date < target_date), None)
    carry_payload = dict(carry_record.payload or {}) if carry_record else {}
    today_payload = dict(today_record.payload or {}) if today_record else {}

    if today_record:
        opening_cash = parse_amount(today_payload.get("openingCash"))
        opening_ecash = parse_amount(today_payload.get("openingECash"))
        cash_top_up = parse_amount(today_payload.get("cashTopUp"))
        cash_top_up_source = normalize_text(today_payload.get("cashTopUpSource"))
        cash_removed = parse_amount(today_payload.get("cashRemoved"))
        ecash_top_up = parse_amount(today_payload.get("eCashTopUp"))
        ecash_top_up_source = normalize_text(today_payload.get("eCashTopUpSource"))
        ecash_removed = parse_amount(today_payload.get("eCashRemoved"))
        operating_expense = parse_amount(today_payload.get("operatingExpense"))
        basis_note = "Using today's saved opening cash and e-cash plus completed mobile money transactions."
    elif carry_record:
        opening_cash = parse_amount(carry_payload.get("closingCashCounted")) or mobile_money_expected_closing(carry_payload)
        opening_ecash = parse_amount(carry_payload.get("closingECashCounted")) or mobile_money_expected_ecash(carry_payload)
        cash_top_up = 0.0
        cash_top_up_source = ""
        cash_removed = 0.0
        ecash_top_up = 0.0
        ecash_top_up_source = ""
        ecash_removed = 0.0
        operating_expense = 0.0
        basis_note = "Using the last saved closing balances as today's opening base. Save today's reconciliation row to lock in the opening float."
    else:
        opening_cash = startup_opening_cash
        opening_ecash = startup_opening_ecash
        cash_top_up = 0.0
        cash_top_up_source = normalize_text(startup_profile.get("cashTopUpSource"))
        cash_removed = 0.0
        ecash_top_up = 0.0
        ecash_top_up_source = normalize_text(startup_profile.get("eCashTopUpSource"))
        ecash_removed = 0.0
        operating_expense = 0.0
        if startup_float_total > 0:
            basis_note = (
                f"Using OneRoot startup float for {clean_provider}: {format_currency(startup_opening_cash)} physical cash + "
                f"{format_currency(startup_opening_ecash)} e-cash. Save today's reconciliation row to lock this opening float."
            )
        else:
            basis_note = "Save today's reconciliation row first so the app knows the opening cash and opening e-cash."

    physical_cash_available = round(
        opening_cash
        + cash_top_up
        + transaction_rollup["cashInValueTotal"]
        + transaction_rollup["feeTotal"]
        - transaction_rollup["cashOutValueTotal"]
        - cash_removed
        - operating_expense,
        2,
    )
    ecash_available = round(
        opening_ecash
        + ecash_top_up
        + transaction_rollup["cashOutValueTotal"]
        - transaction_rollup["cashInValueTotal"]
        - ecash_removed,
        2,
    )
    working_float_available = round(physical_cash_available + ecash_available, 2)

    return {
        "date": target_date.isoformat(),
        "provider": clean_provider,
        "openingCash": opening_cash,
        "openingECash": opening_ecash,
        "physicalCashAvailable": physical_cash_available,
        "eCashAvailable": ecash_available,
        "workingFloatAvailable": working_float_available,
        "cashInValueTotal": transaction_rollup["cashInValueTotal"],
        "cashOutValueTotal": transaction_rollup["cashOutValueTotal"],
        "feeTotal": transaction_rollup["feeTotal"],
        "cashTopUp": cash_top_up,
        "cashTopUpSource": cash_top_up_source,
        "cashRemoved": cash_removed,
        "eCashTopUp": ecash_top_up,
        "eCashTopUpSource": ecash_top_up_source,
        "eCashRemoved": ecash_removed,
        "operatingExpense": operating_expense,
        "hasBase": bool(today_record or carry_record),
        "startupSimCost": startup_sim_cost,
        "startupFloatTotal": startup_float_total,
        "startupCapitalTotal": startup_capital_total,
        "usesStartupDefaults": (not today_record and not carry_record and startup_float_total > 0),
        "basisNote": basis_note,
    }
def mobile_money_day_snapshot(db_session, target_date: date | None) -> dict[str, Any]:
    if not target_date:
        return {
            "date": "",
            "transactionCount": 0,
            "completedTransactionCount": 0,
            "handledValueTotal": 0.0,
            "cashInValueTotal": 0.0,
            "cashOutValueTotal": 0.0,
            "noCashMovementValueTotal": 0.0,
            "netCashMovementTotal": 0.0,
            "transactionFeeTotal": 0.0,
            "transactionCostTotal": 0.0,
            "transactionProfitTotal": 0.0,
            "pendingTransactionCount": 0,
            "reversedTransactionCount": 0,
            "cancelledTransactionCount": 0,
            "reconciliationCount": 0,
            "openingCashTotal": 0.0,
            "cashTopUpTotal": 0.0,
            "cashRemovedTotal": 0.0,
            "reconciliationFeeTotal": 0.0,
            "operatingExpenseTotal": 0.0,
            "expectedClosingTotal": 0.0,
            "closingCountedTotal": 0.0,
            "varianceTotal": 0.0,
            "balancedCount": 0,
            "statusLabel": "No Reconciliation",
            "recognizedSalesTotal": 0.0,
            "recognizedCostTotal": 0.0,
            "recognizedProfitTotal": 0.0,
            "recognizedTransactionCount": 0,
            "recognizedRecordCount": 0,
            "recognizedSourceType": "mobile-money-transaction",
            "recognizedSourceLabel": "Mobile Money Transaction",
            "usesReconciliationFallback": False,
            "hasData": False,
            "latestUpdatedAtLabel": "",
            "reference": "",
            "summaryNote": "No mobile money activity has been captured yet.",
        }

    transaction_records = db_session.scalars(
        select(ModuleRecord)
        .where(
            ModuleRecord.module_key == "mobile_money_transactions",
            ModuleRecord.record_date == target_date,
        )
        .order_by(desc(ModuleRecord.updated_at))
    ).all()
    reconciliation_records = db_session.scalars(
        select(ModuleRecord)
        .where(
            ModuleRecord.module_key == "mobile_money_reconciliations",
            ModuleRecord.record_date == target_date,
        )
        .order_by(desc(ModuleRecord.updated_at))
    ).all()

    transaction_summary = mobile_money_transaction_breakdown(transaction_records)
    reconciliation_summary = mobile_money_reconciliation_breakdown(reconciliation_records)

    uses_reconciliation_fallback = transaction_summary["feeTotal"] <= 0 and reconciliation_summary["serviceFeesTotal"] > 0
    recognized_sales_total = transaction_summary["feeTotal"]
    recognized_cost_total = transaction_summary["costTotal"]
    recognized_profit_total = transaction_summary["profitTotal"]
    recognized_transaction_count = transaction_summary["completedCount"]
    recognized_record_count = transaction_summary["completedCount"]
    recognized_source_type = "mobile-money-transaction"
    recognized_source_label = "Mobile Money Transaction"

    if uses_reconciliation_fallback:
        recognized_sales_total = reconciliation_summary["serviceFeesTotal"]
        recognized_cost_total = reconciliation_summary["operatingExpenseTotal"]
        recognized_profit_total = round(
            reconciliation_summary["serviceFeesTotal"] - reconciliation_summary["operatingExpenseTotal"],
            2,
        )
        recognized_transaction_count = 1 if reconciliation_summary["serviceFeesTotal"] > 0 else 0
        recognized_record_count = 1 if reconciliation_records else 0
        recognized_source_type = "mobile-money-reconciliation"
        recognized_source_label = "Mobile Money Reconciliation"

    status_label = reconciliation_summary["statusLabel"]

    latest_record = next((record for record in transaction_records if record.updated_at), None) or next(
        (record for record in reconciliation_records if record.updated_at),
        None,
    )
    latest_updated_at_label = (
        latest_record.updated_at.strftime("%Y-%m-%d %H:%M") if latest_record and isinstance(latest_record.updated_at, datetime) else ""
    )
    reference = latest_record.reference if latest_record else ""

    if uses_reconciliation_fallback:
        summary_note = "Using reconciliation fees in the daily sales total because no completed mobile money transactions were synced for this day."
    elif transaction_summary["feeTotal"] > 0 and reconciliation_records:
        summary_note = "Completed mobile money transactions are in the daily sales total and checked against reconciliation."
    elif transaction_summary["feeTotal"] > 0:
        summary_note = "Completed mobile money transactions are reflected in the daily sales total."
    elif reconciliation_records:
        summary_note = "Reconciliation exists for this day, but no service fees were recorded yet."
    else:
        summary_note = "No mobile money activity has been captured yet."

    return {
        "date": target_date.isoformat(),
        "transactionCount": transaction_summary["transactionCount"],
        "completedTransactionCount": transaction_summary["completedCount"],
        "pendingTransactionCount": transaction_summary["pendingCount"],
        "reversedTransactionCount": transaction_summary["reversedCount"],
        "cancelledTransactionCount": transaction_summary["cancelledCount"],
        "handledValueTotal": transaction_summary["handledValueTotal"],
        "cashInValueTotal": transaction_summary["cashInValueTotal"],
        "cashOutValueTotal": transaction_summary["cashOutValueTotal"],
        "noCashMovementValueTotal": transaction_summary["noCashMovementValueTotal"],
        "netCashMovementTotal": transaction_summary["netCashMovementTotal"],
        "transactionFeeTotal": transaction_summary["feeTotal"],
        "transactionCostTotal": transaction_summary["costTotal"],
        "transactionProfitTotal": transaction_summary["profitTotal"],
        "reconciliationCount": reconciliation_summary["recordCount"],
        "openingCashTotal": reconciliation_summary["openingCashTotal"],
        "cashTopUpTotal": reconciliation_summary["cashTopUpTotal"],
        "cashRemovedTotal": reconciliation_summary["cashRemovedTotal"],
        "reconciliationFeeTotal": reconciliation_summary["serviceFeesTotal"],
        "operatingExpenseTotal": reconciliation_summary["operatingExpenseTotal"],
        "expectedClosingTotal": reconciliation_summary["expectedClosingTotal"],
        "closingCountedTotal": reconciliation_summary["closingCountedTotal"],
        "varianceTotal": reconciliation_summary["varianceTotal"],
        "balancedCount": reconciliation_summary["balancedCount"],
        "statusLabel": status_label,
        "recognizedSalesTotal": round(recognized_sales_total, 2),
        "recognizedCostTotal": round(recognized_cost_total, 2),
        "recognizedProfitTotal": round(recognized_profit_total, 2),
        "recognizedTransactionCount": recognized_transaction_count,
        "recognizedRecordCount": recognized_record_count,
        "recognizedSourceType": recognized_source_type,
        "recognizedSourceLabel": recognized_source_label,
        "usesReconciliationFallback": uses_reconciliation_fallback,
        "hasData": bool(transaction_records or reconciliation_records),
        "latestUpdatedAtLabel": latest_updated_at_label,
        "reference": reference,
        "summaryNote": summary_note,
    }


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
    if definition.key == "apartments":
        return round(apartment_total_rent_paid(payload) + parse_amount(payload.get("billAmountPaid")), 2)
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


def set_module_record_metadata(record: ModuleRecord, definition: ModuleDefinition, payload: dict[str, Any]) -> None:
    apply_module_record_metadata(record, definition, payload)


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


def apartment_additional_rent_rows(payload: dict[str, Any]) -> list[dict[str, Any]]:
    rows = []
    for label, due_key, paid_key in (
        ("Bed Rent", "bedRentDue", "bedRentPaid"),
        ("Mattress Rent", "mattressRentDue", "mattressRentPaid"),
    ):
        due_amount = parse_amount(payload.get(due_key))
        paid_amount = parse_amount(payload.get(paid_key))
        if due_amount <= 0 and paid_amount <= 0:
            continue
        rows.append(
            {
                "label": label,
                "due": round(due_amount, 2),
                "paid": round(paid_amount, 2),
                "balance": round(max(due_amount - paid_amount, 0), 2),
            }
        )
    return rows


def apartment_additional_rent_due(payload: dict[str, Any]) -> float:
    return round(sum(item["due"] for item in apartment_additional_rent_rows(payload)), 2)


def apartment_additional_rent_paid(payload: dict[str, Any]) -> float:
    return round(sum(item["paid"] for item in apartment_additional_rent_rows(payload)), 2)


def apartment_total_rent_due(payload: dict[str, Any]) -> float:
    return round(parse_amount(payload.get("rentDue")) + apartment_additional_rent_due(payload), 2)


def apartment_total_rent_paid(payload: dict[str, Any]) -> float:
    return round(parse_amount(payload.get("rentPaid")) + apartment_additional_rent_paid(payload), 2)


def apartment_rent_summary_label(payload: dict[str, Any]) -> str:
    extra_rows = apartment_additional_rent_rows(payload)
    if not extra_rows:
        return "Rent"
    extras = " + ".join(item["label"].replace(" Rent", "") for item in extra_rows)
    return f"Rent + {extras}"


def apartment_additional_rent_note(payload: dict[str, Any]) -> str:
    rows = apartment_additional_rent_rows(payload)
    if not rows:
        return ""
    return " Additional rent items currently on record: " + "; ".join(
        f'{item["label"]} {format_agreement_currency(item["due"] if item["due"] > 0 else item["paid"])}'
        for item in rows
    ) + "."


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
        apartment_total_rent_due(payload)
        + apartment_bills_due(payload)
        + parse_amount(payload.get("arrearsBroughtForward"))
        + parse_amount(payload.get("lateFee")),
        2,
    )


def apartment_balance_after_payments(payload: dict[str, Any]) -> float:
    return round(
        apartment_total_due_before_payments(payload)
        - apartment_total_rent_paid(payload)
        - parse_amount(payload.get("billAmountPaid"))
        - parse_amount(payload.get("creditBroughtForward")),
        2,
    )


def apartment_rent_balance(payload: dict[str, Any]) -> float:
    return round(
        max(
            apartment_total_rent_due(payload)
            + parse_amount(payload.get("arrearsBroughtForward"))
            + parse_amount(payload.get("lateFee"))
            - apartment_total_rent_paid(payload)
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
    additional_rent_items = apartment_additional_rent_rows(payload)
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
        "suiteRentDue": parse_amount(payload.get("rentDue")),
        "suiteRentPaid": parse_amount(payload.get("rentPaid")),
        "bedRentDue": parse_amount(payload.get("bedRentDue")),
        "bedRentPaid": parse_amount(payload.get("bedRentPaid")),
        "mattressRentDue": parse_amount(payload.get("mattressRentDue")),
        "mattressRentPaid": parse_amount(payload.get("mattressRentPaid")),
        "additionalRentItems": additional_rent_items,
        "additionalRentDue": apartment_additional_rent_due(payload),
        "additionalRentPaid": apartment_additional_rent_paid(payload),
        "rentSummaryLabel": apartment_rent_summary_label(payload),
        "rentDue": apartment_total_rent_due(payload),
        "rentPaid": apartment_total_rent_paid(payload),
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
        "agreementReady": bool(tenant and occupancy in APARTMENT_ACTIVE_STATUSES and apartment_payment_confirmed(payload)),
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


def apartment_due_entries(profile: dict[str, Any]) -> list[dict[str, Any]]:
    entries: list[dict[str, Any]] = []
    if parse_amount(profile.get("rentBalance")) > 0:
        entries.append(
            {
                "label": normalize_text(profile.get("rentSummaryLabel")) or "Rent",
                "amount": round(parse_amount(profile.get("rentBalance")), 2),
                "dueDate": parse_date(profile.get("nextRentDueDate")),
                "dueLabel": normalize_text(profile.get("nextRentDueDate")),
            }
        )
    if parse_amount(profile.get("billsBalance")) > 0:
        entries.append(
            {
                "label": "Monthly Bills",
                "amount": round(parse_amount(profile.get("billsBalance")), 2),
                "dueDate": parse_date(profile.get("billDueDate")),
                "dueLabel": normalize_text(profile.get("billDueDate")),
            }
        )
    return entries


def apartment_reminder_message(profile: dict[str, Any], *, support_phone: str = "") -> str:
    due_entries = apartment_due_entries(profile)
    suite = normalize_text(profile.get("suite")) or "your suite"
    tenant = normalize_text(profile.get("tenant")) or "Tenant"
    amount_parts = [f"{entry['label']} {format_currency(entry['amount'])}" for entry in due_entries if entry["amount"] > 0]
    amount_summary = ", ".join(amount_parts) if amount_parts else format_currency(profile.get("outstanding"))
    due_parts = []
    for entry in due_entries:
        if entry["dueDate"]:
            due_parts.append(f"{entry['label']} due {format_display_date(entry['dueDate'], long_month=True)}")
    due_summary = ". ".join(due_parts)
    contact_line = f" Please contact {support_phone} if you need any clarification." if normalize_text(support_phone) else ""
    return (
        f"Hello {tenant}, this is a reminder from OneRoot Essentials for {suite}. "
        f"Our records show an outstanding balance of {format_currency(profile.get('outstanding'))}"
        f" ({amount_summary})."
        f"{(' ' + due_summary + '.') if due_summary else ''} "
        f"Kindly make payment or reach out to confirm your plan.{contact_line}"
    ).strip()


def decorate_apartment_follow_up(profile: dict[str, Any], *, support_phone: str = "") -> dict[str, Any]:
    due_entries = apartment_due_entries(profile)
    primary_due = min(
        [entry for entry in due_entries if entry["dueDate"]],
        key=lambda entry: entry["dueDate"],
        default=None,
    )
    balance_parts = [f"{entry['label']} {format_currency(entry['amount'])}" for entry in due_entries if entry["amount"] > 0]
    balance_summary = " • ".join(balance_parts) if balance_parts else format_currency(profile.get("outstanding"))
    due_summary = " • ".join(
        f"{entry['label']} {format_display_date(entry['dueDate'], long_month=True)}"
        for entry in due_entries
        if entry["dueDate"]
    )
    reminder_message = apartment_reminder_message(profile, support_phone=support_phone)
    whatsapp_url = ""
    if normalize_phone(profile.get("tenantPhone")) and parse_amount(profile.get("outstanding")) > 0:
        whatsapp_url = whatsapp_chat_url(profile.get("tenantPhone"), reminder_message)

    reminder_type = {
        "rent-bills-overdue": "Rent & Bills Overdue",
        "rent-overdue": "Rent Overdue",
        "bills-overdue": "Monthly Bills Overdue",
        "rent-bills-due-soon": "Rent & Bills Due Soon",
        "rent-due-soon": "Rent Due Soon",
        "bills-due-soon": "Monthly Bills Due Soon",
        "open-balance": "Open Balance",
    }.get(profile.get("alertKey"), profile.get("alertLabel") or "Open Balance")

    return {
        **profile,
        "balanceSummary": balance_summary,
        "dueEntries": due_entries,
        "dueSummary": due_summary,
        "primaryDueLabel": (
            f"{primary_due['label']} {format_display_date(primary_due['dueDate'], long_month=True)}"
            if primary_due and primary_due.get("dueDate")
            else ""
        ),
        "primaryDueDate": primary_due["dueDate"].isoformat() if primary_due and primary_due.get("dueDate") else "",
        "whatsappUrl": whatsapp_url,
        "reminderMessage": reminder_message,
        "reminderType": reminder_type,
        "whatsappReady": bool(whatsapp_url),
    }


def latest_apartment_suite_profiles(records: list[ModuleRecord], *, support_phone: str = "") -> list[dict[str, Any]]:
    suite_latest: dict[str, dict[str, Any]] = {}
    for record in records:
        if record.module_key != "apartments":
            continue
        profile = decorate_apartment_follow_up(apartment_profile(record), support_phone=support_phone)
        current = suite_latest.get(profile["suite"])
        if not current or apartment_record_sort_key(profile["record"]) > apartment_record_sort_key(current["record"]):
            suite_latest[profile["suite"]] = profile
    return sorted(
        suite_latest.values(),
        key=lambda item: (
            item["alertRank"],
            item["primaryDueDate"] or item["alertDate"] or "9999-12-31",
            -parse_amount(item["outstanding"]),
            item["suite"],
        ),
    )


def build_tenant_reminder_queue(profiles: list[dict[str, Any]]) -> list[dict[str, Any]]:
    reminder_rows = [
        profile
        for profile in profiles
        if profile.get("occupancyKey") in {"occupied", "reserved"}
        and parse_amount(profile.get("outstanding")) > 0
        and profile.get("whatsappReady")
        and profile.get("alertKey") not in {"current", "vacant", "maintenance"}
    ]
    return sorted(
        reminder_rows,
        key=lambda item: (
            item["alertRank"],
            item["primaryDueDate"] or item["alertDate"] or "9999-12-31",
            -parse_amount(item["outstanding"]),
            item["suite"],
        ),
    )


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
        apartment_total_rent_paid(payload) > 0
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
        rent_due = apartment_total_rent_due(payload)
        rent_paid = apartment_total_rent_paid(payload)
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
                "rentSummaryLabel": apartment_rent_summary_label(payload),
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
    suite_rent_due = parse_amount((payment_payload or {}).get("rentDue")) or rent_cycle_amount or pick_latest_amount(source_payloads, "rentDue")
    suite_rent_paid = parse_amount((payment_payload or {}).get("rentPaid")) or pick_latest_amount(source_payloads, "rentPaid")
    bed_rent_due = parse_amount((payment_payload or {}).get("bedRentDue")) or pick_latest_amount(source_payloads, "bedRentDue")
    bed_rent_paid = parse_amount((payment_payload or {}).get("bedRentPaid")) or pick_latest_amount(source_payloads, "bedRentPaid")
    mattress_rent_due = parse_amount((payment_payload or {}).get("mattressRentDue")) or pick_latest_amount(source_payloads, "mattressRentDue")
    mattress_rent_paid = parse_amount((payment_payload or {}).get("mattressRentPaid")) or pick_latest_amount(source_payloads, "mattressRentPaid")
    total_rent_due = round(suite_rent_due + bed_rent_due + mattress_rent_due, 2)
    total_rent_paid = round(suite_rent_paid + bed_rent_paid + mattress_rent_paid, 2)

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
        "suiteRentDue": suite_rent_due,
        "suiteRentPaid": suite_rent_paid,
        "bedRentDue": bed_rent_due,
        "bedRentPaid": bed_rent_paid,
        "mattressRentDue": mattress_rent_due,
        "mattressRentPaid": mattress_rent_paid,
        "additionalRentDue": round(bed_rent_due + mattress_rent_due, 2),
        "additionalRentPaid": round(bed_rent_paid + mattress_rent_paid, 2),
        "rentSummaryLabel": apartment_rent_summary_label(
            {
                "bedRentDue": bed_rent_due,
                "bedRentPaid": bed_rent_paid,
                "mattressRentDue": mattress_rent_due,
                "mattressRentPaid": mattress_rent_paid,
            }
        ),
        "rentDue": total_rent_due,
        "rentPaid": total_rent_paid,
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
        or apartment_total_rent_due(payload)
        or apartment_total_rent_paid(payload)
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
    rent_plan_summary = (
        f"{format_agreement_currency(monthly_rent)} per month, payable {agreement_advance_label(cycle_months)}."
        if monthly_rent > 0
        else TENANCY_PLACEHOLDER_LINE
    )
    rent_plan_summary = f"{rent_plan_summary}{apartment_additional_rent_note(payload)}"

    return {
        "[[SUITE_NAME]]": normalize_text(payload.get("suite")) or "Apartment Suite",
        "[[PROPERTY_LOCATION]]": TENANCY_PROPERTY_LOCATION,
        "[[LEASE_TERM_LABEL]]": f"{lease_term_label} from the agreed commencement date to the matching expiry date.",
        "[[LEASE_TERM_TEXT]]": lease_term_label,
        "[[RENT_PLAN_SUMMARY]]": rent_plan_summary,
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
    if record.module_key == "mobile_money_transactions":
        return [f"mobile-money-transaction|{record.id}"]
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


def daily_sales_summary_context(db_session, sale_date: date, area_id: str = "") -> dict[str, Any]:
    selected_area = normalize_text(area_id)
    scoped_areas = [area for area in BUSINESS_AREAS if not selected_area or area["id"] == selected_area]
    area_map: dict[str, dict[str, Any]] = {
        area["id"]: {
            "areaId": area["id"],
            "areaLabel": area["label"],
            "areaShort": area["short"],
            "salesTotal": 0.0,
            "costTotal": 0.0,
            "profitTotal": 0.0,
            "transactionCount": 0,
            "recordCount": 0,
            "_sourceTotals": defaultdict(float),
        }
        for area in scoped_areas
    }
    source_map: dict[tuple[str, str], dict[str, Any]] = {}
    area_source_map: dict[tuple[str, str, str], dict[str, Any]] = {}
    detail_rows: list[dict[str, Any]] = []
    mobile_money_snapshot = mobile_money_day_snapshot(db_session, sale_date)
    mobile_money_in_scope = not selected_area or selected_area == "mobile-money"

    def ensure_area_entry(business_area_id: str) -> dict[str, Any]:
        if business_area_id not in area_map:
            fallback_label = BUSINESS_AREA_LABELS.get(business_area_id, business_area_id or "Shared Operations")
            area_map[business_area_id] = {
                "areaId": business_area_id,
                "areaLabel": fallback_label,
                "areaShort": BUSINESS_AREA_SHORT.get(business_area_id, fallback_label),
                "salesTotal": 0.0,
                "costTotal": 0.0,
                "profitTotal": 0.0,
                "transactionCount": 0,
                "recordCount": 0,
                "_sourceTotals": defaultdict(float),
            }
        return area_map[business_area_id]

    def append_sale_entry(
        *,
        entry_id: str,
        title: str,
        reference: str,
        record_date_value: str,
        updated_at_value: str,
        business_area_id: str,
        source_type: str,
        source_label: str,
        amount: float,
        cost_total: float,
        profit_total: float,
        transaction_count: int,
        notes: str,
    ) -> None:
        area_entry = ensure_area_entry(business_area_id)
        safe_transaction_count = max(int(transaction_count), 0)

        area_entry["salesTotal"] = round(area_entry["salesTotal"] + amount, 2)
        area_entry["costTotal"] = round(area_entry["costTotal"] + cost_total, 2)
        area_entry["profitTotal"] = round(area_entry["profitTotal"] + profit_total, 2)
        area_entry["transactionCount"] += safe_transaction_count
        area_entry["recordCount"] += 1
        area_entry["_sourceTotals"][source_label] = round(area_entry["_sourceTotals"][source_label] + amount, 2)

        source_key = (source_type, source_label)
        source_entry = source_map.setdefault(
            source_key,
            {
                "sourceType": source_type,
                "sourceLabel": source_label,
                "salesTotal": 0.0,
                "costTotal": 0.0,
                "profitTotal": 0.0,
                "transactionCount": 0,
                "recordCount": 0,
                "_areas": set(),
            },
        )
        source_entry["salesTotal"] = round(source_entry["salesTotal"] + amount, 2)
        source_entry["costTotal"] = round(source_entry["costTotal"] + cost_total, 2)
        source_entry["profitTotal"] = round(source_entry["profitTotal"] + profit_total, 2)
        source_entry["transactionCount"] += safe_transaction_count
        source_entry["recordCount"] += 1
        source_entry["_areas"].add(area_entry["areaShort"])

        area_source_key = (business_area_id, source_type, source_label)
        area_source_entry = area_source_map.setdefault(
            area_source_key,
            {
                "areaId": business_area_id,
                "areaLabel": area_entry["areaLabel"],
                "areaShort": area_entry["areaShort"],
                "sourceType": source_type,
                "sourceLabel": source_label,
                "salesTotal": 0.0,
                "costTotal": 0.0,
                "profitTotal": 0.0,
                "transactionCount": 0,
                "recordCount": 0,
            },
        )
        area_source_entry["salesTotal"] = round(area_source_entry["salesTotal"] + amount, 2)
        area_source_entry["costTotal"] = round(area_source_entry["costTotal"] + cost_total, 2)
        area_source_entry["profitTotal"] = round(area_source_entry["profitTotal"] + profit_total, 2)
        area_source_entry["transactionCount"] += safe_transaction_count
        area_source_entry["recordCount"] += 1

        detail_rows.append(
            {
                "id": entry_id,
                "title": title or source_label,
                "reference": reference,
                "recordDate": record_date_value or sale_date.isoformat(),
                "updatedAt": updated_at_value,
                "areaId": business_area_id,
                "areaLabel": area_entry["areaLabel"],
                "areaShort": area_entry["areaShort"],
                "sourceType": source_type,
                "sourceLabel": source_label,
                "transactionCount": safe_transaction_count,
                "salesTotal": amount,
                "costTotal": cost_total,
                "profitTotal": profit_total,
                "marginPercent": round((profit_total / amount) * 100, 2) if amount > 0 else 0.0,
                "notes": notes,
            }
        )

    sales_records = db_session.scalars(
        select(ModuleRecord)
        .where(
            ModuleRecord.module_key == "sales",
            ModuleRecord.record_date == sale_date,
        )
        .order_by(desc(ModuleRecord.updated_at), desc(ModuleRecord.amount))
    ).all()

    for record in sales_records:
        payload = record.payload or {}
        business_area_id = normalize_text(record.business_area_id) or normalize_text(payload.get("businessAreaId")) or "shared-operations"
        if selected_area and business_area_id != selected_area:
            continue

        source_type = normalize_text(payload.get("sourceType")).lower() or "manual-sale"
        source_label = normalize_text(payload.get("sourceLabel")) or profit_source_label(source_type)
        amount = round(parse_amount(record.amount), 2)
        cost_total = round(module_record_cost_amount(record), 2)
        profit_total = round(module_record_profit_amount(record), 2)
        transaction_count = max(int(parse_amount(payload.get("transactionCount"))), 1)

        append_sale_entry(
            entry_id=record.id,
            title=normalize_text(record.title) or source_label,
            reference=record.reference,
            record_date_value=record.record_date.isoformat() if record.record_date else sale_date.isoformat(),
            updated_at_value=record.updated_at.strftime("%Y-%m-%d %H:%M") if isinstance(record.updated_at, datetime) else "",
            business_area_id=business_area_id,
            source_type=source_type,
            source_label=source_label,
            amount=amount,
            cost_total=cost_total,
            profit_total=profit_total,
            transaction_count=transaction_count,
            notes=normalize_text(payload.get("notes")),
        )

    if mobile_money_in_scope and mobile_money_snapshot["usesReconciliationFallback"] and mobile_money_snapshot["recognizedSalesTotal"] > 0:
        append_sale_entry(
            entry_id=f"mobile-money-reconciliation-{sale_date.isoformat()}",
            title="Mobile Money Reconciliation",
            reference=mobile_money_snapshot["reference"] or f"mobile-money-reconciliation|{sale_date.isoformat()}",
            record_date_value=sale_date.isoformat(),
            updated_at_value=mobile_money_snapshot["latestUpdatedAtLabel"],
            business_area_id="mobile-money",
            source_type=mobile_money_snapshot["recognizedSourceType"],
            source_label=mobile_money_snapshot["recognizedSourceLabel"],
            amount=mobile_money_snapshot["recognizedSalesTotal"],
            cost_total=mobile_money_snapshot["recognizedCostTotal"],
            profit_total=mobile_money_snapshot["recognizedProfitTotal"],
            transaction_count=mobile_money_snapshot["recognizedTransactionCount"],
            notes=mobile_money_snapshot["summaryNote"],
        )

    total_sales = round(sum(row["salesTotal"] for row in area_map.values()), 2)
    total_cost = round(sum(row["costTotal"] for row in area_map.values()), 2)
    total_profit = round(sum(row["profitTotal"] for row in area_map.values()), 2)
    transaction_total = sum(row["transactionCount"] for row in area_map.values())
    record_total = sum(row["recordCount"] for row in area_map.values())

    area_rows: list[dict[str, Any]] = []
    for row in area_map.values():
        source_totals = sorted(row.pop("_sourceTotals").items(), key=lambda item: (item[1], item[0]), reverse=True)
        row["sharePercent"] = round((row["salesTotal"] / total_sales) * 100, 2) if total_sales > 0 else 0.0
        row["averageSale"] = round(row["salesTotal"] / row["transactionCount"], 2) if row["transactionCount"] > 0 else 0.0
        row["marginPercent"] = round((row["profitTotal"] / row["salesTotal"]) * 100, 2) if row["salesTotal"] > 0 else 0.0
        row["sourceLines"] = [{"label": label, "amount": amount} for label, amount in source_totals]
        row["sourceCount"] = len(source_totals)
        row["topSourceLabel"] = source_totals[0][0] if source_totals else "No Sales"
        row["topSourceAmount"] = source_totals[0][1] if source_totals else 0.0
        row["sourceSummary"] = (
            " · ".join(f"{label} {format_currency(amount)}" for label, amount in source_totals[:3])
            if source_totals
            else "No sales captured yet."
        )
        area_rows.append(row)
    area_rows.sort(key=lambda item: (item["salesTotal"], item["profitTotal"], item["areaLabel"]), reverse=True)

    source_rows: list[dict[str, Any]] = []
    for row in source_map.values():
        area_names = sorted(row.pop("_areas"))
        row["sharePercent"] = round((row["salesTotal"] / total_sales) * 100, 2) if total_sales > 0 else 0.0
        row["averageSale"] = round(row["salesTotal"] / row["transactionCount"], 2) if row["transactionCount"] > 0 else 0.0
        row["marginPercent"] = round((row["profitTotal"] / row["salesTotal"]) * 100, 2) if row["salesTotal"] > 0 else 0.0
        row["areaCount"] = len(area_names)
        row["areasLabel"] = ", ".join(area_names) if area_names else "—"
        source_rows.append(row)
    source_rows.sort(key=lambda item: (item["salesTotal"], item["profitTotal"], item["sourceLabel"]), reverse=True)

    area_source_rows = list(area_source_map.values())
    for row in area_source_rows:
        row["averageSale"] = round(row["salesTotal"] / row["transactionCount"], 2) if row["transactionCount"] > 0 else 0.0
        row["marginPercent"] = round((row["profitTotal"] / row["salesTotal"]) * 100, 2) if row["salesTotal"] > 0 else 0.0
    area_source_rows.sort(key=lambda item: (item["salesTotal"], item["profitTotal"], item["areaLabel"], item["sourceLabel"]), reverse=True)

    top_area = next((row for row in area_rows if row["salesTotal"] > 0), None)
    top_source = next((row for row in source_rows if row["salesTotal"] > 0), None) or (source_rows[0] if source_rows else None)
    mobile_money_area = next((row for row in area_rows if row["areaId"] == "mobile-money"), None) if mobile_money_in_scope else None
    mobile_money_source = (
        next((row for row in source_rows if row["sourceType"] == mobile_money_snapshot["recognizedSourceType"]), None)
        if mobile_money_in_scope
        else None
    )
    mobile_money_total = round(
        mobile_money_source["salesTotal"]
        if mobile_money_source
        else (mobile_money_area["salesTotal"] if mobile_money_area else 0.0),
        2,
    )
    mobile_money_profit = round(
        mobile_money_source["profitTotal"]
        if mobile_money_source
        else (mobile_money_area["profitTotal"] if mobile_money_area else 0.0),
        2,
    )
    mobile_money_transactions = (
        mobile_money_source["transactionCount"]
        if mobile_money_source
        else (mobile_money_area["transactionCount"] if mobile_money_area else 0)
    )
    mobile_money_share = round((mobile_money_total / total_sales) * 100, 2) if total_sales > 0 else 0.0
    mobile_money_scope_note = (
        mobile_money_snapshot["summaryNote"] if mobile_money_in_scope else "Mobile money is outside the current business area filter."
    )

    return {
        "area_rows": area_rows,
        "source_rows": source_rows,
        "area_source_rows": area_source_rows,
        "detail_rows": detail_rows[:40],
        "total_sales": total_sales,
        "total_cost": total_cost,
        "total_profit": total_profit,
        "transaction_total": transaction_total,
        "record_total": record_total,
        "areas_with_sales": sum(1 for row in area_rows if row["salesTotal"] > 0),
        "average_sale": round(total_sales / transaction_total, 2) if transaction_total > 0 else 0.0,
        "top_area": top_area,
        "top_source": top_source,
        "mobile_money_area": mobile_money_area,
        "mobile_money_source": mobile_money_source,
        "mobile_money_total": mobile_money_total,
        "mobile_money_profit": mobile_money_profit,
        "mobile_money_transactions": mobile_money_transactions,
        "mobile_money_share": mobile_money_share,
        "mobile_money_in_scope": mobile_money_in_scope,
        "mobile_money_scope_note": mobile_money_scope_note,
        "mobile_money_status_label": mobile_money_snapshot["statusLabel"] if mobile_money_in_scope else "Outside Filter",
        "mobile_money_uses_fallback": mobile_money_in_scope and mobile_money_snapshot["usesReconciliationFallback"],
        "mobile_money_reconciliation_total": mobile_money_snapshot["reconciliationFeeTotal"] if mobile_money_in_scope else 0.0,
        "mobile_money_reconciliation_count": mobile_money_snapshot["reconciliationCount"] if mobile_money_in_scope else 0,
        "mobile_money_expected_closing": mobile_money_snapshot["expectedClosingTotal"] if mobile_money_in_scope else 0.0,
        "mobile_money_closing_counted": mobile_money_snapshot["closingCountedTotal"] if mobile_money_in_scope else 0.0,
        "mobile_money_variance": mobile_money_snapshot["varianceTotal"] if mobile_money_in_scope else 0.0,
        "mobile_money_balanced_count": mobile_money_snapshot["balancedCount"] if mobile_money_in_scope else 0,
        "mobile_money_operating_expense": mobile_money_snapshot["operatingExpenseTotal"] if mobile_money_in_scope else 0.0,
        "mobile_money_handled_value": mobile_money_snapshot["handledValueTotal"] if mobile_money_in_scope else 0.0,
        "mobile_money_cash_in_value": mobile_money_snapshot["cashInValueTotal"] if mobile_money_in_scope else 0.0,
        "mobile_money_cash_out_value": mobile_money_snapshot["cashOutValueTotal"] if mobile_money_in_scope else 0.0,
        "mobile_money_no_cash_value": mobile_money_snapshot["noCashMovementValueTotal"] if mobile_money_in_scope else 0.0,
        "mobile_money_net_cash_movement": mobile_money_snapshot["netCashMovementTotal"] if mobile_money_in_scope else 0.0,
        "mobile_money_pending_transactions": mobile_money_snapshot["pendingTransactionCount"] if mobile_money_in_scope else 0,
        "mobile_money_reversed_transactions": mobile_money_snapshot["reversedTransactionCount"] if mobile_money_in_scope else 0,
        "mobile_money_cancelled_transactions": mobile_money_snapshot["cancelledTransactionCount"] if mobile_money_in_scope else 0,
        "sales_area_chart": build_chart_rows(
            [
                {"label": row["areaLabel"], "short": row["areaShort"], "amount": row["salesTotal"]}
                for row in area_rows
                if row["salesTotal"] > 0
            ],
            label_key="label",
            value_key="amount",
            short_key="short",
        ),
        "sales_source_chart": build_chart_rows(
            [
                {"label": row["sourceLabel"], "short": row["sourceLabel"], "amount": row["salesTotal"]}
                for row in source_rows
                if row["salesTotal"] > 0
            ],
            label_key="label",
            value_key="amount",
            short_key="short",
            positive_color="var(--accent)",
        ),
    }


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
                sales_amount=apartment_total_rent_paid(payload),
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
        "expiryDate",
        "expiryStatus",
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
            "expiryDate": item.expiry_date.isoformat() if item.expiry_date else "",
            "expiryStatus": product_expiry_status(item)["label"],
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
            "linkedLaundryTicketId": normalize_text(payload.get("linkedLaundryTicketId")),
            "linkedEquipmentBookingId": normalize_text(payload.get("linkedEquipmentBookingId")),
            "servicePaymentsManaged": bool(
                normalize_text(payload.get("linkedLaundryTicketId"))
                or normalize_text(payload.get("linkedEquipmentBookingId"))
            ),
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
            "alternateWhatsappNumber": app_config.alternate_whatsapp_number,
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
        kitchen_catalog_exists = any(normalize_text(product.business_area_id) == "kitchen" for product in products)
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
            if kitchen_catalog_exists and business_area_id == "kitchen":
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
                    "imageUrl": product_image_src(
                        {
                            "id": normalize_text(item.get("id")) or uuid4().hex,
                            "name": normalize_text(item.get("name")),
                            "businessAreaId": business_area_id,
                            "category": normalize_text(item.get("category")) or "Services",
                            "itemType": normalize_text(item.get("itemType")) or "service",
                            "imageUrl": normalize_text(item.get("imageUrl")),
                        }
                    ),
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
            "displayOrder": int(parse_amount(payload.get("displayOrder"))) if normalize_text(payload.get("displayOrder")) else 999,
            "location": normalize_text(payload.get("location")) or "Accra",
            "postedDate": normalize_text(payload.get("postedDate")) or (record.record_date.isoformat() if record.record_date else ""),
            "workingHours": normalize_text(payload.get("workingHours")),
            "closingDate": normalize_text(payload.get("closingDate")),
            "salaryRange": normalize_text(payload.get("salaryRange")),
            "contactPerson": normalize_text(payload.get("contactPerson")),
            "applicationPhone": normalize_text(payload.get("applicationPhone")),
            "applicationEmail": normalize_text(payload.get("applicationEmail")) or app_config.support_email,
            "applicationLink": normalize_text(payload.get("applicationLink")),
            "summary": normalize_text(payload.get("summary")),
            "keyResponsibilities": normalize_text(payload.get("keyResponsibilities")),
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
        return sorted(
            [vacancy for vacancy in vacancies if vacancy],
            key=lambda vacancy: (
                int(vacancy.get("displayOrder", 999) or 999),
                normalize_text(vacancy.get("jobTitle")),
            ),
        )

    def build_catalog_lookup() -> dict[str, dict[str, Any]]:
        return {item["id"]: item for item in build_public_catalog()}

    def build_public_order_number() -> str:
        return f"ORO-{datetime.utcnow().strftime('%Y%m%d')}-{uuid4().hex[:4].upper()}"

    def linked_service_payload_key(module_key: str) -> str:
        if module_key == "laundry_tickets":
            return "linkedLaundryTicketId"
        if module_key == "equipment_rental_bookings":
            return "linkedEquipmentBookingId"
        return ""

    def online_order_item_matches_equipment_service(item: dict[str, Any]) -> bool:
        if normalize_text(item.get("businessAreaId")) != "water-equipment":
            return False
        category = normalize_text(item.get("category")).lower()
        item_id = normalize_text(item.get("productId") or item.get("id")).lower()
        name = normalize_text(item.get("name")).lower()
        item_type = normalize_text(item.get("itemType")).lower()
        equipment_keywords = (
            "equipment rental",
            "wheelbarrow",
            "drill",
            "shovel",
            "head pan",
            "headpan",
            "vibrator",
            "cutting machine",
            "cutter",
            "impact drill",
        )
        return (
            item_id.startswith("equipment-rental")
            or "equipment rental" in category
            or (
                item_type == "service"
                and any(keyword in f"{name} {category}" for keyword in equipment_keywords)
            )
        )

    def online_order_items_for_service_module(payload: dict[str, Any], module_key: str) -> list[dict[str, Any]]:
        items = payload.get("items") if isinstance(payload.get("items"), list) else []
        if module_key == "laundry_tickets":
            return [
                dict(item)
                for item in items
                if isinstance(item, dict) and normalize_text(item.get("businessAreaId")) == "laundry-services"
            ]
        if module_key == "equipment_rental_bookings":
            return [
                dict(item)
                for item in items
                if isinstance(item, dict) and online_order_item_matches_equipment_service(item)
            ]
        return []

    def online_order_sales_items(payload: dict[str, Any]) -> list[dict[str, Any]]:
        items = payload.get("items") if isinstance(payload.get("items"), list) else []
        filtered_items: list[dict[str, Any]] = []
        for item in items:
            if not isinstance(item, dict):
                continue
            if normalize_text(item.get("businessAreaId")) == "laundry-services":
                continue
            if online_order_item_matches_equipment_service(item):
                continue
            filtered_items.append(item)
        return filtered_items

    def online_order_to_laundry_delivery_mode(value: Any) -> str:
        delivery_mode = normalize_text(value).lower()
        if delivery_mode == "pickup":
            return "Pickup"
        if delivery_mode == "delivery":
            return "Delivery"
        if delivery_mode:
            return "Pickup / Delivery"
        return "Walk-in"

    def laundry_status_from_online_order_status(value: Any) -> str:
        status = normalize_text(value).lower()
        return {
            "preparing": "In Progress",
            "ready": "Ready",
            "fulfilled": "Delivered",
            "completed": "Delivered",
            "cancelled": "Cancelled",
        }.get(status, "Received")

    def equipment_status_from_online_order_status(value: Any) -> str:
        return "Cancelled" if normalize_text(value).lower() == "cancelled" else "Booked"

    def online_order_status_from_service_status(module_key: str, payload: dict[str, Any]) -> str:
        status = normalize_text(payload.get("status")).lower()
        if module_key == "laundry_tickets":
            return {
                "in progress": "preparing",
                "ready": "ready",
                "delivered": "fulfilled",
                "cancelled": "cancelled",
            }.get(status, "")
        if module_key == "equipment_rental_bookings":
            return {
                "out": "preparing",
                "returned": "fulfilled",
                "cancelled": "cancelled",
            }.get(status, "")
        return ""

    def infer_laundry_service_type(order_payload: dict[str, Any], line_items: list[dict[str, Any]]) -> str:
        text_blob = " ".join(
            [
                normalize_text(order_payload.get("orderNotes")),
                *[normalize_text(item.get("name")) for item in line_items],
                *[normalize_text(item.get("category")) for item in line_items],
            ]
        ).lower()
        return "Express" if "express" in text_blob else "Normal"

    def build_service_note_from_online_order(order_payload: dict[str, Any], module_key: str) -> str:
        order_number = normalize_text(order_payload.get("orderNumber"))
        lines = [
            f"Auto-created from website order {order_number}.".strip(),
            normalize_text(order_payload.get("orderNotes")),
        ]
        if module_key == "equipment_rental_bookings":
            preferred_time = normalize_text(order_payload.get("preferredTime"))
            delivery_address = normalize_text(order_payload.get("deliveryAddress"))
            if preferred_time:
                lines.append(f"Preferred time: {preferred_time}")
            if delivery_address:
                lines.append(f"Site / address: {delivery_address}")
        else:
            delivery_address = normalize_text(order_payload.get("deliveryAddress"))
            if delivery_address:
                lines.append(f"Pickup / delivery address: {delivery_address}")
        return "\n".join(line for line in lines if line)

    def build_service_line_items_from_online_order(db_session, module_key: str, order_payload: dict[str, Any]) -> list[dict[str, Any]]:
        order_items = online_order_items_for_service_module(order_payload, module_key)
        if not order_items:
            return []
        products = service_reference_products(db_session, module_key)
        matched_products = {normalize_text(product.name).lower(): product for product in products}
        service_area = SERVICE_MODULE_AREA_IDS.get(module_key, "")
        normalized_items: list[dict[str, Any]] = []
        for raw_item in order_items:
            item_name = normalize_text(raw_item.get("name"))
            if not item_name:
                continue
            match = matched_products.get(item_name.lower())
            quantity = max(int(round(parse_amount(raw_item.get("quantity")))), 1)
            rental_days = (
                max(int(round(parse_amount(raw_item.get("requestedDays") or raw_item.get("pricingMultiplier") or 1))), 1)
                if module_key == "equipment_rental_bookings"
                else 1
            )
            unit_price = round(parse_amount(raw_item.get("unitPrice")), 2)
            cost_price = round(parse_amount(raw_item.get("costPrice")), 2)
            if match:
                if unit_price <= 0:
                    unit_price = round(parse_amount(match.sales_price), 2)
                if cost_price <= 0:
                    cost_price = round(parse_amount(match.cost_price), 2)
            category = normalize_text(match.category) if match and normalize_text(match.category) else normalize_text(raw_item.get("category"))
            line_total = round(parse_amount(raw_item.get("lineTotal")), 2)
            if line_total <= 0 and unit_price > 0:
                line_total = round(unit_price * quantity * (rental_days if module_key == "equipment_rental_bookings" else 1), 2)
            line_cost = round(cost_price * quantity * (rental_days if module_key == "equipment_rental_bookings" else 1), 2)
            image_url = normalize_text(raw_item.get("imageUrl")) or (
                product_image_src(match)
                if match
                else product_image_src(
                    {
                        "name": item_name,
                        "category": category,
                        "businessAreaId": service_area,
                        "itemType": "service",
                    }
                )
            )
            normalized_items.append(
                {
                    "name": item_name,
                    "category": category,
                    "quantity": quantity,
                    "unitPrice": unit_price,
                    "costPrice": cost_price,
                    "rentalDays": rental_days,
                    "lineTotal": line_total,
                    "lineCost": line_cost,
                    "imageUrl": image_url,
                }
            )
        return normalized_items

    def sync_linked_online_order_from_service_record(service_record: ModuleRecord, module_key: str, db_session=None) -> None:
        db = db_session or g.db
        service_payload = dict(service_record.payload or {})
        linked_order_id = normalize_text(service_payload.get("linkedOnlineOrderId"))
        if not linked_order_id:
            return
        order_record = db.get(ModuleRecord, linked_order_id)
        if not order_record or order_record.module_key != "online_orders":
            return
        order_payload = dict(order_record.payload or {})
        payment_summary = service_payment_summary(module_key, service_payload)
        total_due = round(payment_summary["totalDue"], 2)
        paid_total = round(payment_summary["paidTotal"], 2)
        last_payment = payment_summary["payments"][-1] if payment_summary["payments"] else {}
        if total_due > 0:
            order_payload["quotedTotal"] = total_due
        order_payload["paidAmount"] = paid_total
        order_payload["paymentDate"] = normalize_text(last_payment.get("paymentDate"))
        order_payload["paymentMethod"] = normalize_text(last_payment.get("paymentMethod")) or normalize_text(order_payload.get("paymentMethod"))
        if paid_total <= 0:
            order_payload["paymentStatus"] = "pending"
        elif total_due > 0 and paid_total + 0.009 < total_due:
            order_payload["paymentStatus"] = "part-paid"
        else:
            order_payload["paymentStatus"] = "paid"
        mapped_status = online_order_status_from_service_status(module_key, service_payload)
        if mapped_status:
            order_payload["status"] = mapped_status
        link_key = linked_service_payload_key(module_key)
        if link_key:
            order_payload[link_key] = service_record.id
        set_module_record_metadata(order_record, MODULES["online_orders"], order_payload)
        sync_online_order_sales(order_record, db_session=db)

    def upsert_service_record_from_online_order(order_record: ModuleRecord, module_key: str, db_session=None) -> ModuleRecord | None:
        db = db_session or g.db
        definition = MODULES.get(module_key)
        if not definition:
            return None
        order_payload = dict(order_record.payload or {})
        order_number = normalize_text(order_payload.get("orderNumber"))
        link_key = linked_service_payload_key(module_key)
        existing_record = None
        existing_record_id = normalize_text(order_payload.get(link_key)) if link_key else ""
        if existing_record_id:
            existing_record = db.get(ModuleRecord, existing_record_id)
            if existing_record and existing_record.module_key != module_key:
                existing_record = None
        if not existing_record and order_number:
            existing_record = db.scalar(
                select(ModuleRecord).where(
                    ModuleRecord.module_key == module_key,
                    ModuleRecord.reference == order_number,
                )
            )

        line_items = build_service_line_items_from_online_order(db, module_key, order_payload)
        if not line_items and not existing_record:
            return None

        created_date = parse_date(order_payload.get("createdAt")) or order_record.record_date or date.today()
        preferred_date = parse_date(order_payload.get("preferredDate"))
        preferred_date_value = preferred_date.isoformat() if preferred_date else ""
        auto_note = build_service_note_from_online_order(order_payload, module_key)

        if existing_record:
            service_payload = dict(existing_record.payload or {})
        else:
            service_payload = {
                "id": uuid4().hex,
                "createdAt": datetime.utcnow().isoformat(),
                "status": (
                    laundry_status_from_online_order_status(order_payload.get("status"))
                    if module_key == "laundry_tickets"
                    else equipment_status_from_online_order_status(order_payload.get("status"))
                ),
            }

        service_payload["businessAreaId"] = SERVICE_MODULE_AREA_IDS[module_key]
        service_payload["customerName"] = normalize_text(order_payload.get("customerName"))
        service_payload["customerPhone"] = normalize_text(order_payload.get("customerPhone"))
        service_payload["reference"] = order_number
        service_payload["linkedOnlineOrderId"] = order_record.id
        service_payload["linkedOnlineOrderNumber"] = order_number
        service_payload["linkedOnlineOrderStatus"] = normalize_text(order_payload.get("status")) or "new"
        service_payload["linkedOnlineOrderUpdatedAt"] = normalize_text(order_payload.get("updatedAt")) or datetime.utcnow().isoformat()
        if auto_note:
            service_payload["notes"] = auto_note if not normalize_text(service_payload.get("notes")) else normalize_text(service_payload.get("notes"))
        existing_service_items = service_line_items(module_key, service_payload)
        if line_items and normalize_text(service_payload.get("status")).lower() != "cancelled" and (not existing_record or not existing_service_items):
            service_payload[SERVICE_LINE_ITEMS_KEY] = line_items

        if module_key == "laundry_tickets":
            service_payload.setdefault("ticketDate", preferred_date_value or created_date.isoformat())
            service_payload["serviceType"] = infer_laundry_service_type(order_payload, line_items or service_line_items(module_key, service_payload))
            service_payload["deliveryMode"] = online_order_to_laundry_delivery_mode(order_payload.get("deliveryMode"))
            service_payload["dueDate"] = preferred_date_value or normalize_text(service_payload.get("dueDate"))
            service_payload.setdefault("itemSummary", normalize_text(order_payload.get("orderNotes")))
            if normalize_text(order_payload.get("status")).lower() == "cancelled":
                service_payload["status"] = "Cancelled"
        elif module_key == "equipment_rental_bookings":
            out_date = preferred_date or created_date
            max_days = max((max(int(round(parse_amount(item.get("rentalDays") or 1))), 1) for item in line_items), default=1)
            due_date = out_date + timedelta(days=max_days) if out_date else None
            service_payload.setdefault("bookingDate", created_date.isoformat())
            service_payload["outDate"] = out_date.isoformat() if out_date else normalize_text(service_payload.get("outDate"))
            service_payload["dueDate"] = due_date.isoformat() if due_date else normalize_text(service_payload.get("dueDate"))
            if normalize_text(order_payload.get("status")).lower() == "cancelled":
                service_payload["status"] = "Cancelled"

        hydrate_service_cost_payload(db, module_key, service_payload)
        sync_service_line_item_rollup(module_key, service_payload)
        apply_service_payment_rollup(module_key, service_payload)

        if not existing_record:
            existing_record = ModuleRecord(
                id=service_payload["id"],
                module_key=module_key,
                created_at=datetime.utcnow(),
            )
            db.add(existing_record)
        set_module_record_metadata(existing_record, definition, service_payload)
        return existing_record

    def sync_service_records_for_online_order(order_record: ModuleRecord, db_session=None) -> None:
        db = db_session or g.db
        order_payload = dict(order_record.payload or {})
        linked_records: list[tuple[str, ModuleRecord]] = []
        for module_key in ("laundry_tickets", "equipment_rental_bookings"):
            linked_record = upsert_service_record_from_online_order(order_record, module_key, db_session=db)
            link_key = linked_service_payload_key(module_key)
            if linked_record and link_key:
                order_payload[link_key] = linked_record.id
                linked_records.append((module_key, linked_record))
            elif link_key:
                order_payload.pop(link_key, None)
        set_module_record_metadata(order_record, MODULES["online_orders"], order_payload)
        for module_key, linked_record in linked_records:
            sync_linked_online_order_from_service_record(linked_record, module_key, db_session=db)

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
        category: str = "",
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
            "category": normalize_text(category),
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

        if record.module_key == "mobile_money_transactions":
            provider = normalize_text(payload.get("provider")) or "MTN Mobile Money"
            service_type = normalize_text(payload.get("serviceType")) or "Mobile Money Service"
            customer = normalize_text(payload.get("customerName")) or "Walk-in Customer"
            is_completed = mobile_money_transaction_is_completed(payload)
            sale_amount = parse_amount(payload.get("salesAmount")) if is_completed else 0.0
            upsert_generated_sale(
                db,
                reference=f"mobile-money-transaction|{record.id}",
                sale_date=parse_date(payload.get("date")),
                business_area_id="mobile-money",
                amount=sale_amount,
                cost_amount=parse_amount(payload.get("costAmount")) if sale_amount > 0 else 0.0,
                profit_amount=mobile_money_transaction_profit(payload) if sale_amount > 0 else 0.0,
                source_type="mobile-money-transaction",
                source_label="Mobile Money Transaction",
                category=service_type,
                note=f"[MoMo Sync] {service_type} for {customer} via {provider}.",
            )
            return

        if record.module_key == "apartments":
            suite = normalize_text(payload.get("suite")) or "Suite"
            tenant = normalize_text(payload.get("tenantName")) or "Tenant"
            upsert_generated_sale(
                db,
                reference=f"apartment-rent-payment|{record.id}",
                sale_date=get_apartment_rent_payment_date(payload),
                business_area_id="rentals-apartments",
                amount=apartment_total_rent_paid(payload),
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
            sync_linked_online_order_from_service_record(record, record.module_key, db_session=db)
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
            sync_linked_online_order_from_service_record(record, record.module_key, db_session=db)
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
        items = online_order_sales_items(payload)
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
            pricing_multiplier = max(parse_amount(raw_item.get("pricingMultiplier") or 1), 1.0)
            line_total = round(quantity * unit_price * pricing_multiplier, 2)
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
                    "pricingMultiplier": pricing_multiplier,
                    "requestedDays": max(int(round(parse_amount(raw_item.get("requestedDays") or 0))), 0),
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
                    "expiryDate": product.expiry_date.isoformat() if product.expiry_date else "",
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
        mobile_money_in_scope = not selected_area or selected_area == "mobile-money"
        mobile_money_snapshot = mobile_money_day_snapshot(g.db, order_date)
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

        all_sales_rows = g.db.scalars(
            select(ModuleRecord).where(
                ModuleRecord.module_key == "sales",
                ModuleRecord.record_date == order_date,
            )
        ).all()
        daily_sales_by_area: dict[str, float] = defaultdict(float)
        for record in all_sales_rows:
            daily_sales_by_area[record.business_area_id or "shared-operations"] += parse_amount(record.amount)

        sales_query = select(ModuleRecord).where(
            ModuleRecord.module_key == "sales",
            ModuleRecord.record_date == order_date,
        )
        if selected_area:
            sales_query = sales_query.where(ModuleRecord.business_area_id == selected_area)
        sales_rows = g.db.scalars(sales_query).all()
        daily_sales_total = round(sum(parse_amount(record.amount) for record in sales_rows), 2)
        if mobile_money_in_scope and mobile_money_snapshot["usesReconciliationFallback"] and mobile_money_snapshot["recognizedSalesTotal"] > 0:
            daily_sales_total = round(daily_sales_total + mobile_money_snapshot["recognizedSalesTotal"], 2)

        reference = f"pos-closeout|{order_date.isoformat()}|{selected_area or 'all'}"
        closeout_record = g.db.scalar(
            select(ModuleRecord).where(
                ModuleRecord.module_key == "pos_closeouts",
                ModuleRecord.reference == reference,
            )
        )
        closeout_payload = serialize_module_record(closeout_record) if closeout_record else None
        cash_sales_total = pos_cash_sales_total(payment_mix)
        opening_cash = parse_amount(closeout_payload.get("openingCash")) if closeout_payload else 0.0
        closing_cash_counted = parse_amount(closeout_payload.get("closingCashCounted")) if closeout_payload else 0.0
        expected_closing_cash = pos_expected_closing_cash(opening_cash, cash_sales_total)
        cash_variance = pos_cash_variance(opening_cash, closing_cash_counted, cash_sales_total)
        if closeout_payload is not None:
            closeout_payload["cashSalesTotal"] = cash_sales_total
            closeout_payload["openingCash"] = opening_cash
            closeout_payload["closingCashCounted"] = closing_cash_counted
            closeout_payload["expectedClosingCash"] = expected_closing_cash
            closeout_payload["cashVariance"] = cash_variance

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
            "cashSalesTotal": cash_sales_total,
            "openingCash": opening_cash,
            "closingCashCounted": closing_cash_counted,
            "expectedClosingCash": expected_closing_cash,
            "cashVariance": cash_variance,
            "foodSalesTotal": round(
                sum(amount for area_key, amount in daily_sales_by_area.items() if area_key in POS_FOOD_SALES_AREA_IDS),
                2,
            ),
            "laundrySalesTotal": round(
                sum(amount for area_key, amount in daily_sales_by_area.items() if area_key in POS_LAUNDRY_SALES_AREA_IDS),
                2,
            ),
            "equipmentSalesTotal": round(
                sum(amount for area_key, amount in daily_sales_by_area.items() if area_key in POS_EQUIPMENT_SALES_AREA_IDS),
                2,
            ),
            "mobileMoneyInScope": mobile_money_in_scope,
            "mobileMoneySalesTotal": mobile_money_snapshot["recognizedSalesTotal"] if mobile_money_in_scope else 0.0,
            "mobileMoneyProfitTotal": mobile_money_snapshot["recognizedProfitTotal"] if mobile_money_in_scope else 0.0,
            "mobileMoneyHandledValue": mobile_money_snapshot["handledValueTotal"] if mobile_money_in_scope else 0.0,
            "mobileMoneyCompletedTransactions": mobile_money_snapshot["completedTransactionCount"] if mobile_money_in_scope else 0,
            "mobileMoneyReconciliationTotal": mobile_money_snapshot["reconciliationFeeTotal"] if mobile_money_in_scope else 0.0,
            "mobileMoneyReconciliationCount": mobile_money_snapshot["reconciliationCount"] if mobile_money_in_scope else 0,
            "mobileMoneyVariance": mobile_money_snapshot["varianceTotal"] if mobile_money_in_scope else 0.0,
            "mobileMoneyExpectedClosing": mobile_money_snapshot["expectedClosingTotal"] if mobile_money_in_scope else 0.0,
            "mobileMoneyClosingCounted": mobile_money_snapshot["closingCountedTotal"] if mobile_money_in_scope else 0.0,
            "mobileMoneyBalancedCount": mobile_money_snapshot["balancedCount"] if mobile_money_in_scope else 0,
            "mobileMoneyStatusLabel": mobile_money_snapshot["statusLabel"] if mobile_money_in_scope else "Outside Filter",
            "mobileMoneyUsesReconciliationFallback": mobile_money_in_scope and mobile_money_snapshot["usesReconciliationFallback"],
            "mobileMoneySourceLabel": mobile_money_snapshot["recognizedSourceLabel"] if mobile_money_in_scope else "Mobile Money",
            "mobileMoneySummaryNote": mobile_money_snapshot["summaryNote"] if mobile_money_in_scope else "Mobile money is outside the current area filter.",
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
            opening_cash = parse_amount(existing_payload.get("openingCash"))
            closing_cash_counted = parse_amount(existing_payload.get("closingCashCounted"))
            cash_sales_total = pos_cash_sales_total(summary["paymentMix"])
            expected_closing_cash = pos_expected_closing_cash(opening_cash, cash_sales_total)
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
                "cashSalesTotal": cash_sales_total,
                "openingCash": opening_cash,
                "closingCashCounted": closing_cash_counted,
                "expectedClosingCash": expected_closing_cash,
                "cashVariance": pos_cash_variance(opening_cash, closing_cash_counted, cash_sales_total),
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
                        "mobile_money_transactions",
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
        g.current_user = None
        needs_database = database_required_for_path(request.path or "/")
        if needs_database and not ensure_database_ready():
            g.db = None
            return database_unavailable_response()
        g.db = app.config["SESSION_LOCAL"]()

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

    def public_page(filename: str):
        return send_from_directory(Path(app_config.root_dir) / "website", filename, max_age=0)

    @app.route("/")
    def home():
        return public_page("index.html")

    @app.route("/shop")
    @app.route("/shop.html")
    def shop_page():
        return public_page("shop.html")

    @app.route("/food")
    @app.route("/food.html")
    @app.route("/kitchen")
    @app.route("/kitchen.html")
    def food_page():
        return public_page("food.html")

    @app.route("/services")
    @app.route("/services.html")
    def services_page():
        return public_page("services.html")

    @app.route("/services/laundry")
    @app.route("/services/laundry.html")
    @app.route("/laundry")
    @app.route("/laundry.html")
    def laundry_service_page():
        return public_page("laundry.html")

    @app.route("/services/equipment-rentals")
    @app.route("/services/equipment-rentals.html")
    @app.route("/equipment")
    @app.route("/equipment.html")
    def equipment_rentals_page():
        return public_page("equipment-rentals.html")

    @app.route("/vacancies")
    @app.route("/vacancies.html")
    def vacancies_page():
        return public_page("vacancies.html")

    @app.route("/contact")
    @app.route("/contact.html")
    def contact_page():
        return public_page("contact.html")

    @app.route("/track-order")
    @app.route("/track-order.html")
    def track_order_page():
        return public_page("track-order.html")

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

    @app.route("/api/leads", methods=["POST"])
    @app.route("/api/public/leads", methods=["POST"])
    def public_capture_lead():
        payload = request.get_json(silent=True) or {}
        customer_name = normalize_text(payload.get("customerName"))
        customer_phone = normalize_text(payload.get("customerPhone"))
        customer_email = normalize_text(payload.get("customerEmail"))
        if not customer_name:
            return jsonify({"ok": False, "errors": ["Customer name is required."]}), 400
        if not customer_phone and not customer_email:
            return jsonify({"ok": False, "errors": ["Phone number or email is required."]}), 400

        reference = customer_reference_key(customer_name, customer_phone, customer_email)
        if not reference:
            return jsonify({"ok": False, "errors": ["A valid contact is required."]}), 400

        lead_source = normalize_text(payload.get("leadSource")) or "Website"
        preferred_contact = normalize_text(payload.get("preferredContact")) or ("WhatsApp" if customer_phone else "Email")
        business_area_id = normalize_text(payload.get("businessAreaId")) or "shared-operations"
        interest_type = normalize_text(payload.get("interestType")) or "Website Interest"
        referral_name = normalize_text(payload.get("referralName"))
        existing = g.db.scalar(
            select(ModuleRecord).where(
                ModuleRecord.module_key == "customer_crm",
                ModuleRecord.reference == reference,
            )
        )
        notes_parts = [
            "Captured from the public OneRoot website lead form.",
            f"Interest: {interest_type}.",
            f"Referred by: {referral_name}." if referral_name else "",
            normalize_text(payload.get("notes")),
        ]
        crm_payload = dict(existing.payload or {}) if existing else {}
        crm_payload.update(
            {
                "id": crm_payload.get("id") or (existing.id if existing else uuid4().hex),
                "captureDate": crm_payload.get("captureDate") or date.today().isoformat(),
                "businessAreaId": business_area_id,
                "customerName": customer_name,
                "customerPhone": customer_phone,
                "customerEmail": customer_email,
                "customerSegment": "Lead",
                "leadSource": lead_source,
                "preferredContact": preferred_contact,
                "lastOrderDate": normalize_text(crm_payload.get("lastOrderDate")),
                "followUpDate": date.today().isoformat(),
                "lifetimeValue": parse_amount(crm_payload.get("lifetimeValue")),
                "status": "Follow Up",
                "notes": " ".join(part for part in notes_parts if part),
            }
        )
        record = existing or ModuleRecord(
            id=crm_payload["id"],
            module_key="customer_crm",
            created_at=datetime.utcnow(),
        )
        if not existing:
            g.db.add(record)
        set_module_record_metadata(record, MODULES["customer_crm"], crm_payload)
        sync_customer_crm_automation(g.db)
        audit(
            "customer_crm",
            "Customer CRM",
            "create" if not existing else "update",
            customer_name or "Website Lead",
            record.id,
            f"{lead_source} lead · {interest_type}",
        )
        g.db.commit()
        return jsonify({"ok": True, "message": "Lead captured.", "contactName": customer_name})

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
        g.db.flush()
        sync_service_records_for_online_order(record, db_session=g.db)
        sync_customer_crm_automation(g.db)
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
        if user_has_access(g.current_user, "customer_crm"):
            sync_customer_crm_automation(g.db)
            g.db.commit()
        all_records = g.db.scalars(select(ModuleRecord)).all()
        current_month = date.today().strftime("%Y-%m")
        latest_suite_profiles = latest_apartment_suite_profiles(all_records, support_phone=app_config.support_phone)
        tenant_reminders = build_tenant_reminder_queue(latest_suite_profiles)
        growth_context = build_growth_automation_context(g.db)
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
        apartment_due = round(sum(parse_amount(profile["outstanding"]) for profile in latest_suite_profiles), 2)
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
        apartment_watch = [
            profile
            for profile in latest_suite_profiles
            if parse_amount(profile["outstanding"]) > 0
        ][:8]
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
            recurring_due_count=len(recurring_due) + len(tenant_reminders),
            recurring_due=recurring_due[:8],
            maintenance_open_count=len(maintenance_open),
            maintenance_open=maintenance_open[:8],
            training_due_count=len(training_due),
            training_due=training_due[:8],
            attendance_today_count=len(attendance_today),
            apartment_watch=apartment_watch,
            tenant_reminders=tenant_reminders[:8],
            tenant_reminder_count=len(tenant_reminders),
            growth_context=growth_context,
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

    @app.route("/app/sales-summary")
    @access_required("sales_summary")
    def sales_summary_page():
        sale_date = parse_date(request.args.get("date")) or date.today()
        area_filter = normalize_text(request.args.get("area"))
        summary_context = daily_sales_summary_context(g.db, sale_date, area_filter)
        return render_template(
            "sales_summary.html",
            page_title="Daily Sales Summary",
            sale_date=sale_date.isoformat(),
            area_filter=area_filter,
            business_area_options=BUSINESS_AREA_OPTIONS,
            **summary_context,
        )

    @app.route("/app/sales-summary/export.csv")
    @access_required("sales_summary")
    def sales_summary_export():
        sale_date = parse_date(request.args.get("date")) or date.today()
        area_filter = normalize_text(request.args.get("area"))
        summary_context = daily_sales_summary_context(g.db, sale_date, area_filter)
        headers = [
            "salesDate",
            "areaId",
            "areaLabel",
            "salesTotal",
            "costTotal",
            "profitTotal",
            "marginPercent",
            "transactionCount",
            "recordCount",
            "averageSale",
            "sharePercent",
            "topSourceLabel",
            "topSourceAmount",
            "sourceSummary",
        ]
        rows = [{"salesDate": sale_date.isoformat(), **row} for row in summary_context["area_rows"]]
        suffix = f"-{area_filter}" if area_filter else ""
        return csv_download(
            f"oneroot-daily-sales-summary-{sale_date.isoformat()}{suffix}.csv",
            headers,
            rows,
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
            staff_role_descriptions=STAFF_ROLE_DESCRIPTIONS,
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
        linked_service_managed = bool(
            normalize_text(payload.get("linkedLaundryTicketId"))
            or normalize_text(payload.get("linkedEquipmentBookingId"))
            or online_order_items_for_service_module(payload, "laundry_tickets")
            or online_order_items_for_service_module(payload, "equipment_rental_bookings")
        )
        new_status = normalize_text(request.form.get("status")).lower() or order_before["status"]
        payment_status = (
            order_before["paymentStatus"]
            if linked_service_managed
            else (normalize_text(request.form.get("payment_status")).lower() or order_before["paymentStatus"])
        )
        quoted_total_raw = normalize_text(request.form.get("quoted_total"))
        paid_amount_raw = "" if linked_service_managed else normalize_text(request.form.get("paid_amount"))
        payment_date = order_before["paymentDate"] if linked_service_managed else normalize_text(request.form.get("payment_date"))
        staff_notes = normalize_text(request.form.get("staff_notes"))
        history_note = normalize_text(request.form.get("history_note"))

        quoted_total = order_before["totalAmount"] if linked_service_managed else (parse_amount(quoted_total_raw) if quoted_total_raw else order_before["totalAmount"])
        if not linked_service_managed and quoted_total <= 0:
            quoted_total = order_before["fixedTotal"]
        paid_amount = order_before["paidAmount"] if linked_service_managed else (parse_amount(paid_amount_raw) if paid_amount_raw else order_before["paidAmount"])
        if not linked_service_managed and payment_status == "paid" and paid_amount <= 0:
            paid_amount = quoted_total
        if not linked_service_managed and payment_status == "paid" and not payment_date:
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
        sync_service_records_for_online_order(record)
        sync_online_order_sales(record)
        post_online_order_inventory_if_needed(record)
        sync_customer_crm_automation(g.db)
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
        growth_context: dict[str, Any] | None = None
        if module_key in {"customer_crm", "promotions", "whatsapp_campaigns", "campaign_roi"}:
            sync_customer_crm_automation(g.db)
            g.db.commit()
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
            suite_profiles = [
                decorate_apartment_follow_up(profile, support_phone=app_config.support_phone)
                for profile in suite_profiles
            ]

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
            tenant_reminders = build_tenant_reminder_queue(suite_profiles)[:10]

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
                tenant_reminders=tenant_reminders,
                whatsapp_ready_count=sum(1 for item in suite_profiles if item["whatsappReady"]),
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
        mobile_money_reconciliation_summary = None
        mobile_money_live_snapshot = None
        automated_tenant_reminders: list[dict[str, Any]] = []
        automated_tenant_counts: dict[str, int] = {}
        if module_key == "mobile_money_transactions":
            provider_filter = normalize_text(request.args.get("provider"))
            if provider_filter:
                records = [
                    record
                    for record in records
                    if normalize_text((record.payload or {}).get("provider")) == provider_filter
                ]
            module_overview = build_module_overview(definition, records)
            reconciliation_records = g.db.scalars(
                select(ModuleRecord)
                .where(ModuleRecord.module_key == "mobile_money_reconciliations")
                .order_by(desc(ModuleRecord.record_date), desc(ModuleRecord.updated_at))
            ).all()
            recent_reconciliation_records = [
                record
                for record in reconciliation_records
                if not provider_filter or normalize_text((record.payload or {}).get("provider")) == provider_filter
            ][:8]
            reconciliation_records = [
                record
                for record in reconciliation_records
                if (not provider_filter or normalize_text((record.payload or {}).get("provider")) == provider_filter)
                and (not date_from or (record.record_date and record.record_date >= date_from))
                and (not date_to or (record.record_date and record.record_date <= date_to))
            ]
            mobile_money_reconciliation_summary = mobile_money_reconciliation_breakdown(reconciliation_records)
            snapshot_date = date_to or date_from or date.today()
            provider_values = sorted(
                {
                    normalize_text((record.payload or {}).get("provider"))
                    for record in records
                    if normalize_text((record.payload or {}).get("provider"))
                }
                | {
                    normalize_text((record.payload or {}).get("provider"))
                    for record in reconciliation_records
                    if normalize_text((record.payload or {}).get("provider"))
                }
            )
            snapshot_provider = provider_filter or (provider_values[0] if len(provider_values) == 1 else "MTN Mobile Money")
            mobile_money_live_snapshot = mobile_money_live_balance_snapshot(g.db, snapshot_date, snapshot_provider)
            if user_has_access(g.current_user, "mobile_money_reconciliations"):
                module_quick_actions.append(
                    {
                        "label": "Open Counter Closeout",
                        "href": url_for("module_list", module_key="mobile_money_reconciliations"),
                        "note": "Review opening balances, cash left, e-cash left, and daily close status.",
                    }
                )
            if user_has_access(g.current_user, "sales_summary"):
                module_quick_actions.append(
                    {
                        "label": "Open Daily Sales Summary",
                        "href": url_for("sales_summary_page", date=snapshot_date.isoformat(), area="mobile-money"),
                        "note": "See how mobile money feeds total daily sales and profit for the selected day.",
                    }
                )
            if user_has_access(g.current_user, "sales"):
                module_quick_actions.append(
                    {
                        "label": "Open Daily Sales",
                        "href": url_for("module_list", module_key="sales", date_from=snapshot_date.isoformat(), date_to=snapshot_date.isoformat()),
                        "note": "Review the sales ledger entries that are syncing from completed mobile money transactions.",
                    }
                )
            transaction_summary = mobile_money_transaction_breakdown(records)
            transaction_rows = build_mobile_money_transaction_rows(records)
            reconciliation_rows = build_mobile_money_reconciliation_rows(recent_reconciliation_records)
            status_chart = build_chart_rows(
                [
                    {"label": "Completed", "amount": transaction_summary["completedCount"]},
                    {"label": "Pending", "amount": transaction_summary["pendingCount"]},
                    {"label": "Reversed", "amount": transaction_summary["reversedCount"]},
                    {"label": "Cancelled", "amount": transaction_summary["cancelledCount"]},
                ],
                label_key="label",
                value_key="amount",
                short_key="label",
                positive_color="var(--accent)",
            )
            service_mix_chart = build_chart_rows(
                [
                    {"label": label, "amount": amount}
                    for label, amount in sorted(
                        transaction_summary["serviceFeeTotals"].items(),
                        key=lambda item: item[1],
                        reverse=True,
                    )[:8]
                ],
                label_key="label",
                value_key="amount",
                short_key="label",
            )
            today_reconciliation_record = next(
                (
                    record
                    for record in reconciliation_records
                    if record.record_date == snapshot_date
                    and normalize_text((record.payload or {}).get("provider")) == snapshot_provider
                ),
                None,
            )
            today_reconciliation_payload = dict(today_reconciliation_record.payload or {}) if today_reconciliation_record else {}
            today_closeout = {
                "hasRecord": bool(today_reconciliation_record),
                "cashExpected": mobile_money_live_snapshot["physicalCashAvailable"],
                "eCashExpected": mobile_money_live_snapshot["eCashAvailable"],
                "cashCounted": round(parse_amount(today_reconciliation_payload.get("closingCashCounted")), 2)
                if today_reconciliation_record
                else None,
                "eCashCounted": round(parse_amount(today_reconciliation_payload.get("closingECashCounted")), 2)
                if today_reconciliation_record
                else None,
                "cashVariance": mobile_money_variance(today_reconciliation_payload) if today_reconciliation_record else None,
                "eCashVariance": mobile_money_ecash_variance(today_reconciliation_payload) if today_reconciliation_record else None,
                "cashStatus": mobile_money_status(today_reconciliation_payload) if today_reconciliation_record else "Not Closed",
                "eCashStatus": mobile_money_ecash_status(today_reconciliation_payload) if today_reconciliation_record else "Not Closed",
                "feesCaptured": round(parse_amount(today_reconciliation_payload.get("serviceFees")), 2)
                if today_reconciliation_record
                else mobile_money_live_snapshot["feeTotal"],
                "cashMovedOut": round(parse_amount(today_reconciliation_payload.get("cashRemoved")), 2)
                if today_reconciliation_record
                else mobile_money_live_snapshot["cashRemoved"],
                "eCashMovedOut": round(parse_amount(today_reconciliation_payload.get("eCashRemoved")), 2)
                if today_reconciliation_record
                else mobile_money_live_snapshot["eCashRemoved"],
            }
            closeout_href = (
                url_for("module_form", module_key="mobile_money_reconciliations", record_id=today_reconciliation_record.id)
                if today_reconciliation_record
                else url_for(
                    "module_form",
                    module_key="mobile_money_reconciliations",
                    date=snapshot_date.isoformat(),
                    provider=snapshot_provider,
                )
            )
            closeout_label = "Update Closeout" if today_reconciliation_record else "Open / Close Day"
            provider_options = next((field.options for field in definition.fields if field.name == "provider"), [])
            return render_template(
                "mobile_money_counter.html",
                page_title=definition.label,
                definition=definition,
                search=search,
                provider_filter=provider_filter,
                status_filter=status_filter,
                category_filter=category_filter,
                date_from=date_from.isoformat() if date_from else "",
                date_to=date_to.isoformat() if date_to else "",
                transaction_rows=transaction_rows,
                transaction_summary=transaction_summary,
                reconciliation_summary=mobile_money_reconciliation_summary,
                reconciliation_rows=reconciliation_rows,
                mobile_money_live_snapshot=mobile_money_live_snapshot,
                today_closeout=today_closeout,
                snapshot_date=snapshot_date.isoformat(),
                snapshot_provider=snapshot_provider,
                provider_options=provider_options,
                status_options=module_status_options(definition, all_records),
                category_options=module_category_options(definition, all_records),
                category_filter_label=module_filter_category_label(definition),
                module_quick_actions=module_quick_actions,
                closeout_href=closeout_href,
                closeout_label=closeout_label,
                status_chart=status_chart,
                service_mix_chart=service_mix_chart,
            )
        if module_key == "mobile_money_reconciliations":
            snapshot_date = date_to or date_from or max((record.record_date for record in records if record.record_date), default=date.today())
            snapshot_provider = category_filter or (
                max(
                    (
                        normalize_text((record.payload or {}).get("provider"))
                        for record in records
                        if normalize_text((record.payload or {}).get("provider"))
                    ),
                    default="MTN Mobile Money",
                )
            )
            mobile_money_live_snapshot = mobile_money_live_balance_snapshot(g.db, snapshot_date, snapshot_provider)
            if user_has_access(g.current_user, "mobile_money_transactions"):
                module_quick_actions.append(
                    {
                        "label": "Open Mobile Money Sales",
                        "href": url_for("module_list", module_key="mobile_money_transactions"),
                        "note": "Capture MTN MoMo and SIM service fees before closing the daily reconciliation.",
                    }
                )
        if module_key == "sales" and user_has_access(g.current_user, "sales_summary"):
            module_quick_actions.append(
                {
                    "label": "Open Daily Sales Summary",
                    "href": url_for("sales_summary_page"),
                    "note": "See one-day totals by business area so cashiers can account quickly.",
                }
            )
        if module_key in {"customer_crm", "promotions", "whatsapp_campaigns", "campaign_roi"}:
            growth_context = build_growth_automation_context(g.db, area_filter=area_filter)
            if user_has_access(g.current_user, "customer_crm"):
                module_quick_actions.append(
                    {
                        "label": "Open Customer CRM",
                        "href": url_for("module_list", module_key="customer_crm"),
                        "note": "Work the live customer follow-up queue and identify repeat, VIP, and win-back contacts.",
                    }
                )
            if user_has_access(g.current_user, "whatsapp_campaigns"):
                module_quick_actions.append(
                    {
                        "label": "New WhatsApp Campaign",
                        "href": url_for("module_form", module_key="whatsapp_campaigns"),
                        "note": "Turn a segment or playbook into a tracked WhatsApp campaign record.",
                    }
                )
            if user_has_access(g.current_user, "promotions"):
                module_quick_actions.append(
                    {
                        "label": "New Promotion",
                        "href": url_for("module_form", module_key="promotions"),
                        "note": "Capture the offer, expected revenue, and target segment before launch.",
                    }
                )
        if module_key == "recurring_controls":
            full_tenant_reminder_queue = build_tenant_reminder_queue(
                latest_apartment_suite_profiles(g.db.scalars(select(ModuleRecord)).all(), support_phone=app_config.support_phone)
            )
            automated_tenant_reminders = full_tenant_reminder_queue[:12]
            automated_tenant_counts = {
                "total": len(full_tenant_reminder_queue),
                "overdue": sum(
                    1
                    for item in full_tenant_reminder_queue
                    if item["alertKey"] in {"rent-overdue", "bills-overdue", "rent-bills-overdue"}
                ),
                "dueSoon": sum(
                    1
                    for item in full_tenant_reminder_queue
                    if item["alertKey"] in {"rent-due-soon", "bills-due-soon", "rent-bills-due-soon"}
                ),
                "monthlyBills": sum(1 for item in full_tenant_reminder_queue if parse_amount(item.get("billsBalance")) > 0),
                "whatsappReady": sum(1 for item in full_tenant_reminder_queue if item.get("whatsappReady")),
            }
            if user_has_access(g.current_user, "apartments"):
                module_quick_actions.append(
                    {
                        "label": "Open Apartments",
                        "href": url_for("module_list", module_key="apartments", alert="overdue"),
                        "note": "Open the suites that need payment follow-up now.",
                    }
                )
            if user_has_access(g.current_user, "whatsapp_campaigns"):
                module_quick_actions.append(
                    {
                        "label": "Open WhatsApp Campaigns",
                        "href": url_for("module_list", module_key="whatsapp_campaigns"),
                        "note": "Keep manual campaign records and scripted follow-up in one place.",
                    }
                )
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
            automated_tenant_reminders=automated_tenant_reminders,
            automated_tenant_counts=automated_tenant_counts,
            growth_context=growth_context,
            mobile_money_reconciliation_summary=mobile_money_reconciliation_summary,
            mobile_money_live_snapshot=mobile_money_live_snapshot,
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
        if module_key == "mobile_money_transactions":
            provider_filter = normalize_text(request.args.get("provider"))
            if provider_filter:
                records = [
                    record
                    for record in records
                    if normalize_text((record.payload or {}).get("provider")) == provider_filter
                ]
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

        record_payload = dict(record.payload if record else {})
        if not record and module_key in {"mobile_money_transactions", "mobile_money_reconciliations"}:
            query_date = parse_date(request.args.get("date"))
            query_provider = normalize_text(request.args.get("provider"))
            if query_date:
                record_payload["date"] = query_date.isoformat()
            if query_provider:
                record_payload["provider"] = query_provider
        if request.method == "POST":
            payload = dict(record_payload)
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
                raw_line_items = normalize_text(request.form.get("lineItemsJson"))
                if raw_line_items:
                    try:
                        parsed_line_items = json.loads(raw_line_items)
                    except json.JSONDecodeError:
                        parsed_line_items = []
                    if isinstance(parsed_line_items, list):
                        payload[SERVICE_LINE_ITEMS_KEY] = parsed_line_items
                payload["businessAreaId"] = SERVICE_MODULE_AREA_IDS[module_key]
                hydrate_service_cost_payload(g.db, module_key, payload)
                sync_service_line_item_rollup(module_key, payload)
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
            elif module_key == "mobile_money_reconciliations":
                payload["businessAreaId"] = "mobile-money"
            elif module_key == "mobile_money_transactions":
                payload["businessAreaId"] = "mobile-money"
                payload["floatImpact"] = normalize_text(payload.get("floatImpact")) or mobile_money_default_float_impact(payload.get("serviceType"))
                payload["profitAmount"] = round(parse_amount(payload.get("salesAmount")) - parse_amount(payload.get("costAmount")), 2)
            elif module_key == "sales":
                payload["sourceType"] = normalize_text(payload.get("sourceType")) or "manual-sale"
                payload["profitAmount"] = round(parse_amount(payload.get("amount")) - parse_amount(payload.get("costAmount")), 2)
            payload["updatedAt"] = datetime.utcnow().isoformat()
            form_errors = mobile_money_form_errors(module_key, payload)
            if form_errors:
                record_payload = payload
                for message in form_errors:
                    flash(message, "error")
            else:
                if not record:
                    record = ModuleRecord(id=payload["id"], module_key=module_key, created_at=datetime.utcnow())
                    g.db.add(record)
                set_module_record_metadata(record, definition, payload)
                sync_generated_sales_for_module_record(record)
                if module_key in {"customer_crm", "apartments", "laundry_tickets", "equipment_rental_bookings", "delivery_dispatch"}:
                    sync_customer_crm_automation(g.db)
                audit(module_key, definition.label, "update" if record_id else "create", record.title, record.id)
                g.db.commit()
                flash(f"{definition.label} saved.", "success")
                return redirect(url_for("module_list", module_key=module_key))

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
        elif module_key == "mobile_money_reconciliations":
            record_payload.setdefault("businessAreaId", "mobile-money")
            record_payload.setdefault("date", date.today().isoformat())
            record_payload.setdefault("provider", "MTN Mobile Money")
            preview_snapshot = mobile_money_live_balance_snapshot(
                g.db,
                parse_date(record_payload.get("date")) or date.today(),
                normalize_text(record_payload.get("provider")),
            )
            setup_profile = dict(MOBILE_MONEY_STARTUP_PROFILES.get(normalize_text(record_payload.get("provider")) or "MTN Mobile Money") or {})
            if not normalize_text(record_payload.get("openingCash")):
                record_payload["openingCash"] = preview_snapshot["openingCash"]
            if not normalize_text(record_payload.get("openingECash")):
                record_payload["openingECash"] = preview_snapshot["openingECash"]
            if not normalize_text(record_payload.get("cashTopUpSource")) and normalize_text(setup_profile.get("cashTopUpSource")):
                record_payload["cashTopUpSource"] = normalize_text(setup_profile.get("cashTopUpSource"))
            if not normalize_text(record_payload.get("eCashTopUpSource")) and normalize_text(setup_profile.get("eCashTopUpSource")):
                record_payload["eCashTopUpSource"] = normalize_text(setup_profile.get("eCashTopUpSource"))
        elif module_key == "mobile_money_transactions":
            record_payload.setdefault("businessAreaId", "mobile-money")
            record_payload.setdefault("date", date.today().isoformat())
            record_payload.setdefault("provider", "MTN Mobile Money")
            record_payload.setdefault("floatImpact", mobile_money_default_float_impact(record_payload.get("serviceType")))
            record_payload.setdefault("status", "Completed")
            record_payload["profitAmount"] = round(parse_amount(record_payload.get("salesAmount")) - parse_amount(record_payload.get("costAmount")), 2)
        elif module_key == "job_vacancies":
            record_payload.setdefault("postedDate", date.today().isoformat())
            record_payload.setdefault("vacancyStatus", "Open")
            record_payload.setdefault("employmentType", "Full-Time")
            record_payload.setdefault("contactPerson", "OneRoot Essentials Recruitment")
            record_payload.setdefault("applicationPhone", app_config.whatsapp_number)
            record_payload.setdefault("applicationEmail", app_config.support_email)
            record_payload.setdefault("howToApply", default_job_vacancy_apply_text(app_config))
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
            sync_service_line_item_rollup(module_key, record_payload)
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
                        "note": "Open the item to edit stock, price, and the picture used on the service desk and website.",
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
                        "id": product.id,
                        "name": product.name,
                        "category": product.category,
                        "salesPrice": round(parse_amount(product.sales_price), 2),
                        "costPrice": round(parse_amount(product.cost_price), 2),
                        "imageUrl": product_image_src(product),
                        "notes": normalize_text(product.notes),
                    }
                    for product in inventory_reference_products
                ],
                existing_line_items=service_line_items(module_key, record_payload),
                service_payment_summary=service_payment_summary(module_key, record_payload),
            )
        module_quick_actions = []
        mobile_money_day_helper = None
        mobile_money_live_snapshot = None
        if module_key == "mobile_money_reconciliations":
            mobile_money_day_helper = mobile_money_transaction_day_rollup(
                g.db,
                parse_date(record_payload.get("date")),
                normalize_text(record_payload.get("provider")),
            )
        if module_key in {"mobile_money_transactions", "mobile_money_reconciliations"}:
            mobile_money_live_snapshot = mobile_money_live_balance_snapshot(
                g.db,
                parse_date(record_payload.get("date")) or date.today(),
                normalize_text(record_payload.get("provider")),
            )
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
            mobile_money_day_helper=mobile_money_day_helper,
            mobile_money_live_snapshot=mobile_money_live_snapshot,
            today_iso=date.today().isoformat(),
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
                "mobile-money-transaction",
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
                provider=normalize_text(request.form.get("provider")),
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
        if reclassify_legacy_inventory_products(g.db):
            g.db.commit()
        editing_id = normalize_text(request.args.get("edit"))
        editing_product = find_inventory_product(g.db, editing_id) if editing_id else None
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
            product = find_inventory_product(g.db, product_id)
            is_new = product is None
            if not product:
                product = Product(id=product_id, created_at=datetime.utcnow())
                g.db.add(product)
            try:
                existing_image_url = normalize_text(product.image_url)
                existing_sku = normalize_text(product.sku)
                product.updated_at = datetime.utcnow()
                product.source_catalog_id = normalize_text(product.source_catalog_id) or product.id
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
                product.expiry_date = parse_date(request.form.get("expiry_date"))
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
                        expiry=normalize_text(request.args.get("expiry")),
                    )
                )
            except ValueError as error:
                g.db.rollback()
                editing_product = product
                flash(str(error), "error")
            except Exception:
                g.db.rollback()
                editing_product = product
                app.logger.exception("Inventory save failed for %s", product_id)
                flash("That item could not be saved. Please check the item type, category, and image fields.", "error")

        q = normalize_text(request.args.get("q"))
        area_filter = normalize_text(request.args.get("area"))
        category_filter = normalize_text(request.args.get("category"))
        expiry_filter = normalize_text(request.args.get("expiry")).lower()
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
        if expiry_filter:
            products = [item for item in products if product_matches_expiry_filter(item, expiry_filter)]
        expired_count = sum(1 for item in products if item.active and product_expiry_status(item)["isExpired"])
        expiring_soon_count = sum(1 for item in products if item.active and product_expiry_status(item)["isExpiringSoon"])
        low_stock_count = sum(
            1
            for item in products
            if product_tracks_inventory(item) and item.active and item.quantity_on_hand <= item.min_stock_level
        )
        active_count = sum(1 for item in products if item.active)
        service_count = sum(1 for item in products if normalized_product_item_type(item.item_type, item.track_inventory) == "service")
        stock_value = round(sum(item.quantity_on_hand * item.cost_price for item in products if product_tracks_inventory(item)), 2)
        discard_value = round(
            sum(
                item.quantity_on_hand * item.cost_price
                for item in products
                if product_tracks_inventory(item) and product_expiry_status(item)["isExpired"]
            ),
            2,
        )
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
            expiry_filter=expiry_filter,
            low_stock_count=low_stock_count,
            active_count=active_count,
            service_count=service_count,
            stock_value=stock_value,
            expired_count=expired_count,
            expiring_soon_count=expiring_soon_count,
            discard_value=discard_value,
            product_image_src=product_image_src,
            product_tracks_inventory=product_tracks_inventory,
            format_product_stock_badge=format_product_stock_badge,
            product_expiry_status=product_expiry_status,
        )

    @app.route("/app/inventory/barcode", methods=["GET", "POST"])
    @access_required("inventory_barcode")
    def inventory_barcode():
        barcode_value = normalize_text(request.values.get("barcode"))
        action_type = normalize_text(request.values.get("actionType")).lower() or "add"
        quantity_value = round(parse_amount(request.values.get("quantity")), 2) or 1.0
        note_value = normalize_text(request.values.get("note"))
        matching_product = None

        if barcode_value:
            matching_product = g.db.scalar(
                select(Product).where(
                    or_(
                        Product.barcode.ilike(barcode_value),
                        Product.sku.ilike(barcode_value),
                    )
                )
            )

        if request.method == "POST":
            if not barcode_value:
                flash("Scan or enter a barcode first.", "error")
            elif not matching_product:
                flash("No stock item matched that barcode or SKU.", "error")
            elif not product_tracks_inventory(matching_product):
                flash("That item is saved as a service item and does not use stock quantity.", "warning")
            else:
                previous_quantity = round(parse_amount(matching_product.quantity_on_hand), 2)
                quantity_value = max(quantity_value, 0)
                if action_type == "set":
                    new_quantity = quantity_value
                    action_label = "set"
                elif action_type == "remove":
                    new_quantity = max(previous_quantity - quantity_value, 0)
                    action_label = "reduced"
                else:
                    new_quantity = previous_quantity + quantity_value
                    action_label = "added"
                matching_product.quantity_on_hand = round(new_quantity, 2)
                matching_product.quantity_known = True
                audit(
                    "inventory",
                    "Inventory",
                    "update",
                    matching_product.name,
                    matching_product.id,
                    f"Barcode stock update {action_label} {quantity_value:,.2f}. {previous_quantity:,.2f} -> {new_quantity:,.2f}. {note_value}".strip(),
                )
                g.db.commit()
                flash(
                    f"{matching_product.name} updated from {previous_quantity:,.2f} to {new_quantity:,.2f}.",
                    "success",
                )
                return redirect(url_for("inventory_barcode"))

        recent_stock_items = g.db.scalars(
            select(Product)
            .where(Product.track_inventory.is_(True), Product.active.is_(True))
            .order_by(desc(Product.updated_at), Product.name.asc())
            .limit(12)
        ).all()
        return render_template(
            "inventory_barcode.html",
            page_title="Barcode Stock Update",
            barcode_value=barcode_value,
            action_type=action_type,
            quantity_value=quantity_value,
            note_value=note_value,
            matching_product=matching_product,
            recent_stock_items=recent_stock_items,
            business_area_short=BUSINESS_AREA_SHORT,
            format_product_stock_badge=format_product_stock_badge,
        )

    @app.route("/app/inventory/<product_id>/delete", methods=["POST"])
    @access_required("inventory")
    def inventory_delete(product_id: str):
        product = find_inventory_product(g.db, product_id)
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
                expiry=normalize_text(request.form.get("expiry")),
            )
        )

    @app.route("/app/inventory/export.csv")
    @access_required("inventory")
    def inventory_export():
        q = normalize_text(request.args.get("q"))
        area_filter = normalize_text(request.args.get("area"))
        category_filter = normalize_text(request.args.get("category"))
        expiry_filter = normalize_text(request.args.get("expiry")).lower()
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
        if expiry_filter:
            products = [item for item in products if product_matches_expiry_filter(item, expiry_filter)]
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
        sync_customer_crm_automation(g.db)
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
        sync_customer_crm_automation(g.db)
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
        opening_cash_raw = parse_amount(payload.get("openingCash"))
        closing_cash_counted_raw = parse_amount(payload.get("closingCashCounted"))
        if opening_cash_raw < 0 or closing_cash_counted_raw < 0:
            return jsonify({"ok": False, "error": "Opening cash and counted close cash cannot be below zero."}), 400

        reference = f"pos-closeout|{summary['orderDate']}|{area_id or 'all'}"
        record = g.db.scalar(
            select(ModuleRecord).where(
                ModuleRecord.module_key == "pos_closeouts",
                ModuleRecord.reference == reference,
            )
        )
        is_existing = record is not None
        existing_payload = dict(record.payload or {}) if record else {}
        cash_sales_total = pos_cash_sales_total(summary["paymentMix"])
        expected_closing_cash = pos_expected_closing_cash(opening_cash_raw, cash_sales_total)
        closeout_payload = {
            "id": record.id if record else uuid4().hex,
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
            "cashSalesTotal": cash_sales_total,
            "openingCash": opening_cash_raw,
            "closingCashCounted": closing_cash_counted_raw,
            "expectedClosingCash": expected_closing_cash,
            "cashVariance": pos_cash_variance(opening_cash_raw, closing_cash_counted_raw, cash_sales_total),
            "orderNumbers": [order["orderNumber"] for order in summary["orders"]],
            "closedAt": datetime.utcnow().isoformat(),
            "closedBy": g.current_user.full_name or g.current_user.username,
            "notes": normalize_text(payload.get("notes"))
            or normalize_text(existing_payload.get("notes"))
            or f"Counter closeout for {summary['areaLabel']} on {summary['orderDate']}.",
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
            "mobile_money_expected_closing": mobile_money_expected_closing,
            "static_asset_version": current_static_asset_version(),
        }

    return app
