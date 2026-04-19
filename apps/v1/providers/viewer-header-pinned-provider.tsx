"use client";

import { usePinned } from "@/hooks/use-pinned";
import { createContext, useContext } from "react";

type PinnedContextType = ReturnType<typeof usePinned>;

const PinnedContext = createContext<PinnedContextType | undefined>(undefined);

export function ViewerHeaderPinnedProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = usePinned();

  return (
    <PinnedContext.Provider value={value}>{children}</PinnedContext.Provider>
  );
}

export function useViewerHeaderPinnedContext() {
  const context = useContext(PinnedContext);
  if (context === undefined) {
    throw new Error(
      "useViewerHeaderPinnedContext must be used within ViewerHeaderPinnedProvider"
    );
  }
  return context;
}
