import { extractText, getDocumentProxy } from "unpdf";

// unpdf wraps a current, actively-maintained pdf.js build and is built for
// serverless runtimes. (An earlier pass used pdf-parse, which bundles a
// years-old frozen pdf.js and failed on a perfectly valid, modern PDF during
// testing — not worth the reliability risk for files that will come from
// Word/Docs/Canva exports in practice.)
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return text ?? "";
}
