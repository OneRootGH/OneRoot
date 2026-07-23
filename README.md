# OneRoot Operations App

An installable offline-ready web app for managing OneRoot expenses, daily sales, apartment rent and bills, petty cash, POS, inventory, and public online orders in one workspace.

## Public website and local server

This project now runs as one Python Flask web server with one shared SQL database and three main routes:

- Public website: `/`
- Staff operations app: `/app/`
- Staff alias: `/operations/`
- Customer order tracking: `/track-order.html`

To run it locally:

1. Start the server from the project folder:

   ```bash
   python3 wsgi.py
   ```

2. Open:
   - `http://127.0.0.1:8124/` for the customer storefront
   - `http://127.0.0.1:8124/app/` for the staff operations app
   - `http://127.0.0.1:8124/operations/` as a staff shortcut

If you want the staff app protected, set these environment variables before starting the server:

- `ONEROOT_ADMIN_USER`
- `ONEROOT_ADMIN_PASSWORD`

If `127.0.0.1:8124` is already showing an older preview, stop that older server first before starting this one.

Optional public contact settings:

- `ONEROOT_PUBLIC_DOMAIN`
- `ONEROOT_SUPPORT_PHONE`
- `ONEROOT_WHATSAPP_NUMBER`
- `ONEROOT_SUPPORT_EMAIL`
- `ONEROOT_PICKUP_NOTE`

Database settings:

- `ONEROOT_APP_DATABASE_URL`
- `ONEROOT_DATABASE_URL`
- `ONEROOT_DATABASE_PRIVATE_URL`

## What it includes

- Multi-view server-first app with dashboard, reports, global search, POS, inventory, finance, property, services, people, procurement, online orders, and audit screens
- Public OneRoot storefront for online ordering across groceries, drinks, kitchen requests, water support, laundry, apartments, and service requests
- Customer order tracking page using order number plus phone number
- Staff-side `Online Orders` desk in the operations app for review, pricing, payment follow-up, fulfillment updates, and paid-order sales sync
- Expense capture by business area, vendor, expense type, payment method, receipt status, amount, and notes
- Daily sales capture by business area without any unit or offering field
- Apartment rental management with suite dropdowns, occupancy status, tenant profile fields, rent cycle setup, rent coverage dates, renewal dates, and payment references
- Apartment bills capture for water bill, toilet bill, sweeping and gutter cleaning bill, waste management bill, custom bill items, arrears, and late fees
- Apartment due tracking with rent due alerts, bill due alerts, overdue reminders, renewal reminders, payment history, printable receipts, and monthly bill generation
- Tenancy agreement downloads that auto-generate for new paid tenants and can also be generated later for existing tenants from the apartment table or portfolio card
- Petty cash ledger for opening float, top-ups, expense-paid cash movements, returns, and adjustments
- Petty cash budget tracking by month and business area so you can see total petty cash budgeted, used, and remaining
- Automatic expense sync for petty cash entries saved as `Expense Paid`
- Monthly budget tracking for expense categories by business area
- Filtered CSV export from live module pages including sales, inventory, and online orders
- Direct workbook download from the staff app plus full JSON backup export
- Downloadable Excel workbook with dropdown lists for `Expenses`, `Budget_Planner`, `Daily_Sales`, `Apartments`, `Petty_Cash`, `Petty_Cash_Budget`, and `Lists`
- Full app backup export as `.json`
- Server-first SQL storage so records save into one shared database instead of per-browser snapshots
- PostgreSQL-ready hosting on DigitalOcean App Platform

## Business areas included

- OneRoot Water & Equipment Rentals
- OneRoot Cold Store & Groceries
- OneRoot Laundry Services
- OneRoot Mobile Money Services
- OneRoot Rentals & Apartments
- OneRoot Fresh Foods & Drinks
- OneRoot Kitchen
- OneRoot Shared Operations

## How to use it

1. Start the local server with `python3 wsgi.py`.
2. Open the public website when customers need to place orders online.
3. Open `/app/` or `/operations/` when staff need the operations workspace.
4. Move through the staff app using the left navigation, the top search box, and the dedicated `Reports` and `Global Search` pages.
5. Record normal spending in `Expenses`.
6. Record one total daily amount per business area in `Daily Sales`.
7. Record rent and apartment bill payments in `Apartments`, including due dates, coverage, arrears, and custom bills.
8. For a bills-only month in `Apartments`, leave `Rent Due This Record` and `Rent Paid` at `0.00`, then enter the monthly bills and bill payment details only.
9. Use `Generate Monthly Bill Records` when you want the next apartment month created from the latest saved suite profile without replacing what already exists.
10. When you save a new tenant with confirmed rent payment details, the app automatically downloads a tenancy agreement. For existing tenants, use the `Agreement` button after their payment details have been saved.
11. Use `Petty Cash` for float movements and small cash spending.
12. Set monthly petty cash budgets in `Petty Cash` to know the total budgeted and remaining by area.
13. Use `Reports` for a month-and-area operating summary covering sales, expenses, salaries, petty cash, supplier balances, apartment exposure, and low-stock or recurring follow-up.
14. Use `Global Search` to find records, products, POS orders, and audit entries from one page.
15. Use `Online Orders` in the staff app to review customer website orders and move them through confirmation, preparation, ready, or completed stages.
16. Use the workbook download button or the `Excel Workbook` menu item when you need the uploadable Excel workbook, and use the backup export button when you want a full JSON backup.

