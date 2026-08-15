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

// Set model to qwen/qwen3.6-27b
process.env.GROQ_MODEL = "qwen/qwen3.6-27b";

const SAMPLE_TEXT = `
Modul 1: Grundlagen der Pflege
Einführung in die Pflegepraxis und Hygiene.

Thema 1.1: Basishygiene
- Lerneinheit 1.1.1: Händedesinfektion
`;

async function main() {
  console.log("=== Testing Qwen 3.6 27B on Groq ===");
  for await (const event of parseCurriculumPdf(SAMPLE_TEXT)) {
    console.log(`[Event]`, event.type, event.type === "module_done" ? event.module.title : "");
  }
  console.log("=== Qwen 3.6 27B Test Passed Successfully ===");
}

main().catch(console.error);
