"use client";

import { useViewerHeaderPinned } from "@/feature/viewer/hooks/use-viewer-header-pinned";
import { createContext, useContext } from "react";

const HeaderPinnedContext = createContext<
  ReturnType<typeof useViewerHeaderPinned> | undefined
>(undefined);

export function ViewerHeaderPinnedProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = useViewerHeaderPinned();

  return (
    <HeaderPinnedContext.Provider value={value}>
      {children}
    </HeaderPinnedContext.Provider>
  );
}

export function useViewerHeaderPinnedContext() {
  const context = useContext(HeaderPinnedContext);
  if (context === undefined) {
    throw new Error(
      "useViewerHeaderPinnedContext must be used within ViewerHeaderPinnedProvider"
    );
  }
  return context;
}
