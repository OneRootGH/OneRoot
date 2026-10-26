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


def reconciliation_guidance(comparison):
    """Explain differences without inventing a balancing transfer or receipt."""
    wallets = [r for r in comparison if r["key"] not in {"groceriesPetty", "foodPetty"}
               and not r.get("allocation")]
    differences = [r for r in wallets if abs(r["variance"]) >= .01]
    total = round(sum(r["variance"] for r in wallets), 2) if wallets else None
    messages = []
    if total is not None and differences and abs(total) < .01:
        messages.append("The overall money balances, but it is in different wallets. Check shop-to-MoMo transfers or the counter allocation; do not enter another sale.")
    for row in differences:
        if row["expected"] < 0:
            messages.append(f"{row['label']}: expected balance is negative. Check for a missing opening balance, receipt or transfer in, or a duplicated outgoing payment.")
    for debit in [r for r in differences if r["variance"] < 0]:
        for credit in [r for r in differences if r["variance"] > 0]:
            if abs(debit["variance"] + credit["variance"]) < .01:
                messages.append(f"Possible unrecorded transfer: {abs(debit['variance']):.2f} from {debit['label']} to {credit['label']}. Confirm the actual movement before recording it.")
    if differences and not messages:
        messages.append("Review the receipt details, payment methods, expenses and transfers for this date. Do not change the counted money merely to match the expected amount.")
    return dict(messages=messages, difference=total, balanced=bool(wallets) and not differences)


def opening_comparison(counted, baseline, *, combined=False):
    rows = compare_counts(counted, baseline, {}, combined=combined)
    rows = [row for row in rows if row["key"] not in {"groceriesPetty", "foodPetty"}]
    if counted.get("openingBasis") == "Petty allocation":
        for row in rows:
            if row["key"] in {"groceriesCash", "foodCash", "combinedCash"}:
                row.update(allocation=True, expected=None, variance=0.0)
                row["label"] = row["label"].replace("total physical cash", "petty cash allocated for today")
    return rows


def overall_cash_summary(counted, baseline, movements):
    """Petty is included in shop cash. Internal transfers cancel across wallets."""
    keys = ("groceriesCash", "foodCash", "momoCash", "momoECash")
    actual = round(sum(float(counted.get(k, 0) or 0) for k in keys), 2)
    if baseline is None:
        return dict(actual=actual, opening=None, movement=None, expected=None, variance=None, wallets=[])
    rows = []
    for key in keys:
        lines = [r for r in movements["lines"] if r["wallet"] == key]
        transfers = [r for r in lines if str(r.get("reference", "")).startswith("cash-control|")]
        transfer_in = round(sum(r["effect"] for r in transfers if r["effect"] > 0), 2)
        transfer_out = round(-sum(r["effect"] for r in transfers if r["effect"] < 0), 2)
        other = [r for r in lines if r not in transfers]
        incoming = round(sum(r["effect"] for r in other if r["effect"] > 0), 2)
        outgoing = round(-sum(r["effect"] for r in other if r["effect"] < 0), 2)
        opening = round(float(baseline.get(key, 0) or 0), 2)
        expected = round(opening + movements["effects"].get(key, 0), 2)
        rows.append(dict(key=key, opening=opening, incoming=incoming, outgoing=outgoing,
                         transferIn=transfer_in, transferOut=transfer_out, expected=expected))
    opening = round(sum(r["opening"] for r in rows), 2)
    movement = round(sum(movements["effects"].get(k, 0) for k in keys), 2)
    expected = round(opening + movement, 2)
    return dict(actual=actual, opening=opening, movement=movement, expected=expected,
                variance=round(actual-expected, 2), wallets=rows)
