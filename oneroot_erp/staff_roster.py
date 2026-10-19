"""Reporting windows are a roster, not a source of paid attendance hours."""
from datetime import datetime
import hashlib

from sqlalchemy import select, text

from .models import ModuleRecord


DAY_GROUPS = {
    "Monday to Wednesday": {0, 1, 2}, "Thursday to Saturday": {3, 4, 5},
    "Monday to Saturday": set(range(6)), "Sunday": {6}, "Every day": set(range(7)),
    **{name: {index} for index, name in enumerate(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"])},
}
DEFAULT_REPORTING_SCHEDULE = [
    ("Suzzy Agyemang", "Monday to Wednesday", "07:00", "20:00", "Required"),
    ("Suzzy Agyemang", "Thursday to Saturday", "07:00", "18:00", "Required"),
    ("Suzzy Agyemang", "Sunday", "11:00", "18:00", "Optional"),
    ("Daniel Agyei", "Monday to Saturday", "07:00", "23:00", "Optional based on availability"),
    ("Daniel Agyei", "Sunday", "11:30", "23:00", "Required"),
    ("Philip Boakye", "Every day", "", "", "Support when available"),
    ("Faustina Nti Nyamekye Alexandra", "Thursday to Saturday", "06:30", "20:00", "Required"),
    ("Faustina Nti Nyamekye Alexandra", "Monday to Wednesday", "06:30", "18:00", "Required"),
]


def ensure_reporting_schedule(db, set_metadata, definition):
    if db.bind.dialect.name == "postgresql":
        db.execute(text("SELECT pg_advisory_xact_lock(hashtext('staff-reporting-schedule-seed'))"))
    for name, days, start, end, requirement in DEFAULT_REPORTING_SCHEDULE:
        identity = "reporting-" + hashlib.sha256(f"{name}|{days}".encode()).hexdigest()[:24]
        if db.get(ModuleRecord, identity):
            continue
        payload = dict(id=identity, staffName=name, days=days, startTime=start, endTime=end,
                       requirement=requirement, status="Active", notes="")
        row = ModuleRecord(id=identity, module_key="staff_reporting_schedule")
        set_metadata(row, definition, payload)
        db.add(row)
    db.commit()


def reporting_rows(records, day=None):
    rows = []
    for record in records:
        p = record.payload or {}
        if day and (p.get("status") != "Active" or day.weekday() not in DAY_GROUPS.get(p.get("days"), set())):
            continue
        def display_clock(value):
            try:
                return datetime.strptime(value or "", "%H:%M").strftime("%I:%M %p").lstrip("0")
            except ValueError:
                return "Flexible"
        rows.append(dict(id=record.id, name=p.get("staffName"), days=p.get("days"),
                         start=display_clock(p.get("startTime")), end=display_clock(p.get("endTime")),
                         requirement=p.get("requirement"), status=p.get("status"), notes=p.get("notes", "")))
    return sorted(rows, key=lambda row: (row["name"] or "", row["days"] or ""))


def reporting_form_errors(payload, records, record_id=""):
    errors = []
    if payload.get("days") not in DAY_GROUPS:
        errors.append("Choose a valid day or group of days.")
    start, end = payload.get("startTime", ""), payload.get("endTime", "")
    if payload.get("requirement") != "Support when available" or start or end:
        try:
            begin, finish = datetime.strptime(start, "%H:%M"), datetime.strptime(end, "%H:%M")
            if finish <= begin:
                errors.append("Closing time must be later than start time for this reporting window.")
        except (TypeError, ValueError):
            errors.append("Enter valid start and closing times, or choose Support when available with both times blank.")
    if payload.get("status") == "Active":
        for r in records:
            p = r.payload or {}
            if (r.id != record_id and p.get("status") == "Active"
                    and (p.get("staffName") or "").strip().casefold() == (payload.get("staffName") or "").strip().casefold()
                    and DAY_GROUPS.get(p.get("days"), set()) & DAY_GROUPS.get(payload.get("days"), set())):
                errors.append("This staff member already has an active reporting window on one of these days. Edit that entry first.")
                break
    return errors
