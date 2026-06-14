"use client";

import { useCanHover } from "@/feature/general/hooks/use-can-hover";
import { createContext, useContext } from "react";

const CanHoverContext = createContext<
  ReturnType<typeof useCanHover> | undefined
>(undefined);

export function CanHoverProvider({ children }: { children: React.ReactNode }) {
  const value = useCanHover();

  return (
    <CanHoverContext.Provider value={value}>
      {children}
    </CanHoverContext.Provider>
  );
}

export function useCanHoverContext() {
  const context = useContext(CanHoverContext);
  if (context === undefined) {
    throw new Error("useCanHoverContext must be used within CanHoverProvider");
  }
  return context;
}
