import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const rootDir = path.resolve(".");
const inputPath = path.join(rootDir, "Products.xlsx");
const outputDir = path.join(rootDir, "outputs", "oneroot-products-pos");
const workbookOutputPath = path.join(outputDir, "OneRoot_Products_Cleaned.xlsx");
const previewPath = path.join(outputDir, "OneRoot_Products_Cleaned.png");
const summaryPath = path.join(outputDir, "products_catalog_summary.json");
const dataFilePath = path.join(rootDir, "oneroot_product_catalog.js");
const catalogVersion = "20260718a";

await fs.mkdir(outputDir, { recursive: true });

const input = await FileBlob.load(inputPath);
const sourceWorkbook = await SpreadsheetFile.importXlsx(input);
const sourceSheet = sourceWorkbook.worksheets.getItemAt(0);
const sourceValues = sourceSheet.getUsedRange().values;

const rows = sourceValues.slice(1).map((row, index) => ({
  sourceRow: index + 2,
  rawName: row[0],
  salesPrice: toNumber(row[1]),
  costPrice: toNumber(row[2]),
  sourceCategory: cleanText(row[3]) || "Uncategorized",
  quantityOnHand: toNumberOrNull(row[4])
}));

const normalizedRows = rows
  .map((row) => normalizeProductRow(row))
  .filter(Boolean);

const dedupedRows = dedupeRows(normalizedRows);
const sortedRows = dedupedRows.sort((left, right) => {
  if (left.businessAreaId !== right.businessAreaId) {
    return left.businessAreaId.localeCompare(right.businessAreaId);
  }

  if (left.category !== right.category) {
    return left.category.localeCompare(right.category);
  }

  return left.name.localeCompare(right.name);
});

const workbook = Workbook.create();
const productSheet = workbook.worksheets.add("Products");
const summarySheet = workbook.worksheets.add("Summary");
productSheet.showGridLines = false;
summarySheet.showGridLines = false;

buildProductSheet(productSheet, sortedRows);
buildSummarySheet(summarySheet, sortedRows, normalizedRows.length - sortedRows.length);

const preview = await workbook.render({
  sheetName: "Products",
  autoCrop: "all",
  scale: 1,
  format: "png"
});
await fs.writeFile(previewPath, new Uint8Array(await preview.arrayBuffer()));

const inspection = await workbook.inspect({
  kind: "sheet,table",
  maxChars: 8000,
  tableMaxRows: 12,
  tableMaxCols: 12,
  tableMaxCellChars: 120
});

const formulaErrors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  summary: "formula error scan"
});

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(workbookOutputPath);

const catalogPayload = sortedRows.map((row) => ({
  id: row.id,
  sku: row.sku,
  name: row.name,
  businessAreaId: row.businessAreaId,
  category: row.category,
  sourceCategory: row.sourceCategory,
  salesPrice: row.salesPrice,
  costPrice: row.costPrice,
  quantityOnHand: row.quantityOnHand ?? 0,
  quantityKnown: row.quantityKnown,
  itemType: row.itemType,
  trackInventory: row.trackInventory,
  notes: row.notes
}));

await fs.writeFile(
  dataFilePath,
  `window.ONE_ROOT_PRODUCT_CATALOG_VERSION = "${catalogVersion}";\nwindow.ONE_ROOT_PRODUCT_CATALOG = ${JSON.stringify(
    catalogPayload,
    null,
    2
  )};\n`
);

await fs.writeFile(
  summaryPath,
  JSON.stringify(
    {
      catalogVersion,
      inputPath,
      workbookOutputPath,
      dataFilePath,
      countsByArea: summarizeBy(sortedRows, "businessAreaId"),
      countsByCategory: summarizeBy(sortedRows, "category"),
      removedDuplicateCount: normalizedRows.length - sortedRows.length,
      inspection: inspection.ndjson,
      formulaErrors: formulaErrors.ndjson
    },
    null,
    2
  )
);

console.log(
  JSON.stringify(
    {
      catalogVersion,
      totalSourceRows: rows.length,
      totalCatalogRows: sortedRows.length,
      removedDuplicateCount: normalizedRows.length - sortedRows.length,
      workbookOutputPath,
      dataFilePath,
      summaryPath
    },
    null,
    2
  )
);

