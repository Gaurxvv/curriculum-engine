import fs from "fs";
import path from "path";
import { extractPdfText } from "../lib/pdfExtract";
import { parseCurriculumPdf } from "../lib/aiParse";

const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) process.env[match[1]] = match[2].trim();
  });
}

async function main() {
  const pdfPath = path.resolve(process.cwd(), "sample-nursing-curriculum.pdf");
  const buffer = fs.readFileSync(pdfPath);
  const text = await extractPdfText(buffer);
  console.log("PDF text extracted length:", text.length);

  let doneCount = 0;
  for await (const event of parseCurriculumPdf(text)) {
    if (event.type === "module_done") {
      doneCount++;
      console.log(`[DONE] Module ${doneCount}: "${event.module.title}" with ${event.module.children.length} topics`);
    } else if (event.type === "complete") {
      console.log("[COMPLETE] Total modules parsed:", event.moduleCount);
    }
  }
}

main().catch(console.error);