## Installable app files

- [manifest.webmanifest](/Users/philipboakye/Documents/OneRoot Expense Register/manifest.webmanifest)
- [service-worker.js](/Users/philipboakye/Documents/OneRoot Expense Register/service-worker.js)
- [icon.svg](/Users/philipboakye/Documents/OneRoot Expense Register/icon.svg)
- [Tenancy_Agreement_Template.docx](/Users/philipboakye/Documents/OneRoot Expense Register/Tenancy_Agreement_Template.docx)
- [wsgi.py](/Users/philipboakye/Documents/OneRoot Expense Register/wsgi.py)
- [website/index.html](/Users/philipboakye/Documents/OneRoot Expense Register/website/index.html)
- [website/track-order.html](/Users/philipboakye/Documents/OneRoot Expense Register/website/track-order.html)
- [website/app.js](/Users/philipboakye/Documents/OneRoot Expense Register/website/app.js)

## DigitalOcean App Platform

The project includes a starter App Platform spec at [.do/app.yaml](/Users/philipboakye/Documents/OneRoot Expense Register/.do/app.yaml).

Recommended setup:

1. Push this project to your Git repository.
2. Update `.do/app.yaml` with your real repository URL or GitHub repo details.
3. Create the app in DigitalOcean App Platform using this repo and keep `Dockerfile` in the project root.
4. Confirm the service listens on port `8080`.
5. After the first deploy, add `OneRoot.shop` and `www.OneRoot.shop` in the App Platform domain settings, then update DNS to the App Platform ingress target.
6. Add the public and admin environment variables in App Platform before going live.

For durable hosted operations data and durable online orders:

1. Create or attach a PostgreSQL database in App Platform.
2. Prefer the private connection URL when the app and database are in the same VPC.
3. Set `ONEROOT_DATABASE_URL` to the database connection string. If you are using App Platform bindable variables, use a value such as `${oneroot-db.DATABASE_PRIVATE_URL}`.
4. Set `ONEROOT_DATABASE_CA_CERT` to the matching CA certificate bindable value such as `${oneroot-db.CA_CERT}` when TLS verification is enabled.
5. Leave `ONEROOT_DATABASE_SSL` as `require` unless you intentionally disable TLS for a local or trusted internal setup.
6. Redeploy the app. On first start, the server creates its tables automatically and seeds them from the current workspace snapshot and `data/orders.json` if the database is empty.

Production App Platform deployments should use PostgreSQL for persistent multi-device data.

## Excel workbook

Use the workbook when you want spreadsheet entry with dropdown selections. In the rebuilt app, the workbook is available from the left sidebar and the top bar download button:

[OneRoot_Essentials_Operations_Register.xlsx](/Users/philipboakye/Documents/OneRoot Expense Register/outputs/oneroot-essentials-register/OneRoot_Essentials_Operations_Register.xlsx)

Workbook sheets:

- `Summary` for headline totals
- `Expenses` for spend capture
- `Budget_Planner` for monthly budget controls by business area and expense type
- `Daily_Sales` for daily sales totals by business area
- `Apartments` for rent-cycle setup, monthly bills, payment capture, and due-date tracking
- In the workbook `Apartments` sheet, use `Custom Total (GHS)` for the custom bill amount and `Custom Bill Items` for the description of that charge.
- `Petty_Cash` for petty cash ledger tracking
- `Petty_Cash_Budget` for monthly petty cash budgets by business area
- `Lists` for dropdown source values

## App backup

Use the backup export button in the rebuilt app to:

- Export a full app backup as `.json`
- Keep a safer copy of expenses, budgets, sales, apartments, and petty cash data outside the live database

## Expense CSV template columns

Use these headers in the expense CSV file:

`date,businessArea,vendor,expenseType,description,paymentMethod,receiptStatus,amount,notes`

The app imports best when:

- `date` uses `YYYY-MM-DD`
- `amount` is numeric
- `receiptStatus` is `Uploaded`, `Pending`, or `Not Required`
