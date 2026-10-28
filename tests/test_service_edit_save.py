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
    def test_ai_closing_schedule_does_not_invent_actual_counts_and_is_idempotent(self):
        from oneroot_erp.ai_closing import prepare_due_closings
        from oneroot_erp.cash_controls import find_snapshot
        from zoneinfo import ZoneInfo
        db=self.sessions();day=date(2026,10,28)
        db.delete(db.get(ModuleRecord,"test-rental"))
        db.add(ModuleRecord(id=f"daily-cash-{day}-opening",module_key="daily_cash_positions",record_date=day,status="Approved",
            payload=dict(entryType="Opening",cashMode="Combined",groceriesCash=100,foodCash=0,momoCash=200,momoECash=300,merchantECash=50)))
        db.commit()
        before=datetime(2026,10,29,1,59,tzinfo=ZoneInfo("Africa/Accra"))
        after=datetime(2026,10,29,2,0,tzinfo=ZoneInfo("Africa/Accra"))
        self.assertEqual(prepare_due_closings(db,daily_cash_movement_context,before),0)
        self.assertEqual(prepare_due_closings(db,daily_cash_movement_context,after),1)
        self.assertEqual(prepare_due_closings(db,daily_cash_movement_context,after),0)
        self.assertIsNone(find_snapshot(db,day,"Closing"))
        draft=db.get(ModuleRecord,"ai-closing-2026-10-28")
        self.assertIsNone(draft.payload["actualCounts"])
        self.assertEqual(draft.payload["expectedTotal"],650)
        actor=db.get(User,"oneroot-ai-closing")
        self.assertFalse(actor.login_enabled)
        self.assertFalse(actor.active)
        task=db.get(ModuleRecord,"ai-closing-review-2026-10-28")
        self.assertEqual(task.payload["officer"],"Daniel Agyei")
        response=self.client.get("/app/daily-cash?date=2026-10-28&entryType=Closing")
        self.assertEqual(response.status_code,200)
        self.assertIn("AI Prepared Closing",response.get_data(as_text=True))

    def test_monthly_mtn_commission_receipt_moves_wallet_once_without_duplicate_sales(self):
        day=date.today(); db=self.sessions()
        before=daily_cash_movement_context(db,day)["effects"]["momoECash"]
        data=dict(date=day.isoformat(),commissionMonth=day.strftime("%Y-%m"),wallet="momoECash",
                  amount="125.50",reference="MTN-MONTH-001",requestId="c"*32)
        url="/app/daily-cash/mtn-commission"
        self.assertEqual(self.client.post(url,data=data).status_code,302)
        self.assertEqual(self.client.post(url,data=data).status_code,302)
        self.assertEqual(self.client.post(url,data=dict(data,requestId="d"*32)).status_code,409)
        db=self.sessions()
        self.assertEqual(daily_cash_movement_context(db,day)["effects"]["momoECash"],round(before+125.5,2))
        rows=db.scalars(select(ModuleRecord).where(ModuleRecord.reference=="mtn-commission|MTN-MONTH-001")).all()
        self.assertEqual(len(rows),1)
        self.assertEqual(rows[0].module_key,"cashbook_entries")
        self.assertEqual(rows[0].payload["commissionMonth"],day.strftime("%Y-%m"))
        self.assertEqual(self.client.post(url,data=dict(data,amount="nan",requestId="e"*32,reference="INVALID")).status_code,400)
        page=self.client.get(f"/app/daily-cash?date={day}")
        self.assertEqual(page.status_code,200)
        self.assertIn("MTN Monthly Commission Paid",page.get_data(as_text=True))
        self.assertIn("MTN-MONTH-001",page.get_data(as_text=True))

    def test_daily_review_recomputes_differences_and_assigns_one_task(self):
        from oneroot_erp.app import daily_accountability_review
        db=self.sessions();day=date.today()-timedelta(days=1)
        base=dict(entryType="Opening",cashMode="Combined",groceriesCash=100,foodCash=0,momoCash=200,momoECash=300,merchantECash=50)
        for kind,p in [("Opening",base),("Closing",dict(base,entryType="Closing",groceriesCash=110,momoCash=195))]:
            db.add(ModuleRecord(id=f"daily-cash-{day}-{kind.lower()}",module_key="daily_cash_positions",record_date=day,
                                status="Submitted",payload=p))
        db.commit()
        review=daily_accountability_review(db,day)
        self.assertEqual(review["overall"]["variance"],5)
        self.assertIn("Daniel",review["message"])
        url="/app/daily-cash/request-rectification"
        self.assertEqual(self.client.post(url,data=dict(date=day.isoformat())).status_code,302)
        self.assertEqual(self.client.post(url,data=dict(date=day.isoformat())).status_code,302)
        tasks=self.sessions().scalars(select(ModuleRecord).where(ModuleRecord.id=="cash-rectify-"+str(day))).all()
        self.assertEqual(len(tasks),1)
        self.assertEqual(tasks[0].payload["officer"],"Daniel Agyei")
        self.assertEqual(self.client.get(f"/app/daily-cash?date={day}&entryType=Closing").status_code,200)

    def test_equipment_advance_and_part_payments_keep_rental_open(self):
        from oneroot_erp.app import service_payment_summary
        db=self.sessions();record=db.get(ModuleRecord,"test-rental")
        p=dict(record.payload,returnDate="",status="Out",outDate=date.today().isoformat(),
               dueDate=date.today().isoformat(),rentalDays=1,rentalFee=100,costAmount=20,paymentEntries=[],amountPaid=0)
        set_module_record_metadata(record,MODULES[record.module_key],p);db.commit()
        url="/app/services/equipment_rental_bookings/test-rental/payment"
        data=dict(paymentDate=date.today().isoformat(),paymentMethod="Cash",amountPaid="250",
                  advanceThroughDate=(date.today()+timedelta(days=2)).isoformat())
        self.assertEqual(self.client.post(url,data=data).status_code,302)
        saved=self.sessions().get(ModuleRecord,"test-rental")
        self.assertEqual(saved.payload["amountPaid"],250)
        self.assertFalse(saved.payload.get("returnDate"))
        self.assertEqual(saved.payload["status"],"Out")
        summary=service_payment_summary("equipment_rental_bookings",saved.payload)
        self.assertEqual(summary["advanceHeld"],150)
        self.assertEqual(summary["profitRecognized"],80)
        self.assertEqual(self.client.get(url).status_code,200)
        # Any smaller amount is allowed against the remaining covered period.
        self.assertEqual(self.client.post(url,data=dict(data,amountPaid="25")).status_code,302)
        self.assertEqual(self.sessions().get(ModuleRecord,"test-rental").payload["amountPaid"],275)
        self.client.post(url,data=dict(data,amountPaid="100"))
        self.assertEqual(self.sessions().get(ModuleRecord,"test-rental").payload["amountPaid"],275)

    def test_fresh_start_merchants_commission_transfers_and_legacy_cutoff(self):
        from oneroot_erp.cash_controls import latest_close, overall_cash_summary
        day = date(2026,10,26)
        db = self.sessions()
        fixture_rental = db.get(ModuleRecord, "test-rental")
        if fixture_rental:
            db.delete(fixture_rental)
        opening_payload = dict(entryType="Opening",accountabilityBaseline=True, controlVersion=3, cashMode="Combined",
            groceriesCash=1112.9, foodCash=0, groceriesPetty=0, foodPetty=0,
            momoCash=6817.5, momoECash=7756.16, merchantECash=1328.5)
        db.add(ModuleRecord(id="daily-cash-2026-10-26-opening", module_key="daily_cash_positions",
                           record_date=day, status="Approved", payload=opening_payload))
        db.add(ModuleRecord(id="legacy-close", module_key="daily_cash_positions", record_date=date(2026,10,25),
                           status="Approved", payload=dict(entryType="Closing",groceriesCash=99999)))
        for identity,key,area,amount,p in [
            ("cash-receipt","cashbook_entries","groceries",100,dict(accountName="Main Cash Drawer",entryType="Cash In",amount=100)),
            ("merchant-sale","sales","groceries",40,dict(paymentMethod="Mobile Money")),
            ("merchant-copy","sales","groceries",40,dict(paymentMethod="Mobile Money",sourceType="pos-summary")),
            ("merchant-cashbook-copy","cashbook_entries","groceries",40,dict(accountName="OneRoot MoMo Collection Wallet",entryType="Cash In",amount=40)),
            ("merchant-expense","cashbook_entries","groceries",5,dict(accountName="OneRoot MoMo Collection Wallet",entryType="Cash Out",amount=5)),
            ("transfer-out","cashbook_entries","groceries",20,dict(accountName="OneRoot MoMo Collection Wallet",entryType="Cash Out",amount=20)),
            ("transfer-in","cashbook_entries","mobile-money",20,dict(accountName="MTN MoMo Physical Cash Float",entryType="Cash In",amount=20)),
            ("agency-in","mobile_money_transactions","mobile-money",2,dict(status="Completed",provider="MTN Mobile Money",serviceType="Cash In",floatImpact="Cash In",transactionValue=100,salesAmount=2,commissionWallet="merchantECash")),
            ("agency-out","mobile_money_transactions","mobile-money",3,dict(status="Completed",provider="MTN Mobile Money",serviceType="Cash Out",floatImpact="Cash Out",transactionValue=50,salesAmount=3,commissionWallet="momoECash")),
            ("fee-unconfirmed","mobile_money_transactions","mobile-money",7,dict(status="Completed",provider="MTN Mobile Money",serviceType="Other",floatImpact="No Cash Movement",transactionValue=0,salesAmount=7)),
        ]:
            ref = "cash-control|"+identity if identity.startswith("transfer-") else "pos-payment|copy" if identity == "merchant-cashbook-copy" else identity
            db.add(ModuleRecord(id=identity,module_key=key,business_area_id=area,record_date=day,amount=amount,reference=ref,payload=p))
        db.add(ModuleRecord(id="legacy-sale",module_key="sales",business_area_id="groceries",record_date=date(2026,10,25),
                           amount=10000,payload=dict(paymentMethod="Mobile Money")))
        db.commit()
        movements = daily_cash_movement_context(db,day)
        self.assertEqual(movements["effects"]["groceriesCash"],100)
        self.assertEqual(movements["effects"]["momoCash"],70)
        self.assertEqual(movements["effects"]["momoECash"],-47)
        self.assertEqual(movements["effects"]["merchantECash"],17)
        self.assertTrue(any("confirm where commission" in warning for warning in movements["warnings"]))
        self.assertIsNone(latest_close(db,day+timedelta(days=1)))
        summary = overall_cash_summary(opening_payload,opening_payload,movements)
        self.assertEqual(summary["opening"],17015.06)
        self.assertEqual(summary["movement"],140)
        self.assertEqual(summary["expected"],17155.06)
        self.assertEqual(summary["wallets"][0]["key"],"combinedCash")
        self.assertEqual(len(summary["wallets"]),4)
        page = self.client.get("/app/daily-cash?date=2026-10-26&entryType=Closing")
        self.assertEqual(page.status_code,200)
        self.assertIn('name="merchantECash"',page.get_data(as_text=True))

    def test_fresh_baseline_correction_retains_old_payload_and_rejects_stale_form(self):
        from oneroot_erp.cash_controls import find_snapshot
        db=self.sessions()
        source=ModuleRecord(id="daily-cash-2026-10-25-closing",module_key="daily_cash_positions",record_date=date(2026,10,25),
                            payload=dict(entryType="Closing",groceriesCash=1112.9,foodCash=0,momoCash=6817.5,momoECash=7756.16))
        old=ModuleRecord(id="daily-cash-2026-10-26-opening",module_key="daily_cash_positions",record_date=date(2026,10,26),status="Approved",
                         payload=dict(accountabilityBaseline=True,controlVersion=2,groceriesCash=1112.9,foodCash=0,momoCash=6817.5,momoECash=7756.16))
        db.add_all([source,old]);db.commit()
        data=dict(confirmBaseline="2026-10-26|17015.06",sourceUpdatedAt=source.updated_at.isoformat(),openingUpdatedAt="stale")
        with patch("oneroot_erp.app.current_local_datetime",return_value=datetime(2026,10,26,12)):
            self.assertEqual(self.client.post("/app/daily-cash/activate-baseline",data=data).status_code,409)
            data["openingUpdatedAt"]=old.updated_at.isoformat()
            self.assertEqual(self.client.post("/app/daily-cash/activate-baseline",data=data).status_code,302)
        updated=find_snapshot(self.sessions(),date(2026,10,26),"Opening")
        self.assertEqual(updated.payload["merchantECash"],1328.5)
        self.assertEqual(updated.payload["baselineRevisions"][0]["payload"]["controlVersion"],2)
        self.assertTrue(self.sessions().scalar(select(AuditLog).where(AuditLog.action=="activate-baseline")))

    def test_owner_baseline_activation_is_explicit_idempotent_and_preserves_history(self):
        from oneroot_erp.cash_controls import find_snapshot
        day = date(2026,10,26)
        db = self.sessions()
        source = ModuleRecord(id="daily-cash-2026-10-25-closing", module_key="daily_cash_positions",
            record_date=date(2026,10,25), status="Difference to Review",
            payload=dict(entryType="Closing", groceriesCash=1112.90, foodCash=0,
                         momoCash=6817.50, momoECash=7756.16))
        db.add(source); db.commit()
        data = dict(confirmBaseline="2026-10-26|17015.06",sourceUpdatedAt=source.updated_at.isoformat())
        with patch("oneroot_erp.app.current_local_datetime", return_value=datetime(2026,10,26,12)):
            self.assertEqual(self.client.post("/app/daily-cash/activate-baseline",data={}).status_code,400)
            self.assertIsNone(find_snapshot(self.sessions(),day,"Opening"))
            self.assertEqual(self.client.post("/app/daily-cash/activate-baseline",data=data).status_code,302)
            self.assertEqual(self.client.post("/app/daily-cash/activate-baseline",data=data).status_code,302)
        db = self.sessions()
        opening = find_snapshot(db,day,"Opening")
        self.assertEqual(opening.status,"Approved")
        self.assertTrue(opening.payload["accountabilityBaseline"])
        self.assertEqual(find_snapshot(db,date(2026,10,25),"Closing").status,"Difference to Review")
        self.assertEqual(len(db.scalars(select(ModuleRecord).where(ModuleRecord.module_key=="daily_cash_positions",
                                                                  ModuleRecord.record_date==day)).all()),1)
        with self.client.session_transaction() as session:session["user_id"]="cashier"
        response = self.client.post("/app/daily-cash/activate-baseline",data=data)
        self.assertIn(response.status_code, (302,403))
        if response.status_code == 302:
            self.assertNotIn("entryType=Closing", response.location)

    def test_daily_cash_shop_mobile_collections_exclude_float_and_generated_copies(self):
        from oneroot_erp.app import daily_shop_mobile_money_collections
        db = self.sessions()
        for identity, key, area, amount, payload in [
            ("shop-mm", "sales", "groceries", 30, {"paymentMethod": "Mobile Money"}),
            ("food-mm", "sales", "cold-store-groceries", 40, {"paymentMethod": "Mobile Money"}),
            ("copy-mm", "sales", "groceries", 30, {"paymentMethod": "Mobile Money", "sourceType": "pos-summary"}),
            ("cash-mm", "sales", "groceries", 90, {"paymentMethod": "Cash"}),
            ("float-mm", "mobile_money_transactions", "mobile-money", 500, {"paymentMethod": "Mobile Money"}),
            ("credit-mm", "customer_credit_accounts", "groceries", 10,
             {"paymentMethod": "Mobile Money", "transactionType": "Payment Received", "amount": 10}),
        ]:
            db.add(ModuleRecord(id=identity, module_key=key, business_area_id=area,
                                record_date=date.today(), amount=amount, payload=payload))
        db.commit()
        summary = daily_shop_mobile_money_collections(db, date.today())
        self.assertEqual(summary["totals"], {"groceries": 40, "food": 40})
        self.assertEqual(summary["total"], 80)
        page = self.client.get("/app/daily-cash")
        self.assertEqual(page.status_code, 200)
        self.assertIn("Shop Mobile Money Payments", page.get_data(as_text=True))

    def test_construction_meals_use_existing_kitchen_workflow(self):
        from oneroot_erp.registry import BUSINESS_AREA_LABELS
        from oneroot_erp.app import POS_FOOD_SALES_AREA_IDS
        self.assertIn("construction-worker-meals", POS_FOOD_SALES_AREA_IDS)
        self.assertEqual(BUSINESS_AREA_LABELS["construction-worker-meals"], "OneRoot Construction Worker Meal Supply")
        page = self.client.get("/app/modules/kitchen_orders/new")
        self.assertEqual(page.status_code, 200)
        self.assertIn('name="siteName"', page.get_data(as_text=True))
        data = dict(orderDate=date.today().isoformat(), businessAreaId="cold-store-groceries",
                    customerName="Site Customer", orderType="Construction Worker Meal Supply",
                    kitchenItem="Jollof rice", itemQuantity="10", amountDue="150", costAmount="90",
                    status="Received", siteName="Medie building site", workerCount="10")
        response = self.client.post("/app/modules/kitchen_orders/new", data=data)
        self.assertEqual(response.status_code, 302)
        db = self.sessions()
        record = db.scalar(select(ModuleRecord).where(ModuleRecord.module_key == "kitchen_orders"))
        self.assertEqual(record.business_area_id, "construction-worker-meals")
        self.assertEqual(record.payload["siteName"], "Medie building site")
        self.assertEqual(self.client.post("/app/modules/kitchen_orders/new", data=dict(data, workerCount="0")).status_code, 400)

    def test_property_name_choices_use_existing_records_and_allow_custom_names(self):
        from oneroot_erp.family_support import project_name_options, project_register_entry
        db = self.sessions()
        db.add(ModuleRecord(id="project-supplier", module_key="supplier_directory", title="Test Builder",
                            payload={"supplierName": "Test Builder"}))
        db.add(ModuleRecord(id="project-suite", module_key="apartments", title="New Suite",
                            payload={"suite": "New Suite"}))
        db.commit()
        options = project_name_options(db, {})
        self.assertIn("Test Builder", options["contractors"])
        self.assertIn("Peace", options["units"])
        self.assertIn("New Suite", options["units"])
        self.assertIn("Building Permit", options["documents"])
        _, row = project_register_entry(dict(register="tasks", status="Open", titleChoice="Site clearing"), "test")
        self.assertEqual(row["title"], "Site clearing")
        _, row = project_register_entry(dict(register="tasks", status="Open", titleChoice="__custom__", title="Custom task"), "test")
        self.assertEqual(row["title"], "Custom task")
        page = self.client.get("/app/property-projects?project=medie")
        self.assertEqual(page.status_code, 200)
        self.assertIn('name="titleChoice"', page.get_data(as_text=True))
        self.assertIn('Test Builder', page.get_data(as_text=True))

    def test_property_construction_registers_and_linked_spending(self):
        from oneroot_erp.family_support import support_context
        base = dict(project="medie", action="project-register", register="stages", title="Foundation",
                    status="In Progress", budget="1000", progress="25", dueDate="2020-01-01")
        self.assertEqual(self.client.post("/app/property-projects", data=base).status_code, 302)
        context = support_context(self.sessions(), date.today(), "medie")
        stage = context["management"]["registers"]["stages"][0]
        self.assertEqual(context["management"]["budget"], 1000)
        self.assertEqual(context["management"]["progress"], 25)
        self.assertTrue(stage["overdue"])
        self.assertEqual(self.client.post("/app/property-projects", data=dict(base, progress="nan")).status_code, 400)
        self.assertEqual(self.client.post("/app/property-projects", data=dict(base, project="samsam", entryId=stage["id"])).status_code, 404)
        contractor = dict(base, register="contractors", title="Builder", status="Active", budget="500")
        self.assertEqual(self.client.post("/app/property-projects", data=contractor).status_code, 302)
        context = support_context(self.sessions(), date.today(), "medie")
        contractor_id = context["management"]["registers"]["contractors"][0]["id"]
        funding = dict(action="payment", project="medie", paymentDate=date.today().isoformat(), amountPaid="500",
                       paymentMethod="Bank Transfer", bankLabel="Project", paymentReference="BUILD-1", requestId="1"*32)
        self.assertEqual(self.client.post("/app/property-projects", data=funding).status_code, 302)
        spend = dict(action="spending", project="medie", paymentDate=date.today().isoformat(), amountPaid="200",
                     paymentMethod="Cash", category="Labour", stageId=stage["id"], contractorId=contractor_id, requestId="2"*32)
        self.assertEqual(self.client.post("/app/property-projects", data=spend).status_code, 302)
        self.assertEqual(self.client.post("/app/property-projects", data=spend).status_code, 302)
        context = support_context(self.sessions(), date.today(), "medie")
        self.assertEqual(context["balance"], 300)
        self.assertEqual(context["management"]["budgetRemaining"], 800)
        self.assertEqual(context["management"]["contractorOutstanding"], 300)
        self.assertEqual(context["management"]["registers"]["stages"][0]["paid"], 200)
        self.client.post("/app/property-projects", data=dict(action="project-settings", project="medie",
                         landStatus="Purchased", developmentStatus="On Hold"))
        self.assertEqual(len(support_context(self.sessions(), date.today(), "medie")["project"]["stages"]), 1)
        document = dict(base, register="documents", status="Received", reference="javascript:alert(1)")
        self.assertEqual(self.client.post("/app/property-projects", data=document).status_code, 400)
        page = self.client.get("/app/property-projects?project=medie")
        self.assertEqual(page.status_code, 200)
        self.assertIn("Contractors &amp; Suppliers", page.get_data(as_text=True))

    def test_private_property_sites_have_separate_balances_and_editable_status(self):
        from oneroot_erp.family_support import support_context
        db=self.sessions()
        context=support_context(db,date.today(),"medie")
        self.assertEqual(context["project"]["landStatus"],"Purchased")
        self.assertEqual(context["project"]["developmentStatus"],"Development Ongoing")
        self.assertEqual(context["cycles"],[])
        self.assertEqual(support_context(db,date.today(),"sefwi-wiawso")["project"]["developmentStatus"],"Not Started")
        data=dict(action="payment",project="medie",paymentDate=date.today().isoformat(),amountPaid="2000",
            paymentMethod="Bank Transfer",bankLabel="Private project bank",paymentReference="MED-001",requestId="e"*32)
        self.assertEqual(self.client.post("/app/property-projects",data=data).status_code,302)
        db=self.sessions()
        self.assertEqual(support_context(db,date.today(),"medie")["balance"],2000)
        self.assertEqual(support_context(db,date.today(),"samsam")["balance"],0)
        self.assertEqual(support_context(db,date.today())["balance"],0)
        spend=dict(action="spending",project="samsam",paymentDate=date.today().isoformat(),amountPaid="1",
                   paymentMethod="Bank Transfer",category="Materials",requestId="f"*32)
        self.assertEqual(self.client.post("/app/property-projects",data=spend).status_code,400)
        self.assertEqual(self.client.post("/app/property-projects",data=dict(action="project-settings",project="medie",
            landStatus="Purchased",developmentStatus="On Hold",projectNotes="Waiting for materials")).status_code,302)
        self.assertEqual(support_context(self.sessions(),date.today(),"medie")["project"]["developmentStatus"],"On Hold")
        page=self.client.get("/app/property-projects?project=medie")
        self.assertEqual(page.status_code,200)
        self.assertIn('name="project" value="medie"',page.get_data(as_text=True))
        self.assertEqual(self.client.get("/app/property-projects?project=unknown").status_code,400)
        with self.client.session_transaction() as session:session["user_id"]="cashier"
        self.assertEqual(self.client.get("/app/property-projects?project=medie").status_code,403)

    def test_project_funding_withdrawal_spending_and_old_support_stay_separate(self):
        from oneroot_erp.family_support import support_context
        first=date.today().isoformat()
        self.client.post("/app/family-support",data=dict(action="schedule",firstDueDate=first))
        db=self.sessions()
        before=daily_cash_movement_context(db,date.today())["effects"]["groceriesCash"]
        contribution=dict(action="payment",recipient="project",dueDate=first,paymentDate=first,
            amountPaid="1400",paymentMethod="Bank Transfer",bankLabel="Project 1234",paymentReference="P-1",
            fundingSource="groceries",requestId="a"*32)
        self.assertEqual(self.client.post("/app/family-support",data=contribution).status_code,302)
        self.assertEqual(self.client.post("/app/family-support",data=contribution).status_code,302)
        db=self.sessions()
        self.assertEqual(daily_cash_movement_context(db,date.today())["effects"]["groceriesCash"],before-1400)
        spend=dict(action="spending",paymentDate=first,amountPaid="200",category="Materials",paymentMethod="Bank Transfer",requestId="b"*32,notes="Supplier")
        self.assertEqual(self.client.post("/app/family-support",data=spend).status_code,302)
        db=self.sessions()
        db.add(ModuleRecord(id="old-mum-support",module_key="family_support_payments",amount=800,
                            payload=dict(recipient="mum",amountPaid=800,dueDate=first)))
        db.commit()
        c=support_context(db,date.today())
        self.assertEqual((c["contributions"],c["spending"],c["balance"]),(1400,200,1200))
        self.assertEqual(c["outstanding"],0)
        self.assertEqual(self.client.post("/app/family-support",data={**spend,"amountPaid":"1300","requestId":"d"*32}).status_code,400)
        self.assertFalse(self.sessions().scalars(select(ModuleRecord).where(ModuleRecord.module_key=="expenses")).all())

    def test_family_support_owner_only_two_month_cycle_and_no_business_expense(self):
        from oneroot_erp.family_support import support_context, cycle_date
        self.assertEqual(cycle_date(date(2026,12,31),1),date(2027,2,28))
        self.assertEqual(cycle_date(date(2026,12,31),2),date(2027,4,30))
        db=self.sessions()
        self.assertIsNone(support_context(db,date.today())["first"])
        first=date.today()-timedelta(days=1)
        self.assertEqual(self.client.post("/app/family-support",data=dict(action="schedule",firstDueDate=first.isoformat())).status_code,302)
        data=dict(action="payment",recipient="project",dueDate=first.isoformat(),paymentDate=date.today().isoformat(),
                  amountPaid="800",paymentMethod="Bank Transfer",bankLabel="Project bank 1234",paymentReference="TEST-1",requestId="c"*32)
        self.assertEqual(self.client.post("/app/family-support",data=data).status_code,302)
        self.assertEqual(self.client.post("/app/family-support",data=data).status_code,302)
        db=self.sessions()
        rows=db.scalars(select(ModuleRecord).where(ModuleRecord.module_key=="family_support_payments")).all()
        self.assertEqual(len(rows),1)
        context=support_context(db,date.today())
        self.assertEqual(context["outstanding"],600)
        self.assertEqual(context["due_count"],1)
        self.assertFalse(db.scalars(select(ModuleRecord).where(ModuleRecord.module_key.in_(["expenses","cashbook_entries"]))).all())
        self.assertEqual(self.client.post("/app/family-support",data={**data,"requestId":"d"*32}).status_code,400)
        with self.client.session_transaction() as session:session["user_id"]="cashier"
        self.assertEqual(self.client.get("/app/family-support").status_code,403)
        self.assertNotEqual(self.client.get("/app/modules/family_support_payments/export.csv").status_code,200)
        self.assertEqual(self.client.post("/app/family-support",data=data).status_code,403)

    def test_daily_cash_history_shows_total_without_counting_petty_twice(self):
        db=self.sessions()
        db.add(ModuleRecord(id="daily-total-test",module_key="daily_cash_positions",record_date=date.today(),
            payload=dict(entryType="Closing",groceriesCash=648.9,foodCash=150,momoCash=3858,momoECash=9660.66,
                         groceriesPetty=101.9,foodPetty=0,pettyTotal=101.9)))
        db.commit()
        page=self.client.get("/app/daily-cash").get_data(as_text=True)
        self.assertIn("<th>Total Money Held</th>",page)
        self.assertIn("GH₵14,317.56",page)
        self.assertIn('id="money-held-total"',page)

    def test_overall_cash_includes_receipts_and_cancels_internal_transfers(self):
        from oneroot_erp.cash_controls import overall_cash_summary
        baseline=dict(groceriesCash=101.90,foodCash=0,momoCash=5200,momoECash=8295.66,groceriesPetty=101.90)
        counted=dict(groceriesCash=648.90,foodCash=150,momoCash=3858,momoECash=9660.66,groceriesPetty=101.90)
        movements=dict(effects=dict(groceriesCash=-361,foodCash=-100,momoCash=2833,momoECash=-1675),lines=[
            dict(wallet="groceriesCash",effect=524,reference="pos-payment|x"),
            dict(wallet="groceriesCash",effect=-885,reference="cash-control|a"),
            dict(wallet="foodCash",effect=150,reference="pos-payment|y"),
            dict(wallet="foodCash",effect=-250,reference="cash-control|b"),
            dict(wallet="momoCash",effect=1135,reference="cash-control|c"),
            dict(wallet="momoCash",effect=1698,reference=""),
            dict(wallet="momoECash",effect=-1675,reference="")])
        s=overall_cash_summary(counted,baseline,movements)
        self.assertEqual(s["opening"],13597.56)
        self.assertEqual(s["movement"],697)
        self.assertEqual(s["expected"],14294.56)
        self.assertEqual(s["actual"],14317.56)
        self.assertEqual(s["variance"],23)
        self.assertEqual(s["wallets"][0]["incoming"],524)
        self.assertEqual(s["wallets"][0]["transferOut"],885)

    def test_owner_corrects_service_payment_date_without_duplicate_collection(self):
        db = self.sessions()
        r = db.get(ModuleRecord, "test-rental")
        old = dict(r.payload)
        target = date.today() - timedelta(days=1)
        url = "/app/services/equipment_rental_bookings/test-rental/payments/payment-1/date"
        data = dict(paymentDate=target.isoformat(), reason="Received later than rental", expectedUpdatedAt=r.updated_at.isoformat())
        self.assertEqual(self.client.post(url, data=data).status_code, 302)
        db = self.sessions(); r = db.get(ModuleRecord, "test-rental")
        self.assertEqual(len(r.payload["paymentEntries"]), 1)
        self.assertEqual(r.payload["paymentEntries"][0]["amountPaid"], 100)
        self.assertEqual(r.payload["paymentEntries"][0]["paymentDate"], target.isoformat())
        self.assertEqual(r.payload["returnDate"], old["returnDate"])
        sale = db.scalar(select(ModuleRecord).where(ModuleRecord.reference == "equipment-rental-payment|test-rental|payment-1"))
        self.assertEqual(sale.record_date, target)
        self.assertEqual(self.client.post(url, data=data).status_code, 409)
        with self.client.session_transaction() as session: session["user_id"] = "cashier"
        self.assertEqual(self.client.post(url, data=data).status_code, 403)

    def test_wheelbarrow_fleet_counts_out_quantities_independent_of_payment_and_filters(self):
        from oneroot_erp.app import wheelbarrow_availability
        today = date.today()
        def rental(identity, status, quantity, **extra):
            return ModuleRecord(id=identity, module_key="equipment_rental_bookings", payload=dict(
                status=status, customerName=identity, outDate=today.isoformat(),
                lineItems=[dict(name="Wheelbarrow", quantity=quantity), dict(name="Hammer", quantity=9)], **extra))
        rows = [rental("out", "Out", 4, amountPaid=10000), rental("booked", "Booked", 8),
                rental("returned", "Returned", 2), rental("cancelled", "Cancelled", 3),
                rental("date-returned", "Out", 2, returnDate=today.isoformat()),
                ModuleRecord(id="legacy", module_key="equipment_rental_bookings", payload=dict(
                    status="Out", equipmentItem="Wheel Barrow", itemQuantityTotal=3, customerName="Legacy"))]
        result = wheelbarrow_availability(rows, today)
        self.assertEqual((result["total"], result["out"], result["available"]), (26, 7, 19))
        db = self.sessions(); db.add_all(rows); db.commit()
        page = self.client.get("/app/modules/equipment_rental_bookings?status=Returned&q=nothing").get_data(as_text=True)
        self.assertIn("Wheelbarrows Currently Out</span><strong>7</strong>", page)
        self.assertIn("Wheelbarrows Remaining</span><strong>19</strong>", page)
        excess = wheelbarrow_availability([rental("too-many", "Out", 28)], today)
        self.assertEqual((excess["available"], excess["excess"]), (0, 2))

    def test_dashboard_includes_momo_commission_and_legacy_periods_once(self):
        from oneroot_erp.app import momo_commission_by_date
        today = date.today()
        yesterday = today - timedelta(days=1)
        db = self.sessions()
        rows = [
            ModuleRecord(id="dash-sale", module_key="sales", amount=139, record_date=today,
                         business_area_id="groceries", payload={"sourceType":"manual-sale"}),
            ModuleRecord(id="dash-momo", module_key="mobile_money_transactions", record_date=today,
                         payload=dict(status="Completed", transactionValue=2020, salesAmount=20)),
            ModuleRecord(id="dash-pending", module_key="mobile_money_transactions", record_date=today,
                         payload=dict(status="Pending", transactionValue=999, salesAmount=99)),
            ModuleRecord(id="dash-reconciliation", module_key="mobile_money_reconciliations", record_date=today,
                         payload=dict(serviceFees=20)),
            ModuleRecord(id="dash-legacy", module_key="mobile_money_reconciliations", record_date=yesterday,
                         payload=dict(serviceFees=4)),
        ]
        db.add_all(rows); db.commit()
        self.assertEqual(momo_commission_by_date(rows), {today:20, yesterday:4})
        with patch("oneroot_erp.app.render_template", return_value="dashboard") as render:
            self.assertEqual(self.client.get("/app/").status_code, 200)
            c = render.call_args.kwargs
        self.assertEqual(c["today_sales_total"], 159)
        self.assertEqual(c["month_sales_total"], 163 if yesterday.month == today.month else 159)
        self.assertEqual(c["today_profit_total"], 20)

    def test_shop_to_momo_transfer_moves_cash_once_without_sales_or_expenses(self):
        db = self.sessions()
        before = daily_cash_movement_context(db, date.today())["effects"]
        for source, amount, ref in [("groceries", "50", "SHOP-MOMO-A"), ("food", "30", "SHOP-MOMO-B")]:
            data=dict(date=date.today().isoformat(), source=source, destination="momoCash", amount=amount,
                      recipient="MoMo agent", reference=ref)
            self.assertEqual(self.client.post("/app/daily-cash/transfer", data=data).status_code, 302)
            self.client.post("/app/daily-cash/transfer", data=data)
        c = daily_cash_movement_context(db, date.today())
        self.assertEqual(c["effects"]["groceriesCash"] - before["groceriesCash"], -50)
        self.assertEqual(c["effects"]["foodCash"] - before["foodCash"], -30)
        self.assertEqual(c["effects"]["momoCash"] - before["momoCash"], 80)
        self.assertEqual(c["effects"]["momoECash"] - before["momoECash"], 0)
        self.assertEqual(len(db.scalars(select(ModuleRecord).where(ModuleRecord.module_key == "daily_cash_movements")).all()), 2)
        self.assertFalse(db.scalars(select(ModuleRecord).where(ModuleRecord.module_key.in_(["sales","expenses"]))).all())
        db.add(ModuleRecord(id="bread-summary-test", module_key="sales", record_date=date.today(), amount=25,
                            title="Bread POS", payload=dict(sourceType="bread-pos-summary", paymentMethod="Cash")))
        db.commit()
        updated = daily_cash_movement_context(db, date.today())
        self.assertEqual(updated["effects"], c["effects"])
        self.assertFalse(any("Bread POS" in w for w in updated["warnings"]))
        self.assertIn("Move Shop Sales Cash to MoMo", self.client.get("/app/daily-cash").get_data(as_text=True))

    def test_opening_petty_allocation_is_not_a_shop_shortage(self):
        from oneroot_erp.cash_controls import opening_comparison
        prior = dict(groceriesCash=358.90, foodCash=187, momoCash=4762, momoECash=8295.66)
        counted = dict(openingBasis="Petty allocation", groceriesCash=101.90, foodCash=0,
                       momoCash=5200, momoECash=8295.66)
        rows = {r["key"]:r for r in opening_comparison(counted, prior)}
        self.assertTrue(rows["groceriesCash"]["allocation"])
        self.assertEqual(rows["groceriesCash"]["variance"], 0)
        self.assertIsNone(rows["foodCash"]["expected"])
        self.assertEqual(rows["foodCash"]["variance"], 0)
        self.assertEqual(rows["momoCash"]["variance"], 438)
        self.assertEqual(rows["momoECash"]["variance"], 0)
        full = {r["key"]:r for r in opening_comparison({**counted, "openingBasis":"Full cash count"}, prior)}
        self.assertEqual(full["groceriesCash"]["variance"], -257)

    def test_opening_allocation_saves_chosen_petty_without_posting_money(self):
        response = self.client.post("/app/daily-cash", data=self.cash_form(openingBasis="Petty allocation",
            groceriesCash="101.90", foodCash="0", groceriesPetty="0", foodPetty="0"))
        self.assertEqual(response.status_code, 302)
        db = self.sessions()
        record = find_snapshot(db, date.today(), "Opening")
        self.assertEqual(record.payload["groceriesPetty"], 101.90)
        self.assertEqual(record.payload["foodPetty"], 0)
        self.assertEqual(record.payload["groceriesRemaining"], 0)
        self.assertFalse(db.scalars(select(ModuleRecord).where(ModuleRecord.module_key.in_(["expenses","daily_cash_movements","cashbook_entries"]))).all())

    def test_bedding_and_gift_areas_available_in_inventory_public_catalog_and_retail_pos(self):
        from oneroot_erp.app import pos_desk_area_ids, is_orderable_area
        from oneroot_erp.registry import BUSINESS_AREA_OPTIONS, INVENTORY_CATEGORY_LIBRARY
        db = self.sessions()
        for area in ["bedding-linen", "gift-care-packages", "reseller-supply-packs"]:
            self.assertIn(area, dict(BUSINESS_AREA_OPTIONS))
            self.assertIn(area, pos_desk_area_ids("groceries"))
            self.assertNotIn(area, pos_desk_area_ids("food"))
            self.assertTrue(is_orderable_area(area))
            self.assertTrue(INVENTORY_CATEGORY_LIBRARY[area])
            db.add(Product(id="test-"+area, name="Test "+area, business_area_id=area,
                           category=INVENTORY_CATEGORY_LIBRARY[area][0], user_created=True,
                           sales_price=10, cost_price=6, quantity_on_hand=2, active=True))
        db.commit()
        catalog = self.client.get("/api/public/catalog").get_json()
        self.assertTrue(catalog["ok"])
        self.assertTrue({"test-bedding-linen", "test-gift-care-packages"}.issubset({i["id"] for i in catalog["items"]}))
        form = self.client.get("/app/modules/expenses/new").get_data(as_text=True)
        self.assertIn('value="bedding-linen"', form)
        self.assertIn('value="gift-care-packages"', form)
        self.assertIn('value="reseller-supply-packs"', form)
        self.assertIn("test-reseller-supply-packs", {i["id"] for i in catalog["items"]})

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
        self.assertEqual(groceries["momoCommissionCashTotal"], 10)
        self.assertEqual(groceries["salesCashExpected"], groceries["openingCash"] + groceries["cashSalesTotal"] + 10)
        self.assertEqual(groceries["totalCashExpected"], groceries["salesCashExpected"] + groceries["creditCashCollectionsTotal"])
        self.assertEqual(food["momoCommissionCashTotal"], 0)
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
