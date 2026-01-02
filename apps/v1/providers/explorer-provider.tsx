"use client";

import { useExplorer } from "@/hooks/use-explorer";
import { MediaListing } from "@/lib/media/types";
import { createContext, ReactNode, useContext } from "react";

type ExplorerContextType = ReturnType<typeof useExplorer>;

const ExplorerContext = createContext<ExplorerContextType | undefined>(
  undefined
);

export function ExplorerProvider({
  children,
  listing,
}: {
  children: ReactNode;
  listing: MediaListing;
}) {
  const value = useExplorer(listing);

  return (
    <ExplorerContext.Provider value={value}>
      {children}
    </ExplorerContext.Provider>
  );
}

export function useExplorerContext() {
  const context = useContext(ExplorerContext);
  if (context === undefined) {
    throw new Error("useExplorerContext must be used within ExplorerProvider");
  }
  return context;
}