function buildProductSheet(sheet, products) {
  const headers = [[
    "SKU",
    "Product Name",
    "Business Area",
    "Normalized Category",
    "Original Category",
    "Sales Price (GHS)",
    "Cost Price (GHS)",
    "Quantity On Hand",
    "Quantity Set?",
    "Track Inventory",
    "Item Type",
    "Notes",
    "Source Row"
  ]];
  const rows = products.map((product) => [
    product.sku,
    product.name,
    getBusinessAreaLabel(product.businessAreaId),
    product.category,
    product.sourceCategory,
    product.salesPrice,
    product.costPrice,
    product.quantityKnown ? product.quantityOnHand : null,
    product.quantityKnown ? "Yes" : "No",
    product.trackInventory ? "Yes" : "No",
    product.itemType === "service" ? "Service" : "Stock Item",
    product.notes,
    product.sourceRow
  ]);

  sheet.getRange(`A1:M${rows.length + 1}`).values = [...headers, ...rows];
  sheet.getRange("A1:M1").format = {
    fill: "#214131",
    font: { bold: true, color: "#FFFFFF" }
  };
  sheet.getRange(`A2:E${rows.length + 1}`).format.borders = {
    preset: "all",
    style: "thin",
    color: "#D9E2D9"
  };
  sheet.getRange(`F2:H${rows.length + 1}`).format.numberFormat = '"GH₵" #,##0.00';
  sheet.getRange(`M2:M${rows.length + 1}`).format.numberFormat = "#,##0";
  sheet.getRange(`A1:M${rows.length + 1}`).format.wrapText = false;
  sheet.getRange(`A1:M${rows.length + 1}`).format.autofitColumns();
  sheet.getRange("A1:M1").format.rowHeight = 24;
  sheet.freezePanes.freezeRows(1);
  sheet.freezePanes.freezeColumns(2);
}

function buildSummarySheet(sheet, products, removedDuplicates) {
  const countsByArea = summarizeBy(products, "businessAreaId");
  const countsByCategory = summarizeBy(products, "category");
  const areaRows = Object.entries(countsByArea).map(([key, count]) => [
    getBusinessAreaLabel(key),
    count
  ]);
  const categoryRows = Object.entries(countsByCategory).map(([key, count]) => [key, count]);

  sheet.getRange("A1:B5").values = [
    ["Metric", "Value"],
    ["Catalog Version", catalogVersion],
    ["Total POS / Inventory Items", products.length],
    ["Removed Duplicate Rows", removedDuplicates],
    ["Source Workbook Rows", products.length + removedDuplicates]
  ];
  sheet.getRange("A1:B1").format = {
    fill: "#214131",
    font: { bold: true, color: "#FFFFFF" }
  };
  sheet.getRange(`A7:B${areaRows.length + 7}`).values = [["Business Area", "Items"], ...areaRows];
  sheet.getRange("A7:B7").format = {
    fill: "#CF824C",
    font: { bold: true, color: "#FFFFFF" }
  };
  sheet.getRange(`D7:E${categoryRows.length + 7}`).values = [["Category", "Items"], ...categoryRows];
  sheet.getRange("D7:E7").format = {
    fill: "#5A8B67",
    font: { bold: true, color: "#FFFFFF" }
  };
  sheet.getRange("A1:E40").format.autofitColumns();
  sheet.freezePanes.freezeRows(1);
}

function normalizeProductRow(row) {
  const name = cleanProductName(row.rawName);

  if (!name) {
    return null;
  }

  const sourceCategory = row.sourceCategory || "Uncategorized";
  const businessAreaId = classifyBusinessArea(name, sourceCategory);
  const category = classifyNormalizedCategory(name, sourceCategory, businessAreaId);
  const itemType = businessAreaId === "laundry-services" || businessAreaId === "mobile-money" ? "service" : "stock";
  const trackInventory = itemType === "stock" && businessAreaId !== "mobile-money";
  const quantityKnown = row.quantityOnHand !== null;
  const quantityOnHand = quantityKnown ? row.quantityOnHand : 0;
  const sku = buildSku(businessAreaId, name, row.sourceRow);

  return {
    id: buildProductId(businessAreaId, category, name, row.sourceRow),
    sku,
    name,
    businessAreaId,
    category,
    sourceCategory,
    salesPrice: row.salesPrice,
    costPrice: row.costPrice,
    quantityOnHand,
    quantityKnown,
    itemType,
    trackInventory,
    notes: buildRowNote(name, sourceCategory, itemType, trackInventory),
    sourceRow: row.sourceRow,
    normalizedKey: normalizeKey(name)
  };
}

