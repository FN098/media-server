"use client";

import { useLocale } from "@/feature/general/hooks/use-locale";
import { createContext, useContext } from "react";

const LocaleContext = createContext<ReturnType<typeof useLocale> | undefined>(
  undefined
);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const value = useLocale();

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocaleContext() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error("useLocaleContext must be used within LocaleProvider");
  }
  return context;
}
