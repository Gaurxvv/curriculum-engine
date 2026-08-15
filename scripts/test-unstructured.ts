import fs from "fs";
import path from "path";
import { parseCurriculumPdf } from "../lib/aiParse";

const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) process.env[match[1]] = match[2].trim();
  });
}

const UNSTRUCTURED_TEXT = `
This is a general overview paragraph describing nursing care in geriatric settings without any standard module titles or headings. The training emphasizes respectful patient engagement, mobility support, medication management, and recording clinical notes accurately in daily shift documentation.
`;

async function main() {
  console.log("=== Testing Unstructured Fallback ===");
  for await (const event of parseCurriculumPdf(UNSTRUCTURED_TEXT)) {
    console.log(`[Event]`, event.type, event);
  }
}

main().catch(console.error);
