"use client";

import { usePathSelection } from "@/hooks/selections/use-path-selection";
import React, { createContext, useContext } from "react";

const PathSelectionContext = createContext<
  ReturnType<typeof usePathSelection> | undefined
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
