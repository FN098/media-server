"use client";

import { useNodeSelection } from "@/feature/selection/hooks/use-path-selection";
import React, { createContext, useContext } from "react";

const NodeSelectionContext = createContext<
  ReturnType<typeof useNodeSelection> | undefined
>(undefined);

interface NodeSelectionProviderProps {
  children: React.ReactNode;
}

export function NodeSelectionProvider({
  children,
}: NodeSelectionProviderProps) {
  const value = useNodeSelection();

  return (
    <NodeSelectionContext.Provider value={value}>
      {children}
    </NodeSelectionContext.Provider>
  );
}

export function useNodeSelectionContext() {
  const context = useContext(NodeSelectionContext);
  if (context === undefined) {
    throw new Error(
      "useNodeSelectionContext must be used within NodeSelectionProvider"
    );
  }
  return context;
}
