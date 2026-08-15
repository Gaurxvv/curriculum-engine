"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Download, FileCode, FileText } from "lucide-react";
import { CurriculumNode } from "@/lib/types";
import { downloadFile, sanitizeFilename, treeToJson, treeToMarkdown } from "@/lib/exportCurriculum";

interface ExportDropdownProps {
  tree: CurriculumNode;
}

export function ExportDropdown({ tree }: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleDownloadMarkdown = () => {
    const md = treeToMarkdown(tree);
    const filename = sanitizeFilename(tree.title, "md");
    downloadFile(md, filename, "text/markdown;charset=utf-8");
    setIsOpen(false);
  };

  const handleDownloadJson = () => {
    const json = treeToJson(tree);
    const filename = sanitizeFilename(tree.title, "json");
    downloadFile(json, filename, "application/json;charset=utf-8");
    setIsOpen(false);
  };

  const handleCopyMarkdown = async () => {
    const md = treeToMarkdown(tree);
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setIsOpen(false);
      }, 1500);
    } catch (err) {
      console.error("Failed to copy curriculum:", err);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Export curriculum to Markdown or JSON"
        className="inline-flex items-center gap-1.5 bg-surface hover:bg-ink-100 text-ink-700
          text-[13px] font-medium px-3 py-2 rounded-lg border border-ink-200 shadow-sm transition-colors"
      >
        <Download size={14} className="text-ink-500" />
        Export
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-60 bg-surface border border-ink-200/90 rounded-xl shadow-popover p-1.5 z-30 animate-fade-in">
          <div className="px-2.5 py-1.5 border-b border-ink-100 mb-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Export Options</p>
          </div>

          <button
            onClick={handleDownloadMarkdown}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 text-left text-[12.5px] font-medium text-ink-700
              hover:bg-brand-50 hover:text-brand-800 rounded-lg transition-colors"
          >
            <FileText size={15} className="text-brand-600" />
            <div className="flex-1 min-w-0">
              <p className="leading-none">Download Markdown</p>
              <p className="text-[10.5px] text-ink-400 mt-0.5 font-normal">Syllabus for Notion & Docs (.md)</p>
            </div>
          </button>

          <button
            onClick={handleDownloadJson}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 text-left text-[12.5px] font-medium text-ink-700
              hover:bg-brand-50 hover:text-brand-800 rounded-lg transition-colors"
          >
            <FileCode size={15} className="text-clinical-teal" />
            <div className="flex-1 min-w-0">
              <p className="leading-none">Download JSON</p>
              <p className="text-[10.5px] text-ink-400 mt-0.5 font-normal">Schema tree for LMS APIs (.json)</p>
            </div>
          </button>

          <button
            onClick={handleCopyMarkdown}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 text-left text-[12.5px] font-medium text-ink-700
              hover:bg-brand-50 hover:text-brand-800 rounded-lg transition-colors"
          >
            {copied ? (
              <Check size={15} className="text-emerald-600" />
            ) : (
              <Copy size={15} className="text-ink-400" />
            )}
            <div className="flex-1 min-w-0">
              <p className="leading-none">{copied ? "Copied to Clipboard!" : "Copy Syllabus Text"}</p>
              <p className="text-[10.5px] text-ink-400 mt-0.5 font-normal">
                {copied ? "Ready to paste anywhere" : "Formatted Markdown text"}
              </p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
