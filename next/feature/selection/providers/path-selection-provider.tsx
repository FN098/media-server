"use client";

import { usePathSelection } from "@/feature/selection/hooks/use-path-selection";
import React, { createContext, useContext } from "react";

const PathSelectionContext = createContext<
  ReturnType<typeof usePathSelection> | undefined
>(undefined);

interface PathSelectionProviderProps {
  children: React.ReactNode;
}

export function PathSelectionProvider({
  children,
}: PathSelectionProviderProps) {
  const value = usePathSelection();

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
