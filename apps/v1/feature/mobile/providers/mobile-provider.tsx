"use client";

import { useDetectMobile } from "@/feature/mobile/hooks/use-mobile";
import { createContext, ReactNode, useContext } from "react";

const DetectMobileContext = createContext<
  ReturnType<typeof useDetectMobile> | undefined
>(undefined);

export function DetectMobileProvider({ children }: { children: ReactNode }) {
  const value = useDetectMobile();
  return (
    <DetectMobileContext.Provider value={value}>
      {children}
    </DetectMobileContext.Provider>
  );
}

export function useDetectMobileContext() {
  const context = useContext(DetectMobileContext);
  if (context === undefined) {
    throw new Error(
      "useDetectMobileContext must be used within DetectMobileProvider"
    );
  }
  return context;
}
