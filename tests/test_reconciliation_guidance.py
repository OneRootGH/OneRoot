import unittest
from datetime import date, datetime
from types import SimpleNamespace

from oneroot_erp.cash_controls import compare_counts, reconciliation_guidance, approved_opening_payload


class ReconciliationGuidanceTests(unittest.TestCase):
    def test_agreed_baseline_preserves_source_and_combined_cash(self):
        source = SimpleNamespace(id="old-closing", record_date=date(2026,10,25), updated_at=datetime(2026,10,25),
                                 payload=dict(entryType="Closing", groceriesCash=1112.90, foodCash=0,
                                              momoCash=6817.50, momoECash=7756.16))
        before = dict(source.payload)
        payload = approved_opening_payload(source, "Owner")
        self.assertEqual(source.payload, before)
        self.assertEqual(payload["cashMode"], "Combined")
        self.assertEqual(payload["openingBasis"], "Full cash count")
        self.assertEqual(round(payload["totalPhysical"]+payload["momoECash"],2),15686.56)
        self.assertEqual(payload["pettyTotal"], 0)
        self.assertEqual(payload["sourceClosingId"], source.id)
        source.payload["momoCash"] = 6800
        with self.assertRaises(ValueError):
            approved_opening_payload(source,"Owner")

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
