const STORAGE_KEY = "oneroot-expense-register:v1";
const SETTINGS_KEY = "oneroot-expense-register:settings:v1";
const BUDGET_STORAGE_KEY = "oneroot-expense-register:budgets:v1";
const SALES_STORAGE_KEY = "oneroot-expense-register:sales:v1";
const RENTAL_STORAGE_KEY = "oneroot-expense-register:rentals:v1";
const PETTY_CASH_STORAGE_KEY = "oneroot-expense-register:petty-cash:v1";
const PETTY_CASH_BUDGET_STORAGE_KEY = "oneroot-expense-register:petty-cash-budgets:v1";
const SALARY_STORAGE_KEY = "oneroot-expense-register:salaries:v1";
const CASHBOOK_STORAGE_KEY = "oneroot-expense-register:cashbook:v1";
const PURCHASE_ORDER_STORAGE_KEY = "oneroot-expense-register:purchase-orders:v1";
const LAUNDRY_TICKET_STORAGE_KEY = "oneroot-expense-register:laundry-tickets:v1";
const EQUIPMENT_RENTAL_STORAGE_KEY = "oneroot-expense-register:equipment-rentals:v1";
const SECURITY_DEPOSIT_STORAGE_KEY = "oneroot-expense-register:security-deposits:v1";
const SUPPLIER_STORAGE_KEY = "oneroot-expense-register:suppliers:v1";
const RECURRING_STORAGE_KEY = "oneroot-expense-register:recurring:v1";
const MAINTENANCE_STORAGE_KEY = "oneroot-expense-register:maintenance:v1";
const LEDGER_STORAGE_KEY = "oneroot-expense-register:ledgers:v1";
const MOBILE_MONEY_STORAGE_KEY = "oneroot-expense-register:mobile-money:v1";
const ASSET_STORAGE_KEY = "oneroot-expense-register:assets:v1";
const FORECAST_STORAGE_KEY = "oneroot-expense-register:forecast:v1";
const USER_PROFILE_STORAGE_KEY = "oneroot-expense-register:users:v1";
const VIEW_STORAGE_KEY = "oneroot-expense-register:view:v2";
const AUTH_SESSION_STORAGE_KEY = "oneroot-expense-register:auth-session:v1";
const ONLINE_ORDERS_AUTH_STORAGE_KEY = "oneroot-expense-register:online-orders-auth:v1";
const LIVE_DATA_STORAGE_KEYS = new Set([
  STORAGE_KEY,
  SETTINGS_KEY,
  BUDGET_STORAGE_KEY,
  SALES_STORAGE_KEY,
  RENTAL_STORAGE_KEY,
  PETTY_CASH_STORAGE_KEY,
  PETTY_CASH_BUDGET_STORAGE_KEY,
  SALARY_STORAGE_KEY,
  CASHBOOK_STORAGE_KEY,
  PURCHASE_ORDER_STORAGE_KEY,
  LAUNDRY_TICKET_STORAGE_KEY,
  EQUIPMENT_RENTAL_STORAGE_KEY,
  SECURITY_DEPOSIT_STORAGE_KEY,
  SUPPLIER_STORAGE_KEY,
  RECURRING_STORAGE_KEY,
  MAINTENANCE_STORAGE_KEY,
  LEDGER_STORAGE_KEY,
  MOBILE_MONEY_STORAGE_KEY,
  ASSET_STORAGE_KEY,
  FORECAST_STORAGE_KEY,
  USER_PROFILE_STORAGE_KEY
]);
const TENANCY_TEMPLATE_PATH = "./Tenancy_Agreement_Template.docx?v=20260712b";
const UPLOADABLE_WORKBOOK_PATH =
  "./outputs/oneroot-essentials-register/OneRoot_Essentials_Operations_Register.xlsx?v=20260712b";
const TENANCY_PROPERTY_LOCATION = "Medie New City (Parks and Gardens), Accra, Ghana";
const TENANCY_PAYMENT_CHANNEL = "MTN Mobile Money to 0242847065";
const TENANCY_ACTIVE_STATUSES = new Set(["Occupied", "Reserved"]);
const TENANCY_PLACEHOLDER_LINE = "_______________________________";
const AGREEMENT_READY_FILE_LIMIT = 6;
const PAYSLIP_READY_FILE_LIMIT = 8;
const WORKBOOK_EXPORT_ROW_LIMIT = 299;
const HOSTED_WORKSPACE_SNAPSHOT_PATH =
  "./data/public/oneroot-hosted-workspace-seed.json?v=20260721c";
const HOSTED_WORKSPACE_SNAPSHOT_FLAG_KEY =
  "oneroot-expense-register:hosted-workspace-snapshot:v1";
const HOSTED_WORKSPACE_ACCESS_FLAG_KEY =
  "oneroot-expense-register:hosted-workspace-access:v1";

const BUSINESS_AREAS = [
  {
    id: "water-equipment",
    label: "OneRoot Water & Equipment Rentals",
    shortLabel: "Water & Equipment",
    categories: [
      "Water Stock & Supply",
      "Equipment Repairs",
      "Fuel & Delivery",
      "Tools & Consumables",
      "Site Labour",
      "Utilities",
      "Marketing & Promotion",
      "Professional Services",
      "Rent & Space",
      "Other / Custom"
    ]
  },
  {
    id: "cold-store-groceries",
    label: "OneRoot Cold Store & Groceries",
    shortLabel: "Cold Store & Groceries",
    categories: [
      "Inventory Purchase",
      "Cold Chain Utilities",
      "Packaging & Carrier Bags",
      "Delivery & Transport",
      "Spoilage & Waste",
      "Repairs & Maintenance",
      "Staff Wages",
      "Marketing & Promotion",
      "Rent & Space",
      "Other / Custom"
    ]
  },
  {
    id: "laundry-services",
    label: "OneRoot Laundry Services",
    shortLabel: "Laundry Services",
    categories: [
      "Detergents & Laundry Supplies",
      "Machine Repairs",
      "Power & Water",
      "Packaging & Hangers",
      "Pickup & Delivery",
      "Staff Wages",
      "Marketing & Promotion",
      "Rent & Space",
      "Professional Services",
      "Other / Custom"
    ]
  },
  {
    id: "mobile-money",
    label: "OneRoot Mobile Money Services",
    shortLabel: "Mobile Money",
    categories: [
      "Transaction Charges",
      "Booth Utilities",
      "Cash Handling & Security",
      "Stationery & Receipt Rolls",
      "Connectivity & Data",
      "Staff Wages",
      "Licensing & Fees",
      "Marketing & Promotion",
      "Professional Services",
      "Other / Custom"
    ]
  },
  {
    id: "rentals-apartments",
    label: "OneRoot Rentals & Apartments",
    shortLabel: "Rentals & Apartments",
    categories: [
      "Suite Maintenance",
      "Cleaning & Housekeeping",
      "Utilities",
      "Linen & Furnishings",
      "Repairs & Maintenance",
      "Security",
      "Marketing & Promotion",
      "Rent & Space",
      "Professional Services",
      "Other / Custom"
    ]
  },
  {
    id: "fresh-foods-drinks",
    label: "OneRoot Fresh Foods & Drinks",
    shortLabel: "Fresh Foods & Drinks",
    categories: [
      "Ingredients & Stock",
      "Packaging & Cups",
      "Cold Storage & Ice",
      "Production Labour",
      "Delivery & Transport",
      "Spoilage & Waste",
      "Marketing & Promotion",
      "Utilities",
      "Rent & Space",
      "Other / Custom"
    ]
  },
  {
    id: "kitchen",
    label: "OneRoot Kitchen",
    shortLabel: "Kitchen",
    categories: [
      "Food Ingredients & Produce",
      "Cooking Fuel & Gas",
      "Kitchen Utensils & Smallware",
      "Packaging & Serving",
      "Cleaning & Hygiene",
      "Repairs & Maintenance",
      "Utilities",
      "Staff Wages",
      "Marketing & Promotion",
      "Other / Custom"
    ]
  },
  {
    id: "shared-operations",
    label: "OneRoot Shared Operations",
    shortLabel: "Shared Operations",
    categories: [
      "Office Supplies",
      "Software & Subscriptions",
      "Utilities",
      "Transport",
      "Professional Services",
      "Staff Wages",
      "Bank Charges",
      "Taxes & Fees",
      "Marketing & Promotion",
      "Other / Custom"
    ]
  }
];

const APARTMENT_SUITES = [
  "Peace",
  "Grace",
  "Joy",
  "Hope",
  "Faith",
  "Love",
  "Wisdom",
  "Unity",
  "Harmony",
  "Patience",
  "Blessing",
  "Kindness",
  "Victory",
  "Strength",
  "Comfort",
  "Glory",
  "Favor",
  "Other / Custom"
];

const SUITE_NAME_ALIASES = new Map([
  ["peace suite", "Peace"],
  ["grace suite", "Grace"],
  ["joy suite", "Joy"],
  ["hope suite", "Hope"],
  ["faith suite", "Faith"],
  ["love suite", "Love"],
  ["wisdom suite", "Wisdom"],
  ["unity suite", "Unity"],
  ["harmony suite", "Harmony"],
  ["additional suites / common areas", "Other / Custom"]
]);

const APARTMENT_PORTFOLIO_SUITES = APARTMENT_SUITES.filter((suite) => suite !== "Other / Custom");

const OCCUPANCY_STATUSES = [
  "Occupied",
  "Vacant",
  "Reserved",
  "Under Maintenance"
];

const RENT_CYCLE_OPTIONS = [
  { value: "6-month", label: "6 Months", months: 6 },
  { value: "12-month", label: "12 Months", months: 12 },
  { value: "custom", label: "Custom", months: 0 }
];

const PETTY_CASH_TYPES = [
  {
    id: "opening-float",
    label: "Opening Float",
    effect: 1,
    isExpense: false
  },
  {
    id: "cash-top-up",
    label: "Cash Top-up",
    effect: 1,
    isExpense: false
  },
  {
    id: "expense-paid",
    label: "Expense Paid",
    effect: -1,
    isExpense: true
  },
  {
    id: "cash-returned",
    label: "Cash Returned",
    effect: -1,
    isExpense: false
  },
  {
    id: "adjustment-in",
    label: "Adjustment In",
    effect: 1,
    isExpense: false
  },
  {
    id: "adjustment-out",
    label: "Adjustment Out",
    effect: -1,
    isExpense: false
  }
];

const SUPPLIER_STATUS_OPTIONS = [
  { value: "due", label: "Due" },
  { value: "part-paid", label: "Part Paid" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" }
];

const MAINTENANCE_PRIORITY_OPTIONS = ["Low", "Medium", "High", "Critical"];
const MAINTENANCE_STATUS_OPTIONS = ["Open", "Scheduled", "In Progress", "Completed"];
const RECURRING_MODULE_OPTIONS = [
  { value: "expense", label: "Expense" },
  { value: "supplier-bill", label: "Supplier Bill" },
  { value: "maintenance-task", label: "Maintenance Task" },
  { value: "apartment-bill", label: "Apartment Bill" }
];
const RECURRING_FREQUENCY_OPTIONS = [
  { value: "monthly", label: "Monthly", months: 1 },
  { value: "quarterly", label: "Quarterly", months: 3 },
  { value: "half-yearly", label: "Half-Yearly", months: 6 },
  { value: "yearly", label: "Yearly", months: 12 }
];
const ACTIVE_STATE_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" }
];
const SALARY_TYPE_OPTIONS = [
  "Monthly Salary",
  "Casual Wage",
  "Overtime",
  "Bonus",
  "Advance"
];
const CASHBOOK_ACCOUNT_TYPE_OPTIONS = [
  { value: "cashbook", label: "Cashbook" },
  { value: "bankbook", label: "Bankbook" }
];
const CASHBOOK_ENTRY_TYPE_OPTIONS = [
  { value: "money-in", label: "Money In", effect: 1 },
  { value: "money-out", label: "Money Out", effect: -1 },
  { value: "transfer-in", label: "Transfer In", effect: 1 },
  { value: "transfer-out", label: "Transfer Out", effect: -1 },
  { value: "bank-charge", label: "Bank Charge", effect: -1 },
  { value: "interest", label: "Interest / Credit", effect: 1 },
  { value: "adjustment-in", label: "Adjustment In", effect: 1 },
  { value: "adjustment-out", label: "Adjustment Out", effect: -1 }
];
const PURCHASE_ORDER_STATUS_OPTIONS = [
  "Requested",
  "Approved",
  "Ordered",
  "Part Received",
  "Received",
  "Cancelled"
];
const LAUNDRY_SERVICE_OPTIONS = ["Normal", "Express"];
const LAUNDRY_STATUS_OPTIONS = ["Received", "Washing", "Ready", "Delivered", "Cancelled"];
const LAUNDRY_DELIVERY_OPTIONS = ["Walk-in", "Pickup", "Delivery"];
const EQUIPMENT_RENTAL_STATUS_OPTIONS = ["Booked", "Out", "Returned", "Cancelled"];
const EQUIPMENT_CONDITION_OPTIONS = ["Excellent", "Good", "Fair", "Damaged"];
const EQUIPMENT_RENTAL_ITEM_OPTIONS = [
  "Wheelbarrow",
  "Concrete Vibrator",
  "Cutting Machine",
  "Head Pan",
  "Shovel",
  "Impact Drill",
  "Nails",
  "Water Hose",
  "Water Drum",
  "Other / Custom"
];
const SECURITY_DEPOSIT_STATUS_OPTIONS = [
  "Active Hold",
  "Move-out Review",
  "Part Refunded",
  "Closed"
];
const LEDGER_PARTY_TYPE_OPTIONS = [
  { value: "tenant", label: "Tenant" },
  { value: "customer", label: "Customer" },
  { value: "community-account", label: "Community Account" },
  { value: "other", label: "Other" }
];
const LEDGER_ENTRY_TYPE_OPTIONS = [
  { value: "charge", label: "Charge", effect: 1 },
  { value: "payment", label: "Payment Received", effect: -1 },
  { value: "deposit", label: "Deposit / Advance", effect: -1 },
  { value: "credit-note", label: "Credit Note", effect: -1 },
  { value: "adjustment-up", label: "Adjustment Up", effect: 1 },
  { value: "adjustment-down", label: "Adjustment Down", effect: -1 }
];
const MOBILE_MONEY_PROVIDER_OPTIONS = [
  "MTN Mobile Money",
  "Telecel Cash",
  "AirtelTigo Money",
  "Other / Custom"
];
const ASSET_CATEGORY_OPTIONS = [
  "Equipment",
  "Appliance",
  "Furniture",
  "Electronics",
  "Tool",
  "Vehicle / Transport",
  "Property Fixture",
  "Other / Custom"
];
const ASSET_CONDITION_OPTIONS = ["Excellent", "Good", "Fair", "Poor"];
const ASSET_STATUS_OPTIONS = ["In Use", "In Storage", "Under Repair", "Retired", "Sold"];
const USER_ROLE_OPTIONS = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "finance", label: "Finance" },
  { value: "operations", label: "Operations" },
  { value: "apartment-manager", label: "Apartment Manager" },
  { value: "sales-stock-operator", label: "Sales & Stock Operator" },
  { value: "cashier", label: "Cashier" },
  { value: "viewer", label: "Viewer" }
];
const REPORT_PRESET_OPTIONS = [
  { value: "month-to-date", label: "This Month" },
  { value: "quarter-to-date", label: "Quarter To Date" },
  { value: "year-to-date", label: "Year To Date" },
  { value: "last-6-months", label: "Last 6 Months" },
  { value: "all-time", label: "All Time" },
  { value: "custom", label: "Custom Range" }
];

const BASE_PAYMENT_METHODS = [
  "Bank Transfer",
  "Cash",
  "Card",
  "Mobile Money",
  "Cheque",
  "Petty Cash"
];

const RECEIPT_STATUSES = ["Uploaded", "Pending", "Not Required"];

const CURRENCY_OPTIONS = [
  { code: "GHS", label: "GHS (GH₵)", locale: "en-GH" },
  { code: "USD", label: "USD ($)", locale: "en-US" },
  { code: "EUR", label: "EUR (€)", locale: "en-IE" },
  { code: "GBP", label: "GBP (£)", locale: "en-GB" },
  { code: "NGN", label: "NGN (₦)", locale: "en-NG" }
];

const VIEW_META = {
  overview: {
    eyebrow: "Workspace",
    title: "Dashboard",
    summary: "A live operating dashboard across the full OneRoot essentials ecosystem."
  },
  kpi: {
    eyebrow: "Performance",
    title: "KPI Dashboard",
    summary: "Track headline performance, cash movement, occupancy, operational workload, and follow-up health in one view."
  },
  reports: {
    eyebrow: "Insights",
    title: "Reports",
    summary: "Review cross-business performance, balances, and trends from one reporting workspace."
  },
  search: {
    eyebrow: "Control Center",
    title: "Global Search",
    summary: "Search tenants, customers, suppliers, jobs, bookings, deposits, and finance records from one place."
  },
  reminders: {
    eyebrow: "Follow-Up",
    title: "Reminder Center",
    summary: "See every due, overdue, ready-for-pickup, and collection reminder with copy-ready messages."
  },
  messages: {
    eyebrow: "Messaging",
    title: "WhatsApp / SMS",
    summary: "Build ready-to-send collection, delivery, laundry, rental, and follow-up messages from live records."
  },
  ledgers: {
    eyebrow: "Collections",
    title: "Ledgers",
    summary: "Track customer and tenant balances, manual charges and payments, and export reminder messages."
  },
  expenses: {
    eyebrow: "Operations",
    title: "Expenses",
    summary: "Record and review spending by business area, payment method, and receipt status."
  },
  sales: {
    eyebrow: "Operations",
    title: "Daily Sales",
    summary: "Capture total sales amounts for each business area without extra unit tracking."
  },
  pos: {
    eyebrow: "Sales Counter",
    title: "POS",
    summary: "Sell quickly with searchable products, barcode support, area-linked checkout, and printable receipts."
  },
  inventory: {
    eyebrow: "Stock Control",
    title: "Inventory",
    summary: "Track product stock, adjustments, pricing, categories, and fast lookups from one inventory workspace."
  },
  "mobile-money": {
    eyebrow: "Reconciliation",
    title: "Mobile Money",
    summary: "Reconcile float movement, cash-in, cash-out, fees, and closing variances each day."
  },
  apartments: {
    eyebrow: "Operations",
    title: "Apartments",
    summary: "Track rent collections and apartment-related bills in one place."
  },
  "petty-cash": {
    eyebrow: "Cash Control",
    title: "Petty Cash",
    summary: "Manage float movements, petty cash spending, and receipt follow-up with a live ledger."
  },
  cashbook: {
    eyebrow: "Cash & Bank",
    title: "Cashbook / Bankbook",
    summary: "Track cash and bank movements, transfers, and charges by account and business area."
  },
  treasury: {
    eyebrow: "Liquidity Control",
    title: "Treasury",
    summary:
      "Reconcile internal transfers, monitor real spend against liquid balances, and see money left now across cash, bank, and mobile money."
  },
  procurement: {
    eyebrow: "Purchasing",
    title: "Procurement",
    summary: "Raise purchase orders, track approvals and deliveries, and monitor unpaid or overdue buying activity."
  },
  laundry: {
    eyebrow: "Laundry Operations",
    title: "Laundry Tickets",
    summary: "Create job tickets, track Normal and Express work, and watch ready or overdue laundry jobs."
  },
  "equipment-rentals": {
    eyebrow: "Rental Operations",
    title: "Equipment Rentals",
    summary: "Track equipment bookings, deposits, return dates, damage notes, and overdue rentals."
  },
  deposits: {
    eyebrow: "Tenant Control",
    title: "Deposits & Charges",
    summary: "Manage security deposits, move-out deductions, refunds, and tenant charge balances."
  },
  salary: {
    eyebrow: "Payroll",
    title: "Salary",
    summary: "Manage payroll, deductions, part-payments, salary balances, and staff KPI targets by business area."
  },
  suppliers: {
    eyebrow: "Payables",
    title: "Suppliers",
    summary: "Track supplier bills, what has been paid, and what is still due across OneRoot business areas."
  },
  assets: {
    eyebrow: "Asset Control",
    title: "Assets",
    summary: "Register equipment, fixtures, and tools with value, condition, and service due follow-up."
  },
  forecast: {
    eyebrow: "Planning",
    title: "Forecast",
    summary: "Plan revenue and spend by month and compare actual results against area-level targets."
  },
  recurring: {
    eyebrow: "Automation",
    title: "Recurring",
    summary: "Schedule repeated transactions and generate the next due expense, supplier, maintenance, or apartment record."
  },
  maintenance: {
    eyebrow: "Operations",
    title: "Maintenance",
    summary: "Log repairs, servicing, cleaning work, due dates, and completion costs across the business."
  },
  access: {
    eyebrow: "Workspace Access",
    title: "Access",
    summary: "Manage role-based users, password login, and workspace session access on this device."
  },
  "data-hub": {
    eyebrow: "Tools",
    title: "Data Hub",
    summary: "Download or export live workbooks, restore backups, and manage imports."
  }
};

const VIEW_VISUALS = {
  overview: { icon: "dashboard", accent: "#8dc9b0", soft: "rgba(141, 201, 176, 0.2)" },
  kpi: { icon: "chart", accent: "#f0bf7d", soft: "rgba(240, 191, 125, 0.2)" },
  reports: { icon: "report", accent: "#f5d79d", soft: "rgba(245, 215, 157, 0.22)" },
  search: { icon: "search", accent: "#cfe4bf", soft: "rgba(207, 228, 191, 0.2)" },
  reminders: { icon: "bell", accent: "#f4b277", soft: "rgba(244, 178, 119, 0.2)" },
  messages: { icon: "chat", accent: "#b2d9d2", soft: "rgba(178, 217, 210, 0.22)" },
  expenses: { icon: "receipt", accent: "#d7d5a8", soft: "rgba(215, 213, 168, 0.18)" },
  sales: { icon: "cart", accent: "#f5ca8b", soft: "rgba(245, 202, 139, 0.18)" },
  pos: { icon: "scan", accent: "#d2c4ef", soft: "rgba(210, 196, 239, 0.2)" },
  inventory: { icon: "box", accent: "#c6dfc4", soft: "rgba(198, 223, 196, 0.2)" },
  laundry: { icon: "bubbles", accent: "#b7d9f2", soft: "rgba(183, 217, 242, 0.2)" },
  "equipment-rentals": { icon: "tool", accent: "#d4e3b0", soft: "rgba(212, 227, 176, 0.2)" },
  apartments: { icon: "building", accent: "#e8cd9c", soft: "rgba(232, 205, 156, 0.22)" },
  deposits: { icon: "shield", accent: "#c7d5ef", soft: "rgba(199, 213, 239, 0.2)" },
  "petty-cash": { icon: "wallet", accent: "#b7dcae", soft: "rgba(183, 220, 174, 0.2)" },
  cashbook: { icon: "ledger", accent: "#dfcfad", soft: "rgba(223, 207, 173, 0.2)" },
  treasury: { icon: "ledger", accent: "#d3c2a0", soft: "rgba(211, 194, 160, 0.2)" },
  "mobile-money": { icon: "phone", accent: "#aee1bf", soft: "rgba(174, 225, 191, 0.2)" },
  ledgers: { icon: "book", accent: "#d8d0b7", soft: "rgba(216, 208, 183, 0.18)" },
  procurement: { icon: "clipboard", accent: "#ecd5b1", soft: "rgba(236, 213, 177, 0.2)" },
  salary: { icon: "people", accent: "#c6dbf5", soft: "rgba(198, 219, 245, 0.2)" },
  suppliers: { icon: "truck", accent: "#f3c8a3", soft: "rgba(243, 200, 163, 0.22)" },
  assets: { icon: "tool", accent: "#d6d7f1", soft: "rgba(214, 215, 241, 0.2)" },
  forecast: { icon: "chart", accent: "#bfdcbf", soft: "rgba(191, 220, 191, 0.2)" },
  recurring: { icon: "loop", accent: "#f0d09e", soft: "rgba(240, 208, 158, 0.2)" },
  maintenance: { icon: "wrench", accent: "#e7c0a2", soft: "rgba(231, 192, 162, 0.22)" },
  access: { icon: "lock", accent: "#c7d3c0", soft: "rgba(199, 211, 192, 0.2)" },
  "data-hub": { icon: "cloud", accent: "#b8dce9", soft: "rgba(184, 220, 233, 0.2)" }
};

const AREA_VISUAL_PALETTE = [
  { accent: "#3e8790", soft: "rgba(62, 135, 144, 0.16)" },
  { accent: "#b97238", soft: "rgba(185, 114, 56, 0.16)" },
  { accent: "#617fc2", soft: "rgba(97, 127, 194, 0.16)" },
  { accent: "#3f915b", soft: "rgba(63, 145, 91, 0.16)" },
  { accent: "#8d6242", soft: "rgba(141, 98, 66, 0.16)" },
  { accent: "#aa6b92", soft: "rgba(170, 107, 146, 0.16)" },
  { accent: "#7a8447", soft: "rgba(122, 132, 71, 0.16)" },
  { accent: "#57646f", soft: "rgba(87, 100, 111, 0.16)" }
];

const ROLE_PRESET_MAP = {
  owner: {
    description: "Full access to every OneRoot menu, export, backup, and control.",
    views: Object.keys(VIEW_META)
  },
  admin: {
    description: "Manage day-to-day operations across finance, apartments, and controls.",
    views: Object.keys(VIEW_META)
  },
  finance: {
    description: "Focus on sales, expenses, ledgers, cash, payroll, suppliers, reports, forecast, and data tools.",
    views: [
      "overview",
      "kpi",
      "reports",
      "search",
      "reminders",
      "messages",
      "ledgers",
      "expenses",
      "sales",
      "pos",
      "inventory",
      "mobile-money",
      "apartments",
      "petty-cash",
      "cashbook",
      "treasury",
      "procurement",
      "deposits",
      "salary",
      "suppliers",
      "forecast",
      "data-hub"
    ]
  },
  operations: {
    description: "Handle service delivery, apartments, assets, recurring controls, and maintenance.",
    views: [
      "overview",
      "kpi",
      "reports",
      "search",
      "reminders",
      "messages",
      "ledgers",
      "sales",
      "pos",
      "inventory",
      "laundry",
      "equipment-rentals",
      "cashbook",
      "treasury",
      "mobile-money",
      "apartments",
      "deposits",
      "procurement",
      "assets",
      "forecast",
      "recurring",
      "maintenance"
    ]
  },
  "apartment-manager": {
    description: "Work on tenants, rent cycles, reminders, and apartment maintenance.",
    views: [
      "overview",
      "kpi",
      "reports",
      "search",
      "reminders",
      "messages",
      "ledgers",
      "apartments",
      "deposits",
      "assets",
      "maintenance"
    ]
  },
  "sales-stock-operator": {
    description:
      "Use only the Sales & Stock menus together with Laundry Tickets and Equipment Rentals.",
    views: [
      "sales",
      "pos",
      "inventory",
      "online-orders",
      "laundry",
      "equipment-rentals"
    ]
  },
  cashier: {
    description: "Capture daily inflows, petty cash, mobile money, and customer collections.",
    views: [
      "overview",
      "kpi",
      "search",
      "reminders",
      "messages",
      "ledgers",
      "sales",
      "pos",
      "inventory",
      "laundry",
      "equipment-rentals",
      "petty-cash",
      "cashbook",
      "treasury",
      "mobile-money"
    ]
  },
  viewer: {
    description: "Read dashboards, reports, and planning views without operational modules.",
    views: ["overview", "kpi", "reports", "search", "forecast", "treasury"]
  }
};

const DEFAULT_BUSINESS_AREA_ID = "shared-operations";
const OTHER_CUSTOM_OPTION = "Other / Custom";
const BUSINESS_AREA_MAP = new Map(BUSINESS_AREAS.map((area) => [area.id, area]));
const PETTY_CASH_TYPE_MAP = new Map(PETTY_CASH_TYPES.map((type) => [type.id, type]));
const CASHBOOK_ENTRY_TYPE_MAP = new Map(
  CASHBOOK_ENTRY_TYPE_OPTIONS.map((type) => [type.value, type])
);
const LEDGER_ENTRY_TYPE_MAP = new Map(
  LEDGER_ENTRY_TYPE_OPTIONS.map((type) => [type.value, type])
);
const WORKBOOK_EXPORT_CONFIG = {
  Expenses: {
    columns: {
      A: "date",
      B: "string",
      C: "string",
      D: "string",
      E: "string",
      F: "string",
      G: "string",
      H: "number",
      I: "string"
    },
    validations: ["B2:B300", "D2:D300", "F2:F300", "G2:G300"]
  },
  Budget_Planner: {
    columns: {
      A: "month",
      B: "string",
      C: "string",
      D: "number",
      G: "string"
    },
    validations: ["B2:B300", "C2:C300"]
  },
  Daily_Sales: {
    columns: {
      A: "date",
      B: "string",
      C: "number",
      D: "string"
    },
    validations: ["B2:B300"]
  },
  Apartments: {
    columns: {
      A: "month",
      B: "string",
      C: "string",
      D: "string",
      E: "string",
      F: "string",
      G: "string",
      H: "date",
      I: "date",
      J: "string",
      K: "number",
      L: "number",
      M: "number",
      N: "number",
      O: "date",
      P: "date",
      Q: "date",
      R: "date",
      S: "date",
      T: "string",
      U: "string",
      V: "number",
      W: "number",
      X: "number",
      Y: "number",
      Z: "date",
      AA: "number",
      AB: "date",
      AC: "string",
      AD: "string",
      AE: "number",
      AF: "number",
      AG: "number",
      AH: "string",
      AI: "string"
    },
    validations: ["B2:B300", "C2:C300", "J2:J300", "T2:T300", "AC2:AC300"]
  },
  Petty_Cash: {
    columns: {
      A: "date",
      B: "string",
      C: "string",
      D: "string",
      E: "string",
      F: "string",
      G: "number",
      I: "string"
    },
    validations: ["B2:B300", "C2:C300", "D2:D300", "F2:F300"]
  },
  Petty_Cash_Budget: {
    columns: {
      A: "month",
      B: "string",
      C: "number",
      D: "string"
    },
    validations: ["B2:B300"]
  },
  Salary_Register: {
    columns: {
      A: "month",
      B: "string",
      C: "string",
      D: "string",
      E: "string",
      F: "number",
      G: "number",
      I: "number",
      K: "date",
      L: "date",
      M: "string",
      N: "string",
      P: "string",
      Q: "string",
      R: "string",
      S: "number",
      T: "number"
    },
    validations: ["B2:B300", "E2:E300", "M2:M300"]
  },
  Supplier_Ledger: {
    columns: {
      A: "date",
      B: "string",
      C: "string",
      D: "string",
      E: "string",
      F: "string",
      G: "number",
      H: "number",
      I: "date",
      J: "date",
      K: "string",
      N: "string"
    },
    validations: ["B2:B300", "D2:D300", "K2:K300"]
  },
  Recurring_Controls: {
    columns: {
      A: "string",
      B: "string",
      C: "string",
      D: "string",
      E: "string",
      F: "string",
      G: "number",
      H: "string",
      I: "date",
      J: "date",
      K: "date",
      L: "string",
      M: "string",
      N: "string"
    },
    validations: ["B2:B300", "C2:C300", "D2:D300", "H2:H300", "L2:L300", "M2:M300"]
  },
  Maintenance_Log: {
    columns: {
      A: "date",
      B: "string",
      C: "string",
      D: "string",
      E: "string",
      F: "string",
      G: "string",
      H: "date",
      I: "number",
      J: "number",
      K: "string",
      L: "string"
    },
    validations: ["B2:B300", "F2:F300", "G2:G300"]
  }
};

const DEMO_EXPENSES = [
  {
    businessAreaId: "water-equipment",
    date: "2026-06-03",
    vendor: "Kumasi Water Works",
    category: "Water Stock & Supply",
    description: "Bulk water purchase for neighbourhood delivery rounds",
    paymentMethod: "Mobile Money",
    receiptStatus: "Uploaded",
    amount: 420.5,
    notes: "Morning refill before community deliveries"
  },
  {
    businessAreaId: "cold-store-groceries",
    date: "2026-06-05",
    vendor: "Aboabo Frozen Hub",
    category: "Inventory Purchase",
    description: "Restock of tilapia and assorted frozen fish",
    paymentMethod: "Card",
    receiptStatus: "Uploaded",
    amount: 1189,
    notes: "Weekend demand restock"
  },
  {
    businessAreaId: "laundry-services",
    date: "2026-06-09",
    vendor: "Omo Ghana",
    category: "Detergents & Laundry Supplies",
    description: "Detergent, starch, and scent boosters for express loads",
    paymentMethod: "Cash",
    receiptStatus: "Uploaded",
    amount: 315,
    notes: ""
  },
  {
    businessAreaId: "mobile-money",
    date: "2026-06-11",
    vendor: "MTN Business",
    category: "Connectivity & Data",
    description: "Data bundle for transaction support and notifications",
    paymentMethod: "Mobile Money",
    receiptStatus: "Pending",
    amount: 189,
    notes: "Awaiting emailed receipt"
  },
  {
    businessAreaId: "rentals-apartments",
    date: "2026-05-28",
    vendor: "Atinga Plumbing Works",
    category: "Suite Maintenance",
    description: "Bathroom tap replacement and leak repair",
    paymentMethod: "Bank Transfer",
    receiptStatus: "Uploaded",
    amount: 540,
    notes: "Completed before new tenant check-in"
  }
];

const DEMO_SALES = [
  {
    businessAreaId: "water-equipment",
    date: "2026-06-24",
    amount: 1380,
    notes: "Three delivery rounds and two wheelbarrow rentals"
  },
  {
    businessAreaId: "cold-store-groceries",
    date: "2026-06-24",
    amount: 2265,
    notes: "Strong evening household demand"
  },
  {
    businessAreaId: "laundry-services",
    date: "2026-06-24",
    amount: 480,
    notes: "School uniform rush"
  },
  {
    businessAreaId: "mobile-money",
    date: "2026-06-24",
    amount: 620,
    notes: "Community cash-in and transfer traffic"
  }
];

const DEMO_RENTALS = [
  {
    month: "2026-06",
    suite: "Peace",
    occupancyStatus: "Occupied",
    tenantName: "Yaw Boateng",
    tenantPhone: "0240001001",
    emergencyContact: "Esi Boateng - 0240002991",
    tenantIdRef: "GH-ID-PEACE-01",
    moveInDate: "2026-01-01",
    moveOutDate: "",
    rentCycleType: "6-month",
    rentCycleMonths: 6,
    rentCycleAmount: 1400,
    rentDue: 1400,
    rentPaid: 1400,
    rentCoverageStartDate: "2026-06-01",
    rentCoverageEndDate: "2026-11-30",
    nextRentDueDate: "2026-12-01",
    renewalDate: "2026-12-01",
    rentPaymentDate: "2026-06-01",
    rentPaymentMethod: "Bank Transfer",
    rentPaymentReference: "RTR-PEACE-0601",
    rentReceivedBy: "Philip",
    waterBill: 120,
    toiletBill: 45,
    sweepingBill: 80,
    wasteBill: 35,
    billDueDate: "2026-06-05",
    billAmountPaid: 280,
    billPaymentDate: "2026-06-08",
    billPaymentMethod: "Mobile Money",
    billPaymentReference: "BILL-PEACE-0608",
    billReceivedBy: "Abena",
    arrearsBroughtForward: 0,
    lateFee: 0,
    customBillItems: "Security contribution: 25",
    notes: "Fully settled for June"
  },
  {
    month: "2026-06",
    suite: "Grace",
    occupancyStatus: "Occupied",
    tenantName: "Akosua Mensah",
    tenantPhone: "0240001002",
    emergencyContact: "Kojo Mensah - 0240002882",
    tenantIdRef: "GH-ID-GRACE-02",
    moveInDate: "2025-12-15",
    moveOutDate: "",
    rentCycleType: "12-month",
    rentCycleMonths: 12,
    rentCycleAmount: 1400,
    rentDue: 1400,
    rentPaid: 1000,
    rentCoverageStartDate: "2026-06-01",
    rentCoverageEndDate: "2027-05-31",
    nextRentDueDate: "2026-06-10",
    renewalDate: "2027-05-15",
    rentPaymentDate: "2026-06-10",
    rentPaymentMethod: "Cash",
    rentPaymentReference: "RTR-GRACE-0610",
    rentReceivedBy: "Philip",
    waterBill: 110,
    toiletBill: 45,
    sweepingBill: 80,
    wasteBill: 35,
    billDueDate: "2026-06-05",
    billAmountPaid: 180,
    billPaymentDate: "2026-06-11",
    billPaymentMethod: "Cash",
    billPaymentReference: "BILL-GRACE-0611",
    billReceivedBy: "Abena",
    arrearsBroughtForward: 120,
    lateFee: 35,
    customBillItems: "Shared light contribution: 15",
    notes: "Balance expected end of month"
  },
  {
    month: "2026-06",
    suite: "Harmony",
    occupancyStatus: "Reserved",
    tenantName: "Kofi Asare",
    tenantPhone: "0240001003",
    emergencyContact: "Ama Asare - 0240002773",
    tenantIdRef: "GH-ID-HARMONY-03",
    moveInDate: "2026-06-20",
    moveOutDate: "",
    rentCycleType: "custom",
    rentCycleMonths: 18,
    rentCycleAmount: 1600,
    rentDue: 1600,
    rentPaid: 1600,
    rentCoverageStartDate: "2026-07-01",
    rentCoverageEndDate: "2027-12-31",
    nextRentDueDate: "2028-01-01",
    renewalDate: "2027-12-01",
    rentPaymentDate: "2026-06-20",
    rentPaymentMethod: "Bank Transfer",
    rentPaymentReference: "RTR-HARMONY-0620",
    rentReceivedBy: "Philip",
    waterBill: 130,
    toiletBill: 50,
    sweepingBill: 90,
    wasteBill: 40,
    billDueDate: "2026-07-05",
    billAmountPaid: 0,
    billPaymentDate: "",
    billPaymentMethod: "",
    billPaymentReference: "",
    billReceivedBy: "",
    arrearsBroughtForward: 0,
    lateFee: 0,
    customBillItems: "Fridge handling fee: 30",
    notes: "Tenant renewed on time"
  }
];

const DEMO_PETTY_CASH = [
  {
    date: "2026-06-01",
    transactionTypeId: "opening-float",
    businessAreaId: "shared-operations",
    category: "",
    vendor: "Opening drawer balance",
    receiptStatus: "Not Required",
    amount: 800,
    notes: "Start-of-month petty cash float"
  },
  {
    date: "2026-06-07",
    transactionTypeId: "expense-paid",
    businessAreaId: "fresh-foods-drinks",
    category: "Ingredients & Stock",
    vendor: "Kejetia Market",
    receiptStatus: "Uploaded",
    amount: 95,
    notes: "Quick ingredient top-up for Sobolo production"
  },
  {
    date: "2026-06-13",
    transactionTypeId: "cash-top-up",
    businessAreaId: "shared-operations",
    category: "",
    vendor: "Top-up from main cash box",
    receiptStatus: "Not Required",
    amount: 250,
    notes: "Added cash ahead of weekend operations"
  }
];

const DEMO_PETTY_CASH_BUDGETS = [
  {
    month: "2026-06",
    businessAreaId: "fresh-foods-drinks",
    amount: 250,
    notes: "Fast-moving petty cash support for drinks and cold items"
  },
  {
    month: "2026-06",
    businessAreaId: "shared-operations",
    amount: 400,
    notes: "General small-cash operating buffer"
  }
];

const DEMO_SUPPLIERS = [
  {
    invoiceDate: "2026-06-05",
    businessAreaId: "cold-store-groceries",
    supplierName: "Auntie Mansa Foods",
    category: "Inventory Purchase",
    itemDescription: "Frozen fish and sausages restock",
    invoiceReference: "AMF-0605",
    amountDue: 1450,
    amountPaid: 900,
    dueDate: "2026-06-20",
    paymentDate: "2026-06-10",
    paymentMethod: "Mobile Money",
    notes: "Balance to be cleared after month-end sales"
  },
  {
    invoiceDate: "2026-06-14",
    businessAreaId: "water-equipment",
    supplierName: "Kasoa Tools Depot",
    category: "Tools & Consumables",
    itemDescription: "Concrete nails and drill accessories",
    invoiceReference: "KTD-1480",
    amountDue: 520,
    amountPaid: 0,
    dueDate: "2026-06-28",
    paymentDate: "",
    paymentMethod: "",
    notes: "Supplier follow-up needed"
  }
];

const DEMO_RECURRING_CONTROLS = [
  {
    title: "Monthly grocery freezer restock supplier bill",
    moduleType: "supplier-bill",
    businessAreaId: "cold-store-groceries",
    category: "Inventory Purchase",
    counterparty: "Auntie Mansa Foods",
    suite: "",
    amount: 1800,
    frequency: "monthly",
    startDate: "2026-01-05",
    nextDueDate: "2026-06-30",
    lastGeneratedDate: "2026-05-30",
    priority: "",
    active: true,
    notes: "Create next supplier bill on the last day of each month."
  },
  {
    title: "Peace monthly bills cycle",
    moduleType: "apartment-bill",
    businessAreaId: "rentals-apartments",
    category: "",
    counterparty: "",
    suite: "Peace",
    amount: 0,
    frequency: "monthly",
    startDate: "2026-01-05",
    nextDueDate: "2026-07-01",
    lastGeneratedDate: "2026-06-01",
    priority: "",
    active: true,
    notes: "Generate the next apartment month from the latest suite profile."
  },
  {
    title: "Laundry iron servicing reminder",
    moduleType: "maintenance-task",
    businessAreaId: "laundry-services",
    category: "",
    counterparty: "Bright Repairs",
    suite: "Laundry work area",
    amount: 120,
    frequency: "quarterly",
    startDate: "2026-03-15",
    nextDueDate: "2026-06-30",
    lastGeneratedDate: "2026-03-30",
    priority: "Medium",
    active: true,
    notes: "Quarterly maintenance reminder for pressing equipment."
  }
];

const DEMO_MAINTENANCE_RECORDS = [
  {
    reportedDate: "2026-06-08",
    businessAreaId: "rentals-apartments",
    location: "Grace",
    assetItem: "Bathroom tap",
    issue: "Low water pressure reported by tenant",
    priority: "High",
    status: "In Progress",
    dueDate: "2026-06-30",
    estimatedCost: 180,
    actualCost: 0,
    vendor: "Kwame Plumbing Works",
    notes: "Awaiting replacement valve"
  },
  {
    reportedDate: "2026-06-03",
    businessAreaId: "water-equipment",
    location: "Water delivery point",
    assetItem: "Wheelbarrow tyre",
    issue: "Tyre puncture and rim adjustment",
    priority: "Medium",
    status: "Completed",
    dueDate: "2026-06-06",
    estimatedCost: 70,
    actualCost: 65,
    vendor: "Roadside Vulcanizer",
    notes: "Completed and back in use"
  }
];

const DEMO_SALARIES = [
  {
    month: "2026-06",
    businessAreaId: "cold-store-groceries",
    staffName: "Adjoa Mensima",
    roleTitle: "Cold Store Attendant",
    salaryType: "Monthly Salary",
    grossAmount: 950,
    deductionAmount: 50,
    amountPaid: 900,
    dueDate: "2026-06-30",
    paymentDate: "2026-06-28",
    paymentMethod: "Mobile Money",
    paymentReference: "SAL-CDS-0628",
    kpiMetric: "Cold store stock checks completed",
    kpiUnit: "checks",
    kpiTarget: 30,
    kpiActual: 32,
    notes: "June payroll settled in full."
  },
  {
    month: "2026-06",
    businessAreaId: "laundry-services",
    staffName: "Michael Tetteh",
    roleTitle: "Laundry Assistant",
    salaryType: "Monthly Salary",
    grossAmount: 780,
    deductionAmount: 0,
    amountPaid: 500,
    dueDate: "2026-06-30",
    paymentDate: "2026-06-27",
    paymentMethod: "Cash",
    paymentReference: "SAL-LDY-0627",
    kpiMetric: "Laundry jobs completed",
    kpiUnit: "jobs",
    kpiTarget: 85,
    kpiActual: 61,
    notes: "Balance to be cleared after weekend collections."
  },
  {
    month: "2026-07",
    businessAreaId: "kitchen",
    staffName: "Esi Arthur",
    roleTitle: "Kitchen Support",
    salaryType: "Advance",
    grossAmount: 400,
    deductionAmount: 0,
    amountPaid: 200,
    dueDate: "2026-07-31",
    paymentDate: "2026-07-01",
    paymentMethod: "Mobile Money",
    paymentReference: "SAL-KTN-0701",
    kpiMetric: "Kitchen orders prepared",
    kpiUnit: "orders",
    kpiTarget: 120,
    kpiActual: 48,
    notes: "Advance paid against July kitchen shift schedule."
  }
];

const DEMO_CASHBOOK_ENTRIES = [
  {
    entryDate: "2026-06-06",
    accountType: "cashbook",
    accountName: "Main Cash Box",
    businessAreaId: "shared-operations",
    entryType: "money-in",
    amount: 2500,
    counterparty: "Opening balance brought in",
    reference: "CB-OPEN-0606",
    notes: "Working cash at start of the period."
  },
  {
    entryDate: "2026-06-10",
    accountType: "bankbook",
    accountName: "OneRoot Main Bank",
    businessAreaId: "shared-operations",
    entryType: "transfer-in",
    amount: 1200,
    counterparty: "Deposit from main cash box",
    reference: "BNK-DEP-0610",
    notes: "Cash lodged into bank after weekly collections."
  },
  {
    entryDate: "2026-06-12",
    accountType: "bankbook",
    accountName: "OneRoot Main Bank",
    businessAreaId: "shared-operations",
    entryType: "bank-charge",
    amount: 35,
    counterparty: "Monthly bank charge",
    reference: "BNK-CHG-0612",
    notes: "Service charge from the bank statement."
  }
];

const DEMO_LEDGER_ENTRIES = [
  {
    entryDate: "2026-06-09",
    businessAreaId: "cold-store-groceries",
    partyType: "customer",
    partyName: "Auntie Efua Shop",
    partyPhone: "0243004400",
    suite: "",
    entryType: "charge",
    amount: 320,
    dueDate: "2026-06-20",
    reference: "LED-CGS-0609",
    notes: "Frozen foods supplied on short credit."
  },
  {
    entryDate: "2026-06-14",
    businessAreaId: "cold-store-groceries",
    partyType: "customer",
    partyName: "Auntie Efua Shop",
    partyPhone: "0243004400",
    suite: "",
    entryType: "payment",
    amount: 200,
    dueDate: "2026-06-20",
    reference: "LED-CGS-0614",
    notes: "Part payment received."
  }
];

const DEMO_MOBILE_MONEY_RECONCILIATIONS = [
  {
    date: "2026-06-24",
    provider: "MTN Mobile Money",
    openingCash: 3200,
    cashTopUp: 500,
    cashRemoved: 200,
    cashInValue: 2100,
    cashOutValue: 2450,
    serviceFees: 185,
    operatingExpense: 30,
    closingCashCounted: 3305,
    notes: "Evening count balanced after booth expense."
  }
];

const DEMO_ASSETS = [
  {
    acquiredDate: "2026-02-04",
    businessAreaId: "water-equipment",
    assetName: "Concrete Vibrator",
    assetCategory: "Equipment",
    location: "Equipment store",
    purchaseCost: 1450,
    currentValue: 1200,
    condition: "Good",
    status: "In Use",
    nextServiceDate: "2026-07-15",
    notes: "Rental-support equipment."
  },
  {
    acquiredDate: "2026-01-18",
    businessAreaId: "rentals-apartments",
    assetName: "Hope Fridge",
    assetCategory: "Appliance",
    location: "Hope",
    purchaseCost: 1850,
    currentValue: 1650,
    condition: "Good",
    status: "In Use",
    nextServiceDate: "2026-08-01",
    notes: "Guest fridge currently active."
  }
];

const DEMO_FORECASTS = [
  {
    month: "2026-07",
    businessAreaId: "water-equipment",
    revenueTarget: 4800,
    expenseBudget: 1400,
    salaryBudget: 450,
    notes: "Rainy-season delivery target."
  },
  {
    month: "2026-07",
    businessAreaId: "rentals-apartments",
    revenueTarget: 6900,
    expenseBudget: 900,
    salaryBudget: 0,
    notes: "Rent and bills recovery target."
  }
];

const DEMO_PURCHASE_ORDERS = [
  {
    requestDate: "2026-07-02",
    businessAreaId: "cold-store-groceries",
    requester: "Store desk",
    supplierName: "Adom Frozen Foods",
    supplierPhone: "0241112233",
    itemDescription: "Box of fish and sausages",
    quantity: 12,
    unitCost: 85,
    totalAmount: 1020,
    amountPaid: 400,
    expectedDate: "2026-07-05",
    status: "Ordered",
    notes: "Restock before weekend demand."
  },
  {
    requestDate: "2026-07-01",
    businessAreaId: "water-equipment",
    requester: "Rental desk",
    supplierName: "Medie Hardware",
    supplierPhone: "0205559988",
    itemDescription: "Impact drill bits and construction nails",
    quantity: 8,
    unitCost: 32,
    totalAmount: 256,
    amountPaid: 0,
    expectedDate: "2026-07-04",
    status: "Requested",
    notes: "Needed for equipment support jobs."
  }
];

const DEMO_LAUNDRY_TICKETS = [
  {
    ticketDate: "2026-07-04",
    businessAreaId: "laundry-services",
    customerName: "Esi Mensah",
    customerPhone: "0553024401",
    serviceType: "Express",
    itemSummary: "3 shirts and 2 trousers",
    pieces: 5,
    amountDue: 95,
    amountPaid: 50,
    dueDate: "2026-07-04",
    readyDate: "",
    deliveryMode: "Walk-in",
    status: "In Progress",
    notes: "Customer prefers same-day pickup."
  },
  {
    ticketDate: "2026-07-03",
    businessAreaId: "laundry-services",
    customerName: "Josephine Addo",
    customerPhone: "0247784412",
    serviceType: "Normal",
    itemSummary: "Bedsheets and pillow covers",
    pieces: 6,
    amountDue: 120,
    amountPaid: 120,
    dueDate: "2026-07-05",
    readyDate: "2026-07-04",
    deliveryMode: "Pickup / Delivery",
    status: "Ready",
    notes: "Ready for driver dispatch."
  }
];

const DEMO_EQUIPMENT_RENTALS = [
  {
    bookingDate: "2026-07-03",
    businessAreaId: "water-equipment",
    equipmentItem: "Concrete Vibrator",
    customerName: "Kwabena Ofori",
    customerPhone: "0204411188",
    rentalFee: 180,
    amountPaid: 100,
    depositAmount: 150,
    damageCharge: 0,
    outDate: "2026-07-03",
    dueDate: "2026-07-05",
    returnDate: "",
    status: "Out",
    conditionOut: "Good",
    conditionIn: "Good",
    reference: "EQ-0703-01",
    notes: "Site rental for slab work."
  },
  {
    bookingDate: "2026-07-01",
    businessAreaId: "water-equipment",
    equipmentItem: "Wheelbarrow",
    customerName: "Daniel Koomson",
    customerPhone: "0549001122",
    rentalFee: 60,
    amountPaid: 60,
    depositAmount: 40,
    damageCharge: 0,
    outDate: "2026-07-01",
    dueDate: "2026-07-02",
    returnDate: "2026-07-02",
    status: "Returned",
    conditionOut: "Good",
    conditionIn: "Fair",
    reference: "EQ-0701-02",
    notes: "Returned with minor dirt only."
  }
];

const DEMO_SECURITY_DEPOSITS = [
  {
    captureDate: "2026-07-02",
    suite: "Peace",
    tenantName: "Akosua Boateng",
    tenantPhone: "0542128890",
    depositExpected: 1500,
    depositPaid: 1000,
    chargesRaised: 0,
    chargesPaid: 0,
    deductionFromDeposit: 0,
    refundDue: 0,
    refundPaid: 0,
    depositDueDate: "2026-07-10",
    refundDueDate: "",
    status: "Active Hold",
    notes: "Balance to be completed after move-in."
  },
  {
    captureDate: "2026-06-28",
    suite: "Hope",
    tenantName: "Samuel Donkor",
    tenantPhone: "0209987766",
    depositExpected: 1200,
    depositPaid: 1200,
    chargesRaised: 250,
    chargesPaid: 50,
    deductionFromDeposit: 100,
    refundDue: 300,
    refundPaid: 0,
    depositDueDate: "",
    refundDueDate: "2026-07-06",
    status: "Move-out Review",
    notes: "Final cleaning and utility deductions in progress."
  }
];

const DEMO_USER_PROFILES = [
  {
    fullName: "Philip Boakye",
    username: "philip",
    role: "owner",
    phone: "0242847065",
    active: true,
    notes: "Primary workspace owner"
  },
  {
    fullName: "Operations Desk",
    username: "operations",
    role: "operations",
    phone: "",
    active: true,
    notes: "Example operations profile"
  }
];

const state = {
  expenses: loadExpenses(),
  budgets: loadBudgets(),
  sales: loadSales(),
  rentals: loadRentals(),
  pettyCash: loadPettyCash(),
  pettyCashBudgets: loadPettyCashBudgets(),
  salaryRecords: loadSalaryRecords(),
  cashbookEntries: loadCashbookEntries(),
  purchaseOrders: loadPurchaseOrders(),
  laundryTickets: loadLaundryTickets(),
  equipmentRentalBookings: loadEquipmentRentalBookings(),
  securityDepositRecords: loadSecurityDepositRecords(),
  ledgerEntries: loadLedgerEntries(),
  mobileMoneyReconciliations: loadMobileMoneyReconciliations(),
  suppliers: loadSuppliers(),
  assetRecords: loadAssetRecords(),
  forecastPlans: loadForecastPlans(),
  recurringControls: loadRecurringControls(),
  maintenanceRecords: loadMaintenanceRecords(),
  userProfiles: loadUserProfiles(),
  editingExpenseId: null,
  editingSalesId: null,
  editingRentalId: null,
  editingPettyCashId: null,
  editingSalaryId: null,
  editingCashbookId: null,
  editingPurchaseOrderId: null,
  editingLaundryTicketId: null,
  editingEquipmentRentalId: null,
  editingSecurityDepositId: null,
  editingLedgerId: null,
  editingMobileMoneyId: null,
  editingSupplierId: null,
  editingAssetId: null,
  editingForecastId: null,
  editingUserId: null,
  editingRecurringId: null,
  editingMaintenanceId: null,
  salaryFilters: { search: "", month: "", area: "", type: "", status: "" },
  kpiFilters: { month: getMonthKey(new Date()), area: "" },
  searchFilters: { query: "", module: "" },
  reminderFilters: { search: "", source: "", severity: "" },
  messageBuilderDraft: createEmptyMessageBuilderDraft(),
  cashbookFilters: { search: "", month: "", area: "", accountType: "" },
  treasuryFilters: { area: "", transferState: "" },
  purchaseOrderFilters: { search: "", month: "", area: "", status: "" },
  laundryFilters: { search: "", month: "", status: "", serviceType: "" },
  equipmentRentalFilters: { search: "", month: "", status: "" },
  securityDepositFilters: { search: "", suite: "", status: "" },
  ledgerFilters: { search: "", partyType: "", area: "", status: "" },
  mobileMoneyFilters: { month: "", provider: "", variance: "" },
  supplierFilters: { search: "", month: "", area: "", status: "" },
  assetFilters: { search: "", area: "", status: "", service: "" },
  forecastFilters: { month: getMonthKey(new Date()), area: "" },
  recurringFilters: { search: "", moduleType: "", status: "" },
  maintenanceFilters: { search: "", area: "", status: "", priority: "" },
  reportFilters: createDefaultReportFilters(),
  agreementReadyFiles: [],
  payslipReadyFiles: [],
  currency: loadSettings().currency || "GHS",
  activeUserId: normalizeText(loadSettings().activeUserId),
  signedInUserId: normalizeText(loadAuthSession().userId),
  currentView: loadPersistedView() || "overview"
};

const elements = {};
let toastTimeout = null;
let deferredInstallPrompt = null;
let startupToastMessage = "";
const LOCAL_PREVIEW_REFRESH_FLAG = "oneroot-local-preview-refresh-v4";

document.addEventListener("DOMContentLoaded", () => {
  void init();
});

async function init() {
  captureElements();
  decorateNavigationMenus();
  bindEvents();
  await restoreHostedWorkspaceSnapshotIfNeeded();
  await hydrateHostedWorkspaceAccessIfNeeded();
  reconcileActiveUserProfile();
  reconcileAuthenticationSession({ skipPersist: true });
  populateCurrencyOptions();
  initializeBudgetPlanner();
  applyReportPreset(state.reportFilters.preset, { silent: true });
  resetExpenseForm({ silent: true });
  resetSalesForm({ silent: true });
  resetRentalForm({ silent: true });
  resetPettyCashForm({ silent: true });
  navigateTo(resolveInitialView(), { syncHash: true });
  render();
  if (startupToastMessage) {
    showToast(startupToastMessage);
    startupToastMessage = "";
  }
  registerServiceWorker();
}

function isHostedWorkspaceEnvironment() {
  const hostname = normalizeText(window.location.hostname).toLowerCase();
  return hostname !== "" && !["127.0.0.1", "localhost", "::1"].includes(hostname);
}

function getHostedWorkspaceBusinessRecordTotal(workspace = state) {
  return (
    (workspace.expenses?.length || 0) +
    (workspace.budgets?.length || 0) +
    (workspace.sales?.length || 0) +
    (workspace.rentals?.length || 0) +
    (workspace.pettyCash?.length || 0) +
    (workspace.pettyCashBudgets?.length || 0) +
    (workspace.salaryRecords?.length || 0) +
    (workspace.cashbookEntries?.length || 0) +
    (workspace.purchaseOrders?.length || 0) +
    (workspace.laundryTickets?.length || 0) +
    (workspace.equipmentRentalBookings?.length || 0) +
    (workspace.securityDepositRecords?.length || 0) +
    (workspace.ledgerEntries?.length || 0) +
    (workspace.mobileMoneyReconciliations?.length || 0) +
    (workspace.suppliers?.length || 0) +
    (workspace.assetRecords?.length || 0) +
    (workspace.forecastPlans?.length || 0) +
    (workspace.recurringControls?.length || 0) +
    (workspace.maintenanceRecords?.length || 0) +
    (workspace.posOrders?.length || 0) +
    (workspace.inventoryItems?.length || 0)
  );
}

function needsHostedWorkspaceAccessHydration() {
  return (
    isHostedWorkspaceEnvironment() &&
    (!Array.isArray(state.userProfiles) || state.userProfiles.length === 0 || isWorkspaceLocked())
  );
}

function getHostedWorkspaceSnapshotRevision(imported) {
  return normalizeText(imported?.exportedAt) || "loaded";
}

function shouldRestoreHostedWorkspaceSnapshot(imported) {
  const hostedTotal = getHostedWorkspaceBusinessRecordTotal(imported);

  if (hostedTotal === 0) {
    return false;
  }

  const localTotal = getHostedWorkspaceBusinessRecordTotal(state);
  const currentSnapshotFlag = normalizeText(localStorage.getItem(HOSTED_WORKSPACE_SNAPSHOT_FLAG_KEY));
  const nextSnapshotFlag = getHostedWorkspaceSnapshotRevision(imported);

  return localTotal === 0 || (currentSnapshotFlag !== nextSnapshotFlag && localTotal < hostedTotal);
}

async function fetchHostedWorkspaceSnapshot() {
  const response = await fetch(HOSTED_WORKSPACE_SNAPSHOT_PATH, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Hosted snapshot request failed with ${response.status}.`);
  }

  return sanitizeImportedBackup(await response.json());
}

function restoreWorkspaceFromImport(imported) {
  state.expenses = imported.expenses;
  state.budgets = imported.budgets;
  state.sales = imported.sales;
  state.rentals = imported.rentals;
  state.pettyCash = imported.pettyCash;
  state.pettyCashBudgets = imported.pettyCashBudgets;
  state.salaryRecords = imported.salaryRecords;
  state.cashbookEntries = imported.cashbookEntries;
  state.purchaseOrders = imported.purchaseOrders;
  state.laundryTickets = imported.laundryTickets;
  state.equipmentRentalBookings = imported.equipmentRentalBookings;
  state.securityDepositRecords = imported.securityDepositRecords;
  state.ledgerEntries = imported.ledgerEntries;
  state.mobileMoneyReconciliations = imported.mobileMoneyReconciliations;
  state.suppliers = imported.suppliers;
  state.assetRecords = imported.assetRecords;
  state.forecastPlans = imported.forecastPlans;
  state.recurringControls = imported.recurringControls;
  state.maintenanceRecords = imported.maintenanceRecords;
  state.userProfiles = imported.userProfiles;
  state.posOrders = imported.posOrders || [];
  state.inventoryItems = imported.inventoryItems || [];
  state.auditTrail = imported.auditTrail || [];
  state.currency = imported.currency;
  state.activeUserId = imported.activeUserId;
  state.editingExpenseId = null;
  state.editingSalesId = null;
  state.editingRentalId = null;
  state.editingPettyCashId = null;
  state.editingSalaryId = null;
  state.editingCashbookId = null;
  state.editingPurchaseOrderId = null;
  state.editingLaundryTicketId = null;
  state.editingEquipmentRentalId = null;
  state.editingSecurityDepositId = null;
  state.editingLedgerId = null;
  state.editingMobileMoneyId = null;
  state.editingSupplierId = null;
  state.editingAssetId = null;
  state.editingForecastId = null;
  state.editingUserId = null;
  state.editingRecurringId = null;
  state.editingMaintenanceId = null;
  state.editingPosOrderId = null;
  state.editingInventoryItemId = null;
  if (typeof createEmptyPosDraft === "function") {
    state.posDraft = createEmptyPosDraft();
  }
  if (typeof createEmptyInventoryDraft === "function") {
    state.inventoryDraft = createEmptyInventoryDraft();
  }
  if (typeof reconcilePosGeneratedSales === "function") {
    reconcilePosGeneratedSales({ persist: false });
  }
  if (typeof primeAuditSnapshots === "function") {
    primeAuditSnapshots();
  }
}

async function restoreHostedWorkspaceSnapshotIfNeeded() {
  if (!isHostedWorkspaceEnvironment()) {
    return;
  }

  try {
    const imported = await fetchHostedWorkspaceSnapshot();
    const totalRecords = getHostedWorkspaceBusinessRecordTotal(imported);
    const nextSnapshotFlag = getHostedWorkspaceSnapshotRevision(imported);

    if (totalRecords === 0) {
      return;
    }

    if (!shouldRestoreHostedWorkspaceSnapshot(imported)) {
      return;
    }

    const localTotal = getHostedWorkspaceBusinessRecordTotal(state);
    restoreWorkspaceFromImport(imported);
    persistAllData();
    localStorage.setItem(HOSTED_WORKSPACE_SNAPSHOT_FLAG_KEY, nextSnapshotFlag);
    startupToastMessage =
      localTotal === 0
        ? `Uploaded online snapshot loaded with ${totalRecords} record${totalRecords === 1 ? "" : "s"}.`
        : `Uploaded online snapshot synced with ${totalRecords} record${totalRecords === 1 ? "" : "s"}.`;
  } catch (error) {
    console.error(error);
  }
}

async function hydrateHostedWorkspaceAccessIfNeeded() {
  if (!needsHostedWorkspaceAccessHydration()) {
    return;
  }

  try {
    const imported = await fetchHostedWorkspaceSnapshot();
    const nextSnapshotFlag = normalizeText(imported.exportedAt) || "access-restored";

    if (!Array.isArray(imported.userProfiles) || imported.userProfiles.length === 0) {
      return;
    }

    const existingProfiles = Array.isArray(state.userProfiles) ? state.userProfiles : [];
    const existingProfileKeys = new Set(existingProfiles.map(buildUserProfileMergeKey));
    const missingHostedProfiles = imported.userProfiles.some(
      (profile) => !existingProfileKeys.has(buildUserProfileMergeKey(profile))
    );
    const accessSnapshotFlag = normalizeText(localStorage.getItem(HOSTED_WORKSPACE_ACCESS_FLAG_KEY));

    if (
      existingProfiles.length > 0 &&
      !missingHostedProfiles &&
      accessSnapshotFlag === nextSnapshotFlag
    ) {
      return;
    }

    state.userProfiles = mergeUserProfiles(state.userProfiles, imported.userProfiles);

    if (!normalizeText(state.activeUserId) && normalizeText(imported.activeUserId)) {
      state.activeUserId = normalizeText(imported.activeUserId);
    }

    reconcileActiveUserProfile({ skipPersist: true });
    persistUserProfiles();
    persistSettings();
    localStorage.setItem(HOSTED_WORKSPACE_ACCESS_FLAG_KEY, nextSnapshotFlag);

    if (!startupToastMessage) {
      startupToastMessage =
        existingProfiles.length === 0
          ? `Workspace access restored for this browser with ${imported.userProfiles.length} profile${
              imported.userProfiles.length === 1 ? "" : "s"
            }.`
          : `Workspace access synced from the uploaded online snapshot with ${imported.userProfiles.length} profile${
              imported.userProfiles.length === 1 ? "" : "s"
            }.`;
    }
  } catch (error) {
    console.error(error);
  }
}

function decorateNavigationMenus() {
  document.querySelectorAll("[data-view-link]").forEach((button) => {
    if (button.querySelector(".nav-link-media")) {
      return;
    }

    const view = button.dataset.viewLink;
    const label = normalizeText(button.textContent) || VIEW_META[view]?.title || "Menu";
    button.innerHTML = `${buildViewIllustrationMarkup(view)}<span class="nav-link-copy">${escapeHtml(
      label
    )}</span>`;
  });
}

function getViewVisual(view) {
  return (
    VIEW_VISUALS[view] || {
      icon: "dashboard",
      accent: "#b9d8ba",
      soft: "rgba(185, 216, 186, 0.2)"
    }
  );
}

function getBusinessAreaVisual(areaId) {
  const areaIndex = BUSINESS_AREAS.findIndex((area) => area.id === areaId);

  if (areaIndex < 0) {
    return AREA_VISUAL_PALETTE[AREA_VISUAL_PALETTE.length - 1];
  }

  return AREA_VISUAL_PALETTE[areaIndex % AREA_VISUAL_PALETTE.length];
}

function buildViewIllustrationMarkup(view, variant = "menu") {
  const visual = getViewVisual(view);
  const classes =
    variant === "module"
      ? "module-icon-badge"
      : variant === "chip"
        ? "module-icon-badge module-icon-badge-compact"
        : "nav-link-media";

  return `
    <span
      class="${classes}"
      style="--visual-accent:${escapeHtml(visual.accent)}; --visual-soft:${escapeHtml(visual.soft)};"
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" role="presentation" focusable="false">
        ${getIconGlyphMarkup(visual.icon)}
      </svg>
    </span>
  `;
}

function getIconGlyphMarkup(icon) {
  switch (icon) {
    case "chart":
      return `
        <path d="M4 18h16" />
        <path d="M6 15l3-4 3 2 5-6 1 1" />
        <circle cx="9" cy="11" r="1.2" />
        <circle cx="12" cy="13" r="1.2" />
        <circle cx="17" cy="7" r="1.2" />
      `;
    case "report":
      return `
        <path d="M7 4h7l4 4v12H7z" />
        <path d="M14 4v4h4" />
        <path d="M10 13h1.8v4H10z" />
        <path d="M13.1 10h1.8v7h-1.8z" />
        <path d="M16.2 12h1.8v5h-1.8z" />
      `;
    case "search":
      return `
        <circle cx="11" cy="11" r="5.4" />
        <path d="M15 15l4 4" />
      `;
    case "bell":
      return `
        <path d="M8 17h8l-1.2-2V11a4.8 4.8 0 0 0-9.6 0v4L8 17z" />
        <path d="M10.5 18.5a1.7 1.7 0 0 0 3 0" />
      `;
    case "chat":
      return `
        <path d="M5 6.5h14v9H9l-4 3v-3H5z" />
        <path d="M8.5 10.5h7" />
        <path d="M8.5 13.5H13" />
      `;
    case "receipt":
      return `
        <path d="M8 4h8v16l-2-1.4-2 1.4-2-1.4-2 1.4z" />
        <path d="M10 9h4" />
        <path d="M10 12h4" />
        <path d="M10 15h3" />
      `;
    case "cart":
      return `
        <circle cx="10" cy="18" r="1.2" />
        <circle cx="16" cy="18" r="1.2" />
        <path d="M5 6h2l1.5 7.5h8L18.5 8H8" />
      `;
    case "scan":
      return `
        <path d="M7 5H5v2" />
        <path d="M17 5h2v2" />
        <path d="M5 17v2h2" />
        <path d="M19 17v2h-2" />
        <path d="M8 8v8" />
        <path d="M11 8v8" />
        <path d="M14 8v8" />
        <path d="M17 10v6" />
      `;
    case "box":
      return `
        <path d="M4.8 8.2L12 4l7.2 4.2v7.6L12 20l-7.2-4.2z" />
        <path d="M12 4v8" />
        <path d="M4.8 8.2L12 12l7.2-3.8" />
      `;
    case "bubbles":
      return `
        <circle cx="9" cy="14" r="3.2" />
        <circle cx="15.5" cy="9" r="2.4" />
        <circle cx="7" cy="8" r="1.6" />
      `;
    case "tool":
      return `
        <path d="M13 6.5a3.2 3.2 0 0 0 4 4l-6.8 6.8a1.4 1.4 0 1 1-2-2L15 8.5a3.2 3.2 0 0 1-2-2z" />
      `;
    case "building":
      return `
        <path d="M7 20V5.5L12 4l5 1.5V20" />
        <path d="M9.5 9h1" />
        <path d="M13.5 9h1" />
        <path d="M9.5 12h1" />
        <path d="M13.5 12h1" />
        <path d="M11 20v-4h2v4" />
      `;
    case "shield":
      return `
        <path d="M12 4l6 2.5v4.8c0 3.8-2.4 6.4-6 8.7-3.6-2.3-6-4.9-6-8.7V6.5z" />
        <path d="M9.5 12l1.7 1.7L14.8 10" />
      `;
    case "wallet":
      return `
        <path d="M5 8.5h13a1.8 1.8 0 0 1 1.8 1.8v5.2A1.8 1.8 0 0 1 18 17.3H6.5A1.5 1.5 0 0 1 5 15.8z" />
        <path d="M5 8.5V7.2A1.8 1.8 0 0 1 6.8 5.5H16" />
        <circle cx="16.2" cy="12.8" r="0.9" />
      `;
    case "phone":
      return `
        <rect x="8" y="4.2" width="8" height="15.6" rx="2" />
        <path d="M10.5 7.5h3" />
        <circle cx="12" cy="16.5" r="0.8" />
      `;
    case "ledger":
      return `
        <path d="M7 4.5h9a2 2 0 0 1 2 2V19H9a2 2 0 0 0-2 2z" />
        <path d="M7 4.5v14.2A2.3 2.3 0 0 1 9.3 21H18" />
        <path d="M10 9h5" />
        <path d="M10 12h5" />
        <path d="M10 15h4" />
      `;
    case "book":
      return `
        <path d="M6 5.5h5.5a2.5 2.5 0 0 1 2.5 2.5v10H8.5A2.5 2.5 0 0 0 6 20.5z" />
        <path d="M18 5.5h-5.5A2.5 2.5 0 0 0 10 8v10h5.5a2.5 2.5 0 0 1 2.5 2.5z" />
      `;
    case "clipboard":
      return `
        <rect x="7" y="5.8" width="10" height="14" rx="2" />
        <path d="M10 5.8h4v-1.3h-4z" />
        <path d="M9.5 10h5" />
        <path d="M9.5 13h5" />
        <path d="M9.5 16h3.5" />
      `;
    case "people":
      return `
        <circle cx="9.3" cy="9.2" r="2.2" />
        <circle cx="15.2" cy="10.2" r="1.9" />
        <path d="M5.8 17c.8-2.1 2.5-3.2 4.8-3.2S14.5 14.9 15.2 17" />
        <path d="M13.5 17c.5-1.5 1.7-2.3 3.5-2.3" />
      `;
    case "truck":
      return `
        <path d="M4.5 8.2h8.8v6.6H4.5z" />
        <path d="M13.3 10.2h3l2 2v2.6h-5z" />
        <circle cx="8" cy="17" r="1.3" />
        <circle cx="16.8" cy="17" r="1.3" />
      `;
    case "loop":
      return `
        <path d="M8 7H5v3" />
        <path d="M5 10a6.5 6.5 0 0 1 11-2.8" />
        <path d="M16 17h3v-3" />
        <path d="M19 14a6.5 6.5 0 0 1-11 2.8" />
      `;
    case "wrench":
      return `
        <path d="M15.5 6.5a3 3 0 0 0-3.7 3.7L6.2 15.8a1.5 1.5 0 0 0 2.1 2.1l5.6-5.6a3 3 0 0 0 3.7-3.7l-2.1 1-1.5-1.5z" />
      `;
    case "lock":
      return `
        <rect x="6.8" y="10.2" width="10.4" height="8.2" rx="1.8" />
        <path d="M9 10.2V8.5a3 3 0 1 1 6 0v1.7" />
        <circle cx="12" cy="14.2" r="0.8" />
      `;
    case "cloud":
      return `
        <path d="M8.2 17.2H17a3 3 0 0 0 .3-6 4.6 4.6 0 0 0-8.8-1.3A3.4 3.4 0 0 0 8.2 17.2z" />
        <path d="M11.5 12.3l1.8-1.8 1.8 1.8" />
        <path d="M13.3 10.5v5" />
      `;
    case "dashboard":
    default:
      return `
        <rect x="5" y="5" width="5.5" height="5.5" rx="1.2" />
        <rect x="13.5" y="5" width="5.5" height="8.2" rx="1.2" />
        <rect x="5" y="13.5" width="8.2" height="5.5" rx="1.2" />
        <rect x="16.2" y="16.2" width="2.8" height="2.8" rx="0.7" />
      `;
  }
}

function captureElements() {
  const ids = [
    "currentViewEyebrow",
    "currentViewTitle",
    "currentViewSummary",
    "currencySelect",
    "printReportBtn",
    "exportActiveWorkbookBtn",
    "workspaceAuthBtn",
    "kpiViewRoot",
    "reportsViewRoot",
    "searchViewRoot",
    "remindersViewRoot",
    "messagesViewRoot",
    "ledgersViewRoot",
    "overviewMonthLabel",
    "overviewSalesValue",
    "overviewExpensesValue",
    "overviewPettyValue",
    "overviewOutstandingValue",
    "overviewNarrative",
    "overviewControlGrid",
    "overviewProfitGrid",
    "overviewAreaPerformanceGrid",
    "overviewAlertList",
    "overviewModuleGrid",
    "recentActivityList",
    "expenseForm",
    "formHeading",
    "submitExpenseBtn",
    "cancelEditBtn",
    "resetFormBtn",
    "expenseDate",
    "businessArea",
    "vendor",
    "category",
    "paymentMethod",
    "receiptStatus",
    "amount",
    "description",
    "notes",
    "totalSpendValue",
    "averageExpenseValue",
    "receiptCoverageValue",
    "entriesInViewValue",
    "resultsCountText",
    "lastActivityText",
    "budgetForm",
    "budgetMonth",
    "budgetArea",
    "budgetCategory",
    "budgetAmount",
    "monthBudgetValue",
    "monthActualValue",
    "monthVarianceValue",
    "budgetListMeta",
    "budgetList",
    "expenseSearchFilter",
    "expenseMonthFilter",
    "expenseAreaFilter",
    "expenseCategoryFilter",
    "expensePaymentFilter",
    "expenseReceiptFilter",
    "clearExpenseFiltersBtn",
    "categoryBreakdownMeta",
    "categoryBreakdown",
    "thisMonthValue",
    "previousMonthValue",
    "largestExpenseValue",
    "receiptFollowUpValue",
    "tableFootnote",
    "expenseTableBody",
    "salesFormHeading",
    "salesForm",
    "submitSalesBtn",
    "resetSalesBtn",
    "cancelSalesEditBtn",
    "salesDate",
    "salesArea",
    "salesAmount",
    "salesNotes",
    "salesFootnote",
    "salesSearchFilter",
    "salesMonthFilter",
    "salesAreaFilter",
    "clearSalesFiltersBtn",
    "totalSalesValue",
    "salesEntriesValue",
    "averageSalesValue",
    "bestSalesDayValue",
    "salesTableBody",
    "rentalFormHeading",
    "rentalForm",
    "submitRentalBtn",
    "resetRentalBtn",
    "cancelRentalEditBtn",
    "rentalMonth",
    "rentalSuite",
    "occupancyStatus",
    "rentalCaptureMode",
    "captureModeSummaryText",
    "tenantName",
    "tenantPhone",
    "tenantAddress",
    "emergencyContact",
    "tenantIdRef",
    "moveInDate",
    "moveOutDate",
    "rentCycleType",
    "rentCycleMonths",
    "rentCycleAmount",
    "rentDue",
    "rentPaid",
    "rentCoverageStartDate",
    "rentCoverageEndDate",
    "nextRentDueDate",
    "renewalDate",
    "rentPaymentDate",
    "rentPaymentMethod",
    "rentPaymentReference",
    "rentReceivedBy",
    "waterBill",
    "toiletBill",
    "sweepingBill",
    "wasteBill",
    "monthlyBillsHelperText",
    "calculatedBillsDueValue",
    "fillBillsPaidBtn",
    "billDueDate",
    "billAmountPaid",
    "billPaymentDate",
    "billPaymentMethod",
    "billPaymentReference",
    "billReceivedBy",
    "arrearsBroughtForward",
    "lateFee",
    "customBillItems",
    "rentalNotes",
    "rentalFootnote",
    "rentalSearchFilter",
    "rentalMonthFilter",
    "rentalSuiteFilter",
    "rentalStatusFilter",
    "rentalAlertFilter",
    "clearRentalFiltersBtn",
    "occupiedSuitesValue",
    "vacantSuitesValue",
    "rentDueValue",
    "rentPaidValue",
    "billsDueValue",
    "billsPaidValue",
    "rentOutstandingValue",
    "rentalAlertsValue",
    "apartmentAlertMeta",
    "apartmentAlertList",
    "agreementReadyMeta",
    "agreementReadyList",
    "generateRentalMonth",
    "generateRentalMonthBtn",
    "printApartmentReportBtn",
    "rentalTableBody",
    "apartmentPortfolioList",
    "pettyCashFormHeading",
    "pettyCashForm",
    "submitPettyCashBtn",
    "resetPettyCashBtn",
    "cancelPettyCashEditBtn",
    "pettyCashDate",
    "pettyCashType",
    "pettyCashArea",
    "pettyCashCategory",
    "pettyCashVendor",
    "pettyCashVendorLabel",
    "pettyCashAmount",
    "pettyCashReceiptStatus",
    "pettyCashNotes",
    "pettyCashContextNote",
    "pettyCashFootnote",
    "pettyCashSearchFilter",
    "pettyCashMonthFilter",
    "pettyCashTypeFilter",
    "pettyCashAreaFilter",
    "pettyCashReceiptFilter",
    "clearPettyCashFiltersBtn",
    "pettyCashBalanceValue",
    "pettyCashInflowValue",
    "pettyCashOutflowValue",
    "pettyCashPendingValue",
    "pettyCashEntriesValue",
    "pettyCashTableBody",
    "pettyCashBudgetForm",
    "pettyCashBudgetMonth",
    "pettyCashBudgetArea",
    "pettyCashBudgetAmount",
    "pettyCashBudgetNotes",
    "pettyCashBudgetedValue",
    "pettyCashBudgetUsedValue",
    "pettyCashBudgetRemainingValue",
    "pettyCashBudgetMeta",
    "pettyCashBudgetList",
    "cashbookViewRoot",
    "treasuryViewRoot",
    "procurementViewRoot",
    "laundryViewRoot",
    "equipmentRentalsViewRoot",
    "depositsViewRoot",
    "salaryViewRoot",
    "mobileMoneyViewRoot",
    "suppliersViewRoot",
    "assetsViewRoot",
    "forecastViewRoot",
    "recurringViewRoot",
    "maintenanceViewRoot",
    "accessViewRoot",
    "downloadExcelLink",
    "downloadWorkbookHubLink",
    "exportWorkbookBtn",
    "importWorkbookBtn",
    "importCsvBtn",
    "downloadTemplateBtn",
    "exportCsvBtn",
    "exportBackupBtn",
    "importBackupBtn",
    "restoreHostedSnapshotBtn",
    "loadSampleBtn",
    "installAppBtn",
    "workbookStatusText",
    "workbookImportHintText",
    "backupStatusText",
    "installHintText",
    "dataHubCounts",
    "workbookImportFileInput",
    "expenseImportFileInput",
    "backupImportFileInput",
    "toast"
  ];

  ids.forEach((id) => {
    elements[id] = document.getElementById(id);
  });
}

function bindEvents() {
  document.body.addEventListener("click", handleBodyClick);
  document.body.addEventListener("click", handleDynamicModuleClick);
  document.body.addEventListener("submit", handleDynamicModuleSubmit);
  document.body.addEventListener("input", handleDynamicModuleInput);
  document.body.addEventListener("change", handleDynamicModuleChange);
  window.addEventListener("hashchange", handleHashChange);
  window.addEventListener("storage", handleStorageSync);
  window.addEventListener("focus", handleWindowFocusSync);
  window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  window.addEventListener("appinstalled", handleAppInstalled);

  elements.expenseForm.addEventListener("submit", handleExpenseSubmit);
  elements.resetFormBtn.addEventListener("click", () => resetExpenseForm());
  elements.cancelEditBtn.addEventListener("click", () => resetExpenseForm());
  elements.businessArea.addEventListener("change", () => {
    updateExpenseMenus(elements.businessArea.value);
  });
  elements.expenseTableBody.addEventListener("click", handleExpenseTableAction);

  elements.budgetForm.addEventListener("submit", handleBudgetSubmit);
  elements.budgetArea.addEventListener("change", handleBudgetAreaChange);
  elements.budgetMonth.addEventListener("input", render);
  elements.budgetMonth.addEventListener("change", render);
  elements.budgetList.addEventListener("click", handleBudgetAction);

  elements.salesForm.addEventListener("submit", handleSalesSubmit);
  elements.resetSalesBtn.addEventListener("click", () => resetSalesForm());
  elements.cancelSalesEditBtn.addEventListener("click", () => resetSalesForm());
  elements.salesTableBody.addEventListener("click", handleSalesTableAction);

  elements.rentalForm.addEventListener("submit", handleRentalSubmit);
  elements.resetRentalBtn.addEventListener("click", () => resetRentalForm());
  elements.cancelRentalEditBtn.addEventListener("click", () => resetRentalForm());
  elements.rentCycleType.addEventListener("change", handleRentCycleTypeChange);
  elements.rentalMonth.addEventListener("input", handleRentalMonthChange);
  elements.rentalMonth.addEventListener("change", handleRentalMonthChange);
  elements.rentalCaptureMode.addEventListener("change", updateMonthlyBillsHelper);
  [
    elements.waterBill,
    elements.toiletBill,
    elements.sweepingBill,
    elements.wasteBill,
    elements.customBillItems,
    elements.billAmountPaid
  ].forEach((control) => {
    control.addEventListener("input", updateMonthlyBillsHelper);
    control.addEventListener("change", updateMonthlyBillsHelper);
  });
  elements.fillBillsPaidBtn.addEventListener("click", handleFillBillsPaid);
  elements.rentalTableBody.addEventListener("click", handleRentalTableAction);
  elements.apartmentPortfolioList.addEventListener("click", handleRentalTableAction);
  elements.generateRentalMonthBtn.addEventListener("click", handleGenerateRentalMonth);
  elements.printApartmentReportBtn.addEventListener("click", handlePrintApartmentReport);

  elements.pettyCashForm.addEventListener("submit", handlePettyCashSubmit);
  elements.resetPettyCashBtn.addEventListener("click", () => resetPettyCashForm());
  elements.cancelPettyCashEditBtn.addEventListener("click", () => resetPettyCashForm());
  elements.pettyCashType.addEventListener("change", handlePettyCashTypeChange);
  elements.pettyCashArea.addEventListener("change", () => {
    updatePettyCashMenus(elements.pettyCashArea.value);
  });
  elements.pettyCashTableBody.addEventListener("click", handlePettyCashTableAction);
  elements.pettyCashBudgetForm.addEventListener("submit", handlePettyCashBudgetSubmit);
  elements.pettyCashBudgetMonth.addEventListener("input", render);
  elements.pettyCashBudgetMonth.addEventListener("change", render);
  elements.pettyCashBudgetList.addEventListener("click", handlePettyCashBudgetAction);

  [
    elements.expenseSearchFilter,
    elements.expenseMonthFilter,
    elements.expenseAreaFilter,
    elements.expenseCategoryFilter,
    elements.expensePaymentFilter,
    elements.expenseReceiptFilter,
    elements.salesSearchFilter,
    elements.salesMonthFilter,
    elements.salesAreaFilter,
    elements.rentalSearchFilter,
    elements.rentalMonthFilter,
    elements.rentalSuiteFilter,
    elements.rentalStatusFilter,
    elements.rentalAlertFilter,
    elements.pettyCashSearchFilter,
    elements.pettyCashMonthFilter,
    elements.pettyCashTypeFilter,
    elements.pettyCashAreaFilter,
    elements.pettyCashReceiptFilter
  ].forEach((control) => {
    control.addEventListener("input", render);
    control.addEventListener("change", render);
  });

  elements.expenseAreaFilter.addEventListener("change", handleExpenseAreaFilterChange);
  elements.clearExpenseFiltersBtn.addEventListener("click", clearExpenseFilters);
  elements.clearSalesFiltersBtn.addEventListener("click", clearSalesFilters);
  elements.clearRentalFiltersBtn.addEventListener("click", clearRentalFilters);
  elements.clearPettyCashFiltersBtn.addEventListener("click", clearPettyCashFilters);

  elements.currencySelect.addEventListener("change", handleCurrencyChange);
  elements.printReportBtn.addEventListener("click", handlePrintReport);
  elements.exportActiveWorkbookBtn.addEventListener("click", handleExportActiveWorkbook);
  elements.workspaceAuthBtn.addEventListener("click", handleWorkspaceAuthAction);
  elements.exportCsvBtn.addEventListener("click", exportCurrentView);
  elements.exportWorkbookBtn.addEventListener("click", handleExportFullWorkbook);
  elements.importWorkbookBtn.addEventListener("click", () => elements.workbookImportFileInput.click());
  elements.importCsvBtn.addEventListener("click", () => elements.expenseImportFileInput.click());
  elements.exportBackupBtn.addEventListener("click", exportFullBackup);
  elements.importBackupBtn.addEventListener("click", () => elements.backupImportFileInput.click());
  elements.restoreHostedSnapshotBtn.addEventListener("click", handleRestoreHostedSnapshot);
  elements.workbookImportFileInput.addEventListener("change", handleWorkbookImportFile);
  elements.expenseImportFileInput.addEventListener("change", handleExpenseImportFile);
  elements.backupImportFileInput.addEventListener("change", handleBackupImportFile);
  elements.downloadTemplateBtn.addEventListener("click", downloadTemplate);
  elements.loadSampleBtn.addEventListener("click", loadDemoData);
  elements.installAppBtn.addEventListener("click", handleInstallApp);

  [elements.downloadExcelLink, elements.downloadWorkbookHubLink].forEach((link) => {
    link.addEventListener("click", () => {
      showToast("Workbook download started.");
    });
  });
}

function handleBodyClick(event) {
  const navTarget = event.target.closest("[data-view-link]");

  if (navTarget) {
    navigateTo(navTarget.dataset.viewLink, { syncHash: true });
    return;
  }

  const quickTarget = event.target.closest("[data-go-view]");

  if (quickTarget) {
    navigateTo(quickTarget.dataset.goView, { syncHash: true });
  }
}

function handleDynamicModuleClick(event) {
  const target = event.target;
  const globalActionTarget = target.closest("button[data-global-action]");
  const reminderActionTarget = target.closest("button[data-reminder-action]");
  const messageActionTarget = target.closest("button[data-message-action]");
  const cashbookActionTarget = target.closest("button[data-cashbook-action]");
  const purchaseActionTarget = target.closest("button[data-purchase-action]");
  const laundryActionTarget = target.closest("button[data-laundry-action]");
  const equipmentActionTarget = target.closest("button[data-equipment-action]");
  const depositActionTarget = target.closest("button[data-deposit-action]");
  const ledgerActionTarget = target.closest("button[data-ledger-action]");
  const mobileMoneyActionTarget = target.closest("button[data-mobile-money-action]");
  const salaryActionTarget = target.closest("button[data-salary-action]");
  const supplierActionTarget = target.closest("button[data-supplier-action]");
  const assetActionTarget = target.closest("button[data-asset-action]");
  const forecastActionTarget = target.closest("button[data-forecast-action]");
  const recurringActionTarget = target.closest("button[data-recurring-action]");
  const maintenanceActionTarget = target.closest("button[data-maintenance-action]");
  const accessActionTarget = target.closest("button[data-access-action]");
  const reportActionTarget = target.closest("button[data-report-action]");

  if (globalActionTarget) {
    if (globalActionTarget.dataset.globalAction === "export-view-csv") {
      exportCurrentView();
    }

    return;
  }

  if (target.closest("#resetLedgerBtn") || target.closest("#cancelLedgerEditBtn")) {
    resetLedgerForm();
    return;
  }

  if (target.closest("#resetCashbookBtn") || target.closest("#cancelCashbookEditBtn")) {
    resetCashbookForm();
    return;
  }

  if (target.closest("#resetPurchaseOrderBtn") || target.closest("#cancelPurchaseOrderEditBtn")) {
    resetPurchaseOrderForm();
    return;
  }

  if (target.closest("#resetLaundryTicketBtn") || target.closest("#cancelLaundryTicketEditBtn")) {
    resetLaundryTicketForm();
    return;
  }

  if (target.closest("#resetEquipmentRentalBtn") || target.closest("#cancelEquipmentRentalEditBtn")) {
    resetEquipmentRentalForm();
    return;
  }

  if (target.closest("#resetDepositBtn") || target.closest("#cancelDepositEditBtn")) {
    resetSecurityDepositForm();
    return;
  }

  if (target.closest("#resetMobileMoneyBtn") || target.closest("#cancelMobileMoneyEditBtn")) {
    resetMobileMoneyForm();
    return;
  }

  if (target.closest("#resetSalaryBtn") || target.closest("#cancelSalaryEditBtn")) {
    resetSalaryForm();
    return;
  }

  if (target.closest("#resetSupplierBtn") || target.closest("#cancelSupplierEditBtn")) {
    resetSupplierForm();
    return;
  }

  if (target.closest("#resetAssetBtn") || target.closest("#cancelAssetEditBtn")) {
    resetAssetForm();
    return;
  }

  if (target.closest("#resetForecastBtn") || target.closest("#cancelForecastEditBtn")) {
    resetForecastForm();
    return;
  }

  if (target.closest("#resetAccessBtn") || target.closest("#cancelAccessEditBtn")) {
    resetUserProfileForm();
    return;
  }

  if (target.closest("#resetRecurringBtn") || target.closest("#cancelRecurringEditBtn")) {
    resetRecurringForm();
    return;
  }

  if (target.closest("#resetMaintenanceBtn") || target.closest("#cancelMaintenanceEditBtn")) {
    resetMaintenanceForm();
    return;
  }

  if (target.closest("#clearCashbookFiltersBtn")) {
    clearCashbookFilters();
    return;
  }

  if (target.closest("#clearTreasuryFiltersBtn")) {
    clearTreasuryFilters();
    return;
  }

  if (target.closest("#clearSearchFiltersBtn")) {
    clearSearchFilters();
    return;
  }

  if (target.closest("#clearReminderFiltersBtn")) {
    clearReminderFilters();
    return;
  }

  if (target.closest("#clearPurchaseFiltersBtn")) {
    clearPurchaseOrderFilters();
    return;
  }

  if (target.closest("#clearLaundryFiltersBtn")) {
    clearLaundryFilters();
    return;
  }

  if (target.closest("#clearEquipmentFiltersBtn")) {
    clearEquipmentRentalFilters();
    return;
  }

  if (target.closest("#clearDepositFiltersBtn")) {
    clearSecurityDepositFilters();
    return;
  }

  if (target.closest("#runDueRecurringBtn")) {
    runDueRecurringControls();
    return;
  }

  if (reminderActionTarget) {
    if (reminderActionTarget.dataset.reminderAction === "copy-single") {
      copyReminderCenterMessage(reminderActionTarget.dataset.key);
    }

    if (reminderActionTarget.dataset.reminderAction === "copy-all") {
      copyAllReminderCenterMessages();
    }

    return;
  }

  if (messageActionTarget) {
    if (messageActionTarget.dataset.messageAction === "preview") {
      handleMessagePreview();
    }

    if (messageActionTarget.dataset.messageAction === "copy-sms") {
      copyGeneratedMessage("SMS");
    }

    if (messageActionTarget.dataset.messageAction === "copy-whatsapp") {
      copyGeneratedMessage("WhatsApp");
    }

    return;
  }

  if (cashbookActionTarget) {
    const recordId = cashbookActionTarget.dataset.id;

    if (cashbookActionTarget.dataset.cashbookAction === "edit") {
      startEditingCashbookEntry(recordId);
    }

    if (cashbookActionTarget.dataset.cashbookAction === "delete") {
      deleteCashbookEntry(recordId);
    }

    return;
  }

  if (purchaseActionTarget) {
    const recordId = purchaseActionTarget.dataset.id;

    if (purchaseActionTarget.dataset.purchaseAction === "edit") {
      startEditingPurchaseOrder(recordId);
    }

    if (purchaseActionTarget.dataset.purchaseAction === "delete") {
      deletePurchaseOrder(recordId);
    }

    return;
  }

  if (laundryActionTarget) {
    const recordId = laundryActionTarget.dataset.id;

    if (laundryActionTarget.dataset.laundryAction === "edit") {
      startEditingLaundryTicket(recordId);
    }

    if (laundryActionTarget.dataset.laundryAction === "delete") {
      deleteLaundryTicket(recordId);
    }

    if (laundryActionTarget.dataset.laundryAction === "copy-message") {
      copyLaundryCustomerMessage(recordId);
    }

    return;
  }

  if (equipmentActionTarget) {
    const recordId = equipmentActionTarget.dataset.id;

    if (equipmentActionTarget.dataset.equipmentAction === "edit") {
      startEditingEquipmentRental(recordId);
    }

    if (equipmentActionTarget.dataset.equipmentAction === "delete") {
      deleteEquipmentRental(recordId);
    }

    if (equipmentActionTarget.dataset.equipmentAction === "copy-message") {
      copyEquipmentRentalMessage(recordId);
    }

    return;
  }

  if (depositActionTarget) {
    const recordId = depositActionTarget.dataset.id;

    if (depositActionTarget.dataset.depositAction === "edit") {
      startEditingSecurityDeposit(recordId);
    }

    if (depositActionTarget.dataset.depositAction === "delete") {
      deleteSecurityDeposit(recordId);
    }

    if (depositActionTarget.dataset.depositAction === "copy-message") {
      copySecurityDepositMessage(recordId);
    }

    return;
  }

  if (ledgerActionTarget) {
    const ledgerId = ledgerActionTarget.dataset.id;

    if (ledgerActionTarget.dataset.ledgerAction === "edit") {
      startEditingLedgerEntry(ledgerId);
    }

    if (ledgerActionTarget.dataset.ledgerAction === "delete") {
      deleteLedgerEntry(ledgerId);
    }

    if (ledgerActionTarget.dataset.ledgerAction === "export-reminders") {
      exportReminderCsv();
    }

    if (ledgerActionTarget.dataset.ledgerAction === "copy-reminders") {
      copyReminderMessages();
    }

    if (ledgerActionTarget.dataset.ledgerAction === "copy-single-reminder") {
      copyReminderMessageByKey(ledgerActionTarget.dataset.key);
    }

    return;
  }

  if (mobileMoneyActionTarget) {
    const recordId = mobileMoneyActionTarget.dataset.id;

    if (mobileMoneyActionTarget.dataset.mobileMoneyAction === "edit") {
      startEditingMobileMoneyRecord(recordId);
    }

    if (mobileMoneyActionTarget.dataset.mobileMoneyAction === "delete") {
      deleteMobileMoneyRecord(recordId);
    }

    return;
  }

  if (salaryActionTarget) {
    const salaryId = salaryActionTarget.dataset.id;

    if (salaryActionTarget.dataset.salaryAction === "payslip") {
      generateSalaryPayslipById(salaryId);
    }

    if (salaryActionTarget.dataset.salaryAction === "edit") {
      startEditingSalaryRecord(salaryId);
    }

    if (salaryActionTarget.dataset.salaryAction === "delete") {
      deleteSalaryRecord(salaryId);
    }

    return;
  }

  if (supplierActionTarget) {
    const supplierId = supplierActionTarget.dataset.id;

    if (supplierActionTarget.dataset.supplierAction === "edit") {
      startEditingSupplier(supplierId);
    }

    if (supplierActionTarget.dataset.supplierAction === "delete") {
      deleteSupplierRecord(supplierId);
    }

    return;
  }

  if (assetActionTarget) {
    const assetId = assetActionTarget.dataset.id;

    if (assetActionTarget.dataset.assetAction === "edit") {
      startEditingAssetRecord(assetId);
    }

    if (assetActionTarget.dataset.assetAction === "delete") {
      deleteAssetRecord(assetId);
    }

    return;
  }

  if (forecastActionTarget) {
    const forecastId = forecastActionTarget.dataset.id;

    if (forecastActionTarget.dataset.forecastAction === "edit") {
      startEditingForecastPlan(forecastId);
    }

    if (forecastActionTarget.dataset.forecastAction === "delete") {
      deleteForecastPlan(forecastId);
    }

    if (forecastActionTarget.dataset.forecastAction === "apply-suggestion") {
      applySuggestedForecastToForm(
        forecastActionTarget.dataset.month,
        forecastActionTarget.dataset.area
      );
    }

    return;
  }

  if (recurringActionTarget) {
    const recurringId = recurringActionTarget.dataset.id;

    if (recurringActionTarget.dataset.recurringAction === "edit") {
      startEditingRecurringControl(recurringId);
    }

    if (recurringActionTarget.dataset.recurringAction === "run") {
      runRecurringControlById(recurringId);
    }

    if (recurringActionTarget.dataset.recurringAction === "delete") {
      deleteRecurringControl(recurringId);
    }

    return;
  }

  if (maintenanceActionTarget) {
    const maintenanceId = maintenanceActionTarget.dataset.id;

    if (maintenanceActionTarget.dataset.maintenanceAction === "edit") {
      startEditingMaintenanceRecord(maintenanceId);
    }

    if (maintenanceActionTarget.dataset.maintenanceAction === "delete") {
      deleteMaintenanceRecord(maintenanceId);
    }

    return;
  }

  if (accessActionTarget) {
    const userId = accessActionTarget.dataset.id;

    if (accessActionTarget.dataset.accessAction === "edit") {
      startEditingUserProfile(userId);
    }

    if (accessActionTarget.dataset.accessAction === "delete") {
      deleteUserProfile(userId);
    }

    if (accessActionTarget.dataset.accessAction === "activate") {
      switchActiveUser(userId);
    }

    if (accessActionTarget.dataset.accessAction === "logout") {
      signOutWorkspaceUser();
    }

    return;
  }

  if (reportActionTarget) {
    handleReportAction(reportActionTarget.dataset.reportAction);
  }
}

function handleDynamicModuleSubmit(event) {
  if (event.target.id === "searchForm") {
    handleSearchSubmit(event);
  }

  if (event.target.id === "cashbookForm") {
    handleCashbookSubmit(event);
  }

  if (event.target.id === "purchaseOrderForm") {
    handlePurchaseOrderSubmit(event);
  }

  if (event.target.id === "laundryTicketForm") {
    handleLaundryTicketSubmit(event);
  }

  if (event.target.id === "equipmentRentalForm") {
    handleEquipmentRentalSubmit(event);
  }

  if (event.target.id === "securityDepositForm") {
    handleSecurityDepositSubmit(event);
  }

  if (event.target.id === "ledgerForm") {
    handleLedgerSubmit(event);
  }

  if (event.target.id === "mobileMoneyForm") {
    handleMobileMoneySubmit(event);
  }

  if (event.target.id === "salaryForm") {
    handleSalarySubmit(event);
  }

  if (event.target.id === "supplierForm") {
    handleSupplierSubmit(event);
  }

  if (event.target.id === "assetForm") {
    handleAssetSubmit(event);
  }

  if (event.target.id === "forecastForm") {
    handleForecastSubmit(event);
  }

  if (event.target.id === "recurringForm") {
    handleRecurringSubmit(event);
  }

  if (event.target.id === "maintenanceForm") {
    handleMaintenanceSubmit(event);
  }

  if (event.target.id === "accessUserForm") {
    handleUserProfileSubmit(event);
  }

  if (event.target.id === "accessLoginForm") {
    handleAccessLoginSubmit(event);
  }
}

function handleDynamicModuleInput(event) {
  const { id, value } = event.target;

  if (id === "globalSearchQuery") {
    state.searchFilters.query = value;
  }

  if (id === "globalReminderSearch") {
    state.reminderFilters.search = value;
    render();
  }

  if (id === "kpiMonthFilter") {
    state.kpiFilters.month = normalizeMonthInput(value);
    render();
  }

  if (id === "reportFromMonth") {
    state.reportFilters.fromMonth = normalizeMonthInput(value);
    state.reportFilters.preset = "custom";
    render();
  }

  if (id === "reportToMonth") {
    state.reportFilters.toMonth = normalizeMonthInput(value);
    state.reportFilters.preset = "custom";
    render();
  }

  if (id === "salarySearchFilter") {
    state.salaryFilters.search = value;
    render();
  }

  if (id === "cashbookSearchFilter") {
    state.cashbookFilters.search = value;
    render();
  }

  if (id === "cashbookMonthFilter") {
    state.cashbookFilters.month = normalizeMonthInput(value);
    render();
  }

  if (id === "purchaseOrderSearchFilter") {
    state.purchaseOrderFilters.search = value;
    render();
  }

  if (id === "purchaseOrderMonthFilter") {
    state.purchaseOrderFilters.month = normalizeMonthInput(value);
    render();
  }

  if (id === "laundrySearchFilter") {
    state.laundryFilters.search = value;
    render();
  }

  if (id === "laundryMonthFilter") {
    state.laundryFilters.month = normalizeMonthInput(value);
    render();
  }

  if (id === "equipmentSearchFilter") {
    state.equipmentRentalFilters.search = value;
    render();
  }

  if (id === "equipmentMonthFilter") {
    state.equipmentRentalFilters.month = normalizeMonthInput(value);
    render();
  }

  if (id === "depositSearchFilter") {
    state.securityDepositFilters.search = value;
    render();
  }

  if (id === "ledgerSearchFilter") {
    state.ledgerFilters.search = value;
    render();
  }

  if (id === "mobileMoneyMonthFilter") {
    state.mobileMoneyFilters.month = normalizeMonthInput(value);
    render();
  }

  if (id === "salaryMonthFilter") {
    state.salaryFilters.month = value;
    render();
  }

  if (id === "supplierSearchFilter") {
    state.supplierFilters.search = value;
    render();
  }

  if (id === "supplierMonthFilter") {
    state.supplierFilters.month = value;
    render();
  }

  if (id === "assetSearchFilter") {
    state.assetFilters.search = value;
    render();
  }

  if (id === "forecastMonthFilter") {
    state.forecastFilters.month = normalizeMonthInput(value);
    render();
  }

  if (id === "recurringSearchFilter") {
    state.recurringFilters.search = value;
    render();
  }

  if (id === "maintenanceSearchFilter") {
    state.maintenanceFilters.search = value;
    render();
  }

  if (id.startsWith("message")) {
    updateMessageBuilderDraftField(id, value);
  }
}

function handleDynamicModuleChange(event) {
  const { id, value } = event.target;

  if (id === "kpiAreaFilter") {
    state.kpiFilters.area = normalizeBusinessAreaId(value);
    render();
  }

  if (id === "globalSearchModuleFilter") {
    state.searchFilters.module = normalizeText(value).toLowerCase();
    render();
  }

  if (id === "reminderSourceFilter") {
    state.reminderFilters.source = normalizeText(value).toLowerCase();
    render();
  }

  if (id === "reminderSeverityFilter") {
    state.reminderFilters.severity = normalizeText(value).toLowerCase();
    render();
  }

  if (id === "reportPresetFilter") {
    applyReportPreset(value);
    render();
  }

  if (id === "reportAreaFilter") {
    state.reportFilters.area = normalizeBusinessAreaId(value);
    render();
  }

  if (id === "salaryAreaFilter") {
    state.salaryFilters.area = normalizeBusinessAreaId(value);
    render();
  }

  if (id === "cashbookAreaFilter") {
    state.cashbookFilters.area = normalizeBusinessAreaId(value);
    render();
  }

  if (id === "cashbookAccountTypeFilter") {
    state.cashbookFilters.accountType = normalizeCashbookAccountType(value);
    render();
  }

  if (id === "treasuryAreaFilter") {
    state.treasuryFilters.area = normalizeBusinessAreaId(value);
    render();
  }

  if (id === "treasuryTransferStateFilter") {
    state.treasuryFilters.transferState = normalizeText(value).toLowerCase();
    render();
  }

  if (id === "purchaseOrderAreaFilter") {
    state.purchaseOrderFilters.area = normalizeBusinessAreaId(value);
    render();
  }

  if (id === "purchaseOrderStatusFilter") {
    state.purchaseOrderFilters.status = normalizeText(value).toLowerCase();
    render();
  }

  if (id === "laundryStatusFilter") {
    state.laundryFilters.status = normalizeText(value).toLowerCase();
    render();
  }

  if (id === "laundryServiceFilter") {
    state.laundryFilters.serviceType = normalizeText(value).toLowerCase();
    render();
  }

  if (id === "equipmentStatusFilter") {
    state.equipmentRentalFilters.status = normalizeText(value).toLowerCase();
    render();
  }

  if (id === "depositSuiteFilter") {
    state.securityDepositFilters.suite = normalizeSuite(value);
    render();
  }

  if (id === "depositStatusFilter") {
    state.securityDepositFilters.status = normalizeText(value).toLowerCase();
    render();
  }

  if (id === "ledgerPartyTypeFilter") {
    state.ledgerFilters.partyType = normalizeText(value).toLowerCase();
    render();
  }

  if (id === "ledgerAreaFilter") {
    state.ledgerFilters.area = normalizeBusinessAreaId(value);
    render();
  }

  if (id === "ledgerStatusFilter") {
    state.ledgerFilters.status = normalizeText(value).toLowerCase();
    render();
  }

  if (id === "mobileMoneyProviderFilter") {
    state.mobileMoneyFilters.provider = normalizeText(value).toLowerCase();
    render();
  }

  if (id === "mobileMoneyVarianceFilter") {
    state.mobileMoneyFilters.variance = normalizeText(value).toLowerCase();
    render();
  }

  if (id === "salaryTypeFilter") {
    state.salaryFilters.type = normalizeSalaryType(value).toLowerCase();
    render();
  }

  if (id === "salaryStatusFilter") {
    state.salaryFilters.status = normalizeText(value).toLowerCase();
    render();
  }

  if (id === "supplierAreaFilter") {
    state.supplierFilters.area = normalizeBusinessAreaId(value);
    render();
  }

  if (id === "supplierStatusFilter") {
    state.supplierFilters.status = normalizeText(value).toLowerCase();
    render();
  }

  if (id === "assetAreaFilter") {
    state.assetFilters.area = normalizeBusinessAreaId(value);
    render();
  }

  if (id === "assetStatusFilter") {
    state.assetFilters.status = normalizeText(value).toLowerCase();
    render();
  }

  if (id === "assetServiceFilter") {
    state.assetFilters.service = normalizeText(value).toLowerCase();
    render();
  }

  if (id === "forecastAreaFilter") {
    state.forecastFilters.area = normalizeBusinessAreaId(value);
    render();
  }

  if (id === "recurringModuleFilter") {
    state.recurringFilters.moduleType = normalizeRecurringModuleType(value);
    render();
  }

  if (id === "recurringStatusFilter") {
    state.recurringFilters.status = normalizeText(value).toLowerCase();
    render();
  }

  if (id === "maintenanceAreaFilter") {
    state.maintenanceFilters.area = normalizeBusinessAreaId(value);
    render();
  }

  if (id === "maintenanceStatusFilter") {
    state.maintenanceFilters.status = normalizeMaintenanceStatus(value).toLowerCase();
    render();
  }

  if (id === "maintenancePriorityFilter") {
    state.maintenanceFilters.priority = normalizeMaintenancePriority(value).toLowerCase();
    render();
  }

  if (id === "activeWorkspaceUser") {
    switchActiveUser(value);
  }

  if (id === "recurringModuleType") {
    updateRecurringFormContextNote();
  }

  if (id.startsWith("message")) {
    updateMessageBuilderDraftField(id, value);

    if (["messageMode", "messageSourceKey", "messageChannel", "messageTemplate"].includes(id)) {
      render();
    }
  }
}

function handleHashChange() {
  navigateTo(resolveInitialView());
}

function handleBeforeInstallPrompt(event) {
  event.preventDefault();
  deferredInstallPrompt = event;
  elements.installHintText.textContent =
    "Install is available in this browser. Use the Install App button to save it like a standalone workspace.";
}

function handleAppInstalled() {
  deferredInstallPrompt = null;
  elements.installHintText.textContent =
    "The app has been installed. You can launch it from your device like any other app.";
}

async function handleInstallApp() {
  if (!deferredInstallPrompt) {
    showToast("Install is not available in this browser right now.");
    return;
  }

  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
}

function isLocalPreviewHost() {
  const hostname = window.location.hostname;
  return (
    hostname === "127.0.0.1" ||
    hostname === "localhost" ||
    hostname === "::1" ||
    hostname === "[::1]"
  );
}

async function clearAppCaches() {
  if (!("caches" in window)) {
    return;
  }

  try {
    const cacheKeys = await caches.keys();
    const appCacheKeys = cacheKeys.filter((key) => key.startsWith("oneroot-operations-app-"));
    await Promise.all(appCacheKeys.map((key) => caches.delete(key)));
  } catch (error) {
    console.error(error);
  }
}

async function unregisterLocalPreviewCaching() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  let hadRegistrations = false;
  const hadController = Boolean(navigator.serviceWorker.controller);

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    hadRegistrations = registrations.length > 0;
    await Promise.all(registrations.map((registration) => registration.unregister()));
  } catch (error) {
    console.error(error);
  }

  await clearAppCaches();

  if (!("sessionStorage" in window)) {
    return;
  }

  const hasLocalPreviewCaching = hadRegistrations || hadController;
  const alreadyRefreshed = window.sessionStorage.getItem(LOCAL_PREVIEW_REFRESH_FLAG) === "done";

  if (hasLocalPreviewCaching && !alreadyRefreshed) {
    window.sessionStorage.setItem(LOCAL_PREVIEW_REFRESH_FLAG, "done");
    window.location.reload();
    return;
  }

  if (!hasLocalPreviewCaching) {
    window.sessionStorage.removeItem(LOCAL_PREVIEW_REFRESH_FLAG);
  }
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  if (isLocalPreviewHost()) {
    unregisterLocalPreviewCaching();
    return;
  }

  navigator.serviceWorker.register("./service-worker.js").catch((error) => {
    console.error(error);
  });
}

function refreshStateFromStorage(options = {}) {
  state.expenses = loadExpenses();
  state.budgets = loadBudgets();
  state.sales = loadSales();
  state.rentals = loadRentals();
  state.pettyCash = loadPettyCash();
  state.pettyCashBudgets = loadPettyCashBudgets();
  state.salaryRecords = loadSalaryRecords();
  state.cashbookEntries = loadCashbookEntries();
  state.purchaseOrders = loadPurchaseOrders();
  state.laundryTickets = loadLaundryTickets();
  state.equipmentRentalBookings = loadEquipmentRentalBookings();
  state.securityDepositRecords = loadSecurityDepositRecords();
  state.ledgerEntries = loadLedgerEntries();
  state.mobileMoneyReconciliations = loadMobileMoneyReconciliations();
  state.suppliers = loadSuppliers();
  state.assetRecords = loadAssetRecords();
  state.forecastPlans = loadForecastPlans();
  state.recurringControls = loadRecurringControls();
  state.maintenanceRecords = loadMaintenanceRecords();
  state.userProfiles = loadUserProfiles();
  state.currency = loadSettings().currency || "GHS";
  state.activeUserId = normalizeText(loadSettings().activeUserId);
  state.signedInUserId = normalizeText(loadAuthSession().userId);

  if (!options.keepView) {
    state.currentView = loadPersistedView() || state.currentView;
  }
}

function handleStorageSync(event) {
  if (event.storageArea !== window.localStorage) {
    return;
  }

  if (event.key && !LIVE_DATA_STORAGE_KEYS.has(event.key)) {
    return;
  }

  refreshStateFromStorage({ keepView: true });
  render();
}

function handleWindowFocusSync() {
  refreshStateFromStorage({ keepView: true });
  render();
}

function getRolePreset(roleKey) {
  return ROLE_PRESET_MAP[normalizeText(roleKey).toLowerCase()] || ROLE_PRESET_MAP.viewer;
}

function loadAuthSession() {
  try {
    if (!("sessionStorage" in window)) {
      return {};
    }

    const raw = window.sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error(error);
    return {};
  }
}

function persistAuthSession(userId, options = {}) {
  try {
    if (!("sessionStorage" in window)) {
      return;
    }

    window.sessionStorage.setItem(
      AUTH_SESSION_STORAGE_KEY,
      JSON.stringify({
        userId: normalizeText(userId),
        username: normalizeText(options.username).toLowerCase(),
        password: String(options.password || ""),
        signedInAt: new Date().toISOString()
      })
    );
  } catch (error) {
    console.error(error);
  }
}

function clearAuthSession() {
  try {
    if (!("sessionStorage" in window)) {
      return;
    }

    window.sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    window.sessionStorage.removeItem(ONLINE_ORDERS_AUTH_STORAGE_KEY);
  } catch (error) {
    console.error(error);
  }
}

function getUserLoginMode(profile) {
  return profile && (profile.loginEnabled === true || normalizeText(profile.passwordHash))
    ? "password-required"
    : "profile-only";
}

function isPasswordLoginEnabledForProfile(profile) {
  return Boolean(
    profile &&
      profile.active &&
      getUserLoginMode(profile) === "password-required" &&
      normalizeText(profile.passwordHash)
  );
}

function getLoginEnabledProfiles() {
  return Array.isArray(state.userProfiles)
    ? state.userProfiles.filter((profile) => isPasswordLoginEnabledForProfile(profile))
    : [];
}

function isWorkspaceLoginRequired() {
  return getLoginEnabledProfiles().length > 0;
}

function getAuthenticatedUserProfile() {
  if (!isWorkspaceLoginRequired()) {
    return null;
  }

  return (
    state.userProfiles.find(
      (profile) => profile.id === state.signedInUserId && isPasswordLoginEnabledForProfile(profile)
    ) || null
  );
}

function isWorkspaceLocked() {
  return isWorkspaceLoginRequired() && !getAuthenticatedUserProfile();
}

function reconcileAuthenticationSession(options = {}) {
  if (!isWorkspaceLoginRequired()) {
    if (state.signedInUserId) {
      state.signedInUserId = "";
      clearAuthSession();
    }

    return null;
  }

  const signedInProfile = getAuthenticatedUserProfile();

  if (!signedInProfile) {
    if (state.signedInUserId) {
      state.signedInUserId = "";
      clearAuthSession();
    }

    return null;
  }

  if (state.activeUserId !== signedInProfile.id) {
    state.activeUserId = signedInProfile.id;

    if (!options.skipPersist) {
      persistSettings();
    }
  }

  return signedInProfile;
}

function getCurrentUserProfile() {
  if (isWorkspaceLoginRequired()) {
    return getAuthenticatedUserProfile();
  }

  if (!Array.isArray(state.userProfiles) || state.userProfiles.length === 0) {
    return null;
  }

  return (
    state.userProfiles.find((profile) => profile.id === state.activeUserId && profile.active) ||
    state.userProfiles.find((profile) => profile.active) ||
    state.userProfiles[0] ||
    null
  );
}

function canAccessView(view, profile = getCurrentUserProfile()) {
  if (isWorkspaceLocked()) {
    return view === "access";
  }

  if (!Array.isArray(state.userProfiles) || state.userProfiles.length === 0) {
    return true;
  }

  return getRolePreset(profile?.role).views.includes(view);
}

function getFirstAccessibleView(preferredView = "overview") {
  const profile = getCurrentUserProfile();

  if (canAccessView(preferredView, profile)) {
    return preferredView;
  }

  const fallbackViews = profile ? getRolePreset(profile.role).views : Object.keys(VIEW_META);
  return (
    fallbackViews.find((view) => VIEW_META[view] && canAccessView(view, profile)) ||
    (isWorkspaceLocked() ? "access" : "overview")
  );
}

function reconcileActiveUserProfile(options = {}) {
  if (!Array.isArray(state.userProfiles) || state.userProfiles.length === 0) {
    if (state.activeUserId) {
      state.activeUserId = "";
      persistSettings();
    }

    return null;
  }

  const activeProfiles = state.userProfiles.filter((profile) => profile.active);
  const fallbackProfile = activeProfiles[0] || state.userProfiles[0] || null;
  const matchedProfile =
    activeProfiles.find((profile) => profile.id === state.activeUserId) || fallbackProfile;

  if (matchedProfile && state.activeUserId !== matchedProfile.id) {
    state.activeUserId = matchedProfile.id;

    if (!options.skipPersist) {
      persistSettings();
    }
  }

  if (!matchedProfile) {
    state.activeUserId = "";

    if (!options.skipPersist) {
      persistSettings();
    }
  }

  return matchedProfile;
}

function resolveInitialView() {
  const hashView = window.location.hash.replace(/^#/, "");
  return getFirstAccessibleView(VIEW_META[hashView] ? hashView : state.currentView);
}

function loadPersistedView() {
  try {
    const view = localStorage.getItem(VIEW_STORAGE_KEY);
    return VIEW_META[view] ? view : "overview";
  } catch (error) {
    console.error(error);
    return "overview";
  }
}

function navigateTo(view, options = {}) {
  const requestedView = VIEW_META[view] ? view : "overview";
  const nextView = getFirstAccessibleView(requestedView);

  if (nextView !== requestedView && options.showAccessToast !== false) {
    showToast("That menu is not available for the active workspace user.");
  }

  state.currentView = nextView;
  localStorage.setItem(VIEW_STORAGE_KEY, nextView);

  if (options.syncHash && window.location.hash !== `#${nextView}`) {
    window.history.replaceState(null, "", `#${nextView}`);
  }

  renderChrome();
  applyViewState();
}

function applyViewState() {
  document.querySelectorAll("[data-view-panel]").forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.viewPanel === state.currentView);
  });

  document.querySelectorAll("[data-view-link]").forEach((button) => {
    button.classList.toggle("hidden", !canAccessView(button.dataset.viewLink));
    button.classList.toggle("is-active", button.dataset.viewLink === state.currentView);
  });

  document.querySelectorAll("[data-nav-group]").forEach((group) => {
    const visibleLinks = Array.from(group.querySelectorAll("[data-view-link]")).filter(
      (button) => !button.classList.contains("hidden")
    );
    const hasActiveLink = visibleLinks.some((button) => button.dataset.viewLink === state.currentView);

    group.classList.toggle("hidden", visibleLinks.length === 0);
    group.classList.toggle("is-active", hasActiveLink);

    if (hasActiveLink) {
      group.open = true;
    }
  });
}

function renderChrome() {
  const meta = VIEW_META[state.currentView] || VIEW_META.overview;
  const locked = isWorkspaceLocked();
  const currentUser = getCurrentUserProfile();
  elements.currentViewEyebrow.textContent = meta.eyebrow;
  elements.currentViewTitle.textContent = meta.title;
  elements.currentViewSummary.textContent = meta.summary;
  elements.exportActiveWorkbookBtn.textContent = getWorkbookExportMeta(state.currentView).label;
  elements.exportActiveWorkbookBtn.disabled = locked;
  elements.printReportBtn.disabled = locked;

  if (!Array.isArray(state.userProfiles) || state.userProfiles.length === 0) {
    elements.workspaceAuthBtn.textContent = "Access Setup";
  } else if (locked) {
    elements.workspaceAuthBtn.textContent = "Sign In";
  } else if (isWorkspaceLoginRequired()) {
    elements.workspaceAuthBtn.textContent = `Sign Out ${currentUser?.fullName?.split(" ")[0] || ""}`.trim();
  } else {
    elements.workspaceAuthBtn.textContent = "Access Profiles";
  }
}

function render() {
  reconcileActiveUserProfile({ skipPersist: true });
  reconcileAuthenticationSession({ skipPersist: true });

  if (!canAccessView(state.currentView)) {
    navigateTo(getFirstAccessibleView(), { syncHash: true, showAccessToast: false });
  }

  syncChoiceLists();
  renderChrome();
  applyViewState();
  renderOverview();
  renderKpiPage();
  renderReportsPage();
  renderSearchPage();
  renderReminderCenterPage();
  renderMessageBuilderPage();
  renderLedgersPage();
  renderExpensesPage();
  renderSalesPage();
  renderLaundryPage();
  renderEquipmentRentalsPage();
  renderMobileMoneyPage();
  renderRentalsPage();
  renderDepositsPage();
  renderPettyCashPage();
  renderCashbookPage();
  renderTreasuryPage();
  renderProcurementPage();
  renderSalaryPage();
  renderSuppliersPage();
  renderAssetsPage();
  renderForecastPage();
  renderRecurringPage();
  renderMaintenancePage();
  renderAccessPage();
  renderDataHub();
}

function renderOverview() {
  const currentMonthKey = getMonthKey(new Date());
  const monthSalesEntries = state.sales.filter((sale) => sale.date.startsWith(currentMonthKey));
  const monthExpenseEntries = state.expenses.filter((expense) => expense.date.startsWith(currentMonthKey));
  const monthSalaryRecords = state.salaryRecords.filter((record) => record.month === currentMonthKey);
  const currentMonthRentals = state.rentals.filter((record) => record.month === currentMonthKey);
  const latestRentalProfiles = getLatestRentalProfiles();
  const apartmentAlerts = buildApartmentAlerts(latestRentalProfiles);
  const monthSales = monthSalesEntries.reduce((sum, sale) => sum + sale.amount, 0);
  const monthExpenses = monthExpenseEntries.reduce((sum, expense) => sum + expense.amount, 0);
  const monthSalaryPaid = monthSalaryRecords.reduce((sum, record) => sum + record.amountPaid, 0);
  const monthPettyExpensePaid = state.pettyCash
    .filter((entry) => entry.date.startsWith(currentMonthKey) && getPettyCashType(entry.transactionTypeId).isExpense)
    .reduce((sum, entry) => sum + entry.amount, 0);
  const monthRentPaid = currentMonthRentals.reduce((sum, record) => sum + record.rentPaid, 0);
  const monthBillsRecovered = currentMonthRentals.reduce(
    (sum, record) => sum + getBillsPaidAmount(record),
    0
  );
  const monthRevenue = monthSales + monthRentPaid;
  const monthCapturedSpend = monthExpenses + monthSalaryPaid;
  const monthMargin = monthRevenue - monthCapturedSpend;
  const pettyCashBalance = getPettyCashBalance(state.pettyCash);
  const apartmentBalanceDue = latestRentalProfiles.reduce(
    (sum, record) => sum + getTenantCurrentRunningBalance(record),
    0
  );
  const salaryOutstanding = state.salaryRecords.reduce(
    (sum, record) => sum + getSalaryBalance(record),
    0
  );
  const supplierOutstanding = state.suppliers.reduce(
    (sum, record) => sum + getSupplierOutstanding(record),
    0
  );
  const maintenanceOpenEstimate = state.maintenanceRecords
    .filter((record) => record.status !== "Completed")
    .reduce((sum, record) => sum + record.estimatedCost, 0);
  const pettyCashBudgetSnapshot = getPettyCashBudgetSnapshot(currentMonthKey);
  const pettyCashBudgeted = pettyCashBudgetSnapshot.plannedTotal;
  const pendingReceipts =
    state.expenses.filter((expense) => expense.receiptStatus === "Pending").length +
    state.pettyCash.filter((entry) => entry.receiptStatus === "Pending").length;
  const workspaceAlerts = buildWorkspaceAlerts({
    apartmentAlerts,
    salaryRecords: state.salaryRecords,
    mobileMoneyReconciliations: state.mobileMoneyReconciliations,
    supplierRecords: state.suppliers,
    purchaseOrders: state.purchaseOrders,
    laundryTickets: state.laundryTickets,
    equipmentRentalBookings: state.equipmentRentalBookings,
    securityDepositRecords: state.securityDepositRecords,
    assetRecords: state.assetRecords,
    recurringControls: state.recurringControls,
    maintenanceRecords: state.maintenanceRecords
  });
  const currentMonthBillsOutstanding = currentMonthRentals.reduce(
    (sum, record) => sum + getOutstandingBills(record),
    0
  );
  const currentMonthRentOutstanding = currentMonthRentals.reduce(
    (sum, record) =>
      sum + getOutstandingRent(record) + getCarryForwardBalance(record),
    0
  );
  const overdueAlerts = workspaceAlerts.filter((alert) => alert.severity === "overdue").length;
  const occupiedSuites = latestRentalProfiles.filter(
    (record) => record.occupancyStatus === "Occupied"
  ).length;
  const activeSuites = latestRentalProfiles.filter((record) =>
    ["Occupied", "Reserved"].includes(record.occupancyStatus)
  ).length;
  const overviewAreaRows = buildOverviewAreaPerformanceRows(
    currentMonthKey,
    monthSalesEntries,
    monthExpenseEntries,
    monthSalaryRecords
  );
  const overviewTrendRows = buildScopedMonthlyTrendRows(getRecentMonthKeys(currentMonthKey, 6), {
    includePettyInSpend: false
  });

  elements.overviewMonthLabel.textContent = formatMonthLabel(currentMonthKey);
  elements.overviewSalesValue.textContent = formatCurrency(monthSales);
  elements.overviewExpensesValue.textContent = formatCurrency(monthExpenses);
  elements.overviewPettyValue.textContent = formatCurrency(pettyCashBalance);
  elements.overviewOutstandingValue.textContent = formatCurrency(apartmentBalanceDue);
  elements.overviewOutstandingValue.classList.toggle("negative-text", apartmentBalanceDue > 0);

  if (
    state.expenses.length +
    state.sales.length +
    state.rentals.length +
    state.pettyCash.length +
    state.salaryRecords.length +
    state.cashbookEntries.length +
    state.purchaseOrders.length +
    state.laundryTickets.length +
    state.equipmentRentalBookings.length +
    state.securityDepositRecords.length +
    state.ledgerEntries.length +
    state.mobileMoneyReconciliations.length +
    state.suppliers.length +
    state.assetRecords.length +
    state.forecastPlans.length +
    state.recurringControls.length +
    state.maintenanceRecords.length +
    state.userProfiles.length ===
    0
  ) {
    elements.overviewNarrative.textContent =
      "No records yet. Start with the area that moves first in your day, then build out the rest of the operating picture.";
  } else {
    elements.overviewNarrative.textContent = `${formatMonthLabel(currentMonthKey)} is currently ${
      monthMargin >= 0
        ? `running captured revenue ahead of captured spend by ${formatCurrency(monthMargin)}`
        : `showing captured spend ahead of revenue by ${formatCurrency(Math.abs(monthMargin))}`
    }, with petty cash sitting at ${formatCurrency(pettyCashBalance)}${
      pettyCashBudgeted > 0 ? ` against a petty cash budget of ${formatCurrency(pettyCashBudgeted)}` : ""
    }, salary balances of ${formatCurrency(salaryOutstanding)}, ${pendingReceipts} pending receipt${
      pendingReceipts === 1 ? "" : "s"
    }, supplier balances of ${formatCurrency(supplierOutstanding)}, and ${
      workspaceAlerts.length === 0
        ? "no immediate operating alerts."
        : `${workspaceAlerts.length} operating alert${workspaceAlerts.length === 1 ? "" : "s"} (${overdueAlerts} overdue).`
    }`;
  }

  const modules = [
    {
      title: "Expenses",
      meta: `${state.expenses.length} record${state.expenses.length === 1 ? "" : "s"} in the register`,
      cta: "Open Expenses",
      view: "expenses"
    },
    {
      title: "Daily Sales",
      meta: `${state.sales.length} day${state.sales.length === 1 ? "" : "s"} captured`,
      cta: "Open Daily Sales",
      view: "sales"
    },
    {
      title: "Apartments",
      meta: `${state.rentals.length} rent or bill record${state.rentals.length === 1 ? "" : "s"}`,
      cta: "Open Apartments",
      view: "apartments"
    },
    {
      title: "Petty Cash",
      meta: `${state.pettyCash.length} ledger entr${state.pettyCash.length === 1 ? "y" : "ies"}`,
      cta: "Open Petty Cash",
      view: "petty-cash"
    },
    {
      title: "Cashbook / Bankbook",
      meta: `${state.cashbookEntries.length} cash or bank entr${
        state.cashbookEntries.length === 1 ? "y" : "ies"
      }`,
      cta: "Open Cashbook",
      view: "cashbook"
    },
    {
      title: "KPI Dashboard",
      meta: "Monthly revenue, spend, cash, occupancy, and workload snapshot",
      cta: "Open KPI Dashboard",
      view: "kpi"
    },
    {
      title: "Global Search",
      meta: "Search the whole workspace by tenant, supplier, note, or reference",
      cta: "Open Search",
      view: "search"
    },
    {
      title: "Reminder Center",
      meta: `${workspaceAlerts.length} live follow-up item${workspaceAlerts.length === 1 ? "" : "s"}`,
      cta: "Open Reminders",
      view: "reminders"
    },
    {
      title: "WhatsApp / SMS",
      meta: "Build copy-ready reminder and outreach messages",
      cta: "Open Message Builder",
      view: "messages"
    },
    {
      title: "Salary",
      meta: `${state.salaryRecords.length} payroll record${state.salaryRecords.length === 1 ? "" : "s"}`,
      cta: "Open Salary",
      view: "salary"
    },
    {
      title: "Ledgers",
      meta: `${state.ledgerEntries.length} manual ledger entr${
        state.ledgerEntries.length === 1 ? "y" : "ies"
      }`,
      cta: "Open Ledgers",
      view: "ledgers"
    },
    {
      title: "Procurement",
      meta: `${state.purchaseOrders.length} purchase order${state.purchaseOrders.length === 1 ? "" : "s"} tracked`,
      cta: "Open Procurement",
      view: "procurement"
    },
    {
      title: "Laundry Tickets",
      meta: `${state.laundryTickets.length} laundry ticket${state.laundryTickets.length === 1 ? "" : "s"} saved`,
      cta: "Open Laundry Tickets",
      view: "laundry"
    },
    {
      title: "Equipment Rentals",
      meta: `${state.equipmentRentalBookings.length} booking${state.equipmentRentalBookings.length === 1 ? "" : "s"} tracked`,
      cta: "Open Equipment Rentals",
      view: "equipment-rentals"
    },
    {
      title: "Deposits & Charges",
      meta: `${state.securityDepositRecords.length} tenant deposit record${state.securityDepositRecords.length === 1 ? "" : "s"}`,
      cta: "Open Deposits",
      view: "deposits"
    },
    {
      title: "Mobile Money",
      meta: `${state.mobileMoneyReconciliations.length} reconciliation record${
        state.mobileMoneyReconciliations.length === 1 ? "" : "s"
      }`,
      cta: "Open Mobile Money",
      view: "mobile-money"
    },
    {
      title: "Suppliers",
      meta: `${state.suppliers.length} payable record${state.suppliers.length === 1 ? "" : "s"}`,
      cta: "Open Suppliers",
      view: "suppliers"
    },
    {
      title: "Assets",
      meta: `${state.assetRecords.length} asset record${state.assetRecords.length === 1 ? "" : "s"}`,
      cta: "Open Assets",
      view: "assets"
    },
    {
      title: "Forecast",
      meta: `${state.forecastPlans.length} plan${state.forecastPlans.length === 1 ? "" : "s"} saved`,
      cta: "Open Forecast",
      view: "forecast"
    },
    {
      title: "Recurring",
      meta: `${state.recurringControls.length} live control${state.recurringControls.length === 1 ? "" : "s"}`,
      cta: "Open Recurring",
      view: "recurring"
    },
    {
      title: "Maintenance",
      meta: `${state.maintenanceRecords.length} maintenance item${state.maintenanceRecords.length === 1 ? "" : "s"}`,
      cta: "Open Maintenance",
      view: "maintenance"
    },
    {
      title: "Access",
      meta: `${state.userProfiles.length} user profile${state.userProfiles.length === 1 ? "" : "s"}`,
      cta: "Open Access",
      view: "access"
    }
  ];

  elements.overviewModuleGrid.innerHTML = modules
    .map(
      (module) => `
        <article class="module-card module-card-visual">
          <div class="module-card-top">
            ${buildViewIllustrationMarkup(module.view, "module")}
            <div class="module-card-copy">
              <strong>${escapeHtml(module.title)}</strong>
              <span class="module-meta">${escapeHtml(module.meta)}</span>
            </div>
          </div>
          <button class="button button-secondary" data-go-view="${escapeHtml(module.view)}" type="button">
            ${escapeHtml(module.cta)}
          </button>
        </article>
      `
    )
    .join("");

  elements.overviewControlGrid.innerHTML = buildOverviewControlCards({
    monthKey: currentMonthKey,
    pendingReceipts,
    pettyCashBudgetSnapshot,
    currentMonthBillsOutstanding,
    currentMonthRentOutstanding,
    alerts: workspaceAlerts,
    overdueAlerts,
    occupiedSuites,
    activeSuites
  });

  elements.overviewProfitGrid.innerHTML = buildOverviewProfitCards({
    monthKey: currentMonthKey,
    monthRevenue,
    monthSales,
    monthRentPaid,
    monthCapturedSpend,
    monthExpenses,
    monthSalaryPaid,
    monthPettyExpensePaid,
    monthMargin,
    monthBillsRecovered,
    salaryOutstanding,
    supplierOutstanding,
    maintenanceOpenEstimate
  });

  elements.overviewAreaPerformanceGrid.innerHTML = buildOverviewAreaPerformanceCards(
    overviewAreaRows,
    overviewTrendRows,
    currentMonthKey
  );

  elements.overviewAlertList.innerHTML = buildOverviewAlertItems(workspaceAlerts);

  const activities = buildRecentActivities();

  if (activities.length === 0) {
    elements.recentActivityList.innerHTML = `
      <div class="empty-state">No activity yet. Your latest work will appear here as records are saved.</div>
    `;
    return;
  }

  elements.recentActivityList.innerHTML = activities
    .slice(0, 8)
    .map(
      (activity) => `
        <article class="activity-item">
          <span class="activity-kicker">${escapeHtml(activity.module)}</span>
          <strong>${escapeHtml(activity.title)}</strong>
          <span class="module-meta">${escapeHtml(activity.detail)}</span>
          <button class="button button-secondary" data-go-view="${escapeHtml(activity.view)}" type="button">
            Open ${escapeHtml(activity.module)}
          </button>
        </article>
      `
    )
    .join("");
}

function getPettyCashBudgetSnapshot(monthKey) {
  const selectedMonth = normalizeMonthInput(monthKey) || getMonthKey(new Date());
  const selectedBudgets = state.pettyCashBudgets.filter((budget) => budget.month === selectedMonth);
  const monthExpenseEntries = state.pettyCash.filter(
    (entry) => entry.date.startsWith(selectedMonth) && getPettyCashType(entry.transactionTypeId).isExpense
  );
  const plannedTotal = selectedBudgets.reduce((sum, budget) => sum + budget.amount, 0);
  const actualTotal = monthExpenseEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const unbudgetedTotal = monthExpenseEntries.reduce((sum, entry) => {
    const hasBudget = selectedBudgets.some((budget) => budget.businessAreaId === entry.businessAreaId);
    return hasBudget ? sum : sum + entry.amount;
  }, 0);
  const remaining = plannedTotal - actualTotal;

  return {
    selectedMonth,
    selectedBudgets,
    monthExpenseEntries,
    plannedTotal,
    actualTotal,
    unbudgetedTotal,
    remaining
  };
}

function formatPettyCashDashboardControl(snapshot) {
  if (snapshot.plannedTotal === 0 && snapshot.actualTotal + snapshot.unbudgetedTotal > 0) {
    return {
      value: `${formatCurrency(snapshot.actualTotal + snapshot.unbudgetedTotal)} unbudgeted`,
      meta: "Expense-paid petty cash entries exist without a matching budget."
    };
  }

  if (snapshot.plannedTotal === 0) {
    return {
      value: formatCurrency(0),
      meta: "No petty cash budget set yet for this month."
    };
  }

  return {
    value:
      snapshot.remaining >= 0
        ? `${formatCurrency(snapshot.remaining)} left`
        : `${formatCurrency(Math.abs(snapshot.remaining))} over`,
    meta: `Budgeted ${formatCurrency(snapshot.plannedTotal)} • used ${formatCurrency(
      snapshot.actualTotal
    )}`
  };
}

function buildOverviewControlCards(context) {
  const pettyCashControl = formatPettyCashDashboardControl(context.pettyCashBudgetSnapshot);
  const cards = [
    {
      title: "Pending Receipts",
      value: String(context.pendingReceipts),
      meta: "Expense and petty cash entries still awaiting receipt follow-up.",
      view: "expenses"
    },
    {
      title: "Petty Cash Monthly Control",
      value: pettyCashControl.value,
      meta: pettyCashControl.meta,
      view: "petty-cash"
    },
    {
      title: "Rent, Arrears & Fees Outstanding",
      value: formatCurrency(context.currentMonthRentOutstanding),
      meta: `${formatMonthLabel(context.monthKey)} rent balances, carried arrears, and late fees still to collect.`,
      view: "apartments"
    },
    {
      title: "Monthly Bills Outstanding",
      value: formatCurrency(context.currentMonthBillsOutstanding),
      meta: `${formatMonthLabel(context.monthKey)} water, toilet, sweeping, and waste bills still open.`,
      view: "apartments"
    },
    {
      title: "Open Due Alerts",
      value: String(context.alerts.length),
      meta:
        context.alerts.length === 0
          ? "No urgent operations alerts are due right now."
          : `${context.overdueAlerts} overdue and ${context.alerts.length - context.overdueAlerts} coming due soon.`,
      view: "reports"
    },
    {
      title: "Occupied Suites",
      value: `${context.occupiedSuites}/${APARTMENT_PORTFOLIO_SUITES.length}`,
      meta: `${context.activeSuites} active suites including reserved tenants.`,
      view: "apartments"
    }
  ];

  return cards
    .map(
      (card) => `
        <article class="stat-card dashboard-metric-card">
          <span>${escapeHtml(card.title)}</span>
          <strong>${escapeHtml(card.value)}</strong>
          <p class="module-meta">${escapeHtml(card.meta)}</p>
          <button class="button button-secondary" data-go-view="${escapeHtml(card.view)}" type="button">
            Open ${escapeHtml(VIEW_META[card.view]?.title || "Module")}
          </button>
        </article>
      `
    )
    .join("");
}

function buildOverviewProfitCards(context) {
  const cards = [
    {
      title: "Captured Revenue",
      value: formatCurrency(context.monthRevenue),
      meta: `${formatMonthLabel(context.monthKey)} daily sales plus rent collected.`,
      view: "sales"
    },
    {
      title: "Captured Spend",
      value: formatCurrency(context.monthCapturedSpend),
      meta: `Expenses ${formatCurrency(context.monthExpenses)} • salaries ${formatCurrency(
        context.monthSalaryPaid
      )}`,
      view: "expenses"
    },
    {
      title: "Operating Margin",
      value: formatCurrency(context.monthMargin),
      meta:
        context.monthMargin >= 0
          ? "Revenue is ahead of captured spend."
          : "Captured spend is ahead of revenue.",
      view: "overview"
    },
    {
      title: "Rent Collected",
      value: formatCurrency(context.monthRentPaid),
      meta: "Apartment rent paid this month.",
      view: "apartments"
    },
    {
      title: "Bills Recovered",
      value: formatCurrency(context.monthBillsRecovered),
      meta: "Tenant bills received this month.",
      view: "apartments"
    },
    {
      title: "Salaries Paid",
      value: formatCurrency(context.monthSalaryPaid),
      meta: "Salary payments captured for this month.",
      view: "salary"
    },
    {
      title: "Payroll Outstanding",
      value: formatCurrency(context.salaryOutstanding),
      meta: "Salary balances still to settle.",
      view: "salary"
    },
    {
      title: "Supplier Outstanding",
      value: formatCurrency(context.supplierOutstanding),
      meta: "Open supplier balances still to settle.",
      view: "suppliers"
    },
    {
      title: "Maintenance Open Estimate",
      value: formatCurrency(context.maintenanceOpenEstimate),
      meta: "Estimated cost of maintenance not yet completed.",
      view: "maintenance"
    }
  ];

  return cards
    .map(
      (card) => `
        <article class="stat-card dashboard-metric-card">
          <span>${escapeHtml(card.title)}</span>
          <strong class="${
            card.title === "Operating Margin" && context.monthMargin < 0 ? "negative-text" : ""
          }">${escapeHtml(card.value)}</strong>
          <p class="module-meta">${escapeHtml(card.meta)}</p>
          <button class="button button-secondary" data-go-view="${escapeHtml(card.view)}" type="button">
            Open ${escapeHtml(VIEW_META[card.view]?.title || "Module")}
          </button>
        </article>
      `
    )
    .join("");
}

function buildWorkspaceAlerts(context) {
  return [
    ...(context.apartmentAlerts || []).map((alert) => ({
      ...alert,
      source: "apartments",
      subject: alert.suite,
      headline: alert.type === "renewal" ? "Renewal Reminder" : "Tenant Balance Follow-up",
      view: "apartments"
    })),
    ...buildSalaryAlerts(context.salaryRecords || []),
    ...buildMobileMoneyVarianceAlerts(context.mobileMoneyReconciliations || []),
    ...buildSupplierAlerts(context.supplierRecords || []),
    ...buildPurchaseOrderAlerts(context.purchaseOrders || []),
    ...buildLaundryAlerts(context.laundryTickets || []),
    ...buildEquipmentRentalAlerts(context.equipmentRentalBookings || []),
    ...buildSecurityDepositAlerts(context.securityDepositRecords || []),
    ...buildAssetAlerts(context.assetRecords || []),
    ...buildRecurringAlerts(context.recurringControls || []),
    ...buildMaintenanceAlerts(context.maintenanceRecords || [])
  ].sort((left, right) => {
    const priorityDifference = getWorkspaceAlertPriority(left) - getWorkspaceAlertPriority(right);

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    const dateDifference = (left.dueDate || "").localeCompare(right.dueDate || "");

    if (dateDifference !== 0) {
      return dateDifference;
    }

    return normalizeText(left.subject).localeCompare(normalizeText(right.subject));
  });
}

function buildSalaryAlerts(records) {
  return records
    .filter((record) => getSalaryBalance(record) > 0 && record.dueDate)
    .map((record) => {
      const daysRemaining = daysUntilDate(record.dueDate);

      if (!Number.isFinite(daysRemaining) || daysRemaining > 7) {
        return null;
      }

      const severity = daysRemaining < 0 ? "overdue" : "due";
      return {
        source: "salary",
        subject: record.staffName,
        headline: "Salary Payment Due",
        label: severity === "overdue" ? "Overdue" : "Due Soon",
        pillClass: severity === "overdue" ? "alert-pill-overdue" : "alert-pill-due",
        severity,
        dueDate: record.dueDate,
        message:
          severity === "overdue"
            ? `${formatCurrency(getSalaryBalance(record))} overdue since ${formatDisplayDate(record.dueDate)}.`
            : `${formatCurrency(getSalaryBalance(record))} due on ${formatDisplayDate(record.dueDate)}.`,
        view: "salary"
      };
    })
    .filter(Boolean);
}

function buildSupplierAlerts(records) {
  return records
    .filter((record) => getSupplierOutstanding(record) > 0 && record.dueDate)
    .map((record) => {
      const daysRemaining = daysUntilDate(record.dueDate);

      if (!Number.isFinite(daysRemaining) || daysRemaining > 7) {
        return null;
      }

      const severity = daysRemaining < 0 ? "overdue" : "due";
      return {
        source: "suppliers",
        subject: record.supplierName,
        headline: "Supplier Payable",
        label: severity === "overdue" ? "Overdue" : "Due",
        pillClass: severity === "overdue" ? "alert-pill-overdue" : "alert-pill-due",
        severity,
        dueDate: record.dueDate,
        message:
          severity === "overdue"
            ? `${formatCurrency(getSupplierOutstanding(record))} overdue since ${formatDisplayDate(record.dueDate)}.`
            : `${formatCurrency(getSupplierOutstanding(record))} due on ${formatDisplayDate(record.dueDate)}.`,
        view: "suppliers"
      };
    })
    .filter(Boolean);
}

function buildMobileMoneyVarianceAlerts(records) {
  return records
    .filter((record) => Math.abs(getMobileMoneyVariance(record)) >= 0.01)
    .map((record) => ({
      source: "mobile-money",
      subject: record.provider,
      headline: "MoMo Variance Watch",
      label: getMobileMoneyVariance(record) > 0 ? "Over Count" : "Short",
      pillClass: getMobileMoneyVariance(record) > 0 ? "alert-pill-due" : "alert-pill-overdue",
      severity: getMobileMoneyVariance(record) > 0 ? "due" : "overdue",
      dueDate: record.date,
      message: `${formatSignedCurrency(getMobileMoneyVariance(record))} variance on ${formatDisplayDate(
        record.date
      )}.`,
      view: "mobile-money"
    }))
    .slice(0, 5);
}

function buildRecurringAlerts(records) {
  return records
    .filter((record) => record.active && record.nextDueDate)
    .map((record) => {
      const daysRemaining = daysUntilDate(record.nextDueDate);

      if (!Number.isFinite(daysRemaining) || daysRemaining > 7) {
        return null;
      }

      const severity = daysRemaining < 0 ? "overdue" : "due";
      return {
        source: "recurring",
        subject: record.title,
        headline: "Recurring Control Due",
        label: severity === "overdue" ? "Overdue" : "Due Soon",
        pillClass: severity === "overdue" ? "alert-pill-overdue" : "alert-pill-due",
        severity,
        dueDate: record.nextDueDate,
        message:
          severity === "overdue"
            ? `${getRecurringModuleLabel(record.moduleType)} control was due ${formatDisplayDate(record.nextDueDate)}.`
            : `${getRecurringModuleLabel(record.moduleType)} control is due ${formatDisplayDate(record.nextDueDate)}.`,
        view: "recurring"
      };
    })
    .filter(Boolean);
}

function buildAssetAlerts(records) {
  return records
    .filter((record) => ["overdue", "due-soon"].includes(getAssetServiceState(record).key))
    .map((record) => {
      const serviceState = getAssetServiceState(record);
      const dueDate = normalizeDateInput(record.nextServiceDate);
      return {
        source: "assets",
        subject: record.assetName,
        headline: "Asset Service Due",
        label: serviceState.key === "overdue" ? "Overdue" : "Due Soon",
        pillClass: serviceState.key === "overdue" ? "alert-pill-overdue" : "alert-pill-due",
        severity: serviceState.key === "overdue" ? "overdue" : "due",
        dueDate,
        message: `${record.assetName} ${
          serviceState.key === "overdue" ? "needed service on" : "needs service by"
        } ${formatOptionalDate(dueDate)}.`,
        view: "assets"
      };
    })
    .slice(0, 5);
}

function buildMaintenanceAlerts(records) {
  return records
    .filter((record) => record.status !== "Completed" && record.dueDate)
    .map((record) => {
      const daysRemaining = daysUntilDate(record.dueDate);

      if (!Number.isFinite(daysRemaining) || daysRemaining > 7) {
        return null;
      }

      const severity = daysRemaining < 0 ? "overdue" : "due";
      return {
        source: "maintenance",
        subject: record.location || record.assetItem || record.issue,
        headline: "Maintenance Deadline",
        label: severity === "overdue" ? "Overdue" : "Due Soon",
        pillClass: severity === "overdue" ? "alert-pill-overdue" : "alert-pill-due",
        severity,
        dueDate: record.dueDate,
        message:
          severity === "overdue"
            ? `${record.issue} is overdue since ${formatDisplayDate(record.dueDate)}.`
            : `${record.issue} is due ${formatDisplayDate(record.dueDate)}.`,
        view: "maintenance"
      };
    })
    .filter(Boolean);
}

function getWorkspaceAlertPriority(alert) {
  if (alert.severity === "overdue") {
    return 0;
  }

  if (alert.source === "salary") {
    return 1;
  }

  if (alert.source === "deposits") {
    return 2;
  }

  if (alert.source === "equipment-rentals") {
    return 3;
  }

  if (alert.source === "laundry") {
    return 4;
  }

  if (alert.source === "procurement") {
    return 5;
  }

  if (alert.source === "assets") {
    return 6;
  }

  if (alert.source === "maintenance") {
    return 7;
  }

  if (alert.source === "suppliers") {
    return 8;
  }

  if (alert.source === "mobile-money") {
    return 9;
  }

  if (alert.source === "recurring") {
    return 10;
  }

  return 11;
}

function getRecentMonthKeys(anchorMonth, count = 6) {
  const normalizedAnchor = normalizeMonthInput(anchorMonth) || getMonthKey(new Date());
  const total = Math.max(1, Number.parseInt(count, 10) || 6);

  return Array.from({ length: total }, (_, index) =>
    shiftMonthKey(normalizedAnchor, index - total + 1)
  );
}

function buildScopedMonthlyTrendRows(monthKeys, options = {}) {
  const normalizedMonths = Array.isArray(monthKeys) ? monthKeys.map(normalizeMonthInput).filter(Boolean) : [];
  const areaFilter = normalizeBusinessAreaId(options.areaFilter);
  const includePettyInSpend = options.includePettyInSpend === true;
  const matchesArea = (businessAreaId) =>
    areaFilter === "" || normalizeBusinessAreaId(businessAreaId) === areaFilter;

  return normalizedMonths.map((monthKey) => {
    const salesCollected = state.sales
      .filter((record) => record.date.startsWith(monthKey) && matchesArea(record.businessAreaId))
      .reduce((sum, record) => sum + record.amount, 0);
    const rentCollected = state.rentals
      .filter((record) => record.month === monthKey && (areaFilter === "" || areaFilter === "rentals-apartments"))
      .reduce((sum, record) => sum + record.rentPaid, 0);
    const billsRecovered = state.rentals
      .filter((record) => record.month === monthKey && (areaFilter === "" || areaFilter === "rentals-apartments"))
      .reduce((sum, record) => sum + getBillsPaidAmount(record), 0);
    const expenseTotal = state.expenses
      .filter((record) => record.date.startsWith(monthKey) && matchesArea(record.businessAreaId))
      .reduce((sum, record) => sum + record.amount, 0);
    const salaryPaid = state.salaryRecords
      .filter((record) => record.month === monthKey && matchesArea(record.businessAreaId))
      .reduce((sum, record) => sum + record.amountPaid, 0);
    const pettyExpensePaid = state.pettyCash
      .filter(
        (record) =>
          record.date.startsWith(monthKey) &&
          matchesArea(record.businessAreaId) &&
          getPettyCashType(record.transactionTypeId).isExpense
      )
      .reduce((sum, record) => sum + record.amount, 0);
    const revenue = salesCollected + rentCollected + billsRecovered;
    const spend = expenseTotal + salaryPaid + (includePettyInSpend ? pettyExpensePaid : 0);

    return {
      month: monthKey,
      label: formatMonthLabel(monthKey),
      salesCollected,
      rentCollected,
      billsRecovered,
      revenue,
      expenseTotal,
      salaryPaid,
      pettyExpensePaid,
      spend,
      net: revenue - spend
    };
  });
}

function getChartBarWidth(value, maxValue) {
  if (!Number.isFinite(value) || value <= 0 || !Number.isFinite(maxValue) || maxValue <= 0) {
    return 0;
  }

  return Math.max(4, Math.min(100, (value / maxValue) * 100));
}

function buildChartSummaryMarkup(summaryItems) {
  const items = Array.isArray(summaryItems) ? summaryItems.filter(Boolean) : [];

  if (items.length === 0) {
    return "";
  }

  return `
    <div class="chart-insight-strip">
      ${items
        .map(
          (item) => `
            <div class="chart-insight">
              <span>${escapeHtml(item.label)}</span>
              <strong class="${escapeHtml(item.valueClass || "")}">${escapeHtml(item.value)}</strong>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function buildChartLegendMarkup(items) {
  const legendItems = Array.isArray(items) ? items.filter(Boolean) : [];

  if (legendItems.length === 0) {
    return "";
  }

  return `
    <div class="chart-legend">
      ${legendItems
        .map(
          (item) => `
            <span class="chart-legend-item">
              <span class="legend-swatch legend-swatch-${escapeHtml(item.tone || "accent")}"></span>
              ${escapeHtml(item.label)}
            </span>
          `
        )
        .join("")}
    </div>
  `;
}

function buildComparisonChartCard(config) {
  const rows = Array.isArray(config.rows)
    ? config.rows
        .filter(
          (row) =>
            row &&
            (config.includeZeroRows ||
              parseOptionalAmount(row.primary) > 0 ||
              parseOptionalAmount(row.secondary) > 0)
        )
        .slice(0, config.limit || 6)
    : [];
  const maxValue = Math.max(
    1,
    ...rows.flatMap((row) => [parseOptionalAmount(row.primary), parseOptionalAmount(row.secondary)])
  );

  return `
    <article class="chart-card${config.wide ? " chart-card-wide" : ""}">
      <div class="chart-card-header">
        <div class="chart-card-title-group">
          <p class="chart-card-eyebrow">${escapeHtml(config.eyebrow || "Chart")}</p>
          <h4 class="chart-card-title">${escapeHtml(config.title || "Comparison")}</h4>
        </div>
      </div>
      ${
        config.note
          ? `<p class="chart-card-note">${escapeHtml(config.note)}</p>`
          : ""
      }
      ${buildChartLegendMarkup([
        { label: config.primaryLabel || "Primary", tone: config.primaryTone || "primary" },
        { label: config.secondaryLabel || "Secondary", tone: config.secondaryTone || "secondary" }
      ])}
      ${
        rows.length === 0
          ? `<div class="chart-empty">${escapeHtml(config.emptyMessage || "No chart data available yet.")}</div>`
          : `
              <div class="chart-stack">
                ${rows
                  .map((row) => {
                    const primary = parseOptionalAmount(row.primary);
                    const secondary = parseOptionalAmount(row.secondary);

                    return `
                      <div class="chart-row">
                        <div class="chart-row-header">
                          <div class="chart-row-label-group">
                            <span class="chart-row-label">${escapeHtml(row.label)}</span>
                            ${
                              row.meta
                                ? `<span class="chart-row-meta">${escapeHtml(row.meta)}</span>`
                                : ""
                            }
                          </div>
                          <span class="chart-row-value ${escapeHtml(row.valueClass || "")}">${escapeHtml(
                            row.valueLabel ||
                              (typeof config.valueFormatter === "function"
                                ? config.valueFormatter(primary - secondary)
                                : formatSignedCurrency(primary - secondary))
                          )}</span>
                        </div>
                        <div class="chart-track-group">
                          <div class="chart-track">
                            <span
                              class="chart-bar chart-bar-${escapeHtml(config.primaryTone || "primary")}"
                              style="width:${getChartBarWidth(primary, maxValue)}%;"
                            ></span>
                          </div>
                          <div class="chart-track">
                            <span
                              class="chart-bar chart-bar-${escapeHtml(config.secondaryTone || "secondary")}"
                              style="width:${getChartBarWidth(secondary, maxValue)}%;"
                            ></span>
                          </div>
                        </div>
                        <div class="chart-row-footer">
                          <span>${escapeHtml(config.primaryLabel || "Primary")} ${escapeHtml(
                            (config.primaryValueFormatter || formatCurrency)(primary)
                          )}</span>
                          <span>${escapeHtml(config.secondaryLabel || "Secondary")} ${escapeHtml(
                            (config.secondaryValueFormatter || formatCurrency)(secondary)
                          )}</span>
                        </div>
                      </div>
                    `;
                  })
                  .join("")}
              </div>
            `
      }
      ${buildChartSummaryMarkup(config.summaryItems)}
    </article>
  `;
}

function buildSingleSeriesChartCard(config) {
  const rows = Array.isArray(config.rows)
    ? config.rows
        .filter((row) => row && (config.includeZeroRows || parseOptionalAmount(row.value) > 0))
        .slice(0, config.limit || 6)
    : [];
  const maxValue =
    Number.isFinite(config.maxValue) && config.maxValue > 0
      ? config.maxValue
      : Math.max(1, ...rows.map((row) => parseOptionalAmount(row.maxValue ?? row.value)));

  return `
    <article class="chart-card${config.wide ? " chart-card-wide" : ""}">
      <div class="chart-card-header">
        <div class="chart-card-title-group">
          <p class="chart-card-eyebrow">${escapeHtml(config.eyebrow || "Chart")}</p>
          <h4 class="chart-card-title">${escapeHtml(config.title || "Progress")}</h4>
        </div>
      </div>
      ${
        config.note
          ? `<p class="chart-card-note">${escapeHtml(config.note)}</p>`
          : ""
      }
      ${
        rows.length === 0
          ? `<div class="chart-empty">${escapeHtml(config.emptyMessage || "No chart data available yet.")}</div>`
          : `
              <div class="chart-stack">
                ${rows
                  .map((row) => {
                    const value = parseOptionalAmount(row.value);

                    return `
                      <div class="chart-row">
                        <div class="chart-row-header">
                          <div class="chart-row-label-group">
                            <span class="chart-row-label">${escapeHtml(row.label)}</span>
                            ${
                              row.meta
                                ? `<span class="chart-row-meta">${escapeHtml(row.meta)}</span>`
                                : ""
                            }
                          </div>
                          <span class="chart-row-value ${escapeHtml(row.valueClass || "")}">${escapeHtml(
                            row.valueLabel ||
                              (typeof config.valueFormatter === "function"
                                ? config.valueFormatter(value)
                                : formatCurrency(value))
                          )}</span>
                        </div>
                        <div class="chart-track chart-track-single">
                          <span
                            class="chart-bar chart-bar-${escapeHtml(row.tone || config.tone || "accent")}"
                            style="width:${getChartBarWidth(value, row.maxValue || maxValue)}%;"
                          ></span>
                        </div>
                        ${
                          row.footer
                            ? `<div class="chart-row-footer"><span>${escapeHtml(row.footer)}</span></div>`
                            : ""
                        }
                      </div>
                    `;
                  })
                  .join("")}
              </div>
            `
      }
      ${buildChartSummaryMarkup(config.summaryItems)}
    </article>
  `;
}

function buildOverviewAreaPerformanceRows(monthKey, monthSalesEntries, monthExpenseEntries, monthSalaryRecords) {
  const monthExpenseByArea = new Map();
  const monthSalesByArea = new Map();
  const monthRentByArea = new Map();
  const monthSalaryByArea = new Map();
  const pettyCashByArea = new Map();
  const budgetByArea = new Map();

  monthExpenseEntries.forEach((expense) => {
    monthExpenseByArea.set(
      expense.businessAreaId,
      (monthExpenseByArea.get(expense.businessAreaId) || 0) + expense.amount
    );
  });

  monthSalesEntries.forEach((sale) => {
    monthSalesByArea.set(sale.businessAreaId, (monthSalesByArea.get(sale.businessAreaId) || 0) + sale.amount);
  });

  monthSalaryRecords.forEach((record) => {
    monthSalaryByArea.set(
      record.businessAreaId,
      (monthSalaryByArea.get(record.businessAreaId) || 0) + record.amountPaid
    );
  });

  state.rentals
    .filter((record) => record.month === monthKey)
    .forEach((record) => {
      monthRentByArea.set(
        "rentals-apartments",
        (monthRentByArea.get("rentals-apartments") || 0) + record.rentPaid
      );
    });

  state.pettyCash
    .filter((entry) => entry.date.startsWith(monthKey) && getPettyCashType(entry.transactionTypeId).isExpense)
    .forEach((entry) => {
      pettyCashByArea.set(entry.businessAreaId, (pettyCashByArea.get(entry.businessAreaId) || 0) + entry.amount);
    });

  state.budgets
    .filter((budget) => budget.month === monthKey)
    .forEach((budget) => {
      budgetByArea.set(budget.businessAreaId, (budgetByArea.get(budget.businessAreaId) || 0) + budget.amount);
    });

  return BUSINESS_AREAS
    .map((area) => {
      const sales = monthSalesByArea.get(area.id) || 0;
      const rentCollected = monthRentByArea.get(area.id) || 0;
      const expenses = monthExpenseByArea.get(area.id) || 0;
      const salaryPaid = monthSalaryByArea.get(area.id) || 0;
      const pettyCashUsed = pettyCashByArea.get(area.id) || 0;
      const budget = budgetByArea.get(area.id) || 0;
      const revenue = sales + rentCollected;
      const spend = expenses + salaryPaid;
      const net = revenue - spend;
      const activityTotal = revenue + spend + budget;

      return {
        area,
        revenue,
        sales,
        rentCollected,
        spend,
        expenses,
        salaryPaid,
        pettyCashUsed,
        budget,
        net,
        activityTotal
      };
    })
    .sort((left, right) => {
      if (right.activityTotal !== left.activityTotal) {
        return right.activityTotal - left.activityTotal;
      }

      return left.area.shortLabel.localeCompare(right.area.shortLabel);
    });
}

function buildOverviewAreaPerformanceCards(areaRows, trendRows, monthKey) {
  const activeAreaRows = areaRows.filter((item) => item.activityTotal > 0);
  const bestTrendRow = [...trendRows]
    .sort((left, right) => right.net - left.net)
    .find((row) => row.revenue > 0 || row.spend > 0);
  const topArea = activeAreaRows[0] || null;
  const positiveAreaCount = activeAreaRows.filter((item) => item.net >= 0).length;
  const trendChart = buildComparisonChartCard({
    eyebrow: "Trend",
    title: "Last 6 Months Revenue vs Direct Spend",
    note: "Daily sales, rent, and bills recovered are compared against direct expenses and salaries. Petty cash is tracked separately below.",
    rows: trendRows.map((row) => ({
      label: row.label,
      primary: row.revenue,
      secondary: row.spend,
      meta: `Sales ${formatCurrency(row.salesCollected)} • Rent ${formatCurrency(
        row.rentCollected + row.billsRecovered
      )}`,
      valueLabel: formatSignedCurrency(row.net),
      valueClass: row.net < 0 ? "negative-text" : ""
    })),
    primaryLabel: "Revenue",
    secondaryLabel: "Direct Spend",
    wide: true,
    emptyMessage: "Save sales, rent, or expense records to unlock the six-month movement chart.",
    summaryItems: [
      {
        label: "6-Month Revenue",
        value: formatCurrency(trendRows.reduce((sum, row) => sum + row.revenue, 0))
      },
      {
        label: "6-Month Spend",
        value: formatCurrency(trendRows.reduce((sum, row) => sum + row.spend, 0))
      },
      {
        label: "Best Net Month",
        value: bestTrendRow
          ? `${formatMonthLabel(bestTrendRow.month)} • ${formatSignedCurrency(bestTrendRow.net)}`
          : "No activity yet",
        valueClass: bestTrendRow && bestTrendRow.net < 0 ? "negative-text" : ""
      }
    ]
  });
  const areaChart = buildComparisonChartCard({
    eyebrow: "Business Areas",
    title: `${formatMonthLabel(monthKey)} Area Mix`,
    note: "Areas are ranked by current-month captured activity so you can see where revenue is moving and where spend is sitting.",
    rows: activeAreaRows.map((item) => ({
      label: item.area.shortLabel,
      primary: item.revenue,
      secondary: item.spend,
      meta: `Budget ${formatCurrency(item.budget)} • Petty cash ${formatCurrency(item.pettyCashUsed)}`,
      valueLabel: formatSignedCurrency(item.net),
      valueClass: item.net < 0 ? "negative-text" : ""
    })),
    primaryLabel: "Revenue",
    secondaryLabel: "Spend",
    wide: true,
    emptyMessage: "No business-area activity has been captured for this month yet.",
    summaryItems: [
      {
        label: "Top Area",
        value: topArea ? topArea.area.shortLabel : "No activity"
      },
      {
        label: "Areas Positive",
        value: `${positiveAreaCount}/${activeAreaRows.length || BUSINESS_AREAS.length}`
      },
      {
        label: "Budget Logged",
        value: formatCurrency(activeAreaRows.reduce((sum, item) => sum + item.budget, 0))
      }
    ]
  });
  const areaCards = activeAreaRows.length
    ? activeAreaRows
        .map((item) => {
          const visual = getBusinessAreaVisual(item.area.id);

          return `
            <article class="module-card dashboard-area-card module-card-visual">
              <div class="module-card-top">
                <span
                  class="module-icon-badge module-icon-badge-compact"
                  style="--visual-accent:${escapeHtml(visual.accent)}; --visual-soft:${escapeHtml(visual.soft)};"
                  aria-hidden="true"
                >
                  <span>${escapeHtml(item.area.shortLabel.slice(0, 1))}</span>
                </span>
                <div class="module-card-copy">
                  <strong>${escapeHtml(item.area.shortLabel)}</strong>
                  <span class="module-meta">
                    Revenue ${escapeHtml(formatCurrency(item.revenue))} • Spend ${escapeHtml(
                      formatCurrency(item.spend)
                    )}
                  </span>
                </div>
              </div>
              <span class="dashboard-chip ${item.net >= 0 ? "dashboard-chip-positive" : "dashboard-chip-negative"}">
                Net ${escapeHtml(formatSignedCurrency(item.net))}
              </span>
              <span class="module-meta">
                Sales ${escapeHtml(formatCurrency(item.sales))}${
                  item.rentCollected > 0 ? ` • Rent ${escapeHtml(formatCurrency(item.rentCollected))}` : ""
                } • Payroll ${escapeHtml(formatCurrency(item.salaryPaid))} • Petty cash ${escapeHtml(
                  formatCurrency(item.pettyCashUsed)
                )}${
                  item.budget > 0 ? ` • Budget ${escapeHtml(formatCurrency(item.budget))}` : ""
                }
              </span>
            </article>
          `;
        })
        .join("")
    : `<div class="empty-state">No business-area records have been captured for ${escapeHtml(
        formatMonthLabel(monthKey)
      )} yet.</div>`;

  return `${trendChart}${areaChart}${areaCards}`;
}

function buildOverviewAlertItems(alerts) {
  if (alerts.length === 0) {
    return `
      <div class="empty-state">No priority alerts are currently due across apartments, salary, suppliers, recurring work, or maintenance.</div>
    `;
  }

  return alerts
    .slice(0, 8)
    .map(
      (alert) => `
        <article class="activity-item">
          <div class="dashboard-alert-row">
            <span class="activity-kicker">${escapeHtml(alert.subject)}</span>
            <span class="alert-pill ${escapeHtml(alert.pillClass)}">${escapeHtml(alert.label)}</span>
          </div>
          <strong>${escapeHtml(alert.headline || "Operating Alert")}</strong>
          <span class="module-meta">${escapeHtml(alert.message)}</span>
          <button class="button button-secondary" data-go-view="${escapeHtml(alert.view || "overview")}" type="button">
            Open ${escapeHtml(VIEW_META[alert.view]?.title || "Module")}
          </button>
        </article>
      `
    )
    .join("");
}

function renderExpensesPage() {
  const expenses = getFilteredExpenses();
  renderExpenseSummary(expenses);
  renderExpenseInsights(expenses);
  renderExpenseTable(expenses);
  renderBudgetPanel();
}

function renderExpenseSummary(expenses) {
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const average = expenses.length ? total / expenses.length : 0;
  const coveredCount = expenses.filter(
    (expense) => expense.receiptStatus === "Uploaded" || expense.receiptStatus === "Not Required"
  ).length;
  const coverage = expenses.length ? Math.round((coveredCount / expenses.length) * 100) : 0;

  elements.totalSpendValue.textContent = formatCurrency(total);
  elements.averageExpenseValue.textContent = formatCurrency(average);
  elements.receiptCoverageValue.textContent = `${coverage}%`;
  elements.entriesInViewValue.textContent = String(expenses.length);
  elements.resultsCountText.textContent = `${expenses.length} expense${
    expenses.length === 1 ? "" : "s"
  } shown of ${state.expenses.length}.`;

  if (state.expenses.length === 0) {
    elements.lastActivityText.textContent = "Start by saving your first expense.";
    return;
  }

  const latestActivity = state.expenses.reduce((latest, expense) =>
    expense.updatedAt > latest.updatedAt ? expense : latest
  );

  elements.lastActivityText.textContent = `Last activity: ${formatDisplayDate(
    latestActivity.date
  )} (${latestActivity.vendor}, ${getBusinessArea(latestActivity.businessAreaId).shortLabel}).`;
}

function renderExpenseInsights(expenses) {
  const totalsByArea = new Map();

  expenses.forEach((expense) => {
    const areaLabel = getBusinessArea(expense.businessAreaId).shortLabel;
    totalsByArea.set(areaLabel, (totalsByArea.get(areaLabel) || 0) + expense.amount);
  });

  const areaRows = Array.from(totalsByArea.entries()).sort((left, right) => right[1] - left[1]);

  if (areaRows.length === 0) {
    elements.categoryBreakdownMeta.textContent = "No activity yet.";
    elements.categoryBreakdown.innerHTML = `
      <div class="empty-state">Add expenses to see which business areas are carrying the most spend.</div>
    `;
  } else {
    const maxValue = areaRows[0][1];
    elements.categoryBreakdownMeta.textContent = `${areaRows.length} active business area${
      areaRows.length === 1 ? "" : "s"
    } in this view.`;
    elements.categoryBreakdown.innerHTML = areaRows
      .slice(0, 6)
      .map(([areaLabel, total]) => {
        const width = maxValue > 0 ? (total / maxValue) * 100 : 0;
        return `
          <div class="breakdown-item">
            <div class="breakdown-meta">
              <span>${escapeHtml(areaLabel)}</span>
              <strong>${formatCurrency(total)}</strong>
            </div>
            <div class="breakdown-track">
              <div class="breakdown-bar" style="width: ${width.toFixed(1)}%"></div>
            </div>
          </div>
        `;
      })
      .join("");
  }

  const currentMonthKey = getMonthKey(new Date());
  const previousMonthKey = getMonthKey(shiftMonth(new Date(), -1));
  const thisMonthTotal = expenses
    .filter((expense) => expense.date.startsWith(currentMonthKey))
    .reduce((sum, expense) => sum + expense.amount, 0);
  const previousMonthTotal = expenses
    .filter((expense) => expense.date.startsWith(previousMonthKey))
    .reduce((sum, expense) => sum + expense.amount, 0);
  const largestExpense = [...expenses].sort((left, right) => right.amount - left.amount)[0];
  const pendingReceipts = expenses.filter((expense) => expense.receiptStatus === "Pending").length;

  elements.thisMonthValue.textContent = formatCurrency(thisMonthTotal);
  elements.previousMonthValue.textContent = formatCurrency(previousMonthTotal);
  elements.largestExpenseValue.textContent = largestExpense
    ? `${largestExpense.vendor} (${formatCurrency(largestExpense.amount)})`
    : "None yet";
  elements.receiptFollowUpValue.textContent = `${pendingReceipts} pending`;
}

function renderExpenseTable(expenses) {
  if (expenses.length === 0) {
    elements.expenseTableBody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-state">
          No expenses match the current view. Clear your filters or add a new record.
        </td>
      </tr>
    `;
    elements.tableFootnote.textContent = "Export respects your current filters.";
    return;
  }

  elements.tableFootnote.textContent = `Export will include ${expenses.length} visible expense${
    expenses.length === 1 ? "" : "s"
  }.`;

  elements.expenseTableBody.innerHTML = expenses
    .map((expense) => {
      const isLinkedPettyExpense = Boolean(expense.linkedPettyCashId);
      const editLabel = isLinkedPettyExpense ? "Open Petty Cash" : "Edit";

      return `
        <tr>
          <td>
            <span class="table-primary">${formatDisplayDate(expense.date)}</span>
            <span class="table-secondary">${escapeHtml(expense.reference)}</span>
          </td>
          <td><span class="tag tag-area">${escapeHtml(getBusinessArea(expense.businessAreaId).shortLabel)}</span></td>
          <td>${escapeHtml(expense.vendor)}</td>
          <td><span class="tag tag-category">${escapeHtml(expense.category)}</span></td>
          <td>
            <span class="table-primary">${escapeHtml(expense.description || "—")}</span>
            <span class="table-secondary">${escapeHtml(
              isLinkedPettyExpense ? "Synced from petty cash ledger" : expense.notes || ""
            )}</span>
          </td>
          <td>${escapeHtml(expense.paymentMethod)}</td>
          <td><span class="tag tag-receipt">${escapeHtml(expense.receiptStatus)}</span></td>
          <td class="amount-cell">${formatCurrency(expense.amount)}</td>
          <td>
            <div class="row-actions">
              <button class="edit-btn" data-action="edit" data-id="${escapeHtml(expense.id)}" type="button">
                ${escapeHtml(editLabel)}
              </button>
              <button class="delete-btn" data-action="delete" data-id="${escapeHtml(expense.id)}" type="button">
                Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

function renderSalesPage() {
  const sales = getFilteredSales();
  const totalSales = sales.reduce((sum, sale) => sum + sale.amount, 0);
  const averageSales = sales.length ? totalSales / sales.length : 0;
  const bestSales = [...sales].sort((left, right) => right.amount - left.amount)[0];

  elements.totalSalesValue.textContent = formatCurrency(totalSales);
  elements.salesEntriesValue.textContent = String(sales.length);
  elements.averageSalesValue.textContent = formatCurrency(averageSales);
  elements.bestSalesDayValue.textContent = bestSales
    ? `${formatDisplayDate(bestSales.date)} (${formatCurrency(bestSales.amount)})`
    : "None yet";

  elements.salesFootnote.textContent =
    sales.length === state.sales.length
      ? "Record one total daily sales amount for each business area."
      : `Showing ${sales.length} sales entr${sales.length === 1 ? "y" : "ies"} in the current filter view.`;

  renderSalesTable(sales);
}

function renderSalesTable(sales) {
  if (sales.length === 0) {
    elements.salesTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">
          No daily sales records match the current view yet.
        </td>
      </tr>
    `;
    return;
  }

  elements.salesTableBody.innerHTML = sales
    .map(
      (sale) => `
        <tr>
          <td>${formatDisplayDate(sale.date)}</td>
          <td><span class="tag tag-area">${escapeHtml(getBusinessArea(sale.businessAreaId).shortLabel)}</span></td>
          <td class="amount-cell">${formatCurrency(sale.amount)}</td>
          <td>${escapeHtml(sale.notes || "—")}</td>
          <td>
            <div class="row-actions">
              <button class="edit-btn" data-sales-action="edit" data-id="${escapeHtml(sale.id)}" type="button">
                Edit
              </button>
              <button class="delete-btn" data-sales-action="delete" data-id="${escapeHtml(sale.id)}" type="button">
                Delete
              </button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");
}

function renderRentalsPage() {
  const rentals = getFilteredRentals();
  const latestProfiles = getLatestRentalProfiles();
  const visibleLatestProfiles = getLatestRentalRecords(rentals);
  const occupiedSuites = latestProfiles.filter((record) => record.occupancyStatus === "Occupied").length;
  const trackedUnavailable = latestProfiles.filter((record) =>
    ["Reserved", "Under Maintenance"].includes(record.occupancyStatus)
  ).length;
  const vacantSuites = Math.max(
    APARTMENT_PORTFOLIO_SUITES.length - occupiedSuites - trackedUnavailable,
    0
  );
  const totalRentDue = rentals.reduce((sum, record) => sum + record.rentDue, 0);
  const totalRentPaid = rentals.reduce((sum, record) => sum + record.rentPaid, 0);
  const totalBillsDue = rentals.reduce((sum, record) => sum + getBillsTotal(record), 0);
  const totalBillsPaid = rentals.reduce((sum, record) => sum + getBillsPaidAmount(record), 0);
  const outstanding = visibleLatestProfiles.reduce((sum, record) => sum + getTotalTenantBalance(record), 0);
  const alerts = buildApartmentAlerts(latestProfiles);

  elements.occupiedSuitesValue.textContent = String(occupiedSuites);
  elements.vacantSuitesValue.textContent = String(vacantSuites);
  elements.rentDueValue.textContent = formatCurrency(totalRentDue);
  elements.rentPaidValue.textContent = formatCurrency(totalRentPaid);
  elements.billsDueValue.textContent = formatCurrency(totalBillsDue);
  elements.billsPaidValue.textContent = formatCurrency(totalBillsPaid);
  elements.rentOutstandingValue.textContent = formatCurrency(outstanding);
  elements.rentOutstandingValue.classList.toggle("negative-text", outstanding > 0);
  elements.rentalAlertsValue.textContent = String(alerts.length);
  elements.rentalFootnote.textContent =
    rentals.length === state.rentals.length
      ? "Track long-cycle rent, monthly bills, renewals, and tenant balances for each suite. Current balance uses the latest saved record per suite."
      : `Showing ${rentals.length} apartment record${rentals.length === 1 ? "" : "s"} in the current filter view. Balance total uses the latest visible record per suite.`;

  renderRentalTable(rentals);
  renderApartmentAlerts(alerts);
  renderAgreementReadyPanel();
  renderApartmentPortfolio(latestProfiles);
}

function renderRentalTable(rentals) {
  if (rentals.length === 0) {
    elements.rentalTableBody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-state">
          No apartment rent or bill records match the current view yet.
        </td>
      </tr>
    `;
    return;
  }

  elements.rentalTableBody.innerHTML = rentals
    .map(
      (record) => `
        <tr>
          <td>${escapeHtml(formatMonthLabel(record.month))}</td>
          <td>${escapeHtml(record.suite)}</td>
          <td>
            <span class="status-tag ${escapeHtml(getOccupancyClassName(record.occupancyStatus))}">
              ${escapeHtml(record.occupancyStatus)}
            </span>
          </td>
          <td>
            <span class="table-primary">${escapeHtml(record.tenantName || "—")}</span>
            <span class="table-secondary">${escapeHtml(getRentCycleLabel(record))}</span>
            <span class="table-secondary">${escapeHtml(record.tenantPhone || record.tenantIdRef || "")}</span>
          </td>
          <td>
            <span class="table-primary">Due ${formatCurrency(record.rentDue)}</span>
            <span class="table-secondary">Paid ${formatCurrency(record.rentPaid)}</span>
            <span class="table-secondary">Cycle amount ${formatCurrency(record.rentCycleAmount)}</span>
          </td>
          <td>
            <span class="table-primary">Due ${formatCurrency(getBillsTotal(record))}</span>
            <span class="table-secondary">Paid ${formatCurrency(getBillsPaidAmount(record))}</span>
            <span class="table-secondary">${escapeHtml(buildBillBreakdownLabel(record))}</span>
          </td>
          <td>
            <span class="table-primary">${escapeHtml(buildDueDateLabel(record))}</span>
            <span class="table-secondary">${escapeHtml(buildRenewalLabel(record))}</span>
            <span class="table-secondary">${escapeHtml(buildRecordAlertLabel(record))}</span>
          </td>
          <td class="${getTotalTenantBalance(record) > 0 ? "negative-text" : ""}">
            <div class="apartment-table-balance">
              <strong>${formatCurrency(getTotalTenantBalance(record))}</strong>
              <span>${escapeHtml(buildTenantBalanceBreakdownLabel(record))}</span>
            </div>
          </td>
          <td>
            <div class="row-actions">
              <button class="edit-btn" data-rental-action="edit" data-id="${escapeHtml(record.id)}" type="button">
                Edit
              </button>
              <button class="edit-btn" data-rental-action="agreement" data-id="${escapeHtml(record.id)}" type="button">
                Agreement
              </button>
              <button class="edit-btn" data-rental-action="statement" data-id="${escapeHtml(record.id)}" type="button">
                Statement
              </button>
              <button class="edit-btn" data-rental-action="receipt" data-id="${escapeHtml(record.id)}" type="button">
                Receipt
              </button>
              <button class="delete-btn" data-rental-action="delete" data-id="${escapeHtml(record.id)}" type="button">
                Delete
              </button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");
}

function renderApartmentAlerts(alerts) {
  elements.apartmentAlertMeta.textContent =
    alerts.length === 0
      ? "No rent, bill, or renewal alerts need attention right now."
      : `${alerts.length} alert${alerts.length === 1 ? "" : "s"} need attention across rent, bills, and renewals.`;

  if (alerts.length === 0) {
    elements.apartmentAlertList.innerHTML = `
      <div class="empty-state">All current apartment alerts are clear.</div>
    `;
    return;
  }

  elements.apartmentAlertList.innerHTML = alerts
    .slice(0, 10)
    .map(
      (alert) => `
        <article>
          <span class="alert-pill ${escapeHtml(alert.pillClass)}">${escapeHtml(alert.label)}</span>
          <strong>${escapeHtml(alert.suite)}</strong>
          <span>${escapeHtml(alert.message)}</span>
        </article>
      `
    )
    .join("");
}

function renderAgreementReadyPanel() {
  if (!elements.agreementReadyList || !elements.agreementReadyMeta) {
    return;
  }

  if (state.agreementReadyFiles.length === 0) {
    elements.agreementReadyMeta.textContent =
      "Prepared tenancy agreements will appear here so you can download them again if the browser blocks the automatic file download.";
    elements.agreementReadyList.innerHTML = `
      <div class="empty-state">No agreement files have been prepared in this session yet.</div>
    `;
    return;
  }

  elements.agreementReadyMeta.textContent =
    "The newest prepared tenancy files stay here during this session so you can retry the download if needed.";
  elements.agreementReadyList.innerHTML = state.agreementReadyFiles
    .map(
      (file) => `
        <article class="agreement-ready-item">
          <strong>${escapeHtml(file.filename)}</strong>
          <span>${escapeHtml(file.suite)}${file.tenantName ? ` • ${escapeHtml(file.tenantName)}` : ""}</span>
          <span class="module-meta">Prepared ${escapeHtml(formatTimestampLabel(file.createdAt))}</span>
          <div class="agreement-ready-actions">
            <a class="button button-secondary button-link" href="${escapeHtml(file.url)}" download="${escapeHtml(
              file.filename
            )}">
              Download Again
            </a>
          </div>
        </article>
      `
    )
    .join("");
}

function renderApartmentPortfolio(records) {
  if (records.length === 0) {
    elements.apartmentPortfolioList.innerHTML = `
      <div class="empty-state">
        No apartment profiles yet. Save the first apartment record to build tenant accounts and alerts.
      </div>
    `;
    return;
  }

  elements.apartmentPortfolioList.innerHTML = records
    .map((record) => {
      const history = getSuitePaymentHistory(record.suite);
      const customBillItems = getCustomBillItemEntries(record);
      const hasSavedRecord = Boolean(record.id);

      return `
        <article class="module-card apartment-card">
          <div class="apartment-card-header">
            <strong>${escapeHtml(record.suite)}</strong>
            <span class="status-tag ${escapeHtml(getOccupancyClassName(record.occupancyStatus))}">
              ${escapeHtml(record.occupancyStatus)}
            </span>
          </div>

          <div class="stacked-lines">
            <span>${escapeHtml(record.tenantName || "No tenant saved yet")}</span>
            <span>${escapeHtml(record.tenantPhone || "No phone saved")}</span>
            <span>${escapeHtml(record.tenantIdRef || "No ID/reference saved")}</span>
          </div>

          <div class="apartment-mini-grid">
            <div class="apartment-detail-item">
              <span>Rent Cycle</span>
              <strong>${escapeHtml(getRentCycleLabel(record))}</strong>
            </div>
            <div class="apartment-detail-item">
              <span>Cycle Amount</span>
              <strong>${formatCurrency(record.rentCycleAmount)}</strong>
            </div>
            <div class="apartment-detail-item">
              <span>Next Rent Due</span>
              <strong>${escapeHtml(formatOptionalDate(record.nextRentDueDate))}</strong>
            </div>
            <div class="apartment-detail-item">
              <span>Bill Due</span>
              <strong>${escapeHtml(formatOptionalDate(record.billDueDate))}</strong>
            </div>
            <div class="apartment-detail-item">
              <span>Rent Balance</span>
              <strong>${formatCurrency(getOutstandingRent(record))}</strong>
            </div>
            <div class="apartment-detail-item">
              <span>Bills Balance</span>
              <strong>${formatCurrency(getOutstandingBills(record))}</strong>
            </div>
            <div class="apartment-detail-item">
              <span>Arrears + Late Fee</span>
              <strong>${formatCurrency(getCarryForwardBalance(record))}</strong>
            </div>
            <div class="apartment-detail-item">
              <span>Total Balance</span>
              <strong>${formatCurrency(getTotalTenantBalance(record))}</strong>
            </div>
          </div>

          <div class="apartment-detail-list">
            <div class="apartment-detail-item">
              <span>Lease Period</span>
              <strong>${escapeHtml(buildLeasePeriodLabel(record))}</strong>
            </div>
            <div class="apartment-detail-item">
              <span>Coverage</span>
              <strong>${escapeHtml(buildCoverageLabel(record))}</strong>
            </div>
            <div class="apartment-detail-item">
              <span>Renewal</span>
              <strong>${escapeHtml(buildRenewalLabel(record))}</strong>
            </div>
            <div class="apartment-detail-item">
              <span>Agreement</span>
              <strong>${escapeHtml(buildAgreementGeneratedLabel(record))}</strong>
            </div>
            ${
              customBillItems.length > 0
                ? `<div class="apartment-detail-item">
                    <span>Custom Bill Items</span>
                    <strong>${escapeHtml(
                      customBillItems
                        .map((item) => `${item.label} ${formatCurrency(item.amount)}`)
                        .join(" • ")
                    )}</strong>
                  </div>`
                : ""
            }
          </div>

          <div class="apartment-history-list">
            ${
              history.length === 0
                ? `<div class="apartment-history-item"><span>No payment history saved yet.</span></div>`
                : history
                    .map(
                      (item) => `
                        <div class="apartment-history-item">
                          <strong>${escapeHtml(formatMonthLabel(item.month))}</strong>
                          <span>Rent paid ${formatCurrency(item.rentPaid)}${
                            item.rentPaymentMethod ? ` via ${escapeHtml(item.rentPaymentMethod)}` : ""
                          }</span>
                          <span>Bills paid ${formatCurrency(getBillsPaidAmount(item))}${
                            item.billPaymentMethod ? ` via ${escapeHtml(item.billPaymentMethod)}` : ""
                          }</span>
                        </div>
                      `
                    )
                    .join("")
            }
          </div>

          <div class="apartment-card-actions">
            ${
              hasSavedRecord
                ? `
                    <button class="button button-secondary" data-rental-action="edit" data-id="${escapeHtml(record.id)}" type="button">
                      Edit Latest
                    </button>
                    <button class="button button-secondary" data-rental-action="agreement" data-id="${escapeHtml(record.id)}" type="button">
                      Generate Agreement
                    </button>
                    <button class="button button-secondary" data-rental-action="statement" data-id="${escapeHtml(record.id)}" type="button">
                      Tenant Statement
                    </button>
                    <button class="button button-ghost" data-rental-action="receipt" data-id="${escapeHtml(record.id)}" type="button">
                      Print Receipt
                    </button>
                  `
                : `
                    <button class="button button-secondary" data-rental-action="new" data-suite="${escapeHtml(record.suite)}" type="button">
                      Create Record
                    </button>
                  `
            }
          </div>
        </article>
      `;
    })
    .join("");
}

function renderPettyCashPage() {
  const filteredPettyCash = getFilteredPettyCash();
  const overallBalance = getPettyCashBalance(state.pettyCash);
  const inflows = filteredPettyCash
    .filter((entry) => getPettyCashType(entry.transactionTypeId).effect > 0)
    .reduce((sum, entry) => sum + entry.amount, 0);
  const outflows = filteredPettyCash
    .filter((entry) => getPettyCashType(entry.transactionTypeId).effect < 0)
    .reduce((sum, entry) => sum + entry.amount, 0);
  const pendingReceipts = filteredPettyCash.filter((entry) => entry.receiptStatus === "Pending").length;

  elements.pettyCashBalanceValue.textContent = formatCurrency(overallBalance);
  elements.pettyCashInflowValue.textContent = formatCurrency(inflows);
  elements.pettyCashOutflowValue.textContent = formatCurrency(outflows);
  elements.pettyCashPendingValue.textContent = String(pendingReceipts);
  elements.pettyCashEntriesValue.textContent = String(filteredPettyCash.length);
  elements.pettyCashBalanceValue.classList.toggle("negative-text", overallBalance < 0);
  elements.pettyCashFootnote.textContent =
    filteredPettyCash.length === state.pettyCash.length
      ? "Track float top-ups, petty cash spending, returns, and adjustments."
      : `Showing ${filteredPettyCash.length} ledger entr${
          filteredPettyCash.length === 1 ? "y" : "ies"
        } in the current filter view. Cash balance remains the overall ledger position.`;

  renderPettyCashTable(filteredPettyCash);
  renderPettyCashBudgetPanel();
}

function renderPettyCashTable(entries) {
  if (entries.length === 0) {
    elements.pettyCashTableBody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-state">
          No petty cash entries match the current view yet.
        </td>
      </tr>
    `;
    return;
  }

  elements.pettyCashTableBody.innerHTML = entries
    .map((entry) => {
      const type = getPettyCashType(entry.transactionTypeId);
      const effect = getPettyCashEffect(entry);
      const linkedLabel = entry.linkedExpenseId ? "Synced to expense register" : entry.notes || "";

      return `
        <tr>
          <td>${formatDisplayDate(entry.date)}</td>
          <td><span class="tag tag-petty">${escapeHtml(type.label)}</span></td>
          <td><span class="tag tag-area">${escapeHtml(getBusinessArea(entry.businessAreaId).shortLabel)}</span></td>
          <td>${escapeHtml(entry.category || "—")}</td>
          <td>
            <span class="table-primary">${escapeHtml(entry.vendor)}</span>
            <span class="table-secondary">${escapeHtml(linkedLabel)}</span>
          </td>
          <td><span class="tag tag-receipt">${escapeHtml(entry.receiptStatus)}</span></td>
          <td class="amount-cell ${effect < 0 ? "negative-text" : ""}">
            ${formatSignedCurrency(effect)}
          </td>
          <td>${escapeHtml(entry.notes || "—")}</td>
          <td>
            <div class="row-actions">
              <button class="edit-btn" data-petty-action="edit" data-id="${escapeHtml(entry.id)}" type="button">
                Edit
              </button>
              <button class="delete-btn" data-petty-action="delete" data-id="${escapeHtml(entry.id)}" type="button">
                Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

function normalizeLedgerPartyType(value) {
  const normalized = normalizeText(value).toLowerCase();
  const matched = LEDGER_PARTY_TYPE_OPTIONS.find((option) => option.value === normalized);
  return matched ? matched.value : "";
}

function normalizeLedgerEntryType(value) {
  const normalized = normalizeText(value).toLowerCase();
  const matched = LEDGER_ENTRY_TYPE_OPTIONS.find(
    (option) => option.value === normalized || option.label.toLowerCase() === normalized
  );
  return matched ? matched.value : "";
}

function getLedgerEntryType(entryType) {
  return (
    LEDGER_ENTRY_TYPE_MAP.get(normalizeLedgerEntryType(entryType)) || {
      value: "",
      label: "Unknown",
      effect: 0
    }
  );
}

function getLedgerEntryEffect(record) {
  return Number((getLedgerEntryType(record.entryType).effect * record.amount).toFixed(2));
}

function createEmptyLedgerDraft() {
  return {
    entryDate: getTodayInputValue(),
    businessAreaId: DEFAULT_BUSINESS_AREA_ID,
    partyType: "customer",
    partyName: "",
    partyPhone: "",
    suite: "",
    entryType: "charge",
    amount: 0,
    dueDate: "",
    reference: "",
    notes: ""
  };
}

function buildLedgerPartyKey(record) {
  return [
    normalizeLedgerPartyType(record.partyType),
    normalizeText(record.partyName).toLowerCase(),
    normalizeBusinessAreaId(record.businessAreaId),
    normalizeText(record.suite).toLowerCase(),
    normalizeText(record.partyPhone)
  ].join("|");
}

function buildLedgerDraftFromForm(formData) {
  return {
    entryDate: normalizeDateInput(formData.get("ledgerEntryDate")),
    businessAreaId: normalizeBusinessAreaId(formData.get("ledgerBusinessArea")),
    partyType: normalizeLedgerPartyType(formData.get("ledgerPartyType")),
    partyName: normalizeText(formData.get("ledgerPartyName")),
    partyPhone: normalizeText(formData.get("ledgerPartyPhone")),
    suite: normalizeText(formData.get("ledgerSuite")),
    entryType: normalizeLedgerEntryType(formData.get("ledgerEntryType")),
    amount: parseOptionalAmount(formData.get("ledgerAmount")),
    dueDate: normalizeDateInput(formData.get("ledgerDueDate")),
    reference: normalizeText(formData.get("ledgerReference")),
    notes: normalizeText(formData.get("ledgerNotes"))
  };
}

function validateLedgerEntry(record) {
  const errors = [];

  if (!record.entryDate) {
    errors.push("Add the ledger entry date.");
  }

  if (!record.businessAreaId) {
    errors.push("Choose the business area for this ledger entry.");
  }

  if (!record.partyType) {
    errors.push("Choose whether this ledger record is for a tenant, customer, or another account.");
  }

  if (!record.partyName) {
    errors.push("Add the customer or tenant name.");
  }

  if (!record.entryType) {
    errors.push("Choose the ledger entry type.");
  }

  if (record.amount <= 0) {
    errors.push("Enter an amount greater than zero for this ledger entry.");
  }

  return errors;
}

function buildLedgerPartySummaryMap(entries = state.ledgerEntries) {
  const summaryMap = new Map();

  sortLedgerEntries(entries)
    .slice()
    .reverse()
    .forEach((record) => {
      const key = buildLedgerPartyKey(record);
      const effect = getLedgerEntryEffect(record);
      const existing = summaryMap.get(key) || {
        key,
        partyType: record.partyType,
        partyName: record.partyName,
        partyPhone: record.partyPhone,
        suite: record.suite,
        businessAreaId: record.businessAreaId,
        charges: 0,
        credits: 0,
        balance: 0,
        lastEntryDate: "",
        dueDate: "",
        reference: "",
        notes: ""
      };

      existing.balance = Number((existing.balance + effect).toFixed(2));

      if (effect > 0) {
        existing.charges = Number((existing.charges + record.amount).toFixed(2));
      } else {
        existing.credits = Number((existing.credits + record.amount).toFixed(2));
      }

      if (!existing.lastEntryDate || record.entryDate > existing.lastEntryDate) {
        existing.lastEntryDate = record.entryDate;
        existing.dueDate = record.dueDate;
        existing.reference = record.reference;
        existing.notes = record.notes;
      }

      summaryMap.set(key, existing);
    });

  return summaryMap;
}

function getLedgerSummaryStatus(summary) {
  const roundedBalance = Number((summary.balance || 0).toFixed(2));

  if (roundedBalance < 0) {
    return "Credit";
  }

  if (roundedBalance === 0) {
    return "Paid";
  }

  if ((summary.credits || 0) > 0) {
    return "Part Paid";
  }

  return "Open";
}

function getLedgerStatusConfig(summary) {
  const status = getLedgerSummaryStatus(summary);

  if (status === "Paid") {
    return { label: "Paid", pillClass: "alert-pill-on-track" };
  }

  if (status === "Credit") {
    return { label: "Credit", pillClass: "alert-pill-due" };
  }

  if (status === "Part Paid") {
    return { label: "Part Paid", pillClass: "alert-pill-due" };
  }

  return {
    label:
      summary.dueDate && daysUntilDate(summary.dueDate) < 0 ? "Overdue" : "Open",
    pillClass:
      summary.dueDate && daysUntilDate(summary.dueDate) < 0
        ? "alert-pill-overdue"
        : "alert-pill-due"
  };
}

function getFilteredLedgerEntries() {
  const searchValue = normalizeText(state.ledgerFilters.search).toLowerCase();
  const partyTypeValue = normalizeLedgerPartyType(state.ledgerFilters.partyType);
  const areaValue = normalizeBusinessAreaId(state.ledgerFilters.area);
  const statusValue = normalizeText(state.ledgerFilters.status).toLowerCase();
  const summaryMap = buildLedgerPartySummaryMap();

  return state.ledgerEntries.filter((record) => {
    const summary = summaryMap.get(buildLedgerPartyKey(record));
    const haystack = [
      record.partyName,
      record.partyPhone,
      record.suite,
      record.reference,
      record.notes,
      getBusinessArea(record.businessAreaId).label,
      getLedgerEntryType(record.entryType).label
    ]
      .join(" ")
      .toLowerCase();
    const statusKey = normalizeText(getLedgerSummaryStatus(summary)).toLowerCase().replace(/\s+/g, "-");

    return (
      (searchValue === "" || haystack.includes(searchValue)) &&
      (partyTypeValue === "" || record.partyType === partyTypeValue) &&
      (areaValue === "" || record.businessAreaId === areaValue) &&
      (statusValue === "" || statusKey === statusValue)
    );
  });
}

function getFilteredLedgerSummaries() {
  const summaries = Array.from(buildLedgerPartySummaryMap(getFilteredLedgerEntries()).values());

  return summaries.sort((left, right) => {
    if (right.balance !== left.balance) {
      return right.balance - left.balance;
    }

    return normalizeText(left.partyName).localeCompare(normalizeText(right.partyName));
  });
}

function getFilteredTenantLedgerSummaries() {
  const searchValue = normalizeText(state.ledgerFilters.search).toLowerCase();
  const partyTypeValue = normalizeLedgerPartyType(state.ledgerFilters.partyType);
  const areaValue = normalizeBusinessAreaId(state.ledgerFilters.area);
  const statusValue = normalizeText(state.ledgerFilters.status).toLowerCase();

  return getLatestRentalProfiles()
    .filter((record) => normalizeText(record.tenantName))
    .map((record) => {
      const balance = Number(Math.max(getTenantCurrentRunningBalance(record), 0).toFixed(2));
      const nextDueDate =
        normalizeDateInput(record.nextRentDueDate) ||
        normalizeDateInput(record.billDueDate) ||
        normalizeDateInput(record.renewalDate);
      const isDueSoon =
        nextDueDate &&
        Number.isFinite(daysUntilDate(nextDueDate)) &&
        daysUntilDate(nextDueDate) <= 7;

      return {
        key: `tenant|${record.id || record.suite}|${record.month}`,
        source: "tenant",
        partyType: "tenant",
        partyName: record.tenantName,
        partyPhone: record.tenantPhone,
        suite: record.suite,
        businessAreaId: "rentals-apartments",
        dueDate: nextDueDate,
        balance,
        rentBalance: Number(
          (
            getOutstandingRent(record) +
            getCarryForwardBalance(record) +
            parseOptionalAmount(record.lateFee)
          ).toFixed(2)
        ),
        billsBalance: Number(getOutstandingBills(record).toFixed(2)),
        status: balance > 0 ? "Open" : "Paid",
        isDueSoon,
        message: record.notes || ""
      };
    })
    .filter((summary) => {
      const haystack = [
        summary.partyName,
        summary.partyPhone,
        summary.suite,
        summary.message
      ]
        .join(" ")
        .toLowerCase();
      const statusKey = normalizeText(summary.status).toLowerCase().replace(/\s+/g, "-");

      return (
        (searchValue === "" || haystack.includes(searchValue)) &&
        (partyTypeValue === "" || partyTypeValue === "tenant") &&
        (areaValue === "" || areaValue === "rentals-apartments") &&
        (statusValue === "" || statusValue === statusKey) &&
        (summary.balance > 0 || summary.isDueSoon)
      );
    })
    .sort((left, right) => {
      if (right.balance !== left.balance) {
        return right.balance - left.balance;
      }

      return normalizeText(left.partyName).localeCompare(normalizeText(right.partyName));
    });
}

function buildReminderKey(candidate) {
  return [
    candidate.source || "manual",
    normalizeText(candidate.partyName).toLowerCase(),
    normalizeText(candidate.suite).toLowerCase(),
    normalizeText(candidate.partyPhone),
    normalizeDateInput(candidate.dueDate)
  ].join("|");
}

function buildReminderMessage(candidate) {
  const amountText = formatCurrency(candidate.balance || 0);
  const dueText = candidate.dueDate
    ? ` by ${formatDisplayDate(candidate.dueDate)}`
    : "";

  if (candidate.source === "tenant") {
    return `Hello ${candidate.partyName}, this is OneRoot. ${candidate.suite} currently has an outstanding balance of ${amountText}. Please settle${dueText}. Thank you.`;
  }

  return `Hello ${candidate.partyName}, this is OneRoot. Your outstanding balance for ${getBusinessArea(candidate.businessAreaId).shortLabel} is ${amountText}. Please make payment${dueText}. Thank you.`;
}

function buildReminderCandidates() {
  const manualCandidates = getFilteredLedgerSummaries()
    .filter((summary) => summary.balance > 0)
    .map((summary) => ({
      ...summary,
      source: "ledger",
      message: buildReminderMessage(summary)
    }));
  const tenantCandidates = getFilteredTenantLedgerSummaries().map((summary) => ({
    ...summary,
    message: buildReminderMessage(summary)
  }));

  return [...tenantCandidates, ...manualCandidates].map((candidate) => ({
    ...candidate,
    key: buildReminderKey(candidate)
  }));
}

async function copyReminderMessages() {
  const candidates = buildReminderCandidates();

  if (candidates.length === 0) {
    showToast("There are no reminder messages ready in the current ledger view.");
    return;
  }

  const text = candidates.map((candidate) => candidate.message).join("\n\n");
  await writeTextToClipboard(text, `${candidates.length} reminder message${candidates.length === 1 ? "" : "s"} copied.`);
}

async function copyReminderMessageByKey(key) {
  const candidate = buildReminderCandidates().find((item) => item.key === key);

  if (!candidate) {
    showToast("That reminder message could not be found.");
    return;
  }

  await writeTextToClipboard(candidate.message, "Reminder message copied.");
}

async function exportReminderCsv() {
  const candidates = buildReminderCandidates();

  if (candidates.length === 0) {
    showToast("There are no reminder rows to export in this ledger view.");
    return;
  }

  const rows = [
    ["source", "partyType", "name", "phone", "suite", "businessArea", "dueDate", "balance", "message"],
    ...candidates.map((candidate) => [
      candidate.source || "ledger",
      candidate.partyType,
      candidate.partyName,
      candidate.partyPhone,
      candidate.suite || "",
      getBusinessArea(candidate.businessAreaId).label,
      candidate.dueDate || "",
      Number(candidate.balance || 0).toFixed(2),
      candidate.message
    ])
  ];
  const saved = await saveCsvFile(`oneroot-reminders-${dateStamp()}.csv`, rows);

  if (saved) {
    showToast(`Reminder export saved with ${candidates.length} row${candidates.length === 1 ? "" : "s"}.`);
  }
}

function renderLedgersPage() {
  if (!elements.ledgersViewRoot) {
    return;
  }

  const editingRecord = state.ledgerEntries.find((item) => item.id === state.editingLedgerId) || null;
  const draft = editingRecord || createEmptyLedgerDraft();
  const records = getFilteredLedgerEntries();
  const summaries = getFilteredLedgerSummaries();
  const tenantSummaries = getFilteredTenantLedgerSummaries();
  const reminders = buildReminderCandidates();
  const openBalance = summaries.reduce((sum, summary) => sum + Math.max(summary.balance, 0), 0);
  const customerCount = summaries.length;
  const tenantBalance = tenantSummaries.reduce((sum, summary) => sum + summary.balance, 0);
  const dueSoonCount = reminders.filter((candidate) => {
    const daysRemaining = daysUntilDate(candidate.dueDate);
    return Number.isFinite(daysRemaining) && daysRemaining >= 0 && daysRemaining <= 7;
  }).length;

  elements.ledgersViewRoot.innerHTML = `
    <section class="page-grid compact-page-grid">
      <section class="section-card">
        <div class="section-heading">
          <div>
            <p class="kicker">Customer & Tenant Ledger</p>
            <h3>${editingRecord ? "Edit Ledger Entry" : "Track Charges, Payments & Balances"}</h3>
          </div>
          <p class="muted-text">
            Save manual customer or tenant ledger movements here. Apartment tenant balances also surface automatically below for follow-up.
          </p>
        </div>

        <form id="ledgerForm" novalidate>
          <div class="mini-form-grid rental-form-grid">
            <label>
              <span>Entry Date</span>
              <input id="ledgerEntryDate" name="ledgerEntryDate" type="date" value="${escapeHtml(
                draft.entryDate
              )}" required />
            </label>

            <label>
              <span>Business Area</span>
              <select id="ledgerBusinessArea" name="ledgerBusinessArea" required>
                ${buildSelectMarkup(getBusinessAreaOptions(), draft.businessAreaId, "Choose business area")}
              </select>
            </label>

            <label>
              <span>Party Type</span>
              <select id="ledgerPartyType" name="ledgerPartyType" required>
                ${buildSelectMarkup(LEDGER_PARTY_TYPE_OPTIONS, draft.partyType, "Choose party type")}
              </select>
            </label>

            <label>
              <span>Customer / Tenant Name</span>
              <input
                id="ledgerPartyName"
                name="ledgerPartyName"
                type="text"
                value="${escapeHtml(draft.partyName)}"
                placeholder="Name on the account"
                required
              />
            </label>

            <label>
              <span>Phone Number</span>
              <input
                id="ledgerPartyPhone"
                name="ledgerPartyPhone"
                type="tel"
                value="${escapeHtml(draft.partyPhone)}"
                placeholder="Phone for reminders"
              />
            </label>

            <label>
              <span>Suite / Account Ref</span>
              <input
                id="ledgerSuite"
                name="ledgerSuite"
                type="text"
                value="${escapeHtml(draft.suite)}"
                placeholder="Optional suite or account label"
              />
            </label>

            <label>
              <span>Entry Type</span>
              <select id="ledgerEntryType" name="ledgerEntryType" required>
                ${buildSelectMarkup(LEDGER_ENTRY_TYPE_OPTIONS, draft.entryType, "Choose entry type")}
              </select>
            </label>

            <label>
              <span>Amount</span>
              <input
                id="ledgerAmount"
                name="ledgerAmount"
                type="number"
                min="0"
                step="0.01"
                value="${escapeHtml(formatAmountInputValue(draft.amount))}"
                placeholder="0.00"
                required
              />
            </label>

            <label>
              <span>Due Date</span>
              <input id="ledgerDueDate" name="ledgerDueDate" type="date" value="${escapeHtml(
                draft.dueDate
              )}" />
            </label>

            <label>
              <span>Reference</span>
              <input
                id="ledgerReference"
                name="ledgerReference"
                type="text"
                value="${escapeHtml(draft.reference)}"
                placeholder="Invoice, receipt, or memo ref"
              />
            </label>

            <label class="wide-field">
              <span>Notes</span>
              <textarea
                id="ledgerNotes"
                name="ledgerNotes"
                rows="3"
                placeholder="Credit terms, payment discussion, or collection notes"
              >${escapeHtml(draft.notes)}</textarea>
            </label>
          </div>

          <div class="form-actions">
            <button id="submitLedgerBtn" class="button button-primary" type="submit">
              ${editingRecord ? "Update Ledger Entry" : "Save Ledger Entry"}
            </button>
            <button id="resetLedgerBtn" class="button button-secondary" type="button">
              Clear Form
            </button>
            <button
              id="cancelLedgerEditBtn"
              class="button button-ghost ${editingRecord ? "" : "hidden"}"
              type="button"
            >
              Cancel Edit
            </button>
          </div>
        </form>
      </section>

      <aside class="sidebar-column">
        <section class="section-card">
          <div class="section-heading compact">
            <div>
              <p class="kicker">Collections Snapshot</p>
              <h3>Balances & Follow-Up</h3>
            </div>
          </div>
          <div class="mini-stat-grid">
            <article class="stat-card">
              <span>Manual Open Balance</span>
              <strong class="${openBalance > 0 ? "negative-text" : ""}">${formatCurrency(
                openBalance
              )}</strong>
            </article>
            <article class="stat-card">
              <span>Manual Accounts</span>
              <strong>${escapeHtml(String(customerCount))}</strong>
            </article>
            <article class="stat-card">
              <span>Tenant Balance Watch</span>
              <strong class="${tenantBalance > 0 ? "negative-text" : ""}">${formatCurrency(
                tenantBalance
              )}</strong>
            </article>
            <article class="stat-card">
              <span>Reminders Ready</span>
              <strong>${escapeHtml(String(reminders.length))}</strong>
            </article>
          </div>
          <p class="muted-text">
            ${dueSoonCount} reminder${dueSoonCount === 1 ? "" : "s"} are due within the next 7 days in this view.
          </p>
        </section>

        <section class="section-card">
          <div class="section-heading compact">
            <div>
              <p class="kicker">Reminder Export</p>
              <h3>SMS & WhatsApp</h3>
            </div>
          </div>
          <div class="action-grid">
            <button class="button button-secondary" data-global-action="export-view-csv" type="button">
              Export Ledger CSV
            </button>
            <button class="button button-primary" data-ledger-action="export-reminders" type="button">
              Export Reminder CSV
            </button>
            <button class="button button-secondary" data-ledger-action="copy-reminders" type="button">
              Copy All Reminder Text
            </button>
          </div>
          <p class="muted-text">
            Exported rows include name, phone, amount due, and a ready message for later SMS or WhatsApp sending.
          </p>
        </section>

        <section class="section-card">
          <div class="section-heading compact">
            <div>
              <p class="kicker">Filters</p>
              <h3>Refine Ledger View</h3>
            </div>
          </div>
          <div class="filter-grid">
            <label>
              <span>Search</span>
              <input
                id="ledgerSearchFilter"
                type="search"
                value="${escapeHtml(state.ledgerFilters.search)}"
                placeholder="Name, suite, ref, phone"
              />
            </label>
            <label>
              <span>Party Type</span>
              <select id="ledgerPartyTypeFilter">
                ${buildSelectMarkup(LEDGER_PARTY_TYPE_OPTIONS, state.ledgerFilters.partyType, "All Party Types")}
              </select>
            </label>
            <label>
              <span>Business Area</span>
              <select id="ledgerAreaFilter">
                ${buildSelectMarkup(getBusinessAreaOptions(), state.ledgerFilters.area, "All Areas")}
              </select>
            </label>
            <label>
              <span>Status</span>
              <select id="ledgerStatusFilter">
                ${buildSelectMarkup(
                  [
                    { value: "open", label: "Open" },
                    { value: "part-paid", label: "Part Paid" },
                    { value: "paid", label: "Paid" },
                    { value: "credit", label: "Credit" }
                  ],
                  state.ledgerFilters.status,
                  "Any Status"
                )}
              </select>
            </label>
          </div>
        </section>
      </aside>
    </section>

    <section class="two-column-grid">
      <article class="section-card">
        <div class="section-heading compact">
          <div>
            <p class="kicker">Manual Account Balances</p>
            <h3>${summaries.length} Account${summaries.length === 1 ? "" : "s"} In View</h3>
          </div>
        </div>
        <div class="table-wrap compact-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Account</th>
                <th>Area</th>
                <th>Charges</th>
                <th>Credits</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Reminder</th>
              </tr>
            </thead>
            <tbody>
              ${
                summaries.length === 0
                  ? `
                      <tr>
                        <td colspan="7" class="empty-state">No ledger balances match the current view yet.</td>
                      </tr>
                    `
                  : summaries
                      .map((summary) => {
                        const status = getLedgerStatusConfig(summary);
                        const reminderKey = buildReminderKey({ ...summary, source: "ledger" });
                        return `
                          <tr>
                            <td>
                              <span class="table-primary">${escapeHtml(summary.partyName)}</span>
                              <span class="table-secondary">${escapeHtml(summary.partyPhone || summary.suite || "No phone or suite saved")}</span>
                            </td>
                            <td><span class="tag tag-area">${escapeHtml(
                              getBusinessArea(summary.businessAreaId).shortLabel
                            )}</span></td>
                            <td>${formatCurrency(summary.charges)}</td>
                            <td>${formatCurrency(summary.credits)}</td>
                            <td class="${summary.balance > 0 ? "negative-text" : ""}">${formatCurrency(
                              summary.balance
                            )}</td>
                            <td><span class="alert-pill ${escapeHtml(status.pillClass)}">${escapeHtml(
                              status.label
                            )}</span></td>
                            <td>
                              ${
                                summary.balance > 0
                                  ? `<button class="button button-secondary" data-ledger-action="copy-single-reminder" data-key="${escapeHtml(
                                      reminderKey
                                    )}" type="button">Copy Reminder</button>`
                                  : `<span class="table-secondary">Not needed</span>`
                              }
                            </td>
                          </tr>
                        `;
                      })
                      .join("")
              }
            </tbody>
          </table>
        </div>
      </article>

      <article class="section-card">
        <div class="section-heading compact">
          <div>
            <p class="kicker">Apartment Tenant Watch</p>
            <h3>${tenantSummaries.length} Tenant${tenantSummaries.length === 1 ? "" : "s"} Need Attention</h3>
          </div>
        </div>
        <div class="table-wrap compact-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Suite</th>
                <th>Rent / Bills Balance</th>
                <th>Due</th>
                <th>Reminder</th>
              </tr>
            </thead>
            <tbody>
              ${
                tenantSummaries.length === 0
                  ? `
                      <tr>
                        <td colspan="5" class="empty-state">No tenant balances or due reminders match the current view.</td>
                      </tr>
                    `
                  : tenantSummaries
                      .map((summary) => `
                        <tr>
                          <td>
                            <span class="table-primary">${escapeHtml(summary.partyName)}</span>
                            <span class="table-secondary">${escapeHtml(summary.partyPhone || "No phone saved")}</span>
                          </td>
                          <td>${escapeHtml(summary.suite)}</td>
                          <td>
                            <span class="table-primary ${summary.balance > 0 ? "negative-text" : ""}">${formatCurrency(
                              summary.balance
                            )}</span>
                            <span class="table-secondary">Rent ${formatCurrency(
                              summary.rentBalance
                            )} • Bills ${formatCurrency(summary.billsBalance)}</span>
                          </td>
                          <td>${escapeHtml(formatOptionalDate(summary.dueDate))}</td>
                          <td>
                            <button class="button button-secondary" data-ledger-action="copy-single-reminder" data-key="${escapeHtml(
                              buildReminderKey(summary)
                            )}" type="button">
                              Copy Reminder
                            </button>
                          </td>
                        </tr>
                      `)
                      .join("")
              }
            </tbody>
          </table>
        </div>
      </article>
    </section>

    <section class="section-card">
      <div class="section-heading compact">
        <div>
          <p class="kicker">Ledger Entries</p>
          <h3>${records.length} Entry${records.length === 1 ? "" : "ies"} In View</h3>
        </div>
      </div>
      <div class="table-wrap compact-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Party</th>
              <th>Area</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Due / Ref</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${
              records.length === 0
                ? `
                    <tr>
                      <td colspan="7" class="empty-state">No ledger entries match the current view yet.</td>
                    </tr>
                  `
                : records
                    .map((record) => `
                      <tr>
                        <td>${escapeHtml(formatDisplayDate(record.entryDate))}</td>
                        <td>
                          <span class="table-primary">${escapeHtml(record.partyName)}</span>
                          <span class="table-secondary">${escapeHtml(record.partyPhone || record.suite || "No phone or suite saved")}</span>
                        </td>
                        <td><span class="tag tag-area">${escapeHtml(
                          getBusinessArea(record.businessAreaId).shortLabel
                        )}</span></td>
                        <td>${escapeHtml(getLedgerEntryType(record.entryType).label)}</td>
                        <td class="${getLedgerEntryEffect(record) > 0 ? "negative-text" : ""}">
                          ${formatSignedCurrency(getLedgerEntryEffect(record))}
                        </td>
                        <td>
                          <span class="table-primary">${escapeHtml(formatOptionalDate(record.dueDate))}</span>
                          <span class="table-secondary">${escapeHtml(record.reference || "No reference")}</span>
                        </td>
                        <td>
                          <div class="row-actions">
                            <button class="edit-btn" data-ledger-action="edit" data-id="${escapeHtml(
                              record.id
                            )}" type="button">
                              Edit
                            </button>
                            <button class="delete-btn" data-ledger-action="delete" data-id="${escapeHtml(
                              record.id
                            )}" type="button">
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    `)
                    .join("")
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function handleLedgerSubmit(event) {
  event.preventDefault();

  const draft = buildLedgerDraftFromForm(new FormData(event.target));
  const errors = validateLedgerEntry(draft);

  if (errors.length > 0) {
    showToast(errors[0]);
    return;
  }

  if (state.editingLedgerId) {
    state.ledgerEntries = sortLedgerEntries(
      state.ledgerEntries.map((record) =>
        record.id === state.editingLedgerId
          ? { ...record, ...draft, updatedAt: new Date().toISOString() }
          : record
      )
    );
    showToast("Ledger entry updated.");
  } else {
    state.ledgerEntries = sortLedgerEntries([
      ...state.ledgerEntries,
      {
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...draft
      }
    ]);
    showToast("Ledger entry saved.");
  }

  persistLedgerEntries();
  resetLedgerForm({ silent: true });
  render();
}

function startEditingLedgerEntry(recordId) {
  const record = state.ledgerEntries.find((item) => item.id === recordId);

  if (!record) {
    showToast("That ledger entry could not be found.");
    return;
  }

  state.editingLedgerId = record.id;
  navigateTo("ledgers", { syncHash: true });
  render();
  scrollDynamicFormIntoView("ledgerForm");
}

function deleteLedgerEntry(recordId) {
  const record = state.ledgerEntries.find((item) => item.id === recordId);

  if (!record) {
    showToast("That ledger entry could not be found.");
    return;
  }

  const shouldDelete = window.confirm(
    `Delete the ledger entry for ${record.partyName} on ${formatDisplayDate(record.entryDate)}?`
  );

  if (!shouldDelete) {
    return;
  }

  state.ledgerEntries = state.ledgerEntries.filter((item) => item.id !== recordId);
  persistLedgerEntries();

  if (state.editingLedgerId === recordId) {
    resetLedgerForm({ silent: true });
  }

  render();
  showToast("Ledger entry deleted.");
}

function resetLedgerForm(options = {}) {
  state.editingLedgerId = null;

  if (!options.silent) {
    render();
    showToast("Ledger form cleared.");
  }
}

function createEmptyMobileMoneyDraft() {
  return {
    date: getTodayInputValue(),
    provider: "MTN Mobile Money",
    openingCash: 0,
    cashTopUp: 0,
    cashRemoved: 0,
    cashInValue: 0,
    cashOutValue: 0,
    serviceFees: 0,
    operatingExpense: 0,
    closingCashCounted: 0,
    notes: ""
  };
}

function buildMobileMoneyDraftFromForm(formData) {
  return {
    date: normalizeDateInput(formData.get("mobileMoneyDate")),
    provider: normalizeText(formData.get("mobileMoneyProvider")),
    openingCash: parseOptionalAmount(formData.get("mobileMoneyOpeningCash")),
    cashTopUp: parseOptionalAmount(formData.get("mobileMoneyCashTopUp")),
    cashRemoved: parseOptionalAmount(formData.get("mobileMoneyCashRemoved")),
    cashInValue: parseOptionalAmount(formData.get("mobileMoneyCashInValue")),
    cashOutValue: parseOptionalAmount(formData.get("mobileMoneyCashOutValue")),
    serviceFees: parseOptionalAmount(formData.get("mobileMoneyServiceFees")),
    operatingExpense: parseOptionalAmount(formData.get("mobileMoneyOperatingExpense")),
    closingCashCounted: parseOptionalAmount(formData.get("mobileMoneyClosingCashCounted")),
    notes: normalizeText(formData.get("mobileMoneyNotes"))
  };
}

function validateMobileMoneyRecord(record) {
  const errors = [];

  if (!record.date) {
    errors.push("Add the mobile money reconciliation date.");
  }

  if (!record.provider) {
    errors.push("Choose the mobile money provider.");
  }

  if (
    [
      record.openingCash,
      record.cashTopUp,
      record.cashRemoved,
      record.cashInValue,
      record.cashOutValue,
      record.serviceFees,
      record.operatingExpense,
      record.closingCashCounted
    ].some((value) => value < 0)
  ) {
    errors.push("Mobile money amounts cannot be negative.");
  }

  return errors;
}

function getExpectedMobileMoneyClosing(record) {
  return Number(
    (
      parseOptionalAmount(record.openingCash) +
      parseOptionalAmount(record.cashTopUp) +
      parseOptionalAmount(record.cashInValue) +
      parseOptionalAmount(record.serviceFees) -
      parseOptionalAmount(record.cashOutValue) -
      parseOptionalAmount(record.cashRemoved) -
      parseOptionalAmount(record.operatingExpense)
    ).toFixed(2)
  );
}

function getMobileMoneyVariance(record) {
  return Number(
    (parseOptionalAmount(record.closingCashCounted) - getExpectedMobileMoneyClosing(record)).toFixed(2)
  );
}

function getMobileMoneyVarianceKey(record) {
  const variance = getMobileMoneyVariance(record);

  if (Math.abs(variance) < 0.01) {
    return "balanced";
  }

  return variance > 0 ? "over" : "short";
}

function getMobileMoneyVarianceConfig(record) {
  const key = getMobileMoneyVarianceKey(record);

  if (key === "balanced") {
    return { label: "Balanced", pillClass: "alert-pill-on-track" };
  }

  if (key === "over") {
    return { label: "Over Counted", pillClass: "alert-pill-due" };
  }

  return { label: "Short", pillClass: "alert-pill-overdue" };
}

function getFilteredMobileMoneyRecords() {
  const monthValue = normalizeMonthInput(state.mobileMoneyFilters.month);
  const providerValue = normalizeText(state.mobileMoneyFilters.provider).toLowerCase();
  const varianceValue = normalizeText(state.mobileMoneyFilters.variance).toLowerCase();

  return state.mobileMoneyReconciliations.filter((record) => {
    return (
      (monthValue === "" || record.date.startsWith(monthValue)) &&
      (providerValue === "" || normalizeText(record.provider).toLowerCase() === providerValue) &&
      (varianceValue === "" || getMobileMoneyVarianceKey(record) === varianceValue)
    );
  });
}

function renderMobileMoneyPage() {
  if (!elements.mobileMoneyViewRoot) {
    return;
  }

  const editingRecord =
    state.mobileMoneyReconciliations.find((item) => item.id === state.editingMobileMoneyId) || null;
  const draft = editingRecord || createEmptyMobileMoneyDraft();
  const records = getFilteredMobileMoneyRecords();
  const totalFees = records.reduce((sum, record) => sum + record.serviceFees, 0);
  const netFees = records.reduce(
    (sum, record) => sum + record.serviceFees - record.operatingExpense,
    0
  );
  const varianceTotal = records.reduce((sum, record) => sum + Math.abs(getMobileMoneyVariance(record)), 0);
  const balancedCount = records.filter((record) => getMobileMoneyVarianceKey(record) === "balanced").length;

  elements.mobileMoneyViewRoot.innerHTML = `
    <section class="page-grid compact-page-grid">
      <section class="section-card">
        <div class="section-heading">
          <div>
            <p class="kicker">Daily Reconciliation</p>
            <h3>${editingRecord ? "Edit Mobile Money Recon" : "Reconcile Daily Float & Cash Movement"}</h3>
          </div>
          <p class="muted-text">
            Use this to check float movement for the mobile money desk and spot shortages or overages before they carry into the next day.
          </p>
        </div>

        <form id="mobileMoneyForm" novalidate>
          <div class="mini-form-grid rental-form-grid">
            <label>
              <span>Date</span>
              <input id="mobileMoneyDate" name="mobileMoneyDate" type="date" value="${escapeHtml(
                draft.date
              )}" required />
            </label>

            <label>
              <span>Provider</span>
              <select id="mobileMoneyProvider" name="mobileMoneyProvider" required>
                ${buildSelectMarkup(
                  MOBILE_MONEY_PROVIDER_OPTIONS,
                  draft.provider,
                  "Choose provider"
                )}
              </select>
            </label>

            <label>
              <span>Opening Cash Float</span>
              <input
                id="mobileMoneyOpeningCash"
                name="mobileMoneyOpeningCash"
                type="number"
                min="0"
                step="0.01"
                value="${escapeHtml(formatAmountInputValue(draft.openingCash))}"
                placeholder="0.00"
                required
              />
            </label>

            <label>
              <span>Cash Top-Up Added</span>
              <input
                id="mobileMoneyCashTopUp"
                name="mobileMoneyCashTopUp"
                type="number"
                min="0"
                step="0.01"
                value="${escapeHtml(formatAmountInputValue(draft.cashTopUp))}"
                placeholder="0.00"
              />
            </label>

            <label>
              <span>Cash Removed</span>
              <input
                id="mobileMoneyCashRemoved"
                name="mobileMoneyCashRemoved"
                type="number"
                min="0"
                step="0.01"
                value="${escapeHtml(formatAmountInputValue(draft.cashRemoved))}"
                placeholder="0.00"
              />
            </label>

            <label>
              <span>Total Cash-In Value</span>
              <input
                id="mobileMoneyCashInValue"
                name="mobileMoneyCashInValue"
                type="number"
                min="0"
                step="0.01"
                value="${escapeHtml(formatAmountInputValue(draft.cashInValue))}"
                placeholder="0.00"
              />
            </label>

            <label>
              <span>Total Cash-Out Value</span>
              <input
                id="mobileMoneyCashOutValue"
                name="mobileMoneyCashOutValue"
                type="number"
                min="0"
                step="0.01"
                value="${escapeHtml(formatAmountInputValue(draft.cashOutValue))}"
                placeholder="0.00"
              />
            </label>

            <label>
              <span>Fees / Commission Earned</span>
              <input
                id="mobileMoneyServiceFees"
                name="mobileMoneyServiceFees"
                type="number"
                min="0"
                step="0.01"
                value="${escapeHtml(formatAmountInputValue(draft.serviceFees))}"
                placeholder="0.00"
              />
            </label>

            <label>
              <span>Desk Expenses</span>
              <input
                id="mobileMoneyOperatingExpense"
                name="mobileMoneyOperatingExpense"
                type="number"
                min="0"
                step="0.01"
                value="${escapeHtml(formatAmountInputValue(draft.operatingExpense))}"
                placeholder="0.00"
              />
            </label>

            <label>
              <span>Closing Cash Counted</span>
              <input
                id="mobileMoneyClosingCashCounted"
                name="mobileMoneyClosingCashCounted"
                type="number"
                min="0"
                step="0.01"
                value="${escapeHtml(formatAmountInputValue(draft.closingCashCounted))}"
                placeholder="0.00"
              />
            </label>

            <label class="wide-field">
              <span>Notes</span>
              <textarea
                id="mobileMoneyNotes"
                name="mobileMoneyNotes"
                rows="3"
                placeholder="Variance explanation, float issue, or support note"
              >${escapeHtml(draft.notes)}</textarea>
            </label>
          </div>

          <div class="form-actions">
            <button id="submitMobileMoneyBtn" class="button button-primary" type="submit">
              ${editingRecord ? "Update Reconciliation" : "Save Reconciliation"}
            </button>
            <button id="resetMobileMoneyBtn" class="button button-secondary" type="button">
              Clear Form
            </button>
            <button
              id="cancelMobileMoneyEditBtn"
              class="button button-ghost ${editingRecord ? "" : "hidden"}"
              type="button"
            >
              Cancel Edit
            </button>
          </div>
        </form>
      </section>

      <aside class="sidebar-column">
        <section class="section-card">
          <div class="section-heading compact">
            <div>
              <p class="kicker">Reconciliation Snapshot</p>
              <h3>Float Control</h3>
            </div>
          </div>
          <div class="mini-stat-grid">
            <article class="stat-card">
              <span>Fees Captured</span>
              <strong>${formatCurrency(totalFees)}</strong>
            </article>
            <article class="stat-card">
              <span>Net Desk Return</span>
              <strong>${formatCurrency(netFees)}</strong>
            </article>
            <article class="stat-card">
              <span>Absolute Variance</span>
              <strong class="${varianceTotal > 0 ? "negative-text" : ""}">${formatCurrency(
                varianceTotal
              )}</strong>
            </article>
            <article class="stat-card">
              <span>Balanced Days</span>
              <strong>${escapeHtml(String(balancedCount))}</strong>
            </article>
          </div>
        </section>

        <section class="section-card">
          <div class="section-heading compact">
            <div>
              <p class="kicker">Filters</p>
              <h3>Refine Recon View</h3>
            </div>
          </div>
          <div class="form-actions">
            <button class="button button-secondary" data-global-action="export-view-csv" type="button">
              Export Recon CSV
            </button>
          </div>
          <div class="filter-grid">
            <label>
              <span>Month</span>
              <input id="mobileMoneyMonthFilter" type="month" value="${escapeHtml(
                state.mobileMoneyFilters.month
              )}" />
            </label>
            <label>
              <span>Provider</span>
              <select id="mobileMoneyProviderFilter">
                ${buildSelectMarkup(
                  MOBILE_MONEY_PROVIDER_OPTIONS,
                  state.mobileMoneyFilters.provider,
                  "All Providers"
                )}
              </select>
            </label>
            <label>
              <span>Variance</span>
              <select id="mobileMoneyVarianceFilter">
                ${buildSelectMarkup(
                  [
                    { value: "balanced", label: "Balanced" },
                    { value: "over", label: "Over Counted" },
                    { value: "short", label: "Short" }
                  ],
                  state.mobileMoneyFilters.variance,
                  "Any Variance"
                )}
              </select>
            </label>
          </div>
        </section>
      </aside>
    </section>

    <section class="section-card">
      <div class="section-heading compact">
        <div>
          <p class="kicker">Mobile Money Reconciliations</p>
          <h3>${records.length} Record${records.length === 1 ? "" : "s"} In View</h3>
        </div>
      </div>
      <div class="table-wrap compact-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Provider</th>
              <th>Opening & Movement</th>
              <th>Fees & Expense</th>
              <th>Expected / Counted</th>
              <th>Variance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${
              records.length === 0
                ? `
                    <tr>
                      <td colspan="7" class="empty-state">No mobile money reconciliation records match the current view yet.</td>
                    </tr>
                  `
                : records
                    .map((record) => {
                      const variance = getMobileMoneyVariance(record);
                      const status = getMobileMoneyVarianceConfig(record);
                      return `
                        <tr>
                          <td>${escapeHtml(formatDisplayDate(record.date))}</td>
                          <td>
                            <span class="table-primary">${escapeHtml(record.provider)}</span>
                            <span class="table-secondary">${escapeHtml(record.notes || "No note saved")}</span>
                          </td>
                          <td>
                            <span class="table-primary">Opening ${formatCurrency(record.openingCash)}</span>
                            <span class="table-secondary">Cash-In ${formatCurrency(record.cashInValue)} • Cash-Out ${formatCurrency(record.cashOutValue)}</span>
                            <span class="table-secondary">Top-Up ${formatCurrency(record.cashTopUp)} • Removed ${formatCurrency(record.cashRemoved)}</span>
                          </td>
                          <td>
                            <span class="table-primary">Fees ${formatCurrency(record.serviceFees)}</span>
                            <span class="table-secondary">Desk expense ${formatCurrency(record.operatingExpense)}</span>
                          </td>
                          <td>
                            <span class="table-primary">Expected ${formatCurrency(
                              getExpectedMobileMoneyClosing(record)
                            )}</span>
                            <span class="table-secondary">Counted ${formatCurrency(record.closingCashCounted)}</span>
                          </td>
                          <td>
                            <span class="alert-pill ${escapeHtml(status.pillClass)}">${escapeHtml(
                              status.label
                            )}</span>
                            <span class="table-secondary ${variance !== 0 ? "negative-text" : ""}">
                              ${formatSignedCurrency(variance)}
                            </span>
                          </td>
                          <td>
                            <div class="row-actions">
                              <button class="edit-btn" data-mobile-money-action="edit" data-id="${escapeHtml(
                                record.id
                              )}" type="button">
                                Edit
                              </button>
                              <button class="delete-btn" data-mobile-money-action="delete" data-id="${escapeHtml(
                                record.id
                              )}" type="button">
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      `;
                    })
                    .join("")
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function handleMobileMoneySubmit(event) {
  event.preventDefault();

  const draft = buildMobileMoneyDraftFromForm(new FormData(event.target));
  const errors = validateMobileMoneyRecord(draft);

  if (errors.length > 0) {
    showToast(errors[0]);
    return;
  }

  if (state.editingMobileMoneyId) {
    state.mobileMoneyReconciliations = sortMobileMoneyReconciliations(
      state.mobileMoneyReconciliations.map((record) =>
        record.id === state.editingMobileMoneyId
          ? { ...record, ...draft, updatedAt: new Date().toISOString() }
          : record
      )
    );
    showToast("Mobile money reconciliation updated.");
  } else {
    state.mobileMoneyReconciliations = sortMobileMoneyReconciliations([
      ...state.mobileMoneyReconciliations,
      {
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...draft
      }
    ]);
    showToast("Mobile money reconciliation saved.");
  }

  persistMobileMoneyReconciliations();
  resetMobileMoneyForm({ silent: true });
  render();
}

function startEditingMobileMoneyRecord(recordId) {
  const record = state.mobileMoneyReconciliations.find((item) => item.id === recordId);

  if (!record) {
    showToast("That mobile money reconciliation could not be found.");
    return;
  }

  state.editingMobileMoneyId = record.id;
  navigateTo("mobile-money", { syncHash: true });
  render();
  scrollDynamicFormIntoView("mobileMoneyForm");
}

function deleteMobileMoneyRecord(recordId) {
  const record = state.mobileMoneyReconciliations.find((item) => item.id === recordId);

  if (!record) {
    showToast("That mobile money reconciliation could not be found.");
    return;
  }

  const shouldDelete = window.confirm(
    `Delete the mobile money reconciliation for ${record.provider} on ${formatDisplayDate(record.date)}?`
  );

  if (!shouldDelete) {
    return;
  }

  state.mobileMoneyReconciliations = state.mobileMoneyReconciliations.filter(
    (item) => item.id !== recordId
  );
  persistMobileMoneyReconciliations();

  if (state.editingMobileMoneyId === recordId) {
    resetMobileMoneyForm({ silent: true });
  }

  render();
  showToast("Mobile money reconciliation deleted.");
}

function resetMobileMoneyForm(options = {}) {
  state.editingMobileMoneyId = null;

  if (!options.silent) {
    render();
    showToast("Mobile money form cleared.");
  }
}

function createEmptyCashbookDraft() {
  return {
    entryDate: getTodayInputValue(),
    accountType: "cashbook",
    accountName: "Main Cash Box",
    businessAreaId: DEFAULT_BUSINESS_AREA_ID,
    entryType: "money-in",
    amount: 0,
    counterparty: "",
    reference: "",
    notes: "",
    autoPairTransfer: true,
    linkedAccountType: "bankbook",
    linkedAccountName: ""
  };
}

function buildCashbookDraftFromForm(formData) {
  return {
    entryDate: normalizeDateInput(formData.get("cashbookEntryDate")),
    accountType: normalizeCashbookAccountType(formData.get("cashbookAccountType")),
    accountName: normalizeText(formData.get("cashbookAccountName")),
    businessAreaId: normalizeBusinessAreaId(formData.get("cashbookBusinessArea")),
    entryType: normalizeCashbookEntryType(formData.get("cashbookEntryType")),
    amount: parseOptionalAmount(formData.get("cashbookAmount")),
    counterparty: normalizeText(formData.get("cashbookCounterparty")),
    reference: normalizeText(formData.get("cashbookReference")),
    notes: normalizeText(formData.get("cashbookNotes")),
    autoPairTransfer: formData.get("cashbookAutoPairTransfer") === "on",
    linkedAccountType: normalizeCashbookAccountType(formData.get("cashbookLinkedAccountType")),
    linkedAccountName: normalizeText(formData.get("cashbookLinkedAccountName"))
  };
}

function validateCashbookEntry(record) {
  const errors = [];

  if (!record.entryDate) {
    errors.push("Add a valid cashbook or bankbook date.");
  }

  if (!record.accountType) {
    errors.push("Choose whether this entry belongs to the cashbook or bankbook.");
  }

  if (!record.accountName) {
    errors.push("Add the account name, such as Main Cash Box or the bank account name.");
  }

  if (!record.businessAreaId) {
    errors.push("Choose the business area connected to this cash or bank movement.");
  }

  if (!record.entryType) {
    errors.push("Choose the movement type for this cashbook entry.");
  }

  if (!Number.isFinite(record.amount) || record.amount <= 0) {
    errors.push("Enter an amount greater than zero.");
  }

  if (isCashbookTransferEntry(record.entryType) && record.autoPairTransfer) {
    if (!record.linkedAccountType) {
      errors.push("Choose the other account type for this transfer.");
    }

    if (!record.linkedAccountName) {
      errors.push("Add the other account name for this transfer.");
    }

    if (
      record.linkedAccountType &&
      record.linkedAccountName &&
      record.linkedAccountType === record.accountType &&
      normalizeText(record.linkedAccountName).toLowerCase() ===
        normalizeText(record.accountName).toLowerCase()
    ) {
      errors.push("The paired transfer account must be different from the main account.");
    }
  }

  return errors;
}

function getCashbookEntryType(entryType) {
  return (
    CASHBOOK_ENTRY_TYPE_MAP.get(entryType) || {
      value: "",
      label: "Unknown",
      effect: 0
    }
  );
}

function getCashbookAccountTypeLabel(accountType) {
  return (
    CASHBOOK_ACCOUNT_TYPE_OPTIONS.find((option) => option.value === normalizeCashbookAccountType(accountType))
      ?.label || "Unknown"
  );
}

function getCashbookEntryEffect(record) {
  return Number((getCashbookEntryType(record.entryType).effect * parseOptionalAmount(record.amount)).toFixed(2));
}

function isCashbookTransferEntry(value) {
  const entryType =
    typeof value === "string"
      ? normalizeCashbookEntryType(value)
      : normalizeCashbookEntryType(value?.entryType);

  return entryType === "transfer-in" || entryType === "transfer-out";
}

function getOppositeCashbookEntryType(entryType) {
  const normalized = normalizeCashbookEntryType(entryType);

  if (normalized === "transfer-in") {
    return "transfer-out";
  }

  if (normalized === "transfer-out") {
    return "transfer-in";
  }

  return normalized;
}

function buildCashbookTransferReference(entryDate) {
  const normalizedDate = normalizeDateInput(entryDate) || getTodayInputValue();
  return `TRF-${normalizedDate.replaceAll("-", "")}-${generateId().slice(0, 4).toUpperCase()}`;
}

function getFilteredCashbookEntries() {
  const searchValue = normalizeText(state.cashbookFilters.search).toLowerCase();
  const monthValue = normalizeMonthInput(state.cashbookFilters.month);
  const areaValue = normalizeBusinessAreaId(state.cashbookFilters.area);
  const accountTypeValue = normalizeCashbookAccountType(state.cashbookFilters.accountType);

  return state.cashbookEntries.filter((record) => {
    const haystack = [
      getCashbookAccountTypeLabel(record.accountType),
      record.accountName,
      record.linkedAccountName,
      record.counterparty,
      record.reference,
      record.notes,
      getBusinessArea(record.businessAreaId).label,
      getCashbookEntryType(record.entryType).label
    ]
      .join(" ")
      .toLowerCase();

    return (
      (searchValue === "" || haystack.includes(searchValue)) &&
      (monthValue === "" || record.entryDate.startsWith(monthValue)) &&
      (areaValue === "" || record.businessAreaId === areaValue) &&
      (accountTypeValue === "" || record.accountType === accountTypeValue)
    );
  });
}

function buildCashbookAccountSummaries(records) {
  const summaryMap = new Map();

  records.forEach((record) => {
    const key = [
      normalizeCashbookAccountType(record.accountType),
      normalizeText(record.accountName).toLowerCase()
    ].join("|");
    const effect = getCashbookEntryEffect(record);
    const area = getBusinessArea(record.businessAreaId);
    const existing =
      summaryMap.get(key) ||
      {
        accountType: record.accountType,
        accountName: record.accountName,
        inflow: 0,
        outflow: 0,
        balance: 0,
        entryCount: 0,
        lastDate: "",
        areaLabels: new Set()
      };

    if (effect >= 0) {
      existing.inflow += effect;
    } else {
      existing.outflow += Math.abs(effect);
    }

    existing.balance += effect;
    existing.entryCount += 1;
    existing.lastDate =
      !existing.lastDate || record.entryDate > existing.lastDate ? record.entryDate : existing.lastDate;
    existing.areaLabels.add(area.shortLabel);
    summaryMap.set(key, existing);
  });

  return Array.from(summaryMap.values())
    .map((item) => ({
      ...item,
      inflow: Number(item.inflow.toFixed(2)),
      outflow: Number(item.outflow.toFixed(2)),
      balance: Number(item.balance.toFixed(2)),
      areaLabels: Array.from(item.areaLabels).sort((left, right) => left.localeCompare(right))
    }))
    .sort((left, right) => {
      const typeDifference = getCashbookAccountTypeLabel(left.accountType).localeCompare(
        getCashbookAccountTypeLabel(right.accountType)
      );

      if (typeDifference !== 0) {
        return typeDifference;
      }

      return normalizeText(left.accountName).localeCompare(normalizeText(right.accountName));
    });
}

function getCashbookTransferStatusConfig(statusKey) {
  if (statusKey === "matched") {
    return { label: "Matched", pillClass: "alert-pill-on-track" };
  }

  if (statusKey === "difference") {
    return { label: "Difference", pillClass: "alert-pill-overdue" };
  }

  return { label: "Missing Side", pillClass: "alert-pill-due" };
}

function buildCashbookTransferRows(records = state.cashbookEntries) {
  const groupMap = new Map();

  records
    .filter((record) => isCashbookTransferEntry(record))
    .forEach((record) => {
      const key =
        normalizeText(record.transferGroupId) ||
        [
          normalizeDateInput(record.entryDate),
          Number(record.amount || 0).toFixed(2),
          normalizeText(record.reference).toLowerCase(),
          normalizeText(record.counterparty).toLowerCase()
        ].join("|");
      const existing =
        groupMap.get(key) ||
        {
          key,
          date: record.entryDate,
          reference: normalizeText(record.reference),
          entries: [],
          businessAreas: new Set()
        };

      existing.entries.push(record);
      existing.businessAreas.add(getBusinessArea(record.businessAreaId).shortLabel);
      existing.date = !existing.date || record.entryDate > existing.date ? record.entryDate : existing.date;

      if (!existing.reference && record.reference) {
        existing.reference = normalizeText(record.reference);
      }

      groupMap.set(key, existing);
    });

  return Array.from(groupMap.values())
    .map((group) => {
      const outEntries = group.entries.filter(
        (record) => normalizeCashbookEntryType(record.entryType) === "transfer-out"
      );
      const inEntries = group.entries.filter(
        (record) => normalizeCashbookEntryType(record.entryType) === "transfer-in"
      );
      const outTotal = outEntries.reduce((sum, record) => sum + parseOptionalAmount(record.amount), 0);
      const inTotal = inEntries.reduce((sum, record) => sum + parseOptionalAmount(record.amount), 0);
      const variance = Number((inTotal - outTotal).toFixed(2));
      const statusKey =
        outEntries.length === 0 || inEntries.length === 0
          ? "missing-side"
          : Math.abs(variance) < 0.01
            ? "matched"
            : "difference";

      return {
        key: group.key,
        date: group.date,
        reference: group.reference,
        outSummary: outEntries.length
          ? outEntries.map((record) => record.accountName).join(" • ")
          : "No transfer-out saved",
        inSummary: inEntries.length
          ? inEntries.map((record) => record.accountName).join(" • ")
          : "No transfer-in saved",
        businessAreaSummary: Array.from(group.businessAreas)
          .sort((left, right) => left.localeCompare(right))
          .join(" • "),
        outTotal: Number(outTotal.toFixed(2)),
        inTotal: Number(inTotal.toFixed(2)),
        variance,
        entryCount: group.entries.length,
        statusKey
      };
    })
    .sort((left, right) => {
      const dateDifference = (right.date || "").localeCompare(left.date || "");

      if (dateDifference !== 0) {
        return dateDifference;
      }

      return normalizeText(left.reference).localeCompare(normalizeText(right.reference));
    });
}

function buildTreasuryAccountRows(records) {
  const summaryMap = new Map();

  records.forEach((record) => {
    const key = [
      normalizeCashbookAccountType(record.accountType),
      normalizeText(record.accountName).toLowerCase()
    ].join("|");
    const effect = getCashbookEntryEffect(record);
    const isTransfer = isCashbookTransferEntry(record);
    const existing =
      summaryMap.get(key) ||
      {
        accountType: record.accountType,
        accountName: record.accountName,
        businessAreas: new Set(),
        balance: 0,
        inflow: 0,
        outflow: 0,
        externalInflow: 0,
        externalOutflow: 0,
        transferIn: 0,
        transferOut: 0,
        lastDate: "",
        entryCount: 0
      };

    if (effect >= 0) {
      existing.inflow += effect;
    } else {
      existing.outflow += Math.abs(effect);
    }

    if (isTransfer) {
      if (normalizeCashbookEntryType(record.entryType) === "transfer-in") {
        existing.transferIn += parseOptionalAmount(record.amount);
      } else {
        existing.transferOut += parseOptionalAmount(record.amount);
      }
    } else if (effect >= 0) {
      existing.externalInflow += effect;
    } else {
      existing.externalOutflow += Math.abs(effect);
    }

    existing.balance += effect;
    existing.entryCount += 1;
    existing.lastDate =
      !existing.lastDate || record.entryDate > existing.lastDate ? record.entryDate : existing.lastDate;
    existing.businessAreas.add(getBusinessArea(record.businessAreaId).shortLabel);
    summaryMap.set(key, existing);
  });

  return Array.from(summaryMap.values())
    .map((row) => ({
      ...row,
      balance: Number(row.balance.toFixed(2)),
      inflow: Number(row.inflow.toFixed(2)),
      outflow: Number(row.outflow.toFixed(2)),
      externalInflow: Number(row.externalInflow.toFixed(2)),
      externalOutflow: Number(row.externalOutflow.toFixed(2)),
      transferIn: Number(row.transferIn.toFixed(2)),
      transferOut: Number(row.transferOut.toFixed(2)),
      businessAreaSummary: Array.from(row.businessAreas)
        .sort((left, right) => left.localeCompare(right))
        .join(" • ")
    }))
    .sort((left, right) => {
      const typeDifference = getCashbookAccountTypeLabel(left.accountType).localeCompare(
        getCashbookAccountTypeLabel(right.accountType)
      );

      if (typeDifference !== 0) {
        return typeDifference;
      }

      return normalizeText(left.accountName).localeCompare(normalizeText(right.accountName));
    });
}

function getLatestMobileMoneyFloatRows(records = state.mobileMoneyReconciliations) {
  const latestByProvider = new Map();

  records.forEach((record) => {
    const key = normalizeText(record.provider).toLowerCase();
    const existing = latestByProvider.get(key);

    if (
      !existing ||
      record.date > existing.date ||
      (record.date === existing.date && (record.updatedAt || "") > (existing.updatedAt || ""))
    ) {
      latestByProvider.set(key, record);
    }
  });

  return Array.from(latestByProvider.values()).sort((left, right) =>
    normalizeText(left.provider).localeCompare(normalizeText(right.provider))
  );
}

function buildTreasurySnapshot(options = {}) {
  const areaFilter = normalizeBusinessAreaId(options.area ?? state.treasuryFilters.area);
  const transferState = normalizeText(options.transferState ?? state.treasuryFilters.transferState).toLowerCase();
  const matchesArea = (businessAreaId) =>
    areaFilter === "" || normalizeBusinessAreaId(businessAreaId) === areaFilter;
  const cashbookRecords = state.cashbookEntries.filter((record) => matchesArea(record.businessAreaId));
  const accountRows = buildTreasuryAccountRows(cashbookRecords);
  const transferRows = buildCashbookTransferRows(cashbookRecords);
  const visibleTransferRows = transferRows.filter(
    (row) => transferState === "" || row.statusKey === transferState
  );
  const mobileMoneyRows =
    areaFilter === "" || areaFilter === "mobile-money" ? getLatestMobileMoneyFloatRows() : [];
  const cashBalance = accountRows
    .filter((row) => row.accountType === "cashbook")
    .reduce((sum, row) => sum + row.balance, 0);
  const bankBalance = accountRows
    .filter((row) => row.accountType === "bankbook")
    .reduce((sum, row) => sum + row.balance, 0);
  const mobileMoneyFloat = mobileMoneyRows.reduce((sum, row) => sum + row.closingCashCounted, 0);
  const mobileMoneyExpected = mobileMoneyRows.reduce(
    (sum, row) => sum + getExpectedMobileMoneyClosing(row),
    0
  );
  const mobileMoneyVariance = mobileMoneyRows.reduce(
    (sum, row) => sum + Math.abs(getMobileMoneyVariance(row)),
    0
  );
  const externalInflows = accountRows.reduce((sum, row) => sum + row.externalInflow, 0);
  const externalOutflows = accountRows.reduce((sum, row) => sum + row.externalOutflow, 0);
  const expenseSpend = state.expenses
    .filter((record) => matchesArea(record.businessAreaId))
    .reduce((sum, record) => sum + record.amount, 0);
  const salarySpend = state.salaryRecords
    .filter((record) => matchesArea(record.businessAreaId))
    .reduce((sum, record) => sum + record.amountPaid, 0);
  const pettySpend = state.pettyCash
    .filter(
      (record) =>
        matchesArea(record.businessAreaId) && getPettyCashType(record.transactionTypeId).isExpense
    )
    .reduce((sum, record) => sum + record.amount, 0);
  const capturedSpend = expenseSpend + salarySpend + pettySpend;
  const salaryOutstanding = state.salaryRecords
    .filter((record) => matchesArea(record.businessAreaId))
    .reduce((sum, record) => sum + getSalaryBalance(record), 0);
  const supplierOutstanding = state.suppliers
    .filter((record) => matchesArea(record.businessAreaId))
    .reduce((sum, record) => sum + getSupplierOutstanding(record), 0);
  const procurementOutstanding = state.purchaseOrders
    .filter((record) => matchesArea(record.businessAreaId))
    .reduce((sum, record) => sum + getPurchaseOrderOutstanding(record), 0);
  const openCommitments = salaryOutstanding + supplierOutstanding + procurementOutstanding;
  const liquidFunds = cashBalance + bankBalance + mobileMoneyFloat;
  const availableAfterCommitments = liquidFunds - openCommitments;
  const unmatchedTransfers = transferRows.filter((row) => row.statusKey !== "matched");

  return {
    areaFilter,
    transferState,
    accountRows,
    cashbookRecords,
    transferRows,
    visibleTransferRows,
    mobileMoneyRows,
    cashBalance: Number(cashBalance.toFixed(2)),
    bankBalance: Number(bankBalance.toFixed(2)),
    mobileMoneyFloat: Number(mobileMoneyFloat.toFixed(2)),
    mobileMoneyExpected: Number(mobileMoneyExpected.toFixed(2)),
    mobileMoneyVariance: Number(mobileMoneyVariance.toFixed(2)),
    externalInflows: Number(externalInflows.toFixed(2)),
    externalOutflows: Number(externalOutflows.toFixed(2)),
    expenseSpend: Number(expenseSpend.toFixed(2)),
    salarySpend: Number(salarySpend.toFixed(2)),
    pettySpend: Number(pettySpend.toFixed(2)),
    capturedSpend: Number(capturedSpend.toFixed(2)),
    salaryOutstanding: Number(salaryOutstanding.toFixed(2)),
    supplierOutstanding: Number(supplierOutstanding.toFixed(2)),
    procurementOutstanding: Number(procurementOutstanding.toFixed(2)),
    openCommitments: Number(openCommitments.toFixed(2)),
    liquidFunds: Number(liquidFunds.toFixed(2)),
    availableAfterCommitments: Number(availableAfterCommitments.toFixed(2)),
    unmatchedTransfers
  };
}

function clearTreasuryFilters() {
  state.treasuryFilters = { area: "", transferState: "" };
  render();
  showToast("Treasury filters cleared.");
}

function renderCashbookPage() {
  if (!elements.cashbookViewRoot) {
    return;
  }

  const editingRecord = state.cashbookEntries.find((item) => item.id === state.editingCashbookId) || null;
  const draft = editingRecord || createEmptyCashbookDraft();
  const linkedTransferRecord =
    editingRecord && editingRecord.linkedEntryId
      ? state.cashbookEntries.find((item) => item.id === editingRecord.linkedEntryId) || null
      : null;
  const records = getFilteredCashbookEntries();
  const summaries = buildCashbookAccountSummaries(records);
  const transferRows = buildCashbookTransferRows(records);
  const totalIn = records.reduce((sum, record) => sum + Math.max(getCashbookEntryEffect(record), 0), 0);
  const totalOut = records.reduce((sum, record) => sum + Math.max(-getCashbookEntryEffect(record), 0), 0);
  const netMovement = Number((totalIn - totalOut).toFixed(2));
  const bankAccountCount = new Set(
    summaries
      .filter((item) => item.accountType === "bankbook")
      .map((item) => normalizeText(item.accountName).toLowerCase())
  ).size;
  const matchedTransferCount = transferRows.filter((row) => row.statusKey === "matched").length;
  const unmatchedTransferCount = transferRows.filter((row) => row.statusKey !== "matched").length;
  const transferAutoPair =
    Boolean(draft.autoPairTransfer) ||
    Boolean(draft.pairedTransfer) ||
    Boolean(linkedTransferRecord);
  const linkedAccountType =
    linkedTransferRecord?.accountType ||
    draft.linkedAccountType ||
    (draft.accountType === "cashbook" ? "bankbook" : "cashbook");
  const linkedAccountName = linkedTransferRecord?.accountName || draft.linkedAccountName || "";

  elements.cashbookViewRoot.innerHTML = `
    <section class="page-grid compact-page-grid">
      <section class="section-card">
        <div class="section-heading">
          <div>
            <p class="kicker">Cash & Bank Movement</p>
            <h3>${editingRecord ? "Edit Cashbook Entry" : "Capture Cashbook / Bankbook Activity"}</h3>
          </div>
          <p class="muted-text">
            Use one line per actual movement. For transfers between cash and bank, you can now save one side and let the app create the opposite transfer entry automatically.
          </p>
        </div>

        <form id="cashbookForm" novalidate>
          <div class="mini-form-grid rental-form-grid">
            <label>
              <span>Entry Date</span>
              <input
                id="cashbookEntryDate"
                name="cashbookEntryDate"
                type="date"
                value="${escapeHtml(draft.entryDate)}"
                required
              />
            </label>

            <label>
              <span>Account Type</span>
              <select id="cashbookAccountType" name="cashbookAccountType" required>
                ${buildSelectMarkup(CASHBOOK_ACCOUNT_TYPE_OPTIONS, draft.accountType, "Choose account type")}
              </select>
            </label>

            <label>
              <span>Account Name</span>
              <input
                id="cashbookAccountName"
                name="cashbookAccountName"
                type="text"
                value="${escapeHtml(draft.accountName)}"
                placeholder="Main Cash Box or bank account name"
                required
              />
            </label>

            <label>
              <span>Business Area</span>
              <select id="cashbookBusinessArea" name="cashbookBusinessArea" required>
                ${buildSelectMarkup(getBusinessAreaOptions(), draft.businessAreaId, "Choose business area")}
              </select>
            </label>

            <label>
              <span>Movement Type</span>
              <select id="cashbookEntryType" name="cashbookEntryType" required>
                ${buildSelectMarkup(CASHBOOK_ENTRY_TYPE_OPTIONS, draft.entryType, "Choose movement type")}
              </select>
            </label>

            <label>
              <span>Amount</span>
              <input
                id="cashbookAmount"
                name="cashbookAmount"
                type="number"
                min="0"
                step="0.01"
                value="${escapeHtml(formatAmountInputValue(draft.amount))}"
                placeholder="0.00"
                required
              />
            </label>

            <label>
              <span>Counterparty / Source</span>
              <input
                id="cashbookCounterparty"
                name="cashbookCounterparty"
                type="text"
                value="${escapeHtml(draft.counterparty)}"
                placeholder="Who paid, who received, or where the money moved from"
              />
            </label>

            <label>
              <span>Reference</span>
              <input
                id="cashbookReference"
                name="cashbookReference"
                type="text"
                value="${escapeHtml(draft.reference)}"
                placeholder="Deposit slip, teller, memo, or transfer ref"
              />
            </label>

            <label class="checkbox-field wide-field">
              <input
                id="cashbookAutoPairTransfer"
                name="cashbookAutoPairTransfer"
                type="checkbox"
                ${transferAutoPair ? "checked" : ""}
              />
              <span>Auto-pair the opposite side when this movement is a transfer</span>
            </label>

            <label>
              <span>Other Account Type</span>
              <select id="cashbookLinkedAccountType" name="cashbookLinkedAccountType">
                ${buildSelectMarkup(
                  CASHBOOK_ACCOUNT_TYPE_OPTIONS,
                  linkedAccountType,
                  "Choose other account type"
                )}
              </select>
            </label>

            <label>
              <span>Other Account Name</span>
              <input
                id="cashbookLinkedAccountName"
                name="cashbookLinkedAccountName"
                type="text"
                value="${escapeHtml(linkedAccountName)}"
                placeholder="Receiving or source account name"
              />
            </label>

            <label class="wide-field">
              <span>Notes</span>
              <textarea
                id="cashbookNotes"
                name="cashbookNotes"
                rows="3"
                placeholder="Why this movement happened or what it should reconcile to"
              >${escapeHtml(draft.notes)}</textarea>
            </label>
          </div>

          <div class="form-actions">
            <button id="submitCashbookBtn" class="button button-primary" type="submit">
              ${editingRecord ? "Update Cashbook Entry" : "Save Cashbook Entry"}
            </button>
            <button id="resetCashbookBtn" class="button button-secondary" type="button">
              Clear Form
            </button>
            <button
              id="cancelCashbookEditBtn"
              class="button button-ghost ${editingRecord ? "" : "hidden"}"
              type="button"
            >
              Cancel Edit
            </button>
          </div>
        </form>
      </section>

      <aside class="sidebar-column">
        <section class="section-card">
          <div class="section-heading compact">
            <div>
              <p class="kicker">Movement Snapshot</p>
              <h3>Current Filter View</h3>
            </div>
          </div>
          <div class="mini-stat-grid">
            <article class="stat-card">
              <span>Money In</span>
              <strong>${formatCurrency(totalIn)}</strong>
            </article>
            <article class="stat-card">
              <span>Money Out</span>
              <strong class="${totalOut > 0 ? "negative-text" : ""}">${formatCurrency(totalOut)}</strong>
            </article>
            <article class="stat-card">
              <span>Net Movement</span>
              <strong class="${netMovement < 0 ? "negative-text" : ""}">${formatSignedCurrency(
                netMovement
              )}</strong>
            </article>
            <article class="stat-card">
              <span>Bank Accounts</span>
              <strong>${escapeHtml(String(bankAccountCount))}</strong>
            </article>
          </div>
          <p class="muted-text">
            ${records.length} cash or bank entr${records.length === 1 ? "y" : "ies"} match this view across ${
              summaries.length
            } account${summaries.length === 1 ? "" : "s"}. Transfers matched: ${matchedTransferCount}. Transfers needing review: ${unmatchedTransferCount}.
          </p>
        </section>

        <section class="section-card">
          <div class="section-heading compact">
            <div>
              <p class="kicker">Export</p>
              <h3>Take This View To Excel</h3>
            </div>
          </div>
          <div class="action-grid">
            <button class="button button-primary" data-global-action="export-view-csv" type="button">
              Export Cashbook CSV
            </button>
          </div>
          <p class="muted-text">
            Use the full workbook export from the top bar for the rest of the workspace, and use this CSV when you want just the cashbook or bankbook entries.
          </p>
        </section>

        <section class="section-card">
          <div class="section-heading compact">
            <div>
              <p class="kicker">Filters</p>
              <h3>Refine Cash & Bank View</h3>
            </div>
          </div>
          <div class="filter-grid">
            <label>
              <span>Search</span>
              <input
                id="cashbookSearchFilter"
                type="search"
                value="${escapeHtml(state.cashbookFilters.search)}"
                placeholder="Account, ref, counterparty, note"
              />
            </label>

            <label>
              <span>Month</span>
              <input
                id="cashbookMonthFilter"
                type="month"
                value="${escapeHtml(state.cashbookFilters.month)}"
              />
            </label>

            <label>
              <span>Account Type</span>
              <select id="cashbookAccountTypeFilter">
                ${buildSelectMarkup(
                  CASHBOOK_ACCOUNT_TYPE_OPTIONS,
                  state.cashbookFilters.accountType,
                  "All Account Types"
                )}
              </select>
            </label>

            <label>
              <span>Business Area</span>
              <select id="cashbookAreaFilter">
                ${buildSelectMarkup(getBusinessAreaOptions(), state.cashbookFilters.area, "All Areas")}
              </select>
            </label>
          </div>
          <div class="form-actions">
            <button id="clearCashbookFiltersBtn" class="button button-ghost" type="button">
              Clear Filters
            </button>
          </div>
        </section>
      </aside>
    </section>

    <section class="section-card">
      <div class="section-heading compact">
        <div>
          <p class="kicker">Account Balances</p>
          <h3>${summaries.length} Account${summaries.length === 1 ? "" : "s"} In View</h3>
        </div>
      </div>
      <div class="table-wrap compact-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Account</th>
              <th>Areas Covered</th>
              <th>Money In</th>
              <th>Money Out</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            ${
              summaries.length === 0
                ? `
                    <tr>
                      <td colspan="5" class="empty-state">No cashbook or bankbook balances match the current view yet.</td>
                    </tr>
                  `
                : summaries
                    .map((summary) => `
                      <tr>
                        <td>
                          <span class="table-primary">${escapeHtml(summary.accountName)}</span>
                          <span class="table-secondary">${escapeHtml(
                            getCashbookAccountTypeLabel(summary.accountType)
                          )} • ${escapeHtml(
                            `${summary.entryCount} entr${summary.entryCount === 1 ? "y" : "ies"}`
                          )}</span>
                        </td>
                        <td>
                          <span class="table-primary">${escapeHtml(summary.areaLabels.join(" • "))}</span>
                          <span class="table-secondary">${escapeHtml(
                            summary.lastDate ? `Last entry ${formatDisplayDate(summary.lastDate)}` : "No date saved"
                          )}</span>
                        </td>
                        <td>${formatCurrency(summary.inflow)}</td>
                        <td class="${summary.outflow > 0 ? "negative-text" : ""}">${formatCurrency(
                          summary.outflow
                        )}</td>
                        <td class="${summary.balance < 0 ? "negative-text" : ""}">${formatSignedCurrency(
                          summary.balance
                        )}</td>
                      </tr>
                    `)
                    .join("")
            }
          </tbody>
        </table>
      </div>
    </section>

    <section class="section-card">
      <div class="section-heading compact">
        <div>
          <p class="kicker">Cashbook Entries</p>
          <h3>${records.length} Entry${records.length === 1 ? "" : "ies"} In View</h3>
        </div>
      </div>
      <div class="table-wrap compact-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Account</th>
              <th>Business Area</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Counterparty / Reference</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${
              records.length === 0
                ? `
                    <tr>
                      <td colspan="7" class="empty-state">No cashbook or bankbook entries match the current view yet.</td>
                    </tr>
                  `
                : records
                    .map((record) => `
                      <tr>
                        <td>${escapeHtml(formatDisplayDate(record.entryDate))}</td>
                        <td>
                          <span class="table-primary">${escapeHtml(record.accountName)}</span>
                          <span class="table-secondary">${escapeHtml(
                            getCashbookAccountTypeLabel(record.accountType)
                          )}</span>
                        </td>
                        <td><span class="tag tag-area">${escapeHtml(
                          getBusinessArea(record.businessAreaId).shortLabel
                        )}</span></td>
                        <td>${escapeHtml(getCashbookEntryType(record.entryType).label)}</td>
                        <td class="${getCashbookEntryEffect(record) < 0 ? "negative-text" : ""}">
                          ${formatSignedCurrency(getCashbookEntryEffect(record))}
                        </td>
                        <td>
                          <span class="table-primary">${escapeHtml(record.counterparty || "No counterparty saved")}</span>
                          <span class="table-secondary">${escapeHtml(record.reference || record.notes || "No reference saved")}</span>
                        </td>
                        <td>
                          <div class="row-actions">
                            <button class="edit-btn" data-cashbook-action="edit" data-id="${escapeHtml(
                              record.id
                            )}" type="button">
                              Edit
                            </button>
                            <button class="delete-btn" data-cashbook-action="delete" data-id="${escapeHtml(
                              record.id
                            )}" type="button">
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    `)
                    .join("")
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function handleCashbookSubmit(event) {
  event.preventDefault();

  const draft = buildCashbookDraftFromForm(new FormData(event.target));
  const errors = validateCashbookEntry(draft);

  if (errors.length > 0) {
    showToast(errors[0]);
    return;
  }

  const now = new Date().toISOString();
  const existingRecord =
    state.cashbookEntries.find((record) => record.id === state.editingCashbookId) || null;
  const linkedExistingRecord =
    existingRecord && existingRecord.linkedEntryId
      ? state.cashbookEntries.find((record) => record.id === existingRecord.linkedEntryId) || null
      : null;
  const isTransfer = isCashbookTransferEntry(draft.entryType);
  const shouldAutoPair = isTransfer && draft.autoPairTransfer;
  const sharedReference = draft.reference || (isTransfer ? buildCashbookTransferReference(draft.entryDate) : "");
  const mainRecordId = existingRecord?.id || generateId();
  const transferGroupId = shouldAutoPair
    ? normalizeText(existingRecord?.transferGroupId || linkedExistingRecord?.transferGroupId) || generateId()
    : "";
  const nextRecords = state.cashbookEntries.filter(
    (record) => record.id !== existingRecord?.id && record.id !== linkedExistingRecord?.id
  );
  const mainRecord = {
    id: mainRecordId,
    createdAt: existingRecord?.createdAt || now,
    updatedAt: now,
    entryDate: draft.entryDate,
    accountType: draft.accountType,
    accountName: draft.accountName,
    businessAreaId: draft.businessAreaId,
    entryType: draft.entryType,
    amount: draft.amount,
    counterparty: normalizeText(draft.counterparty) || (shouldAutoPair ? draft.linkedAccountName : ""),
    reference: sharedReference,
    notes: draft.notes,
    linkedEntryId: "",
    linkedAccountType: shouldAutoPair ? draft.linkedAccountType : "",
    linkedAccountName: shouldAutoPair ? draft.linkedAccountName : "",
    transferGroupId,
    pairedTransfer: shouldAutoPair
  };

  if (shouldAutoPair) {
    const linkedRecordId = linkedExistingRecord?.id || generateId();

    mainRecord.linkedEntryId = linkedRecordId;
    nextRecords.push({
      ...mainRecord,
      id: linkedRecordId,
      createdAt: linkedExistingRecord?.createdAt || now,
      accountType: draft.linkedAccountType,
      accountName: draft.linkedAccountName,
      entryType: getOppositeCashbookEntryType(draft.entryType),
      counterparty: draft.accountName,
      linkedEntryId: mainRecordId,
      linkedAccountType: draft.accountType,
      linkedAccountName: draft.accountName
    });
  }

  nextRecords.push(mainRecord);
  state.cashbookEntries = sortCashbookEntries(
    nextRecords.map((record) => sanitizeStoredCashbookEntry(record)).filter(Boolean)
  );
  showToast(
    existingRecord
      ? shouldAutoPair
        ? "Cashbook transfer pair updated."
        : "Cashbook entry updated."
      : shouldAutoPair
        ? "Cashbook transfer pair saved."
        : "Cashbook entry saved."
  );

  persistCashbookEntries();
  resetCashbookForm({ silent: true });
  render();
}

function startEditingCashbookEntry(recordId) {
  const record = state.cashbookEntries.find((item) => item.id === recordId);

  if (!record) {
    showToast("That cashbook entry could not be found.");
    return;
  }

  state.editingCashbookId = record.id;
  navigateTo("cashbook", { syncHash: true });
  render();
  scrollDynamicFormIntoView("cashbookForm");
}

function deleteCashbookEntry(recordId) {
  const record = state.cashbookEntries.find((item) => item.id === recordId);

  if (!record) {
    showToast("That cashbook entry could not be found.");
    return;
  }

  const linkedRecord =
    record.linkedEntryId
      ? state.cashbookEntries.find((item) => item.id === record.linkedEntryId) || null
      : null;
  const shouldDelete = window.confirm(
    linkedRecord
      ? `Delete this transfer pair for ${record.accountName} and ${linkedRecord.accountName} on ${formatDisplayDate(
          record.entryDate
        )}?`
      : `Delete the ${getCashbookAccountTypeLabel(record.accountType).toLowerCase()} entry for ${
          record.accountName
        } on ${formatDisplayDate(record.entryDate)}?`
  );

  if (!shouldDelete) {
    return;
  }

  state.cashbookEntries = state.cashbookEntries.filter(
    (item) => item.id !== recordId && item.id !== linkedRecord?.id
  );
  persistCashbookEntries();

  if (state.editingCashbookId === recordId || state.editingCashbookId === linkedRecord?.id) {
    resetCashbookForm({ silent: true });
  }

  render();
  showToast(linkedRecord ? "Cashbook transfer pair deleted." : "Cashbook entry deleted.");
}

function resetCashbookForm(options = {}) {
  state.editingCashbookId = null;

  if (!options.silent) {
    render();
    showToast("Cashbook form cleared.");
  }
}

function clearCashbookFilters() {
  state.cashbookFilters = { search: "", month: "", area: "", accountType: "" };
  render();
  showToast("Cashbook filters cleared.");
}

function renderTreasuryPage() {
  if (!elements.treasuryViewRoot) {
    return;
  }

  const snapshot = buildTreasurySnapshot();
  const areaLabel = snapshot.areaFilter ? getBusinessArea(snapshot.areaFilter).shortLabel : "All Areas";
  const transferRows = snapshot.visibleTransferRows.slice(0, 180);

  elements.treasuryViewRoot.innerHTML = `
    <section class="page-grid compact-page-grid">
      <section class="section-card">
        <div class="section-heading">
          <div>
            <p class="kicker">Live Funds Position</p>
            <h3>Treasury & Transfer Reconciliation</h3>
          </div>
          <div class="module-actions">
            <button class="button button-primary" data-global-action="export-view-csv" type="button">
              Export Treasury CSV
            </button>
            <button class="button button-secondary" data-go-view="cashbook" type="button">
              Open Cashbook
            </button>
            <button class="button button-secondary" data-go-view="mobile-money" type="button">
              Open Mobile Money
            </button>
            <button id="clearTreasuryFiltersBtn" class="button button-ghost" type="button">
              Clear Filters
            </button>
          </div>
        </div>

        <p class="muted-text">
          ${escapeHtml(areaLabel)} treasury view separates internal transfers from real outflows, so money left stays based on balances instead of being reduced twice by account-to-account movement.
        </p>

        <div class="filter-grid">
          <label>
            <span>Business Area</span>
            <select id="treasuryAreaFilter">
              ${buildSelectMarkup(getBusinessAreaOptions(), snapshot.areaFilter, "All Areas")}
            </select>
          </label>

          <label>
            <span>Transfer Health</span>
            <select id="treasuryTransferStateFilter">
              ${buildSelectMarkup(
                [
                  { value: "matched", label: "Matched Transfers" },
                  { value: "missing-side", label: "Missing Side" },
                  { value: "difference", label: "Difference" }
                ],
                snapshot.transferState,
                "All Transfer States"
              )}
            </select>
          </label>
        </div>
      </section>

      <aside class="sidebar-column">
        <section class="section-card">
          <div class="section-heading compact">
            <div>
              <p class="kicker">Treasury Guide</p>
              <h3>How Totals Are Read</h3>
            </div>
          </div>
          <div class="guide-list compact-guide-list">
            <p><strong>Money Left Now</strong> combines current cashbook balances, bankbook balances, and the latest counted mobile money float.</p>
            <p><strong>Total Spent</strong> uses captured expenses, salary paid, and petty cash expense-paid items.</p>
            <p><strong>External Cash Outflow</strong> excludes transfer-out entries so internal movements do not look like spend.</p>
          </div>
        </section>
      </aside>
    </section>

    <section class="dashboard-grid">
      <article class="stat-card dashboard-metric-card">
        <span>Money Left Now</span>
        <strong class="${snapshot.liquidFunds < 0 ? "negative-text" : ""}">${formatCurrency(
    snapshot.liquidFunds
  )}</strong>
        <p class="module-meta">Cash, bank, and latest mobile money float combined.</p>
      </article>
      <article class="stat-card dashboard-metric-card">
        <span>Cash On Hand</span>
        <strong>${formatCurrency(snapshot.cashBalance)}</strong>
        <p class="module-meta">Current total across cashbook accounts.</p>
      </article>
      <article class="stat-card dashboard-metric-card">
        <span>Bank Balance</span>
        <strong>${formatCurrency(snapshot.bankBalance)}</strong>
        <p class="module-meta">Current total across bankbook accounts.</p>
      </article>
      <article class="stat-card dashboard-metric-card">
        <span>MoMo Float</span>
        <strong>${formatCurrency(snapshot.mobileMoneyFloat)}</strong>
        <p class="module-meta">Latest counted float across mobile money providers.</p>
      </article>
      <article class="stat-card dashboard-metric-card">
        <span>Total Spent</span>
        <strong>${formatCurrency(snapshot.capturedSpend)}</strong>
        <p class="module-meta">Expenses, salary paid, and petty cash expense-paid items.</p>
      </article>
      <article class="stat-card dashboard-metric-card">
        <span>External Cash Outflow</span>
        <strong>${formatCurrency(snapshot.externalOutflows)}</strong>
        <p class="module-meta">Cash and bank money that left the business, excluding transfers.</p>
      </article>
      <article class="stat-card dashboard-metric-card">
        <span>Open Commitments</span>
        <strong class="${snapshot.openCommitments > 0 ? "negative-text" : ""}">${formatCurrency(
    snapshot.openCommitments
  )}</strong>
        <p class="module-meta">Outstanding payroll, suppliers, and procurement balances.</p>
      </article>
      <article class="stat-card dashboard-metric-card">
        <span>After Commitments</span>
        <strong class="${snapshot.availableAfterCommitments < 0 ? "negative-text" : ""}">${formatSignedCurrency(
    snapshot.availableAfterCommitments
  )}</strong>
        <p class="module-meta">${snapshot.unmatchedTransfers.length} transfer issue${
    snapshot.unmatchedTransfers.length === 1 ? "" : "s"
  } still need review.</p>
      </article>
    </section>

    <section class="section-card">
      <div class="section-heading compact">
        <div>
          <p class="kicker">Account Position</p>
          <h3>${snapshot.accountRows.length} Account${snapshot.accountRows.length === 1 ? "" : "s"} In Scope</h3>
        </div>
      </div>
      <div class="table-wrap compact-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Account</th>
              <th>Areas</th>
              <th>Balance</th>
              <th>External In / Out</th>
              <th>Transfer In / Out</th>
            </tr>
          </thead>
          <tbody>
            ${
              snapshot.accountRows.length === 0
                ? `
                    <tr>
                      <td colspan="5" class="empty-state">No cashbook or bankbook balances are available for the selected treasury scope yet.</td>
                    </tr>
                  `
                : snapshot.accountRows
                    .map(
                      (row) => `
                        <tr>
                          <td>
                            <span class="table-primary">${escapeHtml(row.accountName)}</span>
                            <span class="table-secondary">${escapeHtml(
                              getCashbookAccountTypeLabel(row.accountType)
                            )} • ${escapeHtml(`${row.entryCount} entr${row.entryCount === 1 ? "y" : "ies"}`)}</span>
                          </td>
                          <td>
                            <span class="table-primary">${escapeHtml(row.businessAreaSummary || "No area saved")}</span>
                            <span class="table-secondary">${escapeHtml(
                              row.lastDate ? `Last entry ${formatDisplayDate(row.lastDate)}` : "No date saved"
                            )}</span>
                          </td>
                          <td class="${row.balance < 0 ? "negative-text" : ""}">${formatSignedCurrency(
                            row.balance
                          )}</td>
                          <td>
                            <span class="table-primary">In ${formatCurrency(row.externalInflow)}</span>
                            <span class="table-secondary">Out ${formatCurrency(row.externalOutflow)}</span>
                          </td>
                          <td>
                            <span class="table-primary">In ${formatCurrency(row.transferIn)}</span>
                            <span class="table-secondary">Out ${formatCurrency(row.transferOut)}</span>
                          </td>
                        </tr>
                      `
                    )
                    .join("")
            }
          </tbody>
        </table>
      </div>
    </section>

    <section class="section-card">
      <div class="section-heading compact">
        <div>
          <p class="kicker">Transfer Reconciliation</p>
          <h3>${snapshot.visibleTransferRows.length} Transfer Group${
    snapshot.visibleTransferRows.length === 1 ? "" : "s"
  } In View</h3>
        </div>
      </div>
      <div class="results-meta">
        <strong>${escapeHtml(String(snapshot.unmatchedTransfers.length))} transfer issue${
    snapshot.unmatchedTransfers.length === 1 ? "" : "s"
  }</strong>
        <span>${
          snapshot.transferRows.length > transferRows.length
            ? `Showing ${transferRows.length} grouped transfers in the current filter view.`
            : "Every grouped transfer in scope is shown below."
        }</span>
      </div>
      <div class="table-wrap compact-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Reference</th>
              <th>From / To</th>
              <th>Out / In</th>
              <th>Difference</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${
              transferRows.length === 0
                ? `
                    <tr>
                      <td colspan="6" class="empty-state">No transfer groups match the treasury scope yet.</td>
                    </tr>
                  `
                : transferRows
                    .map((row) => {
                      const status = getCashbookTransferStatusConfig(row.statusKey);

                      return `
                        <tr>
                          <td>${escapeHtml(row.date ? formatDisplayDate(row.date) : "No date")}</td>
                          <td>
                            <span class="table-primary">${escapeHtml(row.reference || "No reference saved")}</span>
                            <span class="table-secondary">${escapeHtml(
                              row.businessAreaSummary || "No area saved"
                            )}</span>
                          </td>
                          <td>
                            <span class="table-primary">${escapeHtml(row.outSummary)}</span>
                            <span class="table-secondary">${escapeHtml(row.inSummary)}</span>
                          </td>
                          <td>
                            <span class="table-primary">Out ${formatCurrency(row.outTotal)}</span>
                            <span class="table-secondary">In ${formatCurrency(row.inTotal)}</span>
                          </td>
                          <td class="${Math.abs(row.variance) >= 0.01 ? "negative-text" : ""}">${formatSignedCurrency(
                            row.variance
                          )}</td>
                          <td>
                            <span class="alert-pill ${escapeHtml(status.pillClass)}">${escapeHtml(
                              status.label
                            )}</span>
                          </td>
                        </tr>
                      `;
                    })
                    .join("")
            }
          </tbody>
        </table>
      </div>
    </section>

    <section class="section-card">
      <div class="section-heading compact">
        <div>
          <p class="kicker">Mobile Money Float Snapshot</p>
          <h3>${snapshot.mobileMoneyRows.length} Provider${snapshot.mobileMoneyRows.length === 1 ? "" : "s"} In Scope</h3>
        </div>
      </div>
      <div class="table-wrap compact-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Provider</th>
              <th>Last Recon</th>
              <th>Expected Closing</th>
              <th>Counted Float</th>
              <th>Variance</th>
            </tr>
          </thead>
          <tbody>
            ${
              snapshot.mobileMoneyRows.length === 0
                ? `
                    <tr>
                      <td colspan="5" class="empty-state">No mobile money float snapshot is available for this treasury scope yet.</td>
                    </tr>
                  `
                : snapshot.mobileMoneyRows
                    .map((row) => `
                      <tr>
                        <td>${escapeHtml(row.provider)}</td>
                        <td>${escapeHtml(formatDisplayDate(row.date))}</td>
                        <td>${formatCurrency(getExpectedMobileMoneyClosing(row))}</td>
                        <td>${formatCurrency(row.closingCashCounted)}</td>
                        <td class="${Math.abs(getMobileMoneyVariance(row)) >= 0.01 ? "negative-text" : ""}">
                          ${formatSignedCurrency(getMobileMoneyVariance(row))}
                        </td>
                      </tr>
                    `)
                    .join("")
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function createEmptyMessageBuilderDraft() {
  return {
    mode: "reminder",
    sourceKey: "",
    template: "payment-reminder",
    channel: "SMS",
    recipientName: "",
    recipientPhone: "",
    amount: "",
    dueDate: "",
    reference: "",
    customNote: "",
    customMessage: ""
  };
}

function updateMessageBuilderDraftField(id, value) {
  const mapping = {
    messageMode: "mode",
    messageSourceKey: "sourceKey",
    messageTemplate: "template",
    messageChannel: "channel",
    messageRecipientName: "recipientName",
    messageRecipientPhone: "recipientPhone",
    messageAmount: "amount",
    messageDueDate: "dueDate",
    messageReference: "reference",
    messageCustomNote: "customNote",
    messageCustomMessage: "customMessage"
  };
  const stateKey = mapping[id];

  if (!stateKey) {
    return;
  }

  state.messageBuilderDraft = {
    ...state.messageBuilderDraft,
    [stateKey]: id === "messageDueDate" ? normalizeDateInput(value) : value
  };
}

function clearSearchFilters() {
  state.searchFilters = { query: "", module: "" };
  render();
  showToast("Search filters cleared.");
}

function clearReminderFilters() {
  state.reminderFilters = { search: "", source: "", severity: "" };
  render();
  showToast("Reminder filters cleared.");
}

function handleSearchSubmit(event) {
  event.preventDefault();
  state.searchFilters.query = normalizeText(new FormData(event.target).get("globalSearchQuery"));
  render();
}

function buildAreaKpiRows(monthKey, areaFilter) {
  const rows = BUSINESS_AREAS.filter((area) => areaFilter === "" || area.id === areaFilter).map((area) => {
    const salesCollected = state.sales
      .filter((record) => record.businessAreaId === area.id && record.date.startsWith(monthKey))
      .reduce((sum, record) => sum + record.amount, 0);
    const rentCollected =
      area.id === "rentals-apartments"
        ? state.rentals
            .filter((record) => record.month === monthKey)
            .reduce((sum, record) => sum + record.rentPaid, 0)
        : 0;
    const billsRecovered =
      area.id === "rentals-apartments"
        ? state.rentals
            .filter((record) => record.month === monthKey)
            .reduce((sum, record) => sum + getBillsPaidAmount(record), 0)
        : 0;
    const expenses = state.expenses
      .filter((record) => record.businessAreaId === area.id && record.date.startsWith(monthKey))
      .reduce((sum, record) => sum + record.amount, 0);
    const salaryPaid = state.salaryRecords
      .filter((record) => record.businessAreaId === area.id && record.month === monthKey)
      .reduce((sum, record) => sum + record.amountPaid, 0);
    const pettyExpense = state.pettyCash
      .filter(
        (record) =>
          record.businessAreaId === area.id &&
          record.date.startsWith(monthKey) &&
          getPettyCashType(record.transactionTypeId).isExpense
      )
      .reduce((sum, record) => sum + record.amount, 0);
    const revenue = salesCollected + rentCollected + billsRecovered;
    const spend = expenses + salaryPaid + pettyExpense;

    return {
      area,
      revenue,
      spend,
      net: revenue - spend,
      salesCollected,
      rentCollected,
      billsRecovered
    };
  });

  return rows.sort((left, right) => {
    if (right.revenue !== left.revenue) {
      return right.revenue - left.revenue;
    }

    return left.area.shortLabel.localeCompare(right.area.shortLabel);
  });
}

function buildKpiSnapshot() {
  const monthKey = normalizeMonthInput(state.kpiFilters.month) || getMonthKey(new Date());
  const areaFilter = normalizeBusinessAreaId(state.kpiFilters.area);
  const areaRows = buildAreaKpiRows(monthKey, areaFilter);
  const matchesArea = (businessAreaId) => areaFilter === "" || normalizeBusinessAreaId(businessAreaId) === areaFilter;
  const monthExpenses = state.expenses.filter(
    (record) => record.date.startsWith(monthKey) && matchesArea(record.businessAreaId)
  );
  const monthSales = state.sales.filter(
    (record) => record.date.startsWith(monthKey) && matchesArea(record.businessAreaId)
  );
  const monthRentals = state.rentals.filter(
    (record) => record.month === monthKey && (areaFilter === "" || areaFilter === "rentals-apartments")
  );
  const monthSalaries = state.salaryRecords.filter(
    (record) => record.month === monthKey && matchesArea(record.businessAreaId)
  );
  const staffKpi = buildSalaryKpiSummary(monthSalaries);
  const monthPettyExpense = state.pettyCash.filter(
    (record) =>
      record.date.startsWith(monthKey) &&
      matchesArea(record.businessAreaId) &&
      getPettyCashType(record.transactionTypeId).isExpense
  );
  const monthCashbook = state.cashbookEntries.filter(
    (record) => record.entryDate.startsWith(monthKey) && matchesArea(record.businessAreaId)
  );
  const monthProcurement = state.purchaseOrders.filter(
    (record) => record.requestDate.startsWith(monthKey) && matchesArea(record.businessAreaId)
  );
  const laundryRecords = state.laundryTickets.filter(
    (record) => areaFilter === "" || areaFilter === "laundry-services"
  );
  const equipmentRecords = state.equipmentRentalBookings.filter(
    (record) => areaFilter === "" || areaFilter === "water-equipment"
  );
  const depositRecords = state.securityDepositRecords.filter(
    (record) => areaFilter === "" || areaFilter === "rentals-apartments"
  );
  const revenue =
    monthSales.reduce((sum, record) => sum + record.amount, 0) +
    monthRentals.reduce((sum, record) => sum + record.rentPaid + getBillsPaidAmount(record), 0);
  const spend =
    monthExpenses.reduce((sum, record) => sum + record.amount, 0) +
    monthSalaries.reduce((sum, record) => sum + record.amountPaid, 0) +
    monthPettyExpense.reduce((sum, record) => sum + record.amount, 0);
  const cashMovement = monthCashbook
    .filter((record) => record.accountType === "cashbook")
    .reduce((sum, record) => sum + getCashbookEntryEffect(record), 0);
  const bankMovement = monthCashbook
    .filter((record) => record.accountType === "bankbook")
    .reduce((sum, record) => sum + getCashbookEntryEffect(record), 0);
  const currentCashBalance = buildCashbookAccountSummaries(
    state.cashbookEntries.filter(
      (record) => matchesArea(record.businessAreaId) && record.accountType === "cashbook"
    )
  ).reduce((sum, item) => sum + item.balance, 0);
  const currentBankBalance = buildCashbookAccountSummaries(
    state.cashbookEntries.filter(
      (record) => matchesArea(record.businessAreaId) && record.accountType === "bankbook"
    )
  ).reduce((sum, item) => sum + item.balance, 0);
  const openPurchaseOrders = state.purchaseOrders.filter((record) =>
    matchesArea(record.businessAreaId) && !["Received", "Cancelled"].includes(record.status)
  );
  const openLaundryTickets = laundryRecords.filter(
    (record) => !["Delivered", "Cancelled"].includes(record.status)
  );
  const activeEquipmentRentals = equipmentRecords.filter(
    (record) => !["Returned", "Cancelled"].includes(record.status)
  );
  const latestRentalProfiles =
    areaFilter === "" || areaFilter === "rentals-apartments" ? getLatestRentalProfiles() : [];
  const occupiedSuites = latestRentalProfiles.filter((record) => record.occupancyStatus === "Occupied").length;
  const activeSuiteCount = latestRentalProfiles.filter((record) =>
    ["Occupied", "Reserved"].includes(record.occupancyStatus)
  ).length;
  const reminderCount = buildReminderCenterItems().length;
  const procurementOutstanding = openPurchaseOrders.reduce(
    (sum, record) => sum + getPurchaseOrderOutstanding(record),
    0
  );
  const depositExposure = depositRecords.reduce(
    (sum, record) =>
      sum +
      getSecurityDepositOutstanding(record) +
      getSecurityChargeOutstanding(record) +
      getSecurityRefundOutstanding(record),
    0
  );

  return {
    monthKey,
    areaFilter,
    areaRows,
    revenue,
    spend,
    net: revenue - spend,
    cashMovement,
    bankMovement,
    currentCashBalance,
    currentBankBalance,
    occupiedSuites,
    activeSuiteCount,
    reminderCount,
    procurementOutstanding,
    openPurchaseOrders: openPurchaseOrders.length,
    openLaundryTickets: openLaundryTickets.length,
    activeEquipmentRentals: activeEquipmentRentals.length,
    depositExposure,
    procurementMonthSpend: monthProcurement.reduce((sum, record) => sum + record.totalAmount, 0),
    staffKpi
  };
}

function renderKpiPage() {
  if (!elements.kpiViewRoot) {
    return;
  }

  const snapshot = buildKpiSnapshot();
  const areaLabel = snapshot.areaFilter ? getBusinessArea(snapshot.areaFilter).shortLabel : "All Areas";
  const kpiTrendRows = buildScopedMonthlyTrendRows(getRecentMonthKeys(snapshot.monthKey, 6), {
    areaFilter: snapshot.areaFilter,
    includePettyInSpend: true
  });
  const occupancyRate =
    APARTMENT_PORTFOLIO_SUITES.length > 0
      ? (snapshot.occupiedSuites / APARTMENT_PORTFOLIO_SUITES.length) * 100
      : 0;
  const fullyPaidRate =
    snapshot.staffKpi.staffCount > 0
      ? (snapshot.staffKpi.paidStaffCount / snapshot.staffKpi.staffCount) * 100
      : 0;
  const targetCoverage =
    snapshot.staffKpi.staffCount > 0
      ? (snapshot.staffKpi.targetSetCount / snapshot.staffKpi.staffCount) * 100
      : 0;
  const measurementCoverage =
    snapshot.staffKpi.staffCount > 0
      ? (snapshot.staffKpi.measuredCount / snapshot.staffKpi.staffCount) * 100
      : 0;
  const kpiTrendChart = buildComparisonChartCard({
    eyebrow: "KPI Trend",
    title: `Recent Revenue vs Spend • ${areaLabel}`,
    note: "Trend uses the selected area filter and includes petty cash expense-paid entries in spend for a fuller operating view.",
    rows: kpiTrendRows.map((row) => ({
      label: row.label,
      primary: row.revenue,
      secondary: row.spend,
      meta: `Petty cash ${formatCurrency(row.pettyExpensePaid)} • Salary ${formatCurrency(row.salaryPaid)}`,
      valueLabel: formatSignedCurrency(row.net),
      valueClass: row.net < 0 ? "negative-text" : ""
    })),
    primaryLabel: "Revenue",
    secondaryLabel: "Spend",
    wide: true,
    emptyMessage: "Capture sales, rent, or spend first to unlock KPI trend analysis.",
    summaryItems: [
      {
        label: "6-Month Revenue",
        value: formatCurrency(kpiTrendRows.reduce((sum, row) => sum + row.revenue, 0))
      },
      {
        label: "6-Month Spend",
        value: formatCurrency(kpiTrendRows.reduce((sum, row) => sum + row.spend, 0))
      },
      {
        label: "6-Month Net",
        value: formatSignedCurrency(kpiTrendRows.reduce((sum, row) => sum + row.net, 0)),
        valueClass:
          kpiTrendRows.reduce((sum, row) => sum + row.net, 0) < 0 ? "negative-text" : ""
      }
    ]
  });
  const kpiCoverageChart = buildSingleSeriesChartCard({
    eyebrow: "Coverage",
    title: "Staff, Target & Occupancy Health",
    note: "These percentages help you quickly see staffing, target capture, and suite usage strength for the selected month.",
    rows: [
      {
        label: "Payroll Completion",
        value: snapshot.staffKpi.completionRate,
        valueLabel: formatPercentLabel(snapshot.staffKpi.completionRate),
        footer: `${formatCurrency(snapshot.staffKpi.payrollPaid)} of ${formatCurrency(
          snapshot.staffKpi.payrollDue
        )}`,
        tone: snapshot.staffKpi.completionRate >= 100 ? "accent" : "warning"
      },
      {
        label: "KPI Achievement",
        value: snapshot.staffKpi.kpiAchievement,
        valueLabel: formatPercentLabel(snapshot.staffKpi.kpiAchievement, "n/a"),
        footer: `${formatKpiNumber(snapshot.staffKpi.kpiActualTotal)} actual • ${formatKpiNumber(
          snapshot.staffKpi.kpiTargetTotal
        )} target`,
        tone: snapshot.staffKpi.kpiAchievement >= 100 ? "accent" : "warning"
      },
      {
        label: "Target Coverage",
        value: targetCoverage,
        valueLabel: formatPercentLabel(targetCoverage, "0%"),
        footer: `${snapshot.staffKpi.targetSetCount}/${snapshot.staffKpi.staffCount || 0} staff with targets`,
        tone: targetCoverage >= 100 ? "accent" : "primary"
      },
      {
        label: "Measurement Coverage",
        value: measurementCoverage,
        valueLabel: formatPercentLabel(measurementCoverage, "0%"),
        footer: `${snapshot.staffKpi.measuredCount}/${snapshot.staffKpi.staffCount || 0} staff measured`,
        tone: measurementCoverage >= 100 ? "accent" : "primary"
      },
      {
        label: "Suite Occupancy",
        value: occupancyRate,
        valueLabel: formatPercentLabel(occupancyRate, "0%"),
        footer: `${snapshot.occupiedSuites}/${APARTMENT_PORTFOLIO_SUITES.length} suites occupied`,
        tone: occupancyRate >= 80 ? "accent" : "primary"
      },
      {
        label: "Fully Paid Staff",
        value: fullyPaidRate,
        valueLabel: formatPercentLabel(fullyPaidRate, "0%"),
        footer: `${snapshot.staffKpi.paidStaffCount}/${snapshot.staffKpi.staffCount || 0} fully paid`,
        tone: fullyPaidRate >= 80 ? "accent" : "warning"
      }
    ],
    maxValue: 100,
    includeZeroRows: true,
    summaryItems: [
      {
        label: "Outstanding Payroll",
        value: formatCurrency(snapshot.staffKpi.outstanding),
        valueClass: snapshot.staffKpi.outstanding > 0 ? "negative-text" : ""
      },
      {
        label: "Reminder Load",
        value: String(snapshot.reminderCount)
      },
      {
        label: "Open Procurement",
        value: `${snapshot.openPurchaseOrders} order${snapshot.openPurchaseOrders === 1 ? "" : "s"}`
      }
    ]
  });
  const kpiAreaChart = buildComparisonChartCard({
    eyebrow: "Area Performance",
    title: snapshot.areaFilter ? `${areaLabel} Current-Month Breakdown` : "Current Month By Business Area",
    note: snapshot.areaFilter
      ? "This view focuses on the selected business area only."
      : "Compare revenue and spend across the OneRoot operating ecosystem for the selected month.",
    rows: snapshot.areaRows.map((row) => ({
      label: row.area.shortLabel,
      primary: row.revenue,
      secondary: row.spend,
      meta: `Sales ${formatCurrency(row.salesCollected)} • Rent ${formatCurrency(
        row.rentCollected + row.billsRecovered
      )}`,
      valueLabel: formatSignedCurrency(row.net),
      valueClass: row.net < 0 ? "negative-text" : ""
    })),
    primaryLabel: "Revenue",
    secondaryLabel: "Spend",
    emptyMessage: "No KPI area rows match the selected month and area yet.",
    summaryItems: [
      {
        label: "Current Cash",
        value: formatCurrency(snapshot.currentCashBalance)
      },
      {
        label: "Current Bank",
        value: formatCurrency(snapshot.currentBankBalance)
      },
      {
        label: "Deposit Exposure",
        value: formatCurrency(snapshot.depositExposure)
      }
    ]
  });

  elements.kpiViewRoot.innerHTML = `
    <section class="page-grid compact-page-grid">
      <section class="section-card">
        <div class="section-heading">
          <div>
            <p class="kicker">Performance Dashboard</p>
            <h3>Monthly KPI Monitor</h3>
          </div>
          <p class="muted-text">
            Review one operating month at a time across revenue, spend, liquidity movement, occupancy, workload, and follow-up.
          </p>
        </div>

        <div class="filter-grid">
          <label>
            <span>Month</span>
            <input id="kpiMonthFilter" type="month" value="${escapeHtml(snapshot.monthKey)}" />
          </label>

          <label>
            <span>Business Area</span>
            <select id="kpiAreaFilter">
              ${buildSelectMarkup(getBusinessAreaOptions(), snapshot.areaFilter, "All Areas")}
            </select>
          </label>
        </div>

        <section class="chart-grid">
          ${kpiTrendChart}
          ${kpiCoverageChart}
          ${kpiAreaChart}
        </section>

        <div class="module-grid">
          <article class="stat-card dashboard-metric-card">
            <span>Captured Revenue</span>
            <strong>${formatCurrency(snapshot.revenue)}</strong>
            <p class="module-meta">${escapeHtml(formatMonthLabel(snapshot.monthKey))}</p>
          </article>
          <article class="stat-card dashboard-metric-card">
            <span>Captured Spend</span>
            <strong>${formatCurrency(snapshot.spend)}</strong>
            <p class="module-meta">Expenses, salaries, and petty cash expense-paid entries.</p>
          </article>
          <article class="stat-card dashboard-metric-card">
            <span>Staff In Payroll</span>
            <strong>${escapeHtml(String(snapshot.staffKpi.staffCount))}</strong>
            <p class="module-meta">${escapeHtml(String(snapshot.staffKpi.totalRecordCount))} payroll record${
    snapshot.staffKpi.totalRecordCount === 1 ? "" : "s"
  } in the selected month.</p>
          </article>
          <article class="stat-card dashboard-metric-card">
            <span>Payroll Completion</span>
            <strong>${escapeHtml(formatPercentLabel(snapshot.staffKpi.completionRate))}</strong>
            <p class="module-meta">${formatCurrency(snapshot.staffKpi.payrollPaid)} paid of ${formatCurrency(
    snapshot.staffKpi.payrollDue
  )} due.</p>
          </article>
          <article class="stat-card dashboard-metric-card">
            <span>Staff Fully Paid</span>
            <strong>${escapeHtml(`${snapshot.staffKpi.paidStaffCount}/${snapshot.staffKpi.staffCount}`)}</strong>
            <p class="module-meta">${escapeHtml(String(snapshot.staffKpi.partialStaffCount))} part paid and ${escapeHtml(
    String(snapshot.staffKpi.unpaidStaffCount)
  )} unpaid.</p>
          </article>
          <article class="stat-card dashboard-metric-card">
            <span>Payroll Outstanding</span>
            <strong class="${snapshot.staffKpi.outstanding > 0 ? "negative-text" : ""}">${formatCurrency(
    snapshot.staffKpi.outstanding
  )}</strong>
            <p class="module-meta">${escapeHtml(String(snapshot.staffKpi.overdueStaffCount))} staff record${
    snapshot.staffKpi.overdueStaffCount === 1 ? "" : "s"
  } overdue.</p>
          </article>
          <article class="stat-card dashboard-metric-card">
            <span>Staff KPI Targets Set</span>
            <strong>${escapeHtml(`${snapshot.staffKpi.targetSetCount}/${snapshot.staffKpi.staffCount}`)}</strong>
            <p class="module-meta">${escapeHtml(String(snapshot.staffKpi.measuredCount))} staff measurement${
    snapshot.staffKpi.measuredCount === 1 ? "" : "s"
  } captured.</p>
          </article>
          <article class="stat-card dashboard-metric-card">
            <span>Staff KPI Achievement</span>
            <strong>${escapeHtml(formatPercentLabel(snapshot.staffKpi.kpiAchievement, "n/a"))}</strong>
            <p class="module-meta">${formatKpiNumber(snapshot.staffKpi.kpiActualTotal)} measured of ${formatKpiNumber(
    snapshot.staffKpi.kpiTargetTotal
  )} targeted.</p>
          </article>
          <article class="stat-card dashboard-metric-card">
            <span>On / Above Target</span>
            <strong>${escapeHtml(String(snapshot.staffKpi.metTargetCount))}</strong>
            <p class="module-meta">${escapeHtml(String(snapshot.staffKpi.underTargetCount))} staff target${
    snapshot.staffKpi.underTargetCount === 1 ? "" : "s"
  } still below target.</p>
          </article>
          <article class="stat-card dashboard-metric-card">
            <span>Operating Net</span>
            <strong class="${snapshot.net < 0 ? "negative-text" : ""}">${formatSignedCurrency(snapshot.net)}</strong>
            <p class="module-meta">Revenue minus captured spend in the selected month.</p>
          </article>
          <article class="stat-card dashboard-metric-card">
            <span>Reminder Load</span>
            <strong>${escapeHtml(String(snapshot.reminderCount))}</strong>
            <p class="module-meta">Live reminders across collections, jobs, rentals, and controls.</p>
          </article>
          <article class="stat-card dashboard-metric-card">
            <span>Cash Movement</span>
            <strong class="${snapshot.cashMovement < 0 ? "negative-text" : ""}">${formatSignedCurrency(
              snapshot.cashMovement
            )}</strong>
            <p class="module-meta">Selected-month movement inside cashbook accounts.</p>
          </article>
          <article class="stat-card dashboard-metric-card">
            <span>Bank Movement</span>
            <strong class="${snapshot.bankMovement < 0 ? "negative-text" : ""}">${formatSignedCurrency(
              snapshot.bankMovement
            )}</strong>
            <p class="module-meta">Selected-month movement inside bankbook accounts.</p>
          </article>
          <article class="stat-card dashboard-metric-card">
            <span>Current Cash Balance</span>
            <strong>${formatCurrency(snapshot.currentCashBalance)}</strong>
            <p class="module-meta">All matching cashbook account balances to date.</p>
          </article>
          <article class="stat-card dashboard-metric-card">
            <span>Current Bank Balance</span>
            <strong>${formatCurrency(snapshot.currentBankBalance)}</strong>
            <p class="module-meta">All matching bankbook account balances to date.</p>
          </article>
          <article class="stat-card dashboard-metric-card">
            <span>Open Procurement</span>
            <strong>${escapeHtml(String(snapshot.openPurchaseOrders))}</strong>
            <p class="module-meta">${formatCurrency(snapshot.procurementOutstanding)} still open.</p>
          </article>
          <article class="stat-card dashboard-metric-card">
            <span>Open Laundry Jobs</span>
            <strong>${escapeHtml(String(snapshot.openLaundryTickets))}</strong>
            <p class="module-meta">Tickets not yet delivered or cancelled.</p>
          </article>
          <article class="stat-card dashboard-metric-card">
            <span>Active Equipment Rentals</span>
            <strong>${escapeHtml(String(snapshot.activeEquipmentRentals))}</strong>
            <p class="module-meta">Bookings not yet returned or cancelled.</p>
          </article>
          <article class="stat-card dashboard-metric-card">
            <span>Deposit / Charge Exposure</span>
            <strong>${formatCurrency(snapshot.depositExposure)}</strong>
            <p class="module-meta">Deposit shortfall, tenant charges, and pending refunds.</p>
          </article>
          <article class="stat-card dashboard-metric-card">
            <span>Occupied Suites</span>
            <strong>${escapeHtml(
              `${snapshot.occupiedSuites}/${APARTMENT_PORTFOLIO_SUITES.length}`
            )}</strong>
            <p class="module-meta">${escapeHtml(String(snapshot.activeSuiteCount))} active suites including reserved.</p>
          </article>
          <article class="stat-card dashboard-metric-card">
            <span>Procurement Raised</span>
            <strong>${formatCurrency(snapshot.procurementMonthSpend)}</strong>
            <p class="module-meta">Purchase order value raised in the selected month.</p>
          </article>
        </div>
      </section>

      <aside class="sidebar-column">
        <section class="section-card">
          <div class="section-heading compact">
            <div>
              <p class="kicker">Export</p>
              <h3>KPI Snapshot</h3>
            </div>
          </div>
          <div class="form-actions">
            <button class="button button-primary" data-global-action="export-view-csv" type="button">
              Export KPI CSV
            </button>
          </div>
          <p class="muted-text">
            Export the selected month and business area snapshot when you need to share a compact leadership update.
          </p>
        </section>
      </aside>
    </section>

    <section class="section-card">
      <div class="section-heading compact">
        <div>
          <p class="kicker">Staff KPI</p>
          <h3>Payroll Coverage By Staff</h3>
        </div>
        <p class="muted-text">
          Track who has been fully paid, part paid, due, or overdue in the selected payroll month and business area.
        </p>
      </div>

      <div class="module-grid">
        <article class="stat-card dashboard-metric-card">
          <span>Total Payroll Due</span>
          <strong>${formatCurrency(snapshot.staffKpi.payrollDue)}</strong>
          <p class="module-meta">Net payroll due after deductions.</p>
        </article>
        <article class="stat-card dashboard-metric-card">
          <span>Total Payroll Paid</span>
          <strong>${formatCurrency(snapshot.staffKpi.payrollPaid)}</strong>
          <p class="module-meta">Payments already captured for the selected month.</p>
        </article>
        <article class="stat-card dashboard-metric-card">
          <span>Outstanding Payroll</span>
          <strong class="${snapshot.staffKpi.outstanding > 0 ? "negative-text" : ""}">${formatCurrency(
    snapshot.staffKpi.outstanding
  )}</strong>
          <p class="module-meta">Open payroll still to be settled.</p>
        </article>
        <article class="stat-card dashboard-metric-card">
          <span>Average Net Due</span>
          <strong>${formatCurrency(snapshot.staffKpi.averageNetDue)}</strong>
          <p class="module-meta">Average payroll due per staff member in scope.</p>
        </article>
        <article class="stat-card dashboard-metric-card">
          <span>Average Paid</span>
          <strong>${formatCurrency(snapshot.staffKpi.averagePaid)}</strong>
          <p class="module-meta">Average amount already paid per staff member.</p>
        </article>
        <article class="stat-card dashboard-metric-card">
          <span>Overdue Staff</span>
          <strong>${escapeHtml(String(snapshot.staffKpi.overdueStaffCount))}</strong>
          <p class="module-meta">Staff with at least one overdue payroll balance.</p>
        </article>
        <article class="stat-card dashboard-metric-card">
          <span>KPI Target Total</span>
          <strong>${formatKpiNumber(snapshot.staffKpi.kpiTargetTotal)}</strong>
          <p class="module-meta">Total staff KPI target in the selected view.</p>
        </article>
        <article class="stat-card dashboard-metric-card">
          <span>KPI Actual Total</span>
          <strong>${formatKpiNumber(snapshot.staffKpi.kpiActualTotal)}</strong>
          <p class="module-meta">Total measured output captured so far.</p>
        </article>
      </div>

      <p class="muted-text">
        ${
          snapshot.staffKpi.topOutstanding && snapshot.staffKpi.topOutstanding.balance > 0
            ? `${escapeHtml(snapshot.staffKpi.topOutstanding.staffName)} currently carries the highest open payroll balance at ${escapeHtml(
                formatCurrency(snapshot.staffKpi.topOutstanding.balance)
              )}.`
            : "All visible staff payroll balances are fully settled right now."
        }
      </p>
      <p class="muted-text">
        ${
          snapshot.staffKpi.topKpiGap && snapshot.staffKpi.topKpiGap.targetVariance < 0
            ? `${escapeHtml(snapshot.staffKpi.topKpiGap.staffName)} has the widest KPI shortfall at ${escapeHtml(
                formatKpiNumber(Math.abs(snapshot.staffKpi.topKpiGap.targetVariance))
              )}${snapshot.staffKpi.topKpiGap.kpiUnit ? ` ${escapeHtml(snapshot.staffKpi.topKpiGap.kpiUnit)}` : ""} below target.`
            : "No KPI shortfall is currently recorded for visible staff targets."
        }
      </p>

      <div class="table-wrap compact-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Staff</th>
              <th>Role / Areas</th>
              <th>Payroll</th>
              <th>KPI Metric</th>
              <th>Target</th>
              <th>Measured</th>
              <th>KPI Progress</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${
              snapshot.staffKpi.rows.length === 0
                ? `
                    <tr>
                      <td colspan="8" class="empty-state">No staff payroll records match the selected KPI month and area yet.</td>
                    </tr>
                  `
                : snapshot.staffKpi.rows
                    .map((row) => {
                      const status = getStaffKpiStatusConfig(row);
                      const targetStatus = getStaffTargetStatusConfig(row);
                      const unitSuffix = row.kpiUnit ? ` ${row.kpiUnit}` : "";
                      return `
                        <tr>
                          <td>
                            <span class="table-primary">${escapeHtml(row.staffName)}</span>
                            <span class="table-secondary">${escapeHtml(
                              row.latestPaymentDate
                                ? `Latest paid ${formatDisplayDate(row.latestPaymentDate)}`
                                : "No payment date saved"
                            )}</span>
                          </td>
                          <td>
                            <span class="table-primary">${escapeHtml(row.roleTitle || "Role not saved")}</span>
                            <span class="table-secondary">${escapeHtml(row.businessAreaSummary || "Area not saved")}</span>
                          </td>
                          <td>
                            <span class="table-primary">Due ${formatCurrency(row.payrollDue)}</span>
                            <span class="table-secondary">Paid ${formatCurrency(row.amountPaid)}</span>
                            <span class="table-secondary ${row.balance > 0 ? "negative-text" : ""}">
                              Balance ${formatCurrency(row.balance)}
                            </span>
                          </td>
                          <td>
                            <span class="table-primary">${escapeHtml(row.kpiMetric || "No KPI metric saved")}</span>
                            <span class="table-secondary">${escapeHtml(
                              row.kpiUnit ? `Measured in ${row.kpiUnit}` : "No unit saved"
                            )}</span>
                          </td>
                          <td>${escapeHtml(row.hasKpiTarget ? `${formatKpiNumber(row.kpiTarget)}${unitSuffix}` : "—")}</td>
                          <td>${escapeHtml(
                            row.hasKpiActual
                              ? `${formatKpiNumber(row.kpiActual)}${unitSuffix}`
                              : "—"
                          )}</td>
                          <td>
                            <span class="table-primary">${escapeHtml(
                              row.targetAchievement !== null
                                ? formatPercentLabel(row.targetAchievement)
                                : row.hasKpiTarget
                                  ? "Awaiting"
                                  : "No target"
                            )}</span>
                            <span class="table-secondary">${escapeHtml(targetStatus.meta)}</span>
                          </td>
                          <td>
                            <span class="alert-pill ${escapeHtml(targetStatus.pillClass)}">${escapeHtml(
                              targetStatus.label
                            )}</span>
                            <span class="table-secondary">${escapeHtml(status.meta)}</span>
                          </td>
                        </tr>
                      `;
                    })
                    .join("")
            }
          </tbody>
        </table>
      </div>
    </section>

    <section class="section-card">
      <div class="section-heading compact">
        <div>
          <p class="kicker">Area Matrix</p>
          <h3>Revenue, Spend & Net By Business Area</h3>
        </div>
      </div>
      <div class="table-wrap compact-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Business Area</th>
              <th>Revenue</th>
              <th>Spend</th>
              <th>Net</th>
            </tr>
          </thead>
          <tbody>
            ${
              snapshot.areaRows.length === 0
                ? `
                    <tr>
                      <td colspan="4" class="empty-state">No KPI rows match the selected month and area yet.</td>
                    </tr>
                  `
                : snapshot.areaRows
                    .map(
                      (row) => `
                        <tr>
                          <td>${escapeHtml(row.area.shortLabel)}</td>
                          <td>${formatCurrency(row.revenue)}</td>
                          <td>${formatCurrency(row.spend)}</td>
                          <td class="${row.net < 0 ? "negative-text" : ""}">${formatSignedCurrency(row.net)}</td>
                        </tr>
                      `
                    )
                    .join("")
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function getSearchModuleOptions() {
  return [
    { value: "all", label: "All Modules" },
    { value: "expenses", label: "Expenses" },
    { value: "sales", label: "Daily Sales" },
    { value: "apartments", label: "Apartments" },
    { value: "deposits", label: "Deposits & Charges" },
    { value: "laundry", label: "Laundry Tickets" },
    { value: "equipment-rentals", label: "Equipment Rentals" },
    { value: "procurement", label: "Procurement" },
    { value: "petty-cash", label: "Petty Cash" },
    { value: "cashbook", label: "Cashbook / Bankbook" },
    { value: "ledgers", label: "Ledgers" },
    { value: "mobile-money", label: "Mobile Money" },
    { value: "salary", label: "Salary" },
    { value: "suppliers", label: "Suppliers" },
    { value: "assets", label: "Assets" },
    { value: "maintenance", label: "Maintenance" },
    { value: "recurring", label: "Recurring" },
    { value: "access", label: "Access" }
  ];
}

function buildGlobalSearchResults() {
  const query = normalizeText(state.searchFilters.query).toLowerCase();
  const moduleFilter = normalizeText(state.searchFilters.module).toLowerCase();
  const matchesModule = (view) => moduleFilter === "" || moduleFilter === "all" || view === moduleFilter;
  const results = [
    ...state.expenses.map((record) => ({
      module: "Expenses",
      view: "expenses",
      sortKey: record.updatedAt || record.date,
      title: `${record.vendor} • ${formatCurrency(record.amount)}`,
      detail: `${formatDisplayDate(record.date)} • ${getBusinessArea(record.businessAreaId).shortLabel}`,
      searchText: [record.vendor, record.description, record.category, record.notes, record.reference].join(" ")
    })),
    ...state.sales.map((record) => ({
      module: "Daily Sales",
      view: "sales",
      sortKey: record.updatedAt || record.date,
      title: `${getBusinessArea(record.businessAreaId).shortLabel} • ${formatCurrency(record.amount)}`,
      detail: `${formatDisplayDate(record.date)} • ${record.notes || "Sales capture"}`,
      searchText: [getBusinessArea(record.businessAreaId).label, record.notes].join(" ")
    })),
    ...state.rentals.map((record) => ({
      module: "Apartments",
      view: "apartments",
      sortKey: record.updatedAt || record.month,
      title: `${record.suite} • ${record.tenantName || record.occupancyStatus}`,
      detail: `${formatMonthLabel(record.month)} • Balance ${formatCurrency(getTotalTenantBalance(record))}`,
      searchText: [record.suite, record.tenantName, record.tenantPhone, record.tenantIdRef, record.notes].join(" ")
    })),
    ...state.securityDepositRecords.map((record) => ({
      module: "Deposits & Charges",
      view: "deposits",
      sortKey: record.updatedAt || record.captureDate,
      title: `${record.suite} • ${record.tenantName}`,
      detail: `${formatCurrency(getSecurityDepositHeldBalance(record))} held • ${record.status}`,
      searchText: [record.suite, record.tenantName, record.tenantPhone, record.notes, record.status].join(" ")
    })),
    ...state.laundryTickets.map((record) => ({
      module: "Laundry Tickets",
      view: "laundry",
      sortKey: record.updatedAt || record.ticketDate,
      title: `${record.customerName} • ${record.status}`,
      detail: `${record.serviceType} • ${formatCurrency(getLaundryBalance(record))} outstanding`,
      searchText: [record.customerName, record.customerPhone, record.itemSummary, record.status, record.notes].join(" ")
    })),
    ...state.equipmentRentalBookings.map((record) => ({
      module: "Equipment Rentals",
      view: "equipment-rentals",
      sortKey: record.updatedAt || record.bookingDate,
      title: `${record.equipmentItem} • ${record.customerName}`,
      detail: `${record.status} • Return ${formatOptionalDate(record.dueDate)}`,
      searchText: [record.equipmentItem, record.customerName, record.customerPhone, record.reference, record.notes].join(" ")
    })),
    ...state.purchaseOrders.map((record) => ({
      module: "Procurement",
      view: "procurement",
      sortKey: record.updatedAt || record.requestDate,
      title: `${record.supplierName} • ${formatCurrency(record.totalAmount)}`,
      detail: `${record.status} • ${record.itemDescription}`,
      searchText: [record.supplierName, record.supplierPhone, record.itemDescription, record.requester, record.notes].join(" ")
    })),
    ...state.pettyCash.map((record) => ({
      module: "Petty Cash",
      view: "petty-cash",
      sortKey: record.updatedAt || record.date,
      title: `${getPettyCashType(record.transactionTypeId).label} • ${formatCurrency(record.amount)}`,
      detail: `${formatDisplayDate(record.date)} • ${record.vendor}`,
      searchText: [record.vendor, record.category, record.notes].join(" ")
    })),
    ...state.cashbookEntries.map((record) => ({
      module: "Cashbook / Bankbook",
      view: "cashbook",
      sortKey: record.updatedAt || record.entryDate,
      title: `${record.accountName} • ${formatSignedCurrency(getCashbookEntryEffect(record))}`,
      detail: `${formatDisplayDate(record.entryDate)} • ${getCashbookEntryType(record.entryType).label}`,
      searchText: [record.accountName, record.counterparty, record.reference, record.notes].join(" ")
    })),
    ...state.ledgerEntries.map((record) => ({
      module: "Ledgers",
      view: "ledgers",
      sortKey: record.updatedAt || record.entryDate,
      title: `${record.partyName} • ${getLedgerEntryType(record.entryType).label}`,
      detail: `${formatSignedCurrency(getLedgerEntryEffect(record))} • ${record.suite || getBusinessArea(record.businessAreaId).shortLabel}`,
      searchText: [record.partyName, record.partyPhone, record.reference, record.notes, record.suite].join(" ")
    })),
    ...state.mobileMoneyReconciliations.map((record) => ({
      module: "Mobile Money",
      view: "mobile-money",
      sortKey: record.updatedAt || record.date,
      title: `${record.provider} • ${formatSignedCurrency(getMobileMoneyVariance(record))}`,
      detail: `${formatDisplayDate(record.date)} • Closing ${formatCurrency(record.closingCashCounted)}`,
      searchText: [record.provider, record.notes].join(" ")
    })),
    ...state.salaryRecords.map((record) => ({
      module: "Salary",
      view: "salary",
      sortKey: record.updatedAt || record.month,
      title: `${record.staffName} • ${formatCurrency(getSalaryBalance(record))} balance`,
      detail: `${formatMonthLabel(record.month)} • ${record.roleTitle || record.salaryType}`,
      searchText: [record.staffName, record.roleTitle, record.paymentReference, record.notes].join(" ")
    })),
    ...state.suppliers.map((record) => ({
      module: "Suppliers",
      view: "suppliers",
      sortKey: record.updatedAt || record.invoiceDate,
      title: `${record.supplierName} • ${formatCurrency(getSupplierOutstanding(record))} outstanding`,
      detail: `${record.itemDescription || record.category} • ${record.invoiceReference || "No ref"}`,
      searchText: [record.supplierName, record.itemDescription, record.invoiceReference, record.notes].join(" ")
    })),
    ...state.assetRecords.map((record) => ({
      module: "Assets",
      view: "assets",
      sortKey: record.updatedAt || record.acquiredDate,
      title: `${record.assetName} • ${record.status}`,
      detail: `${record.location || getBusinessArea(record.businessAreaId).shortLabel} • ${record.assetCategory}`,
      searchText: [record.assetName, record.location, record.assetCategory, record.notes].join(" ")
    })),
    ...state.maintenanceRecords.map((record) => ({
      module: "Maintenance",
      view: "maintenance",
      sortKey: record.updatedAt || record.reportedDate,
      title: `${record.issue} • ${record.status}`,
      detail: `${record.location || getBusinessArea(record.businessAreaId).shortLabel} • ${record.vendor || "No vendor"}`,
      searchText: [record.issue, record.location, record.vendor, record.assetItem, record.notes].join(" ")
    })),
    ...state.recurringControls.map((record) => ({
      module: "Recurring",
      view: "recurring",
      sortKey: record.updatedAt || record.nextDueDate,
      title: `${record.title} • ${record.active ? "Active" : "Paused"}`,
      detail: `${getRecurringModuleLabel(record.moduleType)} • ${formatOptionalDate(record.nextDueDate)}`,
      searchText: [record.title, record.counterparty, record.suite, record.notes].join(" ")
    })),
    ...state.userProfiles.map((record) => ({
      module: "Access",
      view: "access",
      sortKey: record.updatedAt || record.createdAt,
      title: `${record.fullName} • ${record.role}`,
      detail: `${record.username} • ${record.active ? "Active" : "Inactive"}`,
      searchText: [record.fullName, record.username, record.phone, record.notes, record.role].join(" ")
    }))
  ].filter((item) => matchesModule(item.view));

  if (!query) {
    return results
      .sort((left, right) => (right.sortKey || "").localeCompare(left.sortKey || ""))
      .slice(0, 30);
  }

  return results
    .filter((item) =>
      [item.module, item.title, item.detail, item.searchText].join(" ").toLowerCase().includes(query)
    )
    .sort((left, right) => (right.sortKey || "").localeCompare(left.sortKey || ""))
    .slice(0, 80);
}

function renderSearchPage() {
  if (!elements.searchViewRoot) {
    return;
  }

  const results = buildGlobalSearchResults();

  elements.searchViewRoot.innerHTML = `
    <section class="page-grid compact-page-grid">
      <section class="section-card">
        <div class="section-heading">
          <div>
            <p class="kicker">Universal Lookup</p>
            <h3>Search The Whole Workspace</h3>
          </div>
          <p class="muted-text">
            Search live records by person, suite, supplier, ticket, booking, note, or reference across the OneRoot workspace.
          </p>
        </div>

        <form id="searchForm" class="filter-grid">
          <label>
            <span>Search</span>
            <input
              id="globalSearchQuery"
              name="globalSearchQuery"
              type="search"
              value="${escapeHtml(state.searchFilters.query)}"
              placeholder="Name, suite, supplier, ticket, ref, note"
            />
          </label>

          <label>
            <span>Module</span>
            <select id="globalSearchModuleFilter" name="globalSearchModuleFilter">
              ${buildSelectMarkup(getSearchModuleOptions(), state.searchFilters.module || "all", "All Modules")}
            </select>
          </label>
        </form>

        <div class="form-actions">
          <button class="button button-primary" type="submit" form="searchForm">
            Run Search
          </button>
          <button id="clearSearchFiltersBtn" class="button button-ghost" type="button">
            Clear Search
          </button>
          <button class="button button-secondary" data-global-action="export-view-csv" type="button">
            Export Results CSV
          </button>
        </div>
      </section>

      <aside class="sidebar-column">
        <section class="section-card">
          <div class="section-heading compact">
            <div>
              <p class="kicker">Results</p>
              <h3>${escapeHtml(String(results.length))} Match${results.length === 1 ? "" : "es"}</h3>
            </div>
          </div>
          <p class="muted-text">
            ${state.searchFilters.query ? "Showing matches for your current search query." : "Showing the most recently updated records across the workspace."}
          </p>
        </section>
      </aside>
    </section>

    <section class="section-card">
      <div class="section-heading compact">
        <div>
          <p class="kicker">Search Results</p>
          <h3>${results.length} Result${results.length === 1 ? "" : "s"}</h3>
        </div>
      </div>
      <div class="module-grid">
        ${
          results.length === 0
            ? `<div class="empty-state">No records match that search yet. Try a different name, note, or reference.</div>`
            : results
                .map(
                  (result) => `
                    <article class="module-card">
                      <strong>${escapeHtml(result.title)}</strong>
                      <span class="module-meta">${escapeHtml(result.module)}</span>
                      <span class="module-meta">${escapeHtml(result.detail)}</span>
                      <button class="button button-secondary" data-go-view="${escapeHtml(result.view)}" type="button">
                        Open ${escapeHtml(result.module)}
                      </button>
                    </article>
                  `
                )
                .join("")
        }
      </div>
    </section>
  `;
}

function buildReminderPhoneLookup() {
  const lookup = new Map();

  getLatestRentalProfiles().forEach((record) => {
    if (normalizeText(record.tenantPhone)) {
      lookup.set(`apartments:${normalizeText(record.suite).toLowerCase()}`, record.tenantPhone);
    }
  });

  state.laundryTickets.forEach((record) => {
    if (normalizeText(record.customerPhone)) {
      lookup.set(`laundry:${normalizeText(record.customerName).toLowerCase()}`, record.customerPhone);
    }
  });

  state.equipmentRentalBookings.forEach((record) => {
    if (normalizeText(record.customerPhone)) {
      lookup.set(
        `equipment-rentals:${normalizeText(record.customerName).toLowerCase()}`,
        record.customerPhone
      );
    }
  });

  state.securityDepositRecords.forEach((record) => {
    if (normalizeText(record.tenantPhone)) {
      lookup.set(`deposits:${normalizeText(record.tenantName).toLowerCase()}`, record.tenantPhone);
    }
  });

  state.purchaseOrders.forEach((record) => {
    if (normalizeText(record.supplierPhone)) {
      lookup.set(`procurement:${normalizeText(record.supplierName).toLowerCase()}`, record.supplierPhone);
    }
  });

  return lookup;
}

function buildReminderCenterItems() {
  const phoneLookup = buildReminderPhoneLookup();
  const workspaceAlerts = buildWorkspaceAlerts({
    apartmentAlerts: buildApartmentAlerts(getLatestRentalProfiles()),
    salaryRecords: state.salaryRecords,
    mobileMoneyReconciliations: state.mobileMoneyReconciliations,
    supplierRecords: state.suppliers,
    assetRecords: state.assetRecords,
    recurringControls: state.recurringControls,
    maintenanceRecords: state.maintenanceRecords,
    purchaseOrders: state.purchaseOrders,
    laundryTickets: state.laundryTickets,
    equipmentRentalBookings: state.equipmentRentalBookings,
    securityDepositRecords: state.securityDepositRecords
  });
  const workspaceItems = workspaceAlerts.map((alert) => ({
    key: [
      alert.source,
      normalizeText(alert.subject).toLowerCase(),
      normalizeDateInput(alert.dueDate),
      normalizeText(alert.headline).toLowerCase()
    ].join("|"),
    source: alert.source,
    moduleLabel: VIEW_META[alert.view]?.title || alert.source,
    subject: alert.subject,
    phone:
      phoneLookup.get(`${alert.source}:${normalizeText(alert.subject).toLowerCase()}`) ||
      phoneLookup.get(`apartments:${normalizeText(alert.subject).toLowerCase()}`) ||
      "",
    dueDate: normalizeDateInput(alert.dueDate),
    severity: alert.severity,
    label: alert.label,
    pillClass: alert.pillClass,
    message: `Hello ${alert.subject}, this is OneRoot. ${alert.message} Please take action. Thank you.`,
    meta: alert.message,
    view: alert.view
  }));
  const ledgerItems = buildReminderCandidates().map((candidate) => ({
    key: candidate.key,
    source: candidate.source === "tenant" ? "apartments" : "ledgers",
    moduleLabel: candidate.source === "tenant" ? "Apartments" : "Ledgers",
    subject: candidate.partyName,
    phone: candidate.partyPhone || "",
    dueDate: normalizeDateInput(candidate.dueDate),
    severity: Number(candidate.balance || 0) > 0 ? "due" : "info",
    label: Number(candidate.balance || 0) > 0 ? "Balance Due" : "Info",
    pillClass: Number(candidate.balance || 0) > 0 ? "alert-pill-due" : "alert-pill-on-track",
    message: candidate.message,
    meta: `${formatCurrency(candidate.balance || 0)} outstanding`,
    view: candidate.source === "tenant" ? "apartments" : "ledgers"
  }));
  const allItems = [...workspaceItems, ...ledgerItems];
  const searchValue = normalizeText(state.reminderFilters.search).toLowerCase();
  const sourceFilter = normalizeText(state.reminderFilters.source).toLowerCase();
  const severityFilter = normalizeText(state.reminderFilters.severity).toLowerCase();

  return allItems
    .filter((item) => {
      const haystack = [item.moduleLabel, item.subject, item.phone, item.meta, item.message].join(" ").toLowerCase();

      return (
        (searchValue === "" || haystack.includes(searchValue)) &&
        (sourceFilter === "" || item.source === sourceFilter) &&
        (severityFilter === "" || item.severity === severityFilter)
      );
    })
    .sort((left, right) => {
      const priorityDifference = getWorkspaceAlertPriority(left) - getWorkspaceAlertPriority(right);

      if (priorityDifference !== 0) {
        return priorityDifference;
      }

      return (left.dueDate || "").localeCompare(right.dueDate || "");
    });
}

async function copyReminderCenterMessage(key) {
  const item = buildReminderCenterItems().find((record) => record.key === key);

  if (!item) {
    showToast("That reminder item could not be found.");
    return;
  }

  await writeTextToClipboard(item.message, "Reminder text copied.");
}

async function copyAllReminderCenterMessages() {
  const items = buildReminderCenterItems();

  if (items.length === 0) {
    showToast("There are no reminder messages ready in this view.");
    return;
  }

  await writeTextToClipboard(
    items.map((item) => item.message).join("\n\n"),
    `${items.length} reminder message${items.length === 1 ? "" : "s"} copied.`
  );
}

function renderReminderCenterPage() {
  if (!elements.remindersViewRoot) {
    return;
  }

  const items = buildReminderCenterItems();
  const overdueCount = items.filter((item) => item.severity === "overdue").length;
  const withPhoneCount = items.filter((item) => normalizeText(item.phone)).length;

  elements.remindersViewRoot.innerHTML = `
    <section class="page-grid compact-page-grid">
      <section class="section-card">
        <div class="section-heading">
          <div>
            <p class="kicker">Follow-Up Center</p>
            <h3>Collections, Due Dates & Ready Notices</h3>
          </div>
          <p class="muted-text">
            Use one queue for tenant follow-up, payroll, payables, laundry completion, equipment returns, procurement deadlines, and other live reminders.
          </p>
        </div>

        <div class="filter-grid">
          <label>
            <span>Search</span>
            <input
              id="globalReminderSearch"
              type="search"
              value="${escapeHtml(state.reminderFilters.search)}"
              placeholder="Person, suite, phone, note"
            />
          </label>
          <label>
            <span>Source</span>
            <select id="reminderSourceFilter">
              ${buildSelectMarkup(
                [
                  { value: "apartments", label: "Apartments" },
                  { value: "ledgers", label: "Ledgers" },
                  { value: "salary", label: "Salary" },
                  { value: "suppliers", label: "Suppliers" },
                  { value: "procurement", label: "Procurement" },
                  { value: "laundry", label: "Laundry" },
                  { value: "equipment-rentals", label: "Equipment Rentals" },
                  { value: "deposits", label: "Deposits & Charges" },
                  { value: "maintenance", label: "Maintenance" },
                  { value: "recurring", label: "Recurring" },
                  { value: "assets", label: "Assets" },
                  { value: "mobile-money", label: "Mobile Money" }
                ],
                state.reminderFilters.source,
                "All Sources"
              )}
            </select>
          </label>
          <label>
            <span>Severity</span>
            <select id="reminderSeverityFilter">
              ${buildSelectMarkup(
                [
                  { value: "overdue", label: "Overdue" },
                  { value: "due", label: "Due / Ready" },
                  { value: "info", label: "Info" }
                ],
                state.reminderFilters.severity,
                "All Levels"
              )}
            </select>
          </label>
        </div>

        <div class="form-actions">
          <button class="button button-primary" data-reminder-action="copy-all" type="button">
            Copy All Messages
          </button>
          <button class="button button-secondary" data-global-action="export-view-csv" type="button">
            Export Reminder CSV
          </button>
          <button id="clearReminderFiltersBtn" class="button button-ghost" type="button">
            Clear Filters
          </button>
        </div>
      </section>

      <aside class="sidebar-column">
        <section class="section-card">
          <div class="mini-stat-grid">
            <article class="stat-card">
              <span>Visible Reminders</span>
              <strong>${escapeHtml(String(items.length))}</strong>
            </article>
            <article class="stat-card">
              <span>Overdue</span>
              <strong class="${overdueCount > 0 ? "negative-text" : ""}">${escapeHtml(
                String(overdueCount)
              )}</strong>
            </article>
            <article class="stat-card">
              <span>With Phone</span>
              <strong>${escapeHtml(String(withPhoneCount))}</strong>
            </article>
          </div>
        </section>
      </aside>
    </section>

    <section class="section-card">
      <div class="table-wrap compact-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Subject</th>
              <th>Source</th>
              <th>Due</th>
              <th>Status</th>
              <th>Message</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${
              items.length === 0
                ? `
                    <tr>
                      <td colspan="6" class="empty-state">No reminders match the current filter set.</td>
                    </tr>
                  `
                : items
                    .map(
                      (item) => `
                        <tr>
                          <td>
                            <span class="table-primary">${escapeHtml(item.subject)}</span>
                            <span class="table-secondary">${escapeHtml(item.phone || "No phone saved")}</span>
                          </td>
                          <td>${escapeHtml(item.moduleLabel)}</td>
                          <td>${escapeHtml(formatOptionalDate(item.dueDate))}</td>
                          <td><span class="alert-pill ${escapeHtml(item.pillClass)}">${escapeHtml(item.label)}</span></td>
                          <td>
                            <span class="table-primary">${escapeHtml(item.meta)}</span>
                            <span class="table-secondary">${escapeHtml(item.message)}</span>
                          </td>
                          <td>
                            <div class="row-actions">
                              <button class="utility-btn" data-reminder-action="copy-single" data-key="${escapeHtml(
                                item.key
                              )}" type="button">
                                Copy Message
                              </button>
                              <button class="edit-btn" data-go-view="${escapeHtml(item.view)}" type="button">
                                Open
                              </button>
                            </div>
                          </td>
                        </tr>
                      `
                    )
                    .join("")
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function buildGeneratedMessage() {
  const draft = state.messageBuilderDraft;

  if (draft.mode === "reminder") {
    const selected = buildReminderCenterItems().find((item) => item.key === draft.sourceKey);

    if (!selected) {
      return {
        recipientName: "",
        recipientPhone: "",
        channel: draft.channel,
        message: "Choose a live reminder source to generate a ready message."
      };
    }

    return {
      recipientName: selected.subject,
      recipientPhone: selected.phone,
      channel: draft.channel,
      message: `${selected.message}${normalizeText(draft.customNote) ? ` ${normalizeText(draft.customNote)}` : ""}`
    };
  }

  const recipientName = normalizeText(draft.recipientName) || "there";
  const reference = normalizeText(draft.reference);
  const amountLabel = normalizeText(draft.amount) ? formatCurrency(parseOptionalAmount(draft.amount)) : "";
  const dueLabel = draft.dueDate ? formatDisplayDate(draft.dueDate) : "";
  const note = normalizeText(draft.customNote);
  const customMessage = normalizeText(draft.customMessage);
  let message = "";

  if (draft.template === "laundry-ready") {
    message = `Hello ${recipientName}, this is OneRoot. Your laundry${
      reference ? ` for ${reference}` : ""
    } is ready for pickup.${note ? ` ${note}` : ""} Thank you.`;
  } else if (draft.template === "equipment-return") {
    message = `Hello ${recipientName}, this is OneRoot. Your ${reference || "equipment rental"} is due${
      dueLabel ? ` on ${dueLabel}` : ""
    }. Please arrange return.${note ? ` ${note}` : ""} Thank you.`;
  } else if (draft.template === "deposit-settlement") {
    message = `Hello ${recipientName}, this is OneRoot. Your deposit / tenant charge balance${
      amountLabel ? ` is ${amountLabel}` : ""
    }${dueLabel ? ` and is due by ${dueLabel}` : ""}.${note ? ` ${note}` : ""} Thank you.`;
  } else if (draft.template === "general") {
    message = customMessage || `Hello ${recipientName}, this is OneRoot. ${note || "Please get back to us."}`;
  } else {
    message = `Hello ${recipientName}, this is OneRoot. ${
      reference ? `${reference}` : "A balance"
    }${amountLabel ? ` of ${amountLabel}` : ""}${dueLabel ? ` is due by ${dueLabel}` : ""}.${note ? ` ${note}` : ""} Thank you.`;
  }

  return {
    recipientName,
    recipientPhone: normalizeText(draft.recipientPhone),
    channel: draft.channel,
    message
  };
}

function handleMessagePreview() {
  render();
  showToast("Message preview refreshed.");
}

async function copyGeneratedMessage(channelLabel) {
  const generated = buildGeneratedMessage();

  if (!normalizeText(generated.message)) {
    showToast("There is no message to copy yet.");
    return;
  }

  await writeTextToClipboard(generated.message, `${channelLabel} message copied.`);
}

function renderMessageBuilderPage() {
  if (!elements.messagesViewRoot) {
    return;
  }

  const draft = state.messageBuilderDraft;
  const sourceOptions = buildReminderCenterItems().map((item) => ({
    value: item.key,
    label: `${item.subject} • ${item.moduleLabel}${item.dueDate ? ` • ${formatOptionalDate(item.dueDate)}` : ""}`
  }));
  const generated = buildGeneratedMessage();

  elements.messagesViewRoot.innerHTML = `
    <section class="page-grid compact-page-grid">
      <section class="section-card">
        <div class="section-heading">
          <div>
            <p class="kicker">Message Builder</p>
            <h3>WhatsApp & SMS Drafts</h3>
          </div>
          <p class="muted-text">
            Generate copy-ready follow-up messages from live reminder items or create a custom outreach message for tenants, suppliers, or customers.
          </p>
        </div>

        <div class="mini-form-grid rental-form-grid">
          <label>
            <span>Mode</span>
            <select id="messageMode">
              ${buildSelectMarkup(
                [
                  { value: "reminder", label: "From Reminder" },
                  { value: "custom", label: "Custom Template" }
                ],
                draft.mode,
                "Choose mode"
              )}
            </select>
          </label>

          <label>
            <span>Channel</span>
            <select id="messageChannel">
              ${buildSelectMarkup(
                [
                  { value: "SMS", label: "SMS" },
                  { value: "WhatsApp", label: "WhatsApp" }
                ],
                draft.channel,
                "Choose channel"
              )}
            </select>
          </label>

          ${
            draft.mode === "reminder"
              ? `
                  <label class="wide-field">
                    <span>Live Reminder Source</span>
                    <select id="messageSourceKey">
                      ${buildSelectMarkup(sourceOptions, draft.sourceKey, "Choose reminder source")}
                    </select>
                  </label>
                `
              : `
                  <label>
                    <span>Template</span>
                    <select id="messageTemplate">
                      ${buildSelectMarkup(
                        [
                          { value: "payment-reminder", label: "Payment Reminder" },
                          { value: "laundry-ready", label: "Laundry Ready" },
                          { value: "equipment-return", label: "Equipment Return" },
                          { value: "deposit-settlement", label: "Deposit Settlement" },
                          { value: "general", label: "General Notice" }
                        ],
                        draft.template,
                        "Choose template"
                      )}
                    </select>
                  </label>
                  <label>
                    <span>Recipient Name</span>
                    <input id="messageRecipientName" type="text" value="${escapeHtml(draft.recipientName)}" />
                  </label>
                  <label>
                    <span>Recipient Phone</span>
                    <input id="messageRecipientPhone" type="tel" value="${escapeHtml(draft.recipientPhone)}" />
                  </label>
                  <label>
                    <span>Amount</span>
                    <input id="messageAmount" type="number" min="0" step="0.01" value="${escapeHtml(
                      draft.amount
                    )}" />
                  </label>
                  <label>
                    <span>Due Date</span>
                    <input id="messageDueDate" type="date" value="${escapeHtml(draft.dueDate)}" />
                  </label>
                  <label class="wide-field">
                    <span>Reference / Subject</span>
                    <input id="messageReference" type="text" value="${escapeHtml(draft.reference)}" />
                  </label>
                `
          }

          <label class="wide-field">
            <span>Additional Note</span>
            <textarea id="messageCustomNote" rows="3">${escapeHtml(draft.customNote)}</textarea>
          </label>

          ${
            draft.mode === "custom" && draft.template === "general"
              ? `
                  <label class="wide-field">
                    <span>Custom Message Body</span>
                    <textarea id="messageCustomMessage" rows="4">${escapeHtml(
                      draft.customMessage
                    )}</textarea>
                  </label>
                `
              : ""
          }
        </div>

        <div class="form-actions">
          <button class="button button-primary" data-message-action="preview" type="button">
            Refresh Preview
          </button>
          <button class="button button-secondary" data-message-action="copy-sms" type="button">
            Copy SMS
          </button>
          <button class="button button-secondary" data-message-action="copy-whatsapp" type="button">
            Copy WhatsApp
          </button>
        </div>
      </section>

      <aside class="sidebar-column">
        <section class="section-card">
          <div class="section-heading compact">
            <div>
              <p class="kicker">Preview</p>
              <h3>${escapeHtml(generated.channel)} Draft</h3>
            </div>
          </div>
          <div class="guide-list">
            <p><strong>Recipient:</strong> ${escapeHtml(generated.recipientName || "Not set")}</p>
            <p><strong>Phone:</strong> ${escapeHtml(generated.recipientPhone || "Not set")}</p>
            <p>${escapeHtml(generated.message)}</p>
          </div>
        </section>
      </aside>
    </section>
  `;
}

function normalizePurchaseOrderStatus(value) {
  const normalized = normalizeText(value).toLowerCase();
  const matched = PURCHASE_ORDER_STATUS_OPTIONS.find((option) => option.toLowerCase() === normalized);
  return matched || "Requested";
}

function normalizeLaundryServiceType(value) {
  const normalized = normalizeText(value).toLowerCase();
  const matched = LAUNDRY_SERVICE_OPTIONS.find((option) => option.toLowerCase() === normalized);
  return matched || "Normal";
}

function normalizeLaundryStatus(value) {
  const normalized = normalizeText(value).toLowerCase();
  const matched = LAUNDRY_STATUS_OPTIONS.find((option) => option.toLowerCase() === normalized);
  return matched || "Received";
}

function normalizeLaundryDeliveryMode(value) {
  const normalized = normalizeText(value).toLowerCase();
  const matched = LAUNDRY_DELIVERY_OPTIONS.find((option) => option.toLowerCase() === normalized);
  return matched || "Walk-in";
}

function normalizeEquipmentRentalStatus(value) {
  const normalized = normalizeText(value).toLowerCase();
  const matched = EQUIPMENT_RENTAL_STATUS_OPTIONS.find((option) => option.toLowerCase() === normalized);
  return matched || "Booked";
}

function normalizeEquipmentCondition(value) {
  const normalized = normalizeText(value).toLowerCase();
  const matched = EQUIPMENT_CONDITION_OPTIONS.find((option) => option.toLowerCase() === normalized);
  return matched || "Good";
}

function normalizeSecurityDepositStatus(value) {
  const normalized = normalizeText(value).toLowerCase();
  const matched = SECURITY_DEPOSIT_STATUS_OPTIONS.find((option) => option.toLowerCase() === normalized);
  return matched || "Active Hold";
}

function createEmptyPurchaseOrderDraft() {
  return {
    requestDate: getTodayInputValue(),
    businessAreaId: DEFAULT_BUSINESS_AREA_ID,
    requester: "",
    supplierName: "",
    supplierPhone: "",
    itemDescription: "",
    quantity: 1,
    unitCost: 0,
    totalAmount: 0,
    amountPaid: 0,
    expectedDate: "",
    status: "Requested",
    notes: ""
  };
}

function buildPurchaseOrderDraftFromForm(formData) {
  const quantity = Math.max(parsePositiveInteger(formData.get("purchaseQuantity")), 1);
  const unitCost = parseOptionalAmount(formData.get("purchaseUnitCost"));
  const totalAmountRaw = parseOptionalAmount(formData.get("purchaseTotalAmount"));
  return {
    requestDate: normalizeDateInput(formData.get("purchaseRequestDate")),
    businessAreaId: normalizeBusinessAreaId(formData.get("purchaseBusinessArea")),
    requester: normalizeText(formData.get("purchaseRequester")),
    supplierName: normalizeText(formData.get("purchaseSupplierName")),
    supplierPhone: normalizeText(formData.get("purchaseSupplierPhone")),
    itemDescription: normalizeText(formData.get("purchaseItemDescription")),
    quantity,
    unitCost,
    totalAmount: totalAmountRaw > 0 ? totalAmountRaw : Number((quantity * unitCost).toFixed(2)),
    amountPaid: parseOptionalAmount(formData.get("purchaseAmountPaid")),
    expectedDate: normalizeDateInput(formData.get("purchaseExpectedDate")),
    status: normalizePurchaseOrderStatus(formData.get("purchaseStatus")),
    notes: normalizeText(formData.get("purchaseNotes"))
  };
}

function validatePurchaseOrder(record) {
  const errors = [];

  if (!record.requestDate) {
    errors.push("Add the purchase order request date.");
  }

  if (!record.businessAreaId) {
    errors.push("Choose the business area for this purchase order.");
  }

  if (!record.supplierName) {
    errors.push("Add the supplier name.");
  }

  if (!record.itemDescription) {
    errors.push("Describe what is being procured.");
  }

  if (record.totalAmount <= 0) {
    errors.push("Enter a purchase value greater than zero.");
  }

  if (record.amountPaid > record.totalAmount) {
    errors.push("Amount paid cannot be greater than the total purchase value.");
  }

  return errors;
}

function getPurchaseOrderOutstanding(record) {
  return Number(
    Math.max(parseOptionalAmount(record.totalAmount) - parseOptionalAmount(record.amountPaid), 0).toFixed(2)
  );
}

function buildPurchaseOrderAlerts(records) {
  return records
    .filter((record) => !["Received", "Cancelled"].includes(record.status) && record.expectedDate)
    .map((record) => {
      const daysRemaining = daysUntilDate(record.expectedDate);

      if (!Number.isFinite(daysRemaining) || daysRemaining > 5) {
        return null;
      }

      const severity = daysRemaining < 0 ? "overdue" : "due";
      return {
        source: "procurement",
        subject: record.supplierName,
        headline: "Purchase Order Follow-up",
        label: severity === "overdue" ? "Overdue" : "Due Soon",
        pillClass: severity === "overdue" ? "alert-pill-overdue" : "alert-pill-due",
        severity,
        dueDate: record.expectedDate,
        message:
          severity === "overdue"
            ? `${record.itemDescription} was expected since ${formatDisplayDate(record.expectedDate)}.`
            : `${record.itemDescription} is expected by ${formatDisplayDate(record.expectedDate)}.`,
        view: "procurement"
      };
    })
    .filter(Boolean);
}

function getFilteredPurchaseOrders() {
  const searchValue = normalizeText(state.purchaseOrderFilters.search).toLowerCase();
  const monthValue = normalizeMonthInput(state.purchaseOrderFilters.month);
  const areaValue = normalizeBusinessAreaId(state.purchaseOrderFilters.area);
  const statusValue = normalizeText(state.purchaseOrderFilters.status).toLowerCase();

  return state.purchaseOrders.filter((record) => {
    const haystack = [
      record.requester,
      record.supplierName,
      record.supplierPhone,
      record.itemDescription,
      record.notes,
      getBusinessArea(record.businessAreaId).label
    ]
      .join(" ")
      .toLowerCase();

    return (
      (searchValue === "" || haystack.includes(searchValue)) &&
      (monthValue === "" || record.requestDate.startsWith(monthValue)) &&
      (areaValue === "" || record.businessAreaId === areaValue) &&
      (statusValue === "" || record.status.toLowerCase().replace(/\s+/g, "-") === statusValue)
    );
  });
}

function renderProcurementPage() {
  if (!elements.procurementViewRoot) {
    return;
  }

  const editingRecord = state.purchaseOrders.find((item) => item.id === state.editingPurchaseOrderId) || null;
  const draft = editingRecord || createEmptyPurchaseOrderDraft();
  const records = getFilteredPurchaseOrders();
  const alerts = buildPurchaseOrderAlerts(records);
  const openRecords = records.filter((record) => !["Received", "Cancelled"].includes(record.status));
  const outstandingValue = openRecords.reduce((sum, record) => sum + getPurchaseOrderOutstanding(record), 0);
  const paidValue = records.reduce((sum, record) => sum + record.amountPaid, 0);

  elements.procurementViewRoot.innerHTML = `
    <section class="page-grid compact-page-grid">
      <section class="section-card">
        <div class="section-heading">
          <div>
            <p class="kicker">Purchase Orders</p>
            <h3>${editingRecord ? "Edit Procurement Record" : "Raise & Track Procurement Requests"}</h3>
          </div>
          <p class="muted-text">
            Track what was requested, who should supply it, what it will cost, when it is expected, and whether it has been received.
          </p>
        </div>

        <form id="purchaseOrderForm" novalidate>
          <div class="mini-form-grid rental-form-grid">
            <label>
              <span>Request Date</span>
              <input id="purchaseRequestDate" name="purchaseRequestDate" type="date" value="${escapeHtml(
                draft.requestDate
              )}" required />
            </label>
            <label>
              <span>Business Area</span>
              <select id="purchaseBusinessArea" name="purchaseBusinessArea" required>
                ${buildSelectMarkup(getBusinessAreaOptions(), draft.businessAreaId, "Choose business area")}
              </select>
            </label>
            <label>
              <span>Requested By</span>
              <input id="purchaseRequester" name="purchaseRequester" type="text" value="${escapeHtml(
                draft.requester
              )}" />
            </label>
            <label>
              <span>Supplier Name</span>
              <input id="purchaseSupplierName" name="purchaseSupplierName" type="text" value="${escapeHtml(
                draft.supplierName
              )}" required />
            </label>
            <label>
              <span>Supplier Phone</span>
              <input id="purchaseSupplierPhone" name="purchaseSupplierPhone" type="tel" value="${escapeHtml(
                draft.supplierPhone
              )}" />
            </label>
            <label class="wide-field">
              <span>Item / Service Description</span>
              <input
                id="purchaseItemDescription"
                name="purchaseItemDescription"
                type="text"
                value="${escapeHtml(draft.itemDescription)}"
                required
              />
            </label>
            <label>
              <span>Quantity</span>
              <input id="purchaseQuantity" name="purchaseQuantity" type="number" min="1" step="1" value="${escapeHtml(
                String(draft.quantity || 1)
              )}" />
            </label>
            <label>
              <span>Unit Cost</span>
              <input id="purchaseUnitCost" name="purchaseUnitCost" type="number" min="0" step="0.01" value="${escapeHtml(
                formatAmountInputValue(draft.unitCost)
              )}" />
            </label>
            <label>
              <span>Total Value</span>
              <input id="purchaseTotalAmount" name="purchaseTotalAmount" type="number" min="0" step="0.01" value="${escapeHtml(
                formatAmountInputValue(draft.totalAmount)
              )}" required />
            </label>
            <label>
              <span>Amount Paid</span>
              <input id="purchaseAmountPaid" name="purchaseAmountPaid" type="number" min="0" step="0.01" value="${escapeHtml(
                formatAmountInputValue(draft.amountPaid)
              )}" />
            </label>
            <label>
              <span>Expected Date</span>
              <input id="purchaseExpectedDate" name="purchaseExpectedDate" type="date" value="${escapeHtml(
                draft.expectedDate
              )}" />
            </label>
            <label>
              <span>Status</span>
              <select id="purchaseStatus" name="purchaseStatus">
                ${buildSelectMarkup(PURCHASE_ORDER_STATUS_OPTIONS, draft.status, "Choose status")}
              </select>
            </label>
            <label class="wide-field">
              <span>Notes</span>
              <textarea id="purchaseNotes" name="purchaseNotes" rows="3">${escapeHtml(
                draft.notes
              )}</textarea>
            </label>
          </div>
          <div class="form-actions">
            <button class="button button-primary" id="submitPurchaseOrderBtn" type="submit">
              ${editingRecord ? "Update Purchase Order" : "Save Purchase Order"}
            </button>
            <button class="button button-secondary" id="resetPurchaseOrderBtn" type="button">
              Clear Form
            </button>
            <button
              class="button button-ghost ${editingRecord ? "" : "hidden"}"
              id="cancelPurchaseOrderEditBtn"
              type="button"
            >
              Cancel Edit
            </button>
          </div>
        </form>
      </section>

      <aside class="sidebar-column">
        <section class="section-card">
          <div class="mini-stat-grid">
            <article class="stat-card">
              <span>Open Orders</span>
              <strong>${escapeHtml(String(openRecords.length))}</strong>
            </article>
            <article class="stat-card">
              <span>Outstanding Value</span>
              <strong>${formatCurrency(outstandingValue)}</strong>
            </article>
            <article class="stat-card">
              <span>Paid Value</span>
              <strong>${formatCurrency(paidValue)}</strong>
            </article>
            <article class="stat-card">
              <span>Follow-Up Due</span>
              <strong>${escapeHtml(String(alerts.length))}</strong>
            </article>
          </div>
          <div class="form-actions">
            <button class="button button-secondary" data-global-action="export-view-csv" type="button">
              Export Procurement CSV
            </button>
          </div>
        </section>
        <section class="section-card">
          <div class="filter-grid">
            <label>
              <span>Search</span>
              <input id="purchaseOrderSearchFilter" type="search" value="${escapeHtml(
                state.purchaseOrderFilters.search
              )}" placeholder="Supplier, item, requester" />
            </label>
            <label>
              <span>Month</span>
              <input id="purchaseOrderMonthFilter" type="month" value="${escapeHtml(
                state.purchaseOrderFilters.month
              )}" />
            </label>
            <label>
              <span>Area</span>
              <select id="purchaseOrderAreaFilter">
                ${buildSelectMarkup(
                  getBusinessAreaOptions(),
                  state.purchaseOrderFilters.area,
                  "All Areas"
                )}
              </select>
            </label>
            <label>
              <span>Status</span>
              <select id="purchaseOrderStatusFilter">
                ${buildSelectMarkup(
                  PURCHASE_ORDER_STATUS_OPTIONS.map((option) => ({
                    value: option.toLowerCase().replace(/\s+/g, "-"),
                    label: option
                  })),
                  state.purchaseOrderFilters.status,
                  "Any Status"
                )}
              </select>
            </label>
          </div>
          <div class="form-actions">
            <button id="clearPurchaseFiltersBtn" class="button button-ghost" type="button">
              Clear Filters
            </button>
          </div>
        </section>
      </aside>
    </section>

    <section class="section-card">
      <div class="table-wrap compact-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Supplier</th>
              <th>Area</th>
              <th>Value</th>
              <th>Status</th>
              <th>Expected</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${
              records.length === 0
                ? `<tr><td colspan="7" class="empty-state">No procurement records match the current view yet.</td></tr>`
                : records
                    .map(
                      (record) => `
                        <tr>
                          <td>${escapeHtml(formatDisplayDate(record.requestDate))}</td>
                          <td>
                            <span class="table-primary">${escapeHtml(record.supplierName)}</span>
                            <span class="table-secondary">${escapeHtml(record.itemDescription)}</span>
                          </td>
                          <td>${escapeHtml(getBusinessArea(record.businessAreaId).shortLabel)}</td>
                          <td>
                            <span class="table-primary">${formatCurrency(record.totalAmount)}</span>
                            <span class="table-secondary">Outstanding ${formatCurrency(
                              getPurchaseOrderOutstanding(record)
                            )}</span>
                          </td>
                          <td><span class="alert-pill ${escapeHtml(
                            record.status === "Cancelled"
                              ? "alert-pill-overdue"
                              : record.status === "Received"
                                ? "alert-pill-on-track"
                                : "alert-pill-due"
                          )}">${escapeHtml(record.status)}</span></td>
                          <td>${escapeHtml(formatOptionalDate(record.expectedDate))}</td>
                          <td>
                            <div class="row-actions">
                              <button class="edit-btn" data-purchase-action="edit" data-id="${escapeHtml(
                                record.id
                              )}" type="button">Edit</button>
                              <button class="delete-btn" data-purchase-action="delete" data-id="${escapeHtml(
                                record.id
                              )}" type="button">Delete</button>
                            </div>
                          </td>
                        </tr>
                      `
                    )
                    .join("")
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function handlePurchaseOrderSubmit(event) {
  event.preventDefault();
  const draft = buildPurchaseOrderDraftFromForm(new FormData(event.target));
  const errors = validatePurchaseOrder(draft);

  if (errors.length > 0) {
    showToast(errors[0]);
    return;
  }

  if (state.editingPurchaseOrderId) {
    state.purchaseOrders = sortPurchaseOrders(
      state.purchaseOrders.map((record) =>
        record.id === state.editingPurchaseOrderId
          ? { ...record, ...draft, updatedAt: new Date().toISOString() }
          : record
      )
    );
    showToast("Purchase order updated.");
  } else {
    state.purchaseOrders = sortPurchaseOrders([
      ...state.purchaseOrders,
      { id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...draft }
    ]);
    showToast("Purchase order saved.");
  }

  persistPurchaseOrders();
  resetPurchaseOrderForm({ silent: true });
  render();
}

function startEditingPurchaseOrder(recordId) {
  const record = state.purchaseOrders.find((item) => item.id === recordId);

  if (!record) {
    showToast("That purchase order could not be found.");
    return;
  }

  state.editingPurchaseOrderId = record.id;
  navigateTo("procurement", { syncHash: true });
  render();
  scrollDynamicFormIntoView("purchaseOrderForm");
}

function deletePurchaseOrder(recordId) {
  const record = state.purchaseOrders.find((item) => item.id === recordId);

  if (!record) {
    showToast("That purchase order could not be found.");
    return;
  }

  if (!window.confirm(`Delete the procurement record for ${record.supplierName}?`)) {
    return;
  }

  state.purchaseOrders = state.purchaseOrders.filter((item) => item.id !== recordId);
  persistPurchaseOrders();

  if (state.editingPurchaseOrderId === recordId) {
    resetPurchaseOrderForm({ silent: true });
  }

  render();
  showToast("Purchase order deleted.");
}

function resetPurchaseOrderForm(options = {}) {
  state.editingPurchaseOrderId = null;

  if (!options.silent) {
    render();
    showToast("Procurement form cleared.");
  }
}

function clearPurchaseOrderFilters() {
  state.purchaseOrderFilters = { search: "", month: "", area: "", status: "" };
  render();
  showToast("Procurement filters cleared.");
}

function createEmptyLaundryTicketDraft() {
  return {
    ticketDate: getTodayInputValue(),
    businessAreaId: "laundry-services",
    customerName: "",
    customerPhone: "",
    serviceType: "Normal",
    itemSummary: "",
    pieces: 1,
    amountDue: 0,
    amountPaid: 0,
    dueDate: "",
    readyDate: "",
    deliveryMode: "Walk-in",
    status: "Received",
    notes: ""
  };
}

function buildLaundryTicketDraftFromForm(formData) {
  return {
    ticketDate: normalizeDateInput(formData.get("laundryTicketDate")),
    businessAreaId: "laundry-services",
    customerName: normalizeText(formData.get("laundryCustomerName")),
    customerPhone: normalizeText(formData.get("laundryCustomerPhone")),
    serviceType: normalizeLaundryServiceType(formData.get("laundryServiceType")),
    itemSummary: normalizeText(formData.get("laundryItemSummary")),
    pieces: Math.max(parsePositiveInteger(formData.get("laundryPieces")), 1),
    amountDue: parseOptionalAmount(formData.get("laundryAmountDue")),
    amountPaid: parseOptionalAmount(formData.get("laundryAmountPaid")),
    dueDate: normalizeDateInput(formData.get("laundryDueDate")),
    readyDate: normalizeDateInput(formData.get("laundryReadyDate")),
    deliveryMode: normalizeLaundryDeliveryMode(formData.get("laundryDeliveryMode")),
    status: normalizeLaundryStatus(formData.get("laundryStatus")),
    notes: normalizeText(formData.get("laundryNotes"))
  };
}

function validateLaundryTicket(record) {
  const errors = [];

  if (!record.ticketDate) {
    errors.push("Add the laundry ticket date.");
  }

  if (!record.customerName) {
    errors.push("Add the customer name.");
  }

  if (!record.itemSummary) {
    errors.push("Describe the laundry items received.");
  }

  if (record.amountDue <= 0) {
    errors.push("Enter an amount due greater than zero for this ticket.");
  }

  if (record.amountPaid > record.amountDue) {
    errors.push("Amount paid cannot be greater than the amount due.");
  }

  return errors;
}

function getLaundryBalance(record) {
  return Number(Math.max(record.amountDue - record.amountPaid, 0).toFixed(2));
}

function buildLaundryAlerts(records) {
  const alerts = [];

  records.forEach((record) => {
    if (!["Delivered", "Cancelled"].includes(record.status) && record.dueDate) {
      const daysRemaining = daysUntilDate(record.dueDate);

      if (Number.isFinite(daysRemaining) && daysRemaining <= 1) {
        const severity = daysRemaining < 0 ? "overdue" : "due";
        alerts.push({
          source: "laundry",
          subject: record.customerName,
          headline: severity === "overdue" ? "Laundry Overdue" : "Laundry Due",
          label: severity === "overdue" ? "Overdue" : "Due Today",
          pillClass: severity === "overdue" ? "alert-pill-overdue" : "alert-pill-due",
          severity,
          dueDate: record.dueDate,
          message:
            severity === "overdue"
              ? `${record.itemSummary} was due since ${formatDisplayDate(record.dueDate)}.`
              : `${record.itemSummary} is due ${formatDisplayDate(record.dueDate)}.`,
          view: "laundry"
        });
      }
    }

    if (record.status === "Ready" && record.readyDate) {
      alerts.push({
        source: "laundry",
        subject: record.customerName,
        headline: "Laundry Ready",
        label: "Ready",
        pillClass: "alert-pill-on-track",
        severity: "due",
        dueDate: record.readyDate,
        message: `${record.itemSummary} is ready for pickup.`,
        view: "laundry"
      });
    }
  });

  return alerts;
}

function getFilteredLaundryTickets() {
  const searchValue = normalizeText(state.laundryFilters.search).toLowerCase();
  const monthValue = normalizeMonthInput(state.laundryFilters.month);
  const statusValue = normalizeText(state.laundryFilters.status).toLowerCase();
  const serviceValue = normalizeText(state.laundryFilters.serviceType).toLowerCase();

  return state.laundryTickets.filter((record) => {
    const haystack = [record.customerName, record.customerPhone, record.itemSummary, record.notes].join(" ").toLowerCase();

    return (
      (searchValue === "" || haystack.includes(searchValue)) &&
      (monthValue === "" || record.ticketDate.startsWith(monthValue)) &&
      (statusValue === "" || record.status.toLowerCase() === statusValue) &&
      (serviceValue === "" || record.serviceType.toLowerCase() === serviceValue)
    );
  });
}

async function copyLaundryCustomerMessage(recordId) {
  const record = state.laundryTickets.find((item) => item.id === recordId);

  if (!record) {
    showToast("That laundry ticket could not be found.");
    return;
  }

  const message =
    record.status === "Ready"
      ? `Hello ${record.customerName}, this is OneRoot Laundry. Your laundry (${record.itemSummary}) is ready for pickup. Thank you.`
      : `Hello ${record.customerName}, this is OneRoot Laundry. Your laundry ticket for ${record.itemSummary} is due ${
          record.dueDate ? `on ${formatDisplayDate(record.dueDate)}` : "soon"
        }. Thank you.`;

  await writeTextToClipboard(message, "Laundry customer message copied.");
}

function renderLaundryPage() {
  if (!elements.laundryViewRoot) {
    return;
  }

  const editingRecord = state.laundryTickets.find((item) => item.id === state.editingLaundryTicketId) || null;
  const draft = editingRecord || createEmptyLaundryTicketDraft();
  const records = getFilteredLaundryTickets();
  const alerts = buildLaundryAlerts(records);
  const outstandingValue = records.reduce((sum, record) => sum + getLaundryBalance(record), 0);
  const readyCount = records.filter((record) => record.status === "Ready").length;

  elements.laundryViewRoot.innerHTML = `
    <section class="page-grid compact-page-grid">
      <section class="section-card">
        <div class="section-heading">
          <div>
            <p class="kicker">Laundry Job Ticketing</p>
            <h3>${editingRecord ? "Edit Laundry Ticket" : "Capture Laundry Jobs"}</h3>
          </div>
          <p class="muted-text">
            Track Normal and Express jobs from intake to completion, including balances and ready-for-pickup notices.
          </p>
        </div>

        <form id="laundryTicketForm" novalidate>
          <div class="mini-form-grid rental-form-grid">
            <label><span>Ticket Date</span><input id="laundryTicketDate" name="laundryTicketDate" type="date" value="${escapeHtml(
              draft.ticketDate
            )}" required /></label>
            <label><span>Customer Name</span><input id="laundryCustomerName" name="laundryCustomerName" type="text" value="${escapeHtml(
              draft.customerName
            )}" required /></label>
            <label><span>Customer Phone</span><input id="laundryCustomerPhone" name="laundryCustomerPhone" type="tel" value="${escapeHtml(
              draft.customerPhone
            )}" /></label>
            <label><span>Service Type</span><select id="laundryServiceType" name="laundryServiceType">${buildSelectMarkup(
              LAUNDRY_SERVICE_OPTIONS,
              draft.serviceType,
              "Choose service"
            )}</select></label>
            <label class="wide-field"><span>Items</span><input id="laundryItemSummary" name="laundryItemSummary" type="text" value="${escapeHtml(
              draft.itemSummary
            )}" required /></label>
            <label><span>Pieces</span><input id="laundryPieces" name="laundryPieces" type="number" min="1" step="1" value="${escapeHtml(
              String(draft.pieces || 1)
            )}" /></label>
            <label><span>Amount Due</span><input id="laundryAmountDue" name="laundryAmountDue" type="number" min="0" step="0.01" value="${escapeHtml(
              formatAmountInputValue(draft.amountDue)
            )}" required /></label>
            <label><span>Amount Paid</span><input id="laundryAmountPaid" name="laundryAmountPaid" type="number" min="0" step="0.01" value="${escapeHtml(
              formatAmountInputValue(draft.amountPaid)
            )}" /></label>
            <label><span>Due Date</span><input id="laundryDueDate" name="laundryDueDate" type="date" value="${escapeHtml(
              draft.dueDate
            )}" /></label>
            <label><span>Ready Date</span><input id="laundryReadyDate" name="laundryReadyDate" type="date" value="${escapeHtml(
              draft.readyDate
            )}" /></label>
            <label><span>Delivery Mode</span><select id="laundryDeliveryMode" name="laundryDeliveryMode">${buildSelectMarkup(
              LAUNDRY_DELIVERY_OPTIONS,
              draft.deliveryMode,
              "Choose mode"
            )}</select></label>
            <label><span>Status</span><select id="laundryStatus" name="laundryStatus">${buildSelectMarkup(
              LAUNDRY_STATUS_OPTIONS,
              draft.status,
              "Choose status"
            )}</select></label>
            <label class="wide-field"><span>Notes</span><textarea id="laundryNotes" name="laundryNotes" rows="3">${escapeHtml(
              draft.notes
            )}</textarea></label>
          </div>
          <div class="form-actions">
            <button class="button button-primary" id="submitLaundryTicketBtn" type="submit">${editingRecord ? "Update Laundry Ticket" : "Save Laundry Ticket"}</button>
            <button class="button button-secondary" id="resetLaundryTicketBtn" type="button">Clear Form</button>
            <button class="button button-ghost ${editingRecord ? "" : "hidden"}" id="cancelLaundryTicketEditBtn" type="button">Cancel Edit</button>
          </div>
        </form>
      </section>

      <aside class="sidebar-column">
        <section class="section-card">
          <div class="mini-stat-grid">
            <article class="stat-card"><span>Open Jobs</span><strong>${escapeHtml(
              String(records.filter((record) => !["Delivered", "Cancelled"].includes(record.status)).length)
            )}</strong></article>
            <article class="stat-card"><span>Ready</span><strong>${escapeHtml(String(readyCount))}</strong></article>
            <article class="stat-card"><span>Outstanding</span><strong>${formatCurrency(
              outstandingValue
            )}</strong></article>
            <article class="stat-card"><span>Alerts</span><strong>${escapeHtml(
              String(alerts.length)
            )}</strong></article>
          </div>
          <div class="form-actions">
            <button class="button button-secondary" data-global-action="export-view-csv" type="button">
              Export Laundry CSV
            </button>
          </div>
        </section>
        <section class="section-card">
          <div class="filter-grid">
            <label><span>Search</span><input id="laundrySearchFilter" type="search" value="${escapeHtml(
              state.laundryFilters.search
            )}" /></label>
            <label><span>Month</span><input id="laundryMonthFilter" type="month" value="${escapeHtml(
              state.laundryFilters.month
            )}" /></label>
            <label><span>Status</span><select id="laundryStatusFilter">${buildSelectMarkup(
              LAUNDRY_STATUS_OPTIONS,
              state.laundryFilters.status,
              "Any Status"
            )}</select></label>
            <label><span>Service</span><select id="laundryServiceFilter">${buildSelectMarkup(
              LAUNDRY_SERVICE_OPTIONS,
              state.laundryFilters.serviceType,
              "Any Service"
            )}</select></label>
          </div>
          <div class="form-actions">
            <button id="clearLaundryFiltersBtn" class="button button-ghost" type="button">Clear Filters</button>
          </div>
        </section>
      </aside>
    </section>

    <section class="section-card">
      <div class="table-wrap compact-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer</th>
              <th>Service</th>
              <th>Status</th>
              <th>Balance</th>
              <th>Due / Ready</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${
              records.length === 0
                ? `<tr><td colspan="7" class="empty-state">No laundry tickets match the current view yet.</td></tr>`
                : records
                    .map(
                      (record) => `
                        <tr>
                          <td>${escapeHtml(formatDisplayDate(record.ticketDate))}</td>
                          <td><span class="table-primary">${escapeHtml(record.customerName)}</span><span class="table-secondary">${escapeHtml(
                            record.customerPhone || "No phone saved"
                          )}</span></td>
                          <td><span class="table-primary">${escapeHtml(record.serviceType)}</span><span class="table-secondary">${escapeHtml(
                            record.itemSummary
                          )}</span></td>
                          <td><span class="alert-pill ${escapeHtml(
                            record.status === "Delivered"
                              ? "alert-pill-on-track"
                              : record.status === "Cancelled"
                                ? "alert-pill-overdue"
                                : record.status === "Ready"
                                  ? "alert-pill-on-track"
                                  : "alert-pill-due"
                          )}">${escapeHtml(record.status)}</span></td>
                          <td>${formatCurrency(getLaundryBalance(record))}</td>
                          <td><span class="table-primary">${escapeHtml(formatOptionalDate(record.dueDate))}</span><span class="table-secondary">${escapeHtml(
                            record.readyDate ? `Ready ${formatDisplayDate(record.readyDate)}` : record.deliveryMode
                          )}</span></td>
                          <td>
                            <div class="row-actions">
                              <button class="utility-btn" data-laundry-action="copy-message" data-id="${escapeHtml(
                                record.id
                              )}" type="button">Copy Message</button>
                              <button class="edit-btn" data-laundry-action="edit" data-id="${escapeHtml(
                                record.id
                              )}" type="button">Edit</button>
                              <button class="delete-btn" data-laundry-action="delete" data-id="${escapeHtml(
                                record.id
                              )}" type="button">Delete</button>
                            </div>
                          </td>
                        </tr>
                      `
                    )
                    .join("")
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function handleLaundryTicketSubmit(event) {
  event.preventDefault();
  const draft = buildLaundryTicketDraftFromForm(new FormData(event.target));
  const errors = validateLaundryTicket(draft);

  if (errors.length > 0) {
    showToast(errors[0]);
    return;
  }

  if (state.editingLaundryTicketId) {
    state.laundryTickets = sortLaundryTickets(
      state.laundryTickets.map((record) =>
        record.id === state.editingLaundryTicketId
          ? { ...record, ...draft, updatedAt: new Date().toISOString() }
          : record
      )
    );
    showToast("Laundry ticket updated.");
  } else {
    state.laundryTickets = sortLaundryTickets([
      ...state.laundryTickets,
      { id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...draft }
    ]);
    showToast("Laundry ticket saved.");
  }

  persistLaundryTickets();
  resetLaundryTicketForm({ silent: true });
  render();
}

function startEditingLaundryTicket(recordId) {
  const record = state.laundryTickets.find((item) => item.id === recordId);

  if (!record) {
    showToast("That laundry ticket could not be found.");
    return;
  }

  state.editingLaundryTicketId = record.id;
  navigateTo("laundry", { syncHash: true });
  render();
  scrollDynamicFormIntoView("laundryTicketForm");
}

function deleteLaundryTicket(recordId) {
  const record = state.laundryTickets.find((item) => item.id === recordId);

  if (!record) {
    showToast("That laundry ticket could not be found.");
    return;
  }

  if (!window.confirm(`Delete the laundry ticket for ${record.customerName}?`)) {
    return;
  }

  state.laundryTickets = state.laundryTickets.filter((item) => item.id !== recordId);
  persistLaundryTickets();

  if (state.editingLaundryTicketId === recordId) {
    resetLaundryTicketForm({ silent: true });
  }

  render();
  showToast("Laundry ticket deleted.");
}

function resetLaundryTicketForm(options = {}) {
  state.editingLaundryTicketId = null;

  if (!options.silent) {
    render();
    showToast("Laundry ticket form cleared.");
  }
}

function clearLaundryFilters() {
  state.laundryFilters = { search: "", month: "", status: "", serviceType: "" };
  render();
  showToast("Laundry filters cleared.");
}

function createEmptyEquipmentRentalDraft() {
  return {
    bookingDate: getTodayInputValue(),
    businessAreaId: "water-equipment",
    equipmentItem: "",
    customerName: "",
    customerPhone: "",
    rentalFee: 0,
    amountPaid: 0,
    depositAmount: 0,
    damageCharge: 0,
    outDate: "",
    dueDate: "",
    returnDate: "",
    status: "Booked",
    conditionOut: "Good",
    conditionIn: "Good",
    reference: "",
    notes: ""
  };
}

function buildEquipmentRentalDraftFromForm(formData) {
  return {
    bookingDate: normalizeDateInput(formData.get("equipmentBookingDate")),
    businessAreaId: "water-equipment",
    equipmentItem: normalizeText(formData.get("equipmentItem")),
    customerName: normalizeText(formData.get("equipmentCustomerName")),
    customerPhone: normalizeText(formData.get("equipmentCustomerPhone")),
    rentalFee: parseOptionalAmount(formData.get("equipmentRentalFee")),
    amountPaid: parseOptionalAmount(formData.get("equipmentAmountPaid")),
    depositAmount: parseOptionalAmount(formData.get("equipmentDepositAmount")),
    damageCharge: parseOptionalAmount(formData.get("equipmentDamageCharge")),
    outDate: normalizeDateInput(formData.get("equipmentOutDate")),
    dueDate: normalizeDateInput(formData.get("equipmentDueDate")),
    returnDate: normalizeDateInput(formData.get("equipmentReturnDate")),
    status: normalizeEquipmentRentalStatus(formData.get("equipmentStatus")),
    conditionOut: normalizeEquipmentCondition(formData.get("equipmentConditionOut")),
    conditionIn: normalizeEquipmentCondition(formData.get("equipmentConditionIn")),
    reference: normalizeText(formData.get("equipmentReference")),
    notes: normalizeText(formData.get("equipmentNotes"))
  };
}

function validateEquipmentRental(record) {
  const errors = [];

  if (!record.bookingDate) {
    errors.push("Add the equipment booking date.");
  }

  if (!record.equipmentItem) {
    errors.push("Choose or enter the equipment item.");
  }

  if (!record.customerName) {
    errors.push("Add the customer name for this rental.");
  }

  if (record.rentalFee <= 0) {
    errors.push("Enter a rental fee greater than zero.");
  }

  if (record.amountPaid > record.rentalFee + record.damageCharge) {
    errors.push("Amount paid cannot be greater than the rental fee plus damage charge.");
  }

  return errors;
}

function getEquipmentRentalBalance(record) {
  return Number(Math.max(record.rentalFee + record.damageCharge - record.amountPaid, 0).toFixed(2));
}

function buildEquipmentRentalAlerts(records) {
  return records
    .filter((record) => !["Returned", "Cancelled"].includes(record.status) && record.dueDate)
    .map((record) => {
      const daysRemaining = daysUntilDate(record.dueDate);

      if (!Number.isFinite(daysRemaining) || daysRemaining > 2) {
        return null;
      }

      const severity = daysRemaining < 0 ? "overdue" : "due";
      return {
        source: "equipment-rentals",
        subject: record.customerName,
        headline: "Equipment Return Due",
        label: severity === "overdue" ? "Overdue" : "Due Soon",
        pillClass: severity === "overdue" ? "alert-pill-overdue" : "alert-pill-due",
        severity,
        dueDate: record.dueDate,
        message:
          severity === "overdue"
            ? `${record.equipmentItem} was due back since ${formatDisplayDate(record.dueDate)}.`
            : `${record.equipmentItem} is due back ${formatDisplayDate(record.dueDate)}.`,
        view: "equipment-rentals"
      };
    })
    .filter(Boolean);
}

function getFilteredEquipmentRentalBookings() {
  const searchValue = normalizeText(state.equipmentRentalFilters.search).toLowerCase();
  const monthValue = normalizeMonthInput(state.equipmentRentalFilters.month);
  const statusValue = normalizeText(state.equipmentRentalFilters.status).toLowerCase();

  return state.equipmentRentalBookings.filter((record) => {
    const haystack = [record.equipmentItem, record.customerName, record.customerPhone, record.reference, record.notes]
      .join(" ")
      .toLowerCase();

    return (
      (searchValue === "" || haystack.includes(searchValue)) &&
      (monthValue === "" || record.bookingDate.startsWith(monthValue) || record.outDate.startsWith(monthValue)) &&
      (statusValue === "" || record.status.toLowerCase() === statusValue)
    );
  });
}

async function copyEquipmentRentalMessage(recordId) {
  const record = state.equipmentRentalBookings.find((item) => item.id === recordId);

  if (!record) {
    showToast("That equipment rental could not be found.");
    return;
  }

  const message = `Hello ${record.customerName}, this is OneRoot. Your ${record.equipmentItem} rental is due${
    record.dueDate ? ` on ${formatDisplayDate(record.dueDate)}` : " soon"
  }. Please arrange return. Thank you.`;

  await writeTextToClipboard(message, "Equipment rental message copied.");
}

function renderEquipmentRentalsPage() {
  if (!elements.equipmentRentalsViewRoot) {
    return;
  }

  const editingRecord =
    state.equipmentRentalBookings.find((item) => item.id === state.editingEquipmentRentalId) || null;
  const draft = editingRecord || createEmptyEquipmentRentalDraft();
  const records = getFilteredEquipmentRentalBookings();
  const alerts = buildEquipmentRentalAlerts(records);

  elements.equipmentRentalsViewRoot.innerHTML = `
    <section class="page-grid compact-page-grid">
      <section class="section-card">
        <div class="section-heading">
          <div>
            <p class="kicker">Equipment Rental Booking</p>
            <h3>${editingRecord ? "Edit Rental Booking" : "Track Equipment Bookings & Returns"}</h3>
          </div>
          <p class="muted-text">
            Capture who took which item, what was paid, the deposit held, the condition, and when the item should come back.
          </p>
        </div>

        <form id="equipmentRentalForm" novalidate>
          <div class="mini-form-grid rental-form-grid">
            <label><span>Booking Date</span><input id="equipmentBookingDate" name="equipmentBookingDate" type="date" value="${escapeHtml(
              draft.bookingDate
            )}" required /></label>
            <label><span>Equipment Item</span><input list="equipmentItemOptions" id="equipmentItem" name="equipmentItem" type="text" value="${escapeHtml(
              draft.equipmentItem
            )}" required /></label>
            <label><span>Customer Name</span><input id="equipmentCustomerName" name="equipmentCustomerName" type="text" value="${escapeHtml(
              draft.customerName
            )}" required /></label>
            <label><span>Customer Phone</span><input id="equipmentCustomerPhone" name="equipmentCustomerPhone" type="tel" value="${escapeHtml(
              draft.customerPhone
            )}" /></label>
            <label><span>Rental Fee</span><input id="equipmentRentalFee" name="equipmentRentalFee" type="number" min="0" step="0.01" value="${escapeHtml(
              formatAmountInputValue(draft.rentalFee)
            )}" required /></label>
            <label><span>Amount Paid</span><input id="equipmentAmountPaid" name="equipmentAmountPaid" type="number" min="0" step="0.01" value="${escapeHtml(
              formatAmountInputValue(draft.amountPaid)
            )}" /></label>
            <label><span>Deposit Held</span><input id="equipmentDepositAmount" name="equipmentDepositAmount" type="number" min="0" step="0.01" value="${escapeHtml(
              formatAmountInputValue(draft.depositAmount)
            )}" /></label>
            <label><span>Damage Charge</span><input id="equipmentDamageCharge" name="equipmentDamageCharge" type="number" min="0" step="0.01" value="${escapeHtml(
              formatAmountInputValue(draft.damageCharge)
            )}" /></label>
            <label><span>Out Date</span><input id="equipmentOutDate" name="equipmentOutDate" type="date" value="${escapeHtml(
              draft.outDate
            )}" /></label>
            <label><span>Due Date</span><input id="equipmentDueDate" name="equipmentDueDate" type="date" value="${escapeHtml(
              draft.dueDate
            )}" /></label>
            <label><span>Return Date</span><input id="equipmentReturnDate" name="equipmentReturnDate" type="date" value="${escapeHtml(
              draft.returnDate
            )}" /></label>
            <label><span>Status</span><select id="equipmentStatus" name="equipmentStatus">${buildSelectMarkup(
              EQUIPMENT_RENTAL_STATUS_OPTIONS,
              draft.status,
              "Choose status"
            )}</select></label>
            <label><span>Condition Out</span><select id="equipmentConditionOut" name="equipmentConditionOut">${buildSelectMarkup(
              EQUIPMENT_CONDITION_OPTIONS,
              draft.conditionOut,
              "Choose condition"
            )}</select></label>
            <label><span>Condition In</span><select id="equipmentConditionIn" name="equipmentConditionIn">${buildSelectMarkup(
              EQUIPMENT_CONDITION_OPTIONS,
              draft.conditionIn,
              "Choose condition"
            )}</select></label>
            <label><span>Reference</span><input id="equipmentReference" name="equipmentReference" type="text" value="${escapeHtml(
              draft.reference
            )}" /></label>
            <label class="wide-field"><span>Notes</span><textarea id="equipmentNotes" name="equipmentNotes" rows="3">${escapeHtml(
              draft.notes
            )}</textarea></label>
          </div>
          <datalist id="equipmentItemOptions">
            ${EQUIPMENT_RENTAL_ITEM_OPTIONS.map((option) => `<option value="${escapeHtml(option)}"></option>`).join("")}
          </datalist>
          <div class="form-actions">
            <button class="button button-primary" id="submitEquipmentRentalBtn" type="submit">${editingRecord ? "Update Rental Booking" : "Save Rental Booking"}</button>
            <button class="button button-secondary" id="resetEquipmentRentalBtn" type="button">Clear Form</button>
            <button class="button button-ghost ${editingRecord ? "" : "hidden"}" id="cancelEquipmentRentalEditBtn" type="button">Cancel Edit</button>
          </div>
        </form>
      </section>

      <aside class="sidebar-column">
        <section class="section-card">
          <div class="mini-stat-grid">
            <article class="stat-card"><span>Active Rentals</span><strong>${escapeHtml(
              String(records.filter((record) => !["Returned", "Cancelled"].includes(record.status)).length)
            )}</strong></article>
            <article class="stat-card"><span>Deposit Held</span><strong>${formatCurrency(
              records
                .filter((record) => !["Returned", "Cancelled"].includes(record.status))
                .reduce((sum, record) => sum + record.depositAmount, 0)
            )}</strong></article>
            <article class="stat-card"><span>Rental Balance</span><strong>${formatCurrency(
              records.reduce((sum, record) => sum + getEquipmentRentalBalance(record), 0)
            )}</strong></article>
            <article class="stat-card"><span>Return Alerts</span><strong>${escapeHtml(
              String(alerts.length)
            )}</strong></article>
          </div>
          <div class="form-actions">
            <button class="button button-secondary" data-global-action="export-view-csv" type="button">
              Export Rental CSV
            </button>
          </div>
        </section>
        <section class="section-card">
          <div class="filter-grid">
            <label><span>Search</span><input id="equipmentSearchFilter" type="search" value="${escapeHtml(
              state.equipmentRentalFilters.search
            )}" /></label>
            <label><span>Month</span><input id="equipmentMonthFilter" type="month" value="${escapeHtml(
              state.equipmentRentalFilters.month
            )}" /></label>
            <label><span>Status</span><select id="equipmentStatusFilter">${buildSelectMarkup(
              EQUIPMENT_RENTAL_STATUS_OPTIONS,
              state.equipmentRentalFilters.status,
              "Any Status"
            )}</select></label>
          </div>
          <div class="form-actions">
            <button id="clearEquipmentFiltersBtn" class="button button-ghost" type="button">Clear Filters</button>
          </div>
        </section>
      </aside>
    </section>

    <section class="section-card">
      <div class="table-wrap compact-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Booking</th>
              <th>Customer</th>
              <th>Item</th>
              <th>Status</th>
              <th>Balance</th>
              <th>Return</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${
              records.length === 0
                ? `<tr><td colspan="7" class="empty-state">No equipment rental records match the current view yet.</td></tr>`
                : records
                    .map(
                      (record) => `
                        <tr>
                          <td><span class="table-primary">${escapeHtml(formatDisplayDate(record.bookingDate))}</span><span class="table-secondary">${escapeHtml(
                            record.reference || "No reference"
                          )}</span></td>
                          <td><span class="table-primary">${escapeHtml(record.customerName)}</span><span class="table-secondary">${escapeHtml(
                            record.customerPhone || "No phone saved"
                          )}</span></td>
                          <td><span class="table-primary">${escapeHtml(record.equipmentItem)}</span><span class="table-secondary">Deposit ${formatCurrency(
                            record.depositAmount
                          )}</span></td>
                          <td><span class="alert-pill ${escapeHtml(
                            record.status === "Returned"
                              ? "alert-pill-on-track"
                              : record.status === "Cancelled"
                                ? "alert-pill-overdue"
                                : "alert-pill-due"
                          )}">${escapeHtml(record.status)}</span></td>
                          <td>${formatCurrency(getEquipmentRentalBalance(record))}</td>
                          <td><span class="table-primary">${escapeHtml(formatOptionalDate(record.dueDate))}</span><span class="table-secondary">${escapeHtml(
                            record.returnDate ? `Returned ${formatDisplayDate(record.returnDate)}` : `Out ${formatOptionalDate(record.outDate)}`
                          )}</span></td>
                          <td>
                            <div class="row-actions">
                              <button class="utility-btn" data-equipment-action="copy-message" data-id="${escapeHtml(
                                record.id
                              )}" type="button">Copy Message</button>
                              <button class="edit-btn" data-equipment-action="edit" data-id="${escapeHtml(
                                record.id
                              )}" type="button">Edit</button>
                              <button class="delete-btn" data-equipment-action="delete" data-id="${escapeHtml(
                                record.id
                              )}" type="button">Delete</button>
                            </div>
                          </td>
                        </tr>
                      `
                    )
                    .join("")
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function handleEquipmentRentalSubmit(event) {
  event.preventDefault();
  const draft = buildEquipmentRentalDraftFromForm(new FormData(event.target));
  const errors = validateEquipmentRental(draft);

  if (errors.length > 0) {
    showToast(errors[0]);
    return;
  }

  if (state.editingEquipmentRentalId) {
    state.equipmentRentalBookings = sortEquipmentRentalBookings(
      state.equipmentRentalBookings.map((record) =>
        record.id === state.editingEquipmentRentalId
          ? { ...record, ...draft, updatedAt: new Date().toISOString() }
          : record
      )
    );
    showToast("Equipment rental updated.");
  } else {
    state.equipmentRentalBookings = sortEquipmentRentalBookings([
      ...state.equipmentRentalBookings,
      { id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...draft }
    ]);
    showToast("Equipment rental saved.");
  }

  persistEquipmentRentalBookings();
  resetEquipmentRentalForm({ silent: true });
  render();
}

function startEditingEquipmentRental(recordId) {
  const record = state.equipmentRentalBookings.find((item) => item.id === recordId);

  if (!record) {
    showToast("That equipment rental could not be found.");
    return;
  }

  state.editingEquipmentRentalId = record.id;
  navigateTo("equipment-rentals", { syncHash: true });
  render();
  scrollDynamicFormIntoView("equipmentRentalForm");
}

function deleteEquipmentRental(recordId) {
  const record = state.equipmentRentalBookings.find((item) => item.id === recordId);

  if (!record) {
    showToast("That equipment rental could not be found.");
    return;
  }

  if (!window.confirm(`Delete the equipment rental for ${record.customerName}?`)) {
    return;
  }

  state.equipmentRentalBookings = state.equipmentRentalBookings.filter((item) => item.id !== recordId);
  persistEquipmentRentalBookings();

  if (state.editingEquipmentRentalId === recordId) {
    resetEquipmentRentalForm({ silent: true });
  }

  render();
  showToast("Equipment rental deleted.");
}

function resetEquipmentRentalForm(options = {}) {
  state.editingEquipmentRentalId = null;

  if (!options.silent) {
    render();
    showToast("Equipment rental form cleared.");
  }
}

function clearEquipmentRentalFilters() {
  state.equipmentRentalFilters = { search: "", month: "", status: "" };
  render();
  showToast("Equipment rental filters cleared.");
}

function createEmptySecurityDepositDraft() {
  return {
    captureDate: getTodayInputValue(),
    suite: APARTMENT_PORTFOLIO_SUITES[0] || "",
    tenantName: "",
    tenantPhone: "",
    depositExpected: 0,
    depositPaid: 0,
    chargesRaised: 0,
    chargesPaid: 0,
    deductionFromDeposit: 0,
    refundDue: 0,
    refundPaid: 0,
    depositDueDate: "",
    refundDueDate: "",
    status: "Active Hold",
    notes: ""
  };
}

function buildSecurityDepositDraftFromForm(formData) {
  return {
    captureDate: normalizeDateInput(formData.get("depositCaptureDate")),
    suite: normalizeSuite(formData.get("depositSuite")),
    tenantName: normalizeText(formData.get("depositTenantName")),
    tenantPhone: normalizeText(formData.get("depositTenantPhone")),
    depositExpected: parseOptionalAmount(formData.get("depositExpected")),
    depositPaid: parseOptionalAmount(formData.get("depositPaid")),
    chargesRaised: parseOptionalAmount(formData.get("depositChargesRaised")),
    chargesPaid: parseOptionalAmount(formData.get("depositChargesPaid")),
    deductionFromDeposit: parseOptionalAmount(formData.get("depositDeductionFromDeposit")),
    refundDue: parseOptionalAmount(formData.get("depositRefundDue")),
    refundPaid: parseOptionalAmount(formData.get("depositRefundPaid")),
    depositDueDate: normalizeDateInput(formData.get("depositDueDate")),
    refundDueDate: normalizeDateInput(formData.get("depositRefundDueDate")),
    status: normalizeSecurityDepositStatus(formData.get("depositStatus")),
    notes: normalizeText(formData.get("depositNotes"))
  };
}

function validateSecurityDepositRecord(record) {
  const errors = [];

  if (!record.captureDate) {
    errors.push("Add the security deposit capture date.");
  }

  if (!record.suite) {
    errors.push("Choose the suite for this tenant deposit record.");
  }

  if (!record.tenantName) {
    errors.push("Add the tenant name.");
  }

  if (record.depositPaid > record.depositExpected && record.depositExpected > 0) {
    errors.push("Deposit paid cannot be greater than the expected deposit.");
  }

  return errors;
}

function getSecurityDepositOutstanding(record) {
  return Number(Math.max(record.depositExpected - record.depositPaid, 0).toFixed(2));
}

function getSecurityChargeOutstanding(record) {
  return Number(Math.max(record.chargesRaised - record.chargesPaid - record.deductionFromDeposit, 0).toFixed(2));
}

function getSecurityRefundOutstanding(record) {
  return Number(Math.max(record.refundDue - record.refundPaid, 0).toFixed(2));
}

function getSecurityDepositHeldBalance(record) {
  return Number(Math.max(record.depositPaid - record.deductionFromDeposit - record.refundPaid, 0).toFixed(2));
}

function buildSecurityDepositAlerts(records) {
  const alerts = [];

  records.forEach((record) => {
    if (getSecurityDepositOutstanding(record) > 0 && record.depositDueDate) {
      const daysRemaining = daysUntilDate(record.depositDueDate);

      if (Number.isFinite(daysRemaining) && daysRemaining <= 7) {
        const severity = daysRemaining < 0 ? "overdue" : "due";
        alerts.push({
          source: "deposits",
          subject: record.tenantName,
          headline: "Deposit Outstanding",
          label: severity === "overdue" ? "Overdue" : "Due",
          pillClass: severity === "overdue" ? "alert-pill-overdue" : "alert-pill-due",
          severity,
          dueDate: record.depositDueDate,
          message: `${formatCurrency(getSecurityDepositOutstanding(record))} deposit still due for ${record.suite}.`,
          view: "deposits"
        });
      }
    }

    if (getSecurityRefundOutstanding(record) > 0 && record.refundDueDate) {
      const daysRemaining = daysUntilDate(record.refundDueDate);

      if (Number.isFinite(daysRemaining) && daysRemaining <= 7) {
        const severity = daysRemaining < 0 ? "overdue" : "due";
        alerts.push({
          source: "deposits",
          subject: record.tenantName,
          headline: "Refund Pending",
          label: severity === "overdue" ? "Overdue" : "Due",
          pillClass: severity === "overdue" ? "alert-pill-overdue" : "alert-pill-due",
          severity,
          dueDate: record.refundDueDate,
          message: `${formatCurrency(getSecurityRefundOutstanding(record))} refund still pending for ${record.suite}.`,
          view: "deposits"
        });
      }
    }
  });

  return alerts;
}

function getFilteredSecurityDepositRecords() {
  const searchValue = normalizeText(state.securityDepositFilters.search).toLowerCase();
  const suiteValue = normalizeSuite(state.securityDepositFilters.suite);
  const statusValue = normalizeText(state.securityDepositFilters.status).toLowerCase();

  return state.securityDepositRecords.filter((record) => {
    const haystack = [record.suite, record.tenantName, record.tenantPhone, record.notes].join(" ").toLowerCase();

    return (
      (searchValue === "" || haystack.includes(searchValue)) &&
      (suiteValue === "" || record.suite === suiteValue) &&
      (statusValue === "" || record.status.toLowerCase() === statusValue)
    );
  });
}

async function copySecurityDepositMessage(recordId) {
  const record = state.securityDepositRecords.find((item) => item.id === recordId);

  if (!record) {
    showToast("That deposit record could not be found.");
    return;
  }

  const message = `Hello ${record.tenantName}, this is OneRoot. Your deposit / tenant charge balance for ${record.suite} is ${formatCurrency(
    getSecurityDepositOutstanding(record) + getSecurityChargeOutstanding(record) + getSecurityRefundOutstanding(record)
  )}. Please contact us to settle or confirm the next step. Thank you.`;

  await writeTextToClipboard(message, "Deposit settlement message copied.");
}

function renderDepositsPage() {
  if (!elements.depositsViewRoot) {
    return;
  }

  const editingRecord =
    state.securityDepositRecords.find((item) => item.id === state.editingSecurityDepositId) || null;
  const draft = editingRecord || createEmptySecurityDepositDraft();
  const records = getFilteredSecurityDepositRecords();
  const alerts = buildSecurityDepositAlerts(records);

  elements.depositsViewRoot.innerHTML = `
    <section class="page-grid compact-page-grid">
      <section class="section-card">
        <div class="section-heading">
          <div>
            <p class="kicker">Security Deposits & Charges</p>
            <h3>${editingRecord ? "Edit Deposit Record" : "Track Tenant Deposits, Charges & Refunds"}</h3>
          </div>
          <p class="muted-text">
            Keep deposit collection, move-out deductions, extra charges, and refund follow-up together for each tenant.
          </p>
        </div>

        <form id="securityDepositForm" novalidate>
          <div class="mini-form-grid rental-form-grid">
            <label><span>Capture Date</span><input id="depositCaptureDate" name="depositCaptureDate" type="date" value="${escapeHtml(
              draft.captureDate
            )}" required /></label>
            <label><span>Suite</span><select id="depositSuite" name="depositSuite">${buildSelectMarkup(
              APARTMENT_SUITES,
              draft.suite,
              "Choose suite"
            )}</select></label>
            <label><span>Tenant Name</span><input id="depositTenantName" name="depositTenantName" type="text" value="${escapeHtml(
              draft.tenantName
            )}" required /></label>
            <label><span>Tenant Phone</span><input id="depositTenantPhone" name="depositTenantPhone" type="tel" value="${escapeHtml(
              draft.tenantPhone
            )}" /></label>
            <label><span>Deposit Expected</span><input id="depositExpected" name="depositExpected" type="number" min="0" step="0.01" value="${escapeHtml(
              formatAmountInputValue(draft.depositExpected)
            )}" /></label>
            <label><span>Deposit Paid</span><input id="depositPaid" name="depositPaid" type="number" min="0" step="0.01" value="${escapeHtml(
              formatAmountInputValue(draft.depositPaid)
            )}" /></label>
            <label><span>Tenant Charges Raised</span><input id="depositChargesRaised" name="depositChargesRaised" type="number" min="0" step="0.01" value="${escapeHtml(
              formatAmountInputValue(draft.chargesRaised)
            )}" /></label>
            <label><span>Tenant Charges Paid</span><input id="depositChargesPaid" name="depositChargesPaid" type="number" min="0" step="0.01" value="${escapeHtml(
              formatAmountInputValue(draft.chargesPaid)
            )}" /></label>
            <label><span>Deduction From Deposit</span><input id="depositDeductionFromDeposit" name="depositDeductionFromDeposit" type="number" min="0" step="0.01" value="${escapeHtml(
              formatAmountInputValue(draft.deductionFromDeposit)
            )}" /></label>
            <label><span>Refund Due</span><input id="depositRefundDue" name="depositRefundDue" type="number" min="0" step="0.01" value="${escapeHtml(
              formatAmountInputValue(draft.refundDue)
            )}" /></label>
            <label><span>Refund Paid</span><input id="depositRefundPaid" name="depositRefundPaid" type="number" min="0" step="0.01" value="${escapeHtml(
              formatAmountInputValue(draft.refundPaid)
            )}" /></label>
            <label><span>Deposit Due Date</span><input id="depositDueDate" name="depositDueDate" type="date" value="${escapeHtml(
              draft.depositDueDate
            )}" /></label>
            <label><span>Refund Due Date</span><input id="depositRefundDueDate" name="depositRefundDueDate" type="date" value="${escapeHtml(
              draft.refundDueDate
            )}" /></label>
            <label><span>Status</span><select id="depositStatus" name="depositStatus">${buildSelectMarkup(
              SECURITY_DEPOSIT_STATUS_OPTIONS,
              draft.status,
              "Choose status"
            )}</select></label>
            <label class="wide-field"><span>Notes</span><textarea id="depositNotes" name="depositNotes" rows="3">${escapeHtml(
              draft.notes
            )}</textarea></label>
          </div>
          <div class="form-actions">
            <button class="button button-primary" id="submitDepositBtn" type="submit">${editingRecord ? "Update Deposit Record" : "Save Deposit Record"}</button>
            <button class="button button-secondary" id="resetDepositBtn" type="button">Clear Form</button>
            <button class="button button-ghost ${editingRecord ? "" : "hidden"}" id="cancelDepositEditBtn" type="button">Cancel Edit</button>
          </div>
        </form>
      </section>

      <aside class="sidebar-column">
        <section class="section-card">
          <div class="mini-stat-grid">
            <article class="stat-card"><span>Held Balance</span><strong>${formatCurrency(
              records.reduce((sum, record) => sum + getSecurityDepositHeldBalance(record), 0)
            )}</strong></article>
            <article class="stat-card"><span>Deposit Outstanding</span><strong>${formatCurrency(
              records.reduce((sum, record) => sum + getSecurityDepositOutstanding(record), 0)
            )}</strong></article>
            <article class="stat-card"><span>Charge Outstanding</span><strong>${formatCurrency(
              records.reduce((sum, record) => sum + getSecurityChargeOutstanding(record), 0)
            )}</strong></article>
            <article class="stat-card"><span>Alerts</span><strong>${escapeHtml(
              String(alerts.length)
            )}</strong></article>
          </div>
          <div class="form-actions">
            <button class="button button-secondary" data-global-action="export-view-csv" type="button">
              Export Deposits CSV
            </button>
          </div>
        </section>
        <section class="section-card">
          <div class="filter-grid">
            <label><span>Search</span><input id="depositSearchFilter" type="search" value="${escapeHtml(
              state.securityDepositFilters.search
            )}" /></label>
            <label><span>Suite</span><select id="depositSuiteFilter">${buildSelectMarkup(
              APARTMENT_SUITES,
              state.securityDepositFilters.suite,
              "All Suites"
            )}</select></label>
            <label><span>Status</span><select id="depositStatusFilter">${buildSelectMarkup(
              SECURITY_DEPOSIT_STATUS_OPTIONS,
              state.securityDepositFilters.status,
              "Any Status"
            )}</select></label>
          </div>
          <div class="form-actions">
            <button id="clearDepositFiltersBtn" class="button button-ghost" type="button">Clear Filters</button>
          </div>
        </section>
      </aside>
    </section>

    <section class="section-card">
      <div class="table-wrap compact-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Tenant</th>
              <th>Deposit</th>
              <th>Charges</th>
              <th>Refund</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${
              records.length === 0
                ? `<tr><td colspan="6" class="empty-state">No deposit or tenant charge records match the current view yet.</td></tr>`
                : records
                    .map(
                      (record) => `
                        <tr>
                          <td><span class="table-primary">${escapeHtml(record.tenantName)}</span><span class="table-secondary">${escapeHtml(
                            `${record.suite}${record.tenantPhone ? ` • ${record.tenantPhone}` : ""}`
                          )}</span></td>
                          <td><span class="table-primary">Held ${formatCurrency(
                            getSecurityDepositHeldBalance(record)
                          )}</span><span class="table-secondary">Outstanding ${formatCurrency(
                            getSecurityDepositOutstanding(record)
                          )}</span></td>
                          <td><span class="table-primary">Raised ${formatCurrency(
                            record.chargesRaised
                          )}</span><span class="table-secondary">Outstanding ${formatCurrency(
                            getSecurityChargeOutstanding(record)
                          )}</span></td>
                          <td><span class="table-primary">Due ${formatCurrency(
                            record.refundDue
                          )}</span><span class="table-secondary">Outstanding ${formatCurrency(
                            getSecurityRefundOutstanding(record)
                          )}</span></td>
                          <td><span class="alert-pill ${escapeHtml(
                            record.status === "Closed" ? "alert-pill-on-track" : "alert-pill-due"
                          )}">${escapeHtml(record.status)}</span></td>
                          <td>
                            <div class="row-actions">
                              <button class="utility-btn" data-deposit-action="copy-message" data-id="${escapeHtml(
                                record.id
                              )}" type="button">Copy Message</button>
                              <button class="edit-btn" data-deposit-action="edit" data-id="${escapeHtml(
                                record.id
                              )}" type="button">Edit</button>
                              <button class="delete-btn" data-deposit-action="delete" data-id="${escapeHtml(
                                record.id
                              )}" type="button">Delete</button>
                            </div>
                          </td>
                        </tr>
                      `
                    )
                    .join("")
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function handleSecurityDepositSubmit(event) {
  event.preventDefault();
  const draft = buildSecurityDepositDraftFromForm(new FormData(event.target));
  const errors = validateSecurityDepositRecord(draft);

  if (errors.length > 0) {
    showToast(errors[0]);
    return;
  }

  if (state.editingSecurityDepositId) {
    state.securityDepositRecords = sortSecurityDepositRecords(
      state.securityDepositRecords.map((record) =>
        record.id === state.editingSecurityDepositId
          ? { ...record, ...draft, updatedAt: new Date().toISOString() }
          : record
      )
    );
    showToast("Deposit record updated.");
  } else {
    state.securityDepositRecords = sortSecurityDepositRecords([
      ...state.securityDepositRecords,
      { id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...draft }
    ]);
    showToast("Deposit record saved.");
  }

  persistSecurityDepositRecords();
  resetSecurityDepositForm({ silent: true });
  render();
}

function startEditingSecurityDeposit(recordId) {
  const record = state.securityDepositRecords.find((item) => item.id === recordId);

  if (!record) {
    showToast("That deposit record could not be found.");
    return;
  }

  state.editingSecurityDepositId = record.id;
  navigateTo("deposits", { syncHash: true });
  render();
  scrollDynamicFormIntoView("securityDepositForm");
}

function deleteSecurityDeposit(recordId) {
  const record = state.securityDepositRecords.find((item) => item.id === recordId);

  if (!record) {
    showToast("That deposit record could not be found.");
    return;
  }

  if (!window.confirm(`Delete the deposit record for ${record.tenantName}?`)) {
    return;
  }

  state.securityDepositRecords = state.securityDepositRecords.filter((item) => item.id !== recordId);
  persistSecurityDepositRecords();

  if (state.editingSecurityDepositId === recordId) {
    resetSecurityDepositForm({ silent: true });
  }

  render();
  showToast("Deposit record deleted.");
}

function resetSecurityDepositForm(options = {}) {
  state.editingSecurityDepositId = null;

  if (!options.silent) {
    render();
    showToast("Deposit form cleared.");
  }
}

function clearSecurityDepositFilters() {
  state.securityDepositFilters = { search: "", suite: "", status: "" };
  render();
  showToast("Deposit filters cleared.");
}

function renderSalaryPage() {
  if (!elements.salaryViewRoot) {
    return;
  }

  const editingRecord = state.salaryRecords.find((item) => item.id === state.editingSalaryId) || null;
  const draft = editingRecord || createEmptySalaryDraft();
  const records = getFilteredSalaryRecords();
  const payrollDue = records.reduce((sum, record) => sum + getSalaryNetDue(record), 0);
  const paidTotal = records.reduce((sum, record) => sum + record.amountPaid, 0);
  const balanceTotal = records.reduce((sum, record) => sum + getSalaryBalance(record), 0);
  const overdueCount = records.filter((record) => getSalaryPaymentStatus(record) === "Overdue").length;
  const uniqueStaffCount = new Set(records.map((record) => normalizeText(record.staffName).toLowerCase()).filter(Boolean))
    .size;
  const staffKpi = buildSalaryKpiSummary(records);
  const paymentMethods = mergeUniqueOptions(
    BASE_PAYMENT_METHODS,
    state.salaryRecords.map((record) => record.paymentMethod)
  );
  const payslipReadyListMarkup = buildPayslipReadyListMarkup();

  elements.salaryViewRoot.innerHTML = `
    <section class="page-grid compact-page-grid">
      <section class="section-card">
        <div class="section-heading">
          <div>
            <p class="kicker">Payroll Register</p>
            <h3>${editingRecord ? "Edit Salary Record" : "Track Salary Payments & Balances"}</h3>
          </div>
          <p class="muted-text">
            Capture monthly salary due, deductions, part-payments, and outstanding staff balances by business area.
          </p>
        </div>

        <form id="salaryForm" novalidate>
          <div class="mini-form-grid rental-form-grid">
            <label>
              <span>Payroll Month</span>
              <input id="salaryMonth" name="salaryMonth" type="month" value="${escapeHtml(draft.month)}" required />
            </label>

            <label>
              <span>Business Area</span>
              <select id="salaryBusinessArea" name="salaryBusinessArea" required>
                ${buildSelectMarkup(getBusinessAreaOptions(), draft.businessAreaId, "Choose business area")}
              </select>
            </label>

            <label>
              <span>Staff Name</span>
              <input
                id="salaryStaffName"
                name="salaryStaffName"
                type="text"
                value="${escapeHtml(draft.staffName)}"
                placeholder="Staff or contractor name"
                required
              />
            </label>

            <label>
              <span>Role / Position</span>
              <input
                id="salaryRoleTitle"
                name="salaryRoleTitle"
                type="text"
                value="${escapeHtml(draft.roleTitle)}"
                placeholder="Role or duty title"
              />
            </label>

            <label>
              <span>Salary Type</span>
              <select id="salaryType" name="salaryType" required>
                ${buildSelectMarkup(SALARY_TYPE_OPTIONS, draft.salaryType, "Choose salary type")}
              </select>
            </label>

            <label>
              <span>Gross Amount</span>
              <input
                id="salaryGrossAmount"
                name="salaryGrossAmount"
                type="number"
                min="0"
                step="0.01"
                value="${escapeHtml(formatAmountInputValue(draft.grossAmount))}"
                placeholder="0.00"
                required
              />
            </label>

            <label>
              <span>Deductions</span>
              <input
                id="salaryDeductionAmount"
                name="salaryDeductionAmount"
                type="number"
                min="0"
                step="0.01"
                value="${escapeHtml(formatAmountInputValue(draft.deductionAmount))}"
                placeholder="0.00"
              />
            </label>

            <label>
              <span>Amount Paid</span>
              <input
                id="salaryAmountPaid"
                name="salaryAmountPaid"
                type="number"
                min="0"
                step="0.01"
                value="${escapeHtml(formatAmountInputValue(draft.amountPaid))}"
                placeholder="0.00"
              />
            </label>

            <label>
              <span>Due Date</span>
              <input id="salaryDueDate" name="salaryDueDate" type="date" value="${escapeHtml(
                draft.dueDate
              )}" required />
            </label>

            <label>
              <span>Payment Date</span>
              <input id="salaryPaymentDate" name="salaryPaymentDate" type="date" value="${escapeHtml(
                draft.paymentDate
              )}" />
            </label>

            <label>
              <span>Payment Method</span>
              <select id="salaryPaymentMethod" name="salaryPaymentMethod">
                ${buildSelectMarkup(paymentMethods, draft.paymentMethod, "Choose payment method")}
              </select>
            </label>

            <label>
              <span>Payment Reference</span>
              <input
                id="salaryPaymentReference"
                name="salaryPaymentReference"
                type="text"
                value="${escapeHtml(draft.paymentReference)}"
                placeholder="MoMo ref, transfer ref, voucher no."
              />
            </label>

            <label>
              <span>Staff KPI Metric</span>
              <input
                id="salaryKpiMetric"
                name="salaryKpiMetric"
                type="text"
                value="${escapeHtml(draft.kpiMetric)}"
                placeholder="Jobs completed, stock checks, orders served"
              />
            </label>

            <label>
              <span>Measurement Unit</span>
              <input
                id="salaryKpiUnit"
                name="salaryKpiUnit"
                type="text"
                value="${escapeHtml(draft.kpiUnit)}"
                placeholder="jobs, checks, orders, clients"
              />
            </label>

            <label>
              <span>KPI Target</span>
              <input
                id="salaryKpiTarget"
                name="salaryKpiTarget"
                type="number"
                min="0"
                step="0.01"
                value="${escapeHtml(formatAmountInputValue(draft.kpiTarget))}"
                placeholder="0.00"
              />
            </label>

            <label>
              <span>Actual Measurement</span>
              <input
                id="salaryKpiActual"
                name="salaryKpiActual"
                type="number"
                min="0"
                step="0.01"
                value="${escapeHtml(formatAmountInputValue(draft.kpiActual))}"
                placeholder="0.00"
              />
            </label>

            <label class="wide-field">
              <span>Notes</span>
              <textarea
                id="salaryNotes"
                name="salaryNotes"
                rows="3"
                placeholder="Reason for advance, deduction note, or payroll follow-up"
              >${escapeHtml(draft.notes)}</textarea>
            </label>

            <div class="wide-field apartment-capture-panel">
              <p class="muted-text">
                Net salary due for this record is currently ${escapeHtml(formatCurrency(getSalaryNetDue(draft)))} and the remaining balance after the saved payment is ${escapeHtml(formatCurrency(getSalaryBalance(draft)))}.
              </p>
              <p class="muted-text">
                Staff KPI: ${escapeHtml(getSalaryKpiMetricLabel(draft))} • ${escapeHtml(
                  buildSalaryKpiMeasurementLabel(draft)
                )}${
                  getSalaryKpiAchievement(draft) !== null
                    ? ` • Variance ${escapeHtml(
                        `${getSalaryKpiVariance(draft) >= 0 ? "+" : ""}${formatKpiNumber(
                          getSalaryKpiVariance(draft)
                        )}${draft.kpiUnit ? ` ${escapeHtml(draft.kpiUnit)}` : ""}`
                      )}`
                    : ""
                }.
              </p>
            </div>
          </div>

          <div class="form-actions">
            <button id="submitSalaryBtn" class="button button-primary" type="submit">
              ${editingRecord ? "Update Salary Record" : "Save Salary Record"}
            </button>
            <button id="resetSalaryBtn" class="button button-secondary" type="button">
              Clear Form
            </button>
            <button
              id="cancelSalaryEditBtn"
              class="button button-ghost ${editingRecord ? "" : "hidden"}"
              type="button"
            >
              Cancel Edit
            </button>
          </div>
        </form>
      </section>

      <aside class="sidebar-column">
        <section class="section-card">
          <div class="section-heading compact">
            <div>
              <p class="kicker">Payroll Snapshot</p>
              <h3>Salary Position</h3>
            </div>
          </div>
          <div class="mini-stat-grid">
            <article class="stat-card">
              <span>Net Due</span>
              <strong>${formatCurrency(payrollDue)}</strong>
            </article>
            <article class="stat-card">
              <span>Amount Paid</span>
              <strong>${formatCurrency(paidTotal)}</strong>
            </article>
            <article class="stat-card">
              <span>Outstanding</span>
              <strong class="${balanceTotal > 0 ? "negative-text" : ""}">${formatCurrency(
                balanceTotal
              )}</strong>
            </article>
            <article class="stat-card">
              <span>Overdue</span>
              <strong>${escapeHtml(String(overdueCount))}</strong>
            </article>
            <article class="stat-card stat-card-wide">
              <span>Staff In View</span>
              <strong>${escapeHtml(String(uniqueStaffCount))}</strong>
            </article>
          </div>
        </section>

        <section class="section-card">
          <div class="section-heading compact">
            <div>
              <p class="kicker">Filters</p>
              <h3>Refine Salary View</h3>
            </div>
          </div>
          <div class="filter-grid">
            <label>
              <span>Search</span>
              <input
                id="salarySearchFilter"
                type="search"
                value="${escapeHtml(state.salaryFilters.search)}"
                placeholder="Staff, role, or note"
              />
            </label>
            <label>
              <span>Payroll Month</span>
              <input id="salaryMonthFilter" type="month" value="${escapeHtml(state.salaryFilters.month)}" />
            </label>
            <label>
              <span>Business Area</span>
              <select id="salaryAreaFilter">
                ${buildSelectMarkup(getBusinessAreaOptions(), state.salaryFilters.area, "All Areas")}
              </select>
            </label>
            <label>
              <span>Salary Type</span>
              <select id="salaryTypeFilter">
                ${buildSelectMarkup(SALARY_TYPE_OPTIONS, state.salaryFilters.type, "Any Type")}
              </select>
            </label>
            <label>
              <span>Status</span>
              <select id="salaryStatusFilter">
                ${buildSelectMarkup(
                  ["Due", "Part Paid", "Paid", "Overdue"],
                  state.salaryFilters.status,
                  "Any Status"
                )}
              </select>
            </label>
          </div>
        </section>

        <section class="section-card">
          <div class="section-heading compact">
            <div>
              <p class="kicker">Staff KPI</p>
              <h3>Payroll & KPI Coverage</h3>
            </div>
          </div>
          <div class="mini-stat-grid">
            <article class="stat-card">
              <span>Completion</span>
              <strong>${escapeHtml(formatPercentLabel(staffKpi.completionRate))}</strong>
            </article>
            <article class="stat-card">
              <span>Fully Paid</span>
              <strong>${escapeHtml(`${staffKpi.paidStaffCount}/${staffKpi.staffCount}`)}</strong>
            </article>
            <article class="stat-card">
              <span>Part Paid</span>
              <strong>${escapeHtml(String(staffKpi.partialStaffCount))}</strong>
            </article>
            <article class="stat-card">
              <span>Unpaid</span>
              <strong>${escapeHtml(String(staffKpi.unpaidStaffCount))}</strong>
            </article>
            <article class="stat-card">
              <span>Overdue Staff</span>
              <strong>${escapeHtml(String(staffKpi.overdueStaffCount))}</strong>
            </article>
            <article class="stat-card">
              <span>Targets Set</span>
              <strong>${escapeHtml(`${staffKpi.targetSetCount}/${staffKpi.staffCount}`)}</strong>
            </article>
            <article class="stat-card">
              <span>Measured</span>
              <strong>${escapeHtml(String(staffKpi.measuredCount))}</strong>
            </article>
            <article class="stat-card">
              <span>On / Above Target</span>
              <strong>${escapeHtml(String(staffKpi.metTargetCount))}</strong>
            </article>
            <article class="stat-card">
              <span>KPI Achievement</span>
              <strong>${escapeHtml(formatPercentLabel(staffKpi.kpiAchievement, "n/a"))}</strong>
            </article>
            <article class="stat-card stat-card-wide">
              <span>Average Net Due</span>
              <strong>${formatCurrency(staffKpi.averageNetDue)}</strong>
            </article>
          </div>
          <p class="muted-text">
            ${
              staffKpi.topOutstanding && staffKpi.topOutstanding.balance > 0
                ? `${escapeHtml(staffKpi.topOutstanding.staffName)} currently has the highest open payroll balance at ${escapeHtml(
                    formatCurrency(staffKpi.topOutstanding.balance)
                  )}.`
                : "No open payroll balance is currently left in this salary view."
            }
          </p>
          <p class="muted-text">
            ${
              staffKpi.targetSetCount > 0
                ? `${escapeHtml(String(staffKpi.metTargetCount))} of ${escapeHtml(
                    String(staffKpi.targetSetCount)
                  )} staff target${staffKpi.targetSetCount === 1 ? "" : "s"} are currently on or above target, with ${escapeHtml(
                    formatPercentLabel(staffKpi.kpiAchievement, "n/a")
                  )} measured achievement overall.`
                : "No staff KPI targets are saved in this salary view yet."
            }
          </p>
        </section>

        <section class="section-card">
          <div class="section-heading compact">
            <div>
              <p class="kicker">Payslip Files</p>
              <h3>Ready Payslips</h3>
            </div>
          </div>
          <p class="muted-text">
            Prepared payslips stay here during this session. Open the preview, then use your browser print menu to save as PDF or print a paper copy.
          </p>
          <div id="payslipReadyList" class="guide-list compact-guide-list">
            ${payslipReadyListMarkup}
          </div>
        </section>
      </aside>
    </section>

    <section class="section-card">
      <div class="section-heading compact">
        <div>
          <p class="kicker">Salary Records</p>
          <h3>${records.length} Record${records.length === 1 ? "" : "s"} In View</h3>
        </div>
        <p class="muted-text">
          Salary records stay separate from petty cash and supplier ledgers while still feeding payroll summaries and workbook export.
        </p>
      </div>
      <div class="table-wrap compact-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th>Staff</th>
              <th>Business Area</th>
              <th>Type</th>
              <th>Staff KPI</th>
              <th>Net Due / Paid / Balance</th>
              <th>Due Dates</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${
              records.length === 0
                ? `
                    <tr>
                      <td colspan="9" class="empty-state">
                        No salary records match the current view yet.
                      </td>
                    </tr>
                  `
                : records
                    .map((record) => {
                      const status = getSalaryStatusConfig(record);
                      const performanceStatus = getStaffTargetStatusConfig({
                        kpiMetric: record.kpiMetric,
                        kpiUnit: record.kpiUnit,
                        hasKpiTarget: hasSalaryKpiTarget(record),
                        hasKpiActual: hasSalaryKpiActual(record),
                        kpiTarget: getSalaryKpiTarget(record),
                        kpiActual: getSalaryKpiActual(record),
                        targetVariance: getSalaryKpiVariance(record)
                      });
                      return `
                        <tr>
                          <td>${escapeHtml(formatMonthLabel(record.month))}</td>
                          <td>
                            <span class="table-primary">${escapeHtml(record.staffName)}</span>
                            <span class="table-secondary">${escapeHtml(record.roleTitle || "Role not saved")}</span>
                          </td>
                          <td><span class="tag tag-area">${escapeHtml(
                            getBusinessArea(record.businessAreaId).shortLabel
                          )}</span></td>
                          <td>${escapeHtml(getSalaryTypeLabel(record.salaryType))}</td>
                          <td>
                            <span class="table-primary">${escapeHtml(getSalaryKpiMetricLabel(record))}</span>
                            <span class="table-secondary">${escapeHtml(buildSalaryKpiMeasurementLabel(record))}</span>
                            <span class="table-secondary">${escapeHtml(performanceStatus.meta)}</span>
                          </td>
                          <td>
                            <span class="table-primary">Net ${formatCurrency(getSalaryNetDue(record))}</span>
                            <span class="table-secondary">Paid ${formatCurrency(record.amountPaid)}</span>
                            <span class="table-secondary ${getSalaryBalance(record) > 0 ? "negative-text" : ""}">
                              Balance ${formatCurrency(getSalaryBalance(record))}
                            </span>
                          </td>
                          <td>
                            <span class="table-primary">Due ${escapeHtml(formatOptionalDate(record.dueDate))}</span>
                            <span class="table-secondary">Paid ${escapeHtml(
                              formatOptionalDate(record.paymentDate)
                            )}</span>
                            <span class="table-secondary">${escapeHtml(record.paymentMethod || "Payment method not saved")}</span>
                          </td>
                          <td>
                            <span class="alert-pill ${escapeHtml(status.pillClass)}">${escapeHtml(
                              status.label
                            )}</span>
                            <span class="table-secondary">${escapeHtml(status.meta)}</span>
                          </td>
                          <td>
                            <div class="row-actions">
                              <button class="utility-btn" data-salary-action="payslip" data-id="${escapeHtml(
                                record.id
                              )}" type="button">
                                Payslip
                              </button>
                              <button class="edit-btn" data-salary-action="edit" data-id="${escapeHtml(
                                record.id
                              )}" type="button">
                                Edit
                              </button>
                              <button class="delete-btn" data-salary-action="delete" data-id="${escapeHtml(
                                record.id
                              )}" type="button">
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      `;
                    })
                    .join("")
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function handlePettyCashBudgetSubmit(event) {
  event.preventDefault();

  const month = normalizeMonthInput(elements.pettyCashBudgetMonth.value);
  const businessAreaId = normalizeBusinessAreaId(elements.pettyCashBudgetArea.value);
  const amount = parseAmount(elements.pettyCashBudgetAmount.value);
  const notes = normalizeText(elements.pettyCashBudgetNotes.value);

  if (!month) {
    showToast("Choose the month this petty cash budget applies to.");
    return;
  }

  if (!businessAreaId) {
    showToast("Choose the business area for this petty cash budget.");
    return;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    showToast("Enter a petty cash budget amount greater than zero.");
    return;
  }

  const existingBudget = state.pettyCashBudgets.find(
    (budget) => budget.month === month && budget.businessAreaId === businessAreaId
  );
  const budgetRecord = {
    id: existingBudget?.id || generateId(),
    month,
    businessAreaId,
    amount,
    notes,
    updatedAt: new Date().toISOString()
  };

  state.pettyCashBudgets = sortPettyCashBudgets([
    ...state.pettyCashBudgets.filter(
      (budget) => !(budget.month === month && budget.businessAreaId === businessAreaId)
    ),
    budgetRecord
  ]);
  persistPettyCashBudgets();
  elements.pettyCashBudgetAmount.value = "";
  elements.pettyCashBudgetNotes.value = "";
  render();
  showToast(
    existingBudget
      ? `Petty cash budget updated for ${getBusinessArea(businessAreaId).shortLabel} in ${formatMonthLabel(month)}.`
      : `Petty cash budget saved for ${getBusinessArea(businessAreaId).shortLabel} in ${formatMonthLabel(month)}.`
  );
}

function renderPettyCashBudgetPanel() {
  const selectedMonth = normalizeMonthInput(elements.pettyCashBudgetMonth.value) || getMonthKey(new Date());

  if (elements.pettyCashBudgetMonth.value !== selectedMonth) {
    elements.pettyCashBudgetMonth.value = selectedMonth;
  }

  const selectedBudgets = state.pettyCashBudgets.filter((budget) => budget.month === selectedMonth);
  const monthExpenseEntries = state.pettyCash.filter(
    (entry) => entry.date.startsWith(selectedMonth) && getPettyCashType(entry.transactionTypeId).isExpense
  );
  const plannedTotal = selectedBudgets.reduce((sum, budget) => sum + budget.amount, 0);
  const actualTotal = monthExpenseEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const unbudgetedTotal = monthExpenseEntries.reduce((sum, entry) => {
    const hasBudget = selectedBudgets.some((budget) => budget.businessAreaId === entry.businessAreaId);
    return hasBudget ? sum : sum + entry.amount;
  }, 0);
  const remaining = plannedTotal - actualTotal;

  elements.pettyCashBudgetedValue.textContent = formatCurrency(plannedTotal);
  elements.pettyCashBudgetUsedValue.textContent = formatCurrency(actualTotal);
  elements.pettyCashBudgetRemainingValue.textContent =
    plannedTotal === 0 && actualTotal + unbudgetedTotal > 0
      ? `${formatCurrency(actualTotal + unbudgetedTotal)} unbudgeted`
      : remaining >= 0
        ? `${formatCurrency(remaining)} left`
        : `${formatCurrency(Math.abs(remaining))} over`;
  elements.pettyCashBudgetRemainingValue.classList.toggle(
    "negative-text",
    plannedTotal > 0 ? remaining < 0 : actualTotal + unbudgetedTotal > 0
  );

  if (selectedBudgets.length === 0) {
    elements.pettyCashBudgetMeta.textContent = `No petty cash budgets set for ${formatMonthLabel(selectedMonth)} yet.`;
    elements.pettyCashBudgetList.innerHTML = `
      <div class="empty-state">
        Save a petty cash budget above to know the total budgeted for ${escapeHtml(
          formatMonthLabel(selectedMonth)
        )} and compare it with Expense Paid entries.
      </div>
    `;
    return;
  }

  elements.pettyCashBudgetMeta.textContent = `Budgets for ${formatMonthLabel(selectedMonth)}. Total petty cash budgeted: ${formatCurrency(
    plannedTotal
  )}.${unbudgetedTotal > 0 ? ` Unbudgeted petty cash expense-paid entries: ${formatCurrency(unbudgetedTotal)}.` : ""}`;

  elements.pettyCashBudgetList.innerHTML = selectedBudgets
    .map((budget) => {
      const actual = getPettyCashBudgetActual(monthExpenseEntries, budget.businessAreaId);
      const budgetStatus = buildBudgetStatus(actual, budget.amount);
      const progressWidth = budget.amount > 0 ? Math.min((actual / budget.amount) * 100, 100) : 0;

      return `
        <article class="budget-item">
          <div class="budget-item-header">
            <strong>${escapeHtml(getBusinessArea(budget.businessAreaId).shortLabel)}</strong>
            <span class="budget-pill ${budgetStatus.pillClass}">${budgetStatus.label}</span>
          </div>
          <div class="budget-item-meta">
            <span>Budgeted: ${formatCurrency(budget.amount)}</span>
            <span>Expense Paid: ${formatCurrency(actual)}</span>
          </div>
          <div class="budget-progress" aria-hidden="true">
            <div
              class="budget-progress-bar ${budgetStatus.barClass}"
              style="width: ${progressWidth.toFixed(1)}%"
            ></div>
          </div>
          <div class="budget-item-status">
            <strong>${budgetStatus.message}</strong>
            <button
              class="budget-delete-btn"
              data-petty-budget-action="delete"
              data-id="${escapeHtml(budget.id)}"
              type="button"
            >
              Delete
            </button>
          </div>
          ${budget.notes ? `<span class="module-meta">${escapeHtml(budget.notes)}</span>` : ""}
        </article>
      `;
    })
    .join("");
}

function handlePettyCashBudgetAction(event) {
  const target = event.target.closest("button[data-petty-budget-action]");

  if (!target) {
    return;
  }

  if (target.dataset.pettyBudgetAction === "delete") {
    deletePettyCashBudget(target.dataset.id);
  }
}

function deletePettyCashBudget(budgetId) {
  const budget = state.pettyCashBudgets.find((item) => item.id === budgetId);

  if (!budget) {
    showToast("That petty cash budget could not be found.");
    return;
  }

  const shouldDelete = window.confirm(
    `Delete the petty cash budget for ${getBusinessArea(
      budget.businessAreaId
    ).shortLabel} in ${formatMonthLabel(budget.month)}?`
  );

  if (!shouldDelete) {
    return;
  }

  state.pettyCashBudgets = state.pettyCashBudgets.filter((item) => item.id !== budgetId);
  persistPettyCashBudgets();
  render();
  showToast("Petty cash budget deleted.");
}

function renderDataHub() {
  const totalRecords = getWorkspaceRecordTotal();
  const cards = [
    {
      title: "Expense Records",
      meta: `${state.expenses.length} stored`
    },
    {
      title: "Expense Budgets",
      meta: `${state.budgets.length} stored`
    },
    {
      title: "Daily Sales Records",
      meta: `${state.sales.length} stored`
    },
    {
      title: "Apartment Records",
      meta: `${state.rentals.length} stored`
    },
    {
      title: "Petty Cash Entries",
      meta: `${state.pettyCash.length} stored`
    },
    {
      title: "Petty Cash Budgets",
      meta: `${state.pettyCashBudgets.length} stored`
    },
    {
      title: "Salary Records",
      meta: `${state.salaryRecords.length} stored`
    },
    {
      title: "Cashbook / Bankbook Entries",
      meta: `${state.cashbookEntries.length} stored`
    },
    {
      title: "Procurement Records",
      meta: `${state.purchaseOrders.length} stored`
    },
    {
      title: "Laundry Tickets",
      meta: `${state.laundryTickets.length} stored`
    },
    {
      title: "Equipment Rental Bookings",
      meta: `${state.equipmentRentalBookings.length} stored`
    },
    {
      title: "Security Deposits & Charges",
      meta: `${state.securityDepositRecords.length} stored`
    },
    {
      title: "Ledger Entries",
      meta: `${state.ledgerEntries.length} stored`
    },
    {
      title: "Mobile Money Reconciliations",
      meta: `${state.mobileMoneyReconciliations.length} stored`
    },
    {
      title: "Supplier Ledger Records",
      meta: `${state.suppliers.length} stored`
    },
    {
      title: "Asset Records",
      meta: `${state.assetRecords.length} stored`
    },
    {
      title: "Forecast Plans",
      meta: `${state.forecastPlans.length} stored`
    },
    {
      title: "Recurring Controls",
      meta: `${state.recurringControls.length} stored`
    },
    {
      title: "Maintenance Records",
      meta: `${state.maintenanceRecords.length} stored`
    },
    {
      title: "User Profiles",
      meta: `${state.userProfiles.length} stored`
    }
  ];

  elements.dataHubCounts.innerHTML = cards
    .map(
      (card) => `
        <article class="module-card">
          <strong>${escapeHtml(card.title)}</strong>
          <span class="module-meta">${escapeHtml(card.meta)}</span>
        </article>
      `
    )
    .join("");

  elements.workbookStatusText.textContent =
    "The workbook is ready for download here and in the sidebar. The live Excel workbook currently writes back the core operational sheets: Summary, Expenses, Budget_Planner, Daily_Sales, Apartments, Petty_Cash, Petty_Cash_Budget, Salary_Register, Supplier_Ledger, Recurring_Controls, Maintenance_Log, and Lists. Salary_Register now also carries staff KPI metric, unit, target, and actual measurement fields. Newer modules such as KPI Dashboard, Search, Reminders, Cashbook / Bankbook, Procurement, Laundry Tickets, Equipment Rentals, Deposits, Ledgers, Mobile Money, Assets, Forecast, and Access export cleanly through current-view CSV and full backup.";
  elements.workbookImportHintText.textContent =
    "Import a completed workbook here when you want to merge spreadsheet entries back into the app without retyping them or replacing the records already stored. In the Apartments sheet, use Bills Paid only for money already received, leave it blank or 0.00 when there is still a balance to collect, and use Custom Total plus Custom Bill Items for extra charges. In Salary_Register, you can now fill staff KPI metric, unit, target, and actual measurement alongside payroll. The newer KPI, reminder, procurement, laundry, equipment rental, deposit, cashbook, ledger, mobile money, asset, forecast, and access modules are preserved through full backup export/import and current-view CSV export.";
  elements.backupStatusText.textContent = `${
    totalRecords === 0
      ? "No app records are stored in this browser yet."
      : `${totalRecords} total record${totalRecords === 1 ? "" : "s"} are stored in this browser right now.`
  } Export a full app backup before moving devices or clearing browser data. Display currency is ${state.currency}.`;
}

function matchesReportArea(recordAreaId, areaFilter) {
  return areaFilter === "" || normalizeBusinessAreaId(recordAreaId) === areaFilter;
}

function buildWorkspaceReport() {
  const range = resolveActiveReportRange();
  const areaFilter = normalizeBusinessAreaId(state.reportFilters.area);
  const areaLabel = areaFilter ? getBusinessArea(areaFilter).shortLabel : "All Business Areas";
  const expenses = state.expenses.filter(
    (record) => matchesReportArea(record.businessAreaId, areaFilter) && isDateInReportRange(record.date, range)
  );
  const budgets = state.budgets.filter(
    (record) => matchesReportArea(record.businessAreaId, areaFilter) && isMonthInReportRange(record.month, range)
  );
  const sales = state.sales.filter(
    (record) => matchesReportArea(record.businessAreaId, areaFilter) && isDateInReportRange(record.date, range)
  );
  const rentals = state.rentals.filter(
    (record) =>
      (areaFilter === "" || areaFilter === "rentals-apartments") && isMonthInReportRange(record.month, range)
  );
  const pettyCash = state.pettyCash.filter(
    (record) => matchesReportArea(record.businessAreaId, areaFilter) && isDateInReportRange(record.date, range)
  );
  const pettyCashBudgets = state.pettyCashBudgets.filter(
    (record) => matchesReportArea(record.businessAreaId, areaFilter) && isMonthInReportRange(record.month, range)
  );
  const salaryRecords = state.salaryRecords.filter(
    (record) => matchesReportArea(record.businessAreaId, areaFilter) && isMonthInReportRange(record.month, range)
  );
  const cashbookEntries = state.cashbookEntries.filter(
    (record) => matchesReportArea(record.businessAreaId, areaFilter) && isDateInReportRange(record.entryDate, range)
  );
  const purchaseOrders = state.purchaseOrders.filter(
    (record) =>
      matchesReportArea(record.businessAreaId, areaFilter) &&
      isDateInReportRange(record.requestDate, range)
  );
  const laundryTickets = state.laundryTickets.filter(
    (record) =>
      (areaFilter === "" || areaFilter === "laundry-services") &&
      isDateInReportRange(record.ticketDate, range)
  );
  const equipmentRentalBookings = state.equipmentRentalBookings.filter(
    (record) =>
      (areaFilter === "" || areaFilter === "water-equipment") &&
      isDateInReportRange(record.bookingDate || record.outDate, range)
  );
  const securityDepositRecords = state.securityDepositRecords.filter(
    (record) =>
      (areaFilter === "" || areaFilter === "rentals-apartments") &&
      isDateInReportRange(record.captureDate || record.depositDueDate || record.refundDueDate, range)
  );
  const ledgerEntries = state.ledgerEntries.filter(
    (record) =>
      matchesReportArea(record.businessAreaId, areaFilter) && isDateInReportRange(record.entryDate, range)
  );
  const mobileMoneyReconciliations = state.mobileMoneyReconciliations.filter(
    (record) =>
      (areaFilter === "" || areaFilter === "mobile-money") &&
      isDateInReportRange(record.date, range)
  );
  const suppliers = state.suppliers.filter(
    (record) =>
      matchesReportArea(record.businessAreaId, areaFilter) &&
      isDateInReportRange(record.invoiceDate || record.dueDate, range)
  );
  const assetRecords = state.assetRecords.filter(
    (record) =>
      matchesReportArea(record.businessAreaId, areaFilter) &&
      isDateInReportRange(record.acquiredDate || record.nextServiceDate, range)
  );
  const forecastPlans = state.forecastPlans.filter(
    (record) => matchesReportArea(record.businessAreaId, areaFilter) && isMonthInReportRange(record.month, range)
  );
  const recurringControls = state.recurringControls.filter(
    (record) =>
      matchesReportArea(record.businessAreaId, areaFilter) &&
      isDateInReportRange(record.nextDueDate || record.startDate, range)
  );
  const maintenanceRecords = state.maintenanceRecords.filter(
    (record) =>
      matchesReportArea(record.businessAreaId, areaFilter) &&
      isDateInReportRange(record.reportedDate || record.dueDate, range)
  );
  const latestRentalProfiles =
    areaFilter === "" || areaFilter === "rentals-apartments" ? getLatestRentalProfiles() : [];
  const apartmentAlerts =
    areaFilter === "" || areaFilter === "rentals-apartments"
      ? buildApartmentAlerts(latestRentalProfiles)
      : [];
  const currentApartmentBalance =
    areaFilter === "" || areaFilter === "rentals-apartments"
      ? latestRentalProfiles.reduce((sum, record) => sum + getTenantCurrentRunningBalance(record), 0)
      : 0;
  const currentSalaryOutstanding = state.salaryRecords
    .filter((record) => matchesReportArea(record.businessAreaId, areaFilter))
    .reduce((sum, record) => sum + getSalaryBalance(record), 0);
  const currentSupplierOutstanding = state.suppliers
    .filter((record) => matchesReportArea(record.businessAreaId, areaFilter))
    .reduce((sum, record) => sum + getSupplierOutstanding(record), 0);
  const currentPurchaseOrderOutstanding = state.purchaseOrders
    .filter((record) => matchesReportArea(record.businessAreaId, areaFilter))
    .reduce((sum, record) => sum + getPurchaseOrderOutstanding(record), 0);
  const currentLaundryOutstanding = state.laundryTickets
    .filter((record) => areaFilter === "" || areaFilter === "laundry-services")
    .reduce((sum, record) => sum + getLaundryBalance(record), 0);
  const currentEquipmentOutstanding = state.equipmentRentalBookings
    .filter((record) => areaFilter === "" || areaFilter === "water-equipment")
    .reduce((sum, record) => sum + getEquipmentRentalBalance(record), 0);
  const currentDepositExposure = state.securityDepositRecords
    .filter((record) => areaFilter === "" || areaFilter === "rentals-apartments")
    .reduce(
      (sum, record) =>
        sum +
        getSecurityDepositOutstanding(record) +
        getSecurityChargeOutstanding(record) +
        getSecurityRefundOutstanding(record),
      0
    );
  const currentLedgerOutstanding = Array.from(
    buildLedgerPartySummaryMap(
      state.ledgerEntries.filter((record) => matchesReportArea(record.businessAreaId, areaFilter))
    ).values()
  ).reduce((sum, record) => sum + Math.max(record.balance, 0), 0);
  const currentMobileMoneyVariance = state.mobileMoneyReconciliations
    .filter((record) => areaFilter === "" || areaFilter === "mobile-money")
    .reduce((sum, record) => sum + Math.abs(getMobileMoneyVariance(record)), 0);
  const currentAssetServiceDueCount = state.assetRecords.filter(
    (record) =>
      matchesReportArea(record.businessAreaId, areaFilter) &&
      ["overdue", "due-soon"].includes(getAssetServiceState(record).key)
  ).length;
  const currentMaintenanceOpenEstimate = state.maintenanceRecords
    .filter((record) => matchesReportArea(record.businessAreaId, areaFilter) && record.status !== "Completed")
    .reduce((sum, record) => sum + record.estimatedCost, 0);
  const salesTotal = sales.reduce((sum, record) => sum + record.amount, 0);
  const rentCollected = rentals.reduce((sum, record) => sum + record.rentPaid, 0);
  const billsRecovered = rentals.reduce((sum, record) => sum + getBillsPaidAmount(record), 0);
  const totalInflows = salesTotal + rentCollected + billsRecovered;
  const expenseTotal = expenses.reduce((sum, record) => sum + record.amount, 0);
  const salaryPaid = salaryRecords.reduce((sum, record) => sum + record.amountPaid, 0);
  const operatingSpend = expenseTotal + salaryPaid;
  const pettyExpensePaid = pettyCash
    .filter((record) => getPettyCashType(record.transactionTypeId).isExpense)
    .reduce((sum, record) => sum + record.amount, 0);
  const expenseBudgetTotal = budgets.reduce((sum, record) => sum + record.amount, 0);
  const pettyBudgetTotal = pettyCashBudgets.reduce((sum, record) => sum + record.amount, 0);
  const totalBudget = expenseBudgetTotal + pettyBudgetTotal;
  const netPosition = totalInflows - operatingSpend;
  const scopedRecordTotal =
    expenses.length +
    budgets.length +
    sales.length +
    rentals.length +
    pettyCash.length +
    pettyCashBudgets.length +
    salaryRecords.length +
    cashbookEntries.length +
    purchaseOrders.length +
    laundryTickets.length +
    equipmentRentalBookings.length +
    securityDepositRecords.length +
    ledgerEntries.length +
    mobileMoneyReconciliations.length +
    suppliers.length +
    assetRecords.length +
    forecastPlans.length +
    recurringControls.length +
    maintenanceRecords.length;
  const areaRows = buildReportAreaRows({
    areaFilter,
    expenses,
    budgets,
    sales,
    rentals,
    pettyCash,
    pettyCashBudgets,
    salaryRecords
  });
  const monthlyRows = buildReportMonthlyRows({
    range,
    areaFilter,
    expenses,
    sales,
    rentals,
    pettyCash,
    salaryRecords
  });
  const watchlistRows = buildReportWatchlistRows({
    areaFilter,
    apartmentAlerts,
    currentApartmentBalance,
    currentSalaryOutstanding,
    currentPurchaseOrderOutstanding,
    currentLaundryOutstanding,
    currentEquipmentOutstanding,
    currentDepositExposure,
    currentLedgerOutstanding,
    currentMobileMoneyVariance,
    currentAssetServiceDueCount,
    currentSupplierOutstanding,
    currentMaintenanceOpenEstimate,
    pendingExpenseReceipts: expenses.filter((record) => record.receiptStatus === "Pending").length,
    pendingPettyReceipts: pettyCash.filter((record) => record.receiptStatus === "Pending").length,
    recurringDueSoonCount: buildRecurringAlerts(
      state.recurringControls.filter((record) => matchesReportArea(record.businessAreaId, areaFilter))
    ).length,
    purchaseOrderDueSoonCount: buildPurchaseOrderAlerts(
      state.purchaseOrders.filter((record) => matchesReportArea(record.businessAreaId, areaFilter))
    ).length,
    laundryDueSoonCount: buildLaundryAlerts(
      state.laundryTickets.filter((record) => areaFilter === "" || areaFilter === "laundry-services")
    ).length,
    equipmentDueSoonCount: buildEquipmentRentalAlerts(
      state.equipmentRentalBookings.filter((record) => areaFilter === "" || areaFilter === "water-equipment")
    ).length,
    depositDueSoonCount: buildSecurityDepositAlerts(
      state.securityDepositRecords.filter((record) => areaFilter === "" || areaFilter === "rentals-apartments")
    ).length,
    salaryDueSoonCount: buildSalaryAlerts(
      state.salaryRecords.filter((record) => matchesReportArea(record.businessAreaId, areaFilter))
    ).length,
    supplierDueSoonCount: buildSupplierAlerts(
      state.suppliers.filter((record) => matchesReportArea(record.businessAreaId, areaFilter))
    ).length,
    maintenanceDueSoonCount: buildMaintenanceAlerts(
      state.maintenanceRecords.filter((record) => matchesReportArea(record.businessAreaId, areaFilter))
    ).length
  });
  const recordCountRows = [
    { label: "Expenses", count: expenses.length, view: "expenses" },
    { label: "Budget Controls", count: budgets.length, view: "expenses" },
    { label: "Daily Sales", count: sales.length, view: "sales" },
    { label: "Apartment Records", count: rentals.length, view: "apartments" },
    { label: "Petty Cash Entries", count: pettyCash.length, view: "petty-cash" },
    { label: "Petty Cash Budgets", count: pettyCashBudgets.length, view: "petty-cash" },
    { label: "Salary Records", count: salaryRecords.length, view: "salary" },
    { label: "Cashbook Entries", count: cashbookEntries.length, view: "cashbook" },
    { label: "Procurement Records", count: purchaseOrders.length, view: "procurement" },
    { label: "Laundry Tickets", count: laundryTickets.length, view: "laundry" },
    { label: "Equipment Rentals", count: equipmentRentalBookings.length, view: "equipment-rentals" },
    { label: "Deposit Records", count: securityDepositRecords.length, view: "deposits" },
    { label: "Ledger Entries", count: ledgerEntries.length, view: "ledgers" },
    { label: "MoMo Reconciliations", count: mobileMoneyReconciliations.length, view: "mobile-money" },
    { label: "Supplier Records", count: suppliers.length, view: "suppliers" },
    { label: "Asset Records", count: assetRecords.length, view: "assets" },
    { label: "Forecast Plans", count: forecastPlans.length, view: "forecast" },
    { label: "Recurring Controls", count: recurringControls.length, view: "recurring" },
    { label: "Maintenance Records", count: maintenanceRecords.length, view: "maintenance" }
  ];
  const metricCards = [
    { label: "Total Inflows", value: totalInflows, tone: "feature" },
    { label: "Sales Collected", value: salesTotal },
    { label: "Rent Collected", value: rentCollected },
    { label: "Bills Recovered", value: billsRecovered },
    { label: "Operating Spend", value: operatingSpend },
    { label: "Budgeted Spend", value: totalBudget },
    { label: "Net Position", value: netPosition, signed: true },
    {
      label: "Open Follow-Up",
      value:
        currentApartmentBalance +
        currentSalaryOutstanding +
        currentSupplierOutstanding +
        currentPurchaseOrderOutstanding +
        currentLaundryOutstanding +
        currentEquipmentOutstanding +
        currentDepositExposure +
        currentLedgerOutstanding,
      meta: "Apartments, payroll, procurement, laundry, equipment, deposits, suppliers, and receivables"
    }
  ];

  const report = {
    range,
    areaFilter,
    areaLabel,
    scopeLabel: `${range.label} • ${areaLabel}`,
    expenses,
    budgets,
    sales,
    rentals,
    pettyCash,
    pettyCashBudgets,
    salaryRecords,
    cashbookEntries,
    purchaseOrders,
    laundryTickets,
    equipmentRentalBookings,
    securityDepositRecords,
    ledgerEntries,
    mobileMoneyReconciliations,
    suppliers,
    assetRecords,
    forecastPlans,
    recurringControls,
    maintenanceRecords,
    apartmentAlerts,
    currentApartmentBalance,
    currentSalaryOutstanding,
    currentPurchaseOrderOutstanding,
    currentLaundryOutstanding,
    currentEquipmentOutstanding,
    currentDepositExposure,
    currentLedgerOutstanding,
    currentMobileMoneyVariance,
    currentAssetServiceDueCount,
    currentSupplierOutstanding,
    currentMaintenanceOpenEstimate,
    totals: {
      salesTotal,
      rentCollected,
      billsRecovered,
      totalInflows,
      expenseTotal,
      salaryPaid,
      operatingSpend,
      pettyExpensePaid,
      expenseBudgetTotal,
      pettyBudgetTotal,
      totalBudget,
      netPosition
    },
    metricCards,
    areaRows,
    monthlyRows,
    watchlistRows,
    recordCountRows,
    hasScopedRecords: scopedRecordTotal > 0
  };

  report.narrative = buildReportNarrative(report);
  return report;
}

function buildReportAreaRows(context) {
  const expenseByArea = new Map();
  const budgetByArea = new Map();
  const salesByArea = new Map();
  const pettyExpenseByArea = new Map();
  const pettyBudgetByArea = new Map();
  const salaryByArea = new Map();
  const rentCollected = context.rentals.reduce((sum, record) => sum + record.rentPaid, 0);
  const billsRecovered = context.rentals.reduce((sum, record) => sum + getBillsPaidAmount(record), 0);

  context.expenses.forEach((record) => {
    expenseByArea.set(record.businessAreaId, (expenseByArea.get(record.businessAreaId) || 0) + record.amount);
  });

  context.budgets.forEach((record) => {
    budgetByArea.set(record.businessAreaId, (budgetByArea.get(record.businessAreaId) || 0) + record.amount);
  });

  context.sales.forEach((record) => {
    salesByArea.set(record.businessAreaId, (salesByArea.get(record.businessAreaId) || 0) + record.amount);
  });

  context.pettyCash
    .filter((record) => getPettyCashType(record.transactionTypeId).isExpense)
    .forEach((record) => {
      pettyExpenseByArea.set(
        record.businessAreaId,
        (pettyExpenseByArea.get(record.businessAreaId) || 0) + record.amount
      );
    });

  context.pettyCashBudgets.forEach((record) => {
    pettyBudgetByArea.set(
      record.businessAreaId,
      (pettyBudgetByArea.get(record.businessAreaId) || 0) + record.amount
    );
  });

  context.salaryRecords.forEach((record) => {
    salaryByArea.set(record.businessAreaId, (salaryByArea.get(record.businessAreaId) || 0) + record.amountPaid);
  });

  return BUSINESS_AREAS.filter((area) => context.areaFilter === "" || area.id === context.areaFilter)
    .map((area) => {
      const salesCollected = salesByArea.get(area.id) || 0;
      const rentForArea = area.id === "rentals-apartments" ? rentCollected : 0;
      const billsForArea = area.id === "rentals-apartments" ? billsRecovered : 0;
      const expenses = expenseByArea.get(area.id) || 0;
      const salaryPaid = salaryByArea.get(area.id) || 0;
      const pettyExpensePaid = pettyExpenseByArea.get(area.id) || 0;
      const budgeted = budgetByArea.get(area.id) || 0;
      const pettyBudgeted = pettyBudgetByArea.get(area.id) || 0;
      const inflows = salesCollected + rentForArea + billsForArea;
      const operatingSpend = expenses + salaryPaid;
      const net = inflows - operatingSpend;
      const activity = inflows + operatingSpend + budgeted + pettyBudgeted;

      return {
        area,
        salesCollected,
        rentCollected: rentForArea,
        billsRecovered: billsForArea,
        inflows,
        expenses,
        salaryPaid,
        pettyExpensePaid,
        budgeted,
        pettyBudgeted,
        operatingSpend,
        net,
        activity
      };
    })
    .sort((left, right) => {
      if (right.activity !== left.activity) {
        return right.activity - left.activity;
      }

      return left.area.shortLabel.localeCompare(right.area.shortLabel);
    });
}

function buildReportMonthlyRows(context) {
  return listMonthsInRange(context.range).map((monthKey) => {
    const salesCollected = context.sales
      .filter((record) => normalizeDateInput(record.date).startsWith(monthKey))
      .reduce((sum, record) => sum + record.amount, 0);
    const rentCollected = context.rentals
      .filter((record) => record.month === monthKey)
      .reduce((sum, record) => sum + record.rentPaid, 0);
    const billsRecovered = context.rentals
      .filter((record) => record.month === monthKey)
      .reduce((sum, record) => sum + getBillsPaidAmount(record), 0);
    const expenseTotal = context.expenses
      .filter((record) => normalizeDateInput(record.date).startsWith(monthKey))
      .reduce((sum, record) => sum + record.amount, 0);
    const salaryPaid = context.salaryRecords
      .filter((record) => record.month === monthKey)
      .reduce((sum, record) => sum + record.amountPaid, 0);
    const pettyExpensePaid = context.pettyCash
      .filter(
        (record) =>
          normalizeDateInput(record.date).startsWith(monthKey) &&
          getPettyCashType(record.transactionTypeId).isExpense
      )
      .reduce((sum, record) => sum + record.amount, 0);
    const inflows = salesCollected + rentCollected + billsRecovered;
    const operatingSpend = expenseTotal + salaryPaid;

    return {
      month: monthKey,
      salesCollected,
      rentCollected,
      billsRecovered,
      inflows,
      expenseTotal,
      salaryPaid,
      pettyExpensePaid,
      operatingSpend,
      net: inflows - operatingSpend
    };
  });
}

function buildReportWatchlistRows(context) {
  return [
    {
      label: "Pending Receipts",
      value: String(context.pendingExpenseReceipts + context.pendingPettyReceipts),
      meta: `${context.pendingExpenseReceipts} expense and ${context.pendingPettyReceipts} petty cash entries`,
      view: context.pendingPettyReceipts > 0 ? "petty-cash" : "expenses"
    },
    {
      label: "Apartment Balance Due",
      value: formatCurrency(context.currentApartmentBalance),
      meta: `${context.apartmentAlerts.length} apartment alert${context.apartmentAlerts.length === 1 ? "" : "s"} live`,
      view: "apartments"
    },
    {
      label: "Salary Outstanding",
      value: formatCurrency(context.currentSalaryOutstanding),
      meta: `${context.salaryDueSoonCount} salary alert${context.salaryDueSoonCount === 1 ? "" : "s"} due soon`,
      view: "salary"
    },
    {
      label: "Ledger Receivables",
      value: formatCurrency(context.currentLedgerOutstanding),
      meta: "Manual customer and tenant balances still open",
      view: "ledgers"
    },
    {
      label: "MoMo Variance Watch",
      value: formatCurrency(context.currentMobileMoneyVariance),
      meta: "Absolute float variance across reconciliations",
      view: "mobile-money"
    },
    {
      label: "Supplier Outstanding",
      value: formatCurrency(context.currentSupplierOutstanding),
      meta: `${context.supplierDueSoonCount} supplier alert${context.supplierDueSoonCount === 1 ? "" : "s"} due soon`,
      view: "suppliers"
    },
    {
      label: "Procurement Outstanding",
      value: formatCurrency(context.currentPurchaseOrderOutstanding),
      meta: `${context.purchaseOrderDueSoonCount} procurement alert${
        context.purchaseOrderDueSoonCount === 1 ? "" : "s"
      } due soon`,
      view: "procurement"
    },
    {
      label: "Laundry Balances",
      value: formatCurrency(context.currentLaundryOutstanding),
      meta: `${context.laundryDueSoonCount} laundry alert${context.laundryDueSoonCount === 1 ? "" : "s"} live`,
      view: "laundry"
    },
    {
      label: "Equipment Rental Balances",
      value: formatCurrency(context.currentEquipmentOutstanding),
      meta: `${context.equipmentDueSoonCount} return alert${context.equipmentDueSoonCount === 1 ? "" : "s"} live`,
      view: "equipment-rentals"
    },
    {
      label: "Deposit / Charge Exposure",
      value: formatCurrency(context.currentDepositExposure),
      meta: `${context.depositDueSoonCount} deposit or refund alert${
        context.depositDueSoonCount === 1 ? "" : "s"
      } due soon`,
      view: "deposits"
    },
    {
      label: "Recurring Controls Due",
      value: String(context.recurringDueSoonCount),
      meta: "Due soon or overdue controls",
      view: "recurring"
    },
    {
      label: "Maintenance Open Estimate",
      value: formatCurrency(context.currentMaintenanceOpenEstimate),
      meta: `${context.maintenanceDueSoonCount} maintenance deadline${context.maintenanceDueSoonCount === 1 ? "" : "s"} due soon`,
      view: "maintenance"
    },
    {
      label: "Assets Needing Service",
      value: String(context.currentAssetServiceDueCount),
      meta: "Assets with overdue or near-due service dates",
      view: "assets"
    }
  ];
}

function buildReportNarrative(report) {
  if (
    report.expenses.length +
      report.budgets.length +
      report.sales.length +
      report.rentals.length +
      report.pettyCash.length +
      report.pettyCashBudgets.length +
      report.salaryRecords.length +
      report.cashbookEntries.length +
      report.purchaseOrders.length +
      report.laundryTickets.length +
      report.equipmentRentalBookings.length +
      report.securityDepositRecords.length +
      report.ledgerEntries.length +
      report.mobileMoneyReconciliations.length +
      report.suppliers.length +
      report.assetRecords.length +
      report.forecastPlans.length +
      report.recurringControls.length +
      report.maintenanceRecords.length ===
    0
  ) {
    return `No captured records fall inside ${report.scopeLabel} yet. Use this page after saving expenses, sales, apartments, petty cash, cashbook movements, procurement, laundry jobs, equipment rentals, deposits, payroll, ledgers, mobile money reconciliations, assets, forecast plans, suppliers, recurring controls, or maintenance items to get a full operating report.`;
  }

  const topArea = report.areaRows[0] || null;
  const negativeAreas = report.areaRows.filter((item) => item.net < 0).length;
  const openFollowUp =
    report.currentApartmentBalance +
    report.currentSalaryOutstanding +
    report.currentPurchaseOrderOutstanding +
    report.currentLaundryOutstanding +
    report.currentEquipmentOutstanding +
    report.currentDepositExposure +
    report.currentSupplierOutstanding +
    report.currentLedgerOutstanding;

  return `${report.scopeLabel} shows inflows of ${formatCurrency(
    report.totals.totalInflows
  )} against operating spend of ${formatCurrency(report.totals.operatingSpend)}, leaving a net position of ${formatSignedCurrency(
    report.totals.netPosition
  )}. ${
    topArea
      ? `${topArea.area.shortLabel} leads activity at ${formatCurrency(topArea.inflows)} in inflows.`
      : ""
  } ${negativeAreas > 0 ? `${negativeAreas} business area${negativeAreas === 1 ? "" : "s"} are currently net-negative in this range.` : "No business area is net-negative in this range."} Open follow-up outside the period view currently stands at ${formatCurrency(
    openFollowUp
  )}.`;
}

function renderReportsPage() {
  if (!elements.reportsViewRoot) {
    return;
  }

  const report = buildWorkspaceReport();
  const reportSalaryAlertCount = buildSalaryAlerts(
    state.salaryRecords.filter((record) => matchesReportArea(record.businessAreaId, report.areaFilter))
  ).length;
  const reportAreaChart = buildComparisonChartCard({
    eyebrow: "Area Matrix",
    title: "Inflows vs Operating Spend",
    note: "Compare business area inflows against direct operating spend across the selected reporting scope.",
    rows: report.areaRows.map((row) => ({
      label: row.area.shortLabel,
      primary: row.inflows,
      secondary: row.operatingSpend,
      meta: `Budget ${formatCurrency(row.budgeted + row.pettyBudgeted)} • Petty cash ${formatCurrency(
        row.pettyExpensePaid
      )}`,
      valueLabel: formatSignedCurrency(row.net),
      valueClass: row.net < 0 ? "negative-text" : ""
    })),
    primaryLabel: "Inflows",
    secondaryLabel: "Spend",
    emptyMessage: "No area activity falls inside the selected report scope yet.",
    summaryItems: [
      {
        label: "Top Inflow Area",
        value: report.areaRows[0] ? report.areaRows[0].area.shortLabel : "No activity"
      },
      {
        label: "Net-Negative Areas",
        value: String(report.areaRows.filter((row) => row.net < 0).length)
      },
      {
        label: "Budgeted Spend",
        value: formatCurrency(report.totals.totalBudget)
      }
    ]
  });
  const reportTrendChart = buildComparisonChartCard({
    eyebrow: "Trend",
    title: "Monthly Inflows vs Spend",
    note: "This trend follows the same report scope above, month by month, so retrospective and prospective windows stay aligned.",
    rows: report.monthlyRows.map((row) => ({
      label: formatMonthLabel(row.month),
      primary: row.inflows,
      secondary: row.operatingSpend,
      meta: `Sales ${formatCurrency(row.salesCollected)} • Rent ${formatCurrency(
        row.rentCollected + row.billsRecovered
      )} • Petty cash ${formatCurrency(row.pettyExpensePaid)}`,
      valueLabel: formatSignedCurrency(row.net),
      valueClass: row.net < 0 ? "negative-text" : ""
    })),
    primaryLabel: "Inflows",
    secondaryLabel: "Spend",
    wide: true,
    emptyMessage: "No monthly records fall inside the selected reporting scope yet.",
    summaryItems: [
      {
        label: "Total Inflows",
        value: formatCurrency(report.totals.totalInflows)
      },
      {
        label: "Operating Spend",
        value: formatCurrency(report.totals.operatingSpend)
      },
      {
        label: "Net Position",
        value: formatSignedCurrency(report.totals.netPosition),
        valueClass: report.totals.netPosition < 0 ? "negative-text" : ""
      }
    ]
  });
  const reportExposureRows = [
    {
      label: "Apartments",
      value: report.currentApartmentBalance,
      footer: `${report.apartmentAlerts.length} apartment alert${report.apartmentAlerts.length === 1 ? "" : "s"}`
    },
    {
      label: "Payroll",
      value: report.currentSalaryOutstanding,
      footer: `${reportSalaryAlertCount} salary alert${reportSalaryAlertCount === 1 ? "" : "s"}`
    },
    {
      label: "Suppliers",
      value: report.currentSupplierOutstanding,
      footer: "Open supplier balances"
    },
    {
      label: "Procurement",
      value: report.currentPurchaseOrderOutstanding,
      footer: "Outstanding purchase orders"
    },
    {
      label: "Laundry",
      value: report.currentLaundryOutstanding,
      footer: "Customer balances still open"
    },
    {
      label: "Equipment",
      value: report.currentEquipmentOutstanding,
      footer: "Rental balances still open"
    },
    {
      label: "Deposits / Charges",
      value: report.currentDepositExposure,
      footer: "Deposits, charges, and refunds"
    },
    {
      label: "Ledgers",
      value: report.currentLedgerOutstanding,
      footer: "Receivables still open"
    },
    {
      label: "Maintenance",
      value: report.currentMaintenanceOpenEstimate,
      footer: "Open estimated maintenance cost"
    }
  ].sort((left, right) => right.value - left.value);
  const reportExposureChart = buildSingleSeriesChartCard({
    eyebrow: "Exposure",
    title: "Current Follow-Up Backlog",
    note: "These balances stay live even when the report window is historical, so you can compare period performance with today’s open follow-up.",
    rows: reportExposureRows.map((row) => ({
      label: row.label,
      value: row.value,
      valueLabel: formatCurrency(row.value),
      footer: row.footer,
      tone: row.value > 0 ? "warning" : "accent"
    })),
    emptyMessage: "No open balances or backlog exposure are currently visible for this scope.",
    summaryItems: [
      {
        label: "Open Follow-Up",
        value: formatCurrency(
          report.currentApartmentBalance +
            report.currentSalaryOutstanding +
            report.currentSupplierOutstanding +
            report.currentPurchaseOrderOutstanding +
            report.currentLaundryOutstanding +
            report.currentEquipmentOutstanding +
            report.currentDepositExposure +
            report.currentLedgerOutstanding
        )
      },
      {
        label: "Receipts Pending",
        value: String(
          report.expenses.filter((record) => record.receiptStatus === "Pending").length +
            report.pettyCash.filter((record) => record.receiptStatus === "Pending").length
        )
      },
      {
        label: "Service Due",
        value: String(report.currentAssetServiceDueCount)
      }
    ]
  });

  elements.reportsViewRoot.innerHTML = `
    <section class="page-grid compact-page-grid">
      <section class="section-card">
        <div class="section-heading">
          <div>
            <p class="kicker">Business Reporting</p>
            <h3>Cross-Area Performance & Controls</h3>
          </div>
          <p class="muted-text">
            Review inflows, spend, balances, and follow-up work across the OneRoot essentials ecosystem.
          </p>
        </div>

        <p class="body-copy">${escapeHtml(report.narrative)}</p>

        <div class="filter-grid">
          <label>
            <span>Report Range</span>
            <select id="reportPresetFilter">
              ${buildSelectMarkup(REPORT_PRESET_OPTIONS, state.reportFilters.preset, "Choose range")}
            </select>
          </label>

          <label>
            <span>From Month</span>
            <input id="reportFromMonth" type="month" value="${escapeHtml(report.range.fromMonth)}" />
          </label>

          <label>
            <span>To Month</span>
            <input id="reportToMonth" type="month" value="${escapeHtml(report.range.toMonth)}" />
          </label>

          <label>
            <span>Business Area</span>
            <select id="reportAreaFilter">
              ${buildSelectMarkup(getBusinessAreaOptions(), state.reportFilters.area, "All Areas")}
            </select>
          </label>
        </div>

        <div class="form-actions">
          <button class="button button-primary" data-report-action="export-summary" type="button">
            Export Report CSV
          </button>
          <button class="button button-secondary" data-report-action="export-area-matrix" type="button">
            Export Area Matrix CSV
          </button>
          <button class="button button-secondary" data-report-action="download-snapshot" type="button">
            Download HTML Snapshot
          </button>
          <button class="button button-ghost" data-report-action="reset" type="button">
            Reset Report Filters
          </button>
        </div>
      </section>

      <aside class="sidebar-column">
        <section class="section-card">
          <div class="section-heading compact">
            <div>
              <p class="kicker">Scope</p>
              <h3>Report Coverage</h3>
            </div>
          </div>

          <div class="guide-list compact-guide-list">
            <p>${escapeHtml(report.scopeLabel)}</p>
            <p>${escapeHtml(report.range.presetLabel)} preset applied. Use custom months whenever you need retrospective or prospective comparison windows.</p>
            <p>The top workbook export button still gives you the live Excel workbook from the current app data if you want spreadsheet handover after reviewing this report.</p>
          </div>
        </section>

        <section class="section-card">
          <div class="section-heading compact">
            <div>
              <p class="kicker">Records In Scope</p>
              <h3>Coverage Counts</h3>
            </div>
          </div>

          <div class="module-grid compact-module-grid">
            ${report.recordCountRows
              .map(
                (row) => `
                  <article class="module-card">
                    <strong>${escapeHtml(row.label)}</strong>
                    <span class="module-meta">${escapeHtml(
                      `${row.count} record${row.count === 1 ? "" : "s"}`
                    )}</span>
                  </article>
                `
              )
              .join("")}
          </div>
        </section>
      </aside>
    </section>

    <section class="dashboard-grid">
      ${report.metricCards
        .map(
          (card, index) => `
            <article class="section-card stat-card ${card.tone === "feature" ? "stat-card-feature" : ""}">
              <span>${escapeHtml(card.label)}</span>
              <strong>${escapeHtml(
                card.signed ? formatSignedCurrency(card.value) : formatCurrency(card.value)
              )}</strong>
              <p class="muted-text">${escapeHtml(
                card.meta ||
                  (index === 0
                    ? "Sales, rent, and bills recovered in the selected scope."
                    : card.label === "Budgeted Spend"
                      ? "Expense budgets plus petty cash budgets in the selected scope."
                      : "Calculated from records already saved in the workspace.")
              )}</p>
            </article>
          `
        )
        .join("")}
    </section>

    <section class="chart-grid">
      ${reportTrendChart}
      ${reportAreaChart}
      ${reportExposureChart}
    </section>

    <section class="two-column-grid">
      <article class="section-card">
        <div class="section-heading compact">
          <div>
            <p class="kicker">Area Profit Matrix</p>
            <h3>Profit By Business Area</h3>
          </div>
        </div>

        <div class="table-wrap compact-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Area</th>
                <th>Inflows</th>
                <th>Expenses</th>
                <th>Salary</th>
                <th>Budget</th>
                <th>Net</th>
                <th>Margin</th>
              </tr>
            </thead>
            <tbody>
              ${
                !report.hasScopedRecords
                  ? `
                      <tr>
                        <td colspan="7" class="empty-state">No business area records fall inside the selected report range yet.</td>
                      </tr>
                    `
                  : report.areaRows
                      .map(
                        (row) => `
                          <tr>
                            <td>
                              <span class="table-primary">${escapeHtml(row.area.shortLabel)}</span>
                              <span class="table-secondary">Sales ${escapeHtml(formatCurrency(row.salesCollected))} • Rent ${escapeHtml(
                                formatCurrency(row.rentCollected)
                              )} • Bills ${escapeHtml(formatCurrency(row.billsRecovered))}</span>
                            </td>
                            <td>${escapeHtml(formatCurrency(row.inflows))}</td>
                            <td>${escapeHtml(formatCurrency(row.expenses))}</td>
                            <td>${escapeHtml(formatCurrency(row.salaryPaid))}</td>
                            <td>${escapeHtml(formatCurrency(row.budgeted + row.pettyBudgeted))}</td>
                            <td class="${row.net < 0 ? "negative-text" : ""}">${escapeHtml(formatSignedCurrency(row.net))}</td>
                            <td>${escapeHtml(
                              row.inflows > 0 ? `${((row.net / row.inflows) * 100).toFixed(1)}%` : "n/a"
                            )}</td>
                          </tr>
                        `
                      )
                      .join("")
              }
            </tbody>
          </table>
        </div>
      </article>

      <article class="section-card">
        <div class="section-heading compact">
          <div>
            <p class="kicker">Trend</p>
            <h3>Monthly Movement</h3>
          </div>
        </div>

        <div class="table-wrap compact-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Inflows</th>
                <th>Spend</th>
                <th>Net</th>
              </tr>
            </thead>
            <tbody>
              ${
                !report.hasScopedRecords
                  ? `
                      <tr>
                        <td colspan="4" class="empty-state">No monthly activity falls inside the selected report range yet.</td>
                      </tr>
                    `
                  : report.monthlyRows
                      .map(
                        (row) => `
                          <tr>
                            <td>
                              <span class="table-primary">${escapeHtml(formatMonthLabel(row.month))}</span>
                              <span class="table-secondary">Sales ${escapeHtml(formatCurrency(row.salesCollected))} • Rent ${escapeHtml(
                                formatCurrency(row.rentCollected)
                              )} • Bills ${escapeHtml(formatCurrency(row.billsRecovered))}</span>
                            </td>
                            <td>${escapeHtml(formatCurrency(row.inflows))}</td>
                            <td>${escapeHtml(formatCurrency(row.operatingSpend))}</td>
                            <td class="${row.net < 0 ? "negative-text" : ""}">${escapeHtml(formatSignedCurrency(row.net))}</td>
                          </tr>
                        `
                      )
                      .join("")
              }
            </tbody>
          </table>
        </div>
      </article>
    </section>

    <section class="two-column-grid">
      <article class="section-card">
        <div class="section-heading compact">
          <div>
            <p class="kicker">Watchlist</p>
            <h3>Current Follow-Up</h3>
          </div>
        </div>

        <div class="module-grid compact-module-grid">
          ${report.watchlistRows
            .map(
              (row) => `
                <article class="module-card">
                  <strong>${escapeHtml(row.label)}</strong>
                  <span class="module-meta">${escapeHtml(row.value)}</span>
                  <span class="module-meta">${escapeHtml(row.meta)}</span>
                </article>
              `
            )
            .join("")}
        </div>
      </article>

      <article class="section-card">
        <div class="section-heading compact">
          <div>
            <p class="kicker">Control Notes</p>
            <h3>What This Report Includes</h3>
          </div>
        </div>

        <div class="guide-list compact-guide-list">
          <p>Inflows combine saved daily sales, apartment rent collected, and apartment bills recovered inside the selected reporting scope.</p>
          <p>Operating spend combines normal expenses and salary paid. Petty cash expense-paid entries are shown in reports but not added again to spend so totals do not double-count synced expenses.</p>
          <p>Open follow-up values are current balances from apartments, payroll, suppliers, and maintenance, so they stay useful even when your report range is historical.</p>
        </div>
      </article>
    </section>
  `;
}

function handleReportAction(action) {
  const report = buildWorkspaceReport();

  if (action === "reset") {
    state.reportFilters = createDefaultReportFilters();
    applyReportPreset(state.reportFilters.preset, { silent: true });
    render();
    showToast("Report filters reset.");
    return;
  }

  if (action === "export-summary") {
    exportReportSummaryCsv(report);
    return;
  }

  if (action === "export-area-matrix") {
    exportReportAreaMatrixCsv(report);
    return;
  }

  if (action === "download-snapshot") {
    downloadReportSnapshot(report);
  }
}

async function exportReportSummaryCsv(report) {
  const rows = [
    ["OneRoot Report Scope", report.scopeLabel],
    ["Preset", report.range.presetLabel],
    [],
    ["Metric", "Value"],
    ["Total Inflows", report.totals.totalInflows.toFixed(2)],
    ["Sales Collected", report.totals.salesTotal.toFixed(2)],
    ["Rent Collected", report.totals.rentCollected.toFixed(2)],
    ["Bills Recovered", report.totals.billsRecovered.toFixed(2)],
    ["Operating Spend", report.totals.operatingSpend.toFixed(2)],
    ["Expense Total", report.totals.expenseTotal.toFixed(2)],
    ["Salary Paid", report.totals.salaryPaid.toFixed(2)],
    ["Budgeted Spend", report.totals.totalBudget.toFixed(2)],
    ["Petty Cash Expense Paid", report.totals.pettyExpensePaid.toFixed(2)],
    ["Net Position", report.totals.netPosition.toFixed(2)],
    ["Current Apartment Balance", report.currentApartmentBalance.toFixed(2)],
    ["Current Salary Outstanding", report.currentSalaryOutstanding.toFixed(2)],
    ["Current Supplier Outstanding", report.currentSupplierOutstanding.toFixed(2)],
    ["Current Maintenance Open Estimate", report.currentMaintenanceOpenEstimate.toFixed(2)],
    [],
    ["Area", "Inflows", "Expenses", "Salary", "Budget", "Net"]
  ];

  report.areaRows.forEach((row) => {
    rows.push([
      row.area.label,
      row.inflows.toFixed(2),
      row.expenses.toFixed(2),
      row.salaryPaid.toFixed(2),
      (row.budgeted + row.pettyBudgeted).toFixed(2),
      row.net.toFixed(2)
    ]);
  });

  rows.push([]);
  rows.push(["Month", "Inflows", "Spend", "Net"]);

  report.monthlyRows.forEach((row) => {
    rows.push([
      formatMonthLabel(row.month),
      row.inflows.toFixed(2),
      row.operatingSpend.toFixed(2),
      row.net.toFixed(2)
    ]);
  });

  rows.push([]);
  rows.push(["Watchlist Item", "Value", "Notes"]);

  report.watchlistRows.forEach((row) => {
    rows.push([row.label, row.value, row.meta]);
  });

  const saved = await saveCsvFile(`oneroot-report-summary-${dateStamp()}.csv`, rows);

  if (saved) {
    showToast("Report summary CSV exported.");
  }
}

async function exportReportAreaMatrixCsv(report) {
  const rows = [
    [
      "Area",
      "Sales Collected",
      "Rent Collected",
      "Bills Recovered",
      "Inflows",
      "Expenses",
      "Salary Paid",
      "Petty Cash Expense Paid",
      "Budgeted Expenses",
      "Petty Cash Budgeted",
      "Net",
      "Margin Percent"
    ],
    ...report.areaRows.map((row) => [
      row.area.label,
      row.salesCollected.toFixed(2),
      row.rentCollected.toFixed(2),
      row.billsRecovered.toFixed(2),
      row.inflows.toFixed(2),
      row.expenses.toFixed(2),
      row.salaryPaid.toFixed(2),
      row.pettyExpensePaid.toFixed(2),
      row.budgeted.toFixed(2),
      row.pettyBudgeted.toFixed(2),
      row.net.toFixed(2),
      row.inflows > 0 ? ((row.net / row.inflows) * 100).toFixed(1) : ""
    ])
  ];

  const saved = await saveCsvFile(`oneroot-area-matrix-${dateStamp()}.csv`, rows);

  if (saved) {
    showToast("Area matrix CSV exported.");
  }
}

async function downloadReportSnapshot(report) {
  const summaryMarkup = report.metricCards
    .map(
      (card) => `
        <div class="metric-card">
          <div class="metric-label">${escapeHtml(card.label)}</div>
          <div class="metric-value">${escapeHtml(
            card.signed ? formatSignedCurrency(card.value) : formatCurrency(card.value)
          )}</div>
          <div class="metric-meta">${escapeHtml(card.meta || "")}</div>
        </div>
      `
    )
    .join("");
  const areaRowsMarkup =
    !report.hasScopedRecords
      ? `<tr><td colspan="6">No business area records were found in this report range.</td></tr>`
      : report.areaRows
          .map(
            (row) => `
              <tr>
                <td>${escapeHtml(row.area.label)}</td>
                <td>${escapeHtml(formatCurrency(row.inflows))}</td>
                <td>${escapeHtml(formatCurrency(row.expenses))}</td>
                <td>${escapeHtml(formatCurrency(row.salaryPaid))}</td>
                <td>${escapeHtml(formatCurrency(row.budgeted + row.pettyBudgeted))}</td>
                <td>${escapeHtml(formatSignedCurrency(row.net))}</td>
              </tr>
            `
          )
          .join("");
  const trendRowsMarkup =
    !report.hasScopedRecords
      ? `<tr><td colspan="4">No monthly activity was found in this report range.</td></tr>`
      : report.monthlyRows
          .map(
            (row) => `
              <tr>
                <td>${escapeHtml(formatMonthLabel(row.month))}</td>
                <td>${escapeHtml(formatCurrency(row.inflows))}</td>
                <td>${escapeHtml(formatCurrency(row.operatingSpend))}</td>
                <td>${escapeHtml(formatSignedCurrency(row.net))}</td>
              </tr>
            `
          )
          .join("");
  const watchlistMarkup = report.watchlistRows
    .map(
      (row) => `
        <li><strong>${escapeHtml(row.label)}:</strong> ${escapeHtml(row.value)} • ${escapeHtml(row.meta)}</li>
      `
    )
    .join("");
  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>OneRoot Report Snapshot</title>
    <style>
      body { font-family: Georgia, "Times New Roman", serif; margin: 32px; color: #1f2e24; background: #f7f4ee; }
      h1, h2 { margin-bottom: 8px; }
      p { line-height: 1.6; }
      .meta { color: #496050; margin-bottom: 20px; }
      .metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 20px 0 28px; }
      .metric-card { background: #ffffff; border: 1px solid #d9e3d8; border-radius: 16px; padding: 14px; }
      .metric-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #496050; }
      .metric-value { font-size: 22px; font-weight: 700; margin-top: 6px; }
      .metric-meta { font-size: 13px; margin-top: 6px; color: #5a6d5f; }
      table { width: 100%; border-collapse: collapse; margin: 14px 0 24px; background: #ffffff; }
      th, td { border: 1px solid #d9e3d8; padding: 10px 12px; text-align: left; }
      th { background: #e7efe5; }
      ul { padding-left: 20px; }
      @media print {
        body { margin: 18px; background: #ffffff; }
        .metric-card, table { break-inside: avoid; }
      }
    </style>
  </head>
  <body>
    <h1>OneRoot Operations Report Snapshot</h1>
    <p class="meta">${escapeHtml(report.scopeLabel)} • Generated ${escapeHtml(
      formatDisplayDate(getTodayInputValue())
    )}</p>
    <p>${escapeHtml(report.narrative)}</p>

    <section class="metrics">${summaryMarkup}</section>

    <h2>Business Area Performance</h2>
    <table>
      <thead>
        <tr>
          <th>Area</th>
          <th>Inflows</th>
          <th>Expenses</th>
          <th>Salary</th>
          <th>Budget</th>
          <th>Net</th>
        </tr>
      </thead>
      <tbody>${areaRowsMarkup}</tbody>
    </table>

    <h2>Monthly Trend</h2>
    <table>
      <thead>
        <tr>
          <th>Month</th>
          <th>Inflows</th>
          <th>Spend</th>
          <th>Net</th>
        </tr>
      </thead>
      <tbody>${trendRowsMarkup}</tbody>
    </table>

    <h2>Current Follow-Up</h2>
    <ul>${watchlistMarkup}</ul>
  </body>
</html>`;

  const saved = await saveTextFile(
    `oneroot-report-snapshot-${dateStamp()}.html`,
    html,
    "text/html;charset=utf-8;"
  );

  if (saved) {
    showToast("Report snapshot downloaded.");
  }
}

function renderSuppliersPage() {
  if (!elements.suppliersViewRoot) {
    return;
  }

  const editingRecord = state.suppliers.find((item) => item.id === state.editingSupplierId) || null;
  const draft = editingRecord || createEmptySupplierDraft();
  const suppliers = getFilteredSuppliers();
  const totalDue = suppliers.reduce((sum, record) => sum + record.amountDue, 0);
  const totalPaid = suppliers.reduce((sum, record) => sum + record.amountPaid, 0);
  const outstanding = suppliers.reduce((sum, record) => sum + getSupplierOutstanding(record), 0);
  const overdueCount = suppliers.filter((record) => getSupplierPaymentStatus(record) === "Overdue").length;
  const paymentMethods = mergeUniqueOptions(
    BASE_PAYMENT_METHODS,
    state.suppliers.map((record) => record.paymentMethod)
  );

  elements.suppliersViewRoot.innerHTML = `
    <section class="page-grid compact-page-grid">
      <section class="section-card">
        <div class="section-heading">
          <div>
            <p class="kicker">Supplier Ledger</p>
            <h3>${editingRecord ? "Edit Supplier Record" : "Track Supplier Bills & Payments"}</h3>
          </div>
          <p class="muted-text">
            Capture what each supplier is owed, what has already been paid, and what still needs follow-up.
          </p>
        </div>

        <form id="supplierForm" novalidate>
          <div class="mini-form-grid rental-form-grid">
            <label>
              <span>Invoice Date</span>
              <input id="supplierInvoiceDate" name="supplierInvoiceDate" type="date" value="${escapeHtml(
                draft.invoiceDate
              )}" required />
            </label>

            <label>
              <span>Business Area</span>
              <select id="supplierBusinessArea" name="supplierBusinessArea" required>
                ${buildSelectMarkup(getBusinessAreaOptions(), draft.businessAreaId, "Choose business area")}
              </select>
            </label>

            <label>
              <span>Supplier</span>
              <input
                id="supplierName"
                name="supplierName"
                type="text"
                value="${escapeHtml(draft.supplierName)}"
                placeholder="Supplier or vendor name"
                required
              />
            </label>

            <label>
              <span>Expense Type</span>
              <select id="supplierCategory" name="supplierCategory">
                ${buildSelectMarkup(
                  getMergedAreaCategories(),
                  draft.category,
                  "Choose expense type"
                )}
              </select>
            </label>

            <label class="wide-field">
              <span>Item / Description</span>
              <input
                id="supplierItemDescription"
                name="supplierItemDescription"
                type="text"
                value="${escapeHtml(draft.itemDescription)}"
                placeholder="What was supplied or billed"
              />
            </label>

            <label>
              <span>Invoice Reference</span>
              <input
                id="supplierInvoiceReference"
                name="supplierInvoiceReference"
                type="text"
                value="${escapeHtml(draft.invoiceReference)}"
                placeholder="Invoice no. or supplier ref"
              />
            </label>

            <label>
              <span>Amount Due</span>
              <input
                id="supplierAmountDue"
                name="supplierAmountDue"
                type="number"
                min="0"
                step="0.01"
                value="${escapeHtml(formatAmountInputValue(draft.amountDue))}"
                placeholder="0.00"
                required
              />
            </label>

            <label>
              <span>Amount Paid</span>
              <input
                id="supplierAmountPaid"
                name="supplierAmountPaid"
                type="number"
                min="0"
                step="0.01"
                value="${escapeHtml(formatAmountInputValue(draft.amountPaid))}"
                placeholder="0.00"
              />
            </label>

            <label>
              <span>Due Date</span>
              <input id="supplierDueDate" name="supplierDueDate" type="date" value="${escapeHtml(
                draft.dueDate
              )}" />
            </label>

            <label>
              <span>Payment Date</span>
              <input id="supplierPaymentDate" name="supplierPaymentDate" type="date" value="${escapeHtml(
                draft.paymentDate
              )}" />
            </label>

            <label>
              <span>Payment Method</span>
              <select id="supplierPaymentMethod" name="supplierPaymentMethod">
                ${buildSelectMarkup(paymentMethods, draft.paymentMethod, "Choose payment method")}
              </select>
            </label>

            <label class="wide-field">
              <span>Notes</span>
              <textarea
                id="supplierNotes"
                name="supplierNotes"
                rows="3"
                placeholder="Payment plan, contact notes, or follow-up details"
              >${escapeHtml(draft.notes)}</textarea>
            </label>
          </div>

          <div class="form-actions">
            <button id="submitSupplierBtn" class="button button-primary" type="submit">
              ${editingRecord ? "Update Supplier Record" : "Save Supplier Record"}
            </button>
            <button id="resetSupplierBtn" class="button button-secondary" type="button">
              Clear Form
            </button>
            <button
              id="cancelSupplierEditBtn"
              class="button button-ghost ${editingRecord ? "" : "hidden"}"
              type="button"
            >
              Cancel Edit
            </button>
          </div>
        </form>
      </section>

      <aside class="sidebar-column">
        <section class="section-card">
          <div class="section-heading compact">
            <div>
              <p class="kicker">Payables Snapshot</p>
              <h3>Supplier Position</h3>
            </div>
          </div>
          <div class="mini-stat-grid">
            <article class="stat-card">
              <span>Amount Due</span>
              <strong>${formatCurrency(totalDue)}</strong>
            </article>
            <article class="stat-card">
              <span>Amount Paid</span>
              <strong>${formatCurrency(totalPaid)}</strong>
            </article>
            <article class="stat-card">
              <span>Outstanding</span>
              <strong class="${outstanding > 0 ? "negative-text" : ""}">${formatCurrency(
                outstanding
              )}</strong>
            </article>
            <article class="stat-card">
              <span>Overdue Bills</span>
              <strong>${escapeHtml(String(overdueCount))}</strong>
            </article>
          </div>
        </section>

        <section class="section-card">
          <div class="section-heading compact">
            <div>
              <p class="kicker">Filters</p>
              <h3>Refine Supplier View</h3>
            </div>
          </div>
          <div class="filter-grid">
            <label>
              <span>Search</span>
              <input
                id="supplierSearchFilter"
                type="search"
                value="${escapeHtml(state.supplierFilters.search)}"
                placeholder="Supplier, ref, notes"
              />
            </label>
            <label>
              <span>Invoice Month</span>
              <input id="supplierMonthFilter" type="month" value="${escapeHtml(
                state.supplierFilters.month
              )}" />
            </label>
            <label>
              <span>Business Area</span>
              <select id="supplierAreaFilter">
                ${buildSelectMarkup(
                  getBusinessAreaOptions(),
                  state.supplierFilters.area,
                  "All Areas"
                )}
              </select>
            </label>
            <label>
              <span>Status</span>
              <select id="supplierStatusFilter">
                ${buildSelectMarkup(SUPPLIER_STATUS_OPTIONS, state.supplierFilters.status, "Any Status")}
              </select>
            </label>
          </div>
        </section>
      </aside>
    </section>

    <section class="section-card">
      <div class="section-heading compact">
        <div>
          <p class="kicker">Supplier Records</p>
          <h3>${suppliers.length} Record${suppliers.length === 1 ? "" : "s"} In View</h3>
        </div>
        <p class="muted-text">
          Filtered supplier records merge into Excel export and workbook import without replacing current data.
        </p>
      </div>
      <div class="table-wrap compact-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Invoice Date</th>
              <th>Supplier</th>
              <th>Business Area</th>
              <th>Reference & Item</th>
              <th>Due / Paid / Balance</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${
              suppliers.length === 0
                ? `
                    <tr>
                      <td colspan="7" class="empty-state">
                        No supplier records match the current view yet.
                      </td>
                    </tr>
                  `
                : suppliers
                    .map((record) => {
                      const status = getSupplierStatusConfig(record);
                      return `
                        <tr>
                          <td>${escapeHtml(formatDisplayDate(record.invoiceDate))}</td>
                          <td>
                            <span class="table-primary">${escapeHtml(record.supplierName)}</span>
                            <span class="table-secondary">${escapeHtml(record.paymentMethod || "Payment method not saved")}</span>
                          </td>
                          <td><span class="tag tag-area">${escapeHtml(
                            getBusinessArea(record.businessAreaId).shortLabel
                          )}</span></td>
                          <td>
                            <span class="table-primary">${escapeHtml(record.invoiceReference || "No ref")}</span>
                            <span class="table-secondary">${escapeHtml(record.itemDescription || record.category)}</span>
                          </td>
                          <td>
                            <span class="table-primary">Due ${formatCurrency(record.amountDue)}</span>
                            <span class="table-secondary">Paid ${formatCurrency(record.amountPaid)}</span>
                            <span class="table-secondary ${getSupplierOutstanding(record) > 0 ? "negative-text" : ""}">
                              Balance ${formatCurrency(getSupplierOutstanding(record))}
                            </span>
                          </td>
                          <td>
                            <span class="alert-pill ${escapeHtml(status.pillClass)}">${escapeHtml(
                              status.label
                            )}</span>
                            <span class="table-secondary">${escapeHtml(status.meta)}</span>
                          </td>
                          <td>
                            <div class="row-actions">
                              <button class="edit-btn" data-supplier-action="edit" data-id="${escapeHtml(
                                record.id
                              )}" type="button">
                                Edit
                              </button>
                              <button class="delete-btn" data-supplier-action="delete" data-id="${escapeHtml(
                                record.id
                              )}" type="button">
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      `;
                    })
                    .join("")
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function createEmptyAssetDraft() {
  return {
    acquiredDate: getTodayInputValue(),
    businessAreaId: DEFAULT_BUSINESS_AREA_ID,
    assetName: "",
    assetCategory: "Equipment",
    location: "",
    purchaseCost: 0,
    currentValue: 0,
    condition: "Good",
    status: "In Use",
    nextServiceDate: "",
    notes: ""
  };
}

function buildAssetDraftFromForm(formData) {
  return {
    acquiredDate: normalizeDateInput(formData.get("assetAcquiredDate")),
    businessAreaId: normalizeBusinessAreaId(formData.get("assetBusinessArea")),
    assetName: normalizeText(formData.get("assetName")),
    assetCategory: normalizeText(formData.get("assetCategory")),
    location: normalizeText(formData.get("assetLocation")),
    purchaseCost: parseOptionalAmount(formData.get("assetPurchaseCost")),
    currentValue: parseOptionalAmount(formData.get("assetCurrentValue")),
    condition: normalizeText(formData.get("assetCondition")),
    status: normalizeText(formData.get("assetStatus")),
    nextServiceDate: normalizeDateInput(formData.get("assetNextServiceDate")),
    notes: normalizeText(formData.get("assetNotes"))
  };
}

function validateAssetRecord(record) {
  const errors = [];

  if (!record.acquiredDate) {
    errors.push("Add the asset acquisition date.");
  }

  if (!record.businessAreaId) {
    errors.push("Choose the business area for this asset.");
  }

  if (!record.assetName) {
    errors.push("Add the asset name.");
  }

  if (!record.assetCategory) {
    errors.push("Choose the asset category.");
  }

  if (record.purchaseCost <= 0) {
    errors.push("Enter the asset purchase cost.");
  }

  if (record.currentValue > record.purchaseCost * 3) {
    errors.push("Check the current asset value before saving.");
  }

  return errors;
}

function getAssetServiceState(record) {
  const dueDate = normalizeDateInput(record.nextServiceDate);

  if (!dueDate) {
    return {
      key: "no-date",
      label: "No Service Date",
      pillClass: "alert-pill-due"
    };
  }

  const daysRemaining = daysUntilDate(dueDate);

  if (Number.isFinite(daysRemaining) && daysRemaining < 0) {
    return {
      key: "overdue",
      label: "Service Overdue",
      pillClass: "alert-pill-overdue"
    };
  }

  if (Number.isFinite(daysRemaining) && daysRemaining <= 14) {
    return {
      key: "due-soon",
      label: "Service Due Soon",
      pillClass: "alert-pill-due"
    };
  }

  return {
    key: "scheduled",
    label: "Service Scheduled",
    pillClass: "alert-pill-on-track"
  };
}

function getFilteredAssetRecords() {
  const searchValue = normalizeText(state.assetFilters.search).toLowerCase();
  const areaValue = normalizeBusinessAreaId(state.assetFilters.area);
  const statusValue = normalizeText(state.assetFilters.status).toLowerCase();
  const serviceValue = normalizeText(state.assetFilters.service).toLowerCase();

  return state.assetRecords.filter((record) => {
    const haystack = [
      record.assetName,
      record.assetCategory,
      record.location,
      record.notes,
      getBusinessArea(record.businessAreaId).label
    ]
      .join(" ")
      .toLowerCase();

    return (
      (searchValue === "" || haystack.includes(searchValue)) &&
      (areaValue === "" || record.businessAreaId === areaValue) &&
      (statusValue === "" || normalizeText(record.status).toLowerCase() === statusValue) &&
      (serviceValue === "" || getAssetServiceState(record).key === serviceValue)
    );
  });
}

function renderAssetsPage() {
  if (!elements.assetsViewRoot) {
    return;
  }

  const editingRecord = state.assetRecords.find((item) => item.id === state.editingAssetId) || null;
  const draft = editingRecord || createEmptyAssetDraft();
  const records = getFilteredAssetRecords();
  const purchaseTotal = records.reduce((sum, record) => sum + record.purchaseCost, 0);
  const currentValueTotal = records.reduce((sum, record) => sum + record.currentValue, 0);
  const serviceDueCount = records.filter((record) =>
    ["overdue", "due-soon"].includes(getAssetServiceState(record).key)
  ).length;
  const activeAssetCount = records.filter((record) => record.status === "In Use").length;

  elements.assetsViewRoot.innerHTML = `
    <section class="page-grid compact-page-grid">
      <section class="section-card">
        <div class="section-heading">
          <div>
            <p class="kicker">Asset Register</p>
            <h3>${editingRecord ? "Edit Asset Record" : "Track Tools, Equipment & Fixtures"}</h3>
          </div>
          <p class="muted-text">
            Register business assets by area so value, condition, location, and next service dates stay visible.
          </p>
        </div>

        <form id="assetForm" novalidate>
          <div class="mini-form-grid rental-form-grid">
            <label>
              <span>Acquired Date</span>
              <input id="assetAcquiredDate" name="assetAcquiredDate" type="date" value="${escapeHtml(
                draft.acquiredDate
              )}" required />
            </label>

            <label>
              <span>Business Area</span>
              <select id="assetBusinessArea" name="assetBusinessArea" required>
                ${buildSelectMarkup(getBusinessAreaOptions(), draft.businessAreaId, "Choose business area")}
              </select>
            </label>

            <label>
              <span>Asset Name</span>
              <input
                id="assetName"
                name="assetName"
                type="text"
                value="${escapeHtml(draft.assetName)}"
                placeholder="Concrete vibrator, fridge, iron, etc."
                required
              />
            </label>

            <label>
              <span>Asset Category</span>
              <select id="assetCategory" name="assetCategory" required>
                ${buildSelectMarkup(ASSET_CATEGORY_OPTIONS, draft.assetCategory, "Choose asset category")}
              </select>
            </label>

            <label>
              <span>Location</span>
              <input
                id="assetLocation"
                name="assetLocation"
                type="text"
                value="${escapeHtml(draft.location)}"
                placeholder="Store, suite, kitchen, cold room"
              />
            </label>

            <label>
              <span>Purchase Cost</span>
              <input
                id="assetPurchaseCost"
                name="assetPurchaseCost"
                type="number"
                min="0"
                step="0.01"
                value="${escapeHtml(formatAmountInputValue(draft.purchaseCost))}"
                placeholder="0.00"
                required
              />
            </label>

            <label>
              <span>Current Value</span>
              <input
                id="assetCurrentValue"
                name="assetCurrentValue"
                type="number"
                min="0"
                step="0.01"
                value="${escapeHtml(formatAmountInputValue(draft.currentValue))}"
                placeholder="0.00"
              />
            </label>

            <label>
              <span>Condition</span>
              <select id="assetCondition" name="assetCondition" required>
                ${buildSelectMarkup(ASSET_CONDITION_OPTIONS, draft.condition, "Choose condition")}
              </select>
            </label>

            <label>
              <span>Status</span>
              <select id="assetStatus" name="assetStatus" required>
                ${buildSelectMarkup(ASSET_STATUS_OPTIONS, draft.status, "Choose status")}
              </select>
            </label>

            <label>
              <span>Next Service Date</span>
              <input id="assetNextServiceDate" name="assetNextServiceDate" type="date" value="${escapeHtml(
                draft.nextServiceDate
              )}" />
            </label>

            <label class="wide-field">
              <span>Notes</span>
              <textarea
                id="assetNotes"
                name="assetNotes"
                rows="3"
                placeholder="Serial note, usage note, repair history, or disposal note"
              >${escapeHtml(draft.notes)}</textarea>
            </label>
          </div>

          <div class="form-actions">
            <button id="submitAssetBtn" class="button button-primary" type="submit">
              ${editingRecord ? "Update Asset Record" : "Save Asset Record"}
            </button>
            <button id="resetAssetBtn" class="button button-secondary" type="button">
              Clear Form
            </button>
            <button
              id="cancelAssetEditBtn"
              class="button button-ghost ${editingRecord ? "" : "hidden"}"
              type="button"
            >
              Cancel Edit
            </button>
          </div>
        </form>
      </section>

      <aside class="sidebar-column">
        <section class="section-card">
          <div class="section-heading compact">
            <div>
              <p class="kicker">Asset Snapshot</p>
              <h3>Value & Service Watch</h3>
            </div>
          </div>
          <div class="mini-stat-grid">
            <article class="stat-card">
              <span>Purchase Value</span>
              <strong>${formatCurrency(purchaseTotal)}</strong>
            </article>
            <article class="stat-card">
              <span>Current Value</span>
              <strong>${formatCurrency(currentValueTotal)}</strong>
            </article>
            <article class="stat-card">
              <span>Assets In Use</span>
              <strong>${escapeHtml(String(activeAssetCount))}</strong>
            </article>
            <article class="stat-card">
              <span>Service Follow-Up</span>
              <strong>${escapeHtml(String(serviceDueCount))}</strong>
            </article>
          </div>
        </section>

        <section class="section-card">
          <div class="section-heading compact">
            <div>
              <p class="kicker">Filters</p>
              <h3>Refine Asset View</h3>
            </div>
          </div>
          <div class="form-actions">
            <button class="button button-secondary" data-global-action="export-view-csv" type="button">
              Export Asset CSV
            </button>
          </div>
          <div class="filter-grid">
            <label>
              <span>Search</span>
              <input
                id="assetSearchFilter"
                type="search"
                value="${escapeHtml(state.assetFilters.search)}"
                placeholder="Asset, location, note"
              />
            </label>
            <label>
              <span>Business Area</span>
              <select id="assetAreaFilter">
                ${buildSelectMarkup(getBusinessAreaOptions(), state.assetFilters.area, "All Areas")}
              </select>
            </label>
            <label>
              <span>Status</span>
              <select id="assetStatusFilter">
                ${buildSelectMarkup(ASSET_STATUS_OPTIONS, state.assetFilters.status, "Any Status")}
              </select>
            </label>
            <label>
              <span>Service Watch</span>
              <select id="assetServiceFilter">
                ${buildSelectMarkup(
                  [
                    { value: "overdue", label: "Service Overdue" },
                    { value: "due-soon", label: "Service Due Soon" },
                    { value: "scheduled", label: "Service Scheduled" },
                    { value: "no-date", label: "No Service Date" }
                  ],
                  state.assetFilters.service,
                  "Any Service State"
                )}
              </select>
            </label>
          </div>
        </section>
      </aside>
    </section>

    <section class="section-card">
      <div class="section-heading compact">
        <div>
          <p class="kicker">Asset Records</p>
          <h3>${records.length} Record${records.length === 1 ? "" : "s"} In View</h3>
        </div>
      </div>
      <div class="table-wrap compact-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Acquired</th>
              <th>Asset</th>
              <th>Area</th>
              <th>Value</th>
              <th>Condition / Status</th>
              <th>Next Service</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${
              records.length === 0
                ? `
                    <tr>
                      <td colspan="7" class="empty-state">No asset records match the current view yet.</td>
                    </tr>
                  `
                : records
                    .map((record) => {
                      const service = getAssetServiceState(record);
                      return `
                        <tr>
                          <td>${escapeHtml(formatDisplayDate(record.acquiredDate))}</td>
                          <td>
                            <span class="table-primary">${escapeHtml(record.assetName)}</span>
                            <span class="table-secondary">${escapeHtml(record.assetCategory)} • ${escapeHtml(
                              record.location || "No location saved"
                            )}</span>
                          </td>
                          <td><span class="tag tag-area">${escapeHtml(
                            getBusinessArea(record.businessAreaId).shortLabel
                          )}</span></td>
                          <td>
                            <span class="table-primary">Cost ${formatCurrency(record.purchaseCost)}</span>
                            <span class="table-secondary">Value ${formatCurrency(record.currentValue)}</span>
                          </td>
                          <td>
                            <span class="table-primary">${escapeHtml(record.condition)}</span>
                            <span class="table-secondary">${escapeHtml(record.status)}</span>
                          </td>
                          <td>
                            <span class="alert-pill ${escapeHtml(service.pillClass)}">${escapeHtml(
                              service.label
                            )}</span>
                            <span class="table-secondary">${escapeHtml(
                              formatOptionalDate(record.nextServiceDate)
                            )}</span>
                          </td>
                          <td>
                            <div class="row-actions">
                              <button class="edit-btn" data-asset-action="edit" data-id="${escapeHtml(
                                record.id
                              )}" type="button">
                                Edit
                              </button>
                              <button class="delete-btn" data-asset-action="delete" data-id="${escapeHtml(
                                record.id
                              )}" type="button">
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      `;
                    })
                    .join("")
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function handleAssetSubmit(event) {
  event.preventDefault();

  const draft = buildAssetDraftFromForm(new FormData(event.target));
  const errors = validateAssetRecord(draft);

  if (errors.length > 0) {
    showToast(errors[0]);
    return;
  }

  if (state.editingAssetId) {
    state.assetRecords = sortAssetRecords(
      state.assetRecords.map((record) =>
        record.id === state.editingAssetId
          ? { ...record, ...draft, updatedAt: new Date().toISOString() }
          : record
      )
    );
    showToast("Asset record updated.");
  } else {
    state.assetRecords = sortAssetRecords([
      ...state.assetRecords,
      {
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...draft
      }
    ]);
    showToast("Asset record saved.");
  }

  persistAssetRecords();
  resetAssetForm({ silent: true });
  render();
}

function startEditingAssetRecord(recordId) {
  const record = state.assetRecords.find((item) => item.id === recordId);

  if (!record) {
    showToast("That asset record could not be found.");
    return;
  }

  state.editingAssetId = record.id;
  navigateTo("assets", { syncHash: true });
  render();
  scrollDynamicFormIntoView("assetForm");
}

function deleteAssetRecord(recordId) {
  const record = state.assetRecords.find((item) => item.id === recordId);

  if (!record) {
    showToast("That asset record could not be found.");
    return;
  }

  const shouldDelete = window.confirm(`Delete the asset record for ${record.assetName}?`);

  if (!shouldDelete) {
    return;
  }

  state.assetRecords = state.assetRecords.filter((item) => item.id !== recordId);
  persistAssetRecords();

  if (state.editingAssetId === recordId) {
    resetAssetForm({ silent: true });
  }

  render();
  showToast("Asset record deleted.");
}

function resetAssetForm(options = {}) {
  state.editingAssetId = null;

  if (!options.silent) {
    render();
    showToast("Asset form cleared.");
  }
}

function createEmptyForecastDraft() {
  const month = normalizeMonthInput(state.forecastFilters.month) || getMonthKey(new Date());

  return {
    month,
    businessAreaId: DEFAULT_BUSINESS_AREA_ID,
    revenueTarget: 0,
    expenseBudget: 0,
    salaryBudget: 0,
    notes: ""
  };
}

function buildForecastDraftFromForm(formData) {
  return {
    month: normalizeMonthInput(formData.get("forecastMonth")),
    businessAreaId: normalizeBusinessAreaId(formData.get("forecastBusinessArea")),
    revenueTarget: parseOptionalAmount(formData.get("forecastRevenueTarget")),
    expenseBudget: parseOptionalAmount(formData.get("forecastExpenseBudget")),
    salaryBudget: parseOptionalAmount(formData.get("forecastSalaryBudget")),
    notes: normalizeText(formData.get("forecastNotes"))
  };
}

function validateForecastPlan(record) {
  const errors = [];

  if (!record.month) {
    errors.push("Choose the forecast month.");
  }

  if (!record.businessAreaId) {
    errors.push("Choose the forecast business area.");
  }

  if (record.revenueTarget <= 0) {
    errors.push("Enter a revenue target greater than zero.");
  }

  if (record.expenseBudget < 0 || record.salaryBudget < 0) {
    errors.push("Forecast budget values cannot be negative.");
  }

  return errors;
}

function getAreaActualsForMonth(monthKey, businessAreaId) {
  const month = normalizeMonthInput(monthKey);
  const areaId = normalizeBusinessAreaId(businessAreaId);
  const expenseTotal = state.expenses
    .filter((record) => record.businessAreaId === areaId && record.date.startsWith(month))
    .reduce((sum, record) => sum + record.amount, 0);
  const salaryPaid = state.salaryRecords
    .filter((record) => record.businessAreaId === areaId && record.month === month)
    .reduce((sum, record) => sum + record.amountPaid, 0);
  const salesTotal = state.sales
    .filter((record) => record.businessAreaId === areaId && record.date.startsWith(month))
    .reduce((sum, record) => sum + record.amount, 0);
  const rentCollected =
    areaId === "rentals-apartments"
      ? state.rentals
          .filter((record) => record.month === month)
          .reduce((sum, record) => sum + record.rentPaid + getBillsPaidAmount(record), 0)
      : 0;
  const revenue = Number((salesTotal + rentCollected).toFixed(2));
  const spend = Number((expenseTotal + salaryPaid).toFixed(2));

  return {
    month,
    businessAreaId: areaId,
    revenue,
    expenseTotal,
    salaryPaid,
    spend,
    net: Number((revenue - spend).toFixed(2))
  };
}

function buildSuggestedForecast(monthKey, businessAreaId) {
  const month = normalizeMonthInput(monthKey);
  const areaId = normalizeBusinessAreaId(businessAreaId);
  const priorMonths = [shiftMonthKey(month, -1), shiftMonthKey(month, -2), shiftMonthKey(month, -3)].filter(Boolean);
  const actuals = priorMonths.map((priorMonth) => getAreaActualsForMonth(priorMonth, areaId));
  const divisor = actuals.length || 1;

  return {
    month,
    businessAreaId: areaId,
    revenueTarget: Number((actuals.reduce((sum, item) => sum + item.revenue, 0) / divisor).toFixed(2)),
    expenseBudget: Number((actuals.reduce((sum, item) => sum + item.expenseTotal, 0) / divisor).toFixed(2)),
    salaryBudget: Number((actuals.reduce((sum, item) => sum + item.salaryPaid, 0) / divisor).toFixed(2))
  };
}

function getFilteredForecastPlans() {
  const monthValue = normalizeMonthInput(state.forecastFilters.month);
  const areaValue = normalizeBusinessAreaId(state.forecastFilters.area);

  return state.forecastPlans.filter((record) => {
    return (
      (monthValue === "" || record.month === monthValue) &&
      (areaValue === "" || record.businessAreaId === areaValue)
    );
  });
}

function renderForecastPage() {
  if (!elements.forecastViewRoot) {
    return;
  }

  const editingRecord = state.forecastPlans.find((item) => item.id === state.editingForecastId) || null;
  const draft = editingRecord || createEmptyForecastDraft();
  const selectedMonth = normalizeMonthInput(state.forecastFilters.month) || getMonthKey(new Date());
  const records = getFilteredForecastPlans();
  const monthAreaRows = BUSINESS_AREAS.map((area) => {
    const plan = state.forecastPlans.find(
      (record) => record.month === selectedMonth && record.businessAreaId === area.id
    );
    const actual = getAreaActualsForMonth(selectedMonth, area.id);
    const suggested = buildSuggestedForecast(selectedMonth, area.id);
    const targetNet = plan
      ? Number((plan.revenueTarget - plan.expenseBudget - plan.salaryBudget).toFixed(2))
      : Number((suggested.revenueTarget - suggested.expenseBudget - suggested.salaryBudget).toFixed(2));

    return {
      area,
      plan,
      actual,
      suggested,
      targetRevenue: plan ? plan.revenueTarget : suggested.revenueTarget,
      targetNet
    };
  }).sort((left, right) => right.actual.revenue - left.actual.revenue);
  const targetRevenueTotal = records.reduce((sum, record) => sum + record.revenueTarget, 0);
  const targetSpendTotal = records.reduce((sum, record) => sum + record.expenseBudget + record.salaryBudget, 0);
  const actualRevenueTotal = monthAreaRows.reduce((sum, row) => sum + row.actual.revenue, 0);
  const actualNetTotal = monthAreaRows.reduce((sum, row) => sum + row.actual.net, 0);

  elements.forecastViewRoot.innerHTML = `
    <section class="page-grid compact-page-grid">
      <section class="section-card">
        <div class="section-heading">
          <div>
            <p class="kicker">Monthly Forecast Planner</p>
            <h3>${editingRecord ? "Edit Forecast Plan" : "Plan Revenue & Profit By Business Area"}</h3>
          </div>
          <p class="muted-text">
            Set monthly targets for revenue, operating expenses, and salary, then compare them against actual results already captured in the app.
          </p>
        </div>

        <form id="forecastForm" novalidate>
          <div class="mini-form-grid rental-form-grid">
            <label>
              <span>Forecast Month</span>
              <input id="forecastMonth" name="forecastMonth" type="month" value="${escapeHtml(
                draft.month
              )}" required />
            </label>

            <label>
              <span>Business Area</span>
              <select id="forecastBusinessArea" name="forecastBusinessArea" required>
                ${buildSelectMarkup(getBusinessAreaOptions(), draft.businessAreaId, "Choose business area")}
              </select>
            </label>

            <label>
              <span>Revenue Target</span>
              <input
                id="forecastRevenueTarget"
                name="forecastRevenueTarget"
                type="number"
                min="0"
                step="0.01"
                value="${escapeHtml(formatAmountInputValue(draft.revenueTarget))}"
                placeholder="0.00"
                required
              />
            </label>

            <label>
              <span>Expense Budget</span>
              <input
                id="forecastExpenseBudget"
                name="forecastExpenseBudget"
                type="number"
                min="0"
                step="0.01"
                value="${escapeHtml(formatAmountInputValue(draft.expenseBudget))}"
                placeholder="0.00"
              />
            </label>

            <label>
              <span>Salary Budget</span>
              <input
                id="forecastSalaryBudget"
                name="forecastSalaryBudget"
                type="number"
                min="0"
                step="0.01"
                value="${escapeHtml(formatAmountInputValue(draft.salaryBudget))}"
                placeholder="0.00"
              />
            </label>

            <div class="wide-field apartment-capture-panel">
              <p class="muted-text">
                Suggested baseline uses the previous 3 months for the selected area. You can apply it to the form, then adjust manually.
              </p>
              <button
                class="button button-secondary"
                data-forecast-action="apply-suggestion"
                data-month="${escapeHtml(draft.month)}"
                data-area="${escapeHtml(draft.businessAreaId)}"
                type="button"
              >
                Use 3-Month Suggestion
              </button>
            </div>

            <label class="wide-field">
              <span>Notes</span>
              <textarea
                id="forecastNotes"
                name="forecastNotes"
                rows="3"
                placeholder="Expected promotions, rent collection push, staffing change, or seasonality note"
              >${escapeHtml(draft.notes)}</textarea>
            </label>
          </div>

          <div class="form-actions">
            <button id="submitForecastBtn" class="button button-primary" type="submit">
              ${editingRecord ? "Update Forecast Plan" : "Save Forecast Plan"}
            </button>
            <button id="resetForecastBtn" class="button button-secondary" type="button">
              Clear Form
            </button>
            <button
              id="cancelForecastEditBtn"
              class="button button-ghost ${editingRecord ? "" : "hidden"}"
              type="button"
            >
              Cancel Edit
            </button>
          </div>
        </form>
      </section>

      <aside class="sidebar-column">
        <section class="section-card">
          <div class="section-heading compact">
            <div>
              <p class="kicker">Month Snapshot</p>
              <h3>${escapeHtml(formatMonthLabel(selectedMonth))}</h3>
            </div>
          </div>
          <div class="mini-stat-grid">
            <article class="stat-card">
              <span>Target Revenue</span>
              <strong>${formatCurrency(targetRevenueTotal)}</strong>
            </article>
            <article class="stat-card">
              <span>Target Spend</span>
              <strong>${formatCurrency(targetSpendTotal)}</strong>
            </article>
            <article class="stat-card">
              <span>Actual Revenue</span>
              <strong>${formatCurrency(actualRevenueTotal)}</strong>
            </article>
            <article class="stat-card">
              <span>Actual Net</span>
              <strong class="${actualNetTotal < 0 ? "negative-text" : ""}">${formatCurrency(
                actualNetTotal
              )}</strong>
            </article>
          </div>
        </section>

        <section class="section-card">
          <div class="section-heading compact">
            <div>
              <p class="kicker">Filters</p>
              <h3>Refine Forecast View</h3>
            </div>
          </div>
          <div class="form-actions">
            <button class="button button-secondary" data-global-action="export-view-csv" type="button">
              Export Forecast CSV
            </button>
          </div>
          <div class="filter-grid">
            <label>
              <span>Month</span>
              <input id="forecastMonthFilter" type="month" value="${escapeHtml(selectedMonth)}" />
            </label>
            <label>
              <span>Business Area</span>
              <select id="forecastAreaFilter">
                ${buildSelectMarkup(getBusinessAreaOptions(), state.forecastFilters.area, "All Areas")}
              </select>
            </label>
          </div>
        </section>
      </aside>
    </section>

    <section class="section-card">
      <div class="section-heading compact">
        <div>
          <p class="kicker">Profit By Business Area</p>
          <h3>${escapeHtml(formatMonthLabel(selectedMonth))} Actual vs Target</h3>
        </div>
      </div>
      <div class="table-wrap compact-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Area</th>
              <th>Actual Revenue</th>
              <th>Actual Spend</th>
              <th>Actual Net</th>
              <th>Target Revenue</th>
              <th>Target Net</th>
              <th>Suggested Revenue</th>
            </tr>
          </thead>
          <tbody>
            ${monthAreaRows
              .map((row) => `
                <tr>
                  <td>${escapeHtml(row.area.shortLabel)}</td>
                  <td>${formatCurrency(row.actual.revenue)}</td>
                  <td>${formatCurrency(row.actual.spend)}</td>
                  <td class="${row.actual.net < 0 ? "negative-text" : ""}">${formatSignedCurrency(
                    row.actual.net
                  )}</td>
                  <td>${formatCurrency(row.targetRevenue)}</td>
                  <td class="${row.targetNet < 0 ? "negative-text" : ""}">${formatSignedCurrency(
                    row.targetNet
                  )}</td>
                  <td>${formatCurrency(row.suggested.revenueTarget)}</td>
                </tr>
              `)
              .join("")}
          </tbody>
        </table>
      </div>
    </section>

    <section class="section-card">
      <div class="section-heading compact">
        <div>
          <p class="kicker">Forecast Plans</p>
          <h3>${records.length} Plan${records.length === 1 ? "" : "s"} In View</h3>
        </div>
      </div>
      <div class="table-wrap compact-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th>Business Area</th>
              <th>Targets</th>
              <th>Actuals</th>
              <th>Variance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${
              records.length === 0
                ? `
                    <tr>
                      <td colspan="6" class="empty-state">No forecast plans match the current view yet.</td>
                    </tr>
                  `
                : records
                    .map((record) => {
                      const actual = getAreaActualsForMonth(record.month, record.businessAreaId);
                      const targetNet = Number(
                        (record.revenueTarget - record.expenseBudget - record.salaryBudget).toFixed(2)
                      );
                      const revenueVariance = Number((actual.revenue - record.revenueTarget).toFixed(2));
                      return `
                        <tr>
                          <td>${escapeHtml(formatMonthLabel(record.month))}</td>
                          <td><span class="tag tag-area">${escapeHtml(
                            getBusinessArea(record.businessAreaId).shortLabel
                          )}</span></td>
                          <td>
                            <span class="table-primary">Revenue ${formatCurrency(record.revenueTarget)}</span>
                            <span class="table-secondary">Spend ${formatCurrency(
                              record.expenseBudget + record.salaryBudget
                            )} • Net ${formatSignedCurrency(targetNet)}</span>
                          </td>
                          <td>
                            <span class="table-primary">Revenue ${formatCurrency(actual.revenue)}</span>
                            <span class="table-secondary">Spend ${formatCurrency(
                              actual.spend
                            )} • Net ${formatSignedCurrency(actual.net)}</span>
                          </td>
                          <td class="${revenueVariance < 0 ? "negative-text" : ""}">
                            ${formatSignedCurrency(revenueVariance)}
                          </td>
                          <td>
                            <div class="row-actions">
                              <button class="edit-btn" data-forecast-action="edit" data-id="${escapeHtml(
                                record.id
                              )}" type="button">
                                Edit
                              </button>
                              <button class="delete-btn" data-forecast-action="delete" data-id="${escapeHtml(
                                record.id
                              )}" type="button">
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      `;
                    })
                    .join("")
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function applySuggestedForecastToForm(monthKey, businessAreaId) {
  const month = normalizeMonthInput(monthKey) || getMonthKey(new Date());
  const areaId = normalizeBusinessAreaId(businessAreaId) || DEFAULT_BUSINESS_AREA_ID;
  const suggestion = buildSuggestedForecast(month, areaId);

  navigateTo("forecast", { syncHash: true, showAccessToast: false });
  render();

  const monthInput = document.getElementById("forecastMonth");
  const areaInput = document.getElementById("forecastBusinessArea");
  const revenueInput = document.getElementById("forecastRevenueTarget");
  const expenseInput = document.getElementById("forecastExpenseBudget");
  const salaryInput = document.getElementById("forecastSalaryBudget");

  if (!monthInput || !areaInput || !revenueInput || !expenseInput || !salaryInput) {
    showToast("The forecast form is not available right now.");
    return;
  }

  monthInput.value = suggestion.month;
  areaInput.value = suggestion.businessAreaId;
  revenueInput.value = String(suggestion.revenueTarget);
  expenseInput.value = String(suggestion.expenseBudget);
  salaryInput.value = String(suggestion.salaryBudget);
  showToast("3-month forecast suggestion applied to the form.");
}

function handleForecastSubmit(event) {
  event.preventDefault();

  const draft = buildForecastDraftFromForm(new FormData(event.target));
  const errors = validateForecastPlan(draft);

  if (errors.length > 0) {
    showToast(errors[0]);
    return;
  }

  if (state.editingForecastId) {
    state.forecastPlans = sortForecastPlans(
      state.forecastPlans.map((record) =>
        record.id === state.editingForecastId
          ? { ...record, ...draft, updatedAt: new Date().toISOString() }
          : record
      )
    );
    showToast("Forecast plan updated.");
  } else {
    state.forecastPlans = sortForecastPlans([
      ...state.forecastPlans,
      {
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...draft
      }
    ]);
    showToast("Forecast plan saved.");
  }

  state.forecastFilters.month = draft.month;
  persistForecastPlans();
  resetForecastForm({ silent: true });
  render();
}

function startEditingForecastPlan(recordId) {
  const record = state.forecastPlans.find((item) => item.id === recordId);

  if (!record) {
    showToast("That forecast plan could not be found.");
    return;
  }

  state.editingForecastId = record.id;
  navigateTo("forecast", { syncHash: true });
  render();
  scrollDynamicFormIntoView("forecastForm");
}

function deleteForecastPlan(recordId) {
  const record = state.forecastPlans.find((item) => item.id === recordId);

  if (!record) {
    showToast("That forecast plan could not be found.");
    return;
  }

  const shouldDelete = window.confirm(
    `Delete the forecast plan for ${getBusinessArea(record.businessAreaId).shortLabel} in ${formatMonthLabel(
      record.month
    )}?`
  );

  if (!shouldDelete) {
    return;
  }

  state.forecastPlans = state.forecastPlans.filter((item) => item.id !== recordId);
  persistForecastPlans();

  if (state.editingForecastId === recordId) {
    resetForecastForm({ silent: true });
  }

  render();
  showToast("Forecast plan deleted.");
}

function resetForecastForm(options = {}) {
  state.editingForecastId = null;

  if (!options.silent) {
    render();
    showToast("Forecast form cleared.");
  }
}

function createEmptyUserProfileDraft() {
  return {
    fullName: "",
    username: "",
    role: "owner",
    phone: "",
    active: true,
    loginMode: "profile-only",
    password: "",
    passwordConfirm: "",
    notes: ""
  };
}

function createUserProfileFormDraft(record) {
  if (!record) {
    return createEmptyUserProfileDraft();
  }

  return {
    fullName: record.fullName,
    username: record.username,
    role: record.role,
    phone: record.phone,
    active: record.active,
    loginMode: getUserLoginMode(record),
    password: "",
    passwordConfirm: "",
    notes: record.notes
  };
}

function buildUserProfileDraftFromForm(formData) {
  return {
    fullName: normalizeText(formData.get("accessFullName")),
    username: normalizeText(formData.get("accessUsername")).toLowerCase(),
    role: normalizeText(formData.get("accessRole")).toLowerCase(),
    phone: normalizeText(formData.get("accessPhone")),
    active: normalizeText(formData.get("accessActiveState")).toLowerCase() !== "inactive",
    loginMode:
      normalizeText(formData.get("accessLoginMode")).toLowerCase() === "password-required"
        ? "password-required"
        : "profile-only",
    password: String(formData.get("accessPassword") || ""),
    passwordConfirm: String(formData.get("accessPasswordConfirm") || ""),
    notes: normalizeText(formData.get("accessNotes"))
  };
}

function validateUserProfile(profile, existingRecord = null) {
  const errors = [];
  const wantsPasswordLogin = profile.loginMode === "password-required";
  const trimmedPassword = profile.password.trim();
  const trimmedConfirm = profile.passwordConfirm.trim();

  if (!profile.fullName) {
    errors.push("Add the user full name.");
  }

  if (!profile.username) {
    errors.push("Add a username for this workspace user.");
  }

  if (!ROLE_PRESET_MAP[profile.role]) {
    errors.push("Choose a valid role for this workspace user.");
  }

  const duplicate = state.userProfiles.find(
    (record) =>
      record.id !== state.editingUserId &&
      normalizeText(record.username).toLowerCase() === profile.username
  );

  if (duplicate) {
    errors.push("That username is already in use.");
  }

  if (!wantsPasswordLogin && (trimmedPassword || trimmedConfirm)) {
    errors.push("Change Login Access to Password Required before saving a password.");
  }

  if (wantsPasswordLogin && !trimmedPassword && !normalizeText(existingRecord?.passwordHash)) {
    errors.push("Add a password before saving a password-protected user.");
  }

  if (trimmedPassword && trimmedPassword.length < 4) {
    errors.push("Use a password with at least 4 characters.");
  }

  if (trimmedPassword || trimmedConfirm) {
    if (trimmedPassword !== trimmedConfirm) {
      errors.push("Password confirmation does not match.");
    }
  }

  return errors;
}

function renderAccessPage() {
  if (!elements.accessViewRoot) {
    return;
  }

  const editingRecord = state.userProfiles.find((item) => item.id === state.editingUserId) || null;
  const draft = createUserProfileFormDraft(editingRecord);
  const currentUser = getCurrentUserProfile();
  const authenticatedUser = getAuthenticatedUserProfile();
  const activeUsers = state.userProfiles.filter((profile) => profile.active);
  const passwordUsers = getLoginEnabledProfiles();
  const loginRequired = isWorkspaceLoginRequired();
  const locked = isWorkspaceLocked();
  const currentRoleConfig = getRolePreset(draft.role);
  const showQuickSwitch = !loginRequired;

  if (locked) {
    elements.accessViewRoot.innerHTML = `
      <section class="page-grid compact-page-grid">
        <section class="section-card">
          <div class="section-heading">
            <div>
              <p class="kicker">Workspace Login</p>
              <h3>Sign In To Continue</h3>
            </div>
            <p class="muted-text">
              Password login is enabled for this workspace. Sign in with an active username and password to open the rest of the app.
            </p>
          </div>

          <form id="accessLoginForm" novalidate>
            <div class="mini-form-grid rental-form-grid">
              <label>
                <span>Username</span>
                <input
                  id="accessLoginUsername"
                  name="accessLoginUsername"
                  type="text"
                  autocomplete="username"
                  placeholder="Enter username"
                  required
                />
              </label>

              <label>
                <span>Password</span>
                <input
                  id="accessLoginPassword"
                  name="accessLoginPassword"
                  type="password"
                  autocomplete="current-password"
                  placeholder="Enter password"
                  required
                />
              </label>

              <div class="wide-field apartment-capture-panel">
                <p class="muted-text">
                  Only password-enabled active profiles can sign in here. If you just enabled login, use the username and password you saved for that profile.
                </p>
              </div>
            </div>

            <div class="form-actions">
              <button class="button button-primary" type="submit">Sign In</button>
              <button class="button button-secondary" type="reset">Clear</button>
            </div>
          </form>
        </section>

        <aside class="sidebar-column">
          <section class="section-card">
            <div class="section-heading compact">
              <div>
                <p class="kicker">Session Status</p>
                <h3>Workspace Locked</h3>
              </div>
            </div>
            <div class="mini-stat-grid">
              <article class="stat-card">
                <span>Total Profiles</span>
                <strong>${escapeHtml(String(state.userProfiles.length))}</strong>
              </article>
              <article class="stat-card">
                <span>Active Profiles</span>
                <strong>${escapeHtml(String(activeUsers.length))}</strong>
              </article>
              <article class="stat-card">
                <span>Password Users</span>
                <strong>${escapeHtml(String(passwordUsers.length))}</strong>
              </article>
              <article class="stat-card">
                <span>Open Menus</span>
                <strong>1</strong>
              </article>
            </div>
            <p class="muted-text">
              Sign in first, then the menus allowed for that role will appear automatically.
            </p>
            <div class="guide-list compact-guide-list">
              ${
                passwordUsers.length === 0
                  ? "<p>No password-enabled active users are available yet.</p>"
                  : passwordUsers
                      .map(
                        (profile) =>
                          `<p>${escapeHtml(profile.fullName)} • ${escapeHtml(profile.username)} • ${escapeHtml(
                            USER_ROLE_OPTIONS.find((item) => item.value === profile.role)?.label || profile.role
                          )}</p>`
                      )
                      .join("")
              }
            </div>
          </section>
        </aside>
      </section>
    `;
    return;
  }

  elements.accessViewRoot.innerHTML = `
    <section class="page-grid compact-page-grid">
      <section class="section-card">
        <div class="section-heading">
          <div>
            <p class="kicker">Role-Based Users</p>
            <h3>${editingRecord ? "Edit Workspace User" : "Manage Workspace Roles & Profiles"}</h3>
          </div>
          <p class="muted-text">
            ${
              loginRequired
                ? "These profiles control both sign-in and menu access on this device. Leave password blank while editing if you want to keep the current saved password."
                : "These profiles control which menus appear for the active workspace user on this device. Add password-required login to start using real sign-in."
            }
          </p>
        </div>

        <form id="accessUserForm" novalidate>
          <div class="mini-form-grid rental-form-grid">
            <label>
              <span>Full Name</span>
              <input
                id="accessFullName"
                name="accessFullName"
                type="text"
                value="${escapeHtml(draft.fullName)}"
                placeholder="Staff or manager name"
                required
              />
            </label>

            <label>
              <span>Username</span>
              <input
                id="accessUsername"
                name="accessUsername"
                type="text"
                value="${escapeHtml(draft.username)}"
                placeholder="short login-style name"
                required
              />
            </label>

            <label>
              <span>Role</span>
              <select id="accessRole" name="accessRole" required>
                ${buildSelectMarkup(USER_ROLE_OPTIONS, draft.role, "Choose role")}
              </select>
            </label>

            <label>
              <span>Phone</span>
              <input
                id="accessPhone"
                name="accessPhone"
                type="tel"
                value="${escapeHtml(draft.phone)}"
                placeholder="Optional phone number"
              />
            </label>

            <label>
              <span>User State</span>
              <select id="accessActiveState" name="accessActiveState">
                ${buildSelectMarkup(
                  [
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" }
                  ],
                  draft.active ? "active" : "inactive",
                  "Choose state"
                )}
              </select>
            </label>

            <label>
              <span>Login Access</span>
              <select id="accessLoginMode" name="accessLoginMode">
                ${buildSelectMarkup(
                  [
                    { value: "profile-only", label: "Profile Only" },
                    { value: "password-required", label: "Password Required" }
                  ],
                  draft.loginMode,
                  "Choose login mode"
                )}
              </select>
            </label>

            <label>
              <span>Password</span>
              <input
                id="accessPassword"
                name="accessPassword"
                type="password"
                autocomplete="new-password"
                placeholder="${editingRecord ? "Leave blank to keep current password" : "Set login password"}"
              />
            </label>

            <label>
              <span>Confirm Password</span>
              <input
                id="accessPasswordConfirm"
                name="accessPasswordConfirm"
                type="password"
                autocomplete="new-password"
                placeholder="${editingRecord ? "Repeat only when changing password" : "Repeat password"}"
              />
            </label>

            <div class="wide-field apartment-capture-panel">
              <p class="muted-text">${escapeHtml(currentRoleConfig.description)}</p>
              <p class="muted-text">
                ${
                  draft.loginMode === "password-required"
                    ? "Password-required users must sign in before their menus appear."
                    : "Profile-only users can still be used for menu preview when password login is not enabled."
                }
              </p>
              <div class="sheet-pill-list">
                ${currentRoleConfig.views
                  .map((view) => `<span class="sheet-pill">${escapeHtml(VIEW_META[view].title)}</span>`)
                  .join("")}
              </div>
            </div>

            <label class="wide-field">
              <span>Notes</span>
              <textarea
                id="accessNotes"
                name="accessNotes"
                rows="3"
                placeholder="Responsibility, shift note, or device note"
              >${escapeHtml(draft.notes)}</textarea>
            </label>
          </div>

          <div class="form-actions">
            <button id="submitAccessBtn" class="button button-primary" type="submit">
              ${editingRecord ? "Update User" : "Save User"}
            </button>
            <button id="resetAccessBtn" class="button button-secondary" type="button">
              Clear Form
            </button>
            <button
              id="cancelAccessEditBtn"
              class="button button-ghost ${editingRecord ? "" : "hidden"}"
              type="button"
            >
              Cancel Edit
            </button>
          </div>
        </form>
      </section>

      <aside class="sidebar-column">
        <section class="section-card">
          <div class="section-heading compact">
            <div>
              <p class="kicker">Workspace Session</p>
              <h3>${escapeHtml(
                authenticatedUser?.fullName ||
                  currentUser?.fullName ||
                  (state.userProfiles.length === 0 ? "No workspace users yet" : "No user signed in")
              )}</h3>
            </div>
          </div>
          <div class="form-actions">
            <button class="button button-secondary" data-global-action="export-view-csv" type="button">
              Export Users CSV
            </button>
            ${
              loginRequired && authenticatedUser
                ? '<button class="button button-ghost" data-access-action="logout" type="button">Sign Out</button>'
                : ""
            }
          </div>
          ${
            showQuickSwitch
              ? `
                  <label>
                    <span>Switch Active User</span>
                    <select id="activeWorkspaceUser">
                      ${buildSelectMarkup(
                        activeUsers.map((profile) => ({
                          value: profile.id,
                          label: `${profile.fullName} (${getRolePreset(profile.role).views.length} menus)`
                        })),
                        currentUser?.id || "",
                        activeUsers.length === 0 ? "No active users" : "Choose active user"
                      )}
                    </select>
                  </label>
                `
              : `
                  <p class="muted-text">
                    Password login is active. Use username and password sign-in instead of quick role switching.
                  </p>
                `
          }
          <div class="mini-stat-grid">
            <article class="stat-card">
              <span>Total Profiles</span>
              <strong>${escapeHtml(String(state.userProfiles.length))}</strong>
            </article>
            <article class="stat-card">
              <span>Active Profiles</span>
              <strong>${escapeHtml(String(activeUsers.length))}</strong>
            </article>
            <article class="stat-card">
              <span>Password Users</span>
              <strong>${escapeHtml(String(passwordUsers.length))}</strong>
            </article>
            <article class="stat-card">
              <span>Accessible Menus</span>
              <strong>${escapeHtml(String(currentUser ? getRolePreset(currentUser.role).views.length : Object.keys(VIEW_META).length))}</strong>
            </article>
            <article class="stat-card">
              <span>Restricted Menus</span>
              <strong>${escapeHtml(String(currentUser ? Object.keys(VIEW_META).length - getRolePreset(currentUser.role).views.length : 0))}</strong>
            </article>
          </div>
        </section>
      </aside>
    </section>

    <section class="section-card">
      <div class="section-heading compact">
        <div>
          <p class="kicker">Workspace Profiles</p>
          <h3>${state.userProfiles.length} User${state.userProfiles.length === 1 ? "" : "s"}</h3>
        </div>
      </div>
      <div class="table-wrap compact-table-wrap">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>State</th>
              <th>Login</th>
              <th>Menu Access</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${
              state.userProfiles.length === 0
                ? `
                    <tr>
                      <td colspan="6" class="empty-state">No workspace user profiles saved yet. When none exist, the app stays unrestricted.</td>
                    </tr>
                  `
                : state.userProfiles
                    .map((profile) => {
                      const rolePreset = getRolePreset(profile.role);
                      return `
                        <tr>
                          <td>
                            <span class="table-primary">${escapeHtml(profile.fullName)}</span>
                            <span class="table-secondary">${escapeHtml(profile.username)}${profile.phone ? ` • ${escapeHtml(profile.phone)}` : ""}</span>
                          </td>
                          <td>${escapeHtml(USER_ROLE_OPTIONS.find((item) => item.value === profile.role)?.label || profile.role)}</td>
                          <td>
                            <span class="alert-pill ${escapeHtml(profile.active ? "alert-pill-on-track" : "alert-pill-due")}">${escapeHtml(
                              profile.active ? "Active" : "Inactive"
                            )}</span>
                            <span class="table-secondary">${escapeHtml(profile.notes || "No note saved")}</span>
                          </td>
                          <td>
                            <span class="table-primary">${escapeHtml(
                              getUserLoginMode(profile) === "password-required" ? "Password Required" : "Profile Only"
                            )}</span>
                            <span class="table-secondary">${escapeHtml(
                              getUserLoginMode(profile) === "password-required"
                                ? "User must sign in"
                                : "No password needed"
                            )}</span>
                          </td>
                          <td>${escapeHtml(String(rolePreset.views.length))} menus</td>
                          <td>
                            <div class="row-actions">
                              ${
                                profile.active && showQuickSwitch
                                  ? `<button class="utility-btn" data-access-action="activate" data-id="${escapeHtml(
                                      profile.id
                                    )}" type="button">Use Now</button>`
                                  : ""
                              }
                              <button class="edit-btn" data-access-action="edit" data-id="${escapeHtml(
                                profile.id
                              )}" type="button">
                                Edit
                              </button>
                              <button class="delete-btn" data-access-action="delete" data-id="${escapeHtml(
                                profile.id
                              )}" type="button">
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      `;
                    })
                    .join("")
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

async function handleUserProfileSubmit(event) {
  event.preventDefault();

  const existingRecord = state.userProfiles.find((record) => record.id === state.editingUserId) || null;
  const draft = buildUserProfileDraftFromForm(new FormData(event.target));
  const errors = validateUserProfile(draft, existingRecord);

  if (errors.length > 0) {
    showToast(errors[0]);
    return;
  }

  const wasLoginRequired = isWorkspaceLoginRequired();
  const wantsPasswordLogin = draft.loginMode === "password-required";
  const nextPasswordHash = wantsPasswordLogin
    ? draft.password.trim()
      ? await buildPasswordDigest(draft.password.trim())
      : normalizeText(existingRecord?.passwordHash)
    : "";
  const nextProfile = {
    fullName: draft.fullName,
    username: draft.username,
    role: draft.role,
    phone: draft.phone,
    active: draft.active,
    loginEnabled: wantsPasswordLogin,
    passwordHash: nextPasswordHash,
    notes: draft.notes
  };

  if (state.editingUserId) {
    state.userProfiles = sortUserProfiles(
      state.userProfiles.map((record) =>
        record.id === state.editingUserId
          ? { ...record, ...nextProfile, updatedAt: new Date().toISOString() }
          : record
      )
    );
    showToast("Workspace user updated.");
  } else {
    state.userProfiles = sortUserProfiles([
      ...state.userProfiles,
      {
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...nextProfile
      }
    ]);
    showToast("Workspace user saved.");
  }

  persistUserProfiles();
  reconcileActiveUserProfile();
  reconcileAuthenticationSession();
  resetUserProfileForm({ silent: true });
  render();

  if (!wasLoginRequired && isWorkspaceLoginRequired() && !getAuthenticatedUserProfile()) {
    showToast("Password login is now enabled. Sign in with a saved username and password.");
  }
}

function startEditingUserProfile(userId) {
  const profile = state.userProfiles.find((item) => item.id === userId);

  if (!profile) {
    showToast("That workspace user could not be found.");
    return;
  }

  state.editingUserId = profile.id;
  navigateTo("access", { syncHash: true });
  render();
  scrollDynamicFormIntoView("accessUserForm");
}

function switchActiveUser(userId) {
  if (isWorkspaceLoginRequired()) {
    showToast("Password login is enabled. Sign in with username and password to switch users.");
    return;
  }

  const profile = state.userProfiles.find((item) => item.id === userId && item.active);

  if (!profile) {
    showToast("Choose an active user profile to switch roles.");
    return;
  }

  state.activeUserId = profile.id;
  persistSettings();
  navigateTo(getFirstAccessibleView(state.currentView), { syncHash: true, showAccessToast: false });
  render();
  showToast(`Active workspace user switched to ${profile.fullName}.`);
}

function deleteUserProfile(userId) {
  const profile = state.userProfiles.find((item) => item.id === userId);

  if (!profile) {
    showToast("That workspace user could not be found.");
    return;
  }

  const shouldDelete = window.confirm(`Delete the workspace user ${profile.fullName}?`);

  if (!shouldDelete) {
    return;
  }

  state.userProfiles = state.userProfiles.filter((item) => item.id !== userId);

  if (state.signedInUserId === userId) {
    state.signedInUserId = "";
    clearAuthSession();
  }

  persistUserProfiles();

  if (state.editingUserId === userId) {
    resetUserProfileForm({ silent: true });
  }

  reconcileActiveUserProfile();
  reconcileAuthenticationSession();
  render();
  showToast("Workspace user deleted.");
}

function resetUserProfileForm(options = {}) {
  state.editingUserId = null;

  if (!options.silent) {
    render();
    showToast("Access form cleared.");
  }
}

async function buildPasswordDigest(password) {
  const normalizedPassword = String(password || "");

  if (window.crypto?.subtle && typeof TextEncoder !== "undefined") {
    const bytes = new TextEncoder().encode(normalizedPassword);
    const digestBuffer = await window.crypto.subtle.digest("SHA-256", bytes);
    const digestHex = Array.from(new Uint8Array(digestBuffer), (value) =>
      value.toString(16).padStart(2, "0")
    ).join("");
    return `sha256:${digestHex}`;
  }

  let hash = 2166136261;

  for (const character of normalizedPassword) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return `fallback:${(hash >>> 0).toString(16)}`;
}

async function verifyUserPassword(profile, password) {
  return (await buildPasswordDigest(password)) === normalizeText(profile.passwordHash);
}

async function handleAccessLoginSubmit(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const username = normalizeText(formData.get("accessLoginUsername")).toLowerCase();
  const password = String(formData.get("accessLoginPassword") || "");

  if (!username) {
    showToast("Enter the username for this workspace user.");
    return;
  }

  if (!password) {
    showToast("Enter the password for this workspace user.");
    return;
  }

  const profile = state.userProfiles.find(
    (item) => normalizeText(item.username).toLowerCase() === username && isPasswordLoginEnabledForProfile(item)
  );

  if (!profile) {
    showToast("That username is not available for password login.");
    return;
  }

  const passwordMatches = await verifyUserPassword(profile, password);

  if (!passwordMatches) {
    showToast("The username or password is not correct.");
    return;
  }

  state.signedInUserId = profile.id;
  state.activeUserId = profile.id;
  persistAuthSession(profile.id, {
    username: profile.username,
    password
  });
  persistSettings();
  navigateTo(getFirstAccessibleView("overview"), { syncHash: true, showAccessToast: false });
  render();
  showToast(`Signed in as ${profile.fullName}.`);
}

function signOutWorkspaceUser(options = {}) {
  const signedInProfile = getAuthenticatedUserProfile();
  state.signedInUserId = "";
  clearAuthSession();
  navigateTo("access", { syncHash: true, showAccessToast: false });
  render();

  if (options.showToast !== false) {
    showToast(
      signedInProfile ? `${signedInProfile.fullName} has been signed out.` : "Workspace user signed out."
    );
  }
}

function handleWorkspaceAuthAction() {
  if (!Array.isArray(state.userProfiles) || state.userProfiles.length === 0) {
    navigateTo("access", { syncHash: true, showAccessToast: false });
    return;
  }

  if (isWorkspaceLoginRequired() && !isWorkspaceLocked()) {
    signOutWorkspaceUser();
    return;
  }

  navigateTo("access", { syncHash: true, showAccessToast: false });
}

function renderRecurringPage() {
  if (!elements.recurringViewRoot) {
    return;
  }

  const editingRecord =
    state.recurringControls.find((item) => item.id === state.editingRecurringId) || null;
  const draft = editingRecord || createEmptyRecurringDraft();
  const controls = getFilteredRecurringControls();
  const activeCount = state.recurringControls.filter((item) => item.active).length;
  const dueNowCount = state.recurringControls.filter((item) => isRecurringDue(item)).length;
  const dueSoonCount = state.recurringControls.filter((item) => isRecurringDueSoon(item)).length;
  const currentMonthKey = getMonthKey(new Date());
  const generatedThisMonth = state.recurringControls.filter((item) =>
    normalizeDateInput(item.lastGeneratedDate).startsWith(currentMonthKey)
  ).length;
  const currentModuleType = draft.moduleType || "expense";

  elements.recurringViewRoot.innerHTML = `
    <section class="page-grid compact-page-grid">
      <section class="section-card">
        <div class="section-heading">
          <div>
            <p class="kicker">Recurring Controls</p>
            <h3>${editingRecord ? "Edit Recurring Control" : "Schedule Repeated Work"}</h3>
          </div>
          <p class="muted-text">
            Generate the next due expense, supplier bill, maintenance task, or apartment month without replacing existing records.
          </p>
        </div>

        <form id="recurringForm" novalidate>
          <div class="mini-form-grid rental-form-grid">
            <label class="wide-field">
              <span>Control Name</span>
              <input
                id="recurringTitle"
                name="recurringTitle"
                type="text"
                value="${escapeHtml(draft.title)}"
                placeholder="Describe the repeated transaction or task"
                required
              />
            </label>

            <label>
              <span>Module</span>
              <select id="recurringModuleType" name="recurringModuleType" required>
                ${buildSelectMarkup(RECURRING_MODULE_OPTIONS, currentModuleType, "Choose module")}
              </select>
            </label>

            <label>
              <span>Business Area</span>
              <select id="recurringBusinessArea" name="recurringBusinessArea" required>
                ${buildSelectMarkup(
                  getBusinessAreaOptions(),
                  draft.businessAreaId,
                  "Choose business area"
                )}
              </select>
            </label>

            <label>
              <span>Expense Type</span>
              <select id="recurringCategory" name="recurringCategory">
                ${buildSelectMarkup(
                  getMergedAreaCategories(),
                  draft.category,
                  "Choose expense type"
                )}
              </select>
            </label>

            <label>
              <span>Counterparty / Vendor</span>
              <input
                id="recurringCounterparty"
                name="recurringCounterparty"
                type="text"
                value="${escapeHtml(draft.counterparty)}"
                placeholder="Supplier, vendor, or technician"
              />
            </label>

            <label>
              <span>Suite / Location</span>
              <input
                id="recurringSuite"
                name="recurringSuite"
                type="text"
                value="${escapeHtml(draft.suite)}"
                placeholder="Suite or work location"
              />
            </label>

            <label>
              <span>Amount</span>
              <input
                id="recurringAmount"
                name="recurringAmount"
                type="number"
                min="0"
                step="0.01"
                value="${escapeHtml(formatAmountInputValue(draft.amount))}"
                placeholder="0.00"
              />
            </label>

            <label>
              <span>Frequency</span>
              <select id="recurringFrequency" name="recurringFrequency" required>
                ${buildSelectMarkup(
                  RECURRING_FREQUENCY_OPTIONS,
                  draft.frequency,
                  "Choose frequency"
                )}
              </select>
            </label>

            <label>
              <span>Start Date</span>
              <input id="recurringStartDate" name="recurringStartDate" type="date" value="${escapeHtml(
                draft.startDate
              )}" />
            </label>

            <label>
              <span>Next Due Date</span>
              <input id="recurringNextDueDate" name="recurringNextDueDate" type="date" value="${escapeHtml(
                draft.nextDueDate
              )}" required />
            </label>

            <label>
              <span>Last Generated Date</span>
              <input
                id="recurringLastGeneratedDate"
                name="recurringLastGeneratedDate"
                type="date"
                value="${escapeHtml(draft.lastGeneratedDate)}"
              />
            </label>

            <label>
              <span>Maintenance Priority</span>
              <select id="recurringPriority" name="recurringPriority">
                ${buildSelectMarkup(
                  MAINTENANCE_PRIORITY_OPTIONS,
                  draft.priority,
                  "Choose priority"
                )}
              </select>
            </label>

            <label>
              <span>State</span>
              <select id="recurringActiveState" name="recurringActiveState">
                ${buildSelectMarkup(
                  ACTIVE_STATE_OPTIONS,
                  draft.active ? "active" : "paused",
                  "Choose state"
                )}
              </select>
            </label>

            <label class="wide-field">
              <span>Notes</span>
              <textarea
                id="recurringNotes"
                name="recurringNotes"
                rows="3"
                placeholder="Explain what should happen when this control runs"
              >${escapeHtml(draft.notes)}</textarea>
            </label>

            <div id="recurringContextNote" class="wide-field apartment-capture-panel">
              <p class="muted-text">${escapeHtml(getRecurringContextNote(currentModuleType))}</p>
            </div>
          </div>

          <div class="form-actions">
            <button id="submitRecurringBtn" class="button button-primary" type="submit">
              ${editingRecord ? "Update Recurring Control" : "Save Recurring Control"}
            </button>
            <button id="resetRecurringBtn" class="button button-secondary" type="button">
              Clear Form
            </button>
            <button
              id="cancelRecurringEditBtn"
              class="button button-ghost ${editingRecord ? "" : "hidden"}"
              type="button"
            >
              Cancel Edit
            </button>
          </div>
        </form>
      </section>

      <aside class="sidebar-column">
        <section class="section-card">
          <div class="section-heading compact">
            <div>
              <p class="kicker">Run Queue</p>
              <h3>Recurring Snapshot</h3>
            </div>
            <button id="runDueRecurringBtn" class="button button-secondary" type="button">
              Run Due Controls
            </button>
          </div>
          <div class="mini-stat-grid">
            <article class="stat-card">
              <span>Active Controls</span>
              <strong>${escapeHtml(String(activeCount))}</strong>
            </article>
            <article class="stat-card">
              <span>Due Now</span>
              <strong>${escapeHtml(String(dueNowCount))}</strong>
            </article>
            <article class="stat-card">
              <span>Due Soon</span>
              <strong>${escapeHtml(String(dueSoonCount))}</strong>
            </article>
            <article class="stat-card">
              <span>Generated This Month</span>
              <strong>${escapeHtml(String(generatedThisMonth))}</strong>
            </article>
          </div>
        </section>

        <section class="section-card">
          <div class="section-heading compact">
            <div>
              <p class="kicker">Filters</p>
              <h3>Refine Recurring View</h3>
            </div>
          </div>
          <div class="filter-grid">
            <label>
              <span>Search</span>
              <input
                id="recurringSearchFilter"
                type="search"
                value="${escapeHtml(state.recurringFilters.search)}"
                placeholder="Control name or notes"
              />
            </label>
            <label>
              <span>Module</span>
              <select id="recurringModuleFilter">
                ${buildSelectMarkup(
                  RECURRING_MODULE_OPTIONS,
                  state.recurringFilters.moduleType,
                  "Any Module"
                )}
              </select>
            </label>
            <label>
              <span>Status</span>
              <select id="recurringStatusFilter">
                ${buildSelectMarkup(
                  [
                    { value: "scheduled", label: "Scheduled" },
                    { value: "due-soon", label: "Due Soon" },
                    { value: "overdue", label: "Overdue" },
                    { value: "paused", label: "Paused" }
                  ],
                  state.recurringFilters.status,
                  "Any Status"
                )}
              </select>
            </label>
          </div>
        </section>
      </aside>
    </section>

    <section class="section-card">
      <div class="section-heading compact">
        <div>
          <p class="kicker">Recurring Queue</p>
          <h3>${controls.length} Control${controls.length === 1 ? "" : "s"} In View</h3>
        </div>
        <p class="muted-text">
          Running a control adds the next due record and then advances the next due date to the following cycle.
        </p>
      </div>
      <div class="table-wrap compact-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Next Due</th>
              <th>Control</th>
              <th>Module</th>
              <th>Frequency</th>
              <th>Amount / Location</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${
              controls.length === 0
                ? `
                    <tr>
                      <td colspan="7" class="empty-state">
                        No recurring controls match the current view yet.
                      </td>
                    </tr>
                  `
                : controls
                    .map((record) => {
                      const status = getRecurringStatusConfig(record);
                      return `
                        <tr>
                          <td>
                            <span class="table-primary">${escapeHtml(
                              formatOptionalDate(record.nextDueDate)
                            )}</span>
                            <span class="table-secondary">Last generated ${escapeHtml(
                              formatOptionalDate(record.lastGeneratedDate)
                            )}</span>
                          </td>
                          <td>
                            <span class="table-primary">${escapeHtml(record.title)}</span>
                            <span class="table-secondary">${escapeHtml(record.counterparty || record.notes || "No extra note")}</span>
                          </td>
                          <td>
                            <span class="tag tag-area">${escapeHtml(
                              getRecurringModuleLabel(record.moduleType)
                            )}</span>
                            <span class="table-secondary">${escapeHtml(
                              getBusinessArea(record.businessAreaId).shortLabel
                            )}</span>
                          </td>
                          <td>${escapeHtml(getRecurringFrequencyLabel(record.frequency))}</td>
                          <td>
                            <span class="table-primary">${escapeHtml(
                              record.amount > 0 ? formatCurrency(record.amount) : "No fixed amount"
                            )}</span>
                            <span class="table-secondary">${escapeHtml(record.suite || "No suite/location saved")}</span>
                          </td>
                          <td>
                            <span class="alert-pill ${escapeHtml(status.pillClass)}">${escapeHtml(
                              status.label
                            )}</span>
                            <span class="table-secondary">${escapeHtml(status.meta)}</span>
                          </td>
                          <td>
                            <div class="row-actions">
                              <button class="edit-btn" data-recurring-action="run" data-id="${escapeHtml(
                                record.id
                              )}" type="button">
                                Run
                              </button>
                              <button class="edit-btn" data-recurring-action="edit" data-id="${escapeHtml(
                                record.id
                              )}" type="button">
                                Edit
                              </button>
                              <button class="delete-btn" data-recurring-action="delete" data-id="${escapeHtml(
                                record.id
                              )}" type="button">
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      `;
                    })
                    .join("")
            }
          </tbody>
        </table>
      </div>
    </section>
  `;

  updateRecurringFormContextNote();
}

function renderMaintenancePage() {
  if (!elements.maintenanceViewRoot) {
    return;
  }

  const editingRecord =
    state.maintenanceRecords.find((item) => item.id === state.editingMaintenanceId) || null;
  const draft = editingRecord || createEmptyMaintenanceDraft();
  const records = getFilteredMaintenanceRecords();
  const openCount = records.filter((record) => record.status === "Open").length;
  const inProgressCount = records.filter((record) =>
    ["Scheduled", "In Progress"].includes(record.status)
  ).length;
  const overdueCount = records.filter((record) => isMaintenanceOverdue(record)).length;
  const openEstimatedCost = records
    .filter((record) => record.status !== "Completed")
    .reduce((sum, record) => sum + record.estimatedCost, 0);

  elements.maintenanceViewRoot.innerHTML = `
    <section class="page-grid compact-page-grid">
      <section class="section-card">
        <div class="section-heading">
          <div>
            <p class="kicker">Maintenance Log</p>
            <h3>${editingRecord ? "Edit Maintenance Record" : "Track Repairs, Service & Cleaning"}</h3>
          </div>
          <p class="muted-text">
            Log work orders, track who is handling them, and see what is open or overdue across the business.
          </p>
        </div>

        <form id="maintenanceForm" novalidate>
          <div class="mini-form-grid rental-form-grid">
            <label>
              <span>Reported Date</span>
              <input id="maintenanceReportedDate" name="maintenanceReportedDate" type="date" value="${escapeHtml(
                draft.reportedDate
              )}" required />
            </label>

            <label>
              <span>Business Area</span>
              <select id="maintenanceBusinessArea" name="maintenanceBusinessArea" required>
                ${buildSelectMarkup(
                  getBusinessAreaOptions(),
                  draft.businessAreaId,
                  "Choose business area"
                )}
              </select>
            </label>

            <label>
              <span>Location / Suite</span>
              <input
                id="maintenanceLocation"
                name="maintenanceLocation"
                type="text"
                value="${escapeHtml(draft.location)}"
                placeholder="Room, suite, store, work area"
              />
            </label>

            <label>
              <span>Asset / Item</span>
              <input
                id="maintenanceAssetItem"
                name="maintenanceAssetItem"
                type="text"
                value="${escapeHtml(draft.assetItem)}"
                placeholder="Machine, fitting, tool, area"
              />
            </label>

            <label class="wide-field">
              <span>Issue / Task</span>
              <input
                id="maintenanceIssue"
                name="maintenanceIssue"
                type="text"
                value="${escapeHtml(draft.issue)}"
                placeholder="What needs attention?"
                required
              />
            </label>

            <label>
              <span>Priority</span>
              <select id="maintenancePriority" name="maintenancePriority" required>
                ${buildSelectMarkup(
                  MAINTENANCE_PRIORITY_OPTIONS,
                  draft.priority,
                  "Choose priority"
                )}
              </select>
            </label>

            <label>
              <span>Status</span>
              <select id="maintenanceStatus" name="maintenanceStatus" required>
                ${buildSelectMarkup(MAINTENANCE_STATUS_OPTIONS, draft.status, "Choose status")}
              </select>
            </label>

            <label>
              <span>Due Date</span>
              <input id="maintenanceDueDate" name="maintenanceDueDate" type="date" value="${escapeHtml(
                draft.dueDate
              )}" />
            </label>

            <label>
              <span>Estimated Cost</span>
              <input
                id="maintenanceEstimatedCost"
                name="maintenanceEstimatedCost"
                type="number"
                min="0"
                step="0.01"
                value="${escapeHtml(formatAmountInputValue(draft.estimatedCost))}"
                placeholder="0.00"
              />
            </label>

            <label>
              <span>Actual Cost</span>
              <input
                id="maintenanceActualCost"
                name="maintenanceActualCost"
                type="number"
                min="0"
                step="0.01"
                value="${escapeHtml(formatAmountInputValue(draft.actualCost))}"
                placeholder="0.00"
              />
            </label>

            <label>
              <span>Vendor / Technician</span>
              <input
                id="maintenanceVendor"
                name="maintenanceVendor"
                type="text"
                value="${escapeHtml(draft.vendor)}"
                placeholder="Person or business handling the work"
              />
            </label>

            <label class="wide-field">
              <span>Notes</span>
              <textarea
                id="maintenanceNotes"
                name="maintenanceNotes"
                rows="3"
                placeholder="Progress notes, parts needed, or completion details"
              >${escapeHtml(draft.notes)}</textarea>
            </label>
          </div>

          <div class="form-actions">
            <button id="submitMaintenanceBtn" class="button button-primary" type="submit">
              ${editingRecord ? "Update Maintenance Record" : "Save Maintenance Record"}
            </button>
            <button id="resetMaintenanceBtn" class="button button-secondary" type="button">
              Clear Form
            </button>
            <button
              id="cancelMaintenanceEditBtn"
              class="button button-ghost ${editingRecord ? "" : "hidden"}"
              type="button"
            >
              Cancel Edit
            </button>
          </div>
        </form>
      </section>

      <aside class="sidebar-column">
        <section class="section-card">
          <div class="section-heading compact">
            <div>
              <p class="kicker">Maintenance Snapshot</p>
              <h3>Workload & Cost</h3>
            </div>
          </div>
          <div class="mini-stat-grid">
            <article class="stat-card">
              <span>Open</span>
              <strong>${escapeHtml(String(openCount))}</strong>
            </article>
            <article class="stat-card">
              <span>Scheduled / In Progress</span>
              <strong>${escapeHtml(String(inProgressCount))}</strong>
            </article>
            <article class="stat-card">
              <span>Overdue</span>
              <strong>${escapeHtml(String(overdueCount))}</strong>
            </article>
            <article class="stat-card">
              <span>Open Estimated Cost</span>
              <strong>${formatCurrency(openEstimatedCost)}</strong>
            </article>
          </div>
        </section>

        <section class="section-card">
          <div class="section-heading compact">
            <div>
              <p class="kicker">Filters</p>
              <h3>Refine Maintenance View</h3>
            </div>
          </div>
          <div class="filter-grid">
            <label>
              <span>Search</span>
              <input
                id="maintenanceSearchFilter"
                type="search"
                value="${escapeHtml(state.maintenanceFilters.search)}"
                placeholder="Location, item, issue"
              />
            </label>
            <label>
              <span>Business Area</span>
              <select id="maintenanceAreaFilter">
                ${buildSelectMarkup(
                  getBusinessAreaOptions(),
                  state.maintenanceFilters.area,
                  "All Areas"
                )}
              </select>
            </label>
            <label>
              <span>Status</span>
              <select id="maintenanceStatusFilter">
                ${buildSelectMarkup(
                  MAINTENANCE_STATUS_OPTIONS,
                  state.maintenanceFilters.status,
                  "Any Status"
                )}
              </select>
            </label>
            <label>
              <span>Priority</span>
              <select id="maintenancePriorityFilter">
                ${buildSelectMarkup(
                  MAINTENANCE_PRIORITY_OPTIONS,
                  state.maintenanceFilters.priority,
                  "Any Priority"
                )}
              </select>
            </label>
          </div>
        </section>
      </aside>
    </section>

    <section class="section-card">
      <div class="section-heading compact">
        <div>
          <p class="kicker">Maintenance Records</p>
          <h3>${records.length} Record${records.length === 1 ? "" : "s"} In View</h3>
        </div>
        <p class="muted-text">
          Use this with the supplier ledger when repair work creates outside payables.
        </p>
      </div>
      <div class="table-wrap compact-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Reported</th>
              <th>Location & Item</th>
              <th>Issue</th>
              <th>Area</th>
              <th>Priority / Status</th>
              <th>Due & Cost</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${
              records.length === 0
                ? `
                    <tr>
                      <td colspan="7" class="empty-state">
                        No maintenance records match the current view yet.
                      </td>
                    </tr>
                  `
                : records
                    .map((record) => {
                      const status = getMaintenanceStatusConfig(record);
                      return `
                        <tr>
                          <td>${escapeHtml(formatDisplayDate(record.reportedDate))}</td>
                          <td>
                            <span class="table-primary">${escapeHtml(record.location || "No location saved")}</span>
                            <span class="table-secondary">${escapeHtml(record.assetItem || "No asset/item saved")}</span>
                          </td>
                          <td>
                            <span class="table-primary">${escapeHtml(record.issue)}</span>
                            <span class="table-secondary">${escapeHtml(record.vendor || "No vendor/technician saved")}</span>
                          </td>
                          <td><span class="tag tag-area">${escapeHtml(
                            getBusinessArea(record.businessAreaId).shortLabel
                          )}</span></td>
                          <td>
                            <span class="alert-pill ${escapeHtml(
                              getMaintenancePriorityPillClass(record.priority)
                            )}">${escapeHtml(record.priority)}</span>
                            <span class="table-secondary">${escapeHtml(status.label)}</span>
                          </td>
                          <td>
                            <span class="table-primary">${escapeHtml(formatOptionalDate(record.dueDate))}</span>
                            <span class="table-secondary">Estimated ${formatCurrency(
                              record.estimatedCost
                            )}</span>
                            <span class="table-secondary">Actual ${formatCurrency(record.actualCost)}</span>
                          </td>
                          <td>
                            <div class="row-actions">
                              <button class="edit-btn" data-maintenance-action="edit" data-id="${escapeHtml(
                                record.id
                              )}" type="button">
                                Edit
                              </button>
                              <button class="delete-btn" data-maintenance-action="delete" data-id="${escapeHtml(
                                record.id
                              )}" type="button">
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      `;
                    })
                    .join("")
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function createEmptySalaryDraft() {
  const currentMonth = getMonthKey(new Date());

  return {
    month: currentMonth,
    businessAreaId: DEFAULT_BUSINESS_AREA_ID,
    staffName: "",
    roleTitle: "",
    salaryType: "Monthly Salary",
    grossAmount: 0,
    deductionAmount: 0,
    amountPaid: 0,
    dueDate: buildMonthEndDate(currentMonth),
    paymentDate: "",
    paymentMethod: "",
    paymentReference: "",
    kpiMetric: "",
    kpiUnit: "",
    kpiTarget: null,
    kpiActual: null,
    notes: ""
  };
}

function normalizeSalaryType(value) {
  const normalized = normalizeText(value).toLowerCase();
  const matched = SALARY_TYPE_OPTIONS.find((option) => option.toLowerCase() === normalized);
  return matched || "";
}

function getSalaryTypeLabel(value) {
  return normalizeSalaryType(value) || normalizeText(value) || "Salary";
}

function getSalaryNetDue(record) {
  return Number(
    Math.max(parseOptionalAmount(record.grossAmount) - parseOptionalAmount(record.deductionAmount), 0).toFixed(2)
  );
}

function getSalaryBalance(record) {
  return Number(Math.max(getSalaryNetDue(record) - parseOptionalAmount(record.amountPaid), 0).toFixed(2));
}

function getSalaryKpiTarget(record) {
  return parseOptionalAmount(record?.kpiTarget);
}

function getSalaryKpiActual(record) {
  return parseOptionalAmount(record?.kpiActual);
}

function hasSalaryKpiTarget(record) {
  return parseOptionalAmountOrNull(record?.kpiTarget) !== null;
}

function hasSalaryKpiActual(record) {
  return parseOptionalAmountOrNull(record?.kpiActual) !== null;
}

function getSalaryKpiAchievement(record) {
  const target = getSalaryKpiTarget(record);

  if (!hasSalaryKpiTarget(record) || !hasSalaryKpiActual(record) || target <= 0) {
    return null;
  }

  return Number(((getSalaryKpiActual(record) / target) * 100).toFixed(1));
}

function getSalaryKpiVariance(record) {
  return Number((getSalaryKpiActual(record) - getSalaryKpiTarget(record)).toFixed(2));
}

function getSalaryKpiMetricLabel(record) {
  return normalizeText(record?.kpiMetric) || "No KPI metric saved";
}

function buildSalaryKpiMeasurementLabel(record) {
  const metric = normalizeText(record?.kpiMetric);
  const unit = normalizeText(record?.kpiUnit);
  const hasTarget = hasSalaryKpiTarget(record);
  const hasActual = hasSalaryKpiActual(record);
  const target = getSalaryKpiTarget(record);
  const actual = getSalaryKpiActual(record);
  const achievement = getSalaryKpiAchievement(record);

  if (!metric && !hasTarget && !hasActual) {
    return "Target and measurement not captured yet";
  }

  const unitSuffix = unit ? ` ${unit}` : "";
  const segments = [];

  if (hasTarget) {
    segments.push(`Target ${formatKpiNumber(target)}${unitSuffix}`);
  }

  if (hasActual) {
    segments.push(`Actual ${formatKpiNumber(actual)}${unitSuffix}`);
  }

  if (achievement !== null) {
    segments.push(`${formatPercentLabel(achievement)}`);
  }

  return segments.join(" • ") || `${metric}${unitSuffix ? ` (${unit})` : ""}`;
}

function getSalaryPaymentStatus(record) {
  const balance = getSalaryBalance(record);
  const amountPaid = parseOptionalAmount(record.amountPaid);

  if (getSalaryNetDue(record) > 0 && balance === 0) {
    return "Paid";
  }

  if (amountPaid > 0) {
    return "Part Paid";
  }

  if (record.dueDate && daysUntilDate(record.dueDate) < 0) {
    return "Overdue";
  }

  return "Due";
}

function getSalaryStatusConfig(record) {
  const status = getSalaryPaymentStatus(record);

  if (status === "Paid") {
    return {
      label: "Paid",
      pillClass: "alert-pill-on-track",
      meta: record.paymentDate ? `Paid on ${formatDisplayDate(record.paymentDate)}` : "Fully settled"
    };
  }

  if (status === "Overdue") {
    return {
      label: "Overdue",
      pillClass: "alert-pill-overdue",
      meta: record.dueDate
        ? `Balance overdue since ${formatDisplayDate(record.dueDate)}`
        : "Balance overdue"
    };
  }

  if (status === "Part Paid") {
    return {
      label: "Part Paid",
      pillClass: "alert-pill-due",
      meta: `${formatCurrency(getSalaryBalance(record))} still outstanding`
    };
  }

  return {
    label: "Due",
    pillClass: "alert-pill-due",
    meta: record.dueDate ? `Due ${formatDisplayDate(record.dueDate)}` : "Awaiting payment"
  };
}

function formatPercentLabel(value, fallback = "0%") {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  const rounded = Math.round(Math.max(value, 0) * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}%`;
}

function formatKpiNumber(value) {
  const amount = parseOptionalAmount(value);

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2
  }).format(amount);
}

function buildStaffKpiRows(records) {
  const rowsByStaff = new Map();

  sortSalaryRecords(records).forEach((record) => {
    const staffName = normalizeText(record.staffName);

    if (!staffName) {
      return;
    }

    const staffKey = staffName.toLowerCase();
    const netDue = getSalaryNetDue(record);
    const amountPaid = parseOptionalAmount(record.amountPaid);
    const balance = getSalaryBalance(record);
    const paymentStatus = getSalaryPaymentStatus(record);
    const roleTitle = normalizeText(record.roleTitle);
    const dueDate = normalizeDateInput(record.dueDate);
    const paymentDate = normalizeDateInput(record.paymentDate);
    const businessAreaLabel = getBusinessArea(record.businessAreaId).shortLabel;
    const kpiMetric = normalizeText(record.kpiMetric);
    const kpiUnit = normalizeText(record.kpiUnit);
    const hasKpiTarget = hasSalaryKpiTarget(record);
    const hasKpiActual = hasSalaryKpiActual(record);
    const kpiTarget = getSalaryKpiTarget(record);
    const kpiActual = getSalaryKpiActual(record);
    const existing = rowsByStaff.get(staffKey) || {
      staffName,
      roleTitle: "",
      businessAreas: new Set(),
      recordCount: 0,
      payrollDue: 0,
      amountPaid: 0,
      balance: 0,
      paidRecordCount: 0,
      partialRecordCount: 0,
      dueRecordCount: 0,
      overdueRecordCount: 0,
      kpiMetric: "",
      kpiUnit: "",
      kpiTarget: 0,
      kpiActual: 0,
      targetedRecordCount: 0,
      measuredRecordCount: 0,
      metTargetRecordCount: 0,
      nextDueDate: "",
      latestPaymentDate: ""
    };

    if (!existing.roleTitle && roleTitle) {
      existing.roleTitle = roleTitle;
    }

    existing.businessAreas.add(businessAreaLabel);
    existing.recordCount += 1;
    existing.payrollDue += netDue;
    existing.amountPaid += amountPaid;
    existing.balance += balance;

    if (!existing.kpiMetric && kpiMetric) {
      existing.kpiMetric = kpiMetric;
    } else if (
      existing.kpiMetric &&
      kpiMetric &&
      existing.kpiMetric.toLowerCase() !== kpiMetric.toLowerCase()
    ) {
      existing.kpiMetric = "Multiple KPIs";
    }

    if (!existing.kpiUnit && kpiUnit) {
      existing.kpiUnit = kpiUnit;
    } else if (
      existing.kpiUnit &&
      kpiUnit &&
      existing.kpiUnit.toLowerCase() !== kpiUnit.toLowerCase()
    ) {
      existing.kpiUnit = "";
    }

    if (hasKpiTarget) {
      existing.kpiTarget += kpiTarget;
    }

    if (hasKpiActual) {
      existing.kpiActual += kpiActual;
    }

    if (hasKpiTarget) {
      existing.targetedRecordCount += 1;
    }

    if (hasKpiActual) {
      existing.measuredRecordCount += 1;
    }

    if (hasKpiTarget && hasKpiActual && kpiActual >= kpiTarget) {
      existing.metTargetRecordCount += 1;
    }

    if (paymentStatus === "Paid") {
      existing.paidRecordCount += 1;
    } else if (paymentStatus === "Part Paid") {
      existing.partialRecordCount += 1;
    } else if (paymentStatus === "Overdue") {
      existing.overdueRecordCount += 1;
    } else {
      existing.dueRecordCount += 1;
    }

    if (
      balance > 0 &&
      dueDate &&
      (!existing.nextDueDate || dueDate < existing.nextDueDate)
    ) {
      existing.nextDueDate = dueDate;
    }

    if (paymentDate && (!existing.latestPaymentDate || paymentDate > existing.latestPaymentDate)) {
      existing.latestPaymentDate = paymentDate;
    }

    rowsByStaff.set(staffKey, existing);
  });

  return Array.from(rowsByStaff.values())
    .map((row) => {
      const payrollDue = Number(row.payrollDue.toFixed(2));
      const amountPaid = Number(row.amountPaid.toFixed(2));
      const balance = Number(row.balance.toFixed(2));
      const kpiTarget = Number(row.kpiTarget.toFixed(2));
      const kpiActual = Number(row.kpiActual.toFixed(2));

      return {
        staffName: row.staffName,
        roleTitle: row.roleTitle,
        businessAreas: Array.from(row.businessAreas).sort(),
        businessAreaSummary: Array.from(row.businessAreas).sort().join(", "),
        recordCount: row.recordCount,
        payrollDue,
        amountPaid,
        balance,
        paidRecordCount: row.paidRecordCount,
        partialRecordCount: row.partialRecordCount,
        dueRecordCount: row.dueRecordCount,
        overdueRecordCount: row.overdueRecordCount,
        kpiMetric: row.kpiMetric,
        kpiUnit: row.kpiUnit,
        kpiTarget,
        kpiActual,
        hasKpiTarget: row.targetedRecordCount > 0,
        hasKpiActual: row.measuredRecordCount > 0,
        targetedRecordCount: row.targetedRecordCount,
        measuredRecordCount: row.measuredRecordCount,
        metTargetRecordCount: row.metTargetRecordCount,
        nextDueDate: row.nextDueDate,
        latestPaymentDate: row.latestPaymentDate,
        completionRate: payrollDue > 0 ? Number(((amountPaid / payrollDue) * 100).toFixed(1)) : 0,
        targetAchievement:
          row.targetedRecordCount > 0 && row.measuredRecordCount > 0 && kpiTarget > 0
            ? Number(((kpiActual / kpiTarget) * 100).toFixed(1))
            : null,
        targetVariance: Number((kpiActual - kpiTarget).toFixed(2))
      };
    })
    .sort((left, right) => {
      if (right.balance !== left.balance) {
        return right.balance - left.balance;
      }

      if (right.payrollDue !== left.payrollDue) {
        return right.payrollDue - left.payrollDue;
      }

      return left.staffName.localeCompare(right.staffName);
    });
}

function getStaffKpiStatusConfig(row) {
  if (!row) {
    return {
      label: "No Records",
      pillClass: "alert-pill-on-track",
      meta: "No payroll records in this view."
    };
  }

  if (row.payrollDue > 0 && row.balance === 0) {
    return {
      label: "Paid",
      pillClass: "alert-pill-on-track",
      meta: row.latestPaymentDate
        ? `Latest payment ${formatDisplayDate(row.latestPaymentDate)}`
        : "Fully settled"
    };
  }

  if (row.overdueRecordCount > 0) {
    return {
      label: "Overdue",
      pillClass: "alert-pill-overdue",
      meta: row.nextDueDate
        ? `${formatCurrency(row.balance)} overdue since ${formatDisplayDate(row.nextDueDate)}`
        : `${formatCurrency(row.balance)} overdue`
    };
  }

  if (row.amountPaid > 0) {
    return {
      label: "Part Paid",
      pillClass: "alert-pill-due",
      meta: `${formatCurrency(row.balance)} still outstanding`
    };
  }

  return {
    label: "Due",
    pillClass: "alert-pill-due",
    meta: row.nextDueDate ? `Due ${formatDisplayDate(row.nextDueDate)}` : "Awaiting payment"
  };
}

function getStaffTargetStatusConfig(row) {
  const hasTarget = Boolean(
    row &&
      (typeof row.hasKpiTarget === "boolean"
        ? row.hasKpiTarget
        : Number.isFinite(row.targetedRecordCount)
          ? row.targetedRecordCount > 0
          : row.kpiTarget > 0)
  );
  const hasActual = Boolean(
    row &&
      (typeof row.hasKpiActual === "boolean"
        ? row.hasKpiActual
        : Number.isFinite(row.measuredRecordCount)
          ? row.measuredRecordCount > 0
          : row.kpiActual > 0)
  );

  if (!row || (!hasTarget && !hasActual && !row.kpiMetric)) {
    return {
      label: "No KPI",
      pillClass: "alert-pill-on-track",
      meta: "No target or measurement saved."
    };
  }

  if (hasTarget && hasActual && row.kpiActual >= row.kpiTarget) {
    return {
      label: "On / Above Target",
      pillClass: "alert-pill-on-track",
      meta: `${formatKpiNumber(Math.abs(row.targetVariance))}${row.kpiUnit ? ` ${row.kpiUnit}` : ""} above or on target`
    };
  }

  if (hasTarget && hasActual) {
    return {
      label: "Below Target",
      pillClass: "alert-pill-due",
      meta: `${formatKpiNumber(Math.abs(row.targetVariance))}${row.kpiUnit ? ` ${row.kpiUnit}` : ""} below target`
    };
  }

  if (hasTarget) {
    return {
      label: "Awaiting Measurement",
      pillClass: "alert-pill-due",
      meta: "Target saved, actual result not entered yet."
    };
  }

  return {
    label: "Measured",
    pillClass: "alert-pill-due",
    meta: "Actual result saved without a target."
  };
}

function buildSalaryKpiSummary(records) {
  const rows = buildStaffKpiRows(records);
  const payrollDue = rows.reduce((sum, row) => sum + row.payrollDue, 0);
  const payrollPaid = rows.reduce((sum, row) => sum + row.amountPaid, 0);
  const outstanding = rows.reduce((sum, row) => sum + row.balance, 0);
  const kpiTargetTotal = rows.reduce((sum, row) => sum + row.kpiTarget, 0);
  const kpiActualTotal = rows.reduce((sum, row) => sum + row.kpiActual, 0);
  const measuredKpiTargetTotal = rows.reduce(
    (sum, row) => sum + (row.hasKpiTarget && row.hasKpiActual ? row.kpiTarget : 0),
    0
  );
  const measuredKpiActualTotal = rows.reduce(
    (sum, row) => sum + (row.hasKpiActual ? row.kpiActual : 0),
    0
  );
  const staffCount = rows.length;
  const paidStaffCount = rows.filter((row) => row.payrollDue > 0 && row.balance === 0).length;
  const partialStaffCount = rows.filter((row) => row.amountPaid > 0 && row.balance > 0).length;
  const unpaidStaffCount = rows.filter((row) => row.amountPaid === 0 && row.payrollDue > 0).length;
  const overdueStaffCount = rows.filter((row) => row.overdueRecordCount > 0).length;
  const targetSetCount = rows.filter((row) => row.hasKpiTarget).length;
  const measuredCount = rows.filter((row) => row.hasKpiActual).length;
  const metTargetCount = rows.filter((row) => row.hasKpiTarget && row.hasKpiActual && row.kpiActual >= row.kpiTarget).length;
  const underTargetCount = rows.filter((row) => row.hasKpiTarget && row.hasKpiActual && row.kpiActual < row.kpiTarget).length;
  const completionRate = payrollDue > 0 ? Number(((payrollPaid / payrollDue) * 100).toFixed(1)) : 0;
  const kpiAchievement =
    measuredKpiTargetTotal > 0
      ? Number(((measuredKpiActualTotal / measuredKpiTargetTotal) * 100).toFixed(1))
      : null;
  const averageNetDue = staffCount > 0 ? Number((payrollDue / staffCount).toFixed(2)) : 0;
  const averagePaid = staffCount > 0 ? Number((payrollPaid / staffCount).toFixed(2)) : 0;
  const topOutstanding = rows.find((row) => row.balance > 0) || rows[0] || null;
  const topKpiGap =
    [...rows]
      .filter((row) => row.hasKpiTarget && row.hasKpiActual)
      .sort((left, right) => left.targetVariance - right.targetVariance)[0] || null;

  return {
    rows,
    payrollDue: Number(payrollDue.toFixed(2)),
    payrollPaid: Number(payrollPaid.toFixed(2)),
    outstanding: Number(outstanding.toFixed(2)),
    kpiTargetTotal: Number(kpiTargetTotal.toFixed(2)),
    kpiActualTotal: Number(kpiActualTotal.toFixed(2)),
    measuredKpiTargetTotal: Number(measuredKpiTargetTotal.toFixed(2)),
    measuredKpiActualTotal: Number(measuredKpiActualTotal.toFixed(2)),
    staffCount,
    paidStaffCount,
    partialStaffCount,
    unpaidStaffCount,
    overdueStaffCount,
    targetSetCount,
    measuredCount,
    metTargetCount,
    underTargetCount,
    completionRate,
    kpiAchievement,
    averageNetDue,
    averagePaid,
    totalRecordCount: records.length,
    topOutstanding,
    topKpiGap
  };
}

function buildSalaryDraftFromForm(formData) {
  return {
    month: normalizeMonthInput(formData.get("salaryMonth")),
    businessAreaId: normalizeBusinessAreaId(formData.get("salaryBusinessArea")),
    staffName: normalizeText(formData.get("salaryStaffName")),
    roleTitle: normalizeText(formData.get("salaryRoleTitle")),
    salaryType: normalizeSalaryType(formData.get("salaryType")),
    grossAmount: parseOptionalAmount(formData.get("salaryGrossAmount")),
    deductionAmount: parseOptionalAmount(formData.get("salaryDeductionAmount")),
    amountPaid: parseOptionalAmount(formData.get("salaryAmountPaid")),
    dueDate: normalizeDateInput(formData.get("salaryDueDate")),
    paymentDate: normalizeDateInput(formData.get("salaryPaymentDate")),
    paymentMethod: normalizeText(formData.get("salaryPaymentMethod")),
    paymentReference: normalizeText(formData.get("salaryPaymentReference")),
    kpiMetric: normalizeText(formData.get("salaryKpiMetric")),
    kpiUnit: normalizeText(formData.get("salaryKpiUnit")),
    kpiTarget: parseOptionalAmountOrNull(formData.get("salaryKpiTarget")),
    kpiActual: parseOptionalAmountOrNull(formData.get("salaryKpiActual")),
    notes: normalizeText(formData.get("salaryNotes"))
  };
}

function validateSalaryRecord(record) {
  const errors = [];
  const hasKpiTarget = hasSalaryKpiTarget(record);
  const hasKpiActual = hasSalaryKpiActual(record);

  if (!record.month) {
    errors.push("Choose the payroll month for this salary record.");
  }

  if (!record.businessAreaId) {
    errors.push("Choose the business area for this salary record.");
  }

  if (!record.staffName) {
    errors.push("Add the staff or contractor name.");
  }

  if (!record.salaryType) {
    errors.push("Choose the salary type for this record.");
  }

  if (record.grossAmount <= 0) {
    errors.push("Enter a gross amount greater than zero.");
  }

  if (record.deductionAmount > record.grossAmount) {
    errors.push("Deductions cannot be greater than the gross amount.");
  }

  if (record.amountPaid > getSalaryNetDue(record)) {
    errors.push("Amount paid cannot be greater than the net salary due.");
  }

  if (!record.dueDate) {
    errors.push("Add the due date for this salary payment.");
  }

  if (record.amountPaid > 0 && !record.paymentMethod) {
    errors.push("Add the payment method used for the salary already paid.");
  }

  if (record.kpiTarget < 0 || record.kpiActual < 0) {
    errors.push("Staff KPI target and actual measurement cannot be negative.");
  }

  if ((hasKpiTarget || hasKpiActual || record.kpiUnit) && !record.kpiMetric) {
    errors.push("Add the staff KPI metric name before saving KPI target or measurement.");
  }

  return errors;
}

function getFilteredSalaryRecords() {
  const searchValue = normalizeText(state.salaryFilters.search).toLowerCase();
  const monthValue = normalizeMonthInput(state.salaryFilters.month);
  const areaValue = normalizeBusinessAreaId(state.salaryFilters.area);
  const typeValue = normalizeSalaryType(state.salaryFilters.type);
  const statusValue = normalizeText(state.salaryFilters.status).toLowerCase();

  return state.salaryRecords.filter((record) => {
    const haystack = [
      record.staffName,
      record.roleTitle,
      getSalaryTypeLabel(record.salaryType),
      getBusinessArea(record.businessAreaId).label,
      getBusinessArea(record.businessAreaId).shortLabel,
      record.kpiMetric,
      record.kpiUnit,
      record.paymentMethod,
      record.paymentReference,
      record.notes
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchValue === "" || haystack.includes(searchValue);
    const matchesMonth = monthValue === "" || record.month === monthValue;
    const matchesArea = areaValue === "" || record.businessAreaId === areaValue;
    const matchesType = typeValue === "" || record.salaryType === typeValue;
    const matchesStatus = statusValue === "" || getSalaryPaymentStatus(record).toLowerCase() === statusValue;

    return matchesSearch && matchesMonth && matchesArea && matchesType && matchesStatus;
  });
}

function handleSalarySubmit(event) {
  event.preventDefault();

  const draft = buildSalaryDraftFromForm(new FormData(event.target));
  const errors = validateSalaryRecord(draft);

  if (errors.length > 0) {
    showToast(errors[0]);
    return;
  }

  if (state.editingSalaryId) {
    state.salaryRecords = sortSalaryRecords(
      state.salaryRecords.map((record) =>
        record.id === state.editingSalaryId
          ? {
              ...record,
              ...draft,
              updatedAt: new Date().toISOString()
            }
          : record
      )
    );
    showToast("Salary record updated.");
  } else {
    state.salaryRecords = sortSalaryRecords([
      ...state.salaryRecords,
      {
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...draft
      }
    ]);
    showToast("Salary record saved.");
  }

  persistSalaryRecords();
  resetSalaryForm({ silent: true });
  render();
}

function handleSupplierSubmit(event) {
  event.preventDefault();

  const draft = buildSupplierDraftFromForm(new FormData(event.target));
  const errors = validateSupplierRecord(draft);

  if (errors.length > 0) {
    showToast(errors[0]);
    return;
  }

  if (state.editingSupplierId) {
    state.suppliers = sortSuppliers(
      state.suppliers.map((record) =>
        record.id === state.editingSupplierId
          ? {
              ...record,
              ...draft,
              updatedAt: new Date().toISOString()
            }
          : record
      )
    );
    showToast("Supplier record updated.");
  } else {
    state.suppliers = sortSuppliers([
      ...state.suppliers,
      {
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...draft
      }
    ]);
    showToast("Supplier record saved.");
  }

  persistSuppliers();
  resetSupplierForm({ silent: true });
  render();
}

function handleRecurringSubmit(event) {
  event.preventDefault();

  const draft = buildRecurringDraftFromForm(new FormData(event.target));
  const errors = validateRecurringControl(draft);

  if (errors.length > 0) {
    showToast(errors[0]);
    return;
  }

  if (state.editingRecurringId) {
    state.recurringControls = sortRecurringControls(
      state.recurringControls.map((record) =>
        record.id === state.editingRecurringId
          ? {
              ...record,
              ...draft,
              updatedAt: new Date().toISOString()
            }
          : record
      )
    );
    showToast("Recurring control updated.");
  } else {
    state.recurringControls = sortRecurringControls([
      ...state.recurringControls,
      {
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...draft
      }
    ]);
    showToast("Recurring control saved.");
  }

  persistRecurringControls();
  resetRecurringForm({ silent: true });
  render();
}

function handleMaintenanceSubmit(event) {
  event.preventDefault();

  const draft = buildMaintenanceDraftFromForm(new FormData(event.target));
  const errors = validateMaintenanceRecord(draft);

  if (errors.length > 0) {
    showToast(errors[0]);
    return;
  }

  if (state.editingMaintenanceId) {
    state.maintenanceRecords = sortMaintenanceRecords(
      state.maintenanceRecords.map((record) =>
        record.id === state.editingMaintenanceId
          ? {
              ...record,
              ...draft,
              updatedAt: new Date().toISOString()
            }
          : record
      )
    );
    showToast("Maintenance record updated.");
  } else {
    state.maintenanceRecords = sortMaintenanceRecords([
      ...state.maintenanceRecords,
      {
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...draft
      }
    ]);
    showToast("Maintenance record saved.");
  }

  persistMaintenanceRecords();
  resetMaintenanceForm({ silent: true });
  render();
}

function startEditingSalaryRecord(recordId) {
  const record = state.salaryRecords.find((item) => item.id === recordId);

  if (!record) {
    showToast("That salary record could not be found.");
    return;
  }

  state.editingSalaryId = record.id;
  navigateTo("salary", { syncHash: true });
  render();
  scrollDynamicFormIntoView("salaryForm");
}

function startEditingSupplier(recordId) {
  const record = state.suppliers.find((item) => item.id === recordId);

  if (!record) {
    showToast("That supplier record could not be found.");
    return;
  }

  state.editingSupplierId = record.id;
  navigateTo("suppliers", { syncHash: true });
  render();
  scrollDynamicFormIntoView("supplierForm");
}

function startEditingRecurringControl(recordId) {
  const record = state.recurringControls.find((item) => item.id === recordId);

  if (!record) {
    showToast("That recurring control could not be found.");
    return;
  }

  state.editingRecurringId = record.id;
  navigateTo("recurring", { syncHash: true });
  render();
  scrollDynamicFormIntoView("recurringForm");
}

function startEditingMaintenanceRecord(recordId) {
  const record = state.maintenanceRecords.find((item) => item.id === recordId);

  if (!record) {
    showToast("That maintenance record could not be found.");
    return;
  }

  state.editingMaintenanceId = record.id;
  navigateTo("maintenance", { syncHash: true });
  render();
  scrollDynamicFormIntoView("maintenanceForm");
}

function deleteSalaryRecord(recordId) {
  const record = state.salaryRecords.find((item) => item.id === recordId);

  if (!record) {
    showToast("That salary record could not be found.");
    return;
  }

  const shouldDelete = window.confirm(
    `Delete the salary record for ${record.staffName} in ${formatMonthLabel(record.month)}?`
  );

  if (!shouldDelete) {
    return;
  }

  state.salaryRecords = state.salaryRecords.filter((item) => item.id !== recordId);

  if (state.editingSalaryId === recordId) {
    state.editingSalaryId = null;
  }

  persistSalaryRecords();
  render();
  showToast("Salary record deleted.");
}

function buildPayslipReadyListMarkup() {
  if (state.payslipReadyFiles.length === 0) {
    return `<div class="empty-state">No payslips have been prepared in this session yet.</div>`;
  }

  return state.payslipReadyFiles
    .map(
      (file) => `
        <article class="agreement-ready-item">
          <strong>${escapeHtml(file.filename)}</strong>
          <span>${escapeHtml(file.staffName)}${file.roleTitle ? ` • ${escapeHtml(file.roleTitle)}` : ""}</span>
          <span class="module-meta">
            ${escapeHtml(formatMonthLabel(file.month))} • ${escapeHtml(file.statusLabel)} • Prepared ${escapeHtml(
              formatTimestampLabel(file.createdAt)
            )}
          </span>
          <div class="agreement-ready-actions">
            <a class="button button-secondary button-link" href="${escapeHtml(
              file.url
            )}" target="_blank" rel="noopener">
              Open Preview
            </a>
            <a class="button button-ghost button-link" href="${escapeHtml(file.url)}" download="${escapeHtml(
              file.filename
            )}">
              Download HTML
            </a>
          </div>
        </article>
      `
    )
    .join("");
}

function generateSalaryPayslipById(recordId) {
  const record = state.salaryRecords.find((item) => item.id === recordId);

  if (!record) {
    showToast("That salary record could not be found.");
    return false;
  }

  return generateSalaryPayslip(record);
}

function buildSalaryPayslipFilename(record) {
  return `${sanitizeFilenameSegment(record.staffName, "Staff")}_${sanitizeFilenameSegment(
    record.month,
    "Payroll"
  )}_Payslip.html`;
}

function buildSalaryPayslipBodyMarkup(record) {
  const businessArea = getBusinessArea(record.businessAreaId);
  const status = getSalaryStatusConfig(record);
  const grossAmount = parseOptionalAmount(record.grossAmount);
  const deductionAmount = parseOptionalAmount(record.deductionAmount);
  const netSalaryDue = getSalaryNetDue(record);
  const amountPaid = parseOptionalAmount(record.amountPaid);
  const balanceDue = getSalaryBalance(record);
  const generatedOn = formatDisplayDate(getTodayInputValue());

  return `
    <h1>OneRoot Salary Payslip</h1>
    <p class="muted">${escapeHtml(formatMonthLabel(record.month))} • Generated ${escapeHtml(generatedOn)}</p>
    <div class="summary-grid">
      <div class="summary-card">
        <strong>Staff</strong>
        <p>${escapeHtml(record.staffName)}</p>
        <p>${escapeHtml(record.roleTitle || "Role not saved")}</p>
      </div>
      <div class="summary-card">
        <strong>Business Area</strong>
        <p>${escapeHtml(businessArea.label)}</p>
        <p>${escapeHtml(getSalaryTypeLabel(record.salaryType))}</p>
      </div>
      <div class="summary-card">
        <strong>Payment Status</strong>
        <p>${escapeHtml(status.label)}</p>
        <p>${escapeHtml(status.meta)}</p>
      </div>
      <div class="summary-card">
        <strong>Payment Details</strong>
        <p>${escapeHtml(record.paymentMethod || "Payment method not saved")}</p>
        <p>${escapeHtml(record.paymentReference || "Reference not saved")}</p>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Payroll Item</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Gross Amount</td><td>${escapeHtml(formatCurrency(grossAmount))}</td></tr>
        <tr><td>Deductions</td><td>${escapeHtml(formatCurrency(deductionAmount))}</td></tr>
        <tr><td>Net Salary Due</td><td>${escapeHtml(formatCurrency(netSalaryDue))}</td></tr>
        <tr><td>Amount Paid</td><td>${escapeHtml(formatCurrency(amountPaid))}</td></tr>
        <tr><td>Balance Due</td><td>${escapeHtml(formatCurrency(balanceDue))}</td></tr>
      </tbody>
    </table>
    <div class="summary-grid">
      <div class="summary-card">
        <strong>Payroll Dates</strong>
        <p>Due Date: ${escapeHtml(formatOptionalDate(record.dueDate))}</p>
        <p>Payment Date: ${escapeHtml(formatOptionalDate(record.paymentDate))}</p>
      </div>
      <div class="summary-card">
        <strong>Notes</strong>
        <p>${escapeHtml(record.notes || "No additional payroll notes were saved for this record.")}</p>
      </div>
    </div>
    <p class="muted">Prepared from the OneRoot Operations App payroll register. Use your browser print option to save this payslip as PDF or print it.</p>
  `;
}

function rememberPayslipReadyFile(record, filename, fileUrl) {
  const nextFile = {
    id: generateId(),
    recordId: normalizeText(record.id),
    staffName: normalizeText(record.staffName),
    roleTitle: normalizeText(record.roleTitle),
    month: normalizeMonthInput(record.month),
    statusLabel: getSalaryPaymentStatus(record),
    filename,
    url: fileUrl,
    createdAt: new Date().toISOString()
  };

  const retainedFiles = [];

  state.payslipReadyFiles.forEach((file) => {
    const sameIdentity =
      (file.recordId && file.recordId === nextFile.recordId) ||
      (!file.recordId &&
        file.month === nextFile.month &&
        normalizeText(file.staffName).toLowerCase() === normalizeText(nextFile.staffName).toLowerCase());

    if (!sameIdentity) {
      retainedFiles.push(file);
      return;
    }

    try {
      URL.revokeObjectURL(file.url);
    } catch (error) {
      console.error(error);
    }
  });

  const nextFiles = [nextFile, ...retainedFiles].slice(0, PAYSLIP_READY_FILE_LIMIT);

  retainedFiles.slice(PAYSLIP_READY_FILE_LIMIT - 1).forEach((file) => {
    try {
      URL.revokeObjectURL(file.url);
    } catch (error) {
      console.error(error);
    }
  });

  state.payslipReadyFiles = nextFiles;
}

function generateSalaryPayslip(record) {
  if (!normalizeMonthInput(record.month)) {
    showToast("Add the payroll month first, then prepare the payslip.");
    return false;
  }

  if (!normalizeText(record.staffName)) {
    showToast("Add the staff name first, then prepare the payslip.");
    return false;
  }

  if (getSalaryNetDue(record) <= 0) {
    showToast("Add a valid salary amount before preparing the payslip.");
    return false;
  }

  const title = `OneRoot Payslip - ${record.staffName} - ${formatMonthLabel(record.month)}`;
  const bodyMarkup = buildSalaryPayslipBodyMarkup(record);
  const fileUrl = URL.createObjectURL(
    new Blob([buildPrintDocumentMarkup(title, bodyMarkup)], {
      type: "text/html;charset=utf-8;"
    })
  );
  const filename = buildSalaryPayslipFilename(record);

  rememberPayslipReadyFile(record, filename, fileUrl);
  render();

  showToast("Payslip prepared. Open it from Ready Payslips to print or save PDF.");

  return true;
}

function deleteSupplierRecord(recordId) {
  const record = state.suppliers.find((item) => item.id === recordId);

  if (!record) {
    showToast("That supplier record could not be found.");
    return;
  }

  const shouldDelete = window.confirm(
    `Delete the supplier record for ${record.supplierName} on ${formatDisplayDate(record.invoiceDate)}?`
  );

  if (!shouldDelete) {
    return;
  }

  state.suppliers = state.suppliers.filter((item) => item.id !== recordId);
  persistSuppliers();

  if (state.editingSupplierId === recordId) {
    resetSupplierForm({ silent: true });
  }

  render();
  showToast("Supplier record deleted.");
}

function deleteRecurringControl(recordId) {
  const record = state.recurringControls.find((item) => item.id === recordId);

  if (!record) {
    showToast("That recurring control could not be found.");
    return;
  }

  const shouldDelete = window.confirm(`Delete the recurring control "${record.title}"?`);

  if (!shouldDelete) {
    return;
  }

  state.recurringControls = state.recurringControls.filter((item) => item.id !== recordId);
  persistRecurringControls();

  if (state.editingRecurringId === recordId) {
    resetRecurringForm({ silent: true });
  }

  render();
  showToast("Recurring control deleted.");
}

function deleteMaintenanceRecord(recordId) {
  const record = state.maintenanceRecords.find((item) => item.id === recordId);

  if (!record) {
    showToast("That maintenance record could not be found.");
    return;
  }

  const shouldDelete = window.confirm(
    `Delete the maintenance record for ${record.issue} in ${record.location || "this location"}?`
  );

  if (!shouldDelete) {
    return;
  }

  state.maintenanceRecords = state.maintenanceRecords.filter((item) => item.id !== recordId);
  persistMaintenanceRecords();

  if (state.editingMaintenanceId === recordId) {
    resetMaintenanceForm({ silent: true });
  }

  render();
  showToast("Maintenance record deleted.");
}

function resetSalaryForm(options = {}) {
  state.editingSalaryId = null;

  if (!options.silent) {
    render();
    showToast("Salary form cleared.");
  }
}

function resetSupplierForm(options = {}) {
  state.editingSupplierId = null;

  if (!options.silent) {
    render();
    showToast("Supplier form cleared.");
  }
}

function resetRecurringForm(options = {}) {
  state.editingRecurringId = null;

  if (!options.silent) {
    render();
    showToast("Recurring form cleared.");
  }
}

function resetMaintenanceForm(options = {}) {
  state.editingMaintenanceId = null;

  if (!options.silent) {
    render();
    showToast("Maintenance form cleared.");
  }
}

function buildSupplierDraftFromForm(formData) {
  return {
    invoiceDate: normalizeDateInput(formData.get("supplierInvoiceDate")),
    businessAreaId: normalizeBusinessAreaId(formData.get("supplierBusinessArea")),
    supplierName: normalizeText(formData.get("supplierName")),
    category: sanitizeAreaChoice(
      normalizeBusinessAreaId(formData.get("supplierBusinessArea")),
      formData.get("supplierCategory")
    ),
    itemDescription: normalizeText(formData.get("supplierItemDescription")),
    invoiceReference: normalizeText(formData.get("supplierInvoiceReference")),
    amountDue: parseOptionalAmount(formData.get("supplierAmountDue")),
    amountPaid: parseOptionalAmount(formData.get("supplierAmountPaid")),
    dueDate: normalizeDateInput(formData.get("supplierDueDate")),
    paymentDate: normalizeDateInput(formData.get("supplierPaymentDate")),
    paymentMethod: normalizeText(formData.get("supplierPaymentMethod")),
    notes: normalizeText(formData.get("supplierNotes"))
  };
}

function buildRecurringDraftFromForm(formData) {
  const moduleType = normalizeRecurringModuleType(formData.get("recurringModuleType"));
  const businessAreaId = normalizeBusinessAreaId(formData.get("recurringBusinessArea"));

  return {
    title: normalizeText(formData.get("recurringTitle")),
    moduleType,
    businessAreaId: moduleType === "apartment-bill" ? "rentals-apartments" : businessAreaId,
    category:
      moduleType === "expense" || moduleType === "supplier-bill"
        ? sanitizeAreaChoice(businessAreaId, formData.get("recurringCategory"))
        : "",
    counterparty: normalizeText(formData.get("recurringCounterparty")),
    suite: normalizeText(formData.get("recurringSuite")),
    amount: parseOptionalAmount(formData.get("recurringAmount")),
    frequency: normalizeRecurringFrequency(formData.get("recurringFrequency")),
    startDate: normalizeDateInput(formData.get("recurringStartDate")),
    nextDueDate: normalizeDateInput(formData.get("recurringNextDueDate")),
    lastGeneratedDate: normalizeDateInput(formData.get("recurringLastGeneratedDate")),
    priority:
      moduleType === "maintenance-task"
        ? normalizeMaintenancePriority(formData.get("recurringPriority"))
        : "",
    active: normalizeText(formData.get("recurringActiveState")).toLowerCase() !== "paused",
    notes: normalizeText(formData.get("recurringNotes"))
  };
}

function buildMaintenanceDraftFromForm(formData) {
  return {
    reportedDate: normalizeDateInput(formData.get("maintenanceReportedDate")),
    businessAreaId: normalizeBusinessAreaId(formData.get("maintenanceBusinessArea")),
    location: normalizeText(formData.get("maintenanceLocation")),
    assetItem: normalizeText(formData.get("maintenanceAssetItem")),
    issue: normalizeText(formData.get("maintenanceIssue")),
    priority: normalizeMaintenancePriority(formData.get("maintenancePriority")),
    status: normalizeMaintenanceStatus(formData.get("maintenanceStatus")),
    dueDate: normalizeDateInput(formData.get("maintenanceDueDate")),
    estimatedCost: parseOptionalAmount(formData.get("maintenanceEstimatedCost")),
    actualCost: parseOptionalAmount(formData.get("maintenanceActualCost")),
    vendor: normalizeText(formData.get("maintenanceVendor")),
    notes: normalizeText(formData.get("maintenanceNotes"))
  };
}

function validateSupplierRecord(record) {
  const errors = [];

  if (!record.invoiceDate) {
    errors.push("Add a valid invoice date for this supplier record.");
  }

  if (!record.businessAreaId) {
    errors.push("Choose the business area for this supplier record.");
  }

  if (!record.supplierName) {
    errors.push("Add the supplier name.");
  }

  if (!Number.isFinite(record.amountDue) || record.amountDue <= 0) {
    errors.push("Enter an amount due greater than zero.");
  }

  if (record.amountPaid > record.amountDue && record.amountDue > 0) {
    errors.push("Amount paid cannot be greater than the amount due.");
  }

  return errors;
}

function validateRecurringControl(record) {
  const errors = [];

  if (!record.title) {
    errors.push("Add a name for this recurring control.");
  }

  if (!record.moduleType) {
    errors.push("Choose which module this recurring control should generate into.");
  }

  if (!record.businessAreaId) {
    errors.push("Choose the business area for this recurring control.");
  }

  if (!record.frequency) {
    errors.push("Choose how often this recurring control should run.");
  }

  if (!record.nextDueDate) {
    errors.push("Add the next due date for this recurring control.");
  }

  if (record.moduleType === "apartment-bill" && !record.suite) {
    errors.push("Add the suite or apartment name for the recurring apartment bill.");
  }

  if (["expense", "supplier-bill"].includes(record.moduleType) && record.amount <= 0) {
    errors.push("Enter an amount greater than zero for this recurring control.");
  }

  if (record.moduleType === "supplier-bill" && !record.counterparty) {
    errors.push("Add the supplier name for the recurring supplier bill.");
  }

  if (record.moduleType === "maintenance-task" && !record.priority) {
    errors.push("Choose the maintenance priority for this recurring task.");
  }

  return errors;
}

function validateMaintenanceRecord(record) {
  const errors = [];

  if (!record.reportedDate) {
    errors.push("Add a valid reported date for this maintenance record.");
  }

  if (!record.businessAreaId) {
    errors.push("Choose the business area for this maintenance record.");
  }

  if (!record.issue) {
    errors.push("Describe the issue or task that needs attention.");
  }

  if (!record.priority) {
    errors.push("Choose the maintenance priority.");
  }

  if (!record.status) {
    errors.push("Choose the maintenance status.");
  }

  if (record.actualCost > 0 && record.estimatedCost > 0 && record.actualCost > record.estimatedCost * 10) {
    errors.push("Check the actual cost value before saving this maintenance record.");
  }

  return errors;
}

function getFilteredSuppliers() {
  const searchValue = normalizeText(state.supplierFilters.search).toLowerCase();
  const monthValue = normalizeMonthInput(state.supplierFilters.month);
  const areaValue = normalizeBusinessAreaId(state.supplierFilters.area);
  const statusValue = normalizeText(state.supplierFilters.status).toLowerCase();

  return state.suppliers.filter((record) => {
    const haystack = [
      record.supplierName,
      record.invoiceReference,
      record.itemDescription,
      record.notes,
      getBusinessArea(record.businessAreaId).label,
      record.category
    ]
      .join(" ")
      .toLowerCase();
    const status = getSupplierPaymentStatus(record).toLowerCase().replace(/\s+/g, "-");

    return (
      (searchValue === "" || haystack.includes(searchValue)) &&
      (monthValue === "" || record.invoiceDate.startsWith(monthValue)) &&
      (areaValue === "" || record.businessAreaId === areaValue) &&
      (statusValue === "" || status === statusValue)
    );
  });
}

function getFilteredRecurringControls() {
  const searchValue = normalizeText(state.recurringFilters.search).toLowerCase();
  const moduleTypeValue = normalizeRecurringModuleType(state.recurringFilters.moduleType);
  const statusValue = normalizeText(state.recurringFilters.status).toLowerCase();

  return state.recurringControls.filter((record) => {
    const haystack = [
      record.title,
      record.counterparty,
      record.suite,
      record.notes,
      getBusinessArea(record.businessAreaId).label
    ]
      .join(" ")
      .toLowerCase();
    const status = getRecurringStatusKey(record);

    return (
      (searchValue === "" || haystack.includes(searchValue)) &&
      (moduleTypeValue === "" || record.moduleType === moduleTypeValue) &&
      (statusValue === "" || status === statusValue)
    );
  });
}

function getFilteredMaintenanceRecords() {
  const searchValue = normalizeText(state.maintenanceFilters.search).toLowerCase();
  const areaValue = normalizeBusinessAreaId(state.maintenanceFilters.area);
  const statusValue = normalizeMaintenanceStatus(state.maintenanceFilters.status).toLowerCase();
  const priorityValue = normalizeMaintenancePriority(state.maintenanceFilters.priority).toLowerCase();

  return state.maintenanceRecords.filter((record) => {
    const haystack = [
      record.location,
      record.assetItem,
      record.issue,
      record.vendor,
      record.notes,
      getBusinessArea(record.businessAreaId).label
    ]
      .join(" ")
      .toLowerCase();

    return (
      (searchValue === "" || haystack.includes(searchValue)) &&
      (areaValue === "" || record.businessAreaId === areaValue) &&
      (statusValue === "" || record.status.toLowerCase() === statusValue) &&
      (priorityValue === "" || record.priority.toLowerCase() === priorityValue)
    );
  });
}

function createEmptySupplierDraft() {
  return {
    invoiceDate: getTodayInputValue(),
    businessAreaId: DEFAULT_BUSINESS_AREA_ID,
    supplierName: "",
    category: "",
    itemDescription: "",
    invoiceReference: "",
    amountDue: 0,
    amountPaid: 0,
    dueDate: "",
    paymentDate: "",
    paymentMethod: "",
    notes: ""
  };
}

function createEmptyRecurringDraft() {
  return {
    title: "",
    moduleType: "expense",
    businessAreaId: DEFAULT_BUSINESS_AREA_ID,
    category: "",
    counterparty: "",
    suite: "",
    amount: 0,
    frequency: "monthly",
    startDate: getTodayInputValue(),
    nextDueDate: getTodayInputValue(),
    lastGeneratedDate: "",
    priority: "Medium",
    active: true,
    notes: ""
  };
}

function createEmptyMaintenanceDraft() {
  return {
    reportedDate: getTodayInputValue(),
    businessAreaId: DEFAULT_BUSINESS_AREA_ID,
    location: "",
    assetItem: "",
    issue: "",
    priority: "Medium",
    status: "Open",
    dueDate: "",
    estimatedCost: 0,
    actualCost: 0,
    vendor: "",
    notes: ""
  };
}

function buildSelectMarkup(options, selectedValue = "", placeholderLabel = "Choose option") {
  const normalizedOptions = options.map((option) =>
    typeof option === "string" ? { value: option, label: option } : option
  );

  return [
    `<option value="">${escapeHtml(placeholderLabel)}</option>`,
    ...normalizedOptions.map(
      (option) => `
        <option value="${escapeHtml(option.value)}" ${
          normalizeText(option.value).toLowerCase() === normalizeText(selectedValue).toLowerCase()
            ? "selected"
            : ""
        }>
          ${escapeHtml(option.label)}
        </option>
      `
    )
  ].join("");
}

function formatAmountInputValue(value) {
  return Number.isFinite(Number(value)) && Number(value) > 0 ? String(Number(value)) : "";
}

function scrollDynamicFormIntoView(formId) {
  window.requestAnimationFrame(() => {
    document.getElementById(formId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function getSupplierOutstanding(record) {
  return Number(
    Math.max(parseOptionalAmount(record.amountDue) - parseOptionalAmount(record.amountPaid), 0).toFixed(2)
  );
}

function getSupplierPaymentStatus(record) {
  const outstanding = getSupplierOutstanding(record);

  if (parseOptionalAmount(record.amountDue) > 0 && outstanding === 0) {
    return "Paid";
  }

  if (parseOptionalAmount(record.amountPaid) > 0) {
    return "Part Paid";
  }

  if (record.dueDate && daysUntilDate(record.dueDate) < 0) {
    return "Overdue";
  }

  return "Due";
}

function getSupplierStatusConfig(record) {
  const status = getSupplierPaymentStatus(record);

  if (status === "Paid") {
    return {
      label: "Paid",
      pillClass: "alert-pill-on-track",
      meta: record.paymentDate
        ? `Paid on ${formatDisplayDate(record.paymentDate)}`
        : "Fully settled"
    };
  }

  if (status === "Overdue") {
    return {
      label: "Overdue",
      pillClass: "alert-pill-overdue",
      meta: record.dueDate
        ? `Balance overdue since ${formatDisplayDate(record.dueDate)}`
        : "Balance overdue"
    };
  }

  if (status === "Part Paid") {
    return {
      label: "Part Paid",
      pillClass: "alert-pill-due",
      meta: `${formatCurrency(getSupplierOutstanding(record))} still outstanding`
    };
  }

  return {
    label: "Due",
    pillClass: "alert-pill-due",
    meta: record.dueDate ? `Due ${formatDisplayDate(record.dueDate)}` : "Awaiting payment"
  };
}

function normalizeRecurringModuleType(value) {
  const normalized = normalizeText(value).toLowerCase();
  const matchedOption = RECURRING_MODULE_OPTIONS.find(
    (option) => option.value === normalized || option.label.toLowerCase() === normalized
  );
  return matchedOption ? matchedOption.value : "";
}

function normalizeRecurringFrequency(value) {
  const normalized = normalizeText(value).toLowerCase();
  const matchedOption = RECURRING_FREQUENCY_OPTIONS.find(
    (option) => option.value === normalized || option.label.toLowerCase() === normalized
  );
  return matchedOption ? matchedOption.value : "";
}

function getRecurringModuleLabel(moduleType) {
  return (
    RECURRING_MODULE_OPTIONS.find((option) => option.value === moduleType)?.label ||
    normalizeText(moduleType) ||
    "Recurring"
  );
}

function getRecurringFrequencyLabel(frequency) {
  return (
    RECURRING_FREQUENCY_OPTIONS.find((option) => option.value === frequency)?.label ||
    normalizeText(frequency) ||
    "Custom"
  );
}

function getRecurringFrequencyMonths(frequency) {
  return RECURRING_FREQUENCY_OPTIONS.find((option) => option.value === frequency)?.months || 0;
}

function getRecurringContextNote(moduleType) {
  switch (moduleType) {
    case "supplier-bill":
      return "Supplier Bill creates a new supplier payable record on the due date and moves the next due date forward by the selected frequency.";
    case "maintenance-task":
      return "Maintenance Task creates a new maintenance log entry when the control runs. Use the suite/location and priority fields for the work order details.";
    case "apartment-bill":
      return "Apartment Bill uses the latest saved suite profile to generate the next apartment month, including any monthly bills and rent cycle logic already stored for that suite.";
    default:
      return "Expense creates a new expense register entry when the control runs. Use this for predictable operating costs you want to post on schedule.";
  }
}

function getRecurringStatusKey(record) {
  if (!record.active) {
    return "paused";
  }

  const daysRemaining = daysUntilDate(record.nextDueDate);

  if (Number.isFinite(daysRemaining) && daysRemaining < 0) {
    return "overdue";
  }

  if (Number.isFinite(daysRemaining) && daysRemaining <= 7) {
    return "due-soon";
  }

  return "scheduled";
}

function getRecurringStatusConfig(record) {
  const statusKey = getRecurringStatusKey(record);

  if (statusKey === "paused") {
    return {
      label: "Paused",
      pillClass: "status-tag-vacant",
      meta: "Control will not generate until reactivated."
    };
  }

  if (statusKey === "overdue") {
    return {
      label: "Overdue",
      pillClass: "alert-pill-overdue",
      meta: record.nextDueDate
        ? `Was due ${formatDisplayDate(record.nextDueDate)}`
        : "Due date is overdue"
    };
  }

  if (statusKey === "due-soon") {
    return {
      label: isRecurringDue(record) ? "Due Now" : "Due Soon",
      pillClass: "alert-pill-due",
      meta: record.nextDueDate ? `Due ${formatDisplayDate(record.nextDueDate)}` : "Due soon"
    };
  }

  return {
    label: "Scheduled",
    pillClass: "alert-pill-on-track",
    meta: record.nextDueDate ? `Next run ${formatDisplayDate(record.nextDueDate)}` : "No next due date"
  };
}

function isRecurringDue(record) {
  if (!record?.active || !record?.nextDueDate) {
    return false;
  }

  const daysRemaining = daysUntilDate(record.nextDueDate);
  return Number.isFinite(daysRemaining) && daysRemaining <= 0;
}

function isRecurringDueSoon(record) {
  if (!record?.active || !record?.nextDueDate) {
    return false;
  }

  const daysRemaining = daysUntilDate(record.nextDueDate);
  return Number.isFinite(daysRemaining) && daysRemaining >= 1 && daysRemaining <= 7;
}

function updateRecurringFormContextNote() {
  const typeSelect = document.getElementById("recurringModuleType");
  const note = document.querySelector("#recurringContextNote p");

  if (!typeSelect || !note) {
    return;
  }

  const moduleType = normalizeRecurringModuleType(typeSelect.value) || "expense";
  note.textContent = getRecurringContextNote(moduleType);

  const categoryLabel = document.getElementById("recurringCategory")?.closest("label");
  const counterpartyLabel = document.getElementById("recurringCounterparty")?.closest("label");
  const suiteLabel = document.getElementById("recurringSuite")?.closest("label");
  const priorityLabel = document.getElementById("recurringPriority")?.closest("label");

  toggleFieldVisibility(categoryLabel, ["expense", "supplier-bill"].includes(moduleType));
  toggleFieldVisibility(counterpartyLabel, moduleType !== "apartment-bill");
  toggleFieldVisibility(suiteLabel, ["maintenance-task", "apartment-bill"].includes(moduleType));
  toggleFieldVisibility(priorityLabel, moduleType === "maintenance-task");
}

function toggleFieldVisibility(labelNode, isVisible) {
  if (!labelNode) {
    return;
  }

  labelNode.classList.toggle("hidden", !isVisible);
  const control = labelNode.querySelector("input, select, textarea");

  if (control) {
    control.disabled = !isVisible;
  }
}

function runRecurringControlById(recordId) {
  const control = state.recurringControls.find((item) => item.id === recordId);

  if (!control) {
    showToast("That recurring control could not be found.");
    return;
  }

  const result = runRecurringControl(control);

  if (result.changed) {
    persistAllData();
    render();
  }

  showToast(result.message);
}

function runDueRecurringControls() {
  const dueControls = state.recurringControls.filter((record) => isRecurringDue(record));

  if (dueControls.length === 0) {
    showToast("No recurring controls are due right now.");
    return;
  }

  let createdCount = 0;
  let skippedCount = 0;

  dueControls.forEach((control) => {
    const result = runRecurringControl(control, { silent: true });

    if (result.created) {
      createdCount += 1;
    }

    if (!result.created) {
      skippedCount += 1;
    }
  });

  persistAllData();
  render();
  showToast(
    skippedCount === 0
      ? `${createdCount} recurring control${createdCount === 1 ? "" : "s"} ran successfully.`
      : `${createdCount} recurring control${createdCount === 1 ? "" : "s"} ran and ${skippedCount} were skipped.`
  );
}

function runRecurringControl(control, options = {}) {
  if (!control.active) {
    return {
      created: false,
      changed: false,
      message: options.silent ? "" : "This recurring control is paused."
    };
  }

  if (!control.nextDueDate) {
    return {
      created: false,
      changed: false,
      message: options.silent ? "" : "This recurring control does not have a next due date."
    };
  }

  const now = new Date().toISOString();
  let created = false;

  if (control.moduleType === "expense") {
    if (findExistingRecurringExpense(control)) {
      return {
        created: false,
        changed: false,
        message: options.silent ? "" : "That recurring expense already exists for the current due date."
      };
    }

    state.expenses = sortExpenses([
      ...state.expenses,
      {
        id: generateId(),
        reference: buildReference(control.nextDueDate),
        createdAt: now,
        updatedAt: now,
        businessAreaId: control.businessAreaId,
        date: control.nextDueDate,
        vendor: control.counterparty || control.title,
        category: control.category || OTHER_CUSTOM_OPTION,
        description: control.title,
        paymentMethod: "Bank Transfer",
        receiptStatus: "Pending",
        amount: control.amount,
        notes: normalizeText(`Generated from recurring control: ${control.title}${control.notes ? ` • ${control.notes}` : ""}`),
        linkedPettyCashId: "",
        generatedByRecurringId: control.id
      }
    ]);
    created = true;
  }

  if (control.moduleType === "supplier-bill") {
    if (findExistingRecurringSupplierBill(control)) {
      return {
        created: false,
        changed: false,
        message: options.silent ? "" : "That recurring supplier bill already exists for the current due date."
      };
    }

    state.suppliers = sortSuppliers([
      ...state.suppliers,
      {
        id: generateId(),
        createdAt: now,
        updatedAt: now,
        invoiceDate: control.nextDueDate,
        businessAreaId: control.businessAreaId,
        supplierName: control.counterparty || control.title,
        category: control.category || OTHER_CUSTOM_OPTION,
        itemDescription: control.title,
        invoiceReference: `REC-${control.nextDueDate.replaceAll("-", "")}`,
        amountDue: control.amount,
        amountPaid: 0,
        dueDate: control.nextDueDate,
        paymentDate: "",
        paymentMethod: "",
        notes: normalizeText(`Generated from recurring control: ${control.title}${control.notes ? ` • ${control.notes}` : ""}`),
        generatedByRecurringId: control.id
      }
    ]);
    created = true;
  }

  if (control.moduleType === "maintenance-task") {
    if (findExistingRecurringMaintenanceTask(control)) {
      return {
        created: false,
        changed: false,
        message: options.silent ? "" : "That recurring maintenance task already exists for the current due date."
      };
    }

    state.maintenanceRecords = sortMaintenanceRecords([
      ...state.maintenanceRecords,
      {
        id: generateId(),
        createdAt: now,
        updatedAt: now,
        reportedDate: control.nextDueDate,
        businessAreaId: control.businessAreaId,
        location: control.suite,
        assetItem: control.title,
        issue: normalizeText(`Generated recurring maintenance task${control.notes ? `: ${control.notes}` : ""}`),
        priority: control.priority || "Medium",
        status: "Open",
        dueDate: control.nextDueDate,
        estimatedCost: control.amount,
        actualCost: 0,
        vendor: control.counterparty,
        notes: normalizeText(`Generated from recurring control: ${control.title}`),
        generatedByRecurringId: control.id
      }
    ]);
    created = true;
  }

  if (control.moduleType === "apartment-bill") {
    const targetMonth = control.nextDueDate.slice(0, 7);
    const profile = getLatestRentalRecordForSuite(control.suite);

    if (!profile) {
      return {
        created: false,
        changed: false,
        message: options.silent ? "" : "Save at least one apartment record for that suite before running the recurring apartment bill."
      };
    }

    if (state.rentals.some((record) => record.suite === normalizeSuite(control.suite) && record.month === targetMonth)) {
      return {
        created: false,
        changed: false,
        message: options.silent ? "" : "That apartment month already exists for the current due date."
      };
    }

    const generatedRecord = buildGeneratedRentalRecord(profile, targetMonth);

    if (!generatedRecord) {
      return {
        created: false,
        changed: false,
        message: options.silent ? "" : "The apartment month could not be generated from the saved suite profile."
      };
    }

    state.rentals = sortRentals([...state.rentals, generatedRecord]);
    created = true;
  }

  if (!created) {
    return {
      created: false,
      changed: false,
      message: options.silent ? "" : "This recurring control could not generate a record."
    };
  }

  const nextDueDate = shiftDateByMonths(control.nextDueDate, getRecurringFrequencyMonths(control.frequency));

  state.recurringControls = sortRecurringControls(
    state.recurringControls.map((record) =>
      record.id === control.id
        ? {
            ...record,
            lastGeneratedDate: control.nextDueDate,
            nextDueDate: nextDueDate || control.nextDueDate,
            updatedAt: now
          }
        : record
    )
  );

  return {
    created: true,
    changed: true,
    message: options.silent ? "" : `${control.title} was generated and moved to the next cycle.`
  };
}

function findExistingRecurringExpense(control) {
  return state.expenses.find(
    (record) =>
      (record.generatedByRecurringId === control.id && record.date === control.nextDueDate) ||
      (record.date === control.nextDueDate &&
        record.businessAreaId === control.businessAreaId &&
        Math.abs(record.amount - control.amount) < 0.01 &&
        normalizeText(record.vendor).toLowerCase() === normalizeText(control.counterparty || control.title).toLowerCase())
  );
}

function findExistingRecurringSupplierBill(control) {
  return state.suppliers.find(
    (record) =>
      (record.generatedByRecurringId === control.id && record.invoiceDate === control.nextDueDate) ||
      (record.invoiceDate === control.nextDueDate &&
        record.businessAreaId === control.businessAreaId &&
        Math.abs(record.amountDue - control.amount) < 0.01 &&
        normalizeText(record.supplierName).toLowerCase() === normalizeText(control.counterparty || control.title).toLowerCase())
  );
}

function findExistingRecurringMaintenanceTask(control) {
  return state.maintenanceRecords.find(
    (record) =>
      (record.generatedByRecurringId === control.id && record.reportedDate === control.nextDueDate) ||
      (record.reportedDate === control.nextDueDate &&
        record.businessAreaId === control.businessAreaId &&
        normalizeText(record.location).toLowerCase() === normalizeText(control.suite).toLowerCase() &&
        normalizeText(record.assetItem).toLowerCase() === normalizeText(control.title).toLowerCase())
  );
}

function normalizeMaintenancePriority(value) {
  const normalized = normalizeText(value).toLowerCase();
  const matched = MAINTENANCE_PRIORITY_OPTIONS.find(
    (option) => option.toLowerCase() === normalized
  );
  return matched || "";
}

function normalizeMaintenanceStatus(value) {
  const normalized = normalizeText(value).toLowerCase();
  const matched = MAINTENANCE_STATUS_OPTIONS.find((option) => option.toLowerCase() === normalized);
  return matched || "";
}

function isMaintenanceOverdue(record) {
  return Boolean(
    record?.dueDate &&
      record.status !== "Completed" &&
      Number.isFinite(daysUntilDate(record.dueDate)) &&
      daysUntilDate(record.dueDate) < 0
  );
}

function getMaintenanceStatusConfig(record) {
  if (record.status === "Completed") {
    return { label: "Completed", pillClass: "alert-pill-on-track" };
  }

  if (isMaintenanceOverdue(record)) {
    return { label: "Overdue", pillClass: "alert-pill-overdue" };
  }

  if (record.status === "In Progress") {
    return { label: "In Progress", pillClass: "alert-pill-due" };
  }

  if (record.status === "Scheduled") {
    return { label: "Scheduled", pillClass: "status-tag-reserved" };
  }

  return { label: "Open", pillClass: "status-tag-occupied" };
}

function getMaintenancePriorityPillClass(priority) {
  if (priority === "Critical" || priority === "High") {
    return "alert-pill-overdue";
  }

  if (priority === "Medium") {
    return "alert-pill-due";
  }

  return "alert-pill-on-track";
}

function handleExpenseSubmit(event) {
  event.preventDefault();

  const formData = new FormData(elements.expenseForm);
  const businessAreaId = normalizeBusinessAreaId(formData.get("businessArea"));
  const draft = {
    businessAreaId,
    date: normalizeDateInput(formData.get("expenseDate")),
    vendor: normalizeText(formData.get("vendor")),
    category: businessAreaId
      ? sanitizeAreaChoice(businessAreaId, formData.get("category"))
      : "",
    description: normalizeText(formData.get("description")),
    paymentMethod: normalizeText(formData.get("paymentMethod")),
    receiptStatus: normalizeReceiptStatus(formData.get("receiptStatus")),
    amount: parseAmount(formData.get("amount")),
    notes: normalizeText(formData.get("notes"))
  };

  const errors = validateExpense(draft);

  if (errors.length > 0) {
    showToast(errors[0]);
    return;
  }

  if (state.editingExpenseId) {
    state.expenses = sortExpenses(
      state.expenses.map((expense) =>
        expense.id === state.editingExpenseId
          ? {
              ...expense,
              ...draft,
              updatedAt: new Date().toISOString()
            }
          : expense
      )
    );
    showToast("Expense updated.");
  } else {
    state.expenses = sortExpenses([
      ...state.expenses,
      {
        id: generateId(),
        reference: buildReference(draft.date),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        linkedPettyCashId: "",
        ...draft
      }
    ]);
    showToast("Expense saved.");
  }

  persistExpenses();
  resetExpenseForm({ silent: true });
  render();
}

function validateExpense(expense) {
  const errors = [];

  if (!expense.date) {
    errors.push("Add a valid date for this expense.");
  }

  if (!expense.businessAreaId) {
    errors.push("Choose the OneRoot business area for this expense.");
  }

  if (!expense.vendor) {
    errors.push("Add the vendor or payee name.");
  }

  if (!expense.category) {
    errors.push("Choose the expense type from the menu.");
  }

  if (!Number.isFinite(expense.amount) || expense.amount <= 0) {
    errors.push("Enter an amount greater than zero.");
  }

  if (!expense.paymentMethod) {
    errors.push("Add the payment method used.");
  }

  return errors;
}

function handleSalesSubmit(event) {
  event.preventDefault();

  const formData = new FormData(elements.salesForm);
  const draft = {
    date: normalizeDateInput(formData.get("salesDate")),
    businessAreaId: normalizeBusinessAreaId(formData.get("salesArea")),
    amount: parseAmount(formData.get("salesAmount")),
    notes: normalizeText(formData.get("salesNotes"))
  };

  const errors = validateSales(draft);

  if (errors.length > 0) {
    showToast(errors[0]);
    return;
  }

  if (state.editingSalesId) {
    state.sales = sortSales(
      state.sales.map((sale) =>
        sale.id === state.editingSalesId
          ? {
              ...sale,
              ...draft,
              updatedAt: new Date().toISOString()
            }
          : sale
      )
    );
    showToast("Daily sales updated.");
  } else {
    state.sales = sortSales([
      ...state.sales,
      {
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...draft
      }
    ]);
    showToast("Daily sales saved.");
  }

  persistSales();
  resetSalesForm({ silent: true });
  render();
}

function validateSales(sale) {
  const errors = [];

  if (!sale.date) {
    errors.push("Add a valid date for the sales record.");
  }

  if (!sale.businessAreaId) {
    errors.push("Choose the business area for the daily sales record.");
  }

  if (!Number.isFinite(sale.amount) || sale.amount <= 0) {
    errors.push("Enter a total daily sales amount greater than zero.");
  }

  return errors;
}

async function handleRentalSubmit(event) {
  event.preventDefault();

  const existingRecord = state.editingRentalId
    ? state.rentals.find((record) => record.id === state.editingRentalId)
    : null;
  const draft = buildRentalDraftFromForm(new FormData(elements.rentalForm), existingRecord);
  const previousSuiteRecord = state.editingRentalId ? null : getLatestRentalRecordForSuite(draft.suite);

  const errors = validateRental(draft);

  if (errors.length > 0) {
    showToast(errors[0]);
    return;
  }

  let savedRecord = null;

  if (state.editingRentalId) {
    savedRecord = {
      ...existingRecord,
      ...draft,
      updatedAt: new Date().toISOString()
    };
    state.rentals = sortRentals(
      state.rentals.map((record) =>
        record.id === state.editingRentalId ? savedRecord : record
      )
    );
  } else {
    savedRecord = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...draft
    };
    state.rentals = sortRentals([
      ...state.rentals,
      savedRecord
    ]);
  }

  persistRentals();
  let toastMessage = state.editingRentalId ? "Rental record updated." : "Rental record saved.";

  if (!state.editingRentalId && shouldAutoGenerateTenancyAgreement(savedRecord, previousSuiteRecord)) {
    const generated = await generateTenancyAgreementForRental(savedRecord, { silent: true, auto: true });
    toastMessage = generated
      ? "Rental record saved and tenancy agreement prepared."
      : "Rental record saved, but the tenancy agreement could not be generated.";
  } else if (!state.editingRentalId && shouldPromptForAgreementAfterSave(savedRecord, previousSuiteRecord)) {
    toastMessage =
      "Rental record saved. Add or confirm rent payment details, then use Agreement to prepare the tenancy agreement.";
  }

  resetRentalForm({ silent: true });
  render();
  showToast(toastMessage);
}

function validateRental(record) {
  const errors = [];
  const needsTenantCycle = record.occupancyStatus !== "Vacant";

  if (!record.month) {
    errors.push("Choose the billing month for this apartment record.");
  }

  if (!record.suite) {
    errors.push("Choose the suite or apartment for this record.");
  }

  if (!record.occupancyStatus) {
    errors.push("Choose the occupancy status for this suite.");
  }

  if (["Occupied", "Reserved"].includes(record.occupancyStatus) && !record.tenantName) {
    errors.push("Add the tenant or occupant name for active suites.");
  }

  if (needsTenantCycle && !record.rentCycleType) {
    errors.push("Choose the rent cycle for this suite.");
  }

  if (needsTenantCycle && (!Number.isInteger(record.rentCycleMonths) || record.rentCycleMonths <= 0)) {
    errors.push("Add a valid cycle length in months for the rent plan.");
  }

  if (["Occupied", "Reserved"].includes(record.occupancyStatus) && record.rentCycleAmount <= 0) {
    errors.push("Add the rent cycle amount for this tenant.");
  }

  if (record.rentPaid > record.rentDue && record.rentDue > 0) {
    errors.push("Rent paid cannot be greater than rent due.");
  }

  if (record.billAmountPaid > getBillsTotal(record) && getBillsTotal(record) > 0) {
    errors.push("Bills paid cannot be greater than the total bills due.");
  }

  if (record.billAmountPaid > 0 && getBillsTotal(record) <= 0) {
    errors.push("Enter at least one bill amount before recording bills paid.");
  }

  if (record.moveInDate && record.moveOutDate && record.moveOutDate < record.moveInDate) {
    errors.push("Move-out date cannot be earlier than move-in date.");
  }

  if (
    record.rentCoverageStartDate &&
    record.rentCoverageEndDate &&
    record.rentCoverageEndDate < record.rentCoverageStartDate
  ) {
    errors.push("Rent coverage end cannot be earlier than rent coverage start.");
  }

  return errors;
}

function buildRentalDraftFromForm(formData, existingRecord = null) {
  const customBillItems = String(formData.get("customBillItems") || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => normalizeText(line))
    .filter(Boolean)
    .join("\n");
  const rawDraft = {
    month: normalizeMonthInput(formData.get("rentalMonth")),
    suite: normalizeSuite(formData.get("rentalSuite")),
    occupancyStatus: normalizeOccupancyStatus(formData.get("occupancyStatus")),
    tenantName: normalizeText(formData.get("tenantName")),
    tenantPhone: normalizeText(formData.get("tenantPhone")),
    tenantAddress: normalizeText(formData.get("tenantAddress")),
    emergencyContact: normalizeText(formData.get("emergencyContact")),
    tenantIdRef: normalizeText(formData.get("tenantIdRef")),
    moveInDate: normalizeDateInput(formData.get("moveInDate")),
    moveOutDate: normalizeDateInput(formData.get("moveOutDate")),
    rentCycleType: normalizeRentCycleType(formData.get("rentCycleType")),
    rentCycleMonths: parsePositiveInteger(formData.get("rentCycleMonths")),
    rentCycleAmount: parseOptionalAmount(formData.get("rentCycleAmount")),
    rentDue: parseOptionalAmount(formData.get("rentDue")),
    rentPaid: parseOptionalAmount(formData.get("rentPaid")),
    rentCoverageStartDate: normalizeDateInput(formData.get("rentCoverageStartDate")),
    rentCoverageEndDate: normalizeDateInput(formData.get("rentCoverageEndDate")),
    nextRentDueDate: normalizeDateInput(formData.get("nextRentDueDate")),
    renewalDate: normalizeDateInput(formData.get("renewalDate")),
    rentPaymentDate: normalizeDateInput(formData.get("rentPaymentDate")),
    rentPaymentMethod: normalizeText(formData.get("rentPaymentMethod")),
    rentPaymentReference: normalizeText(formData.get("rentPaymentReference")),
    rentReceivedBy: normalizeText(formData.get("rentReceivedBy")),
    waterBill: parseOptionalAmount(formData.get("waterBill")),
    toiletBill: parseOptionalAmount(formData.get("toiletBill")),
    sweepingBill: parseOptionalAmount(formData.get("sweepingBill")),
    wasteBill: parseOptionalAmount(formData.get("wasteBill")),
    billDueDate: normalizeDateInput(formData.get("billDueDate")),
    billAmountPaid: parseOptionalAmount(formData.get("billAmountPaid")),
    billPaymentDate: normalizeDateInput(formData.get("billPaymentDate")),
    billPaymentMethod: normalizeText(formData.get("billPaymentMethod")),
    billPaymentReference: normalizeText(formData.get("billPaymentReference")),
    billReceivedBy: normalizeText(formData.get("billReceivedBy")),
    arrearsBroughtForward: parseOptionalAmount(formData.get("arrearsBroughtForward")),
    lateFee: parseOptionalAmount(formData.get("lateFee")),
    customBillItems,
    notes: normalizeText(formData.get("rentalNotes"))
  };

  return finalizeRentalDraft(rawDraft, existingRecord);
}

function finalizeRentalDraft(record, existingRecord = null) {
  const cycleMonths = resolveRentCycleMonths(record.rentCycleType, record.rentCycleMonths);
  const effectiveRentCycleAmount =
    record.rentCycleAmount > 0
      ? record.rentCycleAmount
      : existingRecord?.rentCycleAmount > 0
        ? existingRecord.rentCycleAmount
        : record.rentDue;
  const normalized = {
    ...record,
    occupancyStatus: record.occupancyStatus || inferOccupancyStatus(record, existingRecord),
    rentCycleType: record.rentCycleType || existingRecord?.rentCycleType || "custom",
    rentCycleMonths: cycleMonths,
    rentCycleAmount: Number((effectiveRentCycleAmount || 0).toFixed(2))
  };

  if (
    !normalized.rentCoverageEndDate &&
    normalized.rentCoverageStartDate &&
    normalized.rentCycleMonths > 0
  ) {
    normalized.rentCoverageEndDate = shiftDateByMonths(
      normalized.rentCoverageStartDate,
      normalized.rentCycleMonths,
      -1
    );
  }

  if (!normalized.nextRentDueDate && normalized.rentCoverageEndDate) {
    normalized.nextRentDueDate = shiftDateByDays(normalized.rentCoverageEndDate, 1);
  }

  if (
    normalized.rentDue > 0 &&
    normalized.rentPaid >= normalized.rentDue &&
    normalized.rentCoverageEndDate
  ) {
    normalized.nextRentDueDate = shiftDateByDays(normalized.rentCoverageEndDate, 1);
  }

  if (!normalized.renewalDate && normalized.nextRentDueDate) {
    normalized.renewalDate = normalized.nextRentDueDate;
  }

  if (!normalized.billDueDate && getBillsTotal(normalized) > 0) {
    normalized.billDueDate = buildMonthDayDate(
      normalized.month,
      extractPreferredBillDay(existingRecord?.billDueDate)
    );
  }

  return normalized;
}

function handlePettyCashSubmit(event) {
  event.preventDefault();

  const formData = new FormData(elements.pettyCashForm);
  const transactionTypeId = normalizeText(formData.get("pettyCashType"));
  const businessAreaId = normalizeBusinessAreaId(formData.get("pettyCashArea"));
  const type = getPettyCashType(transactionTypeId);
  const draft = {
    date: normalizeDateInput(formData.get("pettyCashDate")),
    transactionTypeId,
    businessAreaId,
    category: type.isExpense ? sanitizeAreaChoice(businessAreaId, formData.get("pettyCashCategory")) : "",
    vendor: normalizeText(formData.get("pettyCashVendor")),
    receiptStatus: normalizeReceiptStatus(formData.get("pettyCashReceiptStatus")),
    amount: parseAmount(formData.get("pettyCashAmount")),
    notes: normalizeText(formData.get("pettyCashNotes"))
  };

  const errors = validatePettyCashEntry(draft);

  if (errors.length > 0) {
    showToast(errors[0]);
    return;
  }

  if (state.editingPettyCashId) {
    const existing = state.pettyCash.find((entry) => entry.id === state.editingPettyCashId);

    if (!existing) {
      showToast("That petty cash entry could not be found.");
      return;
    }

    const updated = {
      ...existing,
      ...draft,
      updatedAt: new Date().toISOString()
    };

    updated.linkedExpenseId = syncLinkedExpenseForPettyEntry(updated, existing.linkedExpenseId);
    state.pettyCash = sortPettyCash(
      state.pettyCash.map((entry) => (entry.id === updated.id ? updated : entry))
    );
    persistExpenses();
    persistPettyCash();
    resetPettyCashForm({ silent: true });
    render();
    showToast("Petty cash entry updated.");
    return;
  }

  const newEntry = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    linkedExpenseId: "",
    ...draft
  };

  newEntry.linkedExpenseId = syncLinkedExpenseForPettyEntry(newEntry);
  state.pettyCash = sortPettyCash([...state.pettyCash, newEntry]);
  persistExpenses();
  persistPettyCash();
  resetPettyCashForm({ silent: true });
  render();
  showToast("Petty cash entry saved.");
}

function validatePettyCashEntry(entry) {
  const errors = [];
  const type = getPettyCashType(entry.transactionTypeId);

  if (!entry.date) {
    errors.push("Add a valid date for this petty cash entry.");
  }

  if (!type.id) {
    errors.push("Choose the petty cash transaction type.");
  }

  if (!entry.businessAreaId) {
    errors.push("Choose the business area tied to this petty cash entry.");
  }

  if (!entry.vendor) {
    errors.push("Add who received the cash or the purpose of the movement.");
  }

  if (!Number.isFinite(entry.amount) || entry.amount <= 0) {
    errors.push("Enter a petty cash amount greater than zero.");
  }

  if (type.isExpense && !entry.category) {
    errors.push("Choose the expense type for petty cash spending.");
  }

  return errors;
}

function syncLinkedExpenseForPettyEntry(entry, existingExpenseId = "") {
  const type = getPettyCashType(entry.transactionTypeId);

  if (!type.isExpense) {
    if (existingExpenseId) {
      removeExpenseRecord(existingExpenseId);
    }
    return "";
  }

  const draft = buildExpenseFromPettyCash(entry);
  const existingExpense = existingExpenseId
    ? state.expenses.find((expense) => expense.id === existingExpenseId)
    : null;

  if (existingExpense) {
    state.expenses = sortExpenses(
      state.expenses.map((expense) =>
        expense.id === existingExpense.id
          ? {
              ...expense,
              ...draft,
              updatedAt: new Date().toISOString()
            }
          : expense
      )
    );
    return existingExpense.id;
  }

  const newExpense = {
    id: generateId(),
    reference: buildReference(entry.date),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    linkedPettyCashId: entry.id,
    ...draft
  };

  state.expenses = sortExpenses([...state.expenses, newExpense]);
  return newExpense.id;
}

function buildExpenseFromPettyCash(entry) {
  return {
    businessAreaId: entry.businessAreaId,
    date: entry.date,
    vendor: entry.vendor,
    category: entry.category || OTHER_CUSTOM_OPTION,
    description: entry.notes || "Synced from petty cash ledger",
    paymentMethod: "Petty Cash",
    receiptStatus: entry.receiptStatus,
    amount: entry.amount,
    notes: normalizeText(`Petty cash ledger sync${entry.notes ? `: ${entry.notes}` : ""}`),
    linkedPettyCashId: entry.id
  };
}

function handleExpenseTableAction(event) {
  const target = event.target.closest("button[data-action]");

  if (!target) {
    return;
  }

  const expenseId = target.dataset.id;
  const action = target.dataset.action;

  if (action === "edit") {
    startEditingExpense(expenseId);
  }

  if (action === "delete") {
    deleteExpense(expenseId);
  }
}

function handleSalesTableAction(event) {
  const target = event.target.closest("button[data-sales-action]");

  if (!target) {
    return;
  }

  if (target.dataset.salesAction === "edit") {
    startEditingSale(target.dataset.id);
  }

  if (target.dataset.salesAction === "delete") {
    deleteSale(target.dataset.id);
  }
}

function handleRentalTableAction(event) {
  const target = event.target.closest("button[data-rental-action]");

  if (!target) {
    return;
  }

  if (target.dataset.rentalAction === "edit") {
    startEditingRental(target.dataset.id);
  }

  if (target.dataset.rentalAction === "new") {
    startNewRentalFromSuite(target.dataset.suite);
  }

  if (target.dataset.rentalAction === "agreement") {
    generateTenancyAgreementForRentalById(target.dataset.id);
  }

  if (target.dataset.rentalAction === "statement") {
    printTenantStatement(target.dataset.id);
  }

  if (target.dataset.rentalAction === "receipt") {
    printRentalReceipt(target.dataset.id);
  }

  if (target.dataset.rentalAction === "delete") {
    deleteRental(target.dataset.id);
  }
}

function handlePettyCashTableAction(event) {
  const target = event.target.closest("button[data-petty-action]");

  if (!target) {
    return;
  }

  if (target.dataset.pettyAction === "edit") {
    startEditingPettyCash(target.dataset.id);
  }

  if (target.dataset.pettyAction === "delete") {
    deletePettyCashEntry(target.dataset.id);
  }
}

function startEditingExpense(expenseId) {
  const expense = state.expenses.find((item) => item.id === expenseId);

  if (!expense) {
    showToast("That expense could not be found.");
    return;
  }

  if (expense.linkedPettyCashId) {
    navigateTo("petty-cash", { syncHash: true });
    startEditingPettyCash(expense.linkedPettyCashId);
    showToast("This expense is managed from the petty cash ledger.");
    return;
  }

  state.editingExpenseId = expense.id;
  elements.formHeading.textContent = `Edit ${expense.reference}`;
  elements.submitExpenseBtn.textContent = "Update Expense";
  elements.cancelEditBtn.classList.remove("hidden");
  elements.expenseDate.value = expense.date;
  elements.businessArea.value = expense.businessAreaId;
  updateExpenseMenus(expense.businessAreaId, expense.category);
  elements.vendor.value = expense.vendor;
  elements.category.value = expense.category;
  elements.paymentMethod.value = expense.paymentMethod;
  elements.receiptStatus.value = expense.receiptStatus;
  elements.amount.value = String(expense.amount);
  elements.description.value = expense.description;
  elements.notes.value = expense.notes;
  navigateTo("expenses", { syncHash: true });
  elements.expenseForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function deleteExpense(expenseId, options = {}) {
  const expense = state.expenses.find((item) => item.id === expenseId);

  if (!expense) {
    if (!options.silent) {
      showToast("That expense could not be found.");
    }
    return;
  }

  const message = expense.linkedPettyCashId
    ? `Delete ${expense.reference} for ${expense.vendor}? This is linked to petty cash and will remove both records.`
    : `Delete ${expense.reference} for ${expense.vendor}? This cannot be undone.`;
  const shouldDelete = options.skipConfirmation ? true : window.confirm(message);

  if (!shouldDelete) {
    return;
  }

  if (expense.linkedPettyCashId && !options.skipLinkedCleanup) {
    if (state.editingPettyCashId === expense.linkedPettyCashId) {
      resetPettyCashForm({ silent: true });
    }
    removePettyCashRecord(expense.linkedPettyCashId);
    persistPettyCash();
  }

  removeExpenseRecord(expenseId);
  persistExpenses();

  if (state.editingExpenseId === expenseId) {
    resetExpenseForm({ silent: true });
  }

  render();

  if (!options.silent) {
    showToast("Expense deleted.");
  }
}

function startEditingSale(saleId) {
  const sale = state.sales.find((item) => item.id === saleId);

  if (!sale) {
    showToast("That daily sales record could not be found.");
    return;
  }

  state.editingSalesId = sale.id;
  elements.salesFormHeading.textContent = "Edit Daily Sales";
  elements.submitSalesBtn.textContent = "Update Daily Sales";
  elements.cancelSalesEditBtn.classList.remove("hidden");
  elements.salesDate.value = sale.date;
  elements.salesArea.value = sale.businessAreaId;
  elements.salesAmount.value = String(sale.amount);
  elements.salesNotes.value = sale.notes;
  navigateTo("sales", { syncHash: true });
  elements.salesForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function deleteSale(saleId) {
  const sale = state.sales.find((item) => item.id === saleId);

  if (!sale) {
    showToast("That daily sales record could not be found.");
    return;
  }

  const shouldDelete = window.confirm(
    `Delete the sales record for ${getBusinessArea(sale.businessAreaId).shortLabel} on ${formatDisplayDate(
      sale.date
    )}?`
  );

  if (!shouldDelete) {
    return;
  }

  state.sales = state.sales.filter((item) => item.id !== saleId);
  persistSales();

  if (state.editingSalesId === saleId) {
    resetSalesForm({ silent: true });
  }

  render();
  showToast("Daily sales record deleted.");
}

function startEditingRental(rentalId) {
  const record = state.rentals.find((item) => item.id === rentalId);

  if (!record) {
    showToast("That rental record could not be found.");
    return;
  }

  state.editingRentalId = record.id;
  elements.rentalFormHeading.textContent = "Edit Apartment Record";
  elements.submitRentalBtn.textContent = "Update Rental Record";
  elements.cancelRentalEditBtn.classList.remove("hidden");
  elements.rentalMonth.value = record.month;
  elements.rentalSuite.value = record.suite;
  elements.occupancyStatus.value = record.occupancyStatus;
  elements.rentalCaptureMode.value = inferRentalCaptureMode(record.month, record);
  elements.tenantName.value = record.tenantName;
  elements.tenantPhone.value = record.tenantPhone;
  elements.tenantAddress.value = record.tenantAddress;
  elements.emergencyContact.value = record.emergencyContact;
  elements.tenantIdRef.value = record.tenantIdRef;
  elements.moveInDate.value = record.moveInDate;
  elements.moveOutDate.value = record.moveOutDate;
  elements.rentCycleType.value = record.rentCycleType;
  elements.rentCycleMonths.value = record.rentCycleMonths ? String(record.rentCycleMonths) : "";
  elements.rentCycleAmount.value = record.rentCycleAmount ? String(record.rentCycleAmount) : "";
  elements.rentDue.value = record.rentDue ? String(record.rentDue) : "";
  elements.rentPaid.value = record.rentPaid ? String(record.rentPaid) : "";
  elements.rentCoverageStartDate.value = record.rentCoverageStartDate;
  elements.rentCoverageEndDate.value = record.rentCoverageEndDate;
  elements.nextRentDueDate.value = record.nextRentDueDate;
  elements.renewalDate.value = record.renewalDate;
  elements.rentPaymentDate.value = record.rentPaymentDate;
  elements.rentPaymentMethod.value = record.rentPaymentMethod;
  elements.rentPaymentReference.value = record.rentPaymentReference;
  elements.rentReceivedBy.value = record.rentReceivedBy;
  elements.waterBill.value = record.waterBill ? String(record.waterBill) : "";
  elements.toiletBill.value = record.toiletBill ? String(record.toiletBill) : "";
  elements.sweepingBill.value = record.sweepingBill ? String(record.sweepingBill) : "";
  elements.wasteBill.value = record.wasteBill ? String(record.wasteBill) : "";
  elements.billDueDate.value = record.billDueDate;
  elements.billAmountPaid.value = record.billAmountPaid ? String(record.billAmountPaid) : "";
  elements.billPaymentDate.value = record.billPaymentDate;
  elements.billPaymentMethod.value = record.billPaymentMethod;
  elements.billPaymentReference.value = record.billPaymentReference;
  elements.billReceivedBy.value = record.billReceivedBy;
  elements.arrearsBroughtForward.value = record.arrearsBroughtForward
    ? String(record.arrearsBroughtForward)
    : "";
  elements.lateFee.value = record.lateFee ? String(record.lateFee) : "";
  elements.customBillItems.value = record.customBillItems;
  elements.rentalNotes.value = record.notes;
  elements.generateRentalMonth.value = record.month;
  handleRentCycleTypeChange();
  updateMonthlyBillsHelper();
  navigateTo("apartments", { syncHash: true });
  elements.rentalForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function startNewRentalFromSuite(suite) {
  resetRentalForm({ silent: true });
  elements.rentalSuite.value = normalizeSuite(suite);
  elements.occupancyStatus.value = "Vacant";
  navigateTo("apartments", { syncHash: true });
  elements.rentalForm.scrollIntoView({ behavior: "smooth", block: "start" });
  showToast(`Ready to add a new apartment record for ${suite}.`);
}

function deleteRental(rentalId) {
  const record = state.rentals.find((item) => item.id === rentalId);

  if (!record) {
    showToast("That rental record could not be found.");
    return;
  }

  const shouldDelete = window.confirm(
    `Delete the apartment record for ${record.suite} in ${formatMonthLabel(record.month)}?`
  );

  if (!shouldDelete) {
    return;
  }

  state.rentals = state.rentals.filter((item) => item.id !== rentalId);
  persistRentals();

  if (state.editingRentalId === rentalId) {
    resetRentalForm({ silent: true });
  }

  render();
  showToast("Rental record deleted.");
}

function startEditingPettyCash(entryId) {
  const entry = state.pettyCash.find((item) => item.id === entryId);

  if (!entry) {
    showToast("That petty cash entry could not be found.");
    return;
  }

  state.editingPettyCashId = entry.id;
  elements.pettyCashFormHeading.textContent = "Edit Petty Cash Entry";
  elements.submitPettyCashBtn.textContent = "Update Petty Cash Entry";
  elements.cancelPettyCashEditBtn.classList.remove("hidden");
  elements.pettyCashDate.value = entry.date;
  elements.pettyCashType.value = entry.transactionTypeId;
  elements.pettyCashArea.value = entry.businessAreaId;
  updatePettyCashMenus(entry.businessAreaId, entry.category);
  elements.pettyCashCategory.value = entry.category;
  elements.pettyCashVendor.value = entry.vendor;
  elements.pettyCashAmount.value = String(entry.amount);
  elements.pettyCashReceiptStatus.value = entry.receiptStatus;
  elements.pettyCashNotes.value = entry.notes;
  handlePettyCashTypeChange();
  navigateTo("petty-cash", { syncHash: true });
  elements.pettyCashForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function deletePettyCashEntry(entryId, options = {}) {
  const entry = state.pettyCash.find((item) => item.id === entryId);

  if (!entry) {
    if (!options.silent) {
      showToast("That petty cash entry could not be found.");
    }
    return;
  }

  const shouldDelete = options.skipConfirmation
    ? true
    : window.confirm(
        `Delete the petty cash entry for ${entry.vendor} on ${formatDisplayDate(entry.date)}?${
          entry.linkedExpenseId ? " The linked expense record will also be removed." : ""
        }`
      );

  if (!shouldDelete) {
    return;
  }

  if (entry.linkedExpenseId && !options.skipLinkedCleanup) {
    if (state.editingExpenseId === entry.linkedExpenseId) {
      resetExpenseForm({ silent: true });
    }
    removeExpenseRecord(entry.linkedExpenseId);
    persistExpenses();
  }

  removePettyCashRecord(entryId);
  persistPettyCash();

  if (state.editingPettyCashId === entryId) {
    resetPettyCashForm({ silent: true });
  }

  render();

  if (!options.silent) {
    showToast("Petty cash entry deleted.");
  }
}

function removeExpenseRecord(expenseId) {
  state.expenses = state.expenses.filter((item) => item.id !== expenseId);
}

function removePettyCashRecord(entryId) {
  state.pettyCash = state.pettyCash.filter((item) => item.id !== entryId);
}

function resetExpenseForm(options = {}) {
  elements.expenseForm.reset();
  elements.expenseDate.value = getTodayInputValue();
  elements.businessArea.value = "";
  updateExpenseMenus("");
  elements.paymentMethod.value = "";
  elements.receiptStatus.value = "Uploaded";
  elements.formHeading.textContent = "Add Expense";
  elements.submitExpenseBtn.textContent = "Save Expense";
  elements.cancelEditBtn.classList.add("hidden");
  state.editingExpenseId = null;

  if (!options.silent) {
    showToast("Expense form cleared.");
  }
}

function resetSalesForm(options = {}) {
  elements.salesForm.reset();
  elements.salesDate.value = getTodayInputValue();
  elements.salesArea.value = "";
  elements.salesFormHeading.textContent = "Daily Sales Tracker";
  elements.submitSalesBtn.textContent = "Save Daily Sales";
  elements.cancelSalesEditBtn.classList.add("hidden");
  state.editingSalesId = null;

  if (!options.silent) {
    showToast("Daily sales form cleared.");
  }
}

function resetRentalForm(options = {}) {
  elements.rentalForm.reset();
  const currentMonth = getMonthKey(new Date());
  elements.rentalMonth.value = currentMonth;
  elements.generateRentalMonth.value = currentMonth;
  elements.occupancyStatus.value = "Occupied";
  elements.rentalCaptureMode.value = inferRentalCaptureMode(currentMonth);
  elements.rentCycleType.value = "6-month";
  elements.rentCycleMonths.value = "6";
  elements.billDueDate.value = buildMonthDayDate(currentMonth, 5);
  elements.rentalFormHeading.textContent = "Apartment Rentals & Bills";
  elements.submitRentalBtn.textContent = "Save Rental Record";
  elements.cancelRentalEditBtn.classList.add("hidden");
  state.editingRentalId = null;
  handleRentCycleTypeChange();
  handleRentalMonthChange();
  updateMonthlyBillsHelper();

  if (!options.silent) {
    showToast("Rental form cleared.");
  }
}

function resetPettyCashForm(options = {}) {
  elements.pettyCashForm.reset();
  elements.pettyCashDate.value = getTodayInputValue();
  elements.pettyCashType.value = "expense-paid";
  elements.pettyCashArea.value = DEFAULT_BUSINESS_AREA_ID;
  updatePettyCashMenus(DEFAULT_BUSINESS_AREA_ID);
  elements.pettyCashReceiptStatus.value = "Uploaded";
  elements.pettyCashFormHeading.textContent = "Petty Cash Ledger";
  elements.submitPettyCashBtn.textContent = "Save Petty Cash Entry";
  elements.cancelPettyCashEditBtn.classList.add("hidden");
  state.editingPettyCashId = null;
  handlePettyCashTypeChange();

  if (!options.silent) {
    showToast("Petty cash form cleared.");
  }
}

function clearExpenseFilters() {
  elements.expenseSearchFilter.value = "";
  elements.expenseMonthFilter.value = "";
  elements.expenseAreaFilter.value = "";
  updateExpenseFilterMenus("");
  elements.expensePaymentFilter.value = "";
  elements.expenseReceiptFilter.value = "";
  render();
  showToast("Expense filters cleared.");
}

function clearSalesFilters() {
  elements.salesSearchFilter.value = "";
  elements.salesMonthFilter.value = "";
  elements.salesAreaFilter.value = "";
  render();
  showToast("Sales filters cleared.");
}

function clearRentalFilters() {
  elements.rentalSearchFilter.value = "";
  elements.rentalMonthFilter.value = "";
  elements.rentalSuiteFilter.value = "";
  elements.rentalStatusFilter.value = "";
  elements.rentalAlertFilter.value = "";
  render();
  showToast("Apartment filters cleared.");
}

function clearPettyCashFilters() {
  elements.pettyCashSearchFilter.value = "";
  elements.pettyCashMonthFilter.value = "";
  elements.pettyCashTypeFilter.value = "";
  elements.pettyCashAreaFilter.value = "";
  elements.pettyCashReceiptFilter.value = "";
  render();
  showToast("Petty cash filters cleared.");
}

function syncChoiceLists() {
  const paymentMethods = mergeUniqueOptions(
    BASE_PAYMENT_METHODS,
    state.expenses.map((expense) => expense.paymentMethod)
  );
  const selectedExpenseAreaId = normalizeBusinessAreaId(elements.businessArea.value);
  const selectedExpenseFilterAreaId = normalizeBusinessAreaId(elements.expenseAreaFilter.value);
  const selectedBudgetAreaId =
    normalizeBusinessAreaId(elements.budgetArea.value) || DEFAULT_BUSINESS_AREA_ID;
  const selectedPettyAreaId =
    normalizeBusinessAreaId(elements.pettyCashArea.value) || DEFAULT_BUSINESS_AREA_ID;
  const selectedPettyBudgetAreaId =
    normalizeBusinessAreaId(elements.pettyCashBudgetArea.value) || DEFAULT_BUSINESS_AREA_ID;

  setSelectOptions(elements.businessArea, getBusinessAreaOptions(), "Choose business area");
  setSelectOptions(elements.expenseAreaFilter, getBusinessAreaOptions(), "All Areas");
  setSelectOptions(elements.budgetArea, getBusinessAreaOptions(), "Choose business area");
  setSelectOptions(elements.salesArea, getBusinessAreaOptions(), "Choose business area");
  setSelectOptions(elements.salesAreaFilter, getBusinessAreaOptions(), "All Areas");
  setSelectOptions(elements.paymentMethod, paymentMethods, "Choose payment method");
  setSelectOptions(elements.expensePaymentFilter, paymentMethods, "All Methods");
  setSelectOptions(
    elements.rentalSuite,
    mergeUniqueOptions(APARTMENT_SUITES, state.rentals.map((record) => record.suite)),
    "Choose suite"
  );
  setSelectOptions(
    elements.rentalSuiteFilter,
    mergeUniqueOptions(APARTMENT_SUITES, state.rentals.map((record) => record.suite)),
    "All Suites"
  );
  setSelectOptions(elements.occupancyStatus, OCCUPANCY_STATUSES, "Choose status");
  setSelectOptions(elements.rentalStatusFilter, OCCUPANCY_STATUSES, "Any Status");
  setSelectOptions(elements.rentCycleType, RENT_CYCLE_OPTIONS, "Choose rent cycle");
  setSelectOptions(elements.rentPaymentMethod, paymentMethods, "Choose payment method");
  setSelectOptions(elements.billPaymentMethod, paymentMethods, "Choose payment method");
  setSelectOptions(elements.pettyCashType, getPettyCashTypeOptions(), "Choose transaction type");
  setSelectOptions(elements.pettyCashTypeFilter, getPettyCashTypeOptions(), "All Types");
  setSelectOptions(elements.pettyCashArea, getBusinessAreaOptions(), "Choose business area");
  setSelectOptions(elements.pettyCashAreaFilter, getBusinessAreaOptions(), "All Areas");
  setSelectOptions(elements.pettyCashBudgetArea, getBusinessAreaOptions(), "Choose business area");

  updateExpenseMenus(selectedExpenseAreaId, elements.category.value);
  updateExpenseFilterMenus(selectedExpenseFilterAreaId, elements.expenseCategoryFilter.value);
  updateBudgetMenus(selectedBudgetAreaId, elements.budgetCategory.value);
  updatePettyCashMenus(selectedPettyAreaId, elements.pettyCashCategory.value);
  elements.pettyCashBudgetArea.value = selectedPettyBudgetAreaId;
  handlePettyCashTypeChange();
}

function setSelectOptions(select, options, placeholderLabel) {
  const previousValue = select.value;
  const optionMarkup = [
    `<option value="">${escapeHtml(placeholderLabel)}</option>`,
    ...options.map((option) => {
      const normalizedOption =
        typeof option === "string" ? { value: option, label: option } : option;
      return `<option value="${escapeHtml(normalizedOption.value)}">${escapeHtml(
        normalizedOption.label
      )}</option>`;
    })
  ].join("");

  select.innerHTML = optionMarkup;

  const optionValues = options.map((option) =>
    typeof option === "string" ? option : option.value
  );

  if (optionValues.includes(previousValue)) {
    select.value = previousValue;
  } else {
    select.value = "";
  }
}

function handleCurrencyChange() {
  state.currency = elements.currencySelect.value;
  persistSettings();
  render();
  showToast(`Display currency set to ${state.currency}.`);
}

function handlePrintReport() {
  window.print();
}

function populateCurrencyOptions() {
  elements.currencySelect.innerHTML = CURRENCY_OPTIONS.map(
    (option) => `<option value="${option.code}">${option.label}</option>`
  ).join("");
  elements.currencySelect.value = state.currency;
}

function handleExpenseAreaFilterChange() {
  updateExpenseFilterMenus(elements.expenseAreaFilter.value);
  render();
}

function updateExpenseMenus(areaId, selectedCategory = "") {
  const normalizedAreaId = normalizeBusinessAreaId(areaId);
  const categories = normalizedAreaId ? getBusinessArea(normalizedAreaId).categories : [];

  setSelectOptions(elements.category, categories, "Choose expense type");

  if (selectedCategory && categories.includes(selectedCategory)) {
    elements.category.value = selectedCategory;
  }
}

function updateExpenseFilterMenus(areaId, selectedCategory = "") {
  const normalizedAreaId = normalizeBusinessAreaId(areaId);
  const categories = normalizedAreaId
    ? getBusinessArea(normalizedAreaId).categories
    : getMergedAreaCategories(state.expenses.map((expense) => expense.category));

  setSelectOptions(elements.expenseCategoryFilter, categories, "All Expense Types");

  if (selectedCategory && categories.includes(selectedCategory)) {
    elements.expenseCategoryFilter.value = selectedCategory;
  }
}

function updateBudgetMenus(areaId, selectedCategory = "") {
  const normalizedAreaId = normalizeBusinessAreaId(areaId);
  const categories = normalizedAreaId ? getBusinessArea(normalizedAreaId).categories : [];

  setSelectOptions(elements.budgetCategory, categories, "Choose expense type");

  if (selectedCategory && categories.includes(selectedCategory)) {
    elements.budgetCategory.value = selectedCategory;
  }
}

function updatePettyCashMenus(areaId, selectedCategory = "") {
  const normalizedAreaId = normalizeBusinessAreaId(areaId);
  const categories = normalizedAreaId ? getBusinessArea(normalizedAreaId).categories : [];

  setSelectOptions(elements.pettyCashCategory, categories, "Choose expense type");

  if (selectedCategory && categories.includes(selectedCategory)) {
    elements.pettyCashCategory.value = selectedCategory;
  }
}

function handlePettyCashTypeChange() {
  const type = getPettyCashType(elements.pettyCashType.value);
  const usesExpenseMeta = type.isExpense;

  elements.pettyCashCategory.disabled = !usesExpenseMeta;
  elements.pettyCashVendorLabel.textContent = usesExpenseMeta ? "Payee / Purpose" : "Source / Reason";
  elements.pettyCashContextNote.textContent = usesExpenseMeta
    ? "Expense-paid entries are also synced into the expense register using payment method Petty Cash."
    : "Use this for float top-ups, cash returns, opening balance, or manual adjustments that do not create expense records.";

  if (!usesExpenseMeta) {
    elements.pettyCashCategory.value = "";
  }
}

function getBusinessAreaOptions() {
  return BUSINESS_AREAS.map((area) => ({ value: area.id, label: area.label }));
}

function getPettyCashTypeOptions() {
  return PETTY_CASH_TYPES.map((type) => ({ value: type.id, label: type.label }));
}

function getMergedAreaCategories(extraOptions = []) {
  const baseOptions = BUSINESS_AREAS.flatMap((area) => area.categories);
  return mergeUniqueOptions(baseOptions, extraOptions);
}

function getBusinessArea(areaIdOrLabel) {
  const normalizedId = normalizeBusinessAreaId(areaIdOrLabel);
  return BUSINESS_AREA_MAP.get(normalizedId) || BUSINESS_AREA_MAP.get(DEFAULT_BUSINESS_AREA_ID);
}

function getPettyCashType(typeId) {
  return (
    PETTY_CASH_TYPE_MAP.get(typeId) || {
      id: "",
      label: "Unknown",
      effect: 0,
      isExpense: false
    }
  );
}

function initializeBudgetPlanner() {
  elements.budgetMonth.value = getMonthKey(new Date());
  elements.budgetArea.value = DEFAULT_BUSINESS_AREA_ID;
  updateBudgetMenus(elements.budgetArea.value);
  elements.pettyCashBudgetMonth.value = getMonthKey(new Date());
  elements.pettyCashBudgetArea.value = DEFAULT_BUSINESS_AREA_ID;
}

function createDefaultReportFilters() {
  return {
    preset: "year-to-date",
    fromMonth: "",
    toMonth: "",
    area: ""
  };
}

function shiftMonthKey(monthKey, delta) {
  const normalizedMonth = normalizeMonthInput(monthKey);

  if (!normalizedMonth) {
    return "";
  }

  const [year, month] = normalizedMonth.split("-").map(Number);
  return formatUtcMonthKey(new Date(Date.UTC(year, month - 1 + delta, 1)));
}

function resolveQuarterStartMonth(monthKey) {
  const normalizedMonth = normalizeMonthInput(monthKey);

  if (!normalizedMonth) {
    return "";
  }

  const [year, month] = normalizedMonth.split("-").map(Number);
  const quarterStartMonth = Math.floor((month - 1) / 3) * 3 + 1;
  return `${year}-${String(quarterStartMonth).padStart(2, "0")}`;
}

function compareMonthKeys(left, right) {
  return normalizeMonthInput(left).localeCompare(normalizeMonthInput(right));
}

function getWorkspaceMonthBounds() {
  const monthCandidates = [
    ...state.expenses.map((record) => normalizeMonthInput((record.date || "").slice(0, 7))),
    ...state.budgets.map((record) => normalizeMonthInput(record.month)),
    ...state.sales.map((record) => normalizeMonthInput((record.date || "").slice(0, 7))),
    ...state.rentals.map((record) => normalizeMonthInput(record.month)),
    ...state.pettyCash.map((record) => normalizeMonthInput((record.date || "").slice(0, 7))),
    ...state.pettyCashBudgets.map((record) => normalizeMonthInput(record.month)),
    ...state.salaryRecords.map((record) => normalizeMonthInput(record.month)),
    ...state.cashbookEntries.map((record) =>
      normalizeMonthInput((record.entryDate || "").slice(0, 7))
    ),
    ...state.purchaseOrders.map((record) =>
      normalizeMonthInput((record.requestDate || "").slice(0, 7))
    ),
    ...state.laundryTickets.map((record) =>
      normalizeMonthInput((record.ticketDate || "").slice(0, 7))
    ),
    ...state.equipmentRentalBookings.map((record) =>
      normalizeMonthInput((record.bookingDate || record.outDate || "").slice(0, 7))
    ),
    ...state.securityDepositRecords.map((record) =>
      normalizeMonthInput((record.captureDate || record.depositDueDate || "").slice(0, 7))
    ),
    ...state.ledgerEntries.map((record) => normalizeMonthInput((record.entryDate || "").slice(0, 7))),
    ...state.mobileMoneyReconciliations.map((record) =>
      normalizeMonthInput((record.date || "").slice(0, 7))
    ),
    ...state.suppliers.map((record) => normalizeMonthInput((record.invoiceDate || "").slice(0, 7))),
    ...state.assetRecords.map((record) =>
      normalizeMonthInput((record.acquiredDate || record.nextServiceDate || "").slice(0, 7))
    ),
    ...state.forecastPlans.map((record) => normalizeMonthInput(record.month)),
    ...state.recurringControls.map((record) =>
      normalizeMonthInput((record.nextDueDate || record.startDate || "").slice(0, 7))
    ),
    ...state.maintenanceRecords.map((record) =>
      normalizeMonthInput((record.reportedDate || "").slice(0, 7))
    )
  ].filter(Boolean);
  const currentMonth = getMonthKey(new Date());

  if (monthCandidates.length === 0) {
    return {
      earliestMonth: currentMonth,
      latestMonth: currentMonth
    };
  }

  const sortedMonths = [...monthCandidates, currentMonth].sort(compareMonthKeys);
  return {
    earliestMonth: sortedMonths[0],
    latestMonth: sortedMonths[sortedMonths.length - 1]
  };
}

function getReportPresetMonths(preset) {
  const currentMonth = getMonthKey(new Date());
  const { earliestMonth, latestMonth } = getWorkspaceMonthBounds();

  switch (preset) {
    case "month-to-date":
      return { fromMonth: currentMonth, toMonth: currentMonth };
    case "quarter-to-date":
      return { fromMonth: resolveQuarterStartMonth(currentMonth), toMonth: currentMonth };
    case "last-6-months":
      return { fromMonth: shiftMonthKey(currentMonth, -5), toMonth: currentMonth };
    case "all-time":
      return { fromMonth: earliestMonth, toMonth: latestMonth };
    case "custom":
      return {
        fromMonth: normalizeMonthInput(state.reportFilters.fromMonth) || earliestMonth,
        toMonth: normalizeMonthInput(state.reportFilters.toMonth) || latestMonth
      };
    case "year-to-date":
    default:
      return { fromMonth: `${currentMonth.slice(0, 4)}-01`, toMonth: currentMonth };
  }
}

function applyReportPreset(preset, options = {}) {
  const normalizedPreset = REPORT_PRESET_OPTIONS.some((item) => item.value === preset)
    ? preset
    : "year-to-date";
  const { fromMonth, toMonth } = getReportPresetMonths(normalizedPreset);

  state.reportFilters.preset = normalizedPreset;

  if (normalizedPreset !== "custom" || !options.preserveCustomMonths) {
    state.reportFilters.fromMonth = fromMonth;
    state.reportFilters.toMonth = toMonth;
  }
}

function resolveActiveReportRange() {
  const preset = REPORT_PRESET_OPTIONS.some((item) => item.value === state.reportFilters.preset)
    ? state.reportFilters.preset
    : "year-to-date";
  const fallbackMonths = getReportPresetMonths(preset);
  let fromMonth = normalizeMonthInput(state.reportFilters.fromMonth) || fallbackMonths.fromMonth;
  let toMonth = normalizeMonthInput(state.reportFilters.toMonth) || fallbackMonths.toMonth;

  if (compareMonthKeys(fromMonth, toMonth) > 0) {
    [fromMonth, toMonth] = [toMonth, fromMonth];
  }

  const presetLabel =
    REPORT_PRESET_OPTIONS.find((item) => item.value === preset)?.label || "Year To Date";
  const label =
    fromMonth === toMonth
      ? formatMonthLabel(fromMonth)
      : `${formatMonthLabel(fromMonth)} to ${formatMonthLabel(toMonth)}`;

  return {
    preset,
    presetLabel,
    fromMonth,
    toMonth,
    label
  };
}

function isMonthInReportRange(monthKey, range) {
  const normalizedMonth = normalizeMonthInput(monthKey);

  if (!normalizedMonth) {
    return false;
  }

  return (
    compareMonthKeys(normalizedMonth, range.fromMonth) >= 0 &&
    compareMonthKeys(normalizedMonth, range.toMonth) <= 0
  );
}

function isDateInReportRange(dateString, range) {
  const normalizedDate = normalizeDateInput(dateString);

  if (!normalizedDate) {
    return false;
  }

  return isMonthInReportRange(normalizedDate.slice(0, 7), range);
}

function listMonthsInRange(range) {
  const months = [];
  let monthCursor = range.fromMonth;

  while (monthCursor && compareMonthKeys(monthCursor, range.toMonth) <= 0) {
    months.push(monthCursor);
    monthCursor = shiftMonthKey(monthCursor, 1);
  }

  return months;
}

function handleBudgetAreaChange() {
  updateBudgetMenus(elements.budgetArea.value);
  render();
}

function handleBudgetSubmit(event) {
  event.preventDefault();

  const month = normalizeMonthInput(elements.budgetMonth.value);
  const businessAreaId = normalizeBusinessAreaId(elements.budgetArea.value);
  const category = normalizeText(elements.budgetCategory.value);
  const amount = parseAmount(elements.budgetAmount.value);

  if (!month) {
    showToast("Choose the month this budget applies to.");
    return;
  }

  if (!businessAreaId) {
    showToast("Choose the OneRoot business area for this budget.");
    return;
  }

  if (!category) {
    showToast("Choose the expense type you want to budget for.");
    return;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    showToast("Enter a budget amount greater than zero.");
    return;
  }

  const existingBudget = state.budgets.find(
    (budget) =>
      budget.month === month &&
      budget.businessAreaId === businessAreaId &&
      budget.category === category
  );
  const budgetRecord = {
    id: existingBudget?.id || generateId(),
    month,
    businessAreaId,
    category,
    amount,
    updatedAt: new Date().toISOString()
  };

  state.budgets = sortBudgets([
    ...state.budgets.filter(
      (budget) =>
        !(
          budget.month === month &&
          budget.businessAreaId === businessAreaId &&
          budget.category === category
        )
    ),
    budgetRecord
  ]);
  persistBudgets();
  render();

  elements.budgetAmount.value = "";
  updateBudgetMenus(businessAreaId, category);
  showToast(
    existingBudget
      ? `Budget updated for ${getBusinessArea(businessAreaId).shortLabel} in ${formatMonthLabel(month)}.`
      : `Budget saved for ${getBusinessArea(businessAreaId).shortLabel} in ${formatMonthLabel(month)}.`
  );
}

function renderBudgetPanel() {
  const selectedMonth = normalizeMonthInput(elements.budgetMonth.value) || getMonthKey(new Date());

  if (elements.budgetMonth.value !== selectedMonth) {
    elements.budgetMonth.value = selectedMonth;
  }

  const selectedBudgets = state.budgets.filter((budget) => budget.month === selectedMonth);
  const monthExpenses = state.expenses.filter((expense) => expense.date.startsWith(selectedMonth));
  const monthSalaries = state.salaryRecords.filter((record) => record.month === selectedMonth);
  const plannedTotal = selectedBudgets.reduce((sum, budget) => sum + budget.amount, 0);
  const actualTotal = selectedBudgets.reduce(
    (sum, budget) =>
      sum + getBudgetActual(monthExpenses, monthSalaries, budget.businessAreaId, budget.category),
    0
  );
  const unplannedTotal = monthExpenses.reduce((sum, expense) => {
    const hasBudget = selectedBudgets.some(
      (budget) =>
        budget.businessAreaId === expense.businessAreaId && budget.category === expense.category
    );
    return hasBudget ? sum : sum + expense.amount;
  }, 0) +
    monthSalaries.reduce((sum, record) => {
      const hasBudget = selectedBudgets.some(
        (budget) =>
          budget.businessAreaId === record.businessAreaId && budget.category === "Staff Wages"
      );
      return hasBudget ? sum : sum + record.amountPaid;
    }, 0);
  const variance = plannedTotal - actualTotal;

  elements.monthBudgetValue.textContent = formatCurrency(plannedTotal);
  elements.monthActualValue.textContent = formatCurrency(actualTotal);
  elements.monthVarianceValue.textContent =
    plannedTotal === 0 && actualTotal + unplannedTotal > 0
      ? `${formatCurrency(actualTotal + unplannedTotal)} unplanned`
      : variance >= 0
        ? `${formatCurrency(variance)} left`
        : `${formatCurrency(Math.abs(variance))} over`;

  if (selectedBudgets.length === 0) {
    elements.budgetListMeta.textContent = `No budgets set for ${formatMonthLabel(selectedMonth)} yet.`;
    elements.budgetList.innerHTML = `
      <div class="empty-state">
        Save a monthly budget above to compare planned and actual spending for ${escapeHtml(
          formatMonthLabel(selectedMonth)
        )}.
      </div>
    `;
    return;
  }

  elements.budgetListMeta.textContent = `Budgets for ${formatMonthLabel(selectedMonth)}.${
    unplannedTotal > 0 ? ` Unbudgeted spend this month: ${formatCurrency(unplannedTotal)}.` : ""
  }`;
  elements.budgetList.innerHTML = selectedBudgets
    .map((budget) => {
      const actual = getBudgetActual(
        monthExpenses,
        monthSalaries,
        budget.businessAreaId,
        budget.category
      );
      const budgetStatus = buildBudgetStatus(actual, budget.amount);
      const progressWidth = budget.amount > 0 ? Math.min((actual / budget.amount) * 100, 100) : 0;

      return `
        <article class="budget-item">
          <div class="budget-item-header">
            <strong>${escapeHtml(budget.category)}</strong>
            <span class="budget-pill ${budgetStatus.pillClass}">${budgetStatus.label}</span>
          </div>
          <div class="budget-item-meta">
            <span>${escapeHtml(getBusinessArea(budget.businessAreaId).shortLabel)}</span>
            <span>Budgeted: ${formatCurrency(budget.amount)}</span>
            <span>Spent: ${formatCurrency(actual)}</span>
          </div>
          <div class="budget-progress" aria-hidden="true">
            <div
              class="budget-progress-bar ${budgetStatus.barClass}"
              style="width: ${progressWidth.toFixed(1)}%"
            ></div>
          </div>
          <div class="budget-item-status">
            <strong>${budgetStatus.message}</strong>
            <button
              class="budget-delete-btn"
              data-budget-action="delete"
              data-id="${escapeHtml(budget.id)}"
              type="button"
            >
              Delete
            </button>
          </div>
        </article>
      `;
    })
    .join("");
}

function handleBudgetAction(event) {
  const target = event.target.closest("button[data-budget-action]");

  if (!target) {
    return;
  }

  if (target.dataset.budgetAction === "delete") {
    deleteBudget(target.dataset.id);
  }
}

function deleteBudget(budgetId) {
  const budget = state.budgets.find((item) => item.id === budgetId);

  if (!budget) {
    showToast("That budget could not be found.");
    return;
  }

  const shouldDelete = window.confirm(
    `Delete the ${budget.category} budget for ${getBusinessArea(
      budget.businessAreaId
    ).shortLabel} in ${formatMonthLabel(budget.month)}?`
  );

  if (!shouldDelete) {
    return;
  }

  state.budgets = state.budgets.filter((item) => item.id !== budgetId);
  persistBudgets();
  render();
  showToast("Budget deleted.");
}

async function exportCurrentView() {
  let filename = `oneroot-export-${dateStamp()}.csv`;
  let rows = [];
  let successMessage = "Current view exported.";

  if (state.currentView === "reports") {
    await exportReportSummaryCsv();
    return;
  }

  if (state.currentView === "kpi") {
    const snapshot = buildKpiSnapshot();

    filename = `oneroot-kpi-${dateStamp()}.csv`;
    rows = [
      ["Month", snapshot.monthKey],
      ["Business Area", snapshot.areaFilter ? getBusinessArea(snapshot.areaFilter).label : "All Areas"],
      [],
      ["Metric", "Value"],
      ["Captured Revenue", snapshot.revenue.toFixed(2)],
      ["Captured Spend", snapshot.spend.toFixed(2)],
      ["Operating Net", snapshot.net.toFixed(2)],
      ["Cash Movement", snapshot.cashMovement.toFixed(2)],
      ["Bank Movement", snapshot.bankMovement.toFixed(2)],
      ["Current Cash Balance", snapshot.currentCashBalance.toFixed(2)],
      ["Current Bank Balance", snapshot.currentBankBalance.toFixed(2)],
      ["Reminder Load", String(snapshot.reminderCount)],
      ["Open Procurement", String(snapshot.openPurchaseOrders)],
      ["Procurement Outstanding", snapshot.procurementOutstanding.toFixed(2)],
      ["Open Laundry Jobs", String(snapshot.openLaundryTickets)],
      ["Active Equipment Rentals", String(snapshot.activeEquipmentRentals)],
      ["Deposit Exposure", snapshot.depositExposure.toFixed(2)],
      ["Occupied Suites", String(snapshot.occupiedSuites)],
      ["Active Suites", String(snapshot.activeSuiteCount)],
      [],
      ["Staff KPI", ""],
      ["Payroll Records", String(snapshot.staffKpi.totalRecordCount)],
      ["Staff In Payroll", String(snapshot.staffKpi.staffCount)],
      ["Total Payroll Due", snapshot.staffKpi.payrollDue.toFixed(2)],
      ["Total Payroll Paid", snapshot.staffKpi.payrollPaid.toFixed(2)],
      ["Outstanding Payroll", snapshot.staffKpi.outstanding.toFixed(2)],
      ["Payroll Completion", formatPercentLabel(snapshot.staffKpi.completionRate)],
      ["Staff Fully Paid", String(snapshot.staffKpi.paidStaffCount)],
      ["Staff Part Paid", String(snapshot.staffKpi.partialStaffCount)],
      ["Staff Unpaid", String(snapshot.staffKpi.unpaidStaffCount)],
      ["Staff Overdue", String(snapshot.staffKpi.overdueStaffCount)],
      ["KPI Targets Set", String(snapshot.staffKpi.targetSetCount)],
      ["KPI Measurements Captured", String(snapshot.staffKpi.measuredCount)],
      ["KPI Target Total", snapshot.staffKpi.kpiTargetTotal.toFixed(2)],
      ["KPI Actual Total", snapshot.staffKpi.kpiActualTotal.toFixed(2)],
      ["KPI Achievement", formatPercentLabel(snapshot.staffKpi.kpiAchievement, "n/a")],
      ["On / Above Target", String(snapshot.staffKpi.metTargetCount)],
      ["Below Target", String(snapshot.staffKpi.underTargetCount)],
      ["Average Net Due", snapshot.staffKpi.averageNetDue.toFixed(2)],
      ["Average Paid", snapshot.staffKpi.averagePaid.toFixed(2)],
      [],
      ["Area", "Revenue", "Spend", "Net"],
      ...snapshot.areaRows.map((row) => [
        row.area.label,
        row.revenue.toFixed(2),
        row.spend.toFixed(2),
        row.net.toFixed(2)
      ]),
      [],
      [
        "Staff",
        "Role",
        "Business Areas",
        "Payroll Records",
        "Net Due",
        "Paid",
        "Balance",
        "Payroll Completion",
        "KPI Metric",
        "KPI Unit",
        "KPI Target",
        "KPI Actual",
        "KPI Achievement",
        "KPI Status",
        "Payroll Status",
        "Due Date"
      ],
      ...snapshot.staffKpi.rows.map((row) => {
        const status = getStaffKpiStatusConfig(row);
        const targetStatus = getStaffTargetStatusConfig(row);
        return [
          row.staffName,
          row.roleTitle || "",
          row.businessAreaSummary || "",
          String(row.recordCount),
          row.payrollDue.toFixed(2),
          row.amountPaid.toFixed(2),
          row.balance.toFixed(2),
          formatPercentLabel(row.completionRate, "n/a"),
          row.kpiMetric || "",
          row.kpiUnit || "",
          row.kpiTarget.toFixed(2),
          row.kpiActual.toFixed(2),
          formatPercentLabel(row.targetAchievement, "n/a"),
          targetStatus.label,
          status.label,
          row.nextDueDate || ""
        ];
      })
    ];
    successMessage = "KPI snapshot exported.";
  } else if (state.currentView === "search") {
    const results = buildGlobalSearchResults();

    if (results.length === 0) {
      showToast("There are no search results to export in the current view.");
      return;
    }

    filename = `oneroot-search-results-${dateStamp()}.csv`;
    rows = [
      ["module", "title", "detail", "sortKey", "view"],
      ...results.map((result) => [
        result.module,
        result.title,
        result.detail,
        result.sortKey,
        result.view
      ])
    ];
    successMessage = `Exported ${results.length} search result${results.length === 1 ? "" : "s"}.`;
  } else if (state.currentView === "reminders") {
    const items = buildReminderCenterItems();

    if (items.length === 0) {
      showToast("There are no reminder records to export in the current view.");
      return;
    }

    filename = `oneroot-reminders-${dateStamp()}.csv`;
    rows = [
      ["subject", "phone", "module", "dueDate", "label", "severity", "message"],
      ...items.map((item) => [
        item.subject,
        item.phone,
        item.moduleLabel,
        item.dueDate,
        item.label,
        item.severity,
        item.message
      ])
    ];
    successMessage = `Exported ${items.length} reminder${items.length === 1 ? "" : "s"}.`;
  } else if (state.currentView === "messages") {
    const generated = buildGeneratedMessage();

    filename = `oneroot-message-draft-${dateStamp()}.csv`;
    rows = [
      ["channel", "recipientName", "recipientPhone", "message"],
      [generated.channel, generated.recipientName, generated.recipientPhone, generated.message]
    ];
    successMessage = "Message draft exported.";
  } else if (state.currentView === "treasury") {
    const snapshot = buildTreasurySnapshot();

    filename = `oneroot-treasury-${dateStamp()}.csv`;
    rows = [
      ["Scope", snapshot.areaFilter ? getBusinessArea(snapshot.areaFilter).label : "All Areas"],
      [],
      ["Metric", "Value"],
      ["Money Left Now", snapshot.liquidFunds.toFixed(2)],
      ["Cash On Hand", snapshot.cashBalance.toFixed(2)],
      ["Bank Balance", snapshot.bankBalance.toFixed(2)],
      ["Mobile Money Float", snapshot.mobileMoneyFloat.toFixed(2)],
      ["Total Spent", snapshot.capturedSpend.toFixed(2)],
      ["External Cash Outflow", snapshot.externalOutflows.toFixed(2)],
      ["External Cash Inflow", snapshot.externalInflows.toFixed(2)],
      ["Open Commitments", snapshot.openCommitments.toFixed(2)],
      ["Available After Commitments", snapshot.availableAfterCommitments.toFixed(2)],
      ["Mobile Money Expected Float", snapshot.mobileMoneyExpected.toFixed(2)],
      ["Mobile Money Variance", snapshot.mobileMoneyVariance.toFixed(2)],
      [],
      [
        "Account",
        "Account Type",
        "Areas",
        "Balance",
        "External Inflow",
        "External Outflow",
        "Transfer In",
        "Transfer Out",
        "Last Date"
      ],
      ...snapshot.accountRows.map((row) => [
        row.accountName,
        getCashbookAccountTypeLabel(row.accountType),
        row.businessAreaSummary,
        row.balance.toFixed(2),
        row.externalInflow.toFixed(2),
        row.externalOutflow.toFixed(2),
        row.transferIn.toFixed(2),
        row.transferOut.toFixed(2),
        row.lastDate
      ]),
      [],
      ["Transfer Date", "Reference", "From", "To", "Out", "In", "Difference", "Status", "Areas"],
      ...snapshot.transferRows.map((row) => [
        row.date,
        row.reference,
        row.outSummary,
        row.inSummary,
        row.outTotal.toFixed(2),
        row.inTotal.toFixed(2),
        row.variance.toFixed(2),
        getCashbookTransferStatusConfig(row.statusKey).label,
        row.businessAreaSummary
      ]),
      [],
      ["Provider", "Last Recon", "Expected Closing", "Counted Float", "Variance"],
      ...snapshot.mobileMoneyRows.map((row) => [
        row.provider,
        row.date,
        getExpectedMobileMoneyClosing(row).toFixed(2),
        row.closingCashCounted.toFixed(2),
        getMobileMoneyVariance(row).toFixed(2)
      ])
    ];
    successMessage = "Treasury snapshot exported.";
  } else if (state.currentView === "procurement") {
    const records = getFilteredPurchaseOrders();

    if (records.length === 0) {
      showToast("There are no procurement records to export in the current view.");
      return;
    }

    filename = `oneroot-procurement-${dateStamp()}.csv`;
    rows = [
      [
        "requestDate",
        "businessArea",
        "requester",
        "supplierName",
        "supplierPhone",
        "itemDescription",
        "quantity",
        "unitCost",
        "totalAmount",
        "amountPaid",
        "outstanding",
        "expectedDate",
        "status",
        "notes"
      ],
      ...records.map((record) => [
        record.requestDate,
        getBusinessArea(record.businessAreaId).label,
        record.requester,
        record.supplierName,
        record.supplierPhone,
        record.itemDescription,
        String(record.quantity),
        record.unitCost.toFixed(2),
        record.totalAmount.toFixed(2),
        record.amountPaid.toFixed(2),
        getPurchaseOrderOutstanding(record).toFixed(2),
        record.expectedDate,
        record.status,
        record.notes
      ])
    ];
    successMessage = `Exported ${records.length} procurement record${records.length === 1 ? "" : "s"}.`;
  } else if (state.currentView === "laundry") {
    const records = getFilteredLaundryTickets();

    if (records.length === 0) {
      showToast("There are no laundry tickets to export in the current view.");
      return;
    }

    filename = `oneroot-laundry-${dateStamp()}.csv`;
    rows = [
      [
        "ticketDate",
        "customerName",
        "customerPhone",
        "serviceType",
        "itemSummary",
        "pieces",
        "amountDue",
        "amountPaid",
        "balance",
        "dueDate",
        "readyDate",
        "deliveryMode",
        "status",
        "notes"
      ],
      ...records.map((record) => [
        record.ticketDate,
        record.customerName,
        record.customerPhone,
        record.serviceType,
        record.itemSummary,
        String(record.pieces),
        record.amountDue.toFixed(2),
        record.amountPaid.toFixed(2),
        getLaundryBalance(record).toFixed(2),
        record.dueDate,
        record.readyDate,
        record.deliveryMode,
        record.status,
        record.notes
      ])
    ];
    successMessage = `Exported ${records.length} laundry ticket${records.length === 1 ? "" : "s"}.`;
  } else if (state.currentView === "equipment-rentals") {
    const records = getFilteredEquipmentRentalBookings();

    if (records.length === 0) {
      showToast("There are no equipment rental records to export in the current view.");
      return;
    }

    filename = `oneroot-equipment-rentals-${dateStamp()}.csv`;
    rows = [
      [
        "bookingDate",
        "equipmentItem",
        "customerName",
        "customerPhone",
        "rentalFee",
        "amountPaid",
        "depositAmount",
        "damageCharge",
        "balance",
        "outDate",
        "dueDate",
        "returnDate",
        "status",
        "conditionOut",
        "conditionIn",
        "reference",
        "notes"
      ],
      ...records.map((record) => [
        record.bookingDate,
        record.equipmentItem,
        record.customerName,
        record.customerPhone,
        record.rentalFee.toFixed(2),
        record.amountPaid.toFixed(2),
        record.depositAmount.toFixed(2),
        record.damageCharge.toFixed(2),
        getEquipmentRentalBalance(record).toFixed(2),
        record.outDate,
        record.dueDate,
        record.returnDate,
        record.status,
        record.conditionOut,
        record.conditionIn,
        record.reference,
        record.notes
      ])
    ];
    successMessage = `Exported ${records.length} equipment rental record${records.length === 1 ? "" : "s"}.`;
  } else if (state.currentView === "deposits") {
    const records = getFilteredSecurityDepositRecords();

    if (records.length === 0) {
      showToast("There are no deposit records to export in the current view.");
      return;
    }

    filename = `oneroot-deposits-${dateStamp()}.csv`;
    rows = [
      [
        "captureDate",
        "suite",
        "tenantName",
        "tenantPhone",
        "depositExpected",
        "depositPaid",
        "depositOutstanding",
        "chargesRaised",
        "chargesPaid",
        "chargeOutstanding",
        "deductionFromDeposit",
        "refundDue",
        "refundPaid",
        "refundOutstanding",
        "heldBalance",
        "depositDueDate",
        "refundDueDate",
        "status",
        "notes"
      ],
      ...records.map((record) => [
        record.captureDate,
        record.suite,
        record.tenantName,
        record.tenantPhone,
        record.depositExpected.toFixed(2),
        record.depositPaid.toFixed(2),
        getSecurityDepositOutstanding(record).toFixed(2),
        record.chargesRaised.toFixed(2),
        record.chargesPaid.toFixed(2),
        getSecurityChargeOutstanding(record).toFixed(2),
        record.deductionFromDeposit.toFixed(2),
        record.refundDue.toFixed(2),
        record.refundPaid.toFixed(2),
        getSecurityRefundOutstanding(record).toFixed(2),
        getSecurityDepositHeldBalance(record).toFixed(2),
        record.depositDueDate,
        record.refundDueDate,
        record.status,
        record.notes
      ])
    ];
    successMessage = `Exported ${records.length} deposit record${records.length === 1 ? "" : "s"}.`;
  } else if (state.currentView === "cashbook") {
    const records = getFilteredCashbookEntries();

    if (records.length === 0) {
      showToast("There are no cashbook or bankbook entries to export in the current view.");
      return;
    }

    filename = `oneroot-cashbook-${dateStamp()}.csv`;
    rows = [
      [
        "entryDate",
        "businessArea",
        "accountType",
        "accountName",
        "entryType",
        "amount",
        "signedEffect",
        "counterparty",
        "linkedAccountType",
        "linkedAccountName",
        "pairedTransfer",
        "transferGroupId",
        "reference",
        "notes"
      ],
      ...records.map((record) => [
        record.entryDate,
        getBusinessArea(record.businessAreaId).label,
        getCashbookAccountTypeLabel(record.accountType),
        record.accountName,
        getCashbookEntryType(record.entryType).label,
        record.amount.toFixed(2),
        getCashbookEntryEffect(record).toFixed(2),
        record.counterparty,
        getCashbookAccountTypeLabel(record.linkedAccountType),
        record.linkedAccountName,
        record.pairedTransfer ? "Yes" : "No",
        record.transferGroupId,
        record.reference,
        record.notes
      ])
    ];
    successMessage = `Exported ${records.length} cashbook entr${records.length === 1 ? "y" : "ies"}.`;
  } else if (state.currentView === "ledgers") {
    const records = getFilteredLedgerEntries();

    if (records.length === 0) {
      showToast("There are no ledger entries to export in the current view.");
      return;
    }

    filename = `oneroot-ledgers-${dateStamp()}.csv`;
    rows = [
      [
        "entryDate",
        "businessArea",
        "partyType",
        "partyName",
        "partyPhone",
        "suiteOrAccount",
        "entryType",
        "amount",
        "signedEffect",
        "dueDate",
        "reference",
        "notes"
      ],
      ...records.map((record) => [
        record.entryDate,
        getBusinessArea(record.businessAreaId).label,
        record.partyType,
        record.partyName,
        record.partyPhone,
        record.suite,
        getLedgerEntryType(record.entryType).label,
        record.amount.toFixed(2),
        getLedgerEntryEffect(record).toFixed(2),
        record.dueDate,
        record.reference,
        record.notes
      ])
    ];
    successMessage = `Exported ${records.length} ledger entr${records.length === 1 ? "y" : "ies"}.`;
  } else if (state.currentView === "mobile-money") {
    const records = getFilteredMobileMoneyRecords();

    if (records.length === 0) {
      showToast("There are no mobile money records to export in the current view.");
      return;
    }

    filename = `oneroot-mobile-money-${dateStamp()}.csv`;
    rows = [
      [
        "date",
        "provider",
        "openingCash",
        "cashTopUp",
        "cashRemoved",
        "cashInValue",
        "cashOutValue",
        "serviceFees",
        "operatingExpense",
        "expectedClosing",
        "closingCashCounted",
        "variance",
        "notes"
      ],
      ...records.map((record) => [
        record.date,
        record.provider,
        record.openingCash.toFixed(2),
        record.cashTopUp.toFixed(2),
        record.cashRemoved.toFixed(2),
        record.cashInValue.toFixed(2),
        record.cashOutValue.toFixed(2),
        record.serviceFees.toFixed(2),
        record.operatingExpense.toFixed(2),
        getExpectedMobileMoneyClosing(record).toFixed(2),
        record.closingCashCounted.toFixed(2),
        getMobileMoneyVariance(record).toFixed(2),
        record.notes
      ])
    ];
    successMessage = `Exported ${records.length} mobile money record${records.length === 1 ? "" : "s"}.`;
  } else if (state.currentView === "assets") {
    const records = getFilteredAssetRecords();

    if (records.length === 0) {
      showToast("There are no asset records to export in the current view.");
      return;
    }

    filename = `oneroot-assets-${dateStamp()}.csv`;
    rows = [
      [
        "acquiredDate",
        "businessArea",
        "assetName",
        "assetCategory",
        "location",
        "purchaseCost",
        "currentValue",
        "condition",
        "status",
        "nextServiceDate",
        "serviceState",
        "notes"
      ],
      ...records.map((record) => [
        record.acquiredDate,
        getBusinessArea(record.businessAreaId).label,
        record.assetName,
        record.assetCategory,
        record.location,
        record.purchaseCost.toFixed(2),
        record.currentValue.toFixed(2),
        record.condition,
        record.status,
        record.nextServiceDate,
        getAssetServiceState(record).label,
        record.notes
      ])
    ];
    successMessage = `Exported ${records.length} asset record${records.length === 1 ? "" : "s"}.`;
  } else if (state.currentView === "forecast") {
    const records = getFilteredForecastPlans();

    if (records.length === 0) {
      showToast("There are no forecast plans to export in the current view.");
      return;
    }

    filename = `oneroot-forecast-${dateStamp()}.csv`;
    rows = [
      [
        "month",
        "businessArea",
        "revenueTarget",
        "expenseBudget",
        "salaryBudget",
        "targetNet",
        "actualRevenue",
        "actualSpend",
        "actualNet",
        "notes"
      ],
      ...records.map((record) => {
        const actual = getAreaActualsForMonth(record.month, record.businessAreaId);
        return [
          record.month,
          getBusinessArea(record.businessAreaId).label,
          record.revenueTarget.toFixed(2),
          record.expenseBudget.toFixed(2),
          record.salaryBudget.toFixed(2),
          (record.revenueTarget - record.expenseBudget - record.salaryBudget).toFixed(2),
          actual.revenue.toFixed(2),
          actual.spend.toFixed(2),
          actual.net.toFixed(2),
          record.notes
        ];
      })
    ];
    successMessage = `Exported ${records.length} forecast plan${records.length === 1 ? "" : "s"}.`;
  } else if (state.currentView === "access") {
    const records = state.userProfiles;

    if (records.length === 0) {
      showToast("There are no workspace user profiles to export.");
      return;
    }

    filename = `oneroot-access-${dateStamp()}.csv`;
    rows = [
      ["fullName", "username", "role", "active", "loginMode", "phone", "menuCount", "notes"],
      ...records.map((record) => [
        record.fullName,
        record.username,
        record.role,
        record.active ? "Active" : "Inactive",
        getUserLoginMode(record) === "password-required" ? "Password Required" : "Profile Only",
        record.phone,
        String(getRolePreset(record.role).views.length),
        record.notes
      ])
    ];
    successMessage = `Exported ${records.length} workspace user${records.length === 1 ? "" : "s"}.`;
  } else {
    const expenses = getFilteredExpenses();

    if (expenses.length === 0) {
      showToast("There are no expenses to export in the current view.");
      return;
    }

    filename = `oneroot-expense-register-${dateStamp()}.csv`;
    rows = [
      [
        "reference",
        "date",
        "businessArea",
        "vendor",
        "expenseType",
        "description",
        "paymentMethod",
        "receiptStatus",
        "amount",
        "currency",
        "notes"
      ],
      ...expenses.map((expense) => [
        expense.reference,
        expense.date,
        getBusinessArea(expense.businessAreaId).label,
        expense.vendor,
        expense.category,
        expense.description,
        expense.paymentMethod,
        expense.receiptStatus,
        expense.amount.toFixed(2),
        state.currency,
        expense.notes
      ])
    ];
    successMessage = `Exported ${expenses.length} expense${expenses.length === 1 ? "" : "s"}.`;
  }

  const saved = await saveCsvFile(filename, rows);

  if (saved) {
    showToast(successMessage);
  }
}

function getWorkbookExportMeta(view = state.currentView) {
  switch (view) {
    case "expenses":
      return {
        scope: "expenses",
        label: "Export Expenses Workbook",
        filename: `oneroot-expenses-workbook-${dateStamp()}.xlsx`
      };
    case "sales":
      return {
        scope: "sales",
        label: "Export Sales Workbook",
        filename: `oneroot-sales-workbook-${dateStamp()}.xlsx`
      };
    case "apartments":
      return {
        scope: "apartments",
        label: "Export Apartments Workbook",
        filename: `oneroot-apartments-workbook-${dateStamp()}.xlsx`
      };
    case "petty-cash":
      return {
        scope: "petty-cash",
        label: "Export Petty Cash Workbook",
        filename: `oneroot-petty-cash-workbook-${dateStamp()}.xlsx`
      };
    case "salary":
      return {
        scope: "salary",
        label: "Export Salary Workbook",
        filename: `oneroot-salary-workbook-${dateStamp()}.xlsx`
      };
    case "cashbook":
    case "kpi":
    case "search":
    case "reminders":
    case "messages":
    case "procurement":
    case "laundry":
    case "equipment-rentals":
    case "deposits":
    case "ledgers":
    case "mobile-money":
    case "assets":
    case "forecast":
    case "access":
      return {
        scope: "all",
        label: "Export Full Workbook",
        filename: `oneroot-operations-workbook-${dateStamp()}.xlsx`
      };
    case "suppliers":
      return {
        scope: "suppliers",
        label: "Export Supplier Workbook",
        filename: `oneroot-supplier-workbook-${dateStamp()}.xlsx`
      };
    case "recurring":
      return {
        scope: "recurring",
        label: "Export Recurring Workbook",
        filename: `oneroot-recurring-workbook-${dateStamp()}.xlsx`
      };
    case "maintenance":
      return {
        scope: "maintenance",
        label: "Export Maintenance Workbook",
        filename: `oneroot-maintenance-workbook-${dateStamp()}.xlsx`
      };
    default:
      return {
        scope: "all",
        label: "Export Full Workbook",
        filename: `oneroot-operations-workbook-${dateStamp()}.xlsx`
      };
  }
}

async function handleExportActiveWorkbook() {
  await exportLiveWorkbook(getWorkbookExportMeta(state.currentView));
}

async function handleExportFullWorkbook() {
  await exportLiveWorkbook(getWorkbookExportMeta("overview"));
}

async function exportLiveWorkbook(meta) {
  if (typeof window.JSZip === "undefined") {
    showToast("Workbook export is not available in this browser right now.");
    return;
  }

  const workbookMimeType =
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  let preferredSaveHandle = null;

  try {
    preferredSaveHandle = await preparePreferredSaveHandle(meta.filename, workbookMimeType);
  } catch (error) {
    if (error?.name === "AbortError") {
      showToast("Workbook export cancelled.");
      return;
    }

    throw error;
  }

  showToast("Preparing your live Excel workbook...");

  try {
    const response = await fetch(UPLOADABLE_WORKBOOK_PATH, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Workbook template request failed with ${response.status}.`);
    }

    const zip = await window.JSZip.loadAsync(await response.arrayBuffer());
    const sheetPaths = await loadWorkbookSheetPaths(zip);
    const workbookRows = buildWorkbookExportDataset(meta.scope);
    const truncatedSheets = [];

    for (const [sheetName, config] of Object.entries(WORKBOOK_EXPORT_CONFIG)) {
      const sheetPath = sheetPaths[sheetName];

      if (!sheetPath) {
        continue;
      }

      const rows = workbookRows[sheetName] || [];

      if (rows.length > WORKBOOK_EXPORT_ROW_LIMIT) {
        truncatedSheets.push(sheetName);
      }

      const worksheetXml = await readZipText(zip, sheetPath);

      if (!worksheetXml) {
        continue;
      }

      const document = parseXmlDocument(worksheetXml);
      applyWorksheetDataRows(document, config, rows.slice(0, WORKBOOK_EXPORT_ROW_LIMIT));
      applyWorksheetValidationRanges(document, config.validations || []);
      zip.file(sheetPath, serializeXmlDocument(document));
    }

    const workbookXml = await readZipText(zip, "xl/workbook.xml");

    if (workbookXml) {
      const workbookDocument = parseXmlDocument(workbookXml);
      ensureWorkbookRecalculation(workbookDocument);
      zip.file("xl/workbook.xml", serializeXmlDocument(workbookDocument));
    }

    const workbookBlob = await zip.generateAsync({
      type: "blob",
      mimeType: workbookMimeType
    });
    let savedWithPicker = false;

    if (preferredSaveHandle) {
      try {
        await writeBlobToFileHandle(preferredSaveHandle, workbookBlob);
        savedWithPicker = true;
      } catch (error) {
        if (error?.name === "AbortError") {
          showToast("Workbook export cancelled.");
          return;
        }

        console.error(error);
      }
    }

    if (!savedWithPicker) {
      downloadBlob(meta.filename, workbookBlob, { revokeDelayMs: 60000 });
    }

    showToast(
      truncatedSheets.length === 0
        ? savedWithPicker
          ? `${meta.label} saved.`
          : `${meta.label} is ready.`
        : `${
            savedWithPicker ? `${meta.label} saved.` : `${meta.label} is ready.`
          } First ${WORKBOOK_EXPORT_ROW_LIMIT} rows were kept for ${truncatedSheets.join(", ")}.`
    );
  } catch (error) {
    console.error(error);
    showToast("The live Excel workbook could not be exported. Try again from Reports or Data Hub.");
  }
}

function buildWorkbookExportDataset(scope) {
  const includeAll = scope === "all";

  return {
    Expenses: buildExpenseWorkbookRows(
      includeAll ? state.expenses : scope === "expenses" ? getFilteredExpenses() : []
    ),
    Budget_Planner: buildBudgetWorkbookRows(includeAll || scope === "expenses" ? state.budgets : []),
    Daily_Sales: buildSalesWorkbookRows(
      includeAll ? state.sales : scope === "sales" ? getFilteredSales() : []
    ),
    Apartments: buildRentalWorkbookRows(
      includeAll ? state.rentals : scope === "apartments" ? getFilteredRentals() : []
    ),
    Petty_Cash: buildPettyCashWorkbookRows(
      includeAll ? state.pettyCash : scope === "petty-cash" ? getFilteredPettyCash() : []
    ),
    Petty_Cash_Budget: buildPettyCashBudgetWorkbookRows(
      includeAll || scope === "petty-cash" ? state.pettyCashBudgets : []
    ),
    Salary_Register: buildSalaryWorkbookRows(
      includeAll ? state.salaryRecords : scope === "salary" ? getFilteredSalaryRecords() : []
    ),
    Supplier_Ledger: buildSupplierWorkbookRows(
      includeAll ? state.suppliers : scope === "suppliers" ? getFilteredSuppliers() : []
    ),
    Recurring_Controls: buildRecurringWorkbookRows(
      includeAll ? state.recurringControls : scope === "recurring" ? getFilteredRecurringControls() : []
    ),
    Maintenance_Log: buildMaintenanceWorkbookRows(
      includeAll ? state.maintenanceRecords : scope === "maintenance" ? getFilteredMaintenanceRecords() : []
    )
  };
}

function buildExpenseWorkbookRows(expenses) {
  return expenses.map((expense) => ({
    A: expense.date,
    B: getBusinessArea(expense.businessAreaId).label,
    C: expense.vendor,
    D: expense.category,
    E: expense.description,
    F: expense.paymentMethod,
    G: expense.receiptStatus,
    H: expense.amount,
    I: expense.notes
  }));
}

function buildBudgetWorkbookRows(budgets) {
  return budgets.map((budget) => ({
    A: budget.month,
    B: getBusinessArea(budget.businessAreaId).label,
    C: budget.category,
    D: budget.amount,
    G: budget.notes || ""
  }));
}

function buildSalesWorkbookRows(sales) {
  return sales.map((sale) => ({
    A: sale.date,
    B: getBusinessArea(sale.businessAreaId).label,
    C: sale.amount,
    D: sale.notes
  }));
}

function buildRentalWorkbookRows(rentals) {
  return rentals.map((record) => {
    const customBillEntries = getCustomBillItemEntries(record);
    const customBillTotal = customBillEntries.reduce((sum, item) => sum + item.amount, 0);

    return {
      A: record.month,
      B: record.suite,
      C: record.occupancyStatus,
      D: record.tenantName,
      E: record.tenantPhone,
      F: record.emergencyContact,
      G: record.tenantIdRef,
      H: record.moveInDate,
      I: record.moveOutDate,
      J: formatRentCycleLabel(record.rentCycleType),
      K: record.rentCycleMonths,
      L: record.rentCycleAmount,
      M: record.rentDue,
      N: record.rentPaid,
      O: record.rentCoverageStartDate,
      P: record.rentCoverageEndDate,
      Q: record.nextRentDueDate,
      R: record.renewalDate,
      S: record.rentPaymentDate,
      T: record.rentPaymentMethod,
      U: record.rentPaymentReference,
      V: record.waterBill,
      W: record.toiletBill,
      X: record.sweepingBill,
      Y: record.wasteBill,
      Z: record.billDueDate,
      AA: record.billAmountPaid,
      AB: record.billPaymentDate,
      AC: record.billPaymentMethod,
      AD: record.billPaymentReference,
      AE: record.arrearsBroughtForward,
      AF: record.lateFee,
      AG: customBillTotal,
      AH: record.customBillItems,
      AI: record.notes
    };
  });
}

function buildPettyCashWorkbookRows(entries) {
  return entries.map((entry) => ({
    A: entry.date,
    B: getPettyCashType(entry.transactionTypeId).label,
    C: getBusinessArea(entry.businessAreaId).label,
    D: entry.category,
    E: entry.vendor,
    F: entry.receiptStatus,
    G: entry.amount,
    I: entry.notes
  }));
}

function buildPettyCashBudgetWorkbookRows(budgets) {
  return budgets.map((budget) => ({
    A: budget.month,
    B: getBusinessArea(budget.businessAreaId).label,
    C: budget.amount,
    D: budget.notes
  }));
}

function buildSalaryWorkbookRows(records) {
  return records.map((record) => ({
    A: record.month,
    B: getBusinessArea(record.businessAreaId).label,
    C: record.staffName,
    D: record.roleTitle,
    E: getSalaryTypeLabel(record.salaryType),
    F: record.grossAmount,
    G: record.deductionAmount,
    I: record.amountPaid,
    K: record.dueDate,
    L: record.paymentDate,
    M: record.paymentMethod,
    N: record.paymentReference,
    P: record.notes,
    Q: record.kpiMetric,
    R: record.kpiUnit,
    S: record.kpiTarget ?? "",
    T: record.kpiActual ?? ""
  }));
}

function buildSupplierWorkbookRows(records) {
  return records.map((record) => ({
    A: record.invoiceDate,
    B: getBusinessArea(record.businessAreaId).label,
    C: record.supplierName,
    D: record.category,
    E: record.itemDescription,
    F: record.invoiceReference,
    G: record.amountDue,
    H: record.amountPaid,
    I: record.dueDate,
    J: record.paymentDate,
    K: record.paymentMethod,
    N: record.notes
  }));
}

function buildRecurringWorkbookRows(records) {
  return records.map((record) => ({
    A: record.title,
    B: getRecurringModuleLabel(record.moduleType),
    C: getBusinessArea(record.businessAreaId).label,
    D: record.category,
    E: record.counterparty,
    F: record.suite,
    G: record.amount,
    H: getRecurringFrequencyLabel(record.frequency),
    I: record.startDate,
    J: record.nextDueDate,
    K: record.lastGeneratedDate,
    L: record.priority,
    M: record.active ? "Active" : "Paused",
    N: record.notes
  }));
}

function buildMaintenanceWorkbookRows(records) {
  return records.map((record) => ({
    A: record.reportedDate,
    B: getBusinessArea(record.businessAreaId).label,
    C: record.location,
    D: record.assetItem,
    E: record.issue,
    F: record.priority,
    G: record.status,
    H: record.dueDate,
    I: record.estimatedCost,
    J: record.actualCost,
    K: record.vendor,
    L: record.notes
  }));
}

function formatRentCycleLabel(rentCycleType) {
  const matchedOption = RENT_CYCLE_OPTIONS.find((option) => option.value === normalizeRentCycleType(rentCycleType));
  return matchedOption ? matchedOption.label : normalizeText(rentCycleType);
}

function applyWorksheetDataRows(document, config, rows) {
  const sheetData = getXmlChildrenByLocalName(document.documentElement, "sheetData")[0];

  if (!sheetData) {
    return;
  }

  const namespace = document.documentElement.namespaceURI;
  const columnEntries = Object.entries(config.columns);

  for (let rowIndex = 0; rowIndex < WORKBOOK_EXPORT_ROW_LIMIT; rowIndex += 1) {
    const rowNumber = rowIndex + 2;
    const rowNode = getOrCreateWorksheetRow(document, sheetData, rowNumber, namespace);
    const rowValues = rows[rowIndex] || {};

    columnEntries.forEach(([columnLetter, valueType]) => {
      const rawValue = rowValues[columnLetter];
      const cellReference = `${columnLetter}${rowNumber}`;
      const existingCell = findWorksheetCell(rowNode, cellReference);

      if (!hasWorkbookCellValue(valueType, rawValue)) {
        if (existingCell) {
          clearWorksheetCellValue(existingCell);
        }

        return;
      }

      const cellNode =
        existingCell || createWorksheetCell(document, rowNode, cellReference, namespace);
      writeWorksheetCellValue(document, cellNode, valueType, rawValue, namespace);
    });
  }
}

function applyWorksheetValidationRanges(document, ranges) {
  if (!Array.isArray(ranges) || ranges.length === 0) {
    return;
  }

  const validationNodes = Array.from(document.getElementsByTagNameNS("*", "dataValidation"));

  validationNodes.forEach((node, index) => {
    const sqrefNode = Array.from(node.childNodes).find(
      (child) => child.nodeType === Node.ELEMENT_NODE && child.localName === "sqref"
    );

    if (!sqrefNode || !ranges[index]) {
      return;
    }

    sqrefNode.textContent = ranges[index];
  });
}

function ensureWorkbookRecalculation(document) {
  const namespace = document.documentElement.namespaceURI;
  let calcPrNode = getXmlChildrenByLocalName(document.documentElement, "calcPr")[0];

  if (!calcPrNode) {
    calcPrNode = document.createElementNS(namespace, "calcPr");
    document.documentElement.appendChild(calcPrNode);
  }

  calcPrNode.setAttribute("calcId", calcPrNode.getAttribute("calcId") || "191029");
  calcPrNode.setAttribute("fullCalcOnLoad", "1");
  calcPrNode.setAttribute("forceFullCalc", "1");
}

function serializeXmlDocument(document) {
  return new XMLSerializer().serializeToString(document);
}

function getOrCreateWorksheetRow(document, sheetData, rowNumber, namespace) {
  const existingRow = getXmlChildrenByLocalName(sheetData, "row").find(
    (rowNode) => Number(rowNode.getAttribute("r") || 0) === rowNumber
  );

  if (existingRow) {
    return existingRow;
  }

  const rowNode = document.createElementNS(namespace, "row");
  rowNode.setAttribute("r", String(rowNumber));
  sheetData.appendChild(rowNode);
  return rowNode;
}

function findWorksheetCell(rowNode, reference) {
  return getXmlChildrenByLocalName(rowNode, "c").find(
    (cellNode) => normalizeText(cellNode.getAttribute("r")) === reference
  );
}

function createWorksheetCell(document, rowNode, reference, namespace) {
  const cellNode = document.createElementNS(namespace, "c");
  cellNode.setAttribute("r", reference);
  const cells = getXmlChildrenByLocalName(rowNode, "c");
  const targetIndex = getWorksheetColumnIndex(reference);

  const insertionTarget = cells.find(
    (existingCell) => getWorksheetColumnIndex(existingCell.getAttribute("r")) > targetIndex
  );

  if (insertionTarget) {
    rowNode.insertBefore(cellNode, insertionTarget);
  } else {
    rowNode.appendChild(cellNode);
  }

  return cellNode;
}

function getWorksheetColumnIndex(reference) {
  const columnLetters = String(reference || "")
    .replace(/\d+/g, "")
    .toUpperCase();

  return columnLetters.split("").reduce((sum, letter) => sum * 26 + (letter.charCodeAt(0) - 64), 0);
}

function hasWorkbookCellValue(valueType, rawValue) {
  if (valueType === "number") {
    return rawValue === 0 || (normalizeText(rawValue) !== "" && Number.isFinite(Number(rawValue)));
  }

  if (valueType === "date") {
    return normalizeDateInput(rawValue) !== "";
  }

  if (valueType === "month") {
    return normalizeMonthInput(rawValue) !== "";
  }

  return normalizeText(rawValue) !== "";
}

function clearWorksheetCellValue(cellNode) {
  while (cellNode.firstChild) {
    cellNode.removeChild(cellNode.firstChild);
  }

  cellNode.removeAttribute("t");
}

function writeWorksheetCellValue(document, cellNode, valueType, rawValue, namespace) {
  clearWorksheetCellValue(cellNode);

  if (valueType === "number") {
    appendWorksheetValueNode(document, cellNode, namespace, Number(rawValue));
    return;
  }

  if (valueType === "date") {
    appendWorksheetValueNode(document, cellNode, namespace, toExcelDateSerial(rawValue));
    return;
  }

  if (valueType === "month") {
    appendWorksheetValueNode(document, cellNode, namespace, toExcelMonthSerial(rawValue));
    return;
  }

  cellNode.setAttribute("t", "inlineStr");
  const isNode = document.createElementNS(namespace, "is");
  const textNode = document.createElementNS(namespace, "t");
  textNode.textContent = String(rawValue ?? "");
  isNode.appendChild(textNode);
  cellNode.appendChild(isNode);
}

function appendWorksheetValueNode(document, cellNode, namespace, value) {
  const valueNode = document.createElementNS(namespace, "v");
  valueNode.textContent = Number.isFinite(Number(value)) ? String(Number(value)) : "0";
  cellNode.appendChild(valueNode);
}

function toExcelDateSerial(dateString) {
  const normalizedDate = normalizeDateInput(dateString);

  if (!normalizedDate) {
    return 0;
  }

  const [year, month, day] = normalizedDate.split("-").map(Number);
  const utcTime = Date.UTC(year, month - 1, day);
  const excelEpoch = Date.UTC(1899, 11, 30);
  return Math.round((utcTime - excelEpoch) / 86400000);
}

function toExcelMonthSerial(monthKey) {
  const normalizedMonth = normalizeMonthInput(monthKey);
  return normalizedMonth ? toExcelDateSerial(`${normalizedMonth}-01`) : 0;
}

async function downloadTemplate() {
  const headers = [
    "date",
    "businessArea",
    "vendor",
    "expenseType",
    "description",
    "paymentMethod",
    "receiptStatus",
    "amount",
    "notes"
  ];

  const saved = await saveCsvFile("oneroot-expense-template.csv", [headers]);

  if (saved) {
    showToast("Template downloaded.");
  }
}

async function exportFullBackup() {
  const payload = {
    schemaVersion: 1,
    app: "OneRoot Operations App",
    exportedAt: new Date().toISOString(),
    settings: {
      currency: state.currency,
      activeUserId: state.activeUserId
    },
    workspace: {
      expenses: state.expenses,
      budgets: state.budgets,
      sales: state.sales,
      rentals: state.rentals,
      pettyCash: state.pettyCash,
      pettyCashBudgets: state.pettyCashBudgets,
      salaryRecords: state.salaryRecords,
      cashbookEntries: state.cashbookEntries,
      purchaseOrders: state.purchaseOrders,
      laundryTickets: state.laundryTickets,
      equipmentRentalBookings: state.equipmentRentalBookings,
      securityDepositRecords: state.securityDepositRecords,
      ledgerEntries: state.ledgerEntries,
      mobileMoneyReconciliations: state.mobileMoneyReconciliations,
      suppliers: state.suppliers,
      assetRecords: state.assetRecords,
      forecastPlans: state.forecastPlans,
      recurringControls: state.recurringControls,
      maintenanceRecords: state.maintenanceRecords,
      userProfiles: state.userProfiles
    }
  };

  const saved = await saveTextFile(
    `oneroot-operations-backup-${dateStamp()}.json`,
    JSON.stringify(payload, null, 2),
    "application/json;charset=utf-8;"
  );

  if (saved) {
    showToast("Full app backup exported.");
  }
}

async function handleWorkbookImportFile(event) {
  const file = event.target.files && event.target.files[0];

  if (!file) {
    return;
  }

  try {
    const imported = await importWorkbookFile(file);
    const totalRecords = getWorkspaceRecordTotal(imported);

    if (totalRecords === 0) {
      showToast("No valid workbook records were found in that file.");
      return;
    }

    applyImportedWorkbook(imported);
    showToast(
      `Workbook imported: ${totalRecords} record${totalRecords === 1 ? "" : "s"} merged into the current workspace.`
    );
  } catch (error) {
    console.error(error);
    showToast("That Excel workbook could not be imported.");
  } finally {
    elements.workbookImportFileInput.value = "";
  }
}

function applyImportedWorkbook(imported) {
  state.editingExpenseId = null;
  state.editingSalesId = null;
  state.editingRentalId = null;
  state.editingPettyCashId = null;
  state.editingSalaryId = null;
  state.editingCashbookId = null;
  state.editingPurchaseOrderId = null;
  state.editingLaundryTicketId = null;
  state.editingEquipmentRentalId = null;
  state.editingSecurityDepositId = null;
  state.editingLedgerId = null;
  state.editingMobileMoneyId = null;
  state.editingSupplierId = null;
  state.editingAssetId = null;
  state.editingForecastId = null;
  state.editingUserId = null;
  state.editingRecurringId = null;
  state.editingMaintenanceId = null;

  state.expenses = mergeExpenses(state.expenses, imported.expenses);
  state.budgets = mergeBudgets(state.budgets, imported.budgets);
  state.sales = mergeSales(state.sales, imported.sales);
  state.rentals = mergeRentals(state.rentals, imported.rentals);
  state.pettyCash = mergePettyCashEntries(state.pettyCash, imported.pettyCash);
  state.pettyCashBudgets = mergePettyCashBudgets(
    state.pettyCashBudgets,
    imported.pettyCashBudgets
  );
  state.salaryRecords = mergeSalaryRecords(state.salaryRecords, imported.salaryRecords);
  state.cashbookEntries = mergeCashbookEntries(state.cashbookEntries, imported.cashbookEntries);
  state.purchaseOrders = mergePurchaseOrders(state.purchaseOrders, imported.purchaseOrders || []);
  state.laundryTickets = mergeLaundryTickets(state.laundryTickets, imported.laundryTickets || []);
  state.equipmentRentalBookings = mergeEquipmentRentalBookings(
    state.equipmentRentalBookings,
    imported.equipmentRentalBookings || []
  );
  state.securityDepositRecords = mergeSecurityDepositRecords(
    state.securityDepositRecords,
    imported.securityDepositRecords || []
  );
  state.ledgerEntries = mergeLedgerEntries(state.ledgerEntries, imported.ledgerEntries);
  state.mobileMoneyReconciliations = mergeMobileMoneyReconciliations(
    state.mobileMoneyReconciliations,
    imported.mobileMoneyReconciliations
  );
  state.suppliers = mergeSupplierRecords(state.suppliers, imported.suppliers);
  state.assetRecords = mergeAssetRecords(state.assetRecords, imported.assetRecords);
  state.forecastPlans = mergeForecastPlans(state.forecastPlans, imported.forecastPlans);
  state.recurringControls = mergeRecurringControls(
    state.recurringControls,
    imported.recurringControls
  );
  state.maintenanceRecords = mergeMaintenanceRecords(
    state.maintenanceRecords,
    imported.maintenanceRecords
  );
  state.userProfiles = mergeUserProfiles(state.userProfiles, imported.userProfiles);

  reconcilePettyCashExpenseLinks();
  reconcileActiveUserProfile();
  persistAllData();
  resetExpenseForm({ silent: true });
  resetSalesForm({ silent: true });
  resetRentalForm({ silent: true });
  resetPettyCashForm({ silent: true });
  initializeBudgetPlanner();
  render();
}

async function handleExpenseImportFile(event) {
  const file = event.target.files && event.target.files[0];

  if (!file) {
    return;
  }

  try {
    const content = await file.text();
    const rows = parseCsv(content);

    if (rows.length < 2) {
      showToast("The selected CSV does not contain any expense rows.");
      return;
    }

    const headers = rows[0].map(normalizeHeader);
    const importedExpenses = [];
    let skippedCount = 0;

    rows.slice(1).forEach((row) => {
      const record = Object.fromEntries(headers.map((header, index) => [header, row[index] || ""]));

      if (Object.values(record).every((value) => normalizeText(value) === "")) {
        return;
      }

      const importedExpense = buildImportedExpense(record);

      if (!importedExpense) {
        skippedCount += 1;
        return;
      }

      importedExpenses.push(importedExpense);
    });

    if (importedExpenses.length === 0) {
      showToast("No valid expense rows were found in that file.");
      return;
    }

    state.expenses = sortExpenses([...state.expenses, ...importedExpenses]);
    persistExpenses();
    render();
    showToast(
      `Imported ${importedExpenses.length} expense${
        importedExpenses.length === 1 ? "" : "s"
      }${skippedCount > 0 ? ` and skipped ${skippedCount} invalid row${skippedCount === 1 ? "" : "s"}` : ""}.`
    );
  } catch (error) {
    console.error(error);
    showToast("That CSV could not be imported.");
  } finally {
    elements.expenseImportFileInput.value = "";
  }
}

async function handleBackupImportFile(event) {
  const file = event.target.files && event.target.files[0];

  if (!file) {
    return;
  }

  try {
    const content = await file.text();
    const payload = JSON.parse(content);
    const imported = sanitizeImportedBackup(payload);
    const totalRecords = getWorkspaceRecordTotal(imported);
    const exportedDate = normalizeDateInput(imported.exportedAt);
    const sourceDate = exportedDate ? formatDisplayDate(exportedDate) : "unknown date";

    if (totalRecords === 0) {
      showToast("That backup file does not contain any valid records.");
      return;
    }

    const shouldReplace = window.confirm(
      `Replace the current workspace with this backup from ${sourceDate}? It will restore ${totalRecords} record${
        totalRecords === 1 ? "" : "s"
      }.`
    );

    if (!shouldReplace) {
      return;
    }

    restoreWorkspaceFromImport(imported);
    localStorage.setItem(HOSTED_WORKSPACE_SNAPSHOT_FLAG_KEY, imported.exportedAt || "restored");
    reconcileActiveUserProfile();
    persistAllData();
    populateCurrencyOptions();
    resetExpenseForm({ silent: true });
    resetSalesForm({ silent: true });
    resetRentalForm({ silent: true });
    resetPettyCashForm({ silent: true });
    initializeBudgetPlanner();
    render();
    showToast(`Backup restored with ${totalRecords} record${totalRecords === 1 ? "" : "s"}.`);
  } catch (error) {
    console.error(error);
    showToast("That backup file could not be imported.");
  } finally {
    elements.backupImportFileInput.value = "";
  }
}

async function handleRestoreHostedSnapshot() {
  try {
    const imported = await fetchHostedWorkspaceSnapshot();
    const totalRecords = getWorkspaceRecordTotal(imported);
    const exportedDate = normalizeDateInput(imported.exportedAt);
    const sourceDate = exportedDate ? formatDisplayDate(exportedDate) : "the uploaded snapshot";

    if (totalRecords === 0) {
      showToast("The uploaded online snapshot does not contain any usable records.");
      return;
    }

    const shouldReplace = window.confirm(
      `Replace the current workspace with the uploaded online snapshot from ${sourceDate}? It will restore ${totalRecords} record${
        totalRecords === 1 ? "" : "s"
      }.`
    );

    if (!shouldReplace) {
      return;
    }

    restoreWorkspaceFromImport(imported);
    localStorage.setItem(HOSTED_WORKSPACE_SNAPSHOT_FLAG_KEY, imported.exportedAt || "restored");
    reconcileActiveUserProfile();
    reconcileAuthenticationSession({ skipPersist: true });
    persistAllData();
    populateCurrencyOptions();
    resetExpenseForm({ silent: true });
    resetSalesForm({ silent: true });
    resetRentalForm({ silent: true });
    resetPettyCashForm({ silent: true });
    initializeBudgetPlanner();
    render();
    showToast(`Uploaded online snapshot restored with ${totalRecords} record${totalRecords === 1 ? "" : "s"}.`);
  } catch (error) {
    console.error(error);
    showToast("The uploaded online snapshot could not be restored right now.");
  }
}

function buildImportedExpense(record) {
  const businessAreaId = normalizeBusinessAreaId(
    record.businessarea ||
      record.business_area ||
      record.area ||
      record.business ||
      inferBusinessAreaId(record)
  );
  const date = normalizeDateInput(record.date || record.expense_date || record.transaction_date);
  const vendor = normalizeText(record.vendor || record.payee || record.supplier);
  const amount = parseAmount(record.amount || record.value || record.total);
  const category = sanitizeAreaChoice(
    businessAreaId,
    record.expensetype || record.expense_type || record.category || record.expense_category
  );
  const paymentMethod =
    normalizeText(record.paymentmethod || record.payment_method || record.payment || record.method) ||
    "Bank Transfer";
  const receiptStatus = normalizeReceiptStatus(
    record.receiptstatus || record.receipt_status || record.receipt || "Pending"
  );
  const description = normalizeText(record.description || record.details || record.item);
  const notes = normalizeText(record.notes || record.note || record.memo);

  if (!date || !vendor || !businessAreaId || !category || !Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return {
    id: generateId(),
    reference: normalizeText(record.reference || record.ref) || buildReference(date),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    businessAreaId,
    date,
    vendor,
    category,
    description,
    paymentMethod,
    receiptStatus,
    amount,
    notes,
    linkedPettyCashId: ""
  };
}

function loadDemoData() {
  const totalExisting =
    state.expenses.length +
    state.budgets.length +
    state.sales.length +
    state.rentals.length +
    state.pettyCash.length +
    state.pettyCashBudgets.length +
    state.salaryRecords.length +
    state.cashbookEntries.length +
    state.purchaseOrders.length +
    state.laundryTickets.length +
    state.equipmentRentalBookings.length +
    state.securityDepositRecords.length +
    state.ledgerEntries.length +
    state.mobileMoneyReconciliations.length +
    state.suppliers.length +
    state.assetRecords.length +
    state.forecastPlans.length +
    state.recurringControls.length +
    state.maintenanceRecords.length +
    state.userProfiles.length;

  if (totalExisting > 0) {
    const shouldAppend = window.confirm(
      "Add demo expenses, daily sales, apartment records, petty cash entries, petty cash budgets, salary records, cashbook entries, procurement records, laundry tickets, equipment rentals, deposit records, ledger entries, mobile money reconciliations, supplier records, asset records, forecast plans, recurring controls, maintenance records, and user profiles to your current workspace?"
    );

    if (!shouldAppend) {
      return;
    }
  }

  const seededExpenses = DEMO_EXPENSES.map((expense) => ({
    id: generateId(),
    reference: buildReference(expense.date),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    linkedPettyCashId: "",
    ...expense
  }));
  const seededSales = DEMO_SALES.map((sale) => ({
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...sale
  }));
  const seededRentals = DEMO_RENTALS.map((record) => ({
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...record
  }));
  const seededPettyCash = DEMO_PETTY_CASH.map((entry) => ({
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    linkedExpenseId: "",
    ...entry
  }));
  const seededPettyCashBudgets = DEMO_PETTY_CASH_BUDGETS.map((budget) => ({
    id: generateId(),
    updatedAt: new Date().toISOString(),
    ...budget
  }));
  const seededSalaries = DEMO_SALARIES.map((record) => ({
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...record
  }));
  const seededCashbookEntries = DEMO_CASHBOOK_ENTRIES.map((record) => ({
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...record
  }));
  const seededPurchaseOrders = DEMO_PURCHASE_ORDERS.map((record) => ({
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...record
  }));
  const seededLaundryTickets = DEMO_LAUNDRY_TICKETS.map((record) => ({
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...record
  }));
  const seededEquipmentRentals = DEMO_EQUIPMENT_RENTALS.map((record) => ({
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...record
  }));
  const seededSecurityDeposits = DEMO_SECURITY_DEPOSITS.map((record) => ({
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...record
  }));
  const seededLedgers = DEMO_LEDGER_ENTRIES.map((record) => ({
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...record
  }));
  const seededMobileMoneyReconciliations = DEMO_MOBILE_MONEY_RECONCILIATIONS.map((record) => ({
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...record
  }));
  const seededSuppliers = DEMO_SUPPLIERS.map((record) => ({
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    generatedByRecurringId: "",
    ...record
  }));
  const seededAssets = DEMO_ASSETS.map((record) => ({
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...record
  }));
  const seededForecastPlans = DEMO_FORECASTS.map((record) => ({
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...record
  }));
  const seededRecurringControls = DEMO_RECURRING_CONTROLS.map((record) => ({
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...record
  }));
  const seededMaintenanceRecords = DEMO_MAINTENANCE_RECORDS.map((record) => ({
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    generatedByRecurringId: "",
    ...record
  }));
  const seededUserProfiles = DEMO_USER_PROFILES.map((record) => ({
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...record
  }));

  state.expenses = sortExpenses([...state.expenses, ...seededExpenses]);
  state.sales = sortSales([...state.sales, ...seededSales]);
  state.rentals = sortRentals([...state.rentals, ...seededRentals]);

  seededPettyCash.forEach((entry) => {
    entry.linkedExpenseId = syncLinkedExpenseForPettyEntry(entry);
  });

  state.pettyCash = sortPettyCash([...state.pettyCash, ...seededPettyCash]);
  state.pettyCashBudgets = sortPettyCashBudgets([
    ...state.pettyCashBudgets,
    ...seededPettyCashBudgets
  ]);
  state.salaryRecords = sortSalaryRecords([...state.salaryRecords, ...seededSalaries]);
  state.cashbookEntries = sortCashbookEntries([...state.cashbookEntries, ...seededCashbookEntries]);
  state.purchaseOrders = sortPurchaseOrders([...state.purchaseOrders, ...seededPurchaseOrders]);
  state.laundryTickets = sortLaundryTickets([...state.laundryTickets, ...seededLaundryTickets]);
  state.equipmentRentalBookings = sortEquipmentRentalBookings([
    ...state.equipmentRentalBookings,
    ...seededEquipmentRentals
  ]);
  state.securityDepositRecords = sortSecurityDepositRecords([
    ...state.securityDepositRecords,
    ...seededSecurityDeposits
  ]);
  state.ledgerEntries = sortLedgerEntries([...state.ledgerEntries, ...seededLedgers]);
  state.mobileMoneyReconciliations = sortMobileMoneyReconciliations([
    ...state.mobileMoneyReconciliations,
    ...seededMobileMoneyReconciliations
  ]);
  state.suppliers = sortSuppliers([...state.suppliers, ...seededSuppliers]);
  state.assetRecords = sortAssetRecords([...state.assetRecords, ...seededAssets]);
  state.forecastPlans = sortForecastPlans([...state.forecastPlans, ...seededForecastPlans]);
  state.recurringControls = sortRecurringControls([
    ...state.recurringControls,
    ...seededRecurringControls
  ]);
  state.maintenanceRecords = sortMaintenanceRecords([
    ...state.maintenanceRecords,
    ...seededMaintenanceRecords
  ]);
  state.userProfiles = sortUserProfiles([...state.userProfiles, ...seededUserProfiles]);

  persistExpenses();
  persistSales();
  persistRentals();
  persistPettyCash();
  persistPettyCashBudgets();
  persistSalaryRecords();
  persistCashbookEntries();
  persistPurchaseOrders();
  persistLaundryTickets();
  persistEquipmentRentalBookings();
  persistSecurityDepositRecords();
  persistLedgerEntries();
  persistMobileMoneyReconciliations();
  persistSuppliers();
  persistAssetRecords();
  persistForecastPlans();
  persistRecurringControls();
  persistMaintenanceRecords();
  persistUserProfiles();
  reconcileActiveUserProfile();
  render();
  showToast("Demo data added.");
}

function getFilteredExpenses() {
  const searchValue = normalizeText(elements.expenseSearchFilter.value).toLowerCase();
  const monthValue = elements.expenseMonthFilter.value;
  const areaValue = normalizeBusinessAreaId(elements.expenseAreaFilter.value);
  const categoryValue = elements.expenseCategoryFilter.value;
  const paymentValue = elements.expensePaymentFilter.value;
  const receiptValue = elements.expenseReceiptFilter.value;

  return state.expenses.filter((expense) => {
    const haystack = [
      expense.reference,
      getBusinessArea(expense.businessAreaId).label,
      getBusinessArea(expense.businessAreaId).shortLabel,
      expense.vendor,
      expense.category,
      expense.description,
      expense.paymentMethod,
      expense.notes
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchValue === "" || haystack.includes(searchValue);
    const matchesMonth = monthValue === "" || expense.date.startsWith(monthValue);
    const matchesArea = areaValue === "" || expense.businessAreaId === areaValue;
    const matchesCategory = categoryValue === "" || expense.category === categoryValue;
    const matchesPayment = paymentValue === "" || expense.paymentMethod === paymentValue;
    const matchesReceipt = receiptValue === "" || expense.receiptStatus === receiptValue;

    return (
      matchesSearch &&
      matchesMonth &&
      matchesArea &&
      matchesCategory &&
      matchesPayment &&
      matchesReceipt
    );
  });
}

function getFilteredSales() {
  const searchValue = normalizeText(elements.salesSearchFilter.value).toLowerCase();
  const monthValue = elements.salesMonthFilter.value;
  const areaValue = normalizeBusinessAreaId(elements.salesAreaFilter.value);

  return state.sales.filter((sale) => {
    const haystack = [
      getBusinessArea(sale.businessAreaId).label,
      getBusinessArea(sale.businessAreaId).shortLabel,
      sale.notes
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchValue === "" || haystack.includes(searchValue);
    const matchesMonth = monthValue === "" || sale.date.startsWith(monthValue);
    const matchesArea = areaValue === "" || sale.businessAreaId === areaValue;

    return matchesSearch && matchesMonth && matchesArea;
  });
}

function getFilteredRentals() {
  const searchValue = normalizeText(elements.rentalSearchFilter.value).toLowerCase();
  const monthValue = elements.rentalMonthFilter.value;
  const suiteValue = elements.rentalSuiteFilter.value;
  const statusValue = normalizeOccupancyStatus(elements.rentalStatusFilter.value);
  const alertValue = normalizeText(elements.rentalAlertFilter.value).toLowerCase();

  return state.rentals.filter((record) => {
    const haystack = [
      record.suite,
      record.occupancyStatus,
      record.tenantName,
      record.tenantPhone,
      record.tenantIdRef,
      record.notes
    ]
      .join(" ")
      .toLowerCase();
    const matchesSearch = searchValue === "" || haystack.includes(searchValue);
    const matchesMonth = monthValue === "" || record.month === monthValue;
    const matchesSuite = suiteValue === "" || record.suite === suiteValue;
    const matchesStatus = statusValue === "" || record.occupancyStatus === statusValue;
    const matchesAlert = alertValue === "" || hasMatchingRentalAlert(record, alertValue);

    return matchesSearch && matchesMonth && matchesSuite && matchesStatus && matchesAlert;
  });
}

function getFilteredPettyCash() {
  const searchValue = normalizeText(elements.pettyCashSearchFilter.value).toLowerCase();
  const monthValue = elements.pettyCashMonthFilter.value;
  const typeValue = elements.pettyCashTypeFilter.value;
  const areaValue = normalizeBusinessAreaId(elements.pettyCashAreaFilter.value);
  const receiptValue = elements.pettyCashReceiptFilter.value;

  return state.pettyCash.filter((entry) => {
    const haystack = [
      getPettyCashType(entry.transactionTypeId).label,
      getBusinessArea(entry.businessAreaId).label,
      getBusinessArea(entry.businessAreaId).shortLabel,
      entry.category,
      entry.vendor,
      entry.notes
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchValue === "" || haystack.includes(searchValue);
    const matchesMonth = monthValue === "" || entry.date.startsWith(monthValue);
    const matchesType = typeValue === "" || entry.transactionTypeId === typeValue;
    const matchesArea = areaValue === "" || entry.businessAreaId === areaValue;
    const matchesReceipt = receiptValue === "" || entry.receiptStatus === receiptValue;

    return matchesSearch && matchesMonth && matchesType && matchesArea && matchesReceipt;
  });
}

function buildRecentActivities() {
  const items = [
    ...state.expenses.map((expense) => ({
      sortKey: expense.updatedAt,
      module: "Expenses",
      title: `${expense.vendor} • ${formatCurrency(expense.amount)}`,
      detail: `${formatDisplayDate(expense.date)} • ${getBusinessArea(expense.businessAreaId).shortLabel}`,
      view: "expenses"
    })),
    ...state.sales.map((sale) => ({
      sortKey: sale.updatedAt,
      module: "Daily Sales",
      title: `${getBusinessArea(sale.businessAreaId).shortLabel} • ${formatCurrency(sale.amount)}`,
      detail: `${formatDisplayDate(sale.date)}${sale.notes ? ` • ${sale.notes}` : ""}`,
      view: "sales"
    })),
    ...state.rentals.map((record) => ({
      sortKey: record.updatedAt,
      module: "Apartments",
      title: `${record.suite} • ${formatCurrency(record.rentPaid)} paid`,
      detail: `${formatMonthLabel(record.month)} • Balance ${formatCurrency(getTotalTenantBalance(record))}`,
      view: "apartments"
    })),
    ...state.pettyCash.map((entry) => ({
      sortKey: entry.updatedAt,
      module: "Petty Cash",
      title: `${getPettyCashType(entry.transactionTypeId).label} • ${formatSignedCurrency(getPettyCashEffect(entry))}`,
      detail: `${formatDisplayDate(entry.date)} • ${entry.vendor}`,
      view: "petty-cash"
    })),
    ...state.salaryRecords.map((record) => ({
      sortKey: record.updatedAt,
      module: "Salary",
      title: `${record.staffName} • ${formatCurrency(record.amountPaid)} paid`,
      detail: `${formatMonthLabel(record.month)} • Balance ${formatCurrency(getSalaryBalance(record))}`,
      view: "salary"
    })),
    ...state.cashbookEntries.map((record) => ({
      sortKey: record.updatedAt,
      module: "Cashbook / Bankbook",
      title: `${record.accountName} • ${formatSignedCurrency(getCashbookEntryEffect(record))}`,
      detail: `${formatDisplayDate(record.entryDate)} • ${getCashbookEntryType(record.entryType).label}`,
      view: "cashbook"
    })),
    ...state.purchaseOrders.map((record) => ({
      sortKey: record.updatedAt,
      module: "Procurement",
      title: `${record.supplierName} • ${formatCurrency(record.totalAmount)}`,
      detail: `${formatDisplayDate(record.requestDate)} • ${record.status}`,
      view: "procurement"
    })),
    ...state.laundryTickets.map((record) => ({
      sortKey: record.updatedAt,
      module: "Laundry Tickets",
      title: `${record.customerName} • ${record.status}`,
      detail: `${formatDisplayDate(record.ticketDate)} • Balance ${formatCurrency(getLaundryBalance(record))}`,
      view: "laundry"
    })),
    ...state.equipmentRentalBookings.map((record) => ({
      sortKey: record.updatedAt,
      module: "Equipment Rentals",
      title: `${record.equipmentItem} • ${record.customerName}`,
      detail: `${formatDisplayDate(record.bookingDate)} • Balance ${formatCurrency(
        getEquipmentRentalBalance(record)
      )}`,
      view: "equipment-rentals"
    })),
    ...state.securityDepositRecords.map((record) => ({
      sortKey: record.updatedAt,
      module: "Deposits & Charges",
      title: `${record.tenantName} • ${record.suite}`,
      detail: `${formatDisplayDate(record.captureDate)} • Exposure ${formatCurrency(
        getSecurityDepositOutstanding(record) +
          getSecurityChargeOutstanding(record) +
          getSecurityRefundOutstanding(record)
      )}`,
      view: "deposits"
    })),
    ...state.ledgerEntries.map((record) => ({
      sortKey: record.updatedAt,
      module: "Ledgers",
      title: `${record.partyName} • ${getLedgerEntryType(record.entryType).label}`,
      detail: `${formatDisplayDate(record.entryDate)} • ${formatSignedCurrency(getLedgerEntryEffect(record))}`,
      view: "ledgers"
    })),
    ...state.mobileMoneyReconciliations.map((record) => ({
      sortKey: record.updatedAt,
      module: "Mobile Money",
      title: `${record.provider} • ${formatSignedCurrency(getMobileMoneyVariance(record))} variance`,
      detail: `${formatDisplayDate(record.date)} • Closing ${formatCurrency(record.closingCashCounted)}`,
      view: "mobile-money"
    })),
    ...state.suppliers.map((record) => ({
      sortKey: record.updatedAt,
      module: "Suppliers",
      title: `${record.supplierName} • ${formatCurrency(getSupplierOutstanding(record))} outstanding`,
      detail: `${formatDisplayDate(record.invoiceDate)} • ${getBusinessArea(record.businessAreaId).shortLabel}`,
      view: "suppliers"
    })),
    ...state.assetRecords.map((record) => ({
      sortKey: record.updatedAt,
      module: "Assets",
      title: `${record.assetName} • ${record.status}`,
      detail: `${formatDisplayDate(record.acquiredDate)} • ${getBusinessArea(record.businessAreaId).shortLabel}`,
      view: "assets"
    })),
    ...state.forecastPlans.map((record) => ({
      sortKey: record.updatedAt,
      module: "Forecast",
      title: `${getBusinessArea(record.businessAreaId).shortLabel} • ${formatCurrency(record.revenueTarget)} target`,
      detail: `${formatMonthLabel(record.month)} • Net target ${formatSignedCurrency(
        record.revenueTarget - record.expenseBudget - record.salaryBudget
      )}`,
      view: "forecast"
    })),
    ...state.recurringControls.map((record) => ({
      sortKey: record.updatedAt,
      module: "Recurring",
      title: `${getRecurringModuleLabel(record.moduleType)} • ${record.title}`,
      detail: `${record.nextDueDate ? formatDisplayDate(record.nextDueDate) : "No due date"} • ${
        record.active ? "Active" : "Paused"
      }`,
      view: "recurring"
    })),
    ...state.maintenanceRecords.map((record) => ({
      sortKey: record.updatedAt,
      module: "Maintenance",
      title: `${record.location || getBusinessArea(record.businessAreaId).shortLabel} • ${record.issue}`,
      detail: `${formatDisplayDate(record.reportedDate)} • ${record.status}`,
      view: "maintenance"
    })),
    ...state.userProfiles.map((record) => ({
      sortKey: record.updatedAt,
      module: "Access",
      title: `${record.fullName} • ${record.active ? "Active" : "Inactive"}`,
      detail: `${record.username} • ${USER_ROLE_OPTIONS.find((item) => item.value === record.role)?.label || record.role}`,
      view: "access"
    }))
  ];

  return items.sort((left, right) => (right.sortKey || "").localeCompare(left.sortKey || ""));
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("visible");

  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => {
    elements.toast.classList.remove("visible");
  }, 2600);
}

async function writeTextToClipboard(text, successMessage) {
  const normalizedText = normalizeText(text);

  if (!normalizedText) {
    showToast("There is nothing to copy right now.");
    return false;
  }

  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      await navigator.clipboard.writeText(text);
      showToast(successMessage);
      return true;
    }
  } catch (error) {
    console.error(error);
  }

  const helper = document.createElement("textarea");
  helper.value = text;
  helper.setAttribute("readonly", "");
  helper.style.position = "fixed";
  helper.style.opacity = "0";
  document.body.appendChild(helper);
  helper.select();

  try {
    document.execCommand("copy");
    showToast(successMessage);
    return true;
  } catch (error) {
    console.error(error);
    showToast("Copy is not available in this browser right now.");
    return false;
  } finally {
    document.body.removeChild(helper);
  }
}

function loadExpenses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return sortExpenses(
      parsed
        .filter((expense) => expense && typeof expense === "object")
        .map(sanitizeStoredExpense)
        .filter(Boolean)
    );
  } catch (error) {
    console.error(error);
    return [];
  }
}

function loadBudgets() {
  try {
    const raw = localStorage.getItem(BUDGET_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return sortBudgets(
      parsed
        .filter((budget) => budget && typeof budget === "object")
        .map(sanitizeStoredBudget)
        .filter(Boolean)
    );
  } catch (error) {
    console.error(error);
    return [];
  }
}

function loadSales() {
  try {
    const raw = localStorage.getItem(SALES_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return sortSales(
      parsed
        .filter((sale) => sale && typeof sale === "object")
        .map(sanitizeStoredSale)
        .filter(Boolean)
    );
  } catch (error) {
    console.error(error);
    return [];
  }
}

function loadRentals() {
  try {
    const raw = localStorage.getItem(RENTAL_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return sortRentals(
      parsed
        .filter((record) => record && typeof record === "object")
        .map(sanitizeStoredRental)
        .filter(Boolean)
    );
  } catch (error) {
    console.error(error);
    return [];
  }
}

function loadPettyCash() {
  try {
    const raw = localStorage.getItem(PETTY_CASH_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return sortPettyCash(
      parsed
        .filter((entry) => entry && typeof entry === "object")
        .map(sanitizeStoredPettyCash)
        .filter(Boolean)
    );
  } catch (error) {
    console.error(error);
    return [];
  }
}

function loadPettyCashBudgets() {
  try {
    const raw = localStorage.getItem(PETTY_CASH_BUDGET_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return sortPettyCashBudgets(
      parsed
        .filter((budget) => budget && typeof budget === "object")
        .map(sanitizeStoredPettyCashBudget)
        .filter(Boolean)
    );
  } catch (error) {
    console.error(error);
    return [];
  }
}

function loadSalaryRecords() {
  try {
    const raw = localStorage.getItem(SALARY_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return sortSalaryRecords(
      parsed
        .filter((record) => record && typeof record === "object")
        .map(sanitizeStoredSalaryRecord)
        .filter(Boolean)
    );
  } catch (error) {
    console.error(error);
    return [];
  }
}

function loadCashbookEntries() {
  try {
    const raw = localStorage.getItem(CASHBOOK_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return sortCashbookEntries(
      parsed
        .filter((record) => record && typeof record === "object")
        .map(sanitizeStoredCashbookEntry)
        .filter(Boolean)
    );
  } catch (error) {
    console.error(error);
    return [];
  }
}

function loadPurchaseOrders() {
  try {
    const raw = localStorage.getItem(PURCHASE_ORDER_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return sortPurchaseOrders(
      parsed
        .filter((record) => record && typeof record === "object")
        .map(sanitizeStoredPurchaseOrder)
        .filter(Boolean)
    );
  } catch (error) {
    console.error(error);
    return [];
  }
}

function loadLaundryTickets() {
  try {
    const raw = localStorage.getItem(LAUNDRY_TICKET_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return sortLaundryTickets(
      parsed
        .filter((record) => record && typeof record === "object")
        .map(sanitizeStoredLaundryTicket)
        .filter(Boolean)
    );
  } catch (error) {
    console.error(error);
    return [];
  }
}

function loadEquipmentRentalBookings() {
  try {
    const raw = localStorage.getItem(EQUIPMENT_RENTAL_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return sortEquipmentRentalBookings(
      parsed
        .filter((record) => record && typeof record === "object")
        .map(sanitizeStoredEquipmentRentalBooking)
        .filter(Boolean)
    );
  } catch (error) {
    console.error(error);
    return [];
  }
}

function loadSecurityDepositRecords() {
  try {
    const raw = localStorage.getItem(SECURITY_DEPOSIT_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return sortSecurityDepositRecords(
      parsed
        .filter((record) => record && typeof record === "object")
        .map(sanitizeStoredSecurityDepositRecord)
        .filter(Boolean)
    );
  } catch (error) {
    console.error(error);
    return [];
  }
}

function loadLedgerEntries() {
  try {
    const raw = localStorage.getItem(LEDGER_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return sortLedgerEntries(
      parsed
        .filter((record) => record && typeof record === "object")
        .map(sanitizeStoredLedgerEntry)
        .filter(Boolean)
    );
  } catch (error) {
    console.error(error);
    return [];
  }
}

function loadMobileMoneyReconciliations() {
  try {
    const raw = localStorage.getItem(MOBILE_MONEY_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return sortMobileMoneyReconciliations(
      parsed
        .filter((record) => record && typeof record === "object")
        .map(sanitizeStoredMobileMoneyRecord)
        .filter(Boolean)
    );
  } catch (error) {
    console.error(error);
    return [];
  }
}

function loadSuppliers() {
  try {
    const raw = localStorage.getItem(SUPPLIER_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return sortSuppliers(
      parsed
        .filter((record) => record && typeof record === "object")
        .map(sanitizeStoredSupplier)
        .filter(Boolean)
    );
  } catch (error) {
    console.error(error);
    return [];
  }
}

function loadAssetRecords() {
  try {
    const raw = localStorage.getItem(ASSET_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return sortAssetRecords(
      parsed
        .filter((record) => record && typeof record === "object")
        .map(sanitizeStoredAssetRecord)
        .filter(Boolean)
    );
  } catch (error) {
    console.error(error);
    return [];
  }
}

function loadForecastPlans() {
  try {
    const raw = localStorage.getItem(FORECAST_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return sortForecastPlans(
      parsed
        .filter((record) => record && typeof record === "object")
        .map(sanitizeStoredForecastPlan)
        .filter(Boolean)
    );
  } catch (error) {
    console.error(error);
    return [];
  }
}

function loadRecurringControls() {
  try {
    const raw = localStorage.getItem(RECURRING_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return sortRecurringControls(
      parsed
        .filter((record) => record && typeof record === "object")
        .map(sanitizeStoredRecurringControl)
        .filter(Boolean)
    );
  } catch (error) {
    console.error(error);
    return [];
  }
}

function loadMaintenanceRecords() {
  try {
    const raw = localStorage.getItem(MAINTENANCE_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return sortMaintenanceRecords(
      parsed
        .filter((record) => record && typeof record === "object")
        .map(sanitizeStoredMaintenanceRecord)
        .filter(Boolean)
    );
  } catch (error) {
    console.error(error);
    return [];
  }
}

function loadUserProfiles() {
  try {
    const raw = localStorage.getItem(USER_PROFILE_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return sortUserProfiles(
      parsed
        .filter((record) => record && typeof record === "object")
        .map(sanitizeStoredUserProfile)
        .filter(Boolean)
    );
  } catch (error) {
    console.error(error);
    return [];
  }
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error(error);
    return {};
  }
}

function sanitizeStoredExpense(expense) {
  const businessAreaId = normalizeBusinessAreaId(
    expense.businessAreaId || expense.businessArea || inferBusinessAreaId(expense)
  );
  const date = normalizeDateInput(expense.date);
  const amount = parseOptionalAmount(expense.amount);

  if (!businessAreaId || !date || amount <= 0) {
    return null;
  }

  return {
    id: expense.id || generateId(),
    reference: normalizeText(expense.reference) || buildReference(date),
    createdAt: expense.createdAt || new Date().toISOString(),
    updatedAt: expense.updatedAt || expense.createdAt || new Date().toISOString(),
    businessAreaId,
    date,
    vendor: normalizeText(expense.vendor || expense.payee) || "Unspecified Payee",
    category: sanitizeAreaChoice(businessAreaId, expense.category || expense.expenseType),
    description: normalizeText(expense.description),
    paymentMethod: normalizeText(expense.paymentMethod) || "Bank Transfer",
    receiptStatus: normalizeReceiptStatus(expense.receiptStatus),
    amount,
    notes: normalizeText(expense.notes),
    linkedPettyCashId: normalizeText(expense.linkedPettyCashId || expense.linkedPettyCash),
    generatedByRecurringId: normalizeText(expense.generatedByRecurringId)
  };
}

function sanitizeStoredBudget(budget) {
  const month = normalizeMonthInput(budget.month);
  const businessAreaId = normalizeBusinessAreaId(
    budget.businessAreaId || budget.businessArea || inferBusinessAreaId(budget)
  );
  const category = normalizeText(budget.category);
  const amount = Number(budget.amount);

  if (!month || !businessAreaId || !category || !Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return {
    id: budget.id || generateId(),
    month,
    businessAreaId,
    category: sanitizeAreaChoice(businessAreaId, category),
    amount: Number(amount.toFixed(2)),
    updatedAt: budget.updatedAt || new Date().toISOString()
  };
}

function sanitizeStoredSale(sale) {
  const businessAreaId = normalizeBusinessAreaId(
    sale.businessAreaId || sale.businessArea || inferBusinessAreaId(sale)
  );
  const date = normalizeDateInput(sale.date);
  const amount = Number(sale.amount);

  if (!businessAreaId || !date || !Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return {
    id: sale.id || generateId(),
    createdAt: sale.createdAt || new Date().toISOString(),
    updatedAt: sale.updatedAt || sale.createdAt || new Date().toISOString(),
    businessAreaId,
    date,
    amount: Number(amount.toFixed(2)),
    notes: normalizeText(sale.notes)
  };
}

function sanitizeStoredRental(record) {
  const month = normalizeMonthInput(record.month || record.billingMonth);
  const suite = normalizeSuite(record.suite || record.apartment || record.unit);

  if (!month || !suite) {
    return null;
  }

  const customBillItems = String(
    record.customBillItems || record.customBills || record.otherBills || ""
  ).trim();
  const occupancyStatus =
    normalizeOccupancyStatus(record.occupancyStatus || record.status) ||
    inferOccupancyStatus(
      {
        tenantName: record.tenantName || record.tenant || record.occupant,
        rentDue: parseOptionalAmount(record.rentDue),
        rentPaid: parseOptionalAmount(record.rentPaid),
        waterBill: parseOptionalAmount(record.waterBill),
        toiletBill: parseOptionalAmount(record.toiletBill),
        sweepingBill: parseOptionalAmount(record.sweepingBill || record.sweepingGutterBill),
        wasteBill: parseOptionalAmount(record.wasteBill || record.wasteManagementBill),
        customBillItems
      },
      null
    );
  const rentCycleType =
    normalizeRentCycleType(record.rentCycleType || record.cycleType || record.rentCycle) ||
    "custom";
  const rentCycleMonths = resolveRentCycleMonths(
    rentCycleType,
    parsePositiveInteger(record.rentCycleMonths || record.cycleMonths || record.durationMonths)
  );
  const waterBill = parseOptionalAmount(record.waterBill);
  const toiletBill = parseOptionalAmount(record.toiletBill);
  const sweepingBill = parseOptionalAmount(record.sweepingBill || record.sweepingGutterBill);
  const wasteBill = parseOptionalAmount(record.wasteBill || record.wasteManagementBill);
  const explicitBillsPaidRaw = record.billAmountPaid ?? record.totalBillsPaid ?? record.billsPaid;
  const explicitBillsPaidProvided = normalizeText(explicitBillsPaidRaw) !== "";

  const sanitized = finalizeRentalDraft({
    id: record.id || generateId(),
    createdAt: record.createdAt || new Date().toISOString(),
    updatedAt: record.updatedAt || record.createdAt || new Date().toISOString(),
    month,
    suite,
    occupancyStatus,
    tenantName: normalizeText(record.tenantName || record.tenant || record.occupant),
    tenantPhone: normalizeText(record.tenantPhone || record.phone),
    tenantAddress: normalizeText(record.tenantAddress || record.address),
    emergencyContact: normalizeText(record.emergencyContact || record.contactPerson),
    tenantIdRef: normalizeText(record.tenantIdRef || record.idReference || record.idRef),
    moveInDate: normalizeDateInput(record.moveInDate || record.checkInDate),
    moveOutDate: normalizeDateInput(record.moveOutDate || record.checkOutDate),
    rentCycleType,
    rentCycleMonths,
    rentCycleAmount: parseOptionalAmount(
      record.rentCycleAmount || record.cycleAmount || record.rentPlanAmount || record.rentDue
    ),
    rentDue: parseOptionalAmount(record.rentDue),
    rentPaid: parseOptionalAmount(record.rentPaid),
    rentCoverageStartDate: normalizeDateInput(record.rentCoverageStartDate || record.coverageStartDate),
    rentCoverageEndDate: normalizeDateInput(record.rentCoverageEndDate || record.coverageEndDate),
    nextRentDueDate: normalizeDateInput(record.nextRentDueDate || record.rentDueDate),
    renewalDate: normalizeDateInput(record.renewalDate || record.leaseRenewalDate),
    rentPaymentDate: normalizeDateInput(record.rentPaymentDate),
    rentPaymentMethod: normalizeText(record.rentPaymentMethod),
    rentPaymentReference: normalizeText(record.rentPaymentReference || record.rentReference),
    rentReceivedBy: normalizeText(record.rentReceivedBy),
    waterBill,
    toiletBill,
    sweepingBill,
    wasteBill,
    billDueDate: normalizeDateInput(record.billDueDate),
    billAmountPaid: explicitBillsPaidProvided ? parseOptionalAmount(explicitBillsPaidRaw) : 0,
    billPaymentDate: normalizeDateInput(record.billPaymentDate),
    billPaymentMethod: normalizeText(record.billPaymentMethod),
    billPaymentReference: normalizeText(record.billPaymentReference || record.billReference),
    billReceivedBy: normalizeText(record.billReceivedBy),
    arrearsBroughtForward: parseOptionalAmount(record.arrearsBroughtForward || record.arrears),
    lateFee: parseOptionalAmount(record.lateFee || record.penalty),
    customBillItems,
    notes: normalizeText(record.notes),
    agreementGeneratedAt: normalizeText(record.agreementGeneratedAt)
  });

  return sanitized;
}

function sanitizeStoredPettyCash(entry) {
  const date = normalizeDateInput(entry.date);
  const transactionTypeId = normalizeText(entry.transactionTypeId || entry.type || entry.transactionType);
  const type = getPettyCashType(transactionTypeId);
  const amount = parseOptionalAmount(entry.amount);

  if (!date || !type.id || amount <= 0) {
    return null;
  }

  return {
    id: entry.id || generateId(),
    createdAt: entry.createdAt || new Date().toISOString(),
    updatedAt: entry.updatedAt || entry.createdAt || new Date().toISOString(),
    date,
    transactionTypeId: type.id,
    businessAreaId:
      normalizeBusinessAreaId(entry.businessAreaId || entry.businessArea || inferBusinessAreaId(entry)) ||
      DEFAULT_BUSINESS_AREA_ID,
    category: type.isExpense
      ? sanitizeAreaChoice(
          normalizeBusinessAreaId(entry.businessAreaId || entry.businessArea || inferBusinessAreaId(entry)),
          entry.category || entry.expenseType
        )
      : "",
    vendor: normalizeText(entry.vendor || entry.payee || entry.purpose) || "Unspecified Purpose",
    receiptStatus: normalizeReceiptStatus(entry.receiptStatus),
    amount,
    notes: normalizeText(entry.notes),
    linkedExpenseId: normalizeText(entry.linkedExpenseId || entry.linkedExpense)
  };
}

function sanitizeStoredPettyCashBudget(budget) {
  const month = normalizeMonthInput(budget.month);
  const businessAreaId = normalizeBusinessAreaId(
    budget.businessAreaId || budget.businessArea || inferBusinessAreaId(budget)
  );
  const amount = Number(budget.amount);

  if (!month || !businessAreaId || !Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return {
    id: budget.id || generateId(),
    month,
    businessAreaId,
    amount: Number(amount.toFixed(2)),
    notes: normalizeText(budget.notes),
    updatedAt: budget.updatedAt || new Date().toISOString()
  };
}

function sanitizeStoredSalaryRecord(record) {
  const month = normalizeMonthInput(record.month || record.payrollMonth);
  const businessAreaId = normalizeBusinessAreaId(
    record.businessAreaId || record.businessArea || inferBusinessAreaId(record)
  );
  const staffName = normalizeText(record.staffName || record.staff || record.employeeName);
  const salaryType = normalizeSalaryType(record.salaryType || record.type);
  const grossAmount = parseOptionalAmount(record.grossAmount || record.grossSalary || record.amountDue);
  const deductionAmount = parseOptionalAmount(record.deductionAmount || record.deductions);
  const amountPaid = parseOptionalAmount(record.amountPaid || record.paidAmount);
  const kpiTarget = parseOptionalAmountOrNull(record.kpiTarget ?? record.targetValue ?? record.kpiGoal);
  const kpiActual = parseOptionalAmountOrNull(
    record.kpiActual ?? record.actualValue ?? record.kpiMeasurement ?? record.measuredValue
  );

  if (!month || !businessAreaId || !staffName || !salaryType || grossAmount <= 0) {
    return null;
  }

  return {
    id: record.id || generateId(),
    createdAt: record.createdAt || new Date().toISOString(),
    updatedAt: record.updatedAt || record.createdAt || new Date().toISOString(),
    month,
    businessAreaId,
    staffName,
    roleTitle: normalizeText(record.roleTitle || record.role || record.position),
    salaryType,
    grossAmount,
    deductionAmount,
    amountPaid,
    dueDate: normalizeDateInput(record.dueDate),
    paymentDate: normalizeDateInput(record.paymentDate),
    paymentMethod: normalizeText(record.paymentMethod),
    paymentReference: normalizeText(record.paymentReference || record.reference),
    kpiMetric: normalizeText(record.kpiMetric || record.kpiName || record.performanceMetric),
    kpiUnit: normalizeText(record.kpiUnit || record.measurementUnit || record.unit),
    kpiTarget,
    kpiActual,
    notes: normalizeText(record.notes)
  };
}

function sanitizeStoredCashbookEntry(record) {
  const entryDate = normalizeDateInput(record.entryDate || record.date);
  const accountType = normalizeCashbookAccountType(record.accountType || record.bookType);
  const accountName = normalizeText(record.accountName || record.account || record.bankName);
  const businessAreaId =
    normalizeBusinessAreaId(record.businessAreaId || record.businessArea || inferBusinessAreaId(record)) ||
    DEFAULT_BUSINESS_AREA_ID;
  const entryType = normalizeCashbookEntryType(record.entryType || record.type);
  const amount = parseOptionalAmount(record.amount);
  const linkedEntryId = normalizeText(record.linkedEntryId || record.pairedEntryId || record.mirrorEntryId);
  const linkedAccountType = normalizeCashbookAccountType(
    record.linkedAccountType || record.destinationAccountType || record.transferAccountType
  );
  const linkedAccountName = normalizeText(
    record.linkedAccountName || record.destinationAccountName || record.transferAccountName
  );
  const transferGroupId = normalizeText(record.transferGroupId || record.transferBatchId);
  const pairedTransfer = Boolean(
    record.pairedTransfer === true ||
      record.pairedTransfer === "true" ||
      record.pairedTransfer === 1 ||
      record.pairedTransfer === "1" ||
      linkedEntryId
  );

  if (!entryDate || !accountType || !accountName || !businessAreaId || !entryType || amount <= 0) {
    return null;
  }

  return {
    id: record.id || generateId(),
    createdAt: record.createdAt || new Date().toISOString(),
    updatedAt: record.updatedAt || record.createdAt || new Date().toISOString(),
    entryDate,
    accountType,
    accountName,
    businessAreaId,
    entryType,
    amount,
    counterparty: normalizeText(record.counterparty || record.party || record.source || record.payee),
    reference: normalizeText(record.reference || record.ref),
    notes: normalizeText(record.notes),
    linkedEntryId,
    linkedAccountType,
    linkedAccountName,
    transferGroupId,
    pairedTransfer
  };
}

function sanitizeStoredPurchaseOrder(record) {
  const requestDate = normalizeDateInput(record.requestDate || record.date);
  const businessAreaId =
    normalizeBusinessAreaId(record.businessAreaId || record.businessArea || inferBusinessAreaId(record)) ||
    DEFAULT_BUSINESS_AREA_ID;
  const supplierName = normalizeText(record.supplierName || record.supplier || record.vendor);
  const itemDescription = normalizeText(record.itemDescription || record.item || record.description);
  const quantity = Math.max(parsePositiveInteger(record.quantity), 1);
  const unitCost = parseOptionalAmount(record.unitCost || record.rate);
  const explicitTotal = parseOptionalAmount(record.totalAmount || record.total || record.amountDue || record.amount);
  const totalAmount = explicitTotal > 0 ? explicitTotal : Number((quantity * unitCost).toFixed(2));

  if (!requestDate || !businessAreaId || !supplierName || !itemDescription || totalAmount <= 0) {
    return null;
  }

  return {
    id: record.id || generateId(),
    createdAt: record.createdAt || new Date().toISOString(),
    updatedAt: record.updatedAt || record.createdAt || new Date().toISOString(),
    requestDate,
    businessAreaId,
    requester: normalizeText(record.requester || record.requestedBy),
    supplierName,
    supplierPhone: normalizeText(record.supplierPhone || record.phone),
    itemDescription,
    quantity,
    unitCost,
    totalAmount,
    amountPaid: parseOptionalAmount(record.amountPaid || record.paidAmount),
    expectedDate: normalizeDateInput(record.expectedDate || record.dueDate || record.deliveryDate),
    status: normalizePurchaseOrderStatus(record.status),
    notes: normalizeText(record.notes)
  };
}

function sanitizeStoredLaundryTicket(record) {
  const ticketDate = normalizeDateInput(record.ticketDate || record.date);
  const customerName = normalizeText(record.customerName || record.customer);
  const itemSummary = normalizeText(record.itemSummary || record.items || record.description);
  const amountDue = parseOptionalAmount(record.amountDue || record.totalAmount || record.amount);

  if (!ticketDate || !customerName || !itemSummary || amountDue <= 0) {
    return null;
  }

  return {
    id: record.id || generateId(),
    createdAt: record.createdAt || new Date().toISOString(),
    updatedAt: record.updatedAt || record.createdAt || new Date().toISOString(),
    ticketDate,
    businessAreaId: "laundry-services",
    customerName,
    customerPhone: normalizeText(record.customerPhone || record.phone),
    serviceType: normalizeLaundryServiceType(record.serviceType || record.service),
    itemSummary,
    pieces: Math.max(parsePositiveInteger(record.pieces || record.quantity), 1),
    amountDue,
    amountPaid: parseOptionalAmount(record.amountPaid || record.paidAmount),
    dueDate: normalizeDateInput(record.dueDate),
    readyDate: normalizeDateInput(record.readyDate),
    deliveryMode: normalizeLaundryDeliveryMode(record.deliveryMode || record.delivery),
    status: normalizeLaundryStatus(record.status),
    notes: normalizeText(record.notes)
  };
}

function sanitizeStoredEquipmentRentalBooking(record) {
  const bookingDate = normalizeDateInput(record.bookingDate || record.date);
  const equipmentItem = normalizeText(record.equipmentItem || record.item);
  const customerName = normalizeText(record.customerName || record.customer);
  const rentalFee = parseOptionalAmount(record.rentalFee || record.amountDue || record.amount);

  if (!bookingDate || !equipmentItem || !customerName || rentalFee <= 0) {
    return null;
  }

  return {
    id: record.id || generateId(),
    createdAt: record.createdAt || new Date().toISOString(),
    updatedAt: record.updatedAt || record.createdAt || new Date().toISOString(),
    bookingDate,
    businessAreaId: "water-equipment",
    equipmentItem,
    customerName,
    customerPhone: normalizeText(record.customerPhone || record.phone),
    rentalFee,
    amountPaid: parseOptionalAmount(record.amountPaid || record.paidAmount),
    depositAmount: parseOptionalAmount(record.depositAmount || record.depositHeld),
    damageCharge: parseOptionalAmount(record.damageCharge),
    outDate: normalizeDateInput(record.outDate),
    dueDate: normalizeDateInput(record.dueDate),
    returnDate: normalizeDateInput(record.returnDate),
    status: normalizeEquipmentRentalStatus(record.status),
    conditionOut: normalizeEquipmentCondition(record.conditionOut),
    conditionIn: normalizeEquipmentCondition(record.conditionIn),
    reference: normalizeText(record.reference || record.ref),
    notes: normalizeText(record.notes)
  };
}

function sanitizeStoredSecurityDepositRecord(record) {
  const captureDate = normalizeDateInput(record.captureDate || record.date);
  const suite = normalizeSuite(record.suite || record.apartment || record.unit);
  const tenantName = normalizeText(record.tenantName || record.tenant);

  if (!captureDate || !suite || !tenantName) {
    return null;
  }

  return {
    id: record.id || generateId(),
    createdAt: record.createdAt || new Date().toISOString(),
    updatedAt: record.updatedAt || record.createdAt || new Date().toISOString(),
    captureDate,
    suite,
    tenantName,
    tenantPhone: normalizeText(record.tenantPhone || record.phone),
    depositExpected: parseOptionalAmount(record.depositExpected),
    depositPaid: parseOptionalAmount(record.depositPaid),
    chargesRaised: parseOptionalAmount(record.chargesRaised),
    chargesPaid: parseOptionalAmount(record.chargesPaid),
    deductionFromDeposit: parseOptionalAmount(record.deductionFromDeposit),
    refundDue: parseOptionalAmount(record.refundDue),
    refundPaid: parseOptionalAmount(record.refundPaid),
    depositDueDate: normalizeDateInput(record.depositDueDate),
    refundDueDate: normalizeDateInput(record.refundDueDate),
    status: normalizeSecurityDepositStatus(record.status),
    notes: normalizeText(record.notes)
  };
}

function sanitizeStoredLedgerEntry(record) {
  const entryDate = normalizeDateInput(record.entryDate || record.date);
  const businessAreaId = normalizeBusinessAreaId(
    record.businessAreaId || record.businessArea || inferBusinessAreaId(record)
  );
  const partyType = normalizeLedgerPartyType(record.partyType || record.accountType);
  const entryType = normalizeLedgerEntryType(record.entryType || record.type);
  const amount = parseOptionalAmount(record.amount);

  if (!entryDate || !businessAreaId || !partyType || !entryType || !normalizeText(record.partyName) || amount <= 0) {
    return null;
  }

  return {
    id: record.id || generateId(),
    createdAt: record.createdAt || new Date().toISOString(),
    updatedAt: record.updatedAt || record.createdAt || new Date().toISOString(),
    entryDate,
    businessAreaId,
    partyType,
    partyName: normalizeText(record.partyName),
    partyPhone: normalizeText(record.partyPhone || record.phone),
    suite: normalizeText(record.suite || record.accountRef),
    entryType,
    amount,
    dueDate: normalizeDateInput(record.dueDate),
    reference: normalizeText(record.reference || record.ref),
    notes: normalizeText(record.notes)
  };
}

function sanitizeStoredMobileMoneyRecord(record) {
  const date = normalizeDateInput(record.date);
  const provider = normalizeText(record.provider);

  if (!date || !provider) {
    return null;
  }

  return {
    id: record.id || generateId(),
    createdAt: record.createdAt || new Date().toISOString(),
    updatedAt: record.updatedAt || record.createdAt || new Date().toISOString(),
    date,
    provider,
    openingCash: parseOptionalAmount(record.openingCash),
    cashTopUp: parseOptionalAmount(record.cashTopUp),
    cashRemoved: parseOptionalAmount(record.cashRemoved),
    cashInValue: parseOptionalAmount(record.cashInValue),
    cashOutValue: parseOptionalAmount(record.cashOutValue),
    serviceFees: parseOptionalAmount(record.serviceFees),
    operatingExpense: parseOptionalAmount(record.operatingExpense),
    closingCashCounted: parseOptionalAmount(record.closingCashCounted),
    notes: normalizeText(record.notes)
  };
}

function sanitizeStoredSupplier(record) {
  const businessAreaId = normalizeBusinessAreaId(
    record.businessAreaId || record.businessArea || inferBusinessAreaId(record)
  );
  const invoiceDate = normalizeDateInput(record.invoiceDate || record.date);
  const amountDue = parseOptionalAmount(record.amountDue || record.totalDue || record.amount);
  const amountPaid = parseOptionalAmount(record.amountPaid || record.paidAmount);

  if (!businessAreaId || !invoiceDate || amountDue <= 0) {
    return null;
  }

  return {
    id: record.id || generateId(),
    createdAt: record.createdAt || new Date().toISOString(),
    updatedAt: record.updatedAt || record.createdAt || new Date().toISOString(),
    invoiceDate,
    businessAreaId,
    supplierName: normalizeText(record.supplierName || record.supplier || record.vendor) || "Unspecified Supplier",
    category: sanitizeAreaChoice(businessAreaId, record.category || record.expenseType),
    itemDescription: normalizeText(record.itemDescription || record.description || record.item),
    invoiceReference: normalizeText(record.invoiceReference || record.reference || record.invoiceNo),
    amountDue,
    amountPaid,
    dueDate: normalizeDateInput(record.dueDate),
    paymentDate: normalizeDateInput(record.paymentDate),
    paymentMethod: normalizeText(record.paymentMethod),
    notes: normalizeText(record.notes),
    generatedByRecurringId: normalizeText(record.generatedByRecurringId)
  };
}

function sanitizeStoredAssetRecord(record) {
  const acquiredDate = normalizeDateInput(record.acquiredDate || record.date);
  const businessAreaId = normalizeBusinessAreaId(
    record.businessAreaId || record.businessArea || inferBusinessAreaId(record)
  );
  const assetName = normalizeText(record.assetName || record.name);
  const assetCategory = normalizeText(record.assetCategory || record.category);
  const purchaseCost = parseOptionalAmount(record.purchaseCost || record.cost);

  if (!acquiredDate || !businessAreaId || !assetName || !assetCategory || purchaseCost <= 0) {
    return null;
  }

  return {
    id: record.id || generateId(),
    createdAt: record.createdAt || new Date().toISOString(),
    updatedAt: record.updatedAt || record.createdAt || new Date().toISOString(),
    acquiredDate,
    businessAreaId,
    assetName,
    assetCategory,
    location: normalizeText(record.location),
    purchaseCost,
    currentValue: parseOptionalAmount(record.currentValue || record.bookValue || purchaseCost),
    condition: normalizeText(record.condition) || "Good",
    status: normalizeText(record.status) || "In Use",
    nextServiceDate: normalizeDateInput(record.nextServiceDate || record.serviceDueDate),
    notes: normalizeText(record.notes)
  };
}

function sanitizeStoredForecastPlan(record) {
  const month = normalizeMonthInput(record.month);
  const businessAreaId = normalizeBusinessAreaId(
    record.businessAreaId || record.businessArea || inferBusinessAreaId(record)
  );
  const revenueTarget = parseOptionalAmount(record.revenueTarget || record.salesTarget);

  if (!month || !businessAreaId || revenueTarget <= 0) {
    return null;
  }

  return {
    id: record.id || generateId(),
    createdAt: record.createdAt || new Date().toISOString(),
    updatedAt: record.updatedAt || record.createdAt || new Date().toISOString(),
    month,
    businessAreaId,
    revenueTarget,
    expenseBudget: parseOptionalAmount(record.expenseBudget),
    salaryBudget: parseOptionalAmount(record.salaryBudget),
    notes: normalizeText(record.notes)
  };
}

function sanitizeStoredRecurringControl(record) {
  const moduleType = normalizeRecurringModuleType(record.moduleType || record.module || record.type);
  const businessAreaId =
    normalizeBusinessAreaId(record.businessAreaId || record.businessArea || inferBusinessAreaId(record)) ||
    DEFAULT_BUSINESS_AREA_ID;
  const nextDueDate = normalizeDateInput(record.nextDueDate || record.dueDate);

  if (!normalizeText(record.title) || !moduleType || !nextDueDate) {
    return null;
  }

  return {
    id: record.id || generateId(),
    createdAt: record.createdAt || new Date().toISOString(),
    updatedAt: record.updatedAt || record.createdAt || new Date().toISOString(),
    title: normalizeText(record.title),
    moduleType,
    businessAreaId: moduleType === "apartment-bill" ? "rentals-apartments" : businessAreaId,
    category: ["expense", "supplier-bill"].includes(moduleType)
      ? sanitizeAreaChoice(businessAreaId, record.category || record.expenseType)
      : "",
    counterparty: normalizeText(record.counterparty || record.vendor || record.supplier),
    suite: normalizeSuite(record.suite || record.location),
    amount: parseOptionalAmount(record.amount),
    frequency: normalizeRecurringFrequency(record.frequency) || "monthly",
    startDate: normalizeDateInput(record.startDate),
    nextDueDate,
    lastGeneratedDate: normalizeDateInput(record.lastGeneratedDate),
    priority: moduleType === "maintenance-task" ? normalizeMaintenancePriority(record.priority) : "",
    active: Boolean(
      normalizeText(record.activeState || record.state).toLowerCase() === "active" ||
        record.active === true ||
        record.active === "true" ||
        record.active === 1 ||
        record.active === "1" ||
        record.active === undefined
    ),
    notes: normalizeText(record.notes)
  };
}

function sanitizeStoredMaintenanceRecord(record) {
  const businessAreaId = normalizeBusinessAreaId(
    record.businessAreaId || record.businessArea || inferBusinessAreaId(record)
  );
  const reportedDate = normalizeDateInput(record.reportedDate || record.date);

  if (!businessAreaId || !reportedDate || !normalizeText(record.issue || record.task || record.description)) {
    return null;
  }

  return {
    id: record.id || generateId(),
    createdAt: record.createdAt || new Date().toISOString(),
    updatedAt: record.updatedAt || record.createdAt || new Date().toISOString(),
    reportedDate,
    businessAreaId,
    location: normalizeText(record.location || record.suite),
    assetItem: normalizeText(record.assetItem || record.asset || record.item),
    issue: normalizeText(record.issue || record.task || record.description),
    priority: normalizeMaintenancePriority(record.priority) || "Medium",
    status: normalizeMaintenanceStatus(record.status) || "Open",
    dueDate: normalizeDateInput(record.dueDate),
    estimatedCost: parseOptionalAmount(record.estimatedCost || record.costEstimate),
    actualCost: parseOptionalAmount(record.actualCost || record.cost),
    vendor: normalizeText(record.vendor || record.technician),
    notes: normalizeText(record.notes),
    generatedByRecurringId: normalizeText(record.generatedByRecurringId)
  };
}

function sanitizeStoredUserProfile(record) {
  const fullName = normalizeText(record.fullName || record.name);
  const username = normalizeText(record.username || record.user).toLowerCase();
  const role = normalizeText(record.role).toLowerCase();
  const passwordHash = normalizeText(
    record.passwordHash || record.passwordDigest || record.passwordToken || record.password_signature
  );
  const loginEnabled = Boolean(
    record.loginEnabled === true ||
      record.loginEnabled === "true" ||
      record.loginEnabled === 1 ||
      record.loginEnabled === "1" ||
      normalizeText(record.loginMode).toLowerCase() === "password-required" ||
      passwordHash
  );

  if (!fullName || !username || !ROLE_PRESET_MAP[role]) {
    return null;
  }

  return {
    id: record.id || generateId(),
    createdAt: record.createdAt || new Date().toISOString(),
    updatedAt: record.updatedAt || record.createdAt || new Date().toISOString(),
    fullName,
    username,
    role,
    phone: normalizeText(record.phone),
    active: Boolean(
      record.active === true ||
        record.active === "true" ||
        record.active === 1 ||
        record.active === "1" ||
        normalizeText(record.activeState).toLowerCase() === "active" ||
        record.active === undefined
    ),
    loginEnabled,
    passwordHash,
    notes: normalizeText(record.notes)
  };
}

function persistExpenses() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.expenses));
}

function persistSettings() {
  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify({ currency: state.currency, activeUserId: state.activeUserId })
  );
}

function persistBudgets() {
  localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(state.budgets));
}

function persistSales() {
  localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(state.sales));
}

function persistRentals() {
  localStorage.setItem(RENTAL_STORAGE_KEY, JSON.stringify(state.rentals));
}

function persistPettyCash() {
  localStorage.setItem(PETTY_CASH_STORAGE_KEY, JSON.stringify(state.pettyCash));
}

function persistPettyCashBudgets() {
  localStorage.setItem(PETTY_CASH_BUDGET_STORAGE_KEY, JSON.stringify(state.pettyCashBudgets));
}

function persistSalaryRecords() {
  localStorage.setItem(SALARY_STORAGE_KEY, JSON.stringify(state.salaryRecords));
}

function persistCashbookEntries() {
  localStorage.setItem(CASHBOOK_STORAGE_KEY, JSON.stringify(state.cashbookEntries));
}

function persistPurchaseOrders() {
  localStorage.setItem(PURCHASE_ORDER_STORAGE_KEY, JSON.stringify(state.purchaseOrders));
}

function persistLaundryTickets() {
  localStorage.setItem(LAUNDRY_TICKET_STORAGE_KEY, JSON.stringify(state.laundryTickets));
}

function persistEquipmentRentalBookings() {
  localStorage.setItem(
    EQUIPMENT_RENTAL_STORAGE_KEY,
    JSON.stringify(state.equipmentRentalBookings)
  );
}

function persistSecurityDepositRecords() {
  localStorage.setItem(
    SECURITY_DEPOSIT_STORAGE_KEY,
    JSON.stringify(state.securityDepositRecords)
  );
}

function persistLedgerEntries() {
  localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(state.ledgerEntries));
}

function persistMobileMoneyReconciliations() {
  localStorage.setItem(
    MOBILE_MONEY_STORAGE_KEY,
    JSON.stringify(state.mobileMoneyReconciliations)
  );
}

function persistSuppliers() {
  localStorage.setItem(SUPPLIER_STORAGE_KEY, JSON.stringify(state.suppliers));
}

function persistAssetRecords() {
  localStorage.setItem(ASSET_STORAGE_KEY, JSON.stringify(state.assetRecords));
}

function persistForecastPlans() {
  localStorage.setItem(FORECAST_STORAGE_KEY, JSON.stringify(state.forecastPlans));
}

function persistRecurringControls() {
  localStorage.setItem(RECURRING_STORAGE_KEY, JSON.stringify(state.recurringControls));
}

function persistMaintenanceRecords() {
  localStorage.setItem(MAINTENANCE_STORAGE_KEY, JSON.stringify(state.maintenanceRecords));
}

function persistUserProfiles() {
  localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(state.userProfiles));
}

function persistAllData() {
  persistExpenses();
  persistBudgets();
  persistSales();
  persistRentals();
  persistPettyCash();
  persistPettyCashBudgets();
  persistSalaryRecords();
  persistCashbookEntries();
  persistPurchaseOrders();
  persistLaundryTickets();
  persistEquipmentRentalBookings();
  persistSecurityDepositRecords();
  persistLedgerEntries();
  persistMobileMoneyReconciliations();
  persistSuppliers();
  persistAssetRecords();
  persistForecastPlans();
  persistRecurringControls();
  persistMaintenanceRecords();
  persistUserProfiles();
  persistSettings();
}

function sanitizeImportedBackup(payload) {
  const root = payload && typeof payload === "object" ? payload : {};
  const workspace =
    root.workspace && typeof root.workspace === "object" ? root.workspace : root;
  const settings = root.settings && typeof root.settings === "object" ? root.settings : {};
  const allowedCurrencies = new Set(CURRENCY_OPTIONS.map((option) => option.code));
  const currency = allowedCurrencies.has(settings.currency) ? settings.currency : "GHS";
  const userProfiles = sortUserProfiles(
    sanitizeImportedCollection(workspace.userProfiles, sanitizeStoredUserProfile)
  );
  const activeUserId =
    normalizeText(settings.activeUserId) ||
    normalizeText(root.activeUserId) ||
    normalizeText(userProfiles[0]?.id);

  return {
    exportedAt: normalizeText(root.exportedAt),
    currency,
    activeUserId,
    expenses: sortExpenses(sanitizeImportedCollection(workspace.expenses, sanitizeStoredExpense)),
    budgets: sortBudgets(sanitizeImportedCollection(workspace.budgets, sanitizeStoredBudget)),
    sales: sortSales(sanitizeImportedCollection(workspace.sales, sanitizeStoredSale)),
    rentals: sortRentals(sanitizeImportedCollection(workspace.rentals, sanitizeStoredRental)),
    pettyCash: sortPettyCash(
      sanitizeImportedCollection(workspace.pettyCash, sanitizeStoredPettyCash)
    ),
    pettyCashBudgets: sortPettyCashBudgets(
      sanitizeImportedCollection(workspace.pettyCashBudgets, sanitizeStoredPettyCashBudget)
    ),
    salaryRecords: sortSalaryRecords(
      sanitizeImportedCollection(workspace.salaryRecords, sanitizeStoredSalaryRecord)
    ),
    cashbookEntries: sortCashbookEntries(
      sanitizeImportedCollection(workspace.cashbookEntries, sanitizeStoredCashbookEntry)
    ),
    purchaseOrders: sortPurchaseOrders(
      sanitizeImportedCollection(workspace.purchaseOrders, sanitizeStoredPurchaseOrder)
    ),
    laundryTickets: sortLaundryTickets(
      sanitizeImportedCollection(workspace.laundryTickets, sanitizeStoredLaundryTicket)
    ),
    equipmentRentalBookings: sortEquipmentRentalBookings(
      sanitizeImportedCollection(
        workspace.equipmentRentalBookings,
        sanitizeStoredEquipmentRentalBooking
      )
    ),
    securityDepositRecords: sortSecurityDepositRecords(
      sanitizeImportedCollection(
        workspace.securityDepositRecords,
        sanitizeStoredSecurityDepositRecord
      )
    ),
    ledgerEntries: sortLedgerEntries(
      sanitizeImportedCollection(workspace.ledgerEntries, sanitizeStoredLedgerEntry)
    ),
    mobileMoneyReconciliations: sortMobileMoneyReconciliations(
      sanitizeImportedCollection(
        workspace.mobileMoneyReconciliations,
        sanitizeStoredMobileMoneyRecord
      )
    ),
    suppliers: sortSuppliers(
      sanitizeImportedCollection(workspace.suppliers, sanitizeStoredSupplier)
    ),
    assetRecords: sortAssetRecords(
      sanitizeImportedCollection(workspace.assetRecords, sanitizeStoredAssetRecord)
    ),
    forecastPlans: sortForecastPlans(
      sanitizeImportedCollection(workspace.forecastPlans, sanitizeStoredForecastPlan)
    ),
    recurringControls: sortRecurringControls(
      sanitizeImportedCollection(workspace.recurringControls, sanitizeStoredRecurringControl)
    ),
    maintenanceRecords: sortMaintenanceRecords(
      sanitizeImportedCollection(workspace.maintenanceRecords, sanitizeStoredMaintenanceRecord)
    ),
    userProfiles
  };
}

function sanitizeImportedCollection(items, sanitizer) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter((item) => item && typeof item === "object")
    .map(sanitizer)
    .filter(Boolean);
}

function getWorkspaceRecordTotal(workspace = state) {
  return (
    (workspace.expenses?.length || 0) +
    (workspace.budgets?.length || 0) +
    (workspace.sales?.length || 0) +
    (workspace.rentals?.length || 0) +
    (workspace.pettyCash?.length || 0) +
    (workspace.pettyCashBudgets?.length || 0) +
    (workspace.salaryRecords?.length || 0) +
    (workspace.cashbookEntries?.length || 0) +
    (workspace.purchaseOrders?.length || 0) +
    (workspace.laundryTickets?.length || 0) +
    (workspace.equipmentRentalBookings?.length || 0) +
    (workspace.securityDepositRecords?.length || 0) +
    (workspace.ledgerEntries?.length || 0) +
    (workspace.mobileMoneyReconciliations?.length || 0) +
    (workspace.suppliers?.length || 0) +
    (workspace.assetRecords?.length || 0) +
    (workspace.forecastPlans?.length || 0) +
    (workspace.recurringControls?.length || 0) +
    (workspace.maintenanceRecords?.length || 0) +
    (workspace.userProfiles?.length || 0)
  );
}

async function importWorkbookFile(file) {
  if (typeof window.JSZip === "undefined") {
    throw new Error("Workbook import library is not available.");
  }

  const zip = await window.JSZip.loadAsync(await file.arrayBuffer());
  const sharedStrings = await loadWorkbookSharedStrings(zip);
  const sheetPaths = await loadWorkbookSheetPaths(zip);
  const [
    expenseRows,
    budgetRows,
    salesRows,
    rentalRows,
    pettyCashRows,
    pettyCashBudgetRows,
    salaryRows,
    supplierRows,
    recurringRows,
    maintenanceRows
  ] = await Promise.all([
    loadWorkbookSheetRows(zip, sheetPaths, "Expenses", sharedStrings),
    loadWorkbookSheetRows(zip, sheetPaths, "Budget_Planner", sharedStrings),
    loadWorkbookSheetRows(zip, sheetPaths, "Daily_Sales", sharedStrings),
    loadWorkbookSheetRows(zip, sheetPaths, "Apartments", sharedStrings),
    loadWorkbookSheetRows(zip, sheetPaths, "Petty_Cash", sharedStrings),
    loadWorkbookSheetRows(zip, sheetPaths, "Petty_Cash_Budget", sharedStrings),
    loadWorkbookSheetRows(zip, sheetPaths, "Salary_Register", sharedStrings),
    loadWorkbookSheetRows(zip, sheetPaths, "Supplier_Ledger", sharedStrings),
    loadWorkbookSheetRows(zip, sheetPaths, "Recurring_Controls", sharedStrings),
    loadWorkbookSheetRows(zip, sheetPaths, "Maintenance_Log", sharedStrings)
  ]);

  return {
    expenses: parseWorkbookExpenseRows(expenseRows),
    budgets: parseWorkbookBudgetRows(budgetRows),
    sales: parseWorkbookSalesRows(salesRows),
    rentals: parseWorkbookRentalRows(rentalRows),
    pettyCash: parseWorkbookPettyCashRows(pettyCashRows),
    pettyCashBudgets: parseWorkbookPettyCashBudgetRows(pettyCashBudgetRows),
    salaryRecords: parseWorkbookSalaryRows(salaryRows),
    suppliers: parseWorkbookSupplierRows(supplierRows),
    recurringControls: parseWorkbookRecurringRows(recurringRows),
    maintenanceRecords: parseWorkbookMaintenanceRows(maintenanceRows)
  };
}

async function loadWorkbookSharedStrings(zip) {
  const sharedStringsXml = await readZipText(zip, "xl/sharedStrings.xml");

  if (!sharedStringsXml) {
    return [];
  }

  const document = parseXmlDocument(sharedStringsXml);

  return getXmlChildrenByLocalName(document.documentElement, "si").map(extractSharedStringText);
}

async function loadWorkbookSheetPaths(zip) {
  const workbookXml = await readZipText(zip, "xl/workbook.xml");
  const workbookRelsXml = await readZipText(zip, "xl/_rels/workbook.xml.rels");

  if (!workbookXml || !workbookRelsXml) {
    return {};
  }

  const workbookDocument = parseXmlDocument(workbookXml);
  const relsDocument = parseXmlDocument(workbookRelsXml);
  const relationshipMap = new Map();

  getXmlChildrenByLocalName(relsDocument.documentElement, "Relationship").forEach((node) => {
    const id = normalizeText(node.getAttribute("Id"));
    const target = normalizeText(node.getAttribute("Target"));

    if (id && target) {
      relationshipMap.set(id, resolveWorkbookTargetPath(target));
    }
  });

  const sheets = {};

  getXmlChildrenByLocalName(workbookDocument.documentElement, "sheets")
    .flatMap((node) => getXmlChildrenByLocalName(node, "sheet"))
    .forEach((node) => {
      const name = normalizeText(node.getAttribute("name"));
      const relationshipId =
        normalizeText(
          node.getAttributeNS(
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
            "id"
          )
        ) || normalizeText(node.getAttribute("r:id"));

      if (name && relationshipMap.has(relationshipId)) {
        sheets[name] = relationshipMap.get(relationshipId);
      }
    });

  return sheets;
}

async function loadWorkbookSheetRows(zip, sheetPaths, sheetName, sharedStrings) {
  const path = sheetPaths[sheetName];

  if (!path) {
    return [];
  }

  const worksheetXml = await readZipText(zip, path);
  return parseWorksheetRows(worksheetXml, sharedStrings);
}

async function readZipText(zip, path) {
  const file = zip.file(path);
  return file ? file.async("text") : "";
}

function parseWorksheetRows(xmlText, sharedStrings) {
  if (!xmlText) {
    return [];
  }

  const document = parseXmlDocument(xmlText);
  const sheetData = getXmlChildrenByLocalName(document.documentElement, "sheetData")[0];

  if (!sheetData) {
    return [];
  }

  return getXmlChildrenByLocalName(sheetData, "row").map((rowNode) => {
    const row = {
      __rowNumber: Number(rowNode.getAttribute("r") || 0)
    };

    getXmlChildrenByLocalName(rowNode, "c").forEach((cellNode) => {
      const reference = normalizeText(cellNode.getAttribute("r"));
      const column = reference.replace(/[0-9]/g, "");

      if (!column) {
        return;
      }

      row[column] = readWorksheetCellValue(cellNode, sharedStrings);
    });

    return row;
  });
}

function readWorksheetCellValue(cellNode, sharedStrings) {
  const type = normalizeText(cellNode.getAttribute("t"));
  const valueNode = getXmlChildrenByLocalName(cellNode, "v")[0];

  if (type === "inlineStr") {
    const inlineNode = getXmlChildrenByLocalName(cellNode, "is")[0];
    return inlineNode ? extractSharedStringText(inlineNode) : "";
  }

  if (!valueNode) {
    return "";
  }

  const rawValue = normalizeText(valueNode.textContent);

  if (type === "s") {
    const sharedStringIndex = Number(rawValue);
    return Number.isInteger(sharedStringIndex) ? sharedStrings[sharedStringIndex] || "" : "";
  }

  if (type === "b") {
    return rawValue === "1";
  }

  if (type === "str" || type === "e") {
    return rawValue;
  }

  const numericValue = Number(rawValue);
  return Number.isFinite(numericValue) ? numericValue : rawValue;
}

function parseWorkbookExpenseRows(rows) {
  return sanitizeImportedCollection(
    rows
      .filter((row) => row.__rowNumber > 1)
      .map((row) => ({
        reference: "",
        date: parseWorkbookDateValue(row.A),
        businessArea: row.B,
        vendor: row.C,
        expenseType: row.D,
        description: row.E,
        paymentMethod: row.F,
        receiptStatus: row.G,
        amount: row.H,
        notes: row.I,
        linkedPettyCashId: ""
      })),
    sanitizeStoredExpense
  );
}

function parseWorkbookBudgetRows(rows) {
  return sanitizeImportedCollection(
    rows
      .filter((row) => row.__rowNumber > 1)
      .map((row) => ({
        month: parseWorkbookMonthValue(row.A),
        businessArea: row.B,
        category: row.C,
        amount: row.D
      })),
    sanitizeStoredBudget
  );
}

function parseWorkbookSalesRows(rows) {
  return sanitizeImportedCollection(
    rows
      .filter((row) => row.__rowNumber > 1)
      .map((row) => ({
        date: parseWorkbookDateValue(row.A),
        businessArea: row.B,
        amount: row.C,
        notes: row.D
      })),
    sanitizeStoredSale
  );
}

function preferWorkbookNumericValue(primaryValue, fallbackValue) {
  if (primaryValue !== undefined && primaryValue !== null && normalizeText(primaryValue) !== "") {
    return primaryValue;
  }

  return typeof fallbackValue === "number" ? fallbackValue : "";
}

function parseWorkbookRentalRows(rows) {
  return sanitizeImportedCollection(
    rows
      .filter((row) => row.__rowNumber > 1)
      .map((row) => {
        const customBillLabel = normalizeText(row.AH);
        const customBillTotal = parseOptionalAmount(row.AG);
        const customBillItems =
          customBillLabel && customBillTotal > 0
            ? `${customBillLabel}: ${customBillTotal.toFixed(2)}`
            : customBillLabel
              ? customBillLabel
              : customBillTotal > 0
                ? `Custom workbook bill: ${customBillTotal.toFixed(2)}`
                : "";

        return {
          month: parseWorkbookMonthValue(row.A),
          suite: row.B,
          occupancyStatus: row.C,
          tenantName: row.D || row.C,
          tenantPhone: row.E,
          emergencyContact: row.F,
          tenantIdRef: row.G,
          moveInDate: parseWorkbookDateValue(row.H),
          moveOutDate: parseWorkbookDateValue(row.I),
          rentCycleType: row.J,
          rentCycleMonths: row.K,
          rentCycleAmount: row.L,
          rentDue: preferWorkbookNumericValue(row.M, row.D),
          rentPaid: preferWorkbookNumericValue(row.N, row.E),
          rentCoverageStartDate: parseWorkbookDateValue(row.O),
          rentCoverageEndDate: parseWorkbookDateValue(row.P),
          nextRentDueDate: parseWorkbookDateValue(row.Q),
          renewalDate: parseWorkbookDateValue(row.R),
          rentPaymentDate: parseWorkbookDateValue(row.S),
          rentPaymentMethod: row.T,
          rentPaymentReference: row.U,
          waterBill: preferWorkbookNumericValue(row.V, row.F),
          toiletBill: preferWorkbookNumericValue(row.W, row.G),
          sweepingBill: preferWorkbookNumericValue(row.X, row.H),
          wasteBill: preferWorkbookNumericValue(row.Y, row.I),
          billDueDate: parseWorkbookDateValue(row.Z),
          billAmountPaid: preferWorkbookNumericValue(row.AA, row.J),
          billPaymentDate: parseWorkbookDateValue(row.AB),
          billPaymentMethod: row.AC,
          billPaymentReference: row.AD,
          arrearsBroughtForward: row.AE,
          lateFee: row.AF,
          customBillItems,
          notes: row.AI ?? row.AH ?? row.L
        };
      }),
    sanitizeStoredRental
  );
}

function parseWorkbookPettyCashRows(rows) {
  return sanitizeImportedCollection(
    rows
      .filter((row) => row.__rowNumber > 1)
      .map((row) => ({
        date: parseWorkbookDateValue(row.A),
        transactionTypeId: normalizePettyCashTypeId(row.B),
        businessArea: row.C,
        expenseType: row.D,
        vendor: row.E,
        receiptStatus: row.F,
        amount: row.G,
        notes: row.I,
        linkedExpenseId: ""
      })),
    sanitizeStoredPettyCash
  );
}

function parseWorkbookPettyCashBudgetRows(rows) {
  return sanitizeImportedCollection(
    rows
      .filter((row) => row.__rowNumber > 1)
      .map((row) => ({
        month: parseWorkbookMonthValue(row.A),
        businessArea: row.B,
        amount: row.C,
        notes: row.D
      })),
    sanitizeStoredPettyCashBudget
  );
}

function parseWorkbookSalaryRows(rows) {
  return sanitizeImportedCollection(
    rows
      .filter((row) => row.__rowNumber > 1)
      .map((row) => ({
        month: parseWorkbookMonthValue(row.A),
        businessArea: row.B,
        staffName: row.C,
        roleTitle: row.D,
        salaryType: row.E,
        grossAmount: row.F,
        deductionAmount: row.G,
        amountPaid: row.I,
        dueDate: parseWorkbookDateValue(row.K),
        paymentDate: parseWorkbookDateValue(row.L),
        paymentMethod: row.M,
        paymentReference: row.N,
        notes: row.P,
        kpiMetric: row.Q,
        kpiUnit: row.R,
        kpiTarget: row.S,
        kpiActual: row.T
      })),
    sanitizeStoredSalaryRecord
  );
}

function parseWorkbookSupplierRows(rows) {
  return sanitizeImportedCollection(
    rows
      .filter((row) => row.__rowNumber > 1)
      .map((row) => ({
        invoiceDate: parseWorkbookDateValue(row.A),
        businessArea: row.B,
        supplierName: row.C,
        category: row.D,
        itemDescription: row.E,
        invoiceReference: row.F,
        amountDue: row.G,
        amountPaid: row.H,
        dueDate: parseWorkbookDateValue(row.I),
        paymentDate: parseWorkbookDateValue(row.J),
        paymentMethod: row.K,
        notes: row.N
      })),
    sanitizeStoredSupplier
  );
}

function parseWorkbookRecurringRows(rows) {
  return sanitizeImportedCollection(
    rows
      .filter((row) => row.__rowNumber > 1)
      .map((row) => ({
        title: row.A,
        moduleType: row.B,
        businessArea: row.C,
        category: row.D,
        counterparty: row.E,
        suite: row.F,
        amount: row.G,
        frequency: row.H,
        startDate: parseWorkbookDateValue(row.I),
        nextDueDate: parseWorkbookDateValue(row.J),
        lastGeneratedDate: parseWorkbookDateValue(row.K),
        priority: row.L,
        activeState: row.M,
        notes: row.N
      })),
    sanitizeStoredRecurringControl
  );
}

function parseWorkbookMaintenanceRows(rows) {
  return sanitizeImportedCollection(
    rows
      .filter((row) => row.__rowNumber > 1)
      .map((row) => ({
        reportedDate: parseWorkbookDateValue(row.A),
        businessArea: row.B,
        location: row.C,
        assetItem: row.D,
        issue: row.E,
        priority: row.F,
        status: row.G,
        dueDate: parseWorkbookDateValue(row.H),
        estimatedCost: row.I,
        actualCost: row.J,
        vendor: row.K,
        notes: row.L
      })),
    sanitizeStoredMaintenanceRecord
  );
}

function resolveWorkbookTargetPath(target) {
  const normalizedTarget = normalizeText(target)
    .replace(/^\/+/, "")
    .replace(/^\.\//, "")
    .replace(/^\.\.\//, "");

  return normalizedTarget.startsWith("xl/") ? normalizedTarget : `xl/${normalizedTarget}`;
}

function parseXmlDocument(xmlText) {
  const document = new DOMParser().parseFromString(xmlText, "application/xml");
  const parserErrors = document.getElementsByTagName("parsererror");

  if (parserErrors.length > 0) {
    throw new Error("Could not parse workbook XML.");
  }

  return document;
}

function getXmlChildrenByLocalName(node, localName) {
  return Array.from(node?.childNodes || []).filter(
    (child) => child.nodeType === Node.ELEMENT_NODE && child.localName === localName
  );
}

function extractSharedStringText(node) {
  return Array.from(node.getElementsByTagNameNS("*", "t"))
    .map((textNode) => textNode.textContent || "")
    .join("");
}

function mergeExpenses(existing, imported) {
  return mergeCollectionsByKey(existing, imported, buildExpenseMergeKey, sortExpenses);
}

function mergeBudgets(existing, imported) {
  return mergeCollectionsByKey(existing, imported, buildBudgetMergeKey, sortBudgets);
}

function mergeSales(existing, imported) {
  return mergeCollectionsByKey(existing, imported, buildSalesMergeKey, sortSales);
}

function mergeRentals(existing, imported) {
  return mergeCollectionsByKey(existing, imported, buildRentalMergeKey, sortRentals);
}

function mergePettyCashEntries(existing, imported) {
  return mergeCollectionsByKey(existing, imported, buildPettyCashMergeKey, sortPettyCash);
}

function mergePettyCashBudgets(existing, imported) {
  return mergeCollectionsByKey(
    existing,
    imported,
    buildPettyCashBudgetMergeKey,
    sortPettyCashBudgets
  );
}

function mergeSalaryRecords(existing, imported) {
  return mergeCollectionsByKey(existing, imported, buildSalaryMergeKey, sortSalaryRecords);
}

function mergeCashbookEntries(existing, imported) {
  return mergeCollectionsByKey(existing, imported, buildCashbookMergeKey, sortCashbookEntries);
}

function mergePurchaseOrders(existing, imported) {
  return mergeCollectionsByKey(
    existing,
    imported,
    buildPurchaseOrderMergeKey,
    sortPurchaseOrders
  );
}

function mergeLaundryTickets(existing, imported) {
  return mergeCollectionsByKey(
    existing,
    imported,
    buildLaundryTicketMergeKey,
    sortLaundryTickets
  );
}

function mergeEquipmentRentalBookings(existing, imported) {
  return mergeCollectionsByKey(
    existing,
    imported,
    buildEquipmentRentalMergeKey,
    sortEquipmentRentalBookings
  );
}

function mergeSecurityDepositRecords(existing, imported) {
  return mergeCollectionsByKey(
    existing,
    imported,
    buildSecurityDepositMergeKey,
    sortSecurityDepositRecords
  );
}

function mergeLedgerEntries(existing, imported) {
  return mergeCollectionsByKey(existing, imported, buildLedgerMergeKey, sortLedgerEntries);
}

function mergeMobileMoneyReconciliations(existing, imported) {
  return mergeCollectionsByKey(
    existing,
    imported,
    buildMobileMoneyMergeKey,
    sortMobileMoneyReconciliations
  );
}

function mergeSupplierRecords(existing, imported) {
  return mergeCollectionsByKey(existing, imported, buildSupplierMergeKey, sortSuppliers);
}

function mergeAssetRecords(existing, imported) {
  return mergeCollectionsByKey(existing, imported, buildAssetMergeKey, sortAssetRecords);
}

function mergeForecastPlans(existing, imported) {
  return mergeCollectionsByKey(existing, imported, buildForecastMergeKey, sortForecastPlans);
}

function mergeRecurringControls(existing, imported) {
  return mergeCollectionsByKey(
    existing,
    imported,
    buildRecurringMergeKey,
    sortRecurringControls
  );
}

function mergeMaintenanceRecords(existing, imported) {
  return mergeCollectionsByKey(
    existing,
    imported,
    buildMaintenanceMergeKey,
    sortMaintenanceRecords
  );
}

function mergeUserProfiles(existing, imported) {
  return mergeCollectionsByKey(existing, imported, buildUserProfileMergeKey, sortUserProfiles);
}

function mergeCollectionsByKey(existing, imported = [], keyBuilder, sorter) {
  const merged = new Map();

  [...existing, ...imported].forEach((item) => {
    merged.set(keyBuilder(item), item);
  });

  return sorter(Array.from(merged.values()));
}

function buildExpenseMergeKey(expense) {
  return [
    expense.date,
    expense.businessAreaId,
    normalizeText(expense.vendor).toLowerCase(),
    expense.category,
    normalizeText(expense.description).toLowerCase(),
    normalizeText(expense.paymentMethod).toLowerCase(),
    Number(expense.amount || 0).toFixed(2),
    normalizeText(expense.notes).toLowerCase()
  ].join("|");
}

function buildBudgetMergeKey(budget) {
  return [budget.month, budget.businessAreaId, budget.category].join("|");
}

function buildSalesMergeKey(sale) {
  return [sale.date, sale.businessAreaId].join("|");
}

function buildRentalMergeKey(record) {
  return [record.month, record.suite].join("|");
}

function buildPettyCashMergeKey(entry) {
  return [
    entry.date,
    entry.transactionTypeId,
    entry.businessAreaId,
    entry.category,
    normalizeText(entry.vendor).toLowerCase(),
    Number(entry.amount || 0).toFixed(2),
    normalizeText(entry.notes).toLowerCase()
  ].join("|");
}

function buildPettyCashBudgetMergeKey(budget) {
  return [budget.month, budget.businessAreaId].join("|");
}

function buildSalaryMergeKey(record) {
  return [
    record.month,
    record.businessAreaId,
    normalizeText(record.staffName).toLowerCase(),
    normalizeText(record.salaryType).toLowerCase(),
    record.dueDate,
    Number(getSalaryNetDue(record) || 0).toFixed(2)
  ].join("|");
}

function buildCashbookMergeKey(record) {
  return [
    record.entryDate,
    record.accountType,
    normalizeText(record.accountName).toLowerCase(),
    record.businessAreaId,
    record.entryType,
    Number(record.amount || 0).toFixed(2),
    normalizeText(record.reference).toLowerCase(),
    normalizeText(record.counterparty).toLowerCase()
  ].join("|");
}

function buildPurchaseOrderMergeKey(record) {
  return [
    record.requestDate,
    record.businessAreaId,
    normalizeText(record.supplierName).toLowerCase(),
    normalizeText(record.itemDescription).toLowerCase(),
    Number(record.totalAmount || 0).toFixed(2),
    normalizeText(record.requester).toLowerCase()
  ].join("|");
}

function buildLaundryTicketMergeKey(record) {
  return [
    record.ticketDate,
    normalizeText(record.customerName).toLowerCase(),
    normalizeText(record.itemSummary).toLowerCase(),
    Number(record.amountDue || 0).toFixed(2),
    normalizeText(record.serviceType).toLowerCase()
  ].join("|");
}

function buildEquipmentRentalMergeKey(record) {
  return [
    record.bookingDate,
    normalizeText(record.equipmentItem).toLowerCase(),
    normalizeText(record.customerName).toLowerCase(),
    Number(record.rentalFee || 0).toFixed(2),
    normalizeText(record.reference).toLowerCase()
  ].join("|");
}

function buildSecurityDepositMergeKey(record) {
  return [
    record.captureDate,
    normalizeText(record.suite).toLowerCase(),
    normalizeText(record.tenantName).toLowerCase(),
    Number(record.depositExpected || 0).toFixed(2),
    Number(record.refundDue || 0).toFixed(2)
  ].join("|");
}

function buildLedgerMergeKey(record) {
  return [
    record.entryDate,
    record.businessAreaId,
    record.partyType,
    normalizeText(record.partyName).toLowerCase(),
    normalizeText(record.partyPhone),
    normalizeText(record.suite).toLowerCase(),
    record.entryType,
    Number(record.amount || 0).toFixed(2),
    normalizeText(record.reference).toLowerCase()
  ].join("|");
}

function buildMobileMoneyMergeKey(record) {
  return [
    record.date,
    normalizeText(record.provider).toLowerCase(),
    Number(record.openingCash || 0).toFixed(2),
    Number(record.closingCashCounted || 0).toFixed(2)
  ].join("|");
}

function buildSupplierMergeKey(record) {
  return [
    record.invoiceDate,
    record.businessAreaId,
    normalizeText(record.supplierName).toLowerCase(),
    normalizeText(record.invoiceReference).toLowerCase(),
    Number(record.amountDue || 0).toFixed(2)
  ].join("|");
}

function buildAssetMergeKey(record) {
  return [
    record.acquiredDate,
    record.businessAreaId,
    normalizeText(record.assetName).toLowerCase(),
    normalizeText(record.location).toLowerCase()
  ].join("|");
}

function buildForecastMergeKey(record) {
  return [record.month, record.businessAreaId].join("|");
}

function buildRecurringMergeKey(record) {
  return [
    normalizeText(record.title).toLowerCase(),
    record.moduleType,
    record.businessAreaId,
    record.nextDueDate,
    normalizeText(record.suite).toLowerCase()
  ].join("|");
}

function buildMaintenanceMergeKey(record) {
  return [
    record.reportedDate,
    record.businessAreaId,
    normalizeText(record.location).toLowerCase(),
    normalizeText(record.issue).toLowerCase(),
    normalizeText(record.vendor).toLowerCase()
  ].join("|");
}

function buildUserProfileMergeKey(record) {
  return normalizeText(record.username).toLowerCase();
}

function reconcilePettyCashExpenseLinks() {
  state.pettyCash = sortPettyCash(
    state.pettyCash.map((entry) => {
      const type = getPettyCashType(entry.transactionTypeId);
      const existingLinkId = normalizeText(entry.linkedExpenseId);
      const matchedExpense =
        type.isExpense && !existingLinkId ? findMatchingExpenseForPettyEntry(entry) : null;
      const nextLinkedExpenseId = syncLinkedExpenseForPettyEntry(
        entry,
        existingLinkId || matchedExpense?.id || ""
      );

      if (nextLinkedExpenseId === entry.linkedExpenseId) {
        return entry;
      }

      return {
        ...entry,
        linkedExpenseId: nextLinkedExpenseId,
        updatedAt: new Date().toISOString()
      };
    })
  );
}

function findMatchingExpenseForPettyEntry(entry) {
  return state.expenses.find((expense) => {
    const sameVendor =
      normalizeText(expense.vendor).toLowerCase() === normalizeText(entry.vendor).toLowerCase();
    const sameAmount = Math.abs(expense.amount - entry.amount) < 0.01;
    const sameLinkState = !expense.linkedPettyCashId || expense.linkedPettyCashId === entry.id;

    return (
      sameLinkState &&
      expense.date === entry.date &&
      expense.businessAreaId === entry.businessAreaId &&
      expense.category === (entry.category || OTHER_CUSTOM_OPTION) &&
      sameVendor &&
      sameAmount
    );
  });
}

function sortExpenses(expenses) {
  return [...expenses].sort((left, right) => {
    const dateDifference = right.date.localeCompare(left.date);

    if (dateDifference !== 0) {
      return dateDifference;
    }

    return (right.updatedAt || "").localeCompare(left.updatedAt || "");
  });
}

function sortBudgets(budgets) {
  return [...budgets].sort((left, right) => {
    const monthDifference = right.month.localeCompare(left.month);

    if (monthDifference !== 0) {
      return monthDifference;
    }

    const areaDifference = getBusinessArea(left.businessAreaId).shortLabel.localeCompare(
      getBusinessArea(right.businessAreaId).shortLabel
    );

    if (areaDifference !== 0) {
      return areaDifference;
    }

    return left.category.localeCompare(right.category);
  });
}

function sortSales(sales) {
  return [...sales].sort((left, right) => {
    const dateDifference = right.date.localeCompare(left.date);

    if (dateDifference !== 0) {
      return dateDifference;
    }

    return (right.updatedAt || "").localeCompare(left.updatedAt || "");
  });
}

function sortRentals(rentals) {
  return [...rentals].sort((left, right) => {
    const monthDifference = right.month.localeCompare(left.month);

    if (monthDifference !== 0) {
      return monthDifference;
    }

    return left.suite.localeCompare(right.suite);
  });
}

function sortPettyCash(entries) {
  return [...entries].sort((left, right) => {
    const dateDifference = right.date.localeCompare(left.date);

    if (dateDifference !== 0) {
      return dateDifference;
    }

    return (right.updatedAt || "").localeCompare(left.updatedAt || "");
  });
}

function sortPettyCashBudgets(budgets) {
  return [...budgets].sort((left, right) => {
    const monthDifference = right.month.localeCompare(left.month);

    if (monthDifference !== 0) {
      return monthDifference;
    }

    return getBusinessArea(left.businessAreaId).shortLabel.localeCompare(
      getBusinessArea(right.businessAreaId).shortLabel
    );
  });
}

function sortSalaryRecords(records) {
  return [...records].sort((left, right) => {
    const monthDifference = right.month.localeCompare(left.month);

    if (monthDifference !== 0) {
      return monthDifference;
    }

    const dueDateDifference = (right.dueDate || "").localeCompare(left.dueDate || "");

    if (dueDateDifference !== 0) {
      return dueDateDifference;
    }

    return normalizeText(left.staffName).localeCompare(normalizeText(right.staffName));
  });
}

function sortCashbookEntries(records) {
  return [...records].sort((left, right) => {
    const dateDifference = right.entryDate.localeCompare(left.entryDate);

    if (dateDifference !== 0) {
      return dateDifference;
    }

    return (right.updatedAt || "").localeCompare(left.updatedAt || "");
  });
}

function sortPurchaseOrders(records) {
  return [...records].sort((left, right) => {
    const dateDifference = right.requestDate.localeCompare(left.requestDate);

    if (dateDifference !== 0) {
      return dateDifference;
    }

    return (right.updatedAt || "").localeCompare(left.updatedAt || "");
  });
}

function sortLaundryTickets(records) {
  return [...records].sort((left, right) => {
    const dateDifference = right.ticketDate.localeCompare(left.ticketDate);

    if (dateDifference !== 0) {
      return dateDifference;
    }

    return (right.updatedAt || "").localeCompare(left.updatedAt || "");
  });
}

function sortEquipmentRentalBookings(records) {
  return [...records].sort((left, right) => {
    const dateDifference = right.bookingDate.localeCompare(left.bookingDate);

    if (dateDifference !== 0) {
      return dateDifference;
    }

    return (right.updatedAt || "").localeCompare(left.updatedAt || "");
  });
}

function sortSecurityDepositRecords(records) {
  return [...records].sort((left, right) => {
    const dateDifference = right.captureDate.localeCompare(left.captureDate);

    if (dateDifference !== 0) {
      return dateDifference;
    }

    return normalizeText(left.suite).localeCompare(normalizeText(right.suite));
  });
}

function sortLedgerEntries(records) {
  return [...records].sort((left, right) => {
    const dateDifference = right.entryDate.localeCompare(left.entryDate);

    if (dateDifference !== 0) {
      return dateDifference;
    }

    return (right.updatedAt || "").localeCompare(left.updatedAt || "");
  });
}

function sortMobileMoneyReconciliations(records) {
  return [...records].sort((left, right) => {
    const dateDifference = right.date.localeCompare(left.date);

    if (dateDifference !== 0) {
      return dateDifference;
    }

    return (right.updatedAt || "").localeCompare(left.updatedAt || "");
  });
}

function sortSuppliers(records) {
  return [...records].sort((left, right) => {
    const dateDifference = right.invoiceDate.localeCompare(left.invoiceDate);

    if (dateDifference !== 0) {
      return dateDifference;
    }

    return (right.updatedAt || "").localeCompare(left.updatedAt || "");
  });
}

function sortAssetRecords(records) {
  return [...records].sort((left, right) => {
    const dateDifference = right.acquiredDate.localeCompare(left.acquiredDate);

    if (dateDifference !== 0) {
      return dateDifference;
    }

    return normalizeText(left.assetName).localeCompare(normalizeText(right.assetName));
  });
}

function sortForecastPlans(records) {
  return [...records].sort((left, right) => {
    const monthDifference = right.month.localeCompare(left.month);

    if (monthDifference !== 0) {
      return monthDifference;
    }

    return getBusinessArea(left.businessAreaId).shortLabel.localeCompare(
      getBusinessArea(right.businessAreaId).shortLabel
    );
  });
}

function sortRecurringControls(records) {
  return [...records].sort((left, right) => {
    const dueDifference = (left.nextDueDate || "").localeCompare(right.nextDueDate || "");

    if (dueDifference !== 0) {
      return dueDifference;
    }

    return normalizeText(left.title).localeCompare(normalizeText(right.title));
  });
}

function sortMaintenanceRecords(records) {
  return [...records].sort((left, right) => {
    const dateDifference = right.reportedDate.localeCompare(left.reportedDate);

    if (dateDifference !== 0) {
      return dateDifference;
    }

    return (right.updatedAt || "").localeCompare(left.updatedAt || "");
  });
}

function sortUserProfiles(records) {
  return [...records].sort((left, right) => {
    const activeDifference = Number(Boolean(right.active)) - Number(Boolean(left.active));

    if (activeDifference !== 0) {
      return activeDifference;
    }

    return normalizeText(left.fullName).localeCompare(normalizeText(right.fullName));
  });
}

function getPettyCashEffect(entry) {
  return getPettyCashType(entry.transactionTypeId).effect * entry.amount;
}

function getPettyCashBalance(entries) {
  return entries.reduce((sum, entry) => sum + getPettyCashEffect(entry), 0);
}

function buildReference(date) {
  return `OR-${date.replaceAll("-", "")}-${generateId().slice(0, 4).toUpperCase()}`;
}

function generateId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `or-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePettyCashTypeId(value) {
  const normalized = normalizeText(value).toLowerCase();

  if (!normalized) {
    return "";
  }

  const matchedType = PETTY_CASH_TYPES.find(
    (type) => type.id === normalized || type.label.toLowerCase() === normalized
  );

  return matchedType ? matchedType.id : "";
}

function normalizeCashbookAccountType(value) {
  const normalized = normalizeText(value).toLowerCase();

  if (!normalized) {
    return "";
  }

  const matchedType = CASHBOOK_ACCOUNT_TYPE_OPTIONS.find(
    (option) => option.value === normalized || option.label.toLowerCase() === normalized
  );

  return matchedType ? matchedType.value : "";
}

function normalizeCashbookEntryType(value) {
  const normalized = normalizeText(value).toLowerCase();

  if (!normalized) {
    return "";
  }

  const matchedType = CASHBOOK_ENTRY_TYPE_OPTIONS.find(
    (option) => option.value === normalized || option.label.toLowerCase() === normalized
  );

  return matchedType ? matchedType.value : "";
}

function normalizeDateInput(value) {
  const rawValue = normalizeText(value);

  if (!rawValue) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
    return rawValue;
  }

  const parsedDate = new Date(rawValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return formatDateInput(parsedDate);
}

function normalizeMonthInput(value) {
  const rawValue = normalizeText(value);
  return /^\d{4}-\d{2}$/.test(rawValue) ? rawValue : "";
}

function parseWorkbookDateValue(value) {
  if (typeof value === "number") {
    return excelSerialToDateInput(value);
  }

  return normalizeDateInput(value);
}

function parseWorkbookMonthValue(value) {
  if (typeof value === "number") {
    return excelSerialToMonthKey(value);
  }

  const normalizedMonth = normalizeMonthInput(value);

  if (normalizedMonth) {
    return normalizedMonth;
  }

  const textValue = normalizeText(value);

  if (!textValue) {
    return "";
  }

  const parsedDate = new Date(textValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return getMonthKey(parsedDate);
}

function excelSerialToDateInput(serial) {
  const normalizedSerial = Number(serial);

  if (!Number.isFinite(normalizedSerial)) {
    return "";
  }

  const date = new Date(Date.UTC(1899, 11, 30) + Math.round(normalizedSerial * 86400000));
  return formatUtcDateInput(date);
}

function excelSerialToMonthKey(serial) {
  const normalizedSerial = Number(serial);

  if (!Number.isFinite(normalizedSerial)) {
    return "";
  }

  const date = new Date(Date.UTC(1899, 11, 30) + Math.round(normalizedSerial * 86400000));
  return formatUtcMonthKey(date);
}

function normalizeSuite(value) {
  const suite = normalizeText(value);

  if (!suite) {
    return "";
  }

  const aliasedSuite = SUITE_NAME_ALIASES.get(suite.toLowerCase()) || suite;
  const matchedSuite = APARTMENT_SUITES.find(
    (option) => option.toLowerCase() === aliasedSuite.toLowerCase()
  );

  return matchedSuite || aliasedSuite;
}

function normalizeBusinessAreaId(value) {
  const normalized = normalizeText(value).toLowerCase();

  if (!normalized) {
    return "";
  }

  const matchingArea = BUSINESS_AREAS.find(
    (area) => area.id === normalized || area.label.toLowerCase() === normalized
  );

  return matchingArea ? matchingArea.id : "";
}

function normalizeReceiptStatus(value) {
  const normalized = normalizeText(value).toLowerCase();

  if (normalized === "uploaded" || normalized === "received" || normalized === "yes") {
    return "Uploaded";
  }

  if (normalized === "not required" || normalized === "n/a" || normalized === "na") {
    return "Not Required";
  }

  return "Pending";
}

function parseAmount(value) {
  const sanitized = String(value || "").replace(/[^0-9.-]/g, "");
  const parsed = Number.parseFloat(sanitized);
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : Number.NaN;
}

function parseOptionalAmount(value) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return 0;
  }

  const parsed = parseAmount(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function parseOptionalAmountOrNull(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = typeof value === "string" ? value.trim() : String(value).trim();

  if (!normalized) {
    return null;
  }

  const parsed = parseAmount(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function formatCurrency(amount) {
  const currency = CURRENCY_OPTIONS.find((option) => option.code === state.currency) || CURRENCY_OPTIONS[0];

  return new Intl.NumberFormat(currency.locale, {
    style: "currency",
    currency: currency.code,
    maximumFractionDigits: 2
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatSignedCurrency(amount) {
  if (!Number.isFinite(amount) || amount === 0) {
    return formatCurrency(0);
  }

  return amount > 0 ? `+${formatCurrency(amount)}` : `-${formatCurrency(Math.abs(amount))}`;
}

function formatDisplayDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
}

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1, 1);

  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric"
  }).format(date);
}

function formatTimestampLabel(timestamp) {
  const parsed = new Date(timestamp);

  if (!Number.isFinite(parsed.getTime())) {
    return "just now";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(parsed);
}

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatUtcDateInput(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatUtcMonthKey(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function getTodayInputValue() {
  return formatDateInput(new Date());
}

function getMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(date, offset) {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

function normalizeOccupancyStatus(value) {
  const normalized = normalizeText(value).toLowerCase();

  if (!normalized) {
    return "";
  }

  const matchedStatus = OCCUPANCY_STATUSES.find(
    (status) => status.toLowerCase() === normalized
  );

  return matchedStatus || "";
}

function normalizeRentCycleType(value) {
  const normalized = normalizeText(value).toLowerCase();

  if (!normalized) {
    return "";
  }

  const matchedOption = RENT_CYCLE_OPTIONS.find(
    (option) =>
      option.value.toLowerCase() === normalized || option.label.toLowerCase() === normalized
  );

  return matchedOption ? matchedOption.value : "";
}

function parsePositiveInteger(value) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

function resolveRentCycleMonths(rentCycleType, explicitMonths) {
  const matchedOption = RENT_CYCLE_OPTIONS.find((option) => option.value === rentCycleType);

  if (matchedOption && matchedOption.months > 0) {
    return matchedOption.months;
  }

  return explicitMonths > 0 ? explicitMonths : 0;
}

function inferOccupancyStatus(record, existingRecord = null) {
  if (existingRecord?.occupancyStatus) {
    return existingRecord.occupancyStatus;
  }

  const hasOccupant = Boolean(normalizeText(record.tenantName));
  const hasFinancialActivity =
    parseOptionalAmount(record.rentDue) > 0 ||
    parseOptionalAmount(record.rentPaid) > 0 ||
    parseOptionalAmount(record.waterBill) > 0 ||
    parseOptionalAmount(record.toiletBill) > 0 ||
    parseOptionalAmount(record.sweepingBill) > 0 ||
    parseOptionalAmount(record.wasteBill) > 0 ||
    getCustomBillItemEntries(record).length > 0;

  return hasOccupant || hasFinancialActivity ? "Occupied" : "Vacant";
}

function parseLocalDate(dateString) {
  const normalizedDate = normalizeDateInput(dateString);

  if (!normalizedDate) {
    return null;
  }

  const [year, month, day] = normalizedDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function shiftDateByDays(dateString, days) {
  const date = parseLocalDate(dateString);

  if (!date) {
    return "";
  }

  date.setDate(date.getDate() + Number(days || 0));
  return formatDateInput(date);
}

function shiftDateByMonths(dateString, months, dayOffset = 0) {
  const date = parseLocalDate(dateString);

  if (!date) {
    return "";
  }

  const originalDay = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + Number(months || 0));
  const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(originalDay, lastDayOfMonth));

  if (dayOffset !== 0) {
    date.setDate(date.getDate() + dayOffset);
  }

  return formatDateInput(date);
}

function buildMonthDayDate(monthKey, preferredDay = 5) {
  const normalizedMonth = normalizeMonthInput(monthKey);

  if (!normalizedMonth) {
    return "";
  }

  const [year, month] = normalizedMonth.split("-").map(Number);
  const maxDay = new Date(year, month, 0).getDate();
  const safeDay = Math.min(Math.max(Number(preferredDay) || 1, 1), maxDay);

  return `${year}-${String(month).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
}

function buildMonthEndDate(monthKey) {
  const normalizedMonth = normalizeMonthInput(monthKey);

  if (!normalizedMonth) {
    return "";
  }

  const [year, month] = normalizedMonth.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
}

function extractPreferredBillDay(dateString) {
  const normalizedDate = normalizeDateInput(dateString);
  return normalizedDate ? Number(normalizedDate.slice(-2)) : 5;
}

function extractPreferredDay(dateString, fallbackDay = 1) {
  const normalizedDate = normalizeDateInput(dateString);
  return normalizedDate ? Number(normalizedDate.slice(-2)) : fallbackDay;
}

function daysUntilDate(dateString, referenceDate = getTodayInputValue()) {
  const targetDate = parseLocalDate(dateString);
  const comparisonDate = parseLocalDate(referenceDate);

  if (!targetDate || !comparisonDate) {
    return Number.NaN;
  }

  return Math.round((targetDate.getTime() - comparisonDate.getTime()) / 86400000);
}

function getCustomBillItemEntries(record) {
  const source =
    typeof record === "string" ? record : String(record?.customBillItems || "");

  if (!source.trim()) {
    return [];
  }

  return source
    .split(/\r?\n|;/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const amountMatch = line.match(/(-?\d[\d,]*(?:\.\d+)?)(?!.*-?\d)/);

      if (!amountMatch) {
        return null;
      }

      const amount = parseAmount(amountMatch[1].replaceAll(",", ""));
      const label = normalizeText(line.replace(amountMatch[0], "").replace(/[:\-–\s]+$/, ""));

      if (!Number.isFinite(amount) || amount <= 0) {
        return null;
      }

      return {
        label: label || "Custom bill item",
        amount
      };
    })
    .filter(Boolean);
}

function getBillsTotal(record) {
  const baseBills =
    parseOptionalAmount(record.waterBill) +
    parseOptionalAmount(record.toiletBill) +
    parseOptionalAmount(record.sweepingBill) +
    parseOptionalAmount(record.wasteBill);
  const customTotal = getCustomBillItemEntries(record).reduce(
    (sum, item) => sum + item.amount,
    0
  );

  return Number((baseBills + customTotal).toFixed(2));
}

function getBillsPaidAmount(record) {
  return parseOptionalAmount(record.billAmountPaid);
}

function getOutstandingRent(record) {
  return Math.max(parseOptionalAmount(record.rentDue) - parseOptionalAmount(record.rentPaid), 0);
}

function getOutstandingBills(record) {
  return Math.max(getBillsTotal(record) - getBillsPaidAmount(record), 0);
}

function getCarryForwardBalance(record) {
  return getTenantBalanceSnapshot(record).carryForwardBalance;
}

function getTotalTenantBalance(record) {
  return getTenantBalanceSnapshot(record).totalBalance;
}

function sortRentalRecordsChronologically(records) {
  return [...records].sort((left, right) => {
    const monthDifference = (left.month || "").localeCompare(right.month || "");

    if (monthDifference !== 0) {
      return monthDifference;
    }

    return (left.updatedAt || left.createdAt || "").localeCompare(
      right.updatedAt || right.createdAt || ""
    );
  });
}

function buildTenantRunningBalanceLedger(records) {
  let runningBalance = 0;

  return sortRentalRecordsChronologically(records).map((record, index) => {
    const openingArrears =
      index === 0 ? parseOptionalAmount(record.arrearsBroughtForward) : runningBalance;
    const lateFee = parseOptionalAmount(record.lateFee);
    const rentDue = parseOptionalAmount(record.rentDue);
    const rentPaid = parseOptionalAmount(record.rentPaid);
    const billsDue = getBillsTotal(record);
    const billsPaid = getBillsPaidAmount(record);
    const closingBalance = Math.max(
      openingArrears + lateFee + rentDue + billsDue - rentPaid - billsPaid,
      0
    );

    runningBalance = Number(closingBalance.toFixed(2));

    return {
      record,
      openingArrears: Number(openingArrears.toFixed(2)),
      lateFee,
      rentDue,
      rentPaid,
      billsDue,
      billsPaid,
      runningBalance
    };
  });
}

function buildRawTenantBalanceSnapshot(record) {
  const safeRecord = record || {};
  const openingArrears = parseOptionalAmount(safeRecord.arrearsBroughtForward);
  const lateFee = parseOptionalAmount(safeRecord.lateFee);
  const outstandingRent = getOutstandingRent(safeRecord);
  const outstandingBills = getOutstandingBills(safeRecord);
  const carryForwardBalance = Number((openingArrears + lateFee).toFixed(2));

  return {
    openingArrears,
    lateFee,
    outstandingRent,
    outstandingBills,
    carryForwardBalance,
    totalBalance: Number((outstandingRent + outstandingBills + carryForwardBalance).toFixed(2))
  };
}

function getTenantStatementLatestEntry(record) {
  const ledger = getTenantStatementLedger(record);
  return ledger[ledger.length - 1] || null;
}

function getTenantBalanceSnapshot(record) {
  const rawSnapshot = buildRawTenantBalanceSnapshot(record);
  const latestEntry = getTenantStatementLatestEntry(record);

  if (!latestEntry) {
    return rawSnapshot;
  }

  return {
    openingArrears: latestEntry.openingArrears,
    lateFee: latestEntry.lateFee,
    outstandingRent: rawSnapshot.outstandingRent,
    outstandingBills: rawSnapshot.outstandingBills,
    carryForwardBalance: Number((latestEntry.openingArrears + latestEntry.lateFee).toFixed(2)),
    totalBalance: Number(latestEntry.runningBalance.toFixed(2))
  };
}

function getTenantStatementLedger(record) {
  if (!record) {
    return [];
  }

  return buildTenantRunningBalanceLedger([record, ...getTenantStatementScopedHistory(record)]);
}

function getTenantCurrentRunningBalance(record) {
  const ledger = getTenantStatementLedger(record);

  if (ledger.length === 0) {
    return record ? getTotalTenantBalance(record) : 0;
  }

  return ledger[ledger.length - 1].runningBalance;
}

function buildTenantBalanceBreakdownLabel(record) {
  const balanceSnapshot = getTenantBalanceSnapshot(record);
  const parts = [
    `Rent ${formatCurrency(balanceSnapshot.outstandingRent)}`,
    `Bills ${formatCurrency(balanceSnapshot.outstandingBills)}`
  ];
  const arrears = balanceSnapshot.openingArrears;
  const lateFee = balanceSnapshot.lateFee;

  if (arrears > 0) {
    parts.push(`Arrears ${formatCurrency(arrears)}`);
  }

  if (lateFee > 0) {
    parts.push(`Late fee ${formatCurrency(lateFee)}`);
  }

  return parts.join(" • ");
}

function getOccupancyClassName(status) {
  switch (status) {
    case "Occupied":
      return "status-tag-occupied";
    case "Reserved":
      return "status-tag-reserved";
    case "Under Maintenance":
      return "status-tag-maintenance";
    default:
      return "status-tag-vacant";
  }
}

function formatOptionalDate(dateString) {
  const normalizedDate = normalizeDateInput(dateString);
  return normalizedDate ? formatDisplayDate(normalizedDate) : "Not set";
}

function getRentCycleLabel(record) {
  const months = resolveRentCycleMonths(record.rentCycleType, record.rentCycleMonths);

  if (record.rentCycleType === "custom" && months > 0) {
    return `${months}-month custom cycle`;
  }

  const matchedOption = RENT_CYCLE_OPTIONS.find((option) => option.value === record.rentCycleType);

  if (matchedOption) {
    return `${matchedOption.label} cycle`;
  }

  return months > 0 ? `${months}-month cycle` : "Cycle not set";
}

function buildCoverageLabel(record) {
  if (record.rentCoverageStartDate && record.rentCoverageEndDate) {
    return `${formatDisplayDate(record.rentCoverageStartDate)} to ${formatDisplayDate(
      record.rentCoverageEndDate
    )}`;
  }

  if (record.rentCoverageStartDate) {
    return `Starts ${formatDisplayDate(record.rentCoverageStartDate)}`;
  }

  return "Coverage not set";
}

function buildLeasePeriodLabel(record) {
  if (record.moveInDate && record.moveOutDate) {
    return `${formatDisplayDate(record.moveInDate)} to ${formatDisplayDate(record.moveOutDate)}`;
  }

  if (record.moveInDate) {
    return `Move-in ${formatDisplayDate(record.moveInDate)}`;
  }

  return "Lease dates not set";
}

function buildDueDateLabel(record) {
  const parts = [];

  if (record.nextRentDueDate) {
    parts.push(`Rent ${formatDisplayDate(record.nextRentDueDate)}`);
  }

  if (record.billDueDate) {
    parts.push(`Bills ${formatDisplayDate(record.billDueDate)}`);
  }

  return parts.join(" • ") || "No due dates set";
}

function buildRenewalLabel(record) {
  return record.renewalDate
    ? `Renewal ${formatDisplayDate(record.renewalDate)}`
    : "Renewal not set";
}

function buildBillBreakdownLabel(record) {
  const parts = [];

  if (parseOptionalAmount(record.waterBill) > 0) {
    parts.push(`Water ${formatCurrency(record.waterBill)}`);
  }

  if (parseOptionalAmount(record.toiletBill) > 0) {
    parts.push(`Toilet ${formatCurrency(record.toiletBill)}`);
  }

  if (parseOptionalAmount(record.sweepingBill) > 0) {
    parts.push(`Sweep ${formatCurrency(record.sweepingBill)}`);
  }

  if (parseOptionalAmount(record.wasteBill) > 0) {
    parts.push(`Waste ${formatCurrency(record.wasteBill)}`);
  }

  const customItems = getCustomBillItemEntries(record);

  if (customItems.length > 0) {
    parts.push(`${customItems.length} custom`);
  }

  return parts.join(" • ") || "No bills saved";
}

function getAlertPriority(alert) {
  if (alert.severity === "overdue") {
    return 0;
  }

  if (alert.type === "bill-due") {
    return 1;
  }

  if (alert.type === "rent-due") {
    return 2;
  }

  return 3;
}

function buildAlertMessage(type, severity, balance, dueDate) {
  if (type === "renewal") {
    return severity === "overdue"
      ? `Renewal passed on ${formatDisplayDate(dueDate)}.`
      : `Renewal due on ${formatDisplayDate(dueDate)}.`;
  }

  const balanceLabel = formatCurrency(balance);

  if (type === "bill-due") {
    return severity === "overdue"
      ? `Bills balance ${balanceLabel} overdue since ${formatDisplayDate(dueDate)}.`
      : `Bills balance ${balanceLabel} due on ${formatDisplayDate(dueDate)}.`;
  }

  return severity === "overdue"
    ? `Rent balance ${balanceLabel} overdue since ${formatDisplayDate(dueDate)}.`
    : `Rent balance ${balanceLabel} due on ${formatDisplayDate(dueDate)}.`;
}

function buildAlertsForRentalRecord(record) {
  const alerts = [];
  const canHaveTenantAlerts = record.occupancyStatus !== "Vacant";
  const rentBalanceForAlert =
    getOutstandingRent(record) + getCarryForwardBalance(record);
  const billBalance = getOutstandingBills(record);

  if (canHaveTenantAlerts && record.nextRentDueDate && rentBalanceForAlert > 0) {
    const rentDaysRemaining = daysUntilDate(record.nextRentDueDate);

    if (Number.isFinite(rentDaysRemaining) && rentDaysRemaining <= 14) {
      const severity = rentDaysRemaining < 0 ? "overdue" : "due";
      alerts.push({
        suite: record.suite,
        type: "rent-due",
        severity,
        label: severity === "overdue" ? "Overdue" : "Rent Due",
        pillClass: severity === "overdue" ? "alert-pill-overdue" : "alert-pill-due",
        dueDate: record.nextRentDueDate,
        message: buildAlertMessage(
          "rent-due",
          severity,
          rentBalanceForAlert,
          record.nextRentDueDate
        )
      });
    }
  }

  if (canHaveTenantAlerts && record.billDueDate && billBalance > 0) {
    const billDaysRemaining = daysUntilDate(record.billDueDate);

    if (Number.isFinite(billDaysRemaining) && billDaysRemaining <= 7) {
      const severity = billDaysRemaining < 0 ? "overdue" : "due";
      alerts.push({
        suite: record.suite,
        type: "bill-due",
        severity,
        label: severity === "overdue" ? "Overdue" : "Bill Due",
        pillClass: severity === "overdue" ? "alert-pill-overdue" : "alert-pill-due",
        dueDate: record.billDueDate,
        message: buildAlertMessage("bill-due", severity, billBalance, record.billDueDate)
      });
    }
  }

  if (canHaveTenantAlerts && record.renewalDate) {
    const renewalDaysRemaining = daysUntilDate(record.renewalDate);

    if (Number.isFinite(renewalDaysRemaining) && renewalDaysRemaining <= 30) {
      const severity = renewalDaysRemaining < 0 ? "overdue" : "due";
      alerts.push({
        suite: record.suite,
        type: "renewal",
        severity,
        label: severity === "overdue" ? "Overdue" : "Renewal Due",
        pillClass: severity === "overdue" ? "alert-pill-overdue" : "alert-pill-due",
        dueDate: record.renewalDate,
        message: buildAlertMessage("renewal", severity, 0, record.renewalDate)
      });
    }
  }

  return alerts.sort((left, right) => {
    const priorityDifference = getAlertPriority(left) - getAlertPriority(right);

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    return (left.dueDate || "").localeCompare(right.dueDate || "");
  });
}

function buildRecordAlertLabel(record) {
  const alerts = buildAlertsForRentalRecord(record);
  return alerts.length === 0 ? "On track" : alerts[0].message;
}

function hasMatchingRentalAlert(record, filterValue) {
  const alerts = buildAlertsForRentalRecord(record);

  if (filterValue === "overdue") {
    return alerts.some((alert) => alert.severity === "overdue");
  }

  return alerts.some((alert) => alert.type === filterValue);
}

function createEmptyRentalProfile(suite) {
  return {
    id: "",
    createdAt: "",
    updatedAt: "",
    month: "",
    suite,
    occupancyStatus: "Vacant",
    tenantName: "",
    tenantPhone: "",
    tenantAddress: "",
    emergencyContact: "",
    tenantIdRef: "",
    moveInDate: "",
    moveOutDate: "",
    rentCycleType: "",
    rentCycleMonths: 0,
    rentCycleAmount: 0,
    rentDue: 0,
    rentPaid: 0,
    rentCoverageStartDate: "",
    rentCoverageEndDate: "",
    nextRentDueDate: "",
    renewalDate: "",
    rentPaymentDate: "",
    rentPaymentMethod: "",
    rentPaymentReference: "",
    rentReceivedBy: "",
    waterBill: 0,
    toiletBill: 0,
    sweepingBill: 0,
    wasteBill: 0,
    billDueDate: "",
    billAmountPaid: 0,
    billPaymentDate: "",
    billPaymentMethod: "",
    billPaymentReference: "",
    billReceivedBy: "",
    arrearsBroughtForward: 0,
    lateFee: 0,
    customBillItems: "",
    notes: "",
    agreementGeneratedAt: ""
  };
}

function getLatestRentalProfiles() {
  const latestBySuite = buildLatestRentalProfileMap(state.rentals);

  const listedSuites = APARTMENT_PORTFOLIO_SUITES.map(
    (suite) => latestBySuite.get(suite) || createEmptyRentalProfile(suite)
  );
  const additionalSuites = Array.from(latestBySuite.values()).filter(
    (record) => !APARTMENT_PORTFOLIO_SUITES.includes(record.suite)
  );

  return [...listedSuites, ...additionalSuites];
}

function buildLatestRentalProfileMap(records) {
  const latestBySuite = new Map();

  records.forEach((record) => {
    const existing = latestBySuite.get(record.suite);

    if (
      !existing ||
      record.month > existing.month ||
      (record.month === existing.month &&
        (record.updatedAt || record.createdAt || "").localeCompare(
          existing.updatedAt || existing.createdAt || ""
        ) > 0)
    ) {
      latestBySuite.set(record.suite, record);
    }
  });

  return latestBySuite;
}

function getLatestRentalRecords(records) {
  return Array.from(buildLatestRentalProfileMap(records).values()).sort((left, right) =>
    normalizeSuite(left.suite).localeCompare(normalizeSuite(right.suite))
  );
}

function getSuiteRentalHistory(suite) {
  const normalizedSuite = normalizeSuite(suite);

  if (!normalizedSuite) {
    return [];
  }

  return [...state.rentals]
    .filter((record) => record.suite === normalizedSuite)
    .sort((left, right) => {
      const monthDifference = right.month.localeCompare(left.month);

      if (monthDifference !== 0) {
        return monthDifference;
      }

      return (right.updatedAt || right.createdAt || "").localeCompare(
        left.updatedAt || left.createdAt || ""
      );
    });
}

function getLatestRentalRecordForSuite(suite, options = {}) {
  const excludedId = normalizeText(options.excludeId);
  return getSuiteRentalHistory(suite).find((record) => record.id !== excludedId) || null;
}

function getSuitePaymentHistory(suite) {
  return getSuiteRentalHistory(suite).slice(0, 6);
}

function buildTenantIdentityKey(record) {
  const idReference = normalizeText(record?.tenantIdRef).toLowerCase();

  if (idReference) {
    return `id:${idReference}`;
  }

  const phone = normalizeText(record?.tenantPhone).replace(/\D+/g, "");

  if (phone) {
    return `phone:${phone}`;
  }

  const tenantName = normalizeText(record?.tenantName).toLowerCase();
  return tenantName ? `name:${tenantName}` : "";
}

function isSameTenantRecord(left, right) {
  const leftKey = buildTenantIdentityKey(left);
  const rightKey = buildTenantIdentityKey(right);

  if (leftKey && rightKey) {
    return leftKey === rightKey;
  }

  const leftName = normalizeText(left?.tenantName).toLowerCase();
  const rightName = normalizeText(right?.tenantName).toLowerCase();
  return Boolean(leftName && rightName && leftName === rightName);
}

function isNewTenantCapture(record, previousSuiteRecord) {
  if (!record || !TENANCY_ACTIVE_STATUSES.has(record.occupancyStatus) || !normalizeText(record.tenantName)) {
    return false;
  }

  if (!previousSuiteRecord) {
    return true;
  }

  if (!TENANCY_ACTIVE_STATUSES.has(previousSuiteRecord.occupancyStatus)) {
    return true;
  }

  return !isSameTenantRecord(record, previousSuiteRecord);
}

function isRentPaymentConfirmedForAgreement(record) {
  return (
    parseOptionalAmount(record?.rentPaid) > 0 ||
    Boolean(normalizeDateInput(record?.rentPaymentDate)) ||
    Boolean(normalizeText(record?.rentPaymentMethod)) ||
    Boolean(normalizeText(record?.rentPaymentReference)) ||
    Boolean(normalizeText(record?.rentReceivedBy))
  );
}

function shouldAutoGenerateTenancyAgreement(record, previousSuiteRecord) {
  return isNewTenantCapture(record, previousSuiteRecord) && isRentPaymentConfirmedForAgreement(record);
}

function shouldPromptForAgreementAfterSave(record, previousSuiteRecord) {
  return isNewTenantCapture(record, previousSuiteRecord) && !isRentPaymentConfirmedForAgreement(record);
}

function getTenantRelevantRentalHistory(record) {
  if (!record?.suite) {
    return [];
  }

  const suiteHistory = getSuiteRentalHistory(record.suite);
  const referenceKey = buildTenantIdentityKey(record);
  const referenceName = normalizeText(record.tenantName).toLowerCase();

  if (!referenceKey && !referenceName && !TENANCY_ACTIVE_STATUSES.has(record.occupancyStatus)) {
    return [];
  }

  return suiteHistory.filter((item) => {
    if (item.id === record.id) {
      return false;
    }

    if (referenceKey) {
      return buildTenantIdentityKey(item) === referenceKey;
    }

    if (referenceName) {
      return normalizeText(item.tenantName).toLowerCase() === referenceName;
    }

    return true;
  });
}

function getTenantStatementScopedHistory(record) {
  const targetMonth = normalizeMonthInput(record?.month);

  return getTenantRelevantRentalHistory(record).filter((item) => {
    if (!targetMonth) {
      return true;
    }

    return normalizeMonthInput(item.month) < targetMonth;
  });
}

function pickLatestRentalString(records, key) {
  for (const record of records) {
    const value = normalizeText(record?.[key]);

    if (value) {
      return value;
    }
  }

  return "";
}

function pickLatestRentalDate(records, key) {
  for (const record of records) {
    const value = normalizeDateInput(record?.[key]);

    if (value) {
      return value;
    }
  }

  return "";
}

function pickLatestRentalAmount(records, key) {
  for (const record of records) {
    const value = parseOptionalAmount(record?.[key]);

    if (value > 0) {
      return value;
    }
  }

  return 0;
}

function pickLatestRentalInteger(records, key) {
  for (const record of records) {
    const value = parsePositiveInteger(record?.[key]);

    if (value > 0) {
      return value;
    }
  }

  return 0;
}

function buildTenancyAgreementSourceRecord(record, relatedHistory = null) {
  if (!record?.suite) {
    return null;
  }

  const scopedHistory = Array.isArray(relatedHistory)
    ? relatedHistory
    : getTenantRelevantRentalHistory(record);
  const sources = [record, ...scopedHistory];
  const paymentRecord = sources.find((item) => isRentPaymentConfirmedForAgreement(item)) || null;
  const billRecord = sources.find((item) => getBillsTotal(item) > 0) || null;
  const rentCycleType = pickLatestRentalString(sources, "rentCycleType");
  const rentCycleMonths = resolveRentCycleMonths(
    rentCycleType,
    pickLatestRentalInteger(sources, "rentCycleMonths")
  );
  const rentCycleAmount =
    pickLatestRentalAmount(sources, "rentCycleAmount") ||
    pickLatestRentalAmount(sources, "rentDue") ||
    pickLatestRentalAmount(sources, "rentPaid");
  const rentDue =
    parseOptionalAmount(paymentRecord?.rentDue) ||
    rentCycleAmount ||
    pickLatestRentalAmount(sources, "rentDue");

  return {
    ...record,
    tenantName: pickLatestRentalString(sources, "tenantName"),
    tenantPhone: pickLatestRentalString(sources, "tenantPhone"),
    tenantAddress: pickLatestRentalString(sources, "tenantAddress"),
    emergencyContact: pickLatestRentalString(sources, "emergencyContact"),
    tenantIdRef: pickLatestRentalString(sources, "tenantIdRef"),
    moveInDate: pickLatestRentalDate(sources, "moveInDate"),
    moveOutDate: pickLatestRentalDate(sources, "moveOutDate"),
    rentCycleType,
    rentCycleMonths,
    rentCycleAmount,
    rentDue,
    rentPaid: parseOptionalAmount(paymentRecord?.rentPaid) || pickLatestRentalAmount(sources, "rentPaid"),
    rentCoverageStartDate:
      pickLatestRentalDate(paymentRecord ? [paymentRecord, ...sources] : sources, "rentCoverageStartDate"),
    rentCoverageEndDate:
      pickLatestRentalDate(paymentRecord ? [paymentRecord, ...sources] : sources, "rentCoverageEndDate"),
    nextRentDueDate: pickLatestRentalDate(sources, "nextRentDueDate"),
    renewalDate: pickLatestRentalDate(sources, "renewalDate"),
    rentPaymentDate: pickLatestRentalDate(paymentRecord ? [paymentRecord, ...sources] : sources, "rentPaymentDate"),
    rentPaymentMethod: pickLatestRentalString(
      paymentRecord ? [paymentRecord, ...sources] : sources,
      "rentPaymentMethod"
    ),
    rentPaymentReference: pickLatestRentalString(
      paymentRecord ? [paymentRecord, ...sources] : sources,
      "rentPaymentReference"
    ),
    rentReceivedBy: pickLatestRentalString(
      paymentRecord ? [paymentRecord, ...sources] : sources,
      "rentReceivedBy"
    ),
    waterBill: parseOptionalAmount(billRecord?.waterBill) || pickLatestRentalAmount(sources, "waterBill"),
    toiletBill: parseOptionalAmount(billRecord?.toiletBill) || pickLatestRentalAmount(sources, "toiletBill"),
    sweepingBill:
      parseOptionalAmount(billRecord?.sweepingBill) || pickLatestRentalAmount(sources, "sweepingBill"),
    wasteBill: parseOptionalAmount(billRecord?.wasteBill) || pickLatestRentalAmount(sources, "wasteBill"),
    customBillItems:
      normalizeText(billRecord?.customBillItems) || pickLatestRentalString(sources, "customBillItems"),
    agreementGeneratedAt: pickLatestRentalString(sources, "agreementGeneratedAt")
  };
}

function buildAgreementGeneratedAt(record) {
  const directValue = normalizeText(record?.agreementGeneratedAt);

  if (directValue) {
    return directValue;
  }

  const relevantHistory = getTenantRelevantRentalHistory(record);
  return pickLatestRentalString(relevantHistory, "agreementGeneratedAt");
}

function buildAgreementGeneratedLabel(record) {
  const generatedAt = buildAgreementGeneratedAt(record);

  if (!generatedAt) {
    return "Not generated yet";
  }

  const parsed = new Date(generatedAt);

  if (!Number.isFinite(parsed.getTime())) {
    return "Generated";
  }

  return `Downloaded ${new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(parsed)}`;
}

function buildApartmentAlerts(records) {
  return records
    .flatMap((record) => buildAlertsForRentalRecord(record))
    .sort((left, right) => {
      const priorityDifference = getAlertPriority(left) - getAlertPriority(right);

      if (priorityDifference !== 0) {
        return priorityDifference;
      }

      const dateDifference = (left.dueDate || "").localeCompare(right.dueDate || "");

      if (dateDifference !== 0) {
        return dateDifference;
      }

      return left.suite.localeCompare(right.suite);
    });
}

function buildGeneratedRentalRecord(profile, targetMonth) {
  const normalizedMonth = normalizeMonthInput(targetMonth);

  if (!normalizedMonth || !profile?.suite || profile.occupancyStatus === "Vacant") {
    return null;
  }

  const cycleMonths = resolveRentCycleMonths(profile.rentCycleType, profile.rentCycleMonths);
  const nextRentDueDate =
    profile.nextRentDueDate ||
    (profile.rentCoverageEndDate ? shiftDateByDays(profile.rentCoverageEndDate, 1) : "");
  const rentIsDueThisMonth = Boolean(nextRentDueDate && nextRentDueDate.startsWith(normalizedMonth));
  const carriedBalance = getTenantCurrentRunningBalance(profile);
  const generatedCoverageStart = rentIsDueThisMonth
    ? nextRentDueDate
    : profile.rentCoverageStartDate;
  const generatedCoverageEnd =
    rentIsDueThisMonth && generatedCoverageStart && cycleMonths > 0
      ? shiftDateByMonths(generatedCoverageStart, cycleMonths, -1)
      : profile.rentCoverageEndDate;
  const generatedNextRentDueDate =
    rentIsDueThisMonth && generatedCoverageEnd
      ? shiftDateByDays(generatedCoverageEnd, 1)
      : nextRentDueDate;

  return finalizeRentalDraft({
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    month: normalizedMonth,
    suite: profile.suite,
    occupancyStatus: profile.occupancyStatus,
    tenantName: profile.tenantName,
    tenantPhone: profile.tenantPhone,
    tenantAddress: profile.tenantAddress,
    emergencyContact: profile.emergencyContact,
    tenantIdRef: profile.tenantIdRef,
    moveInDate: profile.moveInDate,
    moveOutDate: profile.moveOutDate,
    rentCycleType: profile.rentCycleType,
    rentCycleMonths: cycleMonths,
    rentCycleAmount: profile.rentCycleAmount,
    rentDue: rentIsDueThisMonth ? profile.rentCycleAmount : 0,
    rentPaid: 0,
    rentCoverageStartDate: generatedCoverageStart,
    rentCoverageEndDate: generatedCoverageEnd,
    nextRentDueDate: generatedNextRentDueDate,
    renewalDate: profile.renewalDate || generatedNextRentDueDate,
    rentPaymentDate: "",
    rentPaymentMethod: "",
    rentPaymentReference: "",
    rentReceivedBy: "",
    waterBill: profile.waterBill,
    toiletBill: profile.toiletBill,
    sweepingBill: profile.sweepingBill,
    wasteBill: profile.wasteBill,
    billDueDate:
      getBillsTotal(profile) > 0
        ? buildMonthDayDate(normalizedMonth, extractPreferredBillDay(profile.billDueDate))
        : "",
    billAmountPaid: 0,
    billPaymentDate: "",
    billPaymentMethod: "",
    billPaymentReference: "",
    billReceivedBy: "",
    arrearsBroughtForward: carriedBalance,
    lateFee: 0,
    customBillItems: profile.customBillItems,
    agreementGeneratedAt: profile.agreementGeneratedAt,
    notes: normalizeText(
      `Generated for ${formatMonthLabel(normalizedMonth)} from the latest ${profile.suite} profile.`
    )
  });
}

function readRentalBillFormRecord() {
  return {
    waterBill: parseOptionalAmount(elements.waterBill.value),
    toiletBill: parseOptionalAmount(elements.toiletBill.value),
    sweepingBill: parseOptionalAmount(elements.sweepingBill.value),
    wasteBill: parseOptionalAmount(elements.wasteBill.value),
    billAmountPaid: parseOptionalAmount(elements.billAmountPaid.value),
    customBillItems: String(elements.customBillItems.value || "")
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((line) => normalizeText(line))
      .filter(Boolean)
      .join("\n")
  };
}

function normalizeRentalCaptureMode(value) {
  return value === "prospective" ? "prospective" : "retrospective";
}

function inferRentalCaptureMode(monthKey, record = null) {
  const normalizedMonth = normalizeMonthInput(monthKey);

  if (!normalizedMonth) {
    return "retrospective";
  }

  const currentMonthKey = getMonthKey(new Date());

  if (normalizedMonth > currentMonthKey) {
    return "prospective";
  }

  if (normalizedMonth < currentMonthKey) {
    return "retrospective";
  }

  const noteText = normalizeText(record?.notes).toLowerCase();
  const hasSavedPayments =
    parseOptionalAmount(record?.rentPaid) > 0 ||
    parseOptionalAmount(record?.billAmountPaid) > 0 ||
    Boolean(normalizeDateInput(record?.rentPaymentDate)) ||
    Boolean(normalizeDateInput(record?.billPaymentDate));

  return noteText.startsWith("generated for") && !hasSavedPayments ? "prospective" : "retrospective";
}

function autoAdjustRentalCaptureMode(monthKey) {
  const normalizedMonth = normalizeMonthInput(monthKey);

  if (!normalizedMonth) {
    return;
  }

  const currentMonthKey = getMonthKey(new Date());

  if (normalizedMonth > currentMonthKey) {
    elements.rentalCaptureMode.value = "prospective";
    return;
  }

  if (normalizedMonth < currentMonthKey) {
    elements.rentalCaptureMode.value = "retrospective";
  }
}

function updateCaptureModeSummary() {
  const captureMode = normalizeRentalCaptureMode(elements.rentalCaptureMode.value);
  const month = normalizeMonthInput(elements.rentalMonth.value);
  const monthLabel = month ? formatMonthLabel(month) : "this month";
  const rentDue = parseOptionalAmount(elements.rentDue.value);
  const billsDue = getBillsTotal(readRentalBillFormRecord());
  const totalCharges = rentDue + billsDue;

  if (captureMode === "prospective") {
    elements.captureModeSummaryText.textContent = `${monthLabel} is set to prospective capture. Use this to prepare an upcoming month by entering expected rent due, monthly bills, and due dates now. Leave Rent Paid and Bills Paid at 0.00 until money is actually received${
      totalCharges > 0 ? `; planned charges currently total ${formatCurrency(totalCharges)}.` : "."
    }`;
    return;
  }

  elements.captureModeSummaryText.textContent = `${monthLabel} is set to retrospective capture. Use this to record what actually happened in that month, including charges, payments received, arrears, late fees, and any unpaid bill balance${
    totalCharges > 0 ? `; charges currently entered total ${formatCurrency(totalCharges)}.` : "."
  }`;
}

function updateMonthlyBillsHelper() {
  const record = readRentalBillFormRecord();
  const captureMode = normalizeRentalCaptureMode(elements.rentalCaptureMode.value);
  const billsDue = getBillsTotal(record);
  const billsOutstanding = getOutstandingBills(record);
  const month = normalizeMonthInput(elements.rentalMonth.value);
  const monthLabel = month ? formatMonthLabel(month) : "this month";

  updateCaptureModeSummary();

  elements.calculatedBillsDueValue.textContent = `Current monthly bills: ${formatCurrency(billsDue)}`;

  if (billsDue <= 0) {
    elements.monthlyBillsHelperText.textContent =
      captureMode === "prospective"
        ? `Prospective setup for ${monthLabel}: add expected monthly bills here when known, and keep the paid fields at 0.00 until payment is received. You can also use Generate Monthly Bill Records on the right to create the next month from the latest suite profile.`
        : `Retrospective bills-only capture for ${monthLabel}: leave Rent Due This Record and Rent Paid at 0.00, then enter only the actual monthly bill fields below so unpaid bills remain visible in the balance.`;
    return;
  }

  if (record.billAmountPaid > 0) {
    elements.monthlyBillsHelperText.textContent =
      captureMode === "prospective"
        ? `Advance or early bill payment entered for ${monthLabel}: ${formatCurrency(
            record.billAmountPaid
          )}. Remaining monthly bills balance: ${formatCurrency(
            billsOutstanding
          )}. If the tenant has not actually paid yet, return Bills Paid to 0.00 and save only the planned charges.`
        : `Bills paid entered for ${monthLabel}: ${formatCurrency(
            record.billAmountPaid
          )}. Remaining monthly bills balance: ${formatCurrency(
            billsOutstanding
          )}. If rent is not due this month, leave the rent fields at 0.00.`;
    return;
  }

  elements.monthlyBillsHelperText.textContent =
    captureMode === "prospective"
      ? `Planned monthly bills for ${monthLabel} total ${formatCurrency(
          billsDue
        )}. Save this record to track what will be due, then update Bills Paid later when the tenant settles the bills.`
      : `Actual monthly bills for ${monthLabel} total ${formatCurrency(
          billsDue
        )}. If this month is only for bills, leave the rent fields at 0.00 and save the record after setting the bill due date.`;
}

function handleFillBillsPaid() {
  const record = readRentalBillFormRecord();
  const billsDue = getBillsTotal(record);

  if (billsDue <= 0) {
    showToast("Enter at least one monthly bill amount first.");
    return;
  }

  elements.billAmountPaid.value = String(billsDue.toFixed(2));
  updateMonthlyBillsHelper();
  showToast("Total Bills Paid has been filled with the current monthly bill total.");
}

function handleRentCycleTypeChange() {
  const rentCycleType = normalizeRentCycleType(elements.rentCycleType.value);
  const matchedOption = RENT_CYCLE_OPTIONS.find((option) => option.value === rentCycleType);
  const isCustomCycle = rentCycleType === "custom";

  if (matchedOption && matchedOption.months > 0) {
    elements.rentCycleMonths.value = String(matchedOption.months);
  }

  elements.rentCycleMonths.readOnly = Boolean(matchedOption && !isCustomCycle);

  if (isCustomCycle && !elements.rentCycleMonths.value) {
    elements.rentCycleMonths.value = "1";
  }
}

function handleRentalMonthChange() {
  const month = normalizeMonthInput(elements.rentalMonth.value);

  if (!month) {
    updateMonthlyBillsHelper();
    return;
  }

  elements.generateRentalMonth.value = month;
  autoAdjustRentalCaptureMode(month);

  if (!elements.billDueDate.value || !elements.billDueDate.value.startsWith(month)) {
    elements.billDueDate.value = buildMonthDayDate(month, extractPreferredBillDay(elements.billDueDate.value));
  }

  updateMonthlyBillsHelper();
}

function handleGenerateRentalMonth() {
  const targetMonth = normalizeMonthInput(elements.generateRentalMonth.value);

  if (!targetMonth) {
    showToast("Choose the month you want to generate apartment bills for.");
    return;
  }

  const latestProfiles = getLatestRentalProfiles().filter((record) =>
    record.suite && ["Occupied", "Reserved"].includes(record.occupancyStatus)
  );
  const existingKeys = new Set(state.rentals.map((record) => buildRentalMergeKey(record)));
  const generatedRecords = [];
  let skippedCount = 0;

  latestProfiles.forEach((profile) => {
    const mergeKey = `${targetMonth}|${profile.suite}`;

    if (existingKeys.has(mergeKey)) {
      skippedCount += 1;
      return;
    }

    const generatedRecord = buildGeneratedRentalRecord(profile, targetMonth);

    if (!generatedRecord) {
      skippedCount += 1;
      return;
    }

    generatedRecords.push(generatedRecord);
  });

  if (generatedRecords.length === 0) {
    showToast(
      skippedCount > 0
        ? `No new apartment records were generated for ${formatMonthLabel(targetMonth)} because they already exist.`
        : "No apartment profiles are ready for monthly bill generation yet."
    );
    return;
  }

  state.rentals = sortRentals([...state.rentals, ...generatedRecords]);
  persistRentals();
  render();
  showToast(
    `${generatedRecords.length} apartment record${
      generatedRecords.length === 1 ? "" : "s"
    } generated for ${formatMonthLabel(targetMonth)}${
      skippedCount > 0 ? `, with ${skippedCount} skipped because a record already exists.` : "."
    }`
  );
}

function buildPrintDocumentMarkup(title, bodyMarkup) {
  return `<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #1f2933; margin: 32px; }
          h1, h2 { margin-bottom: 0.4rem; }
          p { margin: 0.2rem 0 0.8rem; }
          table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
          th, td { border: 1px solid #d6ddd5; padding: 8px; text-align: left; vertical-align: top; }
          th { background: #eef4ec; }
          .summary-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 1rem 0; }
          .summary-card { border: 1px solid #d6ddd5; padding: 12px; border-radius: 10px; background: #fafcf9; }
          .muted { color: #52606d; }
        </style>
      </head>
      <body>
        ${bodyMarkup}
      </body>
    </html>`;
}

function writePrintDocument(printTarget, title, bodyMarkup, options = {}) {
  const printDocument = printTarget?.document;

  if (!printDocument) {
    return null;
  }

  const cleanup = typeof options.cleanup === "function" ? options.cleanup : null;
  let cleanedUp = false;

  const runCleanup = () => {
    if (cleanedUp || !cleanup) {
      return;
    }

    cleanedUp = true;
    cleanup();
  };

  let hasPrinted = false;
  const triggerPrint = () => {
    if (hasPrinted) {
      return;
    }

    hasPrinted = true;

    if (cleanup) {
      printTarget.onafterprint = () => {
        runCleanup();
        printTarget.onafterprint = null;
      };
      window.setTimeout(runCleanup, 2000);
    }

    printTarget.focus();
    printTarget.print();
  };

  printDocument.open();
  printDocument.write(buildPrintDocumentMarkup(title, bodyMarkup));
  printDocument.close();
  window.setTimeout(triggerPrint, 300);
  return printTarget;
}

function openPrintWindow(title, bodyMarkup) {
  const printWindow = window.open("", "_blank", "width=960,height=900");

  if (printWindow) {
    return writePrintDocument(printWindow, title, bodyMarkup);
  }

  const printFrame = document.createElement("iframe");
  printFrame.setAttribute("aria-hidden", "true");
  printFrame.style.position = "fixed";
  printFrame.style.right = "0";
  printFrame.style.bottom = "0";
  printFrame.style.width = "0";
  printFrame.style.height = "0";
  printFrame.style.border = "0";
  document.body.appendChild(printFrame);

  const frameWindow = printFrame.contentWindow;

  if (!frameWindow) {
    printFrame.remove();
    showToast("The receipt could not be opened for printing in this browser.");
    return null;
  }

  showToast("Popup was blocked, so the receipt opened in the current page's print view instead.");
  return writePrintDocument(frameWindow, title, bodyMarkup, {
    cleanup: () => printFrame.remove()
  });
}

function printRentalReceipt(rentalId) {
  const record = state.rentals.find((item) => item.id === rentalId);

  if (!record) {
    showToast("That rental record could not be found.");
    return;
  }

  const customBillItems = getCustomBillItemEntries(record);
  const balanceSnapshot = getTenantBalanceSnapshot(record);
  const bodyMarkup = `
    <h1>OneRoot Apartment Receipt</h1>
    <p class="muted">${escapeHtml(record.suite)} • ${escapeHtml(formatMonthLabel(record.month))}</p>
    <div class="summary-grid">
      <div class="summary-card">
        <strong>Tenant</strong>
        <p>${escapeHtml(record.tenantName || "Not saved")}</p>
        <p>${escapeHtml(record.tenantPhone || "No phone saved")}</p>
      </div>
      <div class="summary-card">
        <strong>Status</strong>
        <p>${escapeHtml(record.occupancyStatus)}</p>
        <p>${escapeHtml(getRentCycleLabel(record))}</p>
      </div>
      <div class="summary-card">
        <strong>Rent</strong>
        <p>Due: ${escapeHtml(formatCurrency(record.rentDue))}</p>
        <p>Paid: ${escapeHtml(formatCurrency(record.rentPaid))}</p>
        <p>Payment: ${escapeHtml(record.rentPaymentMethod || "Not saved")}</p>
      </div>
      <div class="summary-card">
        <strong>Bills</strong>
        <p>Due: ${escapeHtml(formatCurrency(getBillsTotal(record)))}</p>
        <p>Paid: ${escapeHtml(formatCurrency(getBillsPaidAmount(record)))}</p>
        <p>Bill Payment: ${escapeHtml(record.billPaymentMethod || "Not saved")}</p>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Rent Due</td><td>${escapeHtml(formatCurrency(record.rentDue))}</td></tr>
        <tr><td>Rent Paid</td><td>${escapeHtml(formatCurrency(record.rentPaid))}</td></tr>
        <tr><td>Water Bill</td><td>${escapeHtml(formatCurrency(record.waterBill))}</td></tr>
        <tr><td>Toilet Bill</td><td>${escapeHtml(formatCurrency(record.toiletBill))}</td></tr>
        <tr><td>Sweeping & Gutter Cleaning</td><td>${escapeHtml(formatCurrency(record.sweepingBill))}</td></tr>
        <tr><td>Waste Management</td><td>${escapeHtml(formatCurrency(record.wasteBill))}</td></tr>
        ${customBillItems
          .map(
            (item) => `
              <tr>
                <td>${escapeHtml(item.label)}</td>
                <td>${escapeHtml(formatCurrency(item.amount))}</td>
              </tr>
            `
          )
          .join("")}
        <tr><td>Total Bills Paid</td><td>${escapeHtml(formatCurrency(getBillsPaidAmount(record)))}</td></tr>
        <tr><td>Arrears Brought Forward</td><td>${escapeHtml(
          formatCurrency(balanceSnapshot.openingArrears)
        )}</td></tr>
        <tr><td>Late Fee</td><td>${escapeHtml(formatCurrency(balanceSnapshot.lateFee))}</td></tr>
        <tr><td>Total Balance Due</td><td>${escapeHtml(
          formatCurrency(balanceSnapshot.totalBalance)
        )}</td></tr>
      </tbody>
    </table>
    <p class="muted">Rent ref: ${escapeHtml(record.rentPaymentReference || "Not saved")} • Bill ref: ${escapeHtml(
    record.billPaymentReference || "Not saved"
  )}</p>
    ${record.notes ? `<p><strong>Notes:</strong> ${escapeHtml(record.notes)}</p>` : ""}
  `;

  openPrintWindow(`OneRoot Apartment Receipt - ${record.suite}`, bodyMarkup);
}

function printTenantStatement(rentalId) {
  const record = state.rentals.find((item) => item.id === rentalId);

  if (!record) {
    showToast("That tenant statement record could not be found.");
    return;
  }

  const statementLedger = getTenantStatementLedger(record);
  const scopedHistory = getTenantStatementScopedHistory(record);
  const totalRentDue = statementLedger.reduce((sum, entry) => sum + entry.rentDue, 0);
  const totalRentPaid = statementLedger.reduce((sum, entry) => sum + entry.rentPaid, 0);
  const totalBillsDue = statementLedger.reduce((sum, entry) => sum + entry.billsDue, 0);
  const totalBillsPaid = statementLedger.reduce((sum, entry) => sum + entry.billsPaid, 0);
  const statementRecord = statementLedger[statementLedger.length - 1]?.record || record;
  const balanceSnapshot = getTenantBalanceSnapshot(statementRecord);
  const currentBalance =
    statementLedger[statementLedger.length - 1]?.runningBalance ??
    getTotalTenantBalance(statementRecord);
  const sourceRecord =
    buildTenancyAgreementSourceRecord(statementRecord, scopedHistory) || statementRecord;
  const bodyMarkup = `
    <h1>OneRoot Tenant Statement</h1>
    <p class="muted">${escapeHtml(record.suite)} • Through ${escapeHtml(
      formatMonthLabel(statementRecord.month)
    )} • Generated ${escapeHtml(formatDisplayDate(getTodayInputValue()))}</p>
    <div class="summary-grid">
      <div class="summary-card">
        <strong>Tenant</strong>
        <p>${escapeHtml(sourceRecord.tenantName || "Not saved")}</p>
        <p>${escapeHtml(sourceRecord.tenantPhone || "No phone saved")}</p>
      </div>
      <div class="summary-card">
        <strong>Cycle & Coverage</strong>
        <p>${escapeHtml(getRentCycleLabel(sourceRecord))}</p>
        <p>${escapeHtml(buildCoverageLabel(sourceRecord))}</p>
      </div>
      <div class="summary-card">
        <strong>Statement Totals</strong>
        <p>Rent paid: ${escapeHtml(formatCurrency(totalRentPaid))}</p>
        <p>Bills paid: ${escapeHtml(formatCurrency(totalBillsPaid))}</p>
      </div>
      <div class="summary-card">
        <strong>Current Balance</strong>
        <p>${escapeHtml(formatCurrency(currentBalance))}</p>
        <p>${escapeHtml(buildDueDateLabel(statementRecord))}</p>
      </div>
      <div class="summary-card">
        <strong>Balance Breakdown</strong>
        <p>Carry forward: ${escapeHtml(formatCurrency(balanceSnapshot.carryForwardBalance))}</p>
        <p>Unpaid rent: ${escapeHtml(formatCurrency(balanceSnapshot.outstandingRent))}</p>
        <p>Unpaid bills: ${escapeHtml(formatCurrency(balanceSnapshot.outstandingBills))}</p>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Month</th>
          <th>Status</th>
          <th>Rent Due</th>
          <th>Rent Paid</th>
          <th>Bills Due</th>
          <th>Bills Paid</th>
          <th>Arrears + Late Fee</th>
          <th>Balance</th>
        </tr>
      </thead>
      <tbody>
        ${statementLedger
          .map(
            ({ record: item, billsDue, billsPaid, openingArrears, lateFee, rentDue, rentPaid, runningBalance }) => `
              <tr>
                <td>${escapeHtml(formatMonthLabel(item.month))}</td>
                <td>${escapeHtml(item.occupancyStatus)}</td>
                <td>${escapeHtml(formatCurrency(rentDue))}</td>
                <td>${escapeHtml(formatCurrency(rentPaid))}</td>
                <td>${escapeHtml(formatCurrency(billsDue))}</td>
                <td>${escapeHtml(formatCurrency(billsPaid))}</td>
                <td>${escapeHtml(
                  formatCurrency(openingArrears + lateFee)
                )}</td>
                <td>${escapeHtml(formatCurrency(runningBalance))}</td>
              </tr>
            `
          )
          .join("")}
      </tbody>
      <tfoot>
        <tr>
          <th>Total</th>
          <th>—</th>
          <th>${escapeHtml(formatCurrency(totalRentDue))}</th>
          <th>${escapeHtml(formatCurrency(totalRentPaid))}</th>
          <th>${escapeHtml(formatCurrency(totalBillsDue))}</th>
          <th>${escapeHtml(formatCurrency(totalBillsPaid))}</th>
          <th>—</th>
          <th>${escapeHtml(formatCurrency(currentBalance))}</th>
        </tr>
      </tfoot>
    </table>
    ${sourceRecord.notes ? `<p><strong>Notes:</strong> ${escapeHtml(sourceRecord.notes)}</p>` : ""}
  `;

  openPrintWindow(`OneRoot Tenant Statement - ${record.suite}`, bodyMarkup);
}

function handlePrintApartmentReport() {
  const rentals = getFilteredRentals();
  const visibleLatestProfiles = getLatestRentalRecords(rentals);
  const alerts = buildApartmentAlerts(visibleLatestProfiles);
  const totalBalance = visibleLatestProfiles.reduce(
    (sum, record) => sum + getTotalTenantBalance(record),
    0
  );
  const bodyMarkup = `
    <h1>OneRoot Apartment Report</h1>
    <p class="muted">Generated ${escapeHtml(formatDisplayDate(getTodayInputValue()))}</p>
    <div class="summary-grid">
      <div class="summary-card">
        <strong>Visible Records</strong>
        <p>${escapeHtml(String(rentals.length))}</p>
      </div>
      <div class="summary-card">
        <strong>Total Rent Due</strong>
        <p>${escapeHtml(formatCurrency(rentals.reduce((sum, record) => sum + record.rentDue, 0)))}</p>
      </div>
      <div class="summary-card">
        <strong>Total Bills Due</strong>
        <p>${escapeHtml(formatCurrency(rentals.reduce((sum, record) => sum + getBillsTotal(record), 0)))}</p>
      </div>
      <div class="summary-card">
        <strong>Suites in Balance View</strong>
        <p>${escapeHtml(String(visibleLatestProfiles.length))}</p>
      </div>
      <div class="summary-card">
        <strong>Total Balance Due</strong>
        <p>${escapeHtml(formatCurrency(totalBalance))}</p>
      </div>
    </div>
    <p class="muted">Balance totals use the latest visible record for each suite so older months are not counted twice.</p>
    <h2>Due Alerts</h2>
    ${
      alerts.length === 0
        ? "<p>No rent, bill, or renewal alerts are currently due.</p>"
        : `
            <table>
              <thead>
                <tr>
                  <th>Suite</th>
                  <th>Alert</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                ${alerts
                  .slice(0, 20)
                  .map(
                    (alert) => `
                      <tr>
                        <td>${escapeHtml(alert.suite)}</td>
                        <td>${escapeHtml(alert.label)}</td>
                        <td>${escapeHtml(alert.message)}</td>
                      </tr>
                    `
                  )
                  .join("")}
              </tbody>
            </table>
          `
    }
    <h2>Current Suite Balances</h2>
    ${
      visibleLatestProfiles.length === 0
        ? "<p>No suite balances are available in the current apartment filter view.</p>"
        : `
            <table>
              <thead>
                <tr>
                  <th>Suite</th>
                  <th>Tenant</th>
                  <th>Latest Month</th>
                  <th>Next Due</th>
                  <th>Current Balance</th>
                </tr>
              </thead>
              <tbody>
                ${visibleLatestProfiles
                  .map(
                    (record) => `
                      <tr>
                        <td>${escapeHtml(record.suite)}</td>
                        <td>${escapeHtml(record.tenantName || "—")}</td>
                        <td>${escapeHtml(formatMonthLabel(record.month))}</td>
                        <td>${escapeHtml(buildDueDateLabel(record))}</td>
                        <td>${escapeHtml(formatCurrency(getTotalTenantBalance(record)))}</td>
                      </tr>
                    `
                  )
                  .join("")}
              </tbody>
            </table>
          `
    }
    <h2>Visible Apartment Records</h2>
    <table>
      <thead>
        <tr>
          <th>Month</th>
          <th>Suite</th>
          <th>Status</th>
          <th>Tenant</th>
          <th>Rent Due</th>
          <th>Rent Paid</th>
          <th>Bills Due</th>
          <th>Bills Paid</th>
          <th>Running Balance</th>
        </tr>
      </thead>
      <tbody>
        ${rentals
          .map(
            (record) => `
              <tr>
                <td>${escapeHtml(formatMonthLabel(record.month))}</td>
                <td>${escapeHtml(record.suite)}</td>
                <td>${escapeHtml(record.occupancyStatus)}</td>
                <td>${escapeHtml(record.tenantName || "—")}</td>
                <td>${escapeHtml(formatCurrency(record.rentDue))}</td>
                <td>${escapeHtml(formatCurrency(record.rentPaid))}</td>
                <td>${escapeHtml(formatCurrency(getBillsTotal(record)))}</td>
                <td>${escapeHtml(formatCurrency(getBillsPaidAmount(record)))}</td>
                <td>${escapeHtml(formatCurrency(getTotalTenantBalance(record)))}</td>
              </tr>
            `
          )
          .join("")}
      </tbody>
    </table>
  `;

  openPrintWindow("OneRoot Apartment Report", bodyMarkup);
}

function formatAgreementCurrency(amount) {
  const value = Number.isFinite(amount) ? amount : 0;
  const usesDecimals = Math.abs(value - Math.round(value)) > 0.001;

  return `GHS ${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: usesDecimals ? 2 : 0,
    maximumFractionDigits: 2
  }).format(value)}`;
}

function formatAgreementDate(dateString) {
  const normalizedDate = normalizeDateInput(dateString);

  if (!normalizedDate) {
    return "";
  }

  const [year, month, day] = normalizedDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

function buildAgreementIntervalLabel(months) {
  if (months === 12) {
    return "one (1) year";
  }

  if (months === 6) {
    return "six (6) months";
  }

  if (months === 1) {
    return "one (1) month";
  }

  return months > 0 ? `${months} months` : "the agreed lease period";
}

function describeAdvancePaymentInterval(months) {
  if (months === 12) {
    return "one year in advance";
  }

  if (months === 6) {
    return "six months in advance";
  }

  if (months === 1) {
    return "monthly in advance";
  }

  return months > 0 ? `${months} months in advance` : "in advance";
}

function buildTenancyAgreementCommencementDate(record) {
  return (
    normalizeDateInput(record.moveInDate) ||
    normalizeDateInput(record.rentCoverageStartDate) ||
    normalizeDateInput(record.rentPaymentDate) ||
    ""
  );
}

function buildTenancyAgreementExpiryDate(record) {
  if (normalizeDateInput(record.moveOutDate)) {
    return normalizeDateInput(record.moveOutDate);
  }

  if (normalizeDateInput(record.rentCoverageEndDate)) {
    return normalizeDateInput(record.rentCoverageEndDate);
  }

  const cycleMonths = resolveRentCycleMonths(record.rentCycleType, record.rentCycleMonths);
  const commencementDate = buildTenancyAgreementCommencementDate(record);

  if (commencementDate && cycleMonths > 0) {
    return shiftDateByMonths(commencementDate, cycleMonths, -1);
  }

  return "";
}

function buildCustomBillItemsNote(record) {
  const items = getCustomBillItemEntries(record);

  if (items.length === 0) {
    return "";
  }

  return ` Additional monthly bill items currently on record: ${items
    .map((item) => `${item.label} ${formatAgreementCurrency(item.amount)}`)
    .join("; ")}.`;
}

function buildTenancyAgreementPlaceholderMap(record) {
  const cycleMonths = resolveRentCycleMonths(record.rentCycleType, record.rentCycleMonths);
  const advanceRentDue =
    parseOptionalAmount(record.rentCycleAmount) ||
    parseOptionalAmount(record.rentDue) ||
    parseOptionalAmount(record.rentPaid);
  const amountReceived = parseOptionalAmount(record.rentPaid) || advanceRentDue;
  const monthlyRent = cycleMonths > 0 && advanceRentDue > 0 ? advanceRentDue / cycleMonths : advanceRentDue;
  const commencementDate = buildTenancyAgreementCommencementDate(record);
  const expiryDate = buildTenancyAgreementExpiryDate(record);
  const paymentDate = normalizeDateInput(record.rentPaymentDate);
  const agreementStatusDate = formatAgreementDate(paymentDate || getTodayInputValue());
  const effectiveFromDate = commencementDate || paymentDate;
  const waterToiletTotal = parseOptionalAmount(record.waterBill) + parseOptionalAmount(record.toiletBill);
  const serviceTotal = getBillsTotal(record);
  const leaseTermLabel = buildAgreementIntervalLabel(cycleMonths);

  return {
    "[[SUITE_NAME]]": record.suite || "Apartment Suite",
    "[[PROPERTY_LOCATION]]": TENANCY_PROPERTY_LOCATION,
    "[[LEASE_TERM_LABEL]]": `${leaseTermLabel} from the agreed commencement date to the matching expiry date.`,
    "[[LEASE_TERM_TEXT]]": leaseTermLabel,
    "[[RENT_PLAN_SUMMARY]]":
      monthlyRent > 0
        ? `${formatAgreementCurrency(monthlyRent)} per month, payable ${describeAdvancePaymentInterval(
            cycleMonths
          )}.`
        : TENANCY_PLACEHOLDER_LINE,
    "[[ADVANCE_RENT_DUE]]": advanceRentDue > 0 ? formatAgreementCurrency(advanceRentDue) : TENANCY_PLACEHOLDER_LINE,
    "[[AMOUNT_RECEIVED]]": amountReceived > 0 ? formatAgreementCurrency(amountReceived) : TENANCY_PLACEHOLDER_LINE,
    "[[MONTHLY_SERVICE_TOTAL]]":
      serviceTotal > 0 ? formatAgreementCurrency(serviceTotal) : formatAgreementCurrency(0),
    "[[PAYMENT_CHANNEL]]": TENANCY_PAYMENT_CHANNEL,
    "[[AGREEMENT_STATUS]]": `Generated after payment confirmation on ${agreementStatusDate}.`,
    "[[TENANT_NAME]]": record.tenantName || TENANCY_PLACEHOLDER_LINE,
    "[[TENANT_ADDRESS]]": record.tenantAddress || TENANCY_PLACEHOLDER_LINE,
    "[[TENANT_PHONE]]": record.tenantPhone || TENANCY_PLACEHOLDER_LINE,
    "[[TENANT_ID_REF]]": record.tenantIdRef || TENANCY_PLACEHOLDER_LINE,
    "[[COMMENCEMENT_DATE]]": formatAgreementDate(commencementDate) || TENANCY_PLACEHOLDER_LINE,
    "[[EXPIRY_DATE]]": formatAgreementDate(expiryDate) || TENANCY_PLACEHOLDER_LINE,
    "[[CUSTOM_BILL_ITEMS_NOTE]]": buildCustomBillItemsNote(record),
    "[[WATER_TOILET_BILL]]":
      waterToiletTotal > 0 ? formatAgreementCurrency(waterToiletTotal) : formatAgreementCurrency(0),
    "[[SWEEPING_BILL]]":
      parseOptionalAmount(record.sweepingBill) > 0
        ? formatAgreementCurrency(record.sweepingBill)
        : formatAgreementCurrency(0),
    "[[WASTE_BILL]]":
      parseOptionalAmount(record.wasteBill) > 0 ? formatAgreementCurrency(record.wasteBill) : formatAgreementCurrency(0),
    "[[PAYMENT_DATE]]": formatAgreementDate(paymentDate) || TENANCY_PLACEHOLDER_LINE,
    "[[PAYMENT_METHOD]]": record.rentPaymentMethod || TENANCY_PLACEHOLDER_LINE,
    "[[PAYMENT_REFERENCE]]": record.rentPaymentReference || TENANCY_PLACEHOLDER_LINE,
    "[[RECEIVED_BY]]": record.rentReceivedBy || TENANCY_PLACEHOLDER_LINE,
    "[[AGREEMENT_EFFECTIVE_FROM]]": formatAgreementDate(effectiveFromDate) || TENANCY_PLACEHOLDER_LINE
  };
}

function escapeXmlText(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function sanitizeFilenameSegment(value, fallback = "Agreement") {
  const normalized = normalizeText(value)
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return normalized || fallback;
}

function buildTenancyAgreementFilename(record) {
  return `${sanitizeFilenameSegment(record.suite, "Suite")}_${sanitizeFilenameSegment(
    record.tenantName,
    "Tenant"
  )}_Tenancy_Agreement.docx`;
}

function markRentalAgreementGenerated(rentalId, generatedAt = new Date().toISOString()) {
  const sourceRecord = state.rentals.find((item) => item.id === rentalId);

  if (!sourceRecord) {
    return;
  }

  const tenantKey = buildTenantIdentityKey(sourceRecord);

  state.rentals = sortRentals(
    state.rentals.map((record) => {
      if (record.suite !== sourceRecord.suite) {
        return record;
      }

      if (tenantKey && buildTenantIdentityKey(record) !== tenantKey) {
        return record;
      }

      return {
        ...record,
        agreementGeneratedAt: generatedAt,
        updatedAt: new Date().toISOString()
      };
    })
  );

  persistRentals();
}

function rememberAgreementReadyFile(record, filename, fileUrl) {
  const nextFile = {
    id: generateId(),
    suite: normalizeText(record.suite),
    tenantName: normalizeText(record.tenantName),
    filename,
    url: fileUrl,
    createdAt: new Date().toISOString()
  };

  const retainedFiles = [];

  state.agreementReadyFiles.forEach((file) => {
    const sameIdentity =
      file.suite === nextFile.suite &&
      normalizeText(file.tenantName).toLowerCase() === normalizeText(nextFile.tenantName).toLowerCase();

    if (!sameIdentity) {
      retainedFiles.push(file);
      return;
    }

    try {
      URL.revokeObjectURL(file.url);
    } catch (error) {
      console.error(error);
    }
  });

  const nextFiles = [nextFile, ...retainedFiles].slice(0, AGREEMENT_READY_FILE_LIMIT);

  retainedFiles.slice(AGREEMENT_READY_FILE_LIMIT - 1).forEach((file) => {
    try {
      URL.revokeObjectURL(file.url);
    } catch (error) {
      console.error(error);
    }
  });

  state.agreementReadyFiles = nextFiles;
}

async function generateTenancyAgreementForRentalById(rentalId) {
  const record = state.rentals.find((item) => item.id === rentalId);

  if (!record) {
    showToast("That rental record could not be found.");
    return false;
  }

  const generated = await generateTenancyAgreementForRental(record);

  if (generated) {
    render();
  }

  return generated;
}

async function generateTenancyAgreementForRental(record, options = {}) {
  const agreementRecord = buildTenancyAgreementSourceRecord(record);

  if (!agreementRecord) {
    if (!options.silent) {
      showToast("That tenancy agreement could not be prepared from the selected record.");
    }
    return false;
  }

  if (!TENANCY_ACTIVE_STATUSES.has(agreementRecord.occupancyStatus)) {
    if (!options.silent) {
      showToast("Only occupied or reserved suites can generate a tenancy agreement.");
    }
    return false;
  }

  if (!normalizeText(agreementRecord.tenantName)) {
    if (!options.silent) {
      showToast("Add the tenant name first, then generate the tenancy agreement.");
    }
    return false;
  }

  if (!isRentPaymentConfirmedForAgreement(agreementRecord)) {
    if (!options.silent) {
      showToast("Capture rent payment amount or confirmation details first, then generate the tenancy agreement.");
    }
    return false;
  }

  if (typeof window.JSZip === "undefined") {
    if (!options.silent) {
      showToast("The tenancy agreement generator is not available in this browser.");
    }
    return false;
  }

  try {
    const response = await fetch(TENANCY_TEMPLATE_PATH, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Template request failed with status ${response.status}.`);
    }

    const zip = await window.JSZip.loadAsync(await response.arrayBuffer());
    const templateDocument = zip.file("word/document.xml");

    if (!templateDocument) {
      throw new Error("The tenancy template document is missing its main XML payload.");
    }

    let documentXml = await templateDocument.async("string");
    const placeholderMap = buildTenancyAgreementPlaceholderMap(agreementRecord);

    Object.entries(placeholderMap).forEach(([placeholder, value]) => {
      documentXml = documentXml.replaceAll(placeholder, escapeXmlText(value));
    });

    zip.file("word/document.xml", documentXml);
    const blob = await zip.generateAsync({
      type: "blob",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    });

    const filename = buildTenancyAgreementFilename(agreementRecord);
    const fileUrl = downloadBlob(filename, blob, { keepUrl: true });
    rememberAgreementReadyFile(agreementRecord, filename, fileUrl);
    markRentalAgreementGenerated(record.id);
    renderAgreementReadyPanel();

    if (!options.silent) {
      showToast("Tenancy agreement prepared. If the download does not start, use Ready Agreements.");
    }

    return true;
  } catch (error) {
    console.error(error);

    if (!options.silent) {
      showToast("The tenancy agreement could not be generated.");
    }

    return false;
  }
}

function sanitizeAreaChoice(areaId, value) {
  const area = getBusinessArea(areaId || DEFAULT_BUSINESS_AREA_ID);
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    return OTHER_CUSTOM_OPTION;
  }

  const matchedOption = area.categories.find(
    (option) => option.toLowerCase() === normalizedValue.toLowerCase()
  );

  return matchedOption || OTHER_CUSTOM_OPTION;
}

function inferBusinessAreaId(record) {
  const haystack = [
    record.businessAreaId,
    record.businessArea,
    record.businessarea,
    record.business_area,
    record.category,
    record.expenseType,
    record.expensetype,
    record.description,
    record.notes,
    record.vendor,
    record.payee,
    record.purpose
  ]
    .map((value) => normalizeText(value).toLowerCase())
    .join(" ");

  if (/(water|wheelbarrow|vibrator|cutting machine|head pan|shovel|impact drill|nails)/.test(haystack)) {
    return "water-equipment";
  }

  if (/(fish|meat|sausage|gizzard|bread|oil|shea butter|groundnut|grocery|cold store)/.test(haystack)) {
    return "cold-store-groceries";
  }

  if (/(laundry|washing|ironing|folding|detergent|express laundry)/.test(haystack)) {
    return "laundry-services";
  }

  if (/(mobile money|momo|mtn|agent booth|transaction)/.test(haystack)) {
    return "mobile-money";
  }

  if (/(suite|apartment|rental room|peace|grace|joy|hope|faith|love|wisdom|unity|harmony)/.test(haystack)) {
    return "rentals-apartments";
  }

  if (/(kitchen|chef|meal prep|cooking fuel|gas refill|food prep)/.test(haystack)) {
    return "kitchen";
  }

  if (/(ice kenkey|sobolo|ice cream|drink|fresh food)/.test(haystack)) {
    return "fresh-foods-drinks";
  }

  return DEFAULT_BUSINESS_AREA_ID;
}

function mergeUniqueOptions(baseOptions, extraOptions) {
  const uniqueBaseOptions = Array.from(
    new Set(baseOptions.map((option) => normalizeText(option)).filter(Boolean))
  );
  const extras = extraOptions
    .map((option) => normalizeText(option))
    .filter(Boolean)
    .filter((option) => !uniqueBaseOptions.includes(option))
    .sort((left, right) => left.localeCompare(right));

  return [...uniqueBaseOptions, ...extras];
}

function getBudgetActual(expenses, salaryRecords, businessAreaId, category) {
  const expenseActual = expenses
    .filter(
      (expense) => expense.businessAreaId === businessAreaId && expense.category === category
    )
    .reduce((sum, expense) => sum + expense.amount, 0);

  const salaryActual =
    category === "Staff Wages"
      ? salaryRecords
          .filter((record) => record.businessAreaId === businessAreaId)
          .reduce((sum, record) => sum + record.amountPaid, 0)
      : 0;

  return expenseActual + salaryActual;
}

function getPettyCashBudgetActual(entries, businessAreaId) {
  return entries
    .filter((entry) => entry.businessAreaId === businessAreaId)
    .reduce((sum, entry) => sum + entry.amount, 0);
}

function buildBudgetStatus(actual, budgetAmount) {
  const difference = budgetAmount - actual;
  const ratio = budgetAmount > 0 ? actual / budgetAmount : 0;

  if (actual > budgetAmount) {
    return {
      label: "Over budget",
      pillClass: "budget-pill-over",
      barClass: "is-over",
      message: `${formatCurrency(Math.abs(difference))} over plan`
    };
  }

  if (ratio >= 1) {
    return {
      label: "Fully used",
      pillClass: "budget-pill-near-limit",
      barClass: "is-near-limit",
      message: "Budget fully used"
    };
  }

  if (ratio >= 0.85) {
    return {
      label: "Near limit",
      pillClass: "budget-pill-near-limit",
      barClass: "is-near-limit",
      message: `${formatCurrency(difference)} remaining`
    };
  }

  return {
    label: "On track",
    pillClass: "budget-pill-on-track",
    barClass: "",
    message: `${formatCurrency(difference)} remaining`
  };
}

function dateStamp() {
  const now = new Date();
  const date = formatDateInput(now).replaceAll("-", "");
  const time = [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map((value) => String(value).padStart(2, "0"))
    .join("");
  return `${date}-${time}`;
}

function triggerFileDownload(filename, url) {
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function buildFilePickerType(filename, mimeType) {
  const extension = `.${normalizeText(filename).split(".").pop() || "dat"}`.toLowerCase();
  const normalizedMimeType =
    normalizeText(String(mimeType || "").split(";")[0]) || "application/octet-stream";
  return {
    description: normalizeText(extension.replace(".", "")).toUpperCase() || "File",
    accept: {
      [normalizedMimeType]: [extension]
    }
  };
}

async function preparePreferredSaveHandle(filename, mimeType) {
  if (typeof window.showSaveFilePicker !== "function" || !window.isSecureContext) {
    return null;
  }

  try {
    return await window.showSaveFilePicker({
      suggestedName: filename,
      excludeAcceptAllOption: false,
      types: [buildFilePickerType(filename, mimeType)]
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw error;
    }

    console.error(error);
    return null;
  }
}

async function writeBlobToFileHandle(fileHandle, blob) {
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
}

function downloadBlob(filename, blob, options = {}) {
  const url = URL.createObjectURL(blob);
  triggerFileDownload(filename, url);

  if (options.keepUrl) {
    return url;
  }

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, options.revokeDelayMs || 3000);

  return url;
}

function downloadTextFile(filename, content, mimeType) {
  downloadBlob(filename, new Blob([content], { type: mimeType }));
}

async function saveTextFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  let preferredSaveHandle = null;

  try {
    preferredSaveHandle = await preparePreferredSaveHandle(filename, mimeType);
  } catch (error) {
    if (error?.name === "AbortError") {
      return false;
    }

    throw error;
  }

  if (preferredSaveHandle) {
    try {
      await writeBlobToFileHandle(preferredSaveHandle, blob);
      return true;
    } catch (error) {
      if (error?.name === "AbortError") {
        return false;
      }

      console.error(error);
    }
  }

  downloadBlob(filename, blob, { revokeDelayMs: 60000 });
  return true;
}

function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map(escapeCsvValue).join(",")).join("\r\n");
  downloadTextFile(filename, csv, "text/csv;charset=utf-8;");
}

async function saveCsvFile(filename, rows) {
  const csv = rows.map((row) => row.map(escapeCsvValue).join(",")).join("\r\n");
  return saveTextFile(filename, csv, "text/csv;charset=utf-8;");
}

function escapeCsvValue(value) {
  const cell = String(value ?? "");

  if (/[",\n]/.test(cell)) {
    return `"${cell.replaceAll('"', '""')}"`;
  }

  return cell;
}

function parseCsv(content) {
  const rows = [];
  let currentRow = [];
  let currentValue = "";
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    const nextCharacter = content[index + 1];

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        currentValue += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === "," && !inQuotes) {
      currentRow.push(currentValue);
      currentValue = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }

      currentRow.push(currentValue);

      if (currentRow.some((cell) => normalizeText(cell) !== "")) {
        rows.push(currentRow);
      }

      currentRow = [];
      currentValue = "";
      continue;
    }

    currentValue += character;
  }

  if (currentValue !== "" || currentRow.length > 0) {
    currentRow.push(currentValue);
    if (currentRow.some((cell) => normalizeText(cell) !== "")) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function normalizeHeader(value) {
  return normalizeText(value).toLowerCase().replace(/[\s-]+/g, "_");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
