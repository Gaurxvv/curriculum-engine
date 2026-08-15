import { CurriculumNode } from "./types";

export type ParseEvent =
  | { type: "status"; message: string }
  | { type: "program_info"; title?: string; description?: string }
  | { type: "boundaries_found"; count: number; unstructured: boolean }
  | { type: "module_progress"; index: number; total: number; title: string }
  | { type: "module_done"; module: CurriculumNode }
  | { type: "module_error"; index: number; title: string; error: string }
  | { type: "complete"; moduleCount: number; warning?: string }
  | { type: "error"; message: string };
