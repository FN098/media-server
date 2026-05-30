"use client";

import { usePathSelection } from "@/hooks/selections/use-path-selection";
import React, { createContext, useContext } from "react";

type PathSelectionContextType = ReturnType<typeof usePathSelection>;

const PathSelectionContext = createContext<
  PathSelectionContextType | undefined
>(undefined);

export function PathSelectionProvider({
  children,
  selectedPaths,
}: {
  children: React.ReactNode;
  selectedPaths?: Iterable<string>;
}) {
  const value = usePathSelection(selectedPaths);

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
