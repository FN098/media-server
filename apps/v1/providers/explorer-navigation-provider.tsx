"use client";

import { useExplorerNavigation } from "@/hooks/use-explorer-navigation";
import { createContext, ReactNode, useContext } from "react";

type ExplorerNavigationContextType = ReturnType<typeof useExplorerNavigation>;

const ExplorerNavigationContext = createContext<
  ExplorerNavigationContextType | undefined
>(undefined);

export function ExplorerNavigationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const value = useExplorerNavigation();

  return (
    <ExplorerNavigationContext.Provider value={value}>
      {children}
    </ExplorerNavigationContext.Provider>
  );
}

export function useExplorerNavigationContext() {
  const context = useContext(ExplorerNavigationContext);
  if (context === undefined) {
    throw new Error(
      "useExplorerNavigationContext must be used within ExplorerNavigationProvider"
    );
  }
  return context;
}
