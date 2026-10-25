"use client";

import { useMobile } from "@/feature/mobile/hooks/use-mobile";
import { createContext, ReactNode, useContext } from "react";

const MobileContext = createContext<ReturnType<typeof useMobile> | undefined>(
  undefined
);

export function MobileProvider({ children }: { children: ReactNode }) {
  const value = useMobile();
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
