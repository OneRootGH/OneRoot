import unittest

from oneroot_erp.app import build_growth_action_plan


class GrowthActionPlanTests(unittest.TestCase):
    def test_empty_data_does_not_invent_growth_opportunities(self):
        actions = build_growth_action_plan({}, {}, {})
        self.assertEqual(len(actions), 1)
        self.assertIn("Confirm the trading records", actions[0]["title"])

    def test_expiry_and_credit_take_priority_and_stock_advice_is_conditional(self):
        actions = build_growth_action_plan(
            {"expiredCount": 2, "overdueCreditCount": 1, "creditOutstanding": 150},
            {"reorderPlan": [{"name": "Milk & Bread", "unitsSold": 12,
                              "stock": 0, "suggestedUnits": 6}]}, {})
        self.assertEqual(actions[0]["priority"], "Urgent")
        self.assertIn("including not-yet-due", actions[1]["evidence"])
        self.assertIn("warehouse", actions[2]["steps"])
        self.assertIn("not a purchase instruction", actions[2]["measure"])
        self.assertEqual(actions[2]["href"], "/app/inventory?q=Milk%20%26%20Bread")


if __name__ == "__main__":
    unittest.main()
