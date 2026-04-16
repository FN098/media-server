"use client";

import { useTagFilter } from "@/hooks/use-tag-filter";
import { TagFilterOptions } from "@/lib/filter/types";
import { createContext, ReactNode, useContext } from "react";

type TagFilterContextType = ReturnType<typeof useTagFilter>;

const TagFilterContext = createContext<TagFilterContextType | undefined>(
  undefined
);

export function TagFilterProvider({
  children,
  options,
}: {
  children: ReactNode;
  options?: TagFilterOptions;
}) {
  const value = useTagFilter(options);

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
