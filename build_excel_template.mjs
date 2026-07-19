import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputDir = path.resolve(__dirname, "outputs", "oneroot-essentials-register");
const workbookPath = path.join(outputDir, "OneRoot_Essentials_Operations_Register.xlsx");
const inspectPath = `${workbookPath}.inspect.ndjson`;
const shouldRenderPreviews = process.argv.includes("--with-previews");
const shouldInspectWorkbook = process.argv.includes("--with-inspect");

const businessAreas = [
  "OneRoot Water & Equipment Rentals",
  "OneRoot Cold Store & Groceries",
  "OneRoot Laundry Services",
  "OneRoot Mobile Money Services",
  "OneRoot Rentals & Apartments",
  "OneRoot Fresh Foods & Drinks",
  "OneRoot Kitchen",
  "OneRoot Shared Operations"
];

const expenseTypes = [
  "Water Stock & Supply",
  "Equipment Repairs",
  "Fuel & Delivery",
  "Tools & Consumables",
  "Site Labour",
  "Utilities",
  "Marketing & Promotion",
  "Professional Services",
  "Rent & Space",
  "Inventory Purchase",
  "Cold Chain Utilities",
  "Packaging & Carrier Bags",
  "Delivery & Transport",
  "Spoilage & Waste",
  "Repairs & Maintenance",
  "Staff Wages",
  "Detergents & Laundry Supplies",
  "Machine Repairs",
  "Power & Water",
  "Packaging & Hangers",
  "Transaction Charges",
  "Booth Utilities",
  "Cash Handling & Security",
  "Stationery & Receipt Rolls",
  "Connectivity & Data",
  "Licensing & Fees",
  "Suite Maintenance",
  "Cleaning & Housekeeping",
  "Linen & Furnishings",
  "Security",
  "Ingredients & Stock",
  "Food Ingredients & Produce",
  "Packaging & Cups",
  "Packaging & Serving",
  "Cold Storage & Ice",
  "Production Labour",
  "Cooking Fuel & Gas",
  "Kitchen Utensils & Smallware",
  "Cleaning & Hygiene",
  "Office Supplies",
  "Software & Subscriptions",
  "Transport",
  "Bank Charges",
  "Taxes & Fees",
  "Other / Custom"
];

