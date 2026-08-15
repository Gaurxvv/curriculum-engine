"use client";

import { Layers, Plus, RotateCcw } from "lucide-react";
import { useCurriculumState } from "@/lib/useCurriculumState";
import { CurriculumActionsProvider } from "@/lib/CurriculumActionsContext";
import { CurriculumNodeView } from "@/components/CurriculumNodeView";
import { InlineField } from "@/components/InlineField";
import { UploadCurriculumButton } from "@/components/UploadCurriculumButton";
import { ExportDropdown } from "@/components/ExportDropdown";

export default function Page() {
  const {
    tree,
    lastCreatedId,
    setTitle,
    setDescription,
    addChildTo,
    deleteNode,
    toggleNode,
    importModules,
    clearLastCreatedId,
    clearTree,
  } = useCurriculumState("Pflegefachassistenz — Program 1");

  const actions = {
    setTitle,
    setDescription,
    addChildTo,
    deleteNode,
    toggleNode,
    lastCreatedId,
    clearLastCreatedId,
  };
  const moduleCount = tree.children.length;
  const topicCount = tree.children.reduce((n, m) => n + m.children.length, 0);
  const lessonCount = tree.children.reduce(
    (n, m) => n + m.children.reduce((tn, t) => tn + t.children.length, 0),
    0
  );

  const hasContent =
    moduleCount > 0 ||
    (tree.title && tree.title !== "Untitled Program") ||
    !!tree.description;

  return (
    <CurriculumActionsProvider actions={actions}>
      <div className="min-h-screen bg-canvas">
        <div className="max-w-3xl mx-auto px-6 py-10">
          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center justify-between gap-4 mb-1">
              <div className="flex items-center gap-2 text-brand-700">
                <Layers size={16} />
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider">
                  Curriculum Creation Engine
                </span>
              </div>
              <div className="flex items-center gap-2">
                {hasContent && (
                  <>
                    <ExportDropdown tree={tree} />
                    <button
                      onClick={clearTree}
                      title="Clear curriculum and reset header"
                      className="inline-flex items-center gap-1 text-[12px] text-ink-400 hover:text-red-600
                        hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      <RotateCcw size={13} /> Clear
                    </button>
                  </>
                )}
                <UploadCurriculumButton
                  onModule={(m) => importModules([m])}
                  onProgramInfo={({ title, description }) => {
                    if (title) setTitle(tree.id, title);
                    if (description) setDescription(tree.id, description);
                  }}
                />
              </div>
            </div>

            <InlineField
              value={tree.title}
              onChange={(v) => setTitle(tree.id, v)}
              placeholder="Untitled Program"
              variant="title"
              className="text-[26px] tracking-tight -mx-1.5"
            />
            <InlineField
              value={tree.description}
              onChange={(v) => setDescription(tree.id, v)}
              placeholder="Click to add a description for this program"
              variant="description"
              className="text-[14px] text-ink-500 -mx-1.5"
            />

            {moduleCount > 0 && (
              <p className="text-[12px] text-ink-500 mt-3">
                {moduleCount} module{moduleCount === 1 ? "" : "s"} · {topicCount} topic
                {topicCount === 1 ? "" : "s"} · {lessonCount} lesson{lessonCount === 1 ? "" : "s"}
              </p>
            )}
          </header>

          {/* Tree */}
          {moduleCount === 0 ? (
            <div className="border-2 border-dashed border-ink-200 rounded-xl py-14 px-6 text-center">
              <p className="text-[14px] font-medium text-ink-700">This program doesn&apos;t have any modules yet</p>
              <p className="text-[13px] text-ink-500 mt-1 max-w-sm mx-auto">
                Build it by hand, or upload a curriculum PDF and let the AI lay out a starting
                structure you can refine.
              </p>
              <button
                onClick={() => addChildTo(tree.id)}
                className="inline-flex items-center gap-1.5 mt-4 bg-brand hover:bg-brand-600 text-white
                  text-[13px] font-medium px-4 py-2 rounded-lg shadow-card transition-colors"
              >
                <Plus size={14} /> Add your first module
              </button>
            </div>
          ) : (
            <>
              {tree.children.map((module, i) => (
                <CurriculumNodeView key={module.id} node={module} index={i} />
              ))}
              <button
                onClick={() => addChildTo(tree.id)}
                className="flex items-center gap-1.5 text-[13px] font-medium text-ink-500 hover:text-brand-700
                  px-2 py-2 rounded-md hover:bg-brand-50 transition-colors"
              >
                <Plus size={14} /> Add Module
              </button>
            </>
          )}
        </div>
      </div>
    </CurriculumActionsProvider>
  );
}
