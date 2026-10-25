"use client";

import {
  useExplorer,
  UseExplorerProps,
} from "@/app/(pages)/explorer/_hooks/use-explorer";
import { createContext, useContext } from "react";

const ExplorerContext = createContext<
  ReturnType<typeof useExplorer> | undefined
>(undefined);

interface ExplorerProviderProps extends UseExplorerProps {
  children: React.ReactNode;
}

/** @deprecated */
export function ExplorerProvider({ children, ...rest }: ExplorerProviderProps) {
  const value = useExplorer(rest);

  return (
    <ExplorerContext.Provider value={value}>
      {children}
    </ExplorerContext.Provider>
  );
}

/** @deprecated */
export function useExplorerContext() {
  const context = useContext(ExplorerContext);
  if (context === undefined) {
    throw new Error("useExplorerContext must be used within ExplorerProvider");
  }
  return context;
}
