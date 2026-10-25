"""Private family support ledger, separate from business expenses and profit."""
import calendar
from datetime import date

from sqlalchemy import select
from .models import AppSetting, ModuleRecord

RECIPIENTS = {"mum": ("Mum", 800.0), "dad": ("Dad", 600.0)}


def cycle_date(first, offset):
    month = first.year * 12 + first.month - 1 + offset * 2
    year, index = divmod(month, 12)
    return date(year, index + 1, min(first.day, calendar.monthrange(year, index + 1)[1]))


def support_context(db, today):
    setting = db.get(AppSetting, "owner-family-support")
    raw = (setting.value or {}).get("firstDueDate") if setting else ""
    first = date.fromisoformat(raw) if raw else None
    payments = db.scalars(select(ModuleRecord).where(ModuleRecord.module_key == "family_support_payments")
                          .order_by(ModuleRecord.record_date.desc(), ModuleRecord.created_at.desc())).all()
    totals = {}
    for r in payments:
        p = r.payload or {}
        key = (p.get("recipient"), p.get("dueDate"))
        totals[key] = round(totals.get(key, 0) + float(p.get("amountPaid", 0)), 2)
    cycles = []
    if first:
        for offset in range(600):
            due = cycle_date(first, offset)
            for key, (name, amount) in RECIPIENTS.items():
                paid = totals.get((key, due.isoformat()), 0)
                remaining = round(max(amount-paid, 0), 2)
                cycles.append(dict(recipient=key, name=name, due=due, amount=amount, paid=paid, remaining=remaining,
                                   status="Paid" if not remaining else ("Overdue" if due < today else "Due Today" if due == today else "Upcoming")))
            if due > today:
                break
    return dict(first=first, cycles=cycles, payments=payments,
                outstanding=round(sum(r["remaining"] for r in cycles if r["due"] <= today), 2),
                due_count=sum(r["remaining"] > 0 and r["due"] <= today for r in cycles))
