import unittest

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from oneroot_erp.app import POS_GROCERIES_MORE_AREA_IDS, seed_phone_charging_inventory
from oneroot_erp.models import Base, Product


class PhoneChargingTests(unittest.TestCase):
    def test_seed_separates_services_and_stock_and_preserves_edits(self):
        engine = create_engine("sqlite://")
        Base.metadata.create_all(engine)
        with Session(engine) as db:
            self.assertEqual(seed_phone_charging_inventory(db), 11)
            db.commit()
            products = db.scalars(select(Product)).all()
            services = [item for item in products if item.item_type == "service"]
            self.assertEqual(len(services), 2)
            self.assertTrue(all(not item.track_inventory and not item.stock_location for item in services))
            self.assertEqual(sum(item.track_inventory for item in products), 9)
            self.assertTrue(all(not item.active and item.sku and item.sales_price == 0 for item in products))
            products[0].sales_price = 5
            products[0].active = True
            db.delete(products[-1])
            db.commit()
            self.assertEqual(seed_phone_charging_inventory(db), 0)
            self.assertEqual(products[0].sales_price, 5)
            self.assertEqual(len(db.scalars(select(Product)).all()), 10)
        engine.dispose()
        self.assertIn("phone-accessories-charging", POS_GROCERIES_MORE_AREA_IDS)

    def test_existing_matching_product_is_not_overwritten_or_duplicated(self):
        engine = create_engine("sqlite://")
        Base.metadata.create_all(engine)
        with Session(engine) as db:
            db.add(Product(id="existing", name="Phone Charging Service",
                           business_area_id="phone-accessories-charging", sales_price=7, active=True))
            db.commit()
            self.assertEqual(seed_phone_charging_inventory(db), 10)
            db.commit()
            self.assertEqual(db.get(Product, "existing").sales_price, 7)
            self.assertTrue(db.get(Product, "existing").active)
        engine.dispose()


if __name__ == "__main__":
    unittest.main()
