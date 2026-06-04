"use client";

import { useTagEditor } from "@/hooks/tag-editor/use-tag-editor";
import { createContext, ReactNode, useContext } from "react";

const TagEditorContext = createContext<
  ReturnType<typeof useTagEditor> | undefined
>(undefined);

export function TagEditorProvider({ children }: { children: ReactNode }) {
  const value = useTagEditor();

  return (
    <TagEditorContext.Provider value={value}>
      {children}
    </TagEditorContext.Provider>
  );
}

export function useTagEditorContext() {
  const context = useContext(TagEditorContext);
  if (context === undefined) {
    throw new Error(
      "useTagEditorContext must be used within TagEditorProvider"
    );
  }
  return context;
}
