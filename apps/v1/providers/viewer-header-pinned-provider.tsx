"use client";

import {
  HeaderPinned,
  useHeaderPinned,
} from "@/hooks/viewer/use-header-pinned";
import { createContext, useContext } from "react";

const headerPinnedContext = createContext<HeaderPinned | undefined>(undefined);

export function ViewerHeaderPinnedProvider({
  children,
  defaultPinned,
}: {
  children: React.ReactNode;
  defaultPinned?: boolean;
}) {
  const value = useHeaderPinned(defaultPinned);

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