function dedupeRows(rows) {
  const grouped = new Map();

  rows.forEach((row) => {
    const key = `${row.businessAreaId}|${row.normalizedKey}`;
    const current = grouped.get(key) || [];
    current.push(row);
    grouped.set(key, current);
  });

  return [...grouped.values()].map((group) => {
    if (group.length === 1) {
      return group[0];
    }

    const isLaundryGroup = group.every((item) => item.businessAreaId === "laundry-services");
    const hasZeroPlaceholder = group.some((item) => item.salesPrice === 0 && item.costPrice === 0);

    if (!isLaundryGroup && !hasZeroPlaceholder) {
      return group[0];
    }

    return [...group].sort(comparePreferredProductRow)[0];
  });
}

function comparePreferredProductRow(left, right) {
  if ((right.salesPrice > 0) !== (left.salesPrice > 0)) {
    return Number(right.salesPrice > 0) - Number(left.salesPrice > 0);
  }

  if (right.salesPrice !== left.salesPrice) {
    return right.salesPrice - left.salesPrice;
  }

  if (right.costPrice !== left.costPrice) {
    return right.costPrice - left.costPrice;
  }

  return left.sourceRow - right.sourceRow;
}

function classifyBusinessArea(name, sourceCategory) {
  const haystack = `${name} ${sourceCategory}`.toLowerCase();

  if (/top-up|ewallet|e-wallet|gift card|tip/.test(haystack)) {
    return /top-up|ewallet|e-wallet/.test(haystack) ? "mobile-money" : "shared-operations";
  }

  if (/laundry|ironing|bedsheet|pillowcase|blanket|duvet|curtain|carpet|shirt|trouser|dress|cloth|shoe|bag|baby clothes|bedspread|car cover|chair cushion|court sheet/.test(haystack) || sourceCategory.toLowerCase() === "laundry") {
    return "laundry-services";
  }

  if (/gallon|galon|bucket water|yellow galon|yellow gallon|water\b|impact drill|vibrator|wheelbarrow|shovel|head pan|cutting machine|nails/.test(haystack) || sourceCategory.toLowerCase() === "equipment rental and sales") {
    return /(awake mineral water|mineral water|power horse|energy drink|juice|malt|cocktail|sobolo|ice cream|ice kenkey|banana pop|creamy pop|joy strawberry)/.test(haystack)
      ? "fresh-foods-drinks"
      : "water-equipment";
  }

  if (/fish|beef|chicken|gizzard|sausage|tripe|cow feet|tilapia|mackerel|drumstick|wings|thigh|local mk1/.test(haystack) || sourceCategory.toLowerCase() === "cold store") {
    return "cold-store-groceries";
  }

  if (/drink|juice|malt|cocktail|toffee|cracker|cookie|biscuit|sweet|chocolate|ice cream|energy drink|bb cocktail|banana pop|creamy pop|joy strawberry/.test(haystack)) {
    return "fresh-foods-drinks";
  }

  return "cold-store-groceries";
}

