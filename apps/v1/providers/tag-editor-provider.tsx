"use client";

import { useTagEditor } from "@/hooks/use-tag-editor";
import { MediaNode } from "@/lib/media/types";
import { createContext, ReactNode, useContext } from "react";

type TagEditorContextType = ReturnType<typeof useTagEditor>;

const TagEditorContext = createContext<TagEditorContextType | undefined>(
  undefined
);

/** @deprecated 使用されていない */
export function TagEditorProvider({
  children,
  targetNodes,
}: {
  children: ReactNode;
  targetNodes: MediaNode[];
}) {
  const value = useTagEditor(targetNodes);

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
