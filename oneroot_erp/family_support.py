"""Private Kumasi project fund; legacy parental support is preserved as history."""
import calendar
from datetime import date

from sqlalchemy import select
from .models import AppSetting, ModuleRecord

RECIPIENTS = {"project": ("Kumasi Rental Project", 1400.0)}
PROJECTS = {
    "kumasi": dict(name="Kumasi Rental Project — Mum & Dad", landStatus="Not Recorded", developmentStatus="Planning"),
    "medie": dict(name="Medie", landStatus="Purchased", developmentStatus="Development Ongoing"),
    "samsam": dict(name="Samsam", landStatus="Purchased", developmentStatus="Development Ongoing"),
    "sefwi-wiawso": dict(name="Sefwi Wiawso", landStatus="Purchased", developmentStatus="Not Started"),
}


def property_projects(db):
    settings = db.scalars(select(AppSetting).where(AppSetting.key.like("owner-property-project|%"))).all()
    saved = {s.key.split("|",1)[1]: s.value or {} for s in settings}
    return {key: dict(default, **saved.get(key, {})) for key, default in PROJECTS.items()}


def cycle_date(first, offset):
    month = first.year * 12 + first.month - 1 + offset * 2
    year, index = divmod(month, 12)
    return date(year, index + 1, min(first.day, calendar.monthrange(year, index + 1)[1]))


def support_context(db, today, project_id="kumasi"):
    projects = property_projects(db)
    setting = db.get(AppSetting, "owner-family-support")
    raw = (setting.value or {}).get("firstDueDate") if setting else ""
    first = date.fromisoformat(raw) if raw and project_id == "kumasi" else None
    all_payments = db.scalars(select(ModuleRecord).where(ModuleRecord.module_key == "family_support_payments")
                          .order_by(ModuleRecord.record_date.desc(), ModuleRecord.created_at.desc())).all()
    payments = [r for r in all_payments if (r.payload or {}).get("projectId", "kumasi") == project_id]
    totals = {}
    contributions = spending = 0.0
    for r in payments:
        p = r.payload or {}
        if p.get("recipient") != "project":
            continue  # Keep any old direct-support payments as history, not project savings.
        amount = float(p.get("amountPaid", 0))
        if p.get("entryType") == "Project Spending":
            spending += amount
            continue
        contributions += amount
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
                allPayments=all_payments, projects=projects, projectId=project_id, project=projects[project_id],
                contributions=round(contributions,2), spending=round(spending,2), balance=round(contributions-spending,2),
                outstanding=round(sum(r["remaining"] for r in cycles if r["due"] <= today), 2),
                due_count=sum(r["remaining"] > 0 and r["due"] <= today for r in cycles))
