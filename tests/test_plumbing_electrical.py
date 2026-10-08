import unittest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from oneroot_erp.app import POS_FOOD_SALES_AREA_IDS, is_orderable_area, reclassify_inventory_product, seed_plumbing_electrical_inventory
from oneroot_erp.models import Base, Product
from oneroot_erp.plumbing_catalog import PLUMBING_ELECTRICAL_ITEMS
from oneroot_erp.registry import BUSINESS_AREA_LABELS, INVENTORY_CATEGORY_LIBRARY


class PlumbingElectricalTests(unittest.TestCase):
    def test_area_is_available_for_inventory_counter_and_website(self):
        self.assertIn("plumbing-electrical", BUSINESS_AREA_LABELS)
        self.assertIn("plumbing-electrical", POS_FOOD_SALES_AREA_IDS)
        self.assertTrue(is_orderable_area("plumbing-electrical"))
        self.assertEqual(len(INVENTORY_CATEGORY_LIBRARY["plumbing-electrical"]), 6)

    def test_reclassification_preserves_quantity_price_and_cost(self):
        item = Product(id="test-fitting", name="Pipe Elbow", category="Plumbing & Fittings",
                       business_area_id="construction-consumables", source_category="",
                       quantity_on_hand=12, sales_price=5, cost_price=3,
                       item_type="stock", track_inventory=True)
        self.assertTrue(reclassify_inventory_product(item))
        self.assertEqual(item.business_area_id, "plumbing-electrical")
        self.assertEqual((item.quantity_on_hand, item.sales_price, item.cost_price), (12, 5, 3))
        self.assertFalse(reclassify_inventory_product(item))

    def test_catalogue_is_inactive_and_seeding_never_overwrites_edits(self):
        engine = create_engine("sqlite://")
        Base.metadata.create_all(engine)
        with Session(engine) as db:
            self.assertEqual(seed_plumbing_electrical_inventory(db), 48)
            db.commit()
            items = db.scalars(select(Product)).all()
            self.assertEqual(len(items), len(PLUMBING_ELECTRICAL_ITEMS))
            self.assertTrue(all(not item.active and not item.quantity_known and item.sku for item in items))
            self.assertTrue(all(item.sales_price == 0 and item.quantity_on_hand == 0 for item in items))
            items[0].sales_price = 15
            items[0].active = True
            db.delete(items[1])
            db.commit()
            self.assertEqual(seed_plumbing_electrical_inventory(db), 0)
            db.commit()
            self.assertEqual(items[0].sales_price, 15)
            self.assertTrue(items[0].active)
            self.assertEqual(len(db.scalars(select(Product)).all()), 47)
        engine.dispose()


if __name__ == "__main__":
    unittest.main()
