from datetime import date
import unittest

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from oneroot_erp.app import (ensure_half_bread_variant, adjust_product_stock, staff_meal_week_rows,
                             ensure_default_staff_meal_schedule, pos_line_is_bread,
                             remove_product_duplication_instructions)
from oneroot_erp.models import Base, Product, ModuleRecord


class BreadStaffMealsTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://")
        Base.metadata.create_all(self.engine)
        self.db = Session(self.engine)

    def tearDown(self):
        self.db.close()
        self.engine.dispose()

    def test_half_bread_shares_stock_and_cost(self):
        source = Product(id="3591c976c751433abb17eab9f0fb303b", name="Bread",
                         business_area_id="groceries", quantity_on_hand=15, quantity_known=True,
                         cost_price=3.5, sales_price=5, active=True)
        self.db.add(source)
        self.db.commit()
        self.assertTrue(ensure_half_bread_variant(self.db))
        self.db.commit()
        half = self.db.get(Product, "bread-half-ghs750")
        self.assertEqual(half.sales_price, 7.5)
        self.assertEqual(half.cost_price, 1.75)
        self.assertTrue(pos_line_is_bread(half))
        adjust_product_stock(self.db, half, 3, direction=-1)
        self.db.commit()
        self.assertEqual(source.quantity_on_hand, 13.5)
        self.assertEqual(self.db.get(Product, "food-bread-half-ghs750").quantity_on_hand, 27)
        self.assertFalse(ensure_half_bread_variant(self.db))

    def test_weekly_rotation_and_saved_changes(self):
        rows = staff_meal_week_rows(today=date(2026, 10, 9))
        self.assertEqual(rows[0]["breakfast"], "Tom Brown")
        self.assertEqual(rows[1]["breakfast"], "Koko")
        self.assertEqual(rows[2]["breakfast"], "Tea")
        self.assertEqual(rows[4]["lunch"], "Beans and Gari")
        self.assertTrue(rows[4]["isToday"])
        self.db.add(ModuleRecord(id="meal", module_key="staff_meal_schedule", record_date=date(2026,10,9),
                                 payload={"mealPeriod":"Lunch", "menu":"Owner's alternative", "servingTime":"12:30"}))
        self.db.commit()
        rows = staff_meal_week_rows(self.db, today=date(2026,10,9))
        self.assertEqual(rows[4]["lunch"], "Owner's alternative")
        self.assertEqual(rows[4]["lunchTime"], "12:30")

    def test_roster_seed_is_repeatable(self):
        ensure_default_staff_meal_schedule(self.db)
        self.db.commit()
        ensure_default_staff_meal_schedule(self.db)
        self.db.commit()
        self.assertEqual(len(self.db.scalars(select(ModuleRecord)).all()), 28)

    def test_remove_duplication_message_preserves_real_notes(self):
        product = Product(id="copy", name="Rice", notes="Duplicated from Creed Plus Rice - 5KG. Update the name, barcode, location, and opening stock before saving.\nKeep dry.")
        self.db.add(product)
        self.db.commit()
        self.assertEqual(remove_product_duplication_instructions(self.db), 1)
        self.assertEqual(product.notes, "Keep dry.")
        self.assertEqual(remove_product_duplication_instructions(self.db), 0)


if __name__ == "__main__":
    unittest.main()
