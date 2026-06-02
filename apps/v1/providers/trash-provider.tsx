"use client";

import { TrashContextValue, useTrash } from "@/hooks/trash/use-trash";
import { MediaListing } from "@/lib/media/types";
import { createContext, useContext } from "react";

const TrashContext = createContext<TrashContextValue | undefined>(undefined);

export function TrashProvider({
  children,
  listing,
}: {
  children: React.ReactNode;
  listing: MediaListing;
}) {
  const value = useTrash({ listing });

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
