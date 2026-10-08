from dataclasses import replace
from datetime import date, timedelta
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import patch

from sqlalchemy import select

from oneroot_erp.app import create_app, set_module_record_metadata
from oneroot_erp.config import load_config
from oneroot_erp.models import Base, ModuleRecord, User
from oneroot_erp.registry import MODULES


class ServiceEditSaveTests(unittest.TestCase):
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


if __name__ == "__main__":
    unittest.main()
