"use client";

import { useBoolState } from "@/hooks/use-bool-state";
import { createContext, useContext } from "react";

type BoolStateContextType = ReturnType<typeof useBoolState>;

const BoolStateContext = createContext<BoolStateContextType | undefined>(
  undefined
);

export function ViewerHeaderPinnedProvider({
  children,
  defaultPinned,
}: {
  children: React.ReactNode;
  defaultPinned?: boolean;
}) {
  const value = useBoolState(defaultPinned);

  return (
    <BoolStateContext.Provider value={value}>
      {children}
    </BoolStateContext.Provider>
  );
}

export function useViewerHeaderPinnedContext() {
  const context = useContext(BoolStateContext);
  if (context === undefined) {
    throw new Error(
      "useViewerHeaderPinnedContext must be used within ViewerHeaderPinnedProvider"
    );
  }
  return context;
}
