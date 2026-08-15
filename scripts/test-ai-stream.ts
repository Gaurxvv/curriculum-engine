import fs from "fs";
import path from "path";
import { parseCurriculumPdf } from "../lib/aiParse";

// Read .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      process.env[match[1]] = match[2].trim();
    }
  });
}

const SAMPLE_NURSING_CURRICULUM = `
LEHRPLAN FÜR DIE PFLEGEFACHASSISTENZ (MUSTER)

Modul 1: Grundlagen der professionellen Pflege und Kommunikation
Dieses Modul vermittelt die Grundlagen der Pflegeethik, rechtliche Rahmenbedingungen sowie Methoden der wertschätzenden Kommunikation mit Patienten und Angehörigen im klinischen Alltag.

Thema 1.1: Einführung in die Pflegeethik und Berufsidentität
- Lerneinheit 1.1.1: Werte und Menschenbild in der Pflege
- Lerneinheit 1.1.2: Rechtliche Grundlagen und Schweigepflicht

Thema 1.2: Patientenzentrierte Gesprächsführung
- Lerneinheit 1.2.1: Grundlagen verbaler und nonverbaler Kommunikation
- Lerneinheit 1.2.2: Umgang mit herausfordernden Gesprächssituationen

Modul 2: Hygiene, Infektionsprävention und Vitalzeichenkontrolle
Schwerpunkt bildet das Erkennen und Vermeiden von Infektionsrisiken sowie die fachgerechte Erhebung lebenswichtiger Vitalparameter bei stationären und ambulanten Pflegebedürftigen.

Thema 2.1: Basishygiene und Desinfektionsmaßnahmen
- Lerneinheit 2.1.1: Händedesinfektion und Schutzkleidung
- Lerneinheit 2.1.2: Flächen- und Instrumentendesinfektion
`;

async function main() {
  console.log("=== Starting AI Parse Test ===");
  console.log("Using Provider with GROQ_API_KEY:", !!process.env.GROQ_API_KEY);

  let eventCount = 0;
  let moduleCount = 0;

  for await (const event of parseCurriculumPdf(SAMPLE_NURSING_CURRICULUM)) {
    eventCount++;
    console.log(`[Event ${eventCount}] Type: ${event.type}`, JSON.stringify(event).slice(0, 120));
    if (event.type === "module_done") {
      moduleCount++;
      console.log(` -> Module ${moduleCount} Title: "${event.module.title}", Topics: ${event.module.children.length}`);
      for (const topic of event.module.children) {
        console.log(`    * Topic: "${topic.title}" (Lessons: ${topic.children.length})`);
        for (const lesson of topic.children) {
          console.log(`       - Lesson: "${lesson.title}" (inferred: ${lesson.aiInferred})`);
        }
      }
    }
  }

  console.log(`\n=== Finished AI Parse Test: ${moduleCount} modules parsed successfully ===`);
}

main().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
