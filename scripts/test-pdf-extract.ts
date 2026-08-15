import fs from "fs";
import path from "path";
import { extractPdfText } from "../lib/pdfExtract";

async function main() {
  const pdfPath = path.resolve(process.cwd(), "sample-nursing-curriculum.pdf");
  const buffer = fs.readFileSync(pdfPath);
  const text = await extractPdfText(buffer);
  console.log("Extracted characters from PDF:", text.length);
  console.log("First 200 chars:\n", text.slice(0, 200));
}

main().catch(console.error);
