"""Private Kumasi project fund; legacy parental support is preserved as history."""
import calendar
import math
from datetime import date

from sqlalchemy import select
from .models import AppSetting, ModuleRecord
from .registry import SUITE_NAMES

RECIPIENTS = {"project": ("Kumasi Rental Project", 1400.0)}
PROJECTS = {
    "kumasi": dict(name="Kumasi Rental Project — Mum & Dad", landStatus="Not Recorded", developmentStatus="Planning"),
    "medie": dict(name="Medie", landStatus="Purchased", developmentStatus="Development Ongoing"),
    "samsam": dict(name="Samsam", landStatus="Purchased", developmentStatus="Development Ongoing"),
    "sefwi-wiawso": dict(name="Sefwi Wiawso", landStatus="Purchased", developmentStatus="Not Started"),
}

PROJECT_REGISTERS = {
    "stages": ("Not Started", "In Progress", "Completed", "On Hold"),
    "tasks": ("Open", "In Progress", "Completed", "Blocked"),
    "contractors": ("Proposed", "Active", "Completed", "On Hold"),
    "units": ("Planned", "Under Construction", "Ready", "Handed Over"),
    "documents": ("Pending", "Received", "Approved", "Expired"),
}

PROJECT_NAME_OPTIONS = {
    "stages": ["Land & Site Preparation", "Survey & Design", "Permits & Approvals", "Excavation & Foundation",
               "Ground Floor Slab", "Blockwork & Structural Frame", "Roofing", "Plumbing & Drainage",
               "Electrical Installation", "Plastering & Screeding", "Doors & Windows", "Tiling & Flooring",
               "Painting & Finishes", "Kitchen & Bathroom Fittings", "External Works & Landscaping",
               "Testing, Inspection & Handover"],
    "tasks": ["Site clearing", "Boundary verification", "Prepare drawings", "Obtain building permit",
              "Order construction materials", "Inspect foundation", "Inspect blockwork", "Inspect roofing",
              "Plumbing pressure test", "Electrical safety inspection", "Repair water leak", "Repair wall cracks",
              "Repair roof leak", "Fix drainage", "Replace damaged tiles", "Repair door / window",
              "Painting touch-up", "Final cleaning", "Snag inspection", "Unit handover"],
    "documents": ["Land Purchase Agreement", "Indenture / Conveyance", "Site Plan", "Land Registration Document",
                  "Survey Report", "Architectural Drawings", "Structural Drawings", "Building Permit",
                  "Bill of Quantities", "Contractor Agreement", "Supplier Quotation", "Invoice", "Payment Receipt",
                  "Progress Photograph", "Inspection Report", "Electrical Test Report", "Completion Certificate",
                  "Warranty", "Unit Handover Checklist", "Tenancy Agreement"],
}


def project_name_options(db, project):
    options = {key: list(PROJECT_NAME_OPTIONS.get(key, [])) for key in PROJECT_REGISTERS}
    options["units"] = list(SUITE_NAMES)
    records = db.scalars(select(ModuleRecord).where(ModuleRecord.module_key.in_(
        ["supplier_directory", "suppliers", "apartments"]))).all()
    for record in records:
        payload = record.payload or {}
        if record.module_key == "apartments":
            name = str(payload.get("suite") or "").strip()
            kind = "units"
        else:
            name = str(payload.get("supplierName") or record.title or "").strip()
            kind = "contractors"
        if name:
            options[kind].append(name)
    for kind in options:
        options[kind].extend(row["title"] for row in project.get(kind, []))
        unique = {}
        for name in options[kind]:
            unique.setdefault(name.casefold(), name)
        options[kind] = list(unique.values())
    return options


def project_register_entry(form, identity):
    kind = form.get("register", "")
    status = form.get("status", "")
    choice = (form.get("titleChoice") or "").strip()
    title = (choice if choice and choice != "__custom__" else form.get("title") or "").strip()[:200]
    if kind not in PROJECT_REGISTERS or status not in PROJECT_REGISTERS[kind] or not title:
        raise ValueError("Enter a title and choose a valid register and status.")
    row = dict(id=identity, title=title, status=status)
    for key in ("responsible", "notes", "reference", "stageId"):
        row[key] = (form.get(key) or "").strip()[:2000]
    for key in ("startDate", "dueDate"):
        raw = form.get(key) or ""
        row[key] = date.fromisoformat(raw).isoformat() if raw else ""
    if row["startDate"] and row["dueDate"] and row["dueDate"] < row["startDate"]:
        raise ValueError("The due date cannot precede the start date.")
    for key in ("budget", "progress", "monthlyRent"):
        value = float(form.get(key) or 0)
        if not math.isfinite(value) or value < 0 or (key == "progress" and value > 100):
            raise ValueError("Amounts must be positive and progress must be between 0 and 100.")
        row[key] = round(value, 2)
    if kind == "stages" and status == "Completed":
        row["progress"] = 100
    if row["reference"] and not row["reference"].startswith("https://"):
        raise ValueError("Document links must start with https://. Use notes for paper-file references.")
    return kind, row


def project_management_context(project, payments, today):
    registers = {key: [dict(row) for row in project.get(key, [])] for key in PROJECT_REGISTERS}
    spending = [r for r in payments if (r.payload or {}).get("entryType") == "Project Spending"]
    for kind in ("stages", "contractors"):
        for row in registers[kind]:
            link = "stageId" if kind == "stages" else "contractorId"
            row["paid"] = round(sum(float(r.payload.get("amountPaid", 0)) for r in spending
                                    if r.payload.get(link) == row["id"]), 2)
            row["remaining"] = round(row.get("budget", 0) - row["paid"], 2)
    for rows in registers.values():
        for row in rows:
            row["overdue"] = bool(row.get("dueDate") and row["dueDate"] < today.isoformat()
                                  and row["status"] not in {"Completed", "Handed Over", "Approved"})
    budget = round(sum(r.get("budget", 0) for r in registers["stages"]), 2)
    actual = round(sum(float(r.payload.get("amountPaid", 0)) for r in spending), 2)
    stages = registers["stages"]
    progress = (sum(r.get("progress", 0) * r.get("budget", 0) for r in stages) / budget if budget
                else sum(r.get("progress", 0) for r in stages) / len(stages) if stages else None)
    return dict(registers=registers, budget=budget, actual=actual, budgetRemaining=round(budget-actual, 2),
                progress=round(progress, 1) if progress is not None else None,
                contractorOutstanding=round(sum(max(r["remaining"], 0) for r in registers["contractors"]), 2),
                rentPotential=round(sum(r.get("monthlyRent", 0) for r in registers["units"]), 2),
                overdue=sum(r["overdue"] for rows in registers.values() for r in rows),
                unallocated=round(sum(float(r.payload.get("amountPaid", 0)) for r in spending if not r.payload.get("stageId")), 2))


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
    return dict(management=project_management_context(projects[project_id], payments, today), first=first, cycles=cycles, payments=payments,
                allPayments=all_payments, projects=projects, projectId=project_id, project=projects[project_id],
                contributions=round(contributions,2), spending=round(spending,2), balance=round(contributions-spending,2),
                outstanding=round(sum(r["remaining"] for r in cycles if r["due"] <= today), 2),
                due_count=sum(r["remaining"] > 0 and r["due"] <= today for r in cycles))
