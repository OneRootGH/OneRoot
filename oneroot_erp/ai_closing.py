"""Server-side closing preparation. Expected balances are never actual counts."""
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo
from sqlalchemy import select, text
from .models import AppSetting, AuditLog, ModuleRecord, User
from .cash_controls import COUNT_FIELDS, cash_mode, find_snapshot, overall_cash_summary

FIRST_RUN = date(2026, 10, 29)


def prepare_due_closings(db, movement_context, now=None):
    now = now or datetime.now(ZoneInfo("Africa/Accra"))
    if now.date() < FIRST_RUN or now.hour < 2:
        return 0
    if db.bind.dialect.name == "postgresql":
        db.execute(text("SELECT pg_advisory_xact_lock(hashtext('oneroot-ai-closing'))"))
    checkpoint = db.get(AppSetting, "ai-closing-checkpoint")
    start = date.fromisoformat(checkpoint.value["lastPrepared"]) + timedelta(days=1) if checkpoint else FIRST_RUN-timedelta(days=1)
    end = now.date()-timedelta(days=1)
    count = 0
    for offset in range(min((end-start).days+1, 31)):
        day = start+timedelta(days=offset)
        identity = "ai-closing-"+day.isoformat()
        if not db.get(ModuleRecord, identity):
            user = db.get(User, "oneroot-ai-closing")
            if not user:
                user = User(id="oneroot-ai-closing",username="oneroot-ai-closing",full_name="OneRoot AI Closing Assistant",
                            role="viewer",active=False,login_enabled=False,notes="Non-login system actor for preparation only.")
                db.add(user)
            opening = find_snapshot(db,day,"Opening")
            closing = find_snapshot(db,day,"Closing")
            movements = movement_context(db,day)
            summary = overall_cash_summary({},opening.payload if opening else None,movements)
            payload = dict(date=day.isoformat(),preparedAt=now.isoformat(),preparedBy=user.full_name,
                openingId=opening.id if opening else "",openingUpdatedAt=opening.updated_at.isoformat() if opening else "",
                sourceSignature=movements["signature"],expectedTotal=summary["expected"],
                expectedAccounts=summary["wallets"],warnings=movements["warnings"],actualCounts=None,
                existingClosingId=closing.id if closing else "",cashMode=cash_mode(opening.payload or {}) if opening else "Combined")
            db.add(ModuleRecord(id=identity,module_key="daily_cash_ai_preparations",title=f"AI closing preparation {day}",
                record_date=day,status="AI Prepared - Awaiting Daniel's Count",payload=payload))
            task_id="ai-closing-review-"+str(day)
            if not db.get(ModuleRecord,task_id):
                db.add(ModuleRecord(id=task_id,module_key="business_calendar",title=f"Count and review AI closing for {day}",
                    record_date=now.date(),status="Active",payload=dict(title=f"Count and review AI closing for {day}",
                    officer="Daniel Agyei",frequency="Daily",nextDueDate=now.date().isoformat(),dueTime="07:00",reminderTime="07:00",
                    reminder="Enabled",status="Active",notes=f"Open /app/daily-cash?date={day}&entryType=Closing. Finish expenses, transfers and MTN payments. Enter actual balances; investigate differences and confirm review before opening the next day. AI has not counted or approved cash.")))
            db.add(AuditLog(id="audit-"+identity,module_key="daily_cash_positions",module_label="AI Closing Preparation",
                action="ai-prepare",title=str(day),record_id=identity,actor_id=user.id,actor_name=user.full_name,actor_role="system",
                detail="Expected balances prepared only. Actual counts left blank. No financial transactions or approvals created."))
            count+=1
        checkpoint=checkpoint or AppSetting(key="ai-closing-checkpoint")
        checkpoint.value=dict(lastPrepared=day.isoformat())
        db.add(checkpoint)
        db.flush()
    db.commit()
    return count
