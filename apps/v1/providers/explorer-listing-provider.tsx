"use client";

import { useExplorerListing } from "@/hooks/use-explorer-listing";
import { MediaListing } from "@/lib/media/types";
import { createContext, ReactNode, useContext } from "react";

type ExplorerListingContextType = ReturnType<typeof useExplorerListing>;

const ExplorerListingContext = createContext<
  ExplorerListingContextType | undefined
>(undefined);

export function ExplorerListingProvider({
  children,
  listing,
}: {
  children: ReactNode;
  listing: MediaListing;
}) {
  const value = useExplorerListing(listing);

  return (
    <ExplorerListingContext.Provider value={value}>
      {children}
    </ExplorerListingContext.Provider>
  );
}

export function useExplorerListingContext() {
  const context = useContext(ExplorerListingContext);
  if (context === undefined) {
    throw new Error(
      "useExplorerListingContext must be used within ExplorerListingProvider"
    );
  }
  return context;
}
