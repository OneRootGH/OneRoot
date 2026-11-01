import unittest

from oneroot_erp.cash_controls import saved_cash_dashboard_summary


class CashDashboardTests(unittest.TestCase):
    def test_includes_all_six_accounts_without_adding_petty_twice(self):
        p=dict(groceriesCash=547, foodCash=0, groceriesPetty=191, momoCash=10100,
               momoECash=5732.32, merchantECash=1893.67, momoPay=311.5, commissionBalance=339.31,
               comparison=[dict(key="combinedCash",expected=956.4,variance=-409.4),
                           dict(key="groceriesPetty",expected=112.4,variance=78.6),
                           dict(key="momoCash",expected=10100.5,variance=-.5),
                           dict(key="momoECash",expected=5712.32,variance=20),
                           dict(key="merchantECash",expected=1653.67,variance=240),
                           dict(key="momoPay",expected=311.5,variance=0),
                           dict(key="commissionBalance",expected=339.31,variance=0)])
        result=saved_cash_dashboard_summary(p)
        self.assertEqual(result["total"],18923.8)
        self.assertEqual(result["variance"],-149.9)
        self.assertEqual(result["expected"],19073.7)
        self.assertTrue(result["needsReview"])

    def test_missing_comparison_is_unknown_not_balanced(self):
        result=saved_cash_dashboard_summary(dict(groceriesCash=100,momoCash=200))
        self.assertEqual(result["total"],300)
        self.assertIsNone(result["variance"])
        self.assertTrue(result["needsReview"])
