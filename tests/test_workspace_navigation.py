import unittest

from flask import Flask, request

from oneroot_erp.app import build_sidebar, build_workspace_tabs, workspace_link
from oneroot_erp.models import User


class WorkspaceNavigationTests(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)
        self.owner = User(role="owner", staff_role="Owner & Business Manager")

    def test_supplier_screens_share_one_hub(self):
        with self.app.test_request_context("/app/modules/supplier_price_updates"):
            request.url_rule = type("Rule", (), {"endpoint": "module_list"})()
            request.view_args = {"module_key": "supplier_price_updates"}
            hub = build_workspace_tabs(self.owner)
            self.assertEqual(hub["label"], "Suppliers")
            self.assertEqual(len(hub["links"]), 3)
            links = [link for group in build_sidebar(self.owner)
                     for section in group["sections"] for link in section["links"]]
            self.assertEqual(sum(link["label"] == "Suppliers" for link in links), 1)
            self.assertFalse(any(link["label"] == "Campaign ROI" for link in links))
            self.assertTrue(any(link["label"] == "Customers & Growth" for link in links))
            self.assertFalse(any(link["label"].endswith("Counter POS") and link["is_active"] for link in links))

    def test_tabs_respect_role_permissions(self):
        with self.app.test_request_context("/app"):
            cashier = User(role="cashier", staff_role="POS Cashier")
            self.assertIsNone(workspace_link("dashboard", cashier))
            self.assertIsNone(workspace_link("users", cashier))
            self.assertIsNone(build_workspace_tabs(None))


if __name__ == "__main__":
    unittest.main()