function classifyNormalizedCategory(name, sourceCategory, businessAreaId) {
  const haystack = name.toLowerCase();

  if (businessAreaId === "laundry-services") {
    if (/carpet|rug/.test(haystack)) {
      return "Laundry - Carpets & Rugs";
    }

    if (/curtain|court sheet/.test(haystack)) {
      return "Laundry - Curtains & Covers";
    }

    if (/chair cushion|car seat|couch|sofa|seat cover|upholstery/.test(haystack)) {
      return "Laundry - Upholstery";
    }

    if (/car cover|car sun shade/.test(haystack)) {
      return "Laundry - Vehicle Fabrics";
    }

    if (/bedsheet|pillowcase|blanket|duvet|bedspread/.test(haystack)) {
      return "Laundry - Bedding & Linen";
    }

    if (/shoe|slipper|bag/.test(haystack)) {
      return "Laundry - Footwear & Bags";
    }

    if (/shirt|trouser|dress|cloth|baby clothes|skirt|suit|jeans|blouse|gown/.test(haystack)) {
      return "Laundry - Clothing";
    }

    return "Laundry - General Items";
  }

  if (businessAreaId === "water-equipment") {
    return /nails|impact drill|vibrator|wheelbarrow|shovel|head pan|cutting machine/.test(haystack)
      ? "Equipment & Construction Consumables"
      : "Water Supply";
  }

  if (businessAreaId === "mobile-money") {
    return "Value Added Services";
  }

  if (businessAreaId === "shared-operations") {
    if (/gift card/.test(haystack)) {
      return "Gift Cards";
    }

    if (/tip/.test(haystack)) {
      return "Service Charges";
    }

    return "Shared Services";
  }

  if (businessAreaId === "fresh-foods-drinks") {
    if (/ice cream/.test(haystack)) {
      return "Frozen Treats";
    }

    if (/cracker|cookie|biscuit|toffee|sweet|chocolate/.test(haystack)) {
      return "Snacks & Confectionery";
    }

    return "Drinks & Refreshments";
  }

  if (/fish|beef|chicken|gizzard|sausage|tripe|cow feet|tilapia|mackerel|drumstick|wings|thigh|local mk1/.test(haystack) || sourceCategory.toLowerCase() === "cold store") {
    return "Frozen Foods & Proteins";
  }

  if (/pen|pencil|exercise book|glue|eraser|sharpener|ruller|ruler|thread|needle|safety pin|tape/.test(haystack) || sourceCategory.toLowerCase() === "stationery") {
    return "Stationery & School Supplies";
  }

  if (/diaper|wipes/.test(haystack)) {
    return "Baby Care";
  }

  if (/sanitary|pad|t-roll|toilet roll|tissue/.test(haystack)) {
    return "Sanitary & Tissue Care";
  }

  if (/toothbrush|toothpaste|soap|baby oil|medi.?soft|geisha|kel kids|pepsodent|vip toothbrush|lily rose toothbrush/.test(haystack)) {
    return "Personal Care";
  }

  if (/disinfectant|air fresher|air freshener|hand wash|detergent|stain remover|bleach|soft care|softcare|blue\b|power horse/.test(haystack)) {
    return /power horse/.test(haystack) ? "Drinks & Refreshments" : "Household & Cleaning";
  }

  return "Groceries & Pantry";
}

function buildRowNote(name, sourceCategory, itemType, trackInventory) {
  const notes = [];

  if (/nan/i.test(String(name))) {
    notes.push("Name normalized to remove placeholder text.");
  }

  if (sourceCategory !== "Uncategorized") {
    notes.push(`Source category: ${sourceCategory}.`);
  }

  notes.push(itemType === "service" ? "Service item for POS." : "Stock item for POS and inventory.");

  if (!trackInventory) {
    notes.push("Inventory is not deducted automatically.");
  }

  return notes.join(" ");
}

function cleanProductName(value) {
  let name = cleanText(value);

  if (!name) {
    return "";
  }

  name = name
    .replace(/\s*[–-]\s*nan\s*[–-]\s*/gi, " – ")
    .replace(/\s+/g, " ")
    .replace(/\s+([/()])/g, "$1")
    .replace(/([(/])\s+/g, "$1")
    .replace(/\s*–\s*/g, " – ")
    .replace(/\s*-\s*/g, " - ")
    .trim();

  return name;
}

function cleanText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeKey(value) {
  return cleanText(value).toLowerCase();
}

function buildProductId(businessAreaId, category, name, sourceRow) {
  return `${slugify(businessAreaId)}-${slugify(category)}-${slugify(name)}-${sourceRow}`;
}

function buildSku(businessAreaId, name, sourceRow) {
  const areaCode = businessAreaId
    .split("-")
    .map((part) => part.slice(0, 3).toUpperCase())
    .join("");
  const nameCode = slugify(name).slice(0, 8).toUpperCase();
  return `${areaCode}-${nameCode}-${String(sourceRow).padStart(4, "0")}`;
}

function slugify(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function summarizeBy(items, key) {
  return items.reduce((summary, item) => {
    summary[item[key]] = (summary[item[key]] || 0) + 1;
    return summary;
  }, {});
}

function toNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? Number(numericValue.toFixed(2)) : 0;
}

function toNumberOrNull(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? Number(numericValue.toFixed(2)) : null;
}

function getBusinessAreaLabel(areaId) {
  return {
    "water-equipment": "OneRoot Water & Equipment Rentals",
    "cold-store-groceries": "OneRoot Cold Store & Groceries",
    "laundry-services": "OneRoot Laundry Services",
    "mobile-money": "OneRoot Mobile Money Services",
    "rentals-apartments": "OneRoot Rentals & Apartments",
    "fresh-foods-drinks": "OneRoot Fresh Foods & Drinks",
    kitchen: "OneRoot Kitchen",
    "shared-operations": "OneRoot Shared Operations"
  }[areaId] || areaId;
}
