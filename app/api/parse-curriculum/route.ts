import { NextRequest } from "next/server";
import { extractPdfText } from "@/lib/pdfExtract";
import { parseCurriculumPdf } from "@/lib/aiParse";
import { ParseEvent } from "@/lib/parseEvents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Allow this to run long on platforms that support it (e.g. Vercel Pro).
// On plans capped lower, large PDFs may need fewer modules per request —
// see README for notes on scaling this further.
export const maxDuration = 300;

function encode(event: ParseEvent): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(event) + "\n");
}

export async function POST(req: NextRequest) {
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ParseEvent) => controller.enqueue(encode(event));

      try {
        const form = await req.formData();
        const file = form.get("file");

        if (!file || !(file instanceof File)) {
          send({ type: "error", message: "No PDF file was received." });
          controller.close();
          return;
        }
        if (file.type && file.type !== "application/pdf") {
          send({ type: "error", message: "That file doesn't look like a PDF." });
          controller.close();
          return;
        }

        send({ type: "status", message: "Reading PDF…" });
        const buffer = Buffer.from(await file.arrayBuffer());

        let text: string;
        try {
          text = await extractPdfText(buffer);
        } catch (err) {
          send({
            type: "error",
            message:
              "Couldn't read this PDF. It may be scanned/image-only, encrypted, or corrupted.",
          });
          controller.close();
          return;
        }

        for await (const event of parseCurriculumPdf(text)) {
          send(event);
        }
      } catch (err) {
        send({
          type: "error",
          message: err instanceof Error ? err.message : "Unexpected server error.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
