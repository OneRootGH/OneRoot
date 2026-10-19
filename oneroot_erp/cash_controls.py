"""Dated cash counts and source-backed comparisons; never creates revenue."""
from datetime import date, timedelta
import math

from sqlalchemy import desc, select

from .models import ModuleRecord


COUNT_FIELDS = ("groceriesCash", "foodCash", "momoCash", "momoECash", "groceriesPetty", "foodPetty")
WALLETS = {
    "groceries": ("Groceries counter cash", "Main Cash Drawer", "groceries"),
    "food": ("Cold Store & Kitchen counter cash", "Main Cash Drawer", "cold-store-groceries"),
    "groceriesPetty": ("Groceries petty cash", "Petty Cash Float", "groceries"),
    "foodPetty": ("Cold Store & Kitchen petty cash", "Petty Cash Float", "cold-store-groceries"),
    "momoCash": ("MoMo physical cash", "MTN MoMo Physical Cash Float", "mobile-money"),
    "momoECash": ("MoMo phone e-cash", "MTN MoMo E-Cash Float", "mobile-money"),
    "owner": ("Owner / external funds", "", "shared-operations"),
    "bank": ("Business bank account", "Business Bank Account", "shared-operations"),
}


def money(value):
    try:
        number = float(str(value).replace(",", ""))
    except (ValueError, TypeError):
        raise ValueError("Enter zero or a positive amount in each money box.")
    if not math.isfinite(number) or number < 0:
        raise ValueError("Amounts cannot be negative or invalid.")
    return round(number, 2)


def snapshot_id(day, entry_type):
    return f"daily-cash-{day.isoformat()}-{entry_type.lower()}"


def find_snapshot(db, day, entry_type):
    record = db.get(ModuleRecord, snapshot_id(day, entry_type))
    if not record and entry_type == "Closing":
        record = db.get(ModuleRecord, "daily-cash-" + day.isoformat())
    return record if record and record.module_key == "daily_cash_positions" else None


def cash_mode(payload):
    if payload.get("cashMode") in {"Separate", "Combined"}:
        return payload["cashMode"]
    return "Combined" if "combined" in str(payload.get("notes", "")).lower() else "Separate"


def latest_close(db, before):
    records = db.scalars(select(ModuleRecord).where(ModuleRecord.module_key == "daily_cash_positions",
        ModuleRecord.record_date < before).order_by(desc(ModuleRecord.record_date), desc(ModuleRecord.updated_at))).all()
    return next((r for r in records if (r.payload or {}).get("entryType", "Closing") == "Closing"), None)


def summarize_counts(payload):
    for key in COUNT_FIELDS:
        payload[key] = money(payload.get(key))
    if cash_mode(payload) == "Combined":
        payload["groceriesCash"] = money(payload.get("combinedCash"))
        payload["foodCash"] = 0.0
        if payload["groceriesPetty"] + payload["foodPetty"] > payload["groceriesCash"]:
            raise ValueError("Total petty cash cannot exceed the combined shop cash.")
    else:
        for prefix in ("groceries", "food"):
            if payload[prefix + "Petty"] > payload[prefix + "Cash"]:
                raise ValueError("Petty cash cannot exceed the cash counted for that shop.")
    payload.update(
        groceriesRemaining=round(payload["groceriesCash"] - payload["groceriesPetty"], 2),
        foodRemaining=round(payload["foodCash"] - payload["foodPetty"], 2),
        combinedCash=round(payload["groceriesCash"] + payload["foodCash"], 2),
        pettyTotal=round(payload["groceriesPetty"] + payload["foodPetty"], 2),
        totalPhysical=round(payload["groceriesCash"] + payload["foodCash"] + payload["momoCash"], 2),
    )
    payload["combinedRemaining"] = round(payload["combinedCash"] - payload["pettyTotal"], 2)
    if cash_mode(payload) == "Combined":
        payload["groceriesRemaining"] = payload["foodRemaining"] = 0.0
    return payload


def compare_counts(counted, baseline, effects, *, combined=False):
    """A missing baseline yields unknown, never a zero-based shortage."""
    if baseline is None:
        return []
    keys = [("combinedCash", "Combined shop cash")] if combined else [
        ("groceriesCash", "Groceries total physical cash"), ("foodCash", "Cold Store total physical cash")]
    keys += [("groceriesPetty", "Groceries petty cash"), ("foodPetty", "Cold Store petty cash"),
             ("momoCash", "MoMo physical cash"), ("momoECash", "MoMo e-cash")]
    rows = []
    for key, label in keys:
        if key == "combinedCash":
            opening = sum(float(baseline.get(k, 0) or 0) for k in ("groceriesCash", "foodCash"))
            movement = sum(effects.get(k, 0) for k in ("groceriesCash", "foodCash"))
            actual = sum(float(counted.get(k, 0) or 0) for k in ("groceriesCash", "foodCash"))
        else:
            opening = float(baseline.get(key, 0) or 0)
            movement = effects.get(key, 0)
            actual = float(counted.get(key, 0) or 0)
        expected = round(opening + movement, 2)
        rows.append(dict(key=key, label=label, opening=opening, movement=round(movement, 2),
                         expected=expected, actual=actual, variance=round(actual - expected, 2)))
    return rows


def review_needed(comparison, warnings):
    return bool(warnings or any(abs(row["variance"]) >= .01 for row in comparison))
