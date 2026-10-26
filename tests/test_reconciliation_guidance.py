import unittest

from oneroot_erp.cash_controls import compare_counts, reconciliation_guidance


class ReconciliationGuidanceTests(unittest.TestCase):
    def test_offsetting_wallet_differences_suggest_transfer_without_mutating(self):
        baseline = dict(groceriesCash=100, foodCash=0, momoCash=100, momoECash=50)
        counted = dict(baseline, groceriesCash=60, momoCash=140)
        rows = compare_counts(counted, baseline, {})
        help = reconciliation_guidance(rows)
        self.assertEqual(help["difference"], 0)
        self.assertFalse(help["balanced"])
        self.assertTrue(any("Possible unrecorded transfer" in m for m in help["messages"]))
        self.assertEqual(counted["groceriesCash"], 60)

    def test_negative_expected_and_missing_baseline(self):
        rows = compare_counts(dict(groceriesCash=10), dict(groceriesCash=0), dict(groceriesCash=-20))
        self.assertTrue(any("negative" in m for m in reconciliation_guidance(rows)["messages"]))
        self.assertIsNone(reconciliation_guidance([])["difference"])
        self.assertFalse(reconciliation_guidance([])["balanced"])
