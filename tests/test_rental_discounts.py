import unittest

from oneroot_erp.app import service_total_due, service_payment_summary


class RentalDiscountTests(unittest.TestCase):
    def test_discount_reduces_balance_without_creating_payment(self):
        payload = dict(rentalFee=100, damageCharge=10, ownerDiscount=25)
        self.assertEqual(service_total_due("equipment_rental_bookings", payload), 85)
        summary = service_payment_summary("equipment_rental_bookings", payload)
        self.assertEqual(summary["paidTotal"], 0)
        self.assertEqual(summary["balance"], 85)

    def test_discount_does_not_make_negative_charge(self):
        self.assertEqual(service_total_due("equipment_rental_bookings", dict(rentalFee=10, ownerDiscount=20)), 0)

    def test_discount_does_not_affect_laundry(self):
        self.assertEqual(service_total_due("laundry_tickets", dict(amountDue=50, ownerDiscount=20)), 50)
