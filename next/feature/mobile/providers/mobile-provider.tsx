"use client";

import { useIsMobile } from "@/feature/mobile/hooks/use-mobile";
import { createContext, ReactNode, useContext } from "react";

const MobileContext = createContext<ReturnType<typeof useIsMobile> | undefined>(
  undefined
);

export function MobileProvider({ children }: { children: ReactNode }) {
  const value = useIsMobile();
  return (
    <MobileContext.Provider value={value}>{children}</MobileContext.Provider>
  );
}

export function useMobileContext() {
  const context = useContext(MobileContext);
  if (context === undefined) {
    throw new Error("useMobileContext must be used within MobileProvider");
  }
  return context;
}
