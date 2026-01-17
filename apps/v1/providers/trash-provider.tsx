"use client";

import { useTrash } from "@/hooks/use-trash";
import { MediaListing } from "@/lib/media/types";
import { createContext, ReactNode, useContext } from "react";

type TrashContextType = ReturnType<typeof useTrash>;

const TrashContext = createContext<TrashContextType | undefined>(undefined);

export function TrashProvider({
  children,
  listing,
}: {
  children: ReactNode;
  listing: MediaListing;
}) {
  const value = useTrash(listing);

  return (
    <TrashContext.Provider value={value}>{children}</TrashContext.Provider>
  );
}

export function useTrashContext() {
  const context = useContext(TrashContext);
  if (context === undefined) {
    throw new Error("useTrashContext must be used within TrashProvider");
  }
  return context;
}
