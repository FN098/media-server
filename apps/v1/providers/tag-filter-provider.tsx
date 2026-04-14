"use client";

import { useTagFilter } from "@/hooks/use-tag-filter";
import { MediaNode } from "@/lib/media/types";
import { createContext, ReactNode, useContext } from "react";

type TagFilterContextType = ReturnType<typeof useTagFilter>;
type TagFilterContextOptions = {
  suppressError?: boolean;
};

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

// overload
export function useTagFilterContext(options: {
  suppressError?: false;
}): TagFilterContextType;

export function useTagFilterContext(options: {
  suppressError: true;
}): TagFilterContextType | null;

// implementation
export function useTagFilterContext(options?: TagFilterContextOptions) {
  const context = useContext(TagFilterContext);
  if (context === undefined) {
    if (options?.suppressError) {
      return null; // throw せずに null を返す
    }
    throw new Error(
      "useTagFilterContext must be used within TagFilterProvider"
    );
  }
  return context;
}
