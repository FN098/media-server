"use client";

import { useHeaderPinned } from "@/hooks/viewer/use-header-pinned";
import { createContext, useContext } from "react";

const headerPinnedContext = createContext<
  ReturnType<typeof useHeaderPinned> | undefined
>(undefined);

export function ViewerHeaderPinnedProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = useHeaderPinned();

  return (
    <headerPinnedContext.Provider value={value}>
      {children}
    </headerPinnedContext.Provider>
  );
}

export function useViewerHeaderPinnedContext() {
  const context = useContext(headerPinnedContext);
  if (context === undefined) {
    throw new Error(
      "useViewerHeaderPinnedContext must be used within ViewerHeaderPinnedProvider"
    );
  }
  return context;
}
