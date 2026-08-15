import fs from "fs";
import path from "path";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

async function generateSamplePdf() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const lines = [
    { text: "LINGOCARE CLINICAL NURSING CURRICULUM", font: boldFont, size: 16, gap: 18 },
    { text: "Vocational Nursing & Clinical German Training Program", font: font, size: 11, gap: 20 },
    
    { text: "Modul 1: Grundlagen der professionellen Pflege und Pflegeethik", font: boldFont, size: 13, gap: 14 },
    { text: "Einführung in berufsrechtliche Grundlagen, ethische Prinzipien und das pflegerische Selbstverständnis.", font: font, size: 10, gap: 12 },
    { text: "Topic 1.1: Berufsidentität und ethische Entscheidungsfindung", font: boldFont, size: 11, gap: 10 },
    { text: "- Lesson 1.1.1: Pflegeverständnis und Menschenwürde in der Praxis", font: font, size: 10, gap: 8 },
    { text: "- Lesson 1.1.2: Schweigepflicht, Datenschutz und Patientenrechte", font: font, size: 10, gap: 10 },
    { text: "Topic 1.2: Hygiene- und Infektionsschutzstandards", font: boldFont, size: 11, gap: 10 },
    { text: "- Lesson 1.2.1: Händedesinfektion und persönliche Schutzausrüstung", font: font, size: 10, gap: 8 },
    { text: "- Lesson 1.2.2: Aufbereitung von Medizinprodukten und Entsorgung", font: font, size: 10, gap: 18 },

    { text: "Modul 2: Klinische Kommunikation und Dokumentation", font: boldFont, size: 13, gap: 14 },
    { text: "Fachsprachliche Kommunikation mit Patienten, Angehörigen und interdisziplinären Teams.", font: font, size: 10, gap: 12 },
    { text: "Topic 2.1: Patientenzentrierte Anamnese und Informationsweitergabe", font: boldFont, size: 11, gap: 10 },
    { text: "- Lesson 2.1.1: Strukturierte Übergabegespräche nach dem SBAR-Schema", font: font, size: 10, gap: 8 },
    { text: "- Lesson 2.1.2: Deeskalierende Gesprächsführung bei Belastungssituationen", font: font, size: 10, gap: 10 },
    { text: "Topic 2.2: Pflegedokumentation und SIS-Modell", font: boldFont, size: 11, gap: 10 },
    { text: "- Lesson 2.2.1: Rechtssichere Formulierung des Pflegeberichts", font: font, size: 10, gap: 8 },
    { text: "- Lesson 2.2.2: Digitale Erfassung von Vitalzeichen und Wundverläufen", font: font, size: 10, gap: 18 },

    { text: "Modul 3: Medikamentenmanagement und Vitalzeichenüberwachung", font: boldFont, size: 13, gap: 14 },
    { text: "Sichere Verabreichung von Arzneimitteln und Monitoring vitaler Körperfunktionen.", font: font, size: 10, gap: 12 },
    { text: "Topic 3.1: Die 6-R-Regel der Arzneimittelgabe", font: boldFont, size: 11, gap: 10 },
    { text: "- Lesson 3.1.1: Richtiges Richten, Prüfen und Dokumentieren", font: font, size: 10, gap: 8 },
    { text: "- Lesson 3.1.2: Erkennen von Nebenwirkungen und Notfallmaßnahmen", font: font, size: 10, gap: 10 },
    { text: "Topic 3.2: Erhebung und Interpretation vitaler Parameter", font: boldFont, size: 11, gap: 10 },
    { text: "- Lesson 3.2.1: Blutdruck, Puls, Sauerstoffsättigung und Blutzucker", font: font, size: 10, gap: 8 },
    { text: "- Lesson 3.2.2: Dokumentation von Abweichungen und Arztinformation", font: font, size: 10, gap: 18 },

    { text: "Modul 4: Akutpflege und Notfallmanagement im Stationsalltag", font: boldFont, size: 13, gap: 14 },
    { text: "Erkennen von Notfallsituationen und Einleitung lebensrettender Sofortmaßnahmen.", font: font, size: 10, gap: 12 },
    { text: "Topic 4.1: Basismaßnahmen der Reanimation (BLS)", font: boldFont, size: 11, gap: 10 },
    { text: "- Lesson 4.1.1: Notrufmanagement und Herzdruckmassage", font: font, size: 10, gap: 8 },
    { text: "- Lesson 4.1.2: Einsatz des automatisierten externen Defibrillators (AED)", font: font, size: 10, gap: 10 },
    { text: "Topic 4.2: Sturzprävention und Post-Sturz-Management", font: boldFont, size: 11, gap: 10 },
    { text: "- Lesson 4.2.1: Risikobewertung und prophylaktische Maßnahmen", font: font, size: 10, gap: 8 },
    { text: "- Lesson 4.2.2: Erstversorgung nach einem Sturz und Dokumentation", font: font, size: 10, gap: 10 },
  ];

  let page = pdfDoc.addPage([595, 842]); // A4
  let y = 800;

  for (const line of lines) {
    if (y < 60) {
      page = pdfDoc.addPage([595, 842]);
      y = 800;
    }
    page.drawText(line.text, {
      x: 50,
      y,
      size: line.size,
      font: line.font,
      color: rgb(0.12, 0.12, 0.12),
    });
    y -= line.gap;
  }

  const pdfBytes = await pdfDoc.save();
  const outputPath = path.resolve(process.cwd(), "sample-nursing-curriculum.pdf");
  fs.writeFileSync(outputPath, pdfBytes);
  console.log(`Saved sample curriculum PDF to: ${outputPath}`);
}

async function generateUnstructuredPdf() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const lines = [
    { text: "GERIATRIC NURSING CARE OVERVIEW", font: boldFont, size: 16, gap: 20 },
    { text: "This program covers foundational and advanced elderly care in residential settings.", font: font, size: 10, gap: 14 },
    { text: "Participants will develop competencies in mobilizing bedridden patients safely and comfortably.", font: font, size: 10, gap: 14 },
    { text: "Training includes nutrition planning, hydration monitoring, and assisting patients with dysphagia.", font: font, size: 10, gap: 14 },
    { text: "Special emphasis is given to dementia care, validation techniques, and creating a supportive environment.", font: font, size: 10, gap: 14 },
    { text: "Caregivers learn palliative comfort measures, pain scale observation, and supporting grieving family members.", font: font, size: 10, gap: 14 },
  ];

  const page = pdfDoc.addPage([595, 842]);
  let y = 800;
  for (const line of lines) {
    page.drawText(line.text, {
      x: 50,
      y,
      size: line.size,
      font: line.font,
      color: rgb(0.12, 0.12, 0.12),
    });
    y -= line.gap;
  }

  const pdfBytes = await pdfDoc.save();
  const outputPath = path.resolve(process.cwd(), "sample-unstructured-curriculum.pdf");
  fs.writeFileSync(outputPath, pdfBytes);
  console.log(`Saved unstructured sample PDF to: ${outputPath}`);
}

async function main() {
  await generateSamplePdf();
  await generateUnstructuredPdf();
}

main().catch(console.error);
