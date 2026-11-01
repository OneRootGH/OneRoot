import unittest
from datetime import date

from oneroot_erp.app import momo_profit_for_records, profit_detail_rows, mobile_money_expected_closing
from oneroot_erp.models import ModuleRecord


class MomoServiceFeeTests(unittest.TestCase):
    def test_provider_commission_is_additional_profit_not_customer_fee(self):
        day=date(2026,11,1)
        records=[
            ModuleRecord(id="fee",module_key="mobile_money_transactions",business_area_id="mobile-money",record_date=day,
                         payload=dict(status="Completed",salesAmount=2,costAmount=0)),
            ModuleRecord(id="receipt",module_key="cashbook_entries",business_area_id="mobile-money",record_date=day,amount=100,
                         payload=dict(sourceType="mtn-commission-settlement",entryType="Cash In",amount=100)),
            ModuleRecord(id="other",module_key="cashbook_entries",business_area_id="mobile-money",record_date=day,amount=1000,
                         payload=dict(entryType="Cash In",amount=1000))]
        self.assertEqual(momo_profit_for_records(records,on_date=day),102)
        rows=profit_detail_rows(records,"2026-11","mobile-money")
        self.assertEqual(sum(r["profitTotal"] for r in rows),102)
        self.assertEqual(len(rows),2)

    def test_customer_fees_do_not_increase_momo_float(self):
        self.assertEqual(mobile_money_expected_closing(dict(openingCash=1000,cashInValue=500,cashOutValue=200,serviceFees=10)),1300)
