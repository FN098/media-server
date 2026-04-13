"use client";

import { useTagFilter } from "@/hooks/use-tag-filter";
import { MediaNode } from "@/lib/media/types";
import { createContext, ReactNode, useContext } from "react";

type TagFilterContextType = ReturnType<typeof useTagFilter>;

const TagFilterContext = createContext<TagFilterContextType | undefined>(
  undefined
);

export function TagFilterProvider({
  children,
  targetNodes,
}: {
  children: ReactNode;
  targetNodes?: MediaNode[];
}) {
  const value = useTagFilter(targetNodes);

  return (
    <TagFilterContext.Provider value={value}>
      {children}
    </TagFilterContext.Provider>
  );
}

export function useTagFilterContext() {
  const context = useContext(TagFilterContext);
  if (context === undefined) {
    throw new Error(
      "useTagFilterContext must be used within TagFilterProvider"
    );
  }
  return context;
}
