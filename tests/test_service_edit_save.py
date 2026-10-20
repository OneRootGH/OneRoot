from dataclasses import replace
from datetime import date, datetime, timedelta
from pathlib import Path
from tempfile import TemporaryDirectory
from io import BytesIO
import unittest
from unittest.mock import patch

from sqlalchemy import select

from oneroot_erp.app import (create_app, set_module_record_metadata, sync_customer_loyalty_accounts,
                             prepaid_balance, responsibility_occurs, profit_detail_rows,
                             daily_sales_summary_context, report_area_rows, calendar_task_rows)
from oneroot_erp.app import daily_cash_movement_context
from oneroot_erp.cash_controls import find_snapshot
from oneroot_erp.staff_roster import reporting_rows, reporting_form_errors
from oneroot_erp.config import load_config
from oneroot_erp.models import AppSetting, AuditLog, Base, ModuleRecord, Product, User
from oneroot_erp.registry import MODULES


class ServiceEditSaveTests(unittest.TestCase):
    def test_attention_credit_groups_payments_and_excludes_internal_kitchen(self):
        db = self.sessions()
        for identity, name, phone, kind, amount in [
            ("owed", "Ama", "0240000011", "Credit Sale", 100),
            ("paid", "Amaa", "0240000011", "Payment Received", 40),
            ("internal", "OneRoot Kitchen", "", "Credit Sale", 500)]:
            db.add(ModuleRecord(id=identity, module_key="customer_credit_accounts", payload=dict(
                customerName=name, customerPhone=phone, transactionType=kind, amount=amount,
                dueDate=(date.today()-timedelta(days=2)).isoformat())))
        db.commit()
        page = self.client.get("/app/attention?kind=Overdue+credit").get_data(as_text=True)
        self.assertIn("GH₵60.00", page)
        self.assertNotIn("GH₵500.00", page)

    def test_individual_expense_grant_preserves_role_and_finance_restrictions(self):
        db = self.sessions()
        self.assertEqual(self.client.post("/app/users/cashier/expense-access", data={"enabled": "yes"}).status_code, 302)
        self.assertTrue(db.get(AppSetting, "expense-access|cashier").value["enabled"])
        db.expire_all()
        self.assertEqual(db.get(User, "cashier").role, "cashier")
        with self.client.session_transaction() as session:
            session["user_id"] = "cashier"
        self.assertEqual(self.client.get("/app/modules/expenses/new").status_code, 200)
        self.assertEqual(self.client.post("/app/users/owner/expense-access", data={"enabled": "yes"}).status_code, 403)
        self.assertNotEqual(self.client.get("/app/users").status_code, 200)
        self.assertNotEqual(self.client.get("/app/attention").status_code, 200)

    def test_attention_review_is_audited_and_source_change_reopens(self):
        db = self.sessions()
        source = ModuleRecord(id="variance-pos", module_key="pos_closeouts", title="Groceries closeout",
                              record_date=date.today(), payload={"cashVariance": -15, "closedBy": "Staff"})
        db.add(source); db.commit()
        page = self.client.get("/app/attention")
        self.assertEqual(page.status_code, 200)
        from oneroot_erp.review_inbox import exception_item
        i = exception_item("pos_closeouts", source.id, source.title, -15, date.today(), "Staff", "", "", "", source.payload)
        data = dict(key=i["key"], fingerprint=i["fingerprint"], action="Resolve", note="Recount checked", reviewVersion="")
        self.assertEqual(self.client.post("/app/attention", data=data).status_code, 302)
        db.expire_all()
        self.assertEqual(db.get(ModuleRecord, source.id).payload["cashVariance"], -15)
        review = db.get(ModuleRecord, "review-" + i["key"])
        self.assertEqual(review.status, "Resolved")
        self.assertTrue(db.scalar(select(AuditLog).where(AuditLog.module_key == "exception_reviews")))
        self.assertEqual(self.client.post("/app/attention", data=data).status_code, 409)
        db = self.sessions()
        source = db.get(ModuleRecord, "variance-pos")
        source.payload = {"cashVariance": -20, "closedBy": "Staff"}; db.add(source); db.commit()
        page = self.client.get("/app/attention").get_data(as_text=True)
        self.assertIn("Source changed since the earlier review", page)

    def test_promotions_opens_without_rebuilding_crm_or_campaigns(self):
        db = self.sessions()
        promo = ModuleRecord(id="test-promotion", module_key="promotions", title="Weekend Offer",
                             payload=dict(title="Weekend Offer", status="Running"))
        db.add(promo)
        db.commit()
        with patch("oneroot_erp.app.sync_customer_crm_automation") as crm, \
             patch("oneroot_erp.app.sync_marketing_campaign_automation") as campaigns, \
             patch("oneroot_erp.app.sync_customer_loyalty_accounts") as loyalty:
            for path in ["/app/modules/promotions", "/app/modules/promotions?q=Weekend", "/app/modules/promotions/new"]:
                response = self.client.get(path)
                self.assertEqual(response.status_code, 200)
            crm.assert_not_called()
            campaigns.assert_not_called()
            loyalty.assert_not_called()
        self.assertIn("Weekend Offer", self.client.get("/app/modules/promotions").get_data(as_text=True))

    def test_revised_calendar_reminders_and_flexible_tasks(self):
        self.client.get("/app/modules/business_calendar")
        db = self.sessions()
        tasks = db.scalars(select(ModuleRecord).where(ModuleRecord.module_key == "business_calendar")).all()
        rows = calendar_task_rows(db, tasks, date(2026, 10, 25), db.get(User, "owner"),
                                  days=1, now=datetime(2026, 10, 25, 10, 30))
        gutter = next(r for r in rows if r["title"] == "Cleaning of gutters")
        self.assertEqual(gutter["time"], "Anytime")
        self.assertEqual(gutter["reminderTime"], "10:30")
        self.assertTrue(gutter["remind"])
        self.assertEqual(gutter["status"], "Upcoming")
        self.assertNotIn("Cooking for staff", [r["title"] for r in rows])
        monday = calendar_task_rows(db, tasks, date(2026, 10, 26), db.get(User, "owner"),
                                    days=1, now=datetime(2026, 10, 26, 7, 20))
        toilet = next(r for r in monday if r["title"].startswith("Cleaning of toilets"))
        self.assertEqual(toilet["officer"], "Faustina Nti Nyamekye Alexandra")
        self.assertTrue(toilet["remind"])
        self.assertEqual(toilet["time"], "07:30")

    def test_reporting_timetable_matches_requested_days_and_preserves_edits(self):
        self.assertEqual(self.client.get("/app/modules/staff_reporting_schedule").status_code, 200)
        db = self.sessions()
        records = db.scalars(select(ModuleRecord).where(ModuleRecord.module_key == "staff_reporting_schedule")).all()
        self.assertEqual(len(records), 8)
        monday = {r["name"]:r for r in reporting_rows(records, date(2026,10,19))}
        sunday = {r["name"]:r for r in reporting_rows(records, date(2026,10,25))}
        thursday = {r["name"]:r for r in reporting_rows(records, date(2026,10,22))}
        self.assertEqual(monday["Suzzy Agyemang"]["end"], "8:00 PM")
        self.assertEqual(thursday["Suzzy Agyemang"]["end"], "6:00 PM")
        self.assertEqual(sunday["Suzzy Agyemang"]["requirement"], "Optional")
        self.assertEqual(sunday["Daniel Agyei"]["start"], "11:30 AM")
        self.assertEqual(sunday["Daniel Agyei"]["requirement"], "Required")
        self.assertNotIn("Faustina Nti Nyamekye Alexandra", sunday)
        self.assertEqual(thursday["Faustina Nti Nyamekye Alexandra"]["start"], "6:30 AM")
        self.assertEqual(thursday["Faustina Nti Nyamekye Alexandra"]["end"], "8:00 PM")
        self.assertEqual(monday["Philip Boakye"]["start"], "Flexible")
        row = next(r for r in records if r.payload.get("staffName") == "Philip Boakye")
        form = dict(row.payload); form["notes"] = "Support when available"
        self.assertEqual(self.client.post(f"/app/modules/staff_reporting_schedule/{row.id}/edit", data=form).status_code, 302)
        self.client.get("/app/modules/staff_reporting_schedule")
        db.expire_all()
        self.assertEqual(db.get(ModuleRecord, row.id).payload["notes"], "Support when available")
        self.assertEqual(len(db.scalars(select(ModuleRecord).where(ModuleRecord.module_key == "staff_reporting_schedule")).all()), 8)
        self.assertIn("Weekly Reporting Timetable", self.client.get("/app/modules/workforce_attendance").get_data(as_text=True))

    def test_staff_can_view_but_not_edit_reporting_timetable(self):
        self.client.get("/app/modules/staff_reporting_schedule")
        with self.client.session_transaction() as session:
            session["user_id"] = "cashier"
        self.assertEqual(self.client.get("/app/modules/staff_reporting_schedule").status_code, 200)
        self.assertEqual(self.client.get("/app/modules/staff_reporting_schedule/new").status_code, 403)
        self.assertTrue(reporting_form_errors(dict(days="Sunday", startTime="23:00", endTime="07:00", requirement="Required"), []))

    def cash_form(self, kind="Opening", **overrides):
        data = dict(date=date.today().isoformat(), entryType=kind, groceriesCash="100", foodCash="50", momoCash="900",
                    momoECash="1040", groceriesPetty="10", foodPetty="5", cashMode="Separate",
                    confirmedDate=f"{date.today().isoformat()}|{kind}", exceptionReason="Manually checked source limitations")
        data.update(overrides)
        return data

    def test_expense_from_petty_cash_is_linked_once_with_receipt_and_retries(self):
        db = self.sessions()
        token = "a" * 32
        data = dict(date=date.today().isoformat(), wallet="groceriesPetty", amount="10", vendor="Cleaner",
                    category="Cleaning", requestId=token, receiptReference="RC1")
        response = self.client.post("/app/daily-cash/expense", data={**data, "receiptUpload": (BytesIO(b"%PDF-1.4 test receipt"), "receipt.pdf")})
        self.assertEqual(response.status_code, 302)
        self.assertEqual(self.client.post("/app/daily-cash/expense", data=data).status_code, 302)
        expenses = db.scalars(select(ModuleRecord).where(ModuleRecord.module_key == "expenses")).all()
        self.assertEqual(len(expenses), 1)
        self.assertTrue(expenses[0].payload["receiptAttachmentUrl"].startswith("data:application/pdf"))
        cashbook = db.scalars(select(ModuleRecord).where(ModuleRecord.module_key == "cashbook_entries")).all()
        self.assertEqual(len(cashbook), 1)
        context = daily_cash_movement_context(db, date.today())
        self.assertEqual(context["effects"]["groceriesCash"], -10)
        self.assertEqual(context["effects"]["groceriesPetty"], -10)
        page = self.client.get("/app/daily-cash")
        self.assertEqual(page.status_code, 200)
        self.assertIn("Save Expense", page.get_data(as_text=True))

    def test_opening_closing_carry_forward_and_owner_approval_lock(self):
        db = self.sessions()
        db.delete(db.get(ModuleRecord, "test-rental")); db.commit()
        previous = ModuleRecord(id="daily-cash-" + (date.today()-timedelta(days=1)).isoformat(),
            module_key="daily_cash_positions", record_date=date.today()-timedelta(days=1), status="Approved",
            payload={k: float(v) for k,v in self.cash_form().items() if k in ["groceriesCash","foodCash","momoCash","momoECash","groceriesPetty","foodPetty"]})
        db.add(previous); db.commit()
        self.assertIn("Suggested from closing", self.client.get("/app/daily-cash?entryType=Opening").get_data(as_text=True))
        self.assertEqual(self.client.post("/app/daily-cash", data=self.cash_form()).status_code, 302)
        self.assertEqual(self.client.post("/app/daily-cash", data=self.cash_form("Closing")).status_code, 302)
        self.assertEqual(len(db.scalars(select(ModuleRecord).where(ModuleRecord.module_key == "daily_cash_positions")).all()), 3)
        review=dict(date=date.today().isoformat(), entryType="Closing", action="approve", reviewNote="Checked", acceptExceptions="yes")
        self.assertEqual(self.client.post("/app/daily-cash/review", data=review).status_code, 302)
        db.expire_all()
        closing = find_snapshot(db, date.today(), "Closing")
        self.assertEqual(closing.status, "Approved")
        expense = dict(date=date.today().isoformat(), wallet="food", amount="5", vendor="Vendor", category="Transport", requestId="b"*32)
        self.assertEqual(self.client.post("/app/daily-cash/expense", data=expense).status_code, 302)
        self.assertFalse(db.scalars(select(ModuleRecord).where(ModuleRecord.module_key == "expenses")).all())
        self.assertEqual(self.client.post("/app/daily-cash", data=self.cash_form("Closing", expectedUpdatedAt=closing.updated_at.isoformat())).status_code, 409)
        self.assertEqual(self.client.post("/app/daily-cash/review", data={**review, "action":"reopen", "reviewNote":""}).status_code, 400)
        self.assertEqual(self.client.post("/app/daily-cash/review", data={**review, "action":"reopen", "reviewNote":"Correct count"}).status_code, 302)

    def test_momo_expected_movements_use_completed_transactions_and_expense_once(self):
        db = self.sessions()
        for identity, kind, amount, fee, status in [("in", "Cash In", 100, 10, "Completed"),
                ("out", "Cash Out", 50, 5, "Completed"), ("pending", "Cash Out", 999, 10, "Pending")]:
            db.add(ModuleRecord(id=identity, module_key="mobile_money_transactions", record_date=date.today(),
                payload=dict(provider="MTN Mobile Money", serviceType=kind, transactionValue=amount, salesAmount=fee, status=status)))
        db.commit()
        self.client.post("/app/daily-cash/expense", data=dict(date=date.today().isoformat(), wallet="momoECash",
            amount="7", vendor="Supplier", category="Utilities", requestId="c"*32))
        summary = daily_cash_movement_context(db, date.today())
        self.assertEqual(summary["effects"]["momoCash"], 65)
        self.assertEqual(summary["effects"]["momoECash"], -57)

    def test_transfers_are_not_income_and_reversal_restores_cash(self):
        db = self.sessions()
        day = date.today().isoformat()
        transfer=dict(date=day, source="groceries", destination="groceriesPetty", amount="20", recipient="Manager", reference="PETTY-1")
        self.assertEqual(self.client.post("/app/daily-cash/transfer", data=transfer).status_code, 302)
        context = daily_cash_movement_context(db, date.today())
        self.assertEqual(context["effects"]["groceriesCash"], 0)
        self.assertEqual(context["effects"]["groceriesPetty"], 20)
        self.client.post("/app/daily-cash/transfer", data=transfer)
        moves = db.scalars(select(ModuleRecord).where(ModuleRecord.module_key == "daily_cash_movements")).all()
        self.assertEqual(len(moves), 1)
        self.assertEqual(self.client.post(f"/app/daily-cash/transfer/{moves[0].id}/reverse", data={"reason":"Wrong allocation"}).status_code, 302)
        context = daily_cash_movement_context(db, date.today())
        self.assertEqual(context["effects"]["groceriesPetty"], 0)
        self.assertFalse(db.scalars(select(ModuleRecord).where(ModuleRecord.module_key.in_(["sales","expenses"]))).all())

    def test_combined_cash_requires_date_confirmation_and_does_not_fake_shop_split(self):
        data = self.cash_form("Closing", cashMode="Combined", combinedCash="150", groceriesCash="0", foodCash="0")
        no_confirmation = {**data, "confirmedDate":""}
        self.assertEqual(self.client.post("/app/daily-cash", data=no_confirmation).status_code, 200)
        self.assertEqual(self.client.post("/app/daily-cash", data=data).status_code, 302)
        db = self.sessions()
        p = find_snapshot(db, date.today(), "Closing").payload
        self.assertEqual(p["cashMode"], "Combined")
        self.assertEqual(p["combinedCash"], 150)
        self.assertEqual(p["groceriesRemaining"], 0)
        self.assertEqual(p["foodRemaining"], 0)

    def test_daily_cash_date_correction_preserves_count_and_recorder(self):
        db = self.sessions()
        payload = dict(id="daily-cash-2026-10-19", date="2026-10-19", recordedBy="Daniel Agyei",
                       recordedAt="2026-10-19T06:56:09", groceriesCash=704, foodCash=0, momoCash=9450,
                       momoECash=4481.66, groceriesPetty=84.9, foodPetty=0, notes="Combined shops count")
        record = ModuleRecord(id=payload["id"], module_key="daily_cash_positions")
        set_module_record_metadata(record, MODULES[record.module_key], payload)
        db.add(record)
        db.commit()
        response = self.client.post("/app/daily-cash/correct-date", data={
            "sourceDate": "2026-10-19", "targetDate": "2026-10-18", "reason": "Yesterday entered as today"})
        self.assertEqual(response.status_code, 302)
        db.expire_all()
        self.assertIsNone(db.get(ModuleRecord, "daily-cash-2026-10-19"))
        moved = db.get(ModuleRecord, "daily-cash-2026-10-18")
        self.assertEqual(moved.record_date, date(2026, 10, 18))
        for key in ("recordedBy", "recordedAt", "groceriesCash", "foodCash", "momoCash", "momoECash", "groceriesPetty", "foodPetty", "notes"):
            self.assertEqual(moved.payload[key], payload[key])
        self.assertEqual(len(moved.payload["dateCorrections"]), 1)

    def test_daily_cash_date_correction_never_overwrites_existing_target(self):
        db = self.sessions()
        for day in ("2026-10-18", "2026-10-19"):
            db.add(ModuleRecord(id="daily-cash-" + day, module_key="daily_cash_positions",
                                record_date=date.fromisoformat(day), payload={"date": day, "groceriesCash": 10}))
        db.commit()
        response = self.client.post("/app/daily-cash/correct-date", data={
            "sourceDate": "2026-10-19", "targetDate": "2026-10-18", "reason": "Correction"})
        self.assertEqual(response.status_code, 409)
        self.assertEqual(len(db.scalars(select(ModuleRecord).where(ModuleRecord.module_key == "daily_cash_positions")).all()), 2)

    def test_daily_cash_keeps_pettty_allocation_separate_and_one_record_per_date(self):
        form = dict(date=date.today().isoformat(), groceriesCash="500", foodCash="300", momoCash="900",
                    momoECash="1040", groceriesPetty="50", foodPetty="30", notes="Morning count",
                    confirmedDate=f"{date.today().isoformat()}|Closing", exceptionReason="No opening recorded; actual count confirmed")
        response = self.client.post("/app/daily-cash", data=form)
        self.assertEqual(response.status_code, 302)
        db = self.sessions()
        records = db.scalars(select(ModuleRecord).where(ModuleRecord.module_key == "daily_cash_positions")).all()
        self.assertEqual(len(records), 1)
        p = records[0].payload
        self.assertEqual(p["groceriesRemaining"], 450)
        self.assertEqual(p["foodRemaining"], 270)
        self.assertEqual(p["pettyTotal"], 80)
        self.assertEqual(p["totalPhysical"], 1700)
        self.assertEqual(p["momoECash"], 1040)
        self.assertFalse(db.scalars(select(ModuleRecord).where(ModuleRecord.module_key.in_(["sales", "expenses", "cashbook_entries", "petty_cash"]))).all())
        form["groceriesPetty"] = "60"
        form["expectedUpdatedAt"] = records[0].updated_at.isoformat()
        self.assertEqual(self.client.post("/app/daily-cash", data=form).status_code, 302)
        db.expire_all()
        records = db.scalars(select(ModuleRecord).where(ModuleRecord.module_key == "daily_cash_positions")).all()
        self.assertEqual(len(records), 1)
        self.assertEqual(records[0].payload["groceriesRemaining"], 440)
        self.assertIn("Latest Daily Cash", self.client.get("/app/").get_data(as_text=True))
        self.assertEqual(self.client.get("/app/daily-cash").status_code, 200)
        self.assertEqual(self.client.get("/app/modules/daily_cash_positions/export.csv").status_code, 200)

    def test_daily_cash_rejects_invalid_counts_and_cashier_access(self):
        form = dict(date=date.today().isoformat(), groceriesCash="10", foodCash="20", momoCash="900",
                    momoECash="1040", groceriesPetty="11", foodPetty="0")
        response = self.client.post("/app/daily-cash", data=form)
        self.assertEqual(response.status_code, 200)
        self.assertIn("cannot exceed", response.get_data(as_text=True))
        form.update(groceriesPetty="0", momoCash="NaN")
        self.assertEqual(self.client.post("/app/daily-cash", data=form).status_code, 200)
        db = self.sessions()
        self.assertFalse(db.scalars(select(ModuleRecord).where(ModuleRecord.module_key == "daily_cash_positions")).all())
        with self.client.session_transaction() as session:
            session["user_id"] = "cashier"
        self.assertEqual(self.client.get("/app/daily-cash").status_code, 302)

    def test_calendar_done_is_dated_idempotent_and_does_not_stop_recurrence(self):
        self.client.get("/app/modules/business_calendar")
        db = self.sessions()
        task = db.scalar(select(ModuleRecord).where(ModuleRecord.module_key == "business_calendar", ModuleRecord.title == "Sweeping"))
        # The fixture's current host day is used for completion validation.
        task.payload = {**task.payload, "nextDueDate": date.today().isoformat(), "frequency": "Daily"}
        db.commit()
        url = f"/app/calendar/{task.id}/complete"
        for _ in range(2):
            self.assertEqual(self.client.post(url, data={"date": date.today().isoformat(), "notes": "Swept shop"}).status_code, 302)
        completions = db.scalars(select(ModuleRecord).where(ModuleRecord.module_key == "business_calendar_completions")).all()
        self.assertEqual(len(completions), 1)
        db.expire_all()
        self.assertEqual(db.get(ModuleRecord, task.id).payload["status"], "Active")
        rows = calendar_task_rows(db, [task], date.today(), db.get(User, "owner"), days=2)
        self.assertTrue(rows[0]["done"])
        self.assertFalse(rows[1]["done"])
        self.assertEqual(self.client.post(url, data={"date": (date.today() + timedelta(days=1)).isoformat()}).status_code, 400)
        self.assertEqual(self.client.post(url, data={"date": date.today().isoformat(), "action": "reopen"}).status_code, 302)
        page = self.client.get("/app/modules/business_calendar").get_data(as_text=True)
        self.assertNotIn("<th>Amount</th>", page)
        self.assertIn("Mark Done", page)
        self.assertIn("Task Reminders", page)
        form = self.client.get(f"/app/modules/business_calendar/{task.id}/edit").get_data(as_text=True)
        self.assertNotIn('name="amount"', form)
        self.assertIn('name="reminderMinutes"', form)

    def test_unassigned_officer_cannot_complete_task(self):
        self.client.get("/app/modules/business_calendar")
        db = self.sessions()
        task = db.scalar(select(ModuleRecord).where(ModuleRecord.module_key == "business_calendar"))
        with self.client.session_transaction() as session:
            session["user_id"] = "cashier"
        self.assertEqual(self.client.post(f"/app/calendar/{task.id}/complete", data={"date": date.today().isoformat()}).status_code, 403)

    def test_reminder_respects_due_time_lead_and_off_setting(self):
        db = self.sessions()
        task = ModuleRecord(id="reminder-test", module_key="business_calendar", title="Test Duty",
                            payload=dict(title="Test Duty", officer="Owner", status="Active", frequency="Daily",
                                         dueTime="09:00", reminderMinutes=15, reminder="Enabled"))
        db.add(task)
        db.commit()
        user = db.get(User, "owner")
        early = calendar_task_rows(db, [task], date(2026, 10, 19), user, days=1, now=datetime(2026, 10, 19, 8, 30))
        due = calendar_task_rows(db, [task], date(2026, 10, 19), user, days=1, now=datetime(2026, 10, 19, 8, 50))
        self.assertFalse(early[0]["remind"])
        self.assertTrue(due[0]["remind"])
        task.payload = {**task.payload, "reminder": "Off"}
        disabled = calendar_task_rows(db, [task], date(2026, 10, 19), user, days=1, now=datetime(2026, 10, 19, 10))
        self.assertFalse(disabled[0]["remind"])

    def test_new_accounts_are_visible_once_in_open_menu(self):
        page = self.client.get("/app/")
        self.assertEqual(page.status_code, 200)
        html = page.get_data(as_text=True)
        self.assertIn("Accounts &amp; Calendar", html)
        sidebar = html.split("</aside>")[0]
        for key in ("customer_prepaid", "construction_accounts", "business_calendar"):
            self.assertEqual(sidebar.count(f'href="/app/modules/{key}"'), 1)

    def test_prepaid_deposit_application_and_overdraft_controls(self):
        form = dict(date=date.today().isoformat(), customerName="Mary", customerPhone="0240000000",
                    businessAreaId="groceries", transactionType="Deposit", amount="100", paymentMethod="Cash", reference="D1")
        url = "/app/modules/customer_prepaid/new"
        response = self.client.post(url, data=form)
        self.assertEqual(response.status_code, 302)
        db = self.sessions()
        entries = db.scalars(select(ModuleRecord).where(ModuleRecord.module_key == "customer_prepaid")).all()
        self.assertEqual(prepaid_balance(entries, "0240000000"), 100)
        cash = db.scalars(select(ModuleRecord).where(ModuleRecord.module_key == "cashbook_entries")).all()
        self.assertEqual(len(cash), 1)
        self.assertEqual(cash[0].amount, 100)
        self.assertEqual(self.client.post(url, data=form).status_code, 200)
        form.update(transactionType="Use Balance", amount="120", reference="SALE1")
        self.assertEqual(self.client.post(url, data=form).status_code, 200)
        form["amount"] = "25"
        self.assertEqual(self.client.post(url, data=form).status_code, 302)
        entries = db.scalars(select(ModuleRecord).where(ModuleRecord.module_key == "customer_prepaid")).all()
        self.assertEqual(prepaid_balance(entries, "0240000000"), 75)
        self.assertEqual(len(db.scalars(select(ModuleRecord).where(ModuleRecord.module_key == "cashbook_entries")).all()), 1)
        self.assertEqual(self.client.get("/app/modules/customer_prepaid").status_code, 200)
        self.assertEqual(self.client.get(f"/app/prepaid/{entries[0].id}/receipt").status_code, 200)
        response = self.client.post(f"/app/modules/cashbook_entries/{cash[0].id}/delete",
                                    data={"deletion_reason": "Test linked record protection"})
        self.assertEqual(response.status_code, 302)
        self.assertIsNotNone(db.get(ModuleRecord, cash[0].id))
        self.assertEqual(self.client.post("/app/modules/customer_prepaid/new", data={
            **form, "transactionType": "Refund", "amount": "10", "reference": "REF1"}).status_code, 302)
        entries = db.scalars(select(ModuleRecord).where(ModuleRecord.module_key == "customer_prepaid")).all()
        self.assertEqual(prepaid_balance(entries, "0240000000"), 65)

    def test_cashier_cannot_refund_prepaid(self):
        with self.client.session_transaction() as session:
            session["user_id"] = "cashier"
        response = self.client.post("/app/modules/customer_prepaid/new", data={
            "date": date.today().isoformat(), "customerName": "Mary", "customerPhone": "0240000000",
            "businessAreaId": "groceries", "transactionType": "Refund", "amount": "10",
            "paymentMethod": "Cash", "reference": "REF1"})
        self.assertEqual(response.status_code, 200)
        self.assertIn("Only the owner", response.get_data(as_text=True))

    def test_calendar_seeds_once_preserves_edits_and_has_editable_duties(self):
        self.assertEqual(self.client.get("/app/modules/business_calendar").status_code, 200)
        db = self.sessions()
        rows = db.scalars(select(ModuleRecord).where(ModuleRecord.module_key == "business_calendar")).all()
        self.assertEqual(len(rows), 9)
        row = next(r for r in rows if r.title == "Sweeping")
        payload = dict(row.payload)
        payload["officer"] = "Philip"
        row.payload = payload
        db.commit()
        page = self.client.get("/app/modules/business_calendar")
        self.assertEqual(page.status_code, 200)
        db.expire_all()
        self.assertEqual(db.get(ModuleRecord, row.id).payload["officer"], "Philip")
        self.assertEqual(len(db.scalars(select(ModuleRecord).where(ModuleRecord.module_key == "business_calendar")).all()), 9)
        gutter = dict(status="Active", frequency="Twice a week", weekdays="0,3")
        self.assertTrue(responsibility_occurs(gutter, date(2026, 10, 19)))
        self.assertFalse(responsibility_occurs(gutter, date(2026, 10, 20)))
        self.assertFalse(responsibility_occurs(dict(status="Active", frequency="As needed"), date.today()))

    def test_momo_profit_excludes_handled_pending_and_generated_duplicates(self):
        db = self.sessions()
        for identity, status in [("momo-done", "Completed"), ("momo-pending", "Pending"), ("momo-reversed", "Reversed")]:
            db.add(ModuleRecord(id=identity, module_key="mobile_money_transactions", title=identity,
                                record_date=date.today(), business_area_id="mobile-money", amount=1000,
                                payload=dict(status=status, salesAmount=10, costAmount=2, profitAmount=8, transactionValue=1000)))
        db.commit()
        records = db.scalars(select(ModuleRecord)).all()
        rows = profit_detail_rows(records, date.today().strftime("%Y-%m"))
        self.assertEqual(sum(r["profitTotal"] for r in rows), 8)
        self.assertEqual(sum(r["salesTotal"] for r in rows), 10)
        summary = daily_sales_summary_context(db, date.today())
        self.assertEqual(summary["total_sales"], 0)
        self.assertEqual(summary["total_profit"], 8)
        self.assertEqual(summary["mobile_money_profit"], 8)
        groceries = self.client.get("/app/api/pos/summary?desk=groceries").get_json()["summary"]
        food = self.client.get("/app/api/pos/summary?desk=food").get_json()["summary"]
        self.assertEqual(groceries["deskSalesTotal"] - groceries["counterCollectionsTotal"], 10)
        self.assertEqual(groceries["deskProfitTotal"] - groceries["profitAmount"] - groceries["breadSalesProfit"], 8)
        self.assertEqual(food["deskMomoCommissionIncluded"], 0)
        self.assertEqual(groceries["cashSalesTotal"], 0)
        momo = next(r for r in report_area_rows(records, date.today().strftime("%Y-%m")) if r["areaId"] == "mobile-money")
        self.assertEqual(momo["profitTotal"], 8)
        self.assertEqual(self.client.get("/app/modules/construction_accounts").status_code, 200)

    def test_owner_updates_salary_without_creating_payment_or_documents(self):
        db = self.sessions()
        db.add(ModuleRecord(id="suzzy-profile", module_key="staff_onboarding_profiles", title="Suzzy",
                            payload={"staffName": "Suzzy", "startDate": "2026-09-14", "monthlySalary": 0}))
        db.commit()
        response = self.client.post("/app/staff-onboarding/suzzy-profile/pay-settings",
                                    data={"monthlySalary": "1350", "paydayDay": "14"})
        self.assertEqual(response.status_code, 302)
        db.expire_all()
        payload = db.get(ModuleRecord, "suzzy-profile").payload
        self.assertEqual(payload["monthlySalary"], 1350)
        self.assertEqual(payload["paydayDay"], 14)
        self.assertFalse(db.scalars(select(ModuleRecord).where(ModuleRecord.module_key == "salary_records")).all())

    def test_public_equipment_request_saves_linked_booking(self):
        db = self.sessions()
        db.add(Product(id="public-drill", name="Impact Drill", business_area_id="water-equipment",
                       category="Rent", item_type="service", active=True, sales_price=50))
        db.commit()
        with patch("oneroot_erp.app.sync_customer_crm_automation", side_effect=AssertionError("Global rebuild")):
            response = self.client.post("/api/orders", json={
                "customerName": "Booking Test", "customerPhone": "0240000000",
                "preferredDate": date.today().isoformat(), "items": [
                    {"id": "public-drill", "quantity": 2, "requestedDays": 3, "pricingMultiplier": 3}]})
        self.assertEqual(response.status_code, 200, response.get_data(as_text=True))
        self.assertTrue(response.json["ok"])
        self.assertEqual(response.json["totalAmount"], 300)
        booking = db.scalar(select(ModuleRecord).where(ModuleRecord.module_key == "equipment_rental_bookings",
                            ModuleRecord.reference == response.json["orderNumber"]))
        self.assertIsNotNone(booking)

    def setUp(self):
        self.temp = TemporaryDirectory()
        config = replace(load_config(), database_url=f"sqlite:///{Path(self.temp.name) / 'test.db'}")
        self.app = create_app(config)
        self.app.config.update(TESTING=True, DATABASE_READY=True)
        self.sessions = self.app.config["SESSION_LOCAL"]
        db = self.sessions()
        Base.metadata.create_all(db.bind)
        db.add(User(id="owner", username="owner", role="owner", active=True, login_enabled=True))
        db.add(User(id="cashier", username="cashier", role="cashier", active=True, login_enabled=True))
        self.payload = {
            "bookingDate": date.today().isoformat(), "businessAreaId": "water-equipment",
            "equipmentCategory": "Rent", "equipmentItem": "Cutting Machine",
            "customerName": "Test Customer", "customerPhone": "0500000000",
            "outDate": (date.today() - timedelta(days=2)).isoformat(),
            "returnDate": date.today().isoformat(), "status": "Returned",
            "rentalDays": 3, "rentalFee": 300, "costAmount": 0,
            "paymentEntries": [{"id": "payment-1", "amountPaid": 100,
                                "paymentDate": date.today().isoformat(), "paymentMethod": "Cash"}],
        }
        rental = ModuleRecord(id="test-rental", module_key="equipment_rental_bookings")
        set_module_record_metadata(rental, MODULES[rental.module_key], self.payload)
        db.add(rental)
        db.commit()
        self.sessions.remove()
        self.client = self.app.test_client()
        with self.client.session_transaction() as session:
            session["user_id"] = "owner"

    def tearDown(self):
        self.sessions.remove()
        self.sessions.bind.dispose()
        self.temp.cleanup()

    def test_public_catalog_uses_separate_cached_images(self):
        db = self.sessions()
        db.add(Product(id="image-test", name="Test Bread", business_area_id="groceries",
                       active=True, image_url="data:image/png;base64,aGVsbG8="))
        db.commit()
        with self.client.session_transaction() as session:
            session.clear()
        response = self.client.get("/api/catalog")
        self.assertEqual(response.status_code, 200)
        item = next(item for item in response.json["items"] if item["id"] == "image-test")
        self.assertNotIn("data:image", item["imageUrl"])
        image = self.client.get(item["imageUrl"])
        self.assertEqual(image.status_code, 200)
        self.assertEqual(image.data, b"hello")
        self.assertIn("max-age=86400", image.headers["Cache-Control"])
        cached = self.client.get(item["imageUrl"], headers={"If-None-Match": image.headers["ETag"]})
        self.assertEqual(cached.status_code, 304)

    def test_owner_can_open_and_save_paid_rental_without_marketing_rebuild(self):
        url = "/app/modules/equipment_rental_bookings/test-rental/edit"
        self.assertEqual(self.client.get(url).status_code, 200)
        form = {key: str(value) for key, value in self.payload.items() if key != "paymentEntries"}
        form["notes"] = "Owner corrected the rental note"
        with patch("oneroot_erp.app.sync_customer_crm_automation", side_effect=AssertionError("Global CRM rebuild")), \
             patch("oneroot_erp.app.sync_customer_loyalty_accounts", side_effect=AssertionError("Global loyalty rebuild")), \
             patch("oneroot_erp.app.sync_marketing_campaign_automation", side_effect=AssertionError("Global campaign rebuild")):
            response = self.client.post(url, data=form)
        self.assertEqual(response.status_code, 302)
        db = self.sessions()
        rental = db.get(ModuleRecord, "test-rental")
        self.assertEqual(rental.payload["notes"], form["notes"])
        self.assertEqual(rental.payload["amountPaid"], 100)
        self.assertEqual(len(rental.payload["paymentEntries"]), 1)
        sales = db.scalars(select(ModuleRecord).where(ModuleRecord.module_key == "sales")).all()
        self.assertEqual(len(sales), 1)
        self.assertEqual(sales[0].amount, 100)
        self.assertEqual(sales[0].reference, "equipment-rental-payment|test-rental|payment-1")

    def test_staff_cannot_edit_paid_rental(self):
        with self.client.session_transaction() as session:
            session["user_id"] = "cashier"
        response = self.client.get("/app/modules/equipment_rental_bookings/test-rental/edit")
        self.assertEqual(response.status_code, 302)

    def test_owner_insights_page_renders_action_plan_and_submenus(self):
        response = self.client.get("/app/ai-growth-assistant")
        self.assertEqual(response.status_code, 200)
        text = response.get_data(as_text=True)
        self.assertIn("Money Actions This Week", text)
        self.assertIn('class="workspace-submenu"', text)
        self.assertIn("Insights &amp; Suggested Actions", text)

    def test_dashboard_loads_external_credit_collections(self):
        db = self.sessions()
        for identity, customer, amount in [("external", "Mary", 40), ("internal", "OneRoot Kitchen", 900)]:
            db.add(ModuleRecord(id=identity, module_key="customer_credit_accounts",
                                business_area_id="groceries", record_date=date.today(), amount=amount,
                                payload={"transactionType": "Payment Received", "customerName": customer,
                                         "amount": amount}))
        db.commit()
        with patch("oneroot_erp.app.render_template", return_value="dashboard") as render:
            response = self.client.get("/app/")
        self.assertEqual(response.status_code, 200)
        context = render.call_args.kwargs
        self.assertEqual(context["today_sales_total"], 40)
        self.assertEqual(context["month_sales_total"], 40)
        self.assertEqual(context["month_profit_total"], 0)

    def test_loyalty_page_reuses_legacy_card_and_hides_duplicates(self):
        db = self.sessions()
        db.add(ModuleRecord(id="crm-loyalty", module_key="customer_crm", payload={
            "customerName": "Mary", "customerPhone": "0240000000"}))
        for identity, redeemed in [("old-card", 0), ("redeemed-card", 5)]:
            db.add(ModuleRecord(id=identity, module_key="customer_loyalty", payload={
                "customerName": "Mary", "customerPhone": "0240000000", "pointsRedeemed": redeemed}))
        db.commit()
        sync_customer_loyalty_accounts(db)
        db.commit()
        for _ in range(2):
            with patch("oneroot_erp.app.sync_customer_loyalty_accounts", side_effect=AssertionError("Rebuild on page load")):
                response = self.client.get("/app/modules/customer_loyalty")
            self.assertEqual(response.status_code, 200)
        cards = db.scalars(select(ModuleRecord).where(ModuleRecord.module_key == "customer_loyalty")).all()
        self.assertEqual(len(cards), 2)
        card = db.get(ModuleRecord, "redeemed-card")
        self.assertEqual(card.payload["pointsRedeemed"], 5)
        self.assertEqual(card.reference, "loyalty|0240000000")


if __name__ == "__main__":
    unittest.main()
