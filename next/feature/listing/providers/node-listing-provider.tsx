"use client";

import { NodeListing } from "@/lib/node/types";
import { createContext, ReactNode, useContext } from "react";

const NodeListingContext = createContext<NodeListing | undefined>(undefined);

export function NodeListingProvider({
  children,
  listing,
}: {
  children: ReactNode;
  listing: NodeListing;
}) {
  return (
    <NodeListingContext.Provider value={listing}>
      {children}
    </NodeListingContext.Provider>
  );
}

export function useNodeListingContext() {
  const context = useContext(NodeListingContext);
  if (context === undefined) {
    throw new Error(
      "useNodeListingContext must be used within NodeListingProvider"
    );
  }
  return context;
}
