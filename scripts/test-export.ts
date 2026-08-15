import { emptyCurriculum, emptyNode } from "../lib/types";
import { treeToMarkdown, treeToJson, sanitizeFilename } from "../lib/exportCurriculum";

function testExport() {
  console.log("=== Testing Curriculum Export Utility ===");

  const root = emptyCurriculum("Pflegefachassistenz — Program 1");
  root.description = "Comprehensive 2-year vocational nursing training curriculum.";

  const mod1 = emptyNode("module", "Grundlagen der professionellen Pflege und Kommunikation");
  mod1.description = "Dieses Modul vermittelt die Grundlagen der Pflegeethik und Kommunikation.";

  const top1 = emptyNode("topic", "Einführung in die Pflegeethik");
  top1.description = "Ethische Prinzipien und rechtliche Rahmenbedingungen.";

  const les1 = emptyNode("lesson", "Werte und Menschenbild in der Pflege");
  les1.description = "Ethische Fallbesprechungen.";
  les1.aiInferred = false;

  const les2 = emptyNode("lesson", "Schweigepflicht und Datenschutz");
  les2.description = "DSGVO und rechtliche Schweigepflicht.";
  les2.aiInferred = true;

  top1.children = [les1, les2];
  mod1.children = [top1];
  root.children = [mod1];

  // Test Markdown
  const md = treeToMarkdown(root);
  console.log("--- Generated Markdown ---");
  console.log(md);

  // Test JSON
  const json = treeToJson(root);
  console.log("--- Generated JSON Sample ---");
  console.log(json.slice(0, 200) + "...\n");

  // Test Filename sanitization
  const filenameMd = sanitizeFilename(root.title, "md");
  const filenameJson = sanitizeFilename(root.title, "json");
  console.log("Sanitized filenames:", { filenameMd, filenameJson });

  if (md.includes("# Pflegefachassistenz") && md.includes("## Module 1") && md.includes("*(AI-inferred)*")) {
    console.log("✔ Markdown serialization test passed!");
  } else {
    throw new Error("Markdown serialization validation failed.");
  }

  if (json.includes('"type": "curriculum"') && json.includes('"type": "module"')) {
    console.log("✔ JSON serialization test passed!");
  } else {
    throw new Error("JSON serialization validation failed.");
  }

  console.log("=== All Export Tests Passed Successfully ===");
}

testExport();
