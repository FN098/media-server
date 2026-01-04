"use client";

import { usePathSelection } from "@/hooks/use-path-selection";
import { PathType } from "@/lib/path/types";
import React, { createContext, useContext } from "react";

type PathSelectionContextType = ReturnType<typeof usePathSelection>;

const PathSelectionContext = createContext<
  PathSelectionContextType | undefined
>(undefined);

export function PathSelectionProvider({
  children,
  initialSelectedPaths,
}: {
  children: React.ReactNode;
  initialSelectedPaths?: Iterable<PathType>;
}) {
  const value = usePathSelection(initialSelectedPaths);

  return (
    <PathSelectionContext.Provider value={value}>
      {children}
    </PathSelectionContext.Provider>
  );
}

export function usePathSelectionContext() {
  const context = useContext(PathSelectionContext);
  if (context === undefined) {
    throw new Error(
      "usePathSelectionContext must be used within PathSelectionProvider"
    );
  }
  return context;
}
