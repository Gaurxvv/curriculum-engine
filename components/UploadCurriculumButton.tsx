"use client";

import { useRef, useState } from "react";
import { AlertTriangle, Loader2, UploadCloud, X } from "lucide-react";
import { CurriculumNode } from "@/lib/types";
import { ParseEvent } from "@/lib/parseEvents";

interface Props {
  onModule: (module: CurriculumNode) => void;
  onProgramInfo?: (info: { title?: string; description?: string }) => void;
}

interface ImportState {
  phase: "idle" | "running" | "done" | "error";
  status: string;
  total: number;
  completed: number;
  errors: { title: string; error: string }[];
  warning?: string;
  fatalError?: string;
}

const INITIAL_STATE: ImportState = {
  phase: "idle",
  status: "",
  total: 0,
  completed: 0,
  errors: [],
};

export function UploadCurriculumButton({ onModule, onProgramInfo }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ImportState>(INITIAL_STATE);

  const handleFile = async (file: File) => {
    setState({ ...INITIAL_STATE, phase: "running", status: "Uploading…" });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/parse-curriculum", { method: "POST", body: formData });
      if (!res.body) throw new Error("No response stream from server.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as ParseEvent;
          applyEvent(event);
        }
      }
    } catch (err) {
      setState((s) => ({
        ...s,
        phase: "error",
        fatalError: err instanceof Error ? err.message : "Import failed.",
      }));
    }
  };

  const applyEvent = (event: ParseEvent) => {
    setState((s) => {
      switch (event.type) {
        case "status":
          return { ...s, status: event.message };
        case "program_info":
          onProgramInfo?.(event);
          return s;
        case "boundaries_found":
          return {
            ...s,
            total: event.count,
            status: event.unstructured
              ? "No clear module structure found — generating one from the document's content…"
              : `Found ${event.count} module${event.count === 1 ? "" : "s"}. Extracting topics & lessons…`,
          };
        case "module_progress":
          return { ...s, status: `Processing "${event.title}" (${event.index + 1} of ${event.total})` };
        case "module_done":
          onModule(event.module);
          return { ...s, completed: s.completed + 1 };
        case "module_error":
          return {
            ...s,
            completed: s.completed + 1,
            errors: [...s.errors, { title: event.title, error: event.error }],
          };
        case "complete":
          return { ...s, phase: "done", status: "Import complete.", warning: event.warning };
        case "error":
          return { ...s, phase: "error", fatalError: event.message };
        default:
          return s;
      }
    });
  };

  const dismiss = () => setState(INITIAL_STATE);
  const isRunning = state.phase === "running";

  return (
    <div className="relative">
      <button
        onClick={() => inputRef.current?.click()}
        disabled={isRunning}
        className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-600 disabled:opacity-60
          text-white text-[13px] font-medium px-3.5 py-2 rounded-lg shadow-card transition-colors"
      >
        {isRunning ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
        {isRunning ? "Importing…" : "Upload Curriculum"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) handleFile(file);
        }}
      />

      {state.phase !== "idle" && (
        <div className="absolute right-0 mt-2 w-80 bg-surface border border-ink-100 rounded-xl shadow-popover p-3.5 z-20 animate-fade-in">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {state.phase === "error" ? (
                <p className="text-[13px] font-medium text-red-600 flex items-center gap-1.5">
                  <AlertTriangle size={14} /> Import failed
                </p>
              ) : (
                <p className="text-[13px] font-medium text-ink-900">
                  {state.phase === "done" ? "Import complete" : "Reading your curriculum"}
                </p>
              )}
              <p className="text-[12px] text-ink-500 mt-0.5 leading-snug">
                {state.fatalError ?? state.status}
              </p>
            </div>
            {!isRunning && (
              <button onClick={dismiss} className="text-ink-300 hover:text-ink-600 shrink-0">
                <X size={14} />
              </button>
            )}
          </div>

          {state.total > 0 && (
            <div className="mt-2.5">
              <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand transition-all duration-300"
                  style={{ width: `${Math.min(100, (state.completed / state.total) * 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-ink-500 mt-1">
                {state.completed} of {state.total} modules processed
              </p>
            </div>
          )}

          {state.warning && (
            <p className="text-[11.5px] text-clinical-teal bg-clinical-tealSoft rounded-md px-2 py-1.5 mt-2.5 leading-snug">
              {state.warning}
            </p>
          )}

          {state.errors.length > 0 && (
            <div className="mt-2.5 space-y-1">
              {state.errors.map((e, i) => (
                <p key={i} className="text-[11px] text-red-600 leading-snug">
                  <span className="font-medium">{e.title}:</span> couldn&apos;t be processed — you can add it manually.
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
