"use client";

import { useSelection } from "@/feature/selection/hooks/use-selection";
import React, { createContext, useContext } from "react";

const SelectionContext = createContext<
  ReturnType<typeof useSelection> | undefined
>(undefined);

interface SelectionProviderProps {
  children: React.ReactNode;
}

export function SelectionProvider({ children }: SelectionProviderProps) {
  const value = useSelection();

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelectionContext() {
  const context = useContext(SelectionContext);
  if (context === undefined) {
    throw new Error(
      "useSelectionContext must be used within SelectionProvider"
    );
  }
  return context;
}
