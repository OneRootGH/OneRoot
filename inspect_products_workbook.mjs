import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const rootDir = path.resolve(".");
const inputPath = path.join(rootDir, "Products.xlsx");
const outputDir = path.join(rootDir, "outputs", "products-inspection");

await fs.mkdir(outputDir, { recursive: true });

const input = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(input);
const sheetSummary = await workbook.inspect({
  kind: "workbook,sheet,table",
  maxChars: 12000,
  tableMaxRows: 12,
  tableMaxCols: 12,
  tableMaxCellChars: 120
});

console.log("=== WORKBOOK SUMMARY ===");
console.log(sheetSummary.ndjson);

for (const sheet of workbook.worksheets.items) {
  const usedRange = sheet.getUsedRange();
  const preview = await workbook.render({
    sheetName: sheet.name,
    autoCrop: "all",
    scale: 1,
    format: "png"
  });
  const previewBytes = new Uint8Array(await preview.arrayBuffer());
  await fs.writeFile(path.join(outputDir, `${sheet.name}.png`), previewBytes);

  const values = usedRange ? usedRange.values : [];
  const previewRows = Array.isArray(values) ? values.slice(0, 20) : [];
  const dataRows = Array.isArray(values) ? values.slice(1) : [];
  const categoryCounts = new Map();
  const duplicateMap = new Map();
  const laundryRows = [];

  dataRows.forEach((row, index) => {
    const name = String(row[0] ?? "").trim();
    const category = String(row[3] ?? "").trim();
    const normalizedName = name.replace(/\s+/g, " ").toLowerCase();

    if (category) {
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    }

    if (normalizedName) {
      const current = duplicateMap.get(normalizedName) || [];
      current.push({
        rowNumber: index + 2,
        name,
        salesPrice: row[1],
        cost: row[2],
        category,
        quantityOnHand: row[4]
      });
      duplicateMap.set(normalizedName, current);
    }

    if (/laundry/i.test(category) || /laundry|iron|wash|bedsheet|pillowcase|duvet|blanket/i.test(name)) {
      laundryRows.push({
        rowNumber: index + 2,
        name,
        salesPrice: row[1],
        cost: row[2],
        category,
        quantityOnHand: row[4]
      });
    }
  });

  const duplicateGroups = [...duplicateMap.values()]
    .filter((items) => items.length > 1)
    .sort((left, right) => right.length - left.length)
    .slice(0, 40);

  console.log(`=== SHEET: ${sheet.name} ===`);
  console.log(
    JSON.stringify(
      {
        rowCount: Array.isArray(values) ? values.length : 0,
        colCount: Array.isArray(values) && values[0] ? values[0].length : 0,
        previewRows,
        categoryCounts: Object.fromEntries([...categoryCounts.entries()].sort((left, right) => right[1] - left[1])),
        duplicateGroups,
        laundryPreview: laundryRows.slice(0, 80)
      },
      null,
      2
    )
  );
}
