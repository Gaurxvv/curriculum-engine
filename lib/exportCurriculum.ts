import { CurriculumNode } from "./types";

/**
 * Converts a CurriculumNode tree into structured, publication-ready Markdown syllabus.
 */
export function treeToMarkdown(root: CurriculumNode): string {
  const lines: string[] = [];

  // Curriculum Header
  lines.push(`# ${root.title || "Untitled Curriculum"}`);
  if (root.description?.trim()) {
    lines.push("");
    lines.push(root.description.trim());
  }
  lines.push("");

  // Modules
  root.children.forEach((module, mIdx) => {
    const modNum = mIdx + 1;
    const modInferred = module.aiInferred ? " *(AI-inferred)*" : "";
    lines.push(`## Module ${modNum}: ${module.title || "Untitled Module"}${modInferred}`);
    
    if (module.description?.trim()) {
      lines.push("");
      lines.push(module.description.trim());
    }
    lines.push("");

    // Topics
    module.children.forEach((topic, tIdx) => {
      const topNum = `${modNum}.${tIdx + 1}`;
      const topInferred = topic.aiInferred ? " *(AI-inferred)*" : "";
      lines.push(`### Topic ${topNum}: ${topic.title || "Untitled Topic"}${topInferred}`);

      if (topic.description?.trim()) {
        lines.push("");
        lines.push(topic.description.trim());
      }
      lines.push("");

      // Lessons
      topic.children.forEach((lesson, lIdx) => {
        const lesNum = `${topNum}.${lIdx + 1}`;
        const lesInferred = lesson.aiInferred ? " *(AI-inferred)*" : "";
        lines.push(`- **Lesson ${lesNum}: ${lesson.title || "Untitled Lesson"}**${lesInferred}`);
        if (lesson.description?.trim()) {
          lines.push(`  ${lesson.description.trim()}`);
        }
      });

      if (topic.children.length > 0) {
        lines.push("");
      }
    });
  });

  return lines.join("\n").trim() + "\n";
}

/**
 * Serializes the curriculum tree to formatted JSON matching the exact node schema.
 */
export function treeToJson(root: CurriculumNode): string {
  return JSON.stringify(root, null, 2) + "\n";
}

/**
 * Sanitizes the program title for use as a clean file name.
 */
export function sanitizeFilename(title: string, extension: string): string {
  const safeName = (title || "curriculum")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 50);

  return `${safeName || "curriculum"}.${extension}`;
}

/**
 * Triggers a 100% client-side file download using Blobs.
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
