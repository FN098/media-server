"use client";

import { useSelection } from "@/hooks/use-selection";
import { MediaSelectionKeyType } from "@/lib/media/types";
import React, { createContext, useContext } from "react";

type SelectionContextType = ReturnType<
  typeof useSelection<MediaSelectionKeyType>
>;

const SelectionContext = createContext<SelectionContextType | undefined>(
  undefined
);

export function SelectionProvider({
  children,
  selectedKeys,
}: {
  children: React.ReactNode;
  selectedKeys?: MediaSelectionKeyType;
}) {
  const value = useSelection(selectedKeys);

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
