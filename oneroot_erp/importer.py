from __future__ import annotations

import hashlib
import json
from datetime import date, datetime
from pathlib import Path
from typing import Any
from uuid import uuid4

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .config import AppConfig
from .models import AuditLog, ModuleRecord, PosOrder, PosOrderLine, Product, User
from .registry import BUSINESS_AREA_LABELS, LEGACY_TO_MODULE, MODULES


def _normalize_text(value: Any) -> str:
    return " ".join(str(value or "").split())


def _parse_date(value: Any) -> date | None:
    raw = _normalize_text(value)

    if not raw:
        return None

    try:
        return date.fromisoformat(raw[:10])
    except ValueError:
        return None


def _normalize_month(value: Any) -> str:
    raw = _normalize_text(value)
    return raw[:7] if len(raw) >= 7 else ""


def _parse_amount(value: Any) -> float:
    try:
        return round(float(value or 0), 2)
    except (TypeError, ValueError):
        return 0.0


def _ensure_title(module_key: str, payload: dict[str, Any]) -> str:
    definition = MODULES.get(module_key)

    if definition and definition.title_field:
        title = _normalize_text(payload.get(definition.title_field))
        if title:
            if definition.title_field == "businessAreaId":
                return BUSINESS_AREA_LABELS.get(title, title)
            return title

    for candidate in (
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
        title = _normalize_text(payload.get(candidate))
        if title:
            if candidate == "businessAreaId":
                return BUSINESS_AREA_LABELS.get(title, title)
            return title

    return definition.label if definition else module_key.replace("_", " ").title()


def _supplier_outstanding(payload: dict[str, Any]) -> float:
    return round(max(_parse_amount(payload.get("amountDue")) - _parse_amount(payload.get("amountPaid")), 0), 2)


def _supplier_status(payload: dict[str, Any]) -> str:
    amount_due = _parse_amount(payload.get("amountDue"))
    amount_paid = _parse_amount(payload.get("amountPaid"))
    outstanding = _supplier_outstanding(payload)

    if amount_due > 0 and outstanding == 0:
        return "Paid"
    if amount_paid > 0:
        return "Part Paid"

    due_date = _parse_date(payload.get("dueDate"))
    if due_date and due_date < date.today():
        return "Overdue"
    return "Due"


def _mobile_money_expected_closing(payload: dict[str, Any]) -> float:
    expected = (
        _parse_amount(payload.get("openingCash"))
        + _parse_amount(payload.get("cashTopUp"))
        + _parse_amount(payload.get("cashInValue"))
        + _parse_amount(payload.get("serviceFees"))
        - _parse_amount(payload.get("cashOutValue"))
        - _parse_amount(payload.get("cashRemoved"))
        - _parse_amount(payload.get("operatingExpense"))
    )
    return round(expected, 2)


def _mobile_money_variance(payload: dict[str, Any]) -> float:
    return round(_parse_amount(payload.get("closingCashCounted")) - _mobile_money_expected_closing(payload), 2)


def _mobile_money_status(payload: dict[str, Any]) -> str:
    variance = _mobile_money_variance(payload)
    if abs(variance) < 0.01:
        return "Balanced"
    return "Over Counted" if variance > 0 else "Short"


def _recurring_status(payload: dict[str, Any]) -> str:
    active_state = _normalize_text(payload.get("activeState") or payload.get("state")).lower()
    is_active = active_state != "paused" if active_state else bool(payload.get("active", True))

    if not is_active:
        return "Paused"

    next_due_date = _parse_date(payload.get("nextDueDate"))
    if next_due_date:
        if next_due_date < date.today():
            return "Overdue"
        if (next_due_date - date.today()).days <= 7:
            return "Due Soon"
    return "Scheduled"


def _maintenance_amount(payload: dict[str, Any]) -> float:
    actual_cost = _parse_amount(payload.get("actualCost"))
    return actual_cost if actual_cost > 0 else _parse_amount(payload.get("estimatedCost"))


def _ensure_status(module_key: str, payload: dict[str, Any]) -> str:
    if module_key == "suppliers":
        return _supplier_status(payload)
    if module_key == "mobile_money_reconciliations":
        return _mobile_money_status(payload)
    if module_key == "recurring_controls":
        return _recurring_status(payload)

    definition = MODULES.get(module_key)
    if definition and definition.status_field:
        return _normalize_text(payload.get(definition.status_field))
    return _normalize_text(payload.get("status") or payload.get("occupancyStatus") or payload.get("sourceType"))


def _ensure_reference(module_key: str, payload: dict[str, Any]) -> str:
    if module_key == "sales" and _normalize_text(payload.get("sourceType")) == "pos-summary":
        return _normalize_text(payload.get("linkedGeneratedSalesKey"))
    if module_key == "apartments":
        suite = _normalize_text(payload.get("suite"))
        month_key = _normalize_month(payload.get("month"))
        payload_id = _normalize_text(payload.get("id"))
        if suite and month_key and payload_id:
            return f"{suite}|{month_key}|{payload_id[:8]}"
        if suite and month_key:
            return f"{suite}|{month_key}"
        if suite:
            return suite

    for candidate in (
        "reference",
        "orderNumber",
        "linkedGeneratedSalesKey",
        "suite",
        "tenantIdRef",
        "sku",
    ):
        value = _normalize_text(payload.get(candidate))
        if value:
            return value
    return ""


def _ensure_amount(module_key: str, payload: dict[str, Any]) -> float:
    if module_key == "mobile_money_reconciliations":
        return abs(_mobile_money_variance(payload))
    if module_key == "maintenance_records":
        return _maintenance_amount(payload)

    definition = MODULES.get(module_key)
    if definition and definition.amount_field:
        return _parse_amount(payload.get(definition.amount_field))

    for candidate in ("amount", "totalAmount", "amountDue", "amountPaid", "currentValue"):
        value = _parse_amount(payload.get(candidate))
        if value:
            return value

    return 0.0


def _ensure_business_area(payload: dict[str, Any]) -> str:
    area = _normalize_text(payload.get("businessAreaId") or payload.get("businessArea"))
    if area in BUSINESS_AREA_LABELS:
        return area
    if any(key in payload for key in ("rentCycleType", "nextRentDueDate", "billDueDate", "waterBill", "tenantName")):
        return "rentals-apartments"
    if any(key in payload for key in ("depositExpected", "depositPaid", "chargesRaised", "refundDue")):
        return "rentals-apartments"
    return ""


def _module_record_from_payload(module_key: str, payload: dict[str, Any]) -> ModuleRecord:
    payload_id = _normalize_text(payload.get("id")) or uuid4().hex
    definition = MODULES[module_key]
    return ModuleRecord(
        id=payload_id,
        module_key=module_key,
        title=_ensure_title(module_key, payload),
        reference=_ensure_reference(module_key, payload) or None,
        status=_ensure_status(module_key, payload),
        business_area_id=_ensure_business_area(payload),
        month=_normalize_month(payload.get(definition.month_field) if definition.month_field else payload.get("month")),
        record_date=_parse_date(payload.get(definition.date_field) if definition.date_field else payload.get("date")),
        amount=_ensure_amount(module_key, payload),
        payload=payload,
        created_at=datetime.fromisoformat(payload.get("createdAt", datetime.utcnow().isoformat()).replace("Z", "+00:00")).replace(tzinfo=None)
        if _normalize_text(payload.get("createdAt"))
        else datetime.utcnow(),
        updated_at=datetime.fromisoformat(payload.get("updatedAt", payload.get("createdAt", datetime.utcnow().isoformat())).replace("Z", "+00:00")).replace(tzinfo=None)
        if _normalize_text(payload.get("updatedAt") or payload.get("createdAt"))
        else datetime.utcnow(),
    )


def _refresh_existing_module_records(session: Session) -> None:
    for record in session.scalars(select(ModuleRecord)).all():
        definition = MODULES.get(record.module_key)
        payload = dict(record.payload or {})
        if not definition or not payload:
            continue

        record.title = _ensure_title(record.module_key, payload)
        record.reference = _ensure_reference(record.module_key, payload) or None
        record.status = _ensure_status(record.module_key, payload)
        record.business_area_id = _ensure_business_area(payload)
        record.month = _normalize_month(
            payload.get(definition.month_field) if definition.month_field else payload.get("month")
        )
        record.record_date = _parse_date(
            payload.get(definition.date_field) if definition.date_field else payload.get("date")
        )
        record.amount = _ensure_amount(record.module_key, payload)


def _hash_password(password: str) -> str:
    return f"sha256:{hashlib.sha256(password.encode('utf-8')).hexdigest()}"


def _pick_latest_snapshot(config: AppConfig) -> Path | None:
    candidates = []
    for pattern in (
        "oneroot-restore-merged-*.json",
        "oneroot-hosted-workspace-latest.json",
    ):
        candidates.extend(config.outputs_dir.glob(pattern))

    seed_path = config.data_dir / "public" / "oneroot-hosted-workspace-seed.json"
    if seed_path.exists():
        candidates.append(seed_path)

    if not candidates:
        return None

    return max(candidates, key=lambda item: item.stat().st_mtime)


def _load_workspace_payload(snapshot_path: Path) -> dict[str, Any]:
    payload = json.loads(snapshot_path.read_text(encoding="utf-8"))
    return payload.get("workspace", payload)


def _load_online_orders(config: AppConfig) -> list[dict[str, Any]]:
    orders_path = config.data_dir / "orders.json"
    if not orders_path.exists():
        return []

    try:
        payload = json.loads(orders_path.read_text(encoding="utf-8"))
        return payload if isinstance(payload, list) else []
    except json.JSONDecodeError:
        return []


def bootstrap_database(session: Session, config: AppConfig) -> None:
    users_count = session.scalar(select(func.count()).select_from(User)) or 0
    products_count = session.scalar(select(func.count()).select_from(Product)) or 0
    records_count = session.scalar(select(func.count()).select_from(ModuleRecord)) or 0
    pos_orders_count = session.scalar(select(func.count()).select_from(PosOrder)) or 0

    snapshot_path = _pick_latest_snapshot(config)
    workspace = _load_workspace_payload(snapshot_path) if snapshot_path else {}
    snapshot_users = workspace.get("userProfiles", []) if isinstance(workspace.get("userProfiles", []), list) else []

    if users_count == 0 and not snapshot_users:
        session.add(
            User(
                id="workspace-owner",
                username=config.admin_username.lower(),
                full_name="Philip Boakye",
                role="owner",
                phone=config.support_phone,
                password_hash=_hash_password(config.admin_password),
                active=True,
                login_enabled=True,
                notes="Bootstrap owner account for the rebuilt OneRoot operations platform.",
            )
        )

    if products_count or records_count or pos_orders_count:
        _refresh_existing_module_records(session)
        session.commit()
        return

    for user_payload in workspace.get("userProfiles", []):
        username = _normalize_text(user_payload.get("username")).lower()
        if not username:
            continue
        existing = session.get(User, _normalize_text(user_payload.get("id")) or username)
        if existing:
            continue
        session.add(
            User(
                id=_normalize_text(user_payload.get("id")) or username,
                username=username,
                full_name=_normalize_text(user_payload.get("fullName")) or username,
                role=_normalize_text(user_payload.get("role")) or "staff",
                phone=_normalize_text(user_payload.get("phone")),
                password_hash=_normalize_text(user_payload.get("passwordHash")) or _hash_password(config.admin_password),
                active=bool(user_payload.get("active", True)),
                login_enabled=bool(user_payload.get("loginEnabled", True)),
                notes=_normalize_text(user_payload.get("notes")),
            )
        )

    for item in workspace.get("inventoryItems", []):
        product_id = _normalize_text(item.get("id"))
        name = _normalize_text(item.get("name"))
        if not product_id or not name:
            continue
        session.add(
            Product(
                id=product_id,
                source_catalog_id=_normalize_text(item.get("sourceCatalogId")),
                sku=_normalize_text(item.get("sku")),
                barcode=_normalize_text(item.get("barcode")),
                name=name,
                business_area_id=_ensure_business_area(item),
                category=_normalize_text(item.get("category")),
                source_category=_normalize_text(item.get("sourceCategory")),
                item_type=_normalize_text(item.get("itemType")) or "stock",
                track_inventory=bool(item.get("trackInventory", True)),
                quantity_on_hand=_parse_amount(item.get("quantityOnHand")),
                quantity_known=bool(item.get("quantityKnown", True)),
                min_stock_level=int(item.get("minStockLevel") or 0),
                sales_price=_parse_amount(item.get("salesPrice")),
                cost_price=_parse_amount(item.get("costPrice")),
                active=bool(item.get("active", True)),
                user_created=bool(item.get("userCreated", False)),
                notes=_normalize_text(item.get("notes")),
            )
        )

    for order in workspace.get("posOrders", []):
        order_id = _normalize_text(order.get("id")) or uuid4().hex
        order_date = _parse_date(order.get("orderDate")) or date.today()
        business_area_ids = order.get("businessAreaIds") or []
        session_order = PosOrder(
            id=order_id,
            order_number=_normalize_text(order.get("orderNumber")) or f"POS-{order_date.strftime('%Y%m%d')}-{order_id[:4].upper()}",
            order_date=order_date,
            business_area_ids=business_area_ids if isinstance(business_area_ids, list) else [],
            primary_business_area_id=_ensure_business_area({"businessAreaId": order.get("businessAreaId")}) or (business_area_ids[0] if business_area_ids else ""),
            payment_method=_normalize_text(order.get("paymentMethod")) or "Cash",
            customer_name=_normalize_text(order.get("customerName")),
            customer_phone=_normalize_text(order.get("customerPhone")),
            notes=_normalize_text(order.get("notes")),
            item_count=_parse_amount(order.get("itemCount")),
            subtotal=_parse_amount(order.get("subtotal")),
            total_amount=_parse_amount(order.get("totalAmount")),
        )
        for index, line in enumerate(order.get("items", []), start=1):
            session_order.lines.append(
                PosOrderLine(
                    id=f"{order_id}:{index}",
                    position=index,
                    product_id=_normalize_text(line.get("productId")),
                    business_area_id=_ensure_business_area(line) or session_order.primary_business_area_id,
                    sku=_normalize_text(line.get("sku")),
                    barcode=_normalize_text(line.get("barcode")),
                    name=_normalize_text(line.get("name")),
                    category=_normalize_text(line.get("category")),
                    item_type=_normalize_text(line.get("itemType")) or "stock",
                    track_inventory=bool(line.get("trackInventory", True)),
                    quantity=_parse_amount(line.get("quantity")) or 1,
                    unit_price=_parse_amount(line.get("unitPrice")),
                    total_amount=_parse_amount(line.get("totalAmount")),
                )
            )
        session.add(session_order)

    for collection_name, records in workspace.items():
        module_key = LEGACY_TO_MODULE.get(collection_name)
        if not module_key or collection_name in {"inventoryItems", "posOrders", "userProfiles", "auditTrail"}:
            continue
        if not isinstance(records, list):
            continue
        for payload in records:
            if not isinstance(payload, dict):
                continue
            session.add(_module_record_from_payload(module_key, payload))

    for order in _load_online_orders(config):
        if not isinstance(order, dict):
            continue
        session.add(_module_record_from_payload("online_orders", order))

    for audit_entry in workspace.get("auditTrail", []):
        if not isinstance(audit_entry, dict):
            continue
        audit_id = _normalize_text(audit_entry.get("id")) or uuid4().hex
        created_at = datetime.utcnow()
        timestamp = _normalize_text(audit_entry.get("timestamp") or audit_entry.get("createdAt") or audit_entry.get("updatedAt"))
        if timestamp:
            created_at = datetime.fromisoformat(timestamp.replace("Z", "+00:00")).replace(tzinfo=None)
        session.add(
            AuditLog(
                id=audit_id,
                module_key=_normalize_text(audit_entry.get("moduleKey") or audit_entry.get("module")) or "workspace",
                module_label=_normalize_text(audit_entry.get("moduleLabel") or audit_entry.get("module")) or "Workspace",
                action=_normalize_text(audit_entry.get("action")) or "update",
                title=_normalize_text(audit_entry.get("title")) or "Imported activity",
                detail=_normalize_text(audit_entry.get("detail")),
                record_id=_normalize_text(audit_entry.get("recordId")),
                actor_id=_normalize_text(audit_entry.get("actorId")),
                actor_name=_normalize_text(audit_entry.get("actorName")) or "Workspace User",
                actor_role=_normalize_text(audit_entry.get("actorRole")) or "staff",
                entry_count=int(audit_entry.get("entryCount") or 1),
                created_at=created_at,
            )
        )

    _refresh_existing_module_records(session)
    session.commit()
