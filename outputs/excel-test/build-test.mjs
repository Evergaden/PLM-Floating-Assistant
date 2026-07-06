import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const templatePath = "D:/\u5de5\u4f5c/5\u6708/VIARELINE \u6297\u8870\u8001\u665a\u971c/\u5957\u56fe/VIARELINE \u6297\u8870\u8001\u665a\u971c SKU00032033 - \u6a21\u677f.xlsx";
const outputPath = "C:/Users/Violet/Documents/Codex/2026-06-10/chrome-2-5x2-5x9cm-0-2cm/outputs/excel-test/PLM-Excel-test-SKU00037126.xlsx";

const data = {
  englishName: "Retinol Eye Stick",
  chineseName: "\u7115\u4eae\u7d27\u81f4\u773c\u971c\u68d2",
  sku: "SKU00037126",
  productSize: "1.8*1.8*8.4CM",
  packageSize: "2*2*8.6CM",
  ingredients: "\u77ff\u6cb9\u3001\u8702\u8721\u3001\u77ff\u8102\u3001\u751f\u80b2\u915a\u3001\u89c6\u9ec4\u9187\u3001\u5496\u5561\u56e0\u3001\u7518\u6cb9\u3001\u900f\u660e\u8d28\u9178\u94a0\u3001\u89d2\u9ca8\u70f7",
  netContent: "3G",
  grossWeight: "12.4G",
  benchmarkLink: "https://www.amazon.com/dp/B0H2JZ9NY2?th=1",
  imageUrl: "https://oss-pro.plm.westmonth.cn/xy/upload/CredentialsProduct/260612/74546/11cb78f1703116eae17731955269ae81.jpg?x-oss-process=image/resize,m_lfit,h_80,w_148",
};

function returnDateText(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `\uff08${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}\uff09`;
}

async function imageDataUrl(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);
  const contentType = res.headers.get("content-type") || "image/jpeg";
  const bytes = Buffer.from(await res.arrayBuffer());
  return `data:${contentType};base64,${bytes.toString("base64")}`;
}

const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(templatePath));
const sheet = workbook.worksheets.getItem("Sheet1");

sheet.getRange("A4").values = [[data.englishName]];
sheet.getRange("B4").values = [[data.chineseName]];
sheet.getRange("C4").values = [[""]];
sheet.getRange("E4").values = [[""]];
sheet.getRange("G4").values = [[data.sku]];
sheet.getRange("H4").formulas = [['=IF(LEN(J4)-LEN(SUBSTITUTE(J4,"*",""))=2,"\u76d2\u88c5",IF(LEN(J4)-LEN(SUBSTITUTE(J4,"*",""))=1,"\u888b\u88c5",""))']];
sheet.getRange("I4").values = [[data.productSize]];
sheet.getRange("J4").values = [[data.packageSize]];
sheet.getRange("L4").values = [[data.ingredients]];
sheet.getRange("M4").values = [[data.netContent]];
sheet.getRange("N4").values = [[data.grossWeight]];
sheet.getRange("O4").values = [[""]];
sheet.getRange("P4").values = [[returnDateText(7)]];
sheet.getRange("S4").values = [[data.benchmarkLink]];

try {
  const dataUrl = await imageDataUrl(data.imageUrl);
  sheet.images.add({
    dataUrl,
    anchor: { from: { row: 3, col: 2 }, extent: { widthPx: 118, heightPx: 64 } },
  });
} catch (error) {
  console.warn(error.message);
}

const preview = await workbook.render({ sheetName: "Sheet1", autoCrop: "all", scale: 1, format: "png" });
await fs.writeFile(outputPath.replace(/\.xlsx$/, ".png"), new Uint8Array(await preview.arrayBuffer()));

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
});
console.log(errors.ndjson);

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(outputPath);