const paymentMethods = ["Bank Transfer", "Cash", "Card", "Mobile Money", "Cheque", "Petty Cash"];
const receiptStatuses = ["Uploaded", "Pending", "Not Required"];
const suites = [
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
const occupancyStatuses = ["Occupied", "Vacant", "Reserved", "Under Maintenance"];
const rentCycles = ["6 Months", "12 Months", "Custom"];
const pettyCashTypes = [
  "Opening Float",
  "Cash Top-up",
  "Expense Paid",
  "Cash Returned",
  "Adjustment In",
  "Adjustment Out"
];
const supplierStatuses = ["Due", "Part Paid", "Paid", "Overdue"];
const recurringModules = ["Expense", "Supplier Bill", "Maintenance Task", "Apartment Bill"];
const recurringFrequencies = ["Monthly", "Quarterly", "Half-Yearly", "Yearly"];
const maintenancePriorities = ["Low", "Medium", "High", "Critical"];
const maintenanceStatuses = ["Open", "Scheduled", "In Progress", "Completed"];
const activeStates = ["Active", "Paused"];
const salaryTypes = ["Monthly Salary", "Casual Wage", "Overtime", "Bonus", "Advance"];

const workbook = Workbook.create();
const summary = workbook.worksheets.add("Summary");
const expenses = workbook.worksheets.add("Expenses");
const budgetPlanner = workbook.worksheets.add("Budget_Planner");
const sales = workbook.worksheets.add("Daily_Sales");
const apartments = workbook.worksheets.add("Apartments");
const pettyCash = workbook.worksheets.add("Petty_Cash");
const pettyCashBudget = workbook.worksheets.add("Petty_Cash_Budget");
const salaryRegister = workbook.worksheets.add("Salary_Register");
const supplierLedger = workbook.worksheets.add("Supplier_Ledger");
const recurringControls = workbook.worksheets.add("Recurring_Controls");
const maintenanceLog = workbook.worksheets.add("Maintenance_Log");
const lists = workbook.worksheets.add("Lists");

summary.showGridLines = false;

buildSummarySheet();
buildListsSheet();
buildExpensesSheet();
buildBudgetPlannerSheet();
buildSalesSheet();
buildApartmentsSheet();
buildPettyCashSheet();
buildPettyCashBudgetSheet();
buildSalaryRegisterSheet();
buildSupplierLedgerSheet();
buildRecurringControlsSheet();
buildMaintenanceLogSheet();

await fs.mkdir(outputDir, { recursive: true });

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(workbookPath);

const summaryCheck = {
  expenseTotal: expenses.getRange("H2:H300").values.flat().reduce(sumNumbers, 0),
  expenseBudgetTotal: budgetPlanner.getRange("D2:D300").values.flat().reduce(sumNumbers, 0),
  salesTotal: sales.getRange("C2:C300").values.flat().reduce(sumNumbers, 0),
  pettyBalance: pettyCash.getRange("H2:H300").values.flat().reduce(sumNumbers, 0),
  pettyBudgetTotal: pettyCashBudget.getRange("C2:C300").values.flat().reduce(sumNumbers, 0),
  salaryOutstanding: salaryRegister.getRange("J2:J300").values.flat().reduce(sumNumbers, 0),
  supplierOutstanding: supplierLedger.getRange("L2:L300").values.flat().reduce(sumNumbers, 0),
  activeRecurring: recurringControls.getRange("M2:M300").values.flat().filter((value) => value === "Active").length
};
let formulaErrorCount = 0;

if (shouldRenderPreviews) {
  for (const sheetName of [
    "Summary",
    "Expenses",
    "Budget_Planner",
    "Daily_Sales",
    "Apartments",
    "Petty_Cash",
    "Petty_Cash_Budget",
    "Salary_Register",
    "Supplier_Ledger",
    "Recurring_Controls",
    "Maintenance_Log",
    "Lists"
  ]) {
    const blob = await workbook.render({ sheetName, autoCrop: "all", scale: 1.25, format: "png" });
    const bytes = new Uint8Array(await blob.arrayBuffer());
    await fs.writeFile(path.join(outputDir, `${sheetName}.png`), bytes);
  }
}

if (shouldInspectWorkbook) {
  const formulaErrors = await workbook.inspect({
    kind: "match",
    searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
    options: { useRegex: true, maxResults: 100 },
    summary: "formula error scan"
  });
  formulaErrorCount = formulaErrors.results?.length || 0;
  await fs.writeFile(inspectPath, formulaErrors.ndjson ?? "", "utf8");
}

console.log(
  JSON.stringify({
    workbookPath,
    renderedPreviews: shouldRenderPreviews,
    inspectedWorkbook: shouldInspectWorkbook,
    formulaErrorCount,
    summaryCheck
  })
);
process.exit(0);

function buildSummarySheet() {
  summary.getRange("A1:H1").merge();
  summary.getRange("A1").values = [["OneRoot Essentials Operations Register"]];
  applyTitle(summary.getRange("A1:H1"));

  summary.getRange("A2:H2").merge();
  summary.getRange("A2").values = [[
    "Capture expenses, sales, apartments, petty cash, salary, suppliers, recurring controls, and maintenance without using business-unit columns."
  ]];
  applySubtitle(summary.getRange("A2:H2"));

  summary.getRange("A4:B4").values = [["Metric", "Value"]];
  applyTableHeader(summary.getRange("A4:B4"));

  summary.getRange("A5:A24").values = [
    ["Total Expenses"],
    ["Expense Budgeted"],
    ["Total Daily Sales"],
    ["Rent Collected"],
    ["Captured Revenue"],
    ["Captured Spend"],
    ["Operating Margin"],
    ["Bills Paid"],
    ["Supplier Outstanding"],
    ["Maintenance Open Estimate"],
    ["Petty Cash Budgeted"],
    ["Petty Cash Expense Paid"],
    ["Petty Cash Balance"],
    ["Petty Cash Budget Remaining"],
    ["Active Recurring Controls"],
    ["Controls Due Soon"],
    ["Completed Maintenance Cost"],
    ["Payroll Net Due"],
    ["Payroll Paid"],
    ["Payroll Outstanding"]
  ];
  summary.getRange("B5:B24").formulas = [
    ["=SUM('Expenses'!H2:H300)"],
    ["=SUM('Budget_Planner'!D2:D300)"],
    ["=SUM('Daily_Sales'!C2:C300)"],
    ["=SUM('Apartments'!N2:N300)"],
    ["=B7+B8"],
    ["=SUM('Expenses'!H2:H300)+SUM('Salary_Register'!I2:I300)"],
    ["=B9-B10"],
    ["=SUM('Apartments'!AA2:AA300)"],
    ["=SUM('Supplier_Ledger'!L2:L300)"],
    ['=SUMIFS(\'Maintenance_Log\'!I2:I300,\'Maintenance_Log\'!G2:G300,"<>Completed")'],
    ["=SUM('Petty_Cash_Budget'!C2:C300)"],
    ['=SUMIF(\'Petty_Cash\'!B2:B300,"Expense Paid",\'Petty_Cash\'!G2:G300)'],
    ["=SUM('Petty_Cash'!H2:H300)"],
    ["=B15-B16"],
    ['=COUNTIF(\'Recurring_Controls\'!M2:M300,"Active")'],
    ['=COUNTIF(\'Recurring_Controls\'!O2:O300,"Due Soon")+COUNTIF(\'Recurring_Controls\'!O2:O300,"Overdue")'],
    ['=SUMIFS(\'Maintenance_Log\'!J2:J300,\'Maintenance_Log\'!G2:G300,"Completed")'],
    ["=SUM('Salary_Register'!H2:H300)"],
    ["=SUM('Salary_Register'!I2:I300)"],
    ["=SUM('Salary_Register'!J2:J300)"]
  ];
  applyMetricBlock(summary.getRange("A4:B24"));
  summary.getRange("A5:A24").format = { font: { bold: true, color: "#243228" } };
  summary.getRange("B5:B24").format = { fill: "#F7F2E8" };
  summary.getRange("B5:B18").setNumberFormat('"GH₵" #,##0.00');
  summary.getRange("B19:B20").setNumberFormat("#,##0");
  summary.getRange("B21:B24").setNumberFormat('"GH₵" #,##0.00');

  summary.getRange("D4:H4").merge();
  summary.getRange("D4").values = [["OneRoot business areas covered"]];
  applySectionHeader(summary.getRange("D4:H4"));

  const areaEndRow = businessAreas.length + 4;
  summary.getRange(`D5:H${areaEndRow}`).values = businessAreas.map((area) => [area, "", "", "", ""]);
  summary.getRange(`D5:D${areaEndRow}`).format = { font: { bold: true, color: "#243228" } };
  summary.getRange(`D5:H${areaEndRow}`).format.borders = { preset: "outside", style: "thin", color: "#D9E3D8" };

  summary.getRange("A26:H26").merge();
  summary.getRange("A26").values = [[
    "Workbook workflow: fill Expenses, Budget_Planner, Daily_Sales, Apartments, Petty_Cash, Petty_Cash_Budget, Salary_Register, Supplier_Ledger, Recurring_Controls, and Maintenance_Log. Dropdown columns are preloaded from Lists."
  ]];
  summary.getRange("A26:H26").format = { fill: "#F7F2E8", font: { color: "#243228", italic: true } };
  summary.getRange("A26:H26").format.wrapText = true;

  summary.getRange("A27:H27").merge();
  summary.getRange("A27").values = [[
    "Apartment bills captured: water bill, toilet bill, sweeping and gutter cleaning bill, and waste management bill."
  ]];
  summary.getRange("A27:H27").format = { fill: "#EEF4EC", font: { color: "#243228" } };
  summary.getRange("A27:H27").format.wrapText = true;

  summary.getRange("A28:H28").merge();
  summary.getRange("A28").values = [[
    "Petty cash ledger captures opening float, top-ups, expense-paid entries, cash returns, adjustments, and monthly budgets."
  ]];
  summary.getRange("A28:H28").format = { fill: "#F0E7D7", font: { color: "#243228" } };
  summary.getRange("A28:H28").format.wrapText = true;

  summary.getRange("A29:H29").merge();
  summary.getRange("A29").values = [[
    "Use Salary_Register to manage payroll and deductions, Supplier_Ledger to track payables, Recurring_Controls to schedule repeat work, and Maintenance_Log to monitor repairs and service tasks."
  ]];
  summary.getRange("A29:H29").format = { fill: "#E9F0EA", font: { color: "#243228" } };
  summary.getRange("A29:H29").format.wrapText = true;

  summary.getRange("A1:H29").format.autofitColumns();
  summary.getRange("A1:H29").format.autofitRows();
  summary.getRange("A1:H29").format.borders = { preset: "outside", style: "thin", color: "#D9E3D8" };
  summary.freezePanes.freezeRows(4);
}

function buildListsSheet() {
  const columns = [
    { col: "A", header: "Business Areas", values: businessAreas },
    { col: "B", header: "Expense Types", values: expenseTypes },
    { col: "C", header: "Payment Methods", values: paymentMethods },
    { col: "D", header: "Receipt Statuses", values: receiptStatuses },
    { col: "E", header: "Suites", values: suites },
    { col: "F", header: "Petty Cash Types", values: pettyCashTypes },
    { col: "G", header: "Occupancy Statuses", values: occupancyStatuses },
    { col: "H", header: "Rent Cycles", values: rentCycles },
    { col: "I", header: "Supplier Statuses", values: supplierStatuses },
    { col: "J", header: "Recurring Modules", values: recurringModules },
    { col: "K", header: "Recurring Frequencies", values: recurringFrequencies },
    { col: "L", header: "Maintenance Priorities", values: maintenancePriorities },
    { col: "M", header: "Maintenance Statuses", values: maintenanceStatuses },
    { col: "N", header: "Active States", values: activeStates },
    { col: "O", header: "Salary Types", values: salaryTypes }
  ];

  for (const { col, header, values } of columns) {
    lists.getRange(`${col}1`).values = [[header]];
    lists.getRange(`${col}2:${col}${values.length + 1}`).values = values.map((value) => [value]);
    applyTableHeader(lists.getRange(`${col}1`));
  }

  lists.getRange("A1:O60").format.autofitColumns();
  lists.freezePanes.freezeRows(1);
}

function buildExpensesSheet() {
  expenses.getRange("A1:I1").values = [[
    "Date",
    "Business Area",
    "Vendor / Payee",
    "Expense Type",
    "Description",
    "Payment Method",
    "Receipt Status",
    "Amount (GHS)",
    "Notes"
  ]];
  applyTableHeader(expenses.getRange("A1:I1"));
  expenses.getRange("A2:I300").format.borders = { preset: "outside", style: "thin", color: "#E3E6DE" };
  expenses.getRange("A2:A300").setNumberFormat("yyyy-mm-dd");
  expenses.getRange("H2:H300").setNumberFormat('"GH₵" #,##0.00');
  expenses.getRange("A1:I300").format.autofitColumns();
  expenses.freezePanes.freezeRows(1);

  expenses.dataValidations.add({
    range: "B2:B300",
    rule: { type: "list", formula1: `'Lists'!$A$2:$A$${businessAreas.length + 1}` }
  });
  expenses.dataValidations.add({
    range: "D2:D300",
    rule: { type: "list", formula1: `'Lists'!$B$2:$B$${expenseTypes.length + 1}` }
  });
  expenses.dataValidations.add({
    range: "F2:F300",
    rule: { type: "list", formula1: `'Lists'!$C$2:$C$${paymentMethods.length + 1}` }
  });
  expenses.dataValidations.add({
    range: "G2:G300",
    rule: { type: "list", formula1: `'Lists'!$D$2:$D$${receiptStatuses.length + 1}` }
  });
}

function buildBudgetPlannerSheet() {
  budgetPlanner.getRange("A1:G1").values = [[
    "Budget Month",
    "Business Area",
    "Expense Type",
    "Budget Amount (GHS)",
    "Actual Spend (GHS)",
    "Variance (GHS)",
    "Notes"
  ]];
  applyTableHeader(budgetPlanner.getRange("A1:G1"));
  budgetPlanner.getRange("A2:A300").setNumberFormat("mmm yyyy");
  budgetPlanner.getRange("D2:F300").setNumberFormat('"GH₵" #,##0.00');
  budgetPlanner.getRange("E2").formulas = [[
    '=SUMIFS(\'Expenses\'!$H$2:$H$300,\'Expenses\'!$B$2:$B$300,B2,\'Expenses\'!$D$2:$D$300,C2,\'Expenses\'!$A$2:$A$300,">="&EOMONTH(A2,-1)+1,\'Expenses\'!$A$2:$A$300,"<="&EOMONTH(A2,0))+IF(C2="Staff Wages",SUMIFS(\'Salary_Register\'!$I$2:$I$300,\'Salary_Register\'!$B$2:$B$300,B2,\'Salary_Register\'!$A$2:$A$300,A2),0)'
  ]];
  budgetPlanner.getRange("E2:E300").fillDown();
  budgetPlanner.getRange("F2").formulas = [["=D2-E2"]];
  budgetPlanner.getRange("F2:F300").fillDown();
  budgetPlanner.getRange("A1:G300").format.autofitColumns();
  budgetPlanner.freezePanes.freezeRows(1);

  budgetPlanner.dataValidations.add({
    range: "B2:B300",
    rule: { type: "list", formula1: `'Lists'!$A$2:$A$${businessAreas.length + 1}` }
  });
  budgetPlanner.dataValidations.add({
    range: "C2:C300",
    rule: { type: "list", formula1: `'Lists'!$B$2:$B$${expenseTypes.length + 1}` }
  });
}

function buildSalesSheet() {
  sales.getRange("A1:D1").values = [[
    "Date",
    "Business Area",
    "Total Daily Sales (GHS)",
    "Notes"
  ]];
  applyTableHeader(sales.getRange("A1:D1"));
  sales.getRange("A2:A300").setNumberFormat("yyyy-mm-dd");
  sales.getRange("C2:C300").setNumberFormat('"GH₵" #,##0.00');
  sales.getRange("A1:D300").format.autofitColumns();
  sales.freezePanes.freezeRows(1);

  sales.dataValidations.add({
    range: "B2:B300",
    rule: { type: "list", formula1: `'Lists'!$A$2:$A$${businessAreas.length + 1}` }
  });
}

function buildApartmentsSheet() {
  apartments.getRange("A1:AK1").values = [[
    "Billing Month",
    "Suite",
    "Status",
    "Tenant",
    "Tenant Phone",
    "Emergency Contact",
    "ID Ref",
    "Move-In",
    "Move-Out",
    "Rent Cycle",
    "Cycle Months",
    "Cycle Amount (GHS)",
    "Rent Due (GHS)",
    "Rent Paid (GHS)",
    "Coverage Start",
    "Coverage End",
    "Next Rent Due",
    "Renewal Date",
    "Rent Payment Date",
    "Rent Payment Method",
    "Rent Reference",
    "Water Bill (GHS)",
    "Toilet Bill (GHS)",
    "Sweeping Bill (GHS)",
    "Waste Bill (GHS)",
    "Bill Due Date",
    "Bills Paid (GHS)",
    "Bill Payment Date",
    "Bill Payment Method",
    "Bill Reference",
    "Arrears B/F (GHS)",
    "Late Fee (GHS)",
    "Custom Total (GHS)",
    "Custom Bill Items",
    "Notes",
    "Total Bills Due (GHS)",
    "Total Balance Due (GHS)"
  ]];
  applyTableHeader(apartments.getRange("A1:AK1"));
  apartments.getRange("A1:AK1").format.wrapText = true;
  apartments.getRange("A2:A300").setNumberFormat("mmm yyyy");
  apartments.getRange("H2:I300").setNumberFormat("yyyy-mm-dd");
  apartments.getRange("O2:S300").setNumberFormat("yyyy-mm-dd");
  apartments.getRange("L2:N300").setNumberFormat('"GH₵" #,##0.00');
  apartments.getRange("V2:Y300").setNumberFormat('"GH₵" #,##0.00');
  apartments.getRange("Z2:Z300").setNumberFormat("yyyy-mm-dd");
  apartments.getRange("AA2:AA300").setNumberFormat('"GH₵" #,##0.00');
  apartments.getRange("AB2:AB300").setNumberFormat("yyyy-mm-dd");
  apartments.getRange("AE2:AG300").setNumberFormat('"GH₵" #,##0.00');
  apartments.getRange("AJ2:AK300").setNumberFormat('"GH₵" #,##0.00');
  apartments.getRange("AJ2").formulas = [["=SUM(V2:Y2)+AG2"]];
  apartments.getRange("AJ2:AJ300").fillDown();
  apartments.getRange("AK2").formulas = [["=MAX(M2-N2,0)+MAX(AJ2-AA2,0)+AE2+AF2"]];
  apartments.getRange("AK2:AK300").fillDown();
  apartments.getRange("A1:AK300").format.autofitColumns();
  apartments.freezePanes.freezeRows(1);
  apartments.freezePanes.freezeColumns(3);

  apartments.dataValidations.add({
    range: "B2:B300",
    rule: { type: "list", formula1: `'Lists'!$E$2:$E$${suites.length + 1}` }
  });
  apartments.dataValidations.add({
    range: "C2:C300",
    rule: { type: "list", formula1: `'Lists'!$G$2:$G$${occupancyStatuses.length + 1}` }
  });
  apartments.dataValidations.add({
    range: "J2:J300",
    rule: { type: "list", formula1: `'Lists'!$H$2:$H$${rentCycles.length + 1}` }
  });
  apartments.dataValidations.add({
    range: "T2:T300",
    rule: { type: "list", formula1: `'Lists'!$C$2:$C$${paymentMethods.length + 1}` }
  });
  apartments.dataValidations.add({
    range: "AC2:AC300",
    rule: { type: "list", formula1: `'Lists'!$C$2:$C$${paymentMethods.length + 1}` }
  });
}

function buildPettyCashSheet() {
  pettyCash.getRange("A1:I1").values = [[
    "Date",
    "Transaction Type",
    "Business Area",
    "Expense Type",
    "Payee / Purpose",
    "Receipt Status",
    "Amount (GHS)",
    "Cash Effect (GHS)",
    "Notes"
  ]];
  applyTableHeader(pettyCash.getRange("A1:I1"));
  pettyCash.getRange("A2:A300").setNumberFormat("yyyy-mm-dd");
  pettyCash.getRange("G2:H300").setNumberFormat('"GH₵" #,##0.00');
  pettyCash.getRange("H2").formulas = [[
    '=IF(OR(B2="Opening Float",B2="Cash Top-up",B2="Adjustment In"),G2,IF(OR(B2="Expense Paid",B2="Cash Returned",B2="Adjustment Out"),-G2,0))'
  ]];
  pettyCash.getRange("H2:H300").fillDown();
  pettyCash.getRange("A1:I300").format.autofitColumns();
  pettyCash.freezePanes.freezeRows(1);

  pettyCash.dataValidations.add({
    range: "B2:B300",
    rule: { type: "list", formula1: `'Lists'!$F$2:$F$${pettyCashTypes.length + 1}` }
  });
  pettyCash.dataValidations.add({
    range: "C2:C300",
    rule: { type: "list", formula1: `'Lists'!$A$2:$A$${businessAreas.length + 1}` }
  });
  pettyCash.dataValidations.add({
    range: "D2:D300",
    rule: { type: "list", formula1: `'Lists'!$B$2:$B$${expenseTypes.length + 1}` }
  });
  pettyCash.dataValidations.add({
    range: "F2:F300",
    rule: { type: "list", formula1: `'Lists'!$D$2:$D$${receiptStatuses.length + 1}` }
  });
}

function buildPettyCashBudgetSheet() {
  pettyCashBudget.getRange("A1:D1").values = [[
    "Budget Month",
    "Business Area",
    "Budget Amount (GHS)",
    "Notes"
  ]];
  applyTableHeader(pettyCashBudget.getRange("A1:D1"));
  pettyCashBudget.getRange("A2:A300").setNumberFormat("mmm yyyy");
  pettyCashBudget.getRange("C2:C300").setNumberFormat('"GH₵" #,##0.00');
  pettyCashBudget.getRange("A1:D300").format.autofitColumns();
  pettyCashBudget.freezePanes.freezeRows(1);

  pettyCashBudget.dataValidations.add({
    range: "B2:B300",
    rule: { type: "list", formula1: `'Lists'!$A$2:$A$${businessAreas.length + 1}` }
  });
}

function buildSalaryRegisterSheet() {
  salaryRegister.getRange("A1:U1").values = [[
    "Payroll Month",
    "Business Area",
    "Staff Name",
    "Role / Position",
    "Salary Type",
    "Gross Amount (GHS)",
    "Deductions (GHS)",
    "Net Salary Due (GHS)",
    "Amount Paid (GHS)",
    "Balance Due (GHS)",
    "Due Date",
    "Payment Date",
    "Payment Method",
    "Payment Reference",
    "Status",
    "Notes",
    "KPI Metric",
    "KPI Unit",
    "KPI Target",
    "KPI Actual",
    "KPI Achievement %"
  ]];
  applyTableHeader(salaryRegister.getRange("A1:U1"));
  salaryRegister.getRange("A2:A300").setNumberFormat("mmm yyyy");
  salaryRegister.getRange("F2:J300").setNumberFormat('"GH₵" #,##0.00');
  salaryRegister.getRange("K2:L300").setNumberFormat("yyyy-mm-dd");
  salaryRegister.getRange("S2:T300").setNumberFormat("0.00");
  salaryRegister.getRange("U2:U300").setNumberFormat("0.0%");
  salaryRegister.getRange("H2").formulas = [["=MAX(F2-G2,0)"]];
  salaryRegister.getRange("H2:H300").fillDown();
  salaryRegister.getRange("J2").formulas = [["=MAX(H2-I2,0)"]];
  salaryRegister.getRange("J2:J300").fillDown();
  salaryRegister.getRange("O2").formulas = [[
    '=IF(A2="","",IF(J2=0,"Paid",IF(AND(K2<>"",TODAY()>K2),"Overdue",IF(I2>0,"Part Paid","Due"))))'
  ]];
  salaryRegister.getRange("O2:O300").fillDown();
  salaryRegister.getRange("U2").formulas = [['=IF(OR(S2="",S2=0),"",T2/S2)']];
  salaryRegister.getRange("U2:U300").fillDown();
  salaryRegister.getRange("A1:U300").format.autofitColumns();
  salaryRegister.freezePanes.freezeRows(1);
  salaryRegister.freezePanes.freezeColumns(2);

  salaryRegister.dataValidations.add({
    range: "B2:B300",
    rule: { type: "list", formula1: `'Lists'!$A$2:$A$${businessAreas.length + 1}` }
  });
  salaryRegister.dataValidations.add({
    range: "E2:E300",
    rule: { type: "list", formula1: `'Lists'!$O$2:$O$${salaryTypes.length + 1}` }
  });
  salaryRegister.dataValidations.add({
    range: "M2:M300",
    rule: { type: "list", formula1: `'Lists'!$C$2:$C$${paymentMethods.length + 1}` }
  });
}

function buildSupplierLedgerSheet() {
  supplierLedger.getRange("A1:N1").values = [[
    "Invoice Date",
    "Business Area",
    "Supplier",
    "Expense Type",
    "Item / Description",
    "Invoice Reference",
    "Amount Due (GHS)",
    "Amount Paid (GHS)",
    "Due Date",
    "Payment Date",
    "Payment Method",
    "Outstanding Balance (GHS)",
    "Status",
    "Notes"
  ]];
  applyTableHeader(supplierLedger.getRange("A1:N1"));
  supplierLedger.getRange("A2:A300").setNumberFormat("yyyy-mm-dd");
  supplierLedger.getRange("G2:H300").setNumberFormat('"GH₵" #,##0.00');
  supplierLedger.getRange("I2:J300").setNumberFormat("yyyy-mm-dd");
  supplierLedger.getRange("L2:L300").setNumberFormat('"GH₵" #,##0.00');
  supplierLedger.getRange("L2").formulas = [["=MAX(G2-H2,0)"]];
  supplierLedger.getRange("L2:L300").fillDown();
  supplierLedger.getRange("M2").formulas = [[
    '=IF(A2="","",IF(L2=0,"Paid",IF(AND(I2<>"",TODAY()>I2),"Overdue",IF(H2>0,"Part Paid","Due"))))'
  ]];
  supplierLedger.getRange("M2:M300").fillDown();
  supplierLedger.getRange("A1:N300").format.autofitColumns();
  supplierLedger.freezePanes.freezeRows(1);
  supplierLedger.freezePanes.freezeColumns(2);

  supplierLedger.dataValidations.add({
    range: "B2:B300",
    rule: { type: "list", formula1: `'Lists'!$A$2:$A$${businessAreas.length + 1}` }
  });
  supplierLedger.dataValidations.add({
    range: "D2:D300",
    rule: { type: "list", formula1: `'Lists'!$B$2:$B$${expenseTypes.length + 1}` }
  });
  supplierLedger.dataValidations.add({
    range: "K2:K300",
    rule: { type: "list", formula1: `'Lists'!$C$2:$C$${paymentMethods.length + 1}` }
  });
}

function buildRecurringControlsSheet() {
  recurringControls.getRange("A1:O1").values = [[
    "Control Name",
    "Module",
    "Business Area",
    "Expense Type",
    "Counterparty / Vendor",
    "Suite / Location",
    "Amount (GHS)",
    "Frequency",
    "Start Date",
    "Next Due Date",
    "Last Generated Date",
    "Priority",
    "Active State",
    "Notes",
    "Status"
  ]];
  applyTableHeader(recurringControls.getRange("A1:O1"));
  recurringControls.getRange("G2:G300").setNumberFormat('"GH₵" #,##0.00');
  recurringControls.getRange("I2:K300").setNumberFormat("yyyy-mm-dd");
  recurringControls.getRange("O2").formulas = [[
    '=IF(A2="","",IF(M2="Paused","Paused",IF(J2<TODAY(),"Overdue",IF(J2<=TODAY()+7,"Due Soon","Scheduled"))))'
  ]];
  recurringControls.getRange("O2:O300").fillDown();
  recurringControls.getRange("A1:O300").format.autofitColumns();
  recurringControls.freezePanes.freezeRows(1);
  recurringControls.freezePanes.freezeColumns(2);

  recurringControls.dataValidations.add({
    range: "B2:B300",
    rule: { type: "list", formula1: `'Lists'!$J$2:$J$${recurringModules.length + 1}` }
  });
  recurringControls.dataValidations.add({
    range: "C2:C300",
    rule: { type: "list", formula1: `'Lists'!$A$2:$A$${businessAreas.length + 1}` }
  });
  recurringControls.dataValidations.add({
    range: "D2:D300",
    rule: { type: "list", formula1: `'Lists'!$B$2:$B$${expenseTypes.length + 1}` }
  });
  recurringControls.dataValidations.add({
    range: "H2:H300",
    rule: { type: "list", formula1: `'Lists'!$K$2:$K$${recurringFrequencies.length + 1}` }
  });
  recurringControls.dataValidations.add({
    range: "L2:L300",
    rule: { type: "list", formula1: `'Lists'!$L$2:$L$${maintenancePriorities.length + 1}` }
  });
  recurringControls.dataValidations.add({
    range: "M2:M300",
    rule: { type: "list", formula1: `'Lists'!$N$2:$N$${activeStates.length + 1}` }
  });
}

function buildMaintenanceLogSheet() {
  maintenanceLog.getRange("A1:L1").values = [[
    "Reported Date",
    "Business Area",
    "Location / Suite",
    "Asset / Item",
    "Issue / Task",
    "Priority",
    "Status",
    "Due Date",
    "Estimated Cost (GHS)",
    "Actual Cost (GHS)",
    "Vendor / Technician",
    "Notes"
  ]];
  applyTableHeader(maintenanceLog.getRange("A1:L1"));
  maintenanceLog.getRange("A2:A300").setNumberFormat("yyyy-mm-dd");
  maintenanceLog.getRange("H2:H300").setNumberFormat("yyyy-mm-dd");
  maintenanceLog.getRange("I2:J300").setNumberFormat('"GH₵" #,##0.00');
  maintenanceLog.getRange("A1:L300").format.autofitColumns();
  maintenanceLog.freezePanes.freezeRows(1);
  maintenanceLog.freezePanes.freezeColumns(2);

  maintenanceLog.dataValidations.add({
    range: "B2:B300",
    rule: { type: "list", formula1: `'Lists'!$A$2:$A$${businessAreas.length + 1}` }
  });
  maintenanceLog.dataValidations.add({
    range: "F2:F300",
    rule: { type: "list", formula1: `'Lists'!$L$2:$L$${maintenancePriorities.length + 1}` }
  });
  maintenanceLog.dataValidations.add({
    range: "G2:G300",
    rule: { type: "list", formula1: `'Lists'!$M$2:$M$${maintenanceStatuses.length + 1}` }
  });
}

function applyTitle(range) {
  range.format = { fill: "#33553F", font: { color: "#FFFFFF", bold: true, size: 16 } };
}

function applySubtitle(range) {
  range.format = { fill: "#EEF4EC", font: { color: "#243228", italic: true } };
}

function applySectionHeader(range) {
  range.format = { fill: "#D9E6D7", font: { color: "#243228", bold: true } };
}

function applyTableHeader(range) {
  range.format = { fill: "#54805C", font: { color: "#FFFFFF", bold: true } };
}

function applyMetricBlock(range) {
  range.format.borders = { preset: "outside", style: "thin", color: "#D9E3D8" };
  range.format.wrapText = true;
}

function sumNumbers(total, value) {
  return total + (typeof value === "number" ? value : 0);
}
