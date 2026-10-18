from dataclasses import replace
from datetime import date, datetime, timedelta
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import patch

from sqlalchemy import select

from oneroot_erp.app import (create_app, set_module_record_metadata, sync_customer_loyalty_accounts,
                             prepaid_balance, responsibility_occurs, profit_detail_rows,
                             daily_sales_summary_context, report_area_rows, calendar_task_rows)
from oneroot_erp.config import load_config
from oneroot_erp.models import Base, ModuleRecord, Product, User
from oneroot_erp.registry import MODULES


class ServiceEditSaveTests(unittest.TestCase):
    def test_calendar_done_is_dated_idempotent_and_does_not_stop_recurrence(self):
        self.client.get("/app/modules/business_calendar")
        db = self.sessions()
        task = db.scalar(select(ModuleRecord).where(ModuleRecord.module_key == "business_calendar", ModuleRecord.title == "Sweeping"))
        # The fixture's current host day is used for completion validation.
        task.payload = {**task.payload, "nextDueDate": date.today().isoformat()}
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
        self.assertEqual(len(rows), 12)
        row = next(r for r in rows if r.title == "Sweeping")
        payload = dict(row.payload)
        payload["officer"] = "Philip"
        row.payload = payload
        db.commit()
        page = self.client.get("/app/modules/business_calendar")
        self.assertEqual(page.status_code, 200)
        db.expire_all()
        self.assertEqual(db.get(ModuleRecord, row.id).payload["officer"], "Philip")
        self.assertEqual(len(db.scalars(select(ModuleRecord).where(ModuleRecord.module_key == "business_calendar")).all()), 12)
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
