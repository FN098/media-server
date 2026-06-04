"use client";

import { useExplorer } from "@/hooks/explorer/use-explorer";
import { MediaListing } from "@/lib/media/types";
import { createContext, useContext } from "react";

const ExplorerContext = createContext<
  ReturnType<typeof useExplorer> | undefined
>(undefined);

export function ExplorerProvider({
  children,
  listing,
}: {
  children: React.ReactNode;
  listing: MediaListing;
}) {
  const value = useExplorer({ listing });

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
