"use client";

import {
  useTagEditSheet,
  UseTagEditSheetProps,
} from "@/feature/tag-editor/hooks/use-tag-edit-sheet";
import { createContext, ReactNode, useContext } from "react";

const TagEditSheetContext = createContext<
  ReturnType<typeof useTagEditSheet> | undefined
>(undefined);

interface TagEditSheetProvider extends UseTagEditSheetProps {
  children: ReactNode;
}

export function TagEditSheetProvider({
  children,
  ...props
}: TagEditSheetProvider) {
  const value = useTagEditSheet(props);

  return (
    <TagEditSheetContext.Provider value={value}>
      {children}
    </TagEditSheetContext.Provider>
  );
}

export function useTagEditSheetContext() {
  const context = useContext(TagEditSheetContext);
  if (context === undefined) {
    throw new Error(
      "useTagEditSheetContext must be used within TagEditSheetProvider"
    );
  }
  return context;
}
