"use client";

import { useEffect, useRef } from "react";

interface InlineFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  variant: "title" | "description";
  className?: string;
  autoFocus?: boolean;
}

/**
 * A textarea styled to look like plain text until it's focused. No modal,
 * no edit/view mode toggle, no save button — it's always live. Height grows
 * with content so a long description never gets clipped in a fixed box.
 */
export function InlineField({
  value,
  onChange,
  placeholder,
  variant,
  className = "",
  autoFocus = false,
}: InlineFieldProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(resize, [value]);

  useEffect(() => {
    if (autoFocus && ref.current) {
      ref.current.focus();
      const len = ref.current.value.length;
      ref.current.setSelectionRange(len, len);
    }
  }, [autoFocus]);

  const base =
    variant === "title"
      ? "font-semibold leading-snug placeholder:font-normal"
      : "font-normal leading-relaxed";

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
      }}
      onKeyDown={(e) => {
        if (variant === "title" && e.key === "Enter") {
          e.preventDefault();
          ref.current?.blur();
        }
      }}
      onInput={resize}
      placeholder={placeholder}
      className={`w-full resize-none overflow-hidden bg-transparent border-none outline-none
        placeholder:text-ink-300 text-ink-900
        focus:bg-brand-50/60 focus:rounded-md
        rounded-md px-1.5 -mx-1.5 py-0.5 transition-colors
        ${base} ${className}`}
    />
  );
}
