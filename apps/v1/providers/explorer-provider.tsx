"use client";

import {
  ExplorerContextValue,
  useExplorer,
} from "@/hooks/explorer/use-explorer";
import { MediaListing } from "@/lib/media/types";
import { createContext, useContext } from "react";

const ExplorerContext = createContext<ExplorerContextValue | undefined>(
  undefined
);

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
  const ctx = useContext(ExplorerContext);
  if (ctx === undefined) {
    throw new Error("useExplorerContext must be used within ExplorerProvider");
  }
  return ctx;
}
