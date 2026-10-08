import unittest

from oneroot_erp.app import POS_FOOD_SALES_AREA_IDS, is_orderable_area, reclassify_inventory_product
from oneroot_erp.models import Product
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


if __name__ == "__main__":
    unittest.main()
