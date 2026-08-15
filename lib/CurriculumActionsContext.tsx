"use client";

import { createContext, useContext } from "react";

export interface CurriculumActions {
  setTitle: (id: string, value: string) => void;
  setDescription: (id: string, value: string) => void;
  addChildTo: (parentId: string) => void;
  deleteNode: (id: string) => void;
  toggleNode: (id: string) => void;
  lastCreatedId?: string | null;
  clearLastCreatedId?: () => void;
}

const CurriculumActionsContext = createContext<CurriculumActions | null>(null);

export function CurriculumActionsProvider({
  actions,
  children,
}: {
  actions: CurriculumActions;
  children: React.ReactNode;
}) {
  return (
    <CurriculumActionsContext.Provider value={actions}>{children}</CurriculumActionsContext.Provider>
  );
}

export function useCurriculumActions(): CurriculumActions {
  const ctx = useContext(CurriculumActionsContext);
  if (!ctx) throw new Error("useCurriculumActions must be used within CurriculumActionsProvider");
  return ctx;
}
