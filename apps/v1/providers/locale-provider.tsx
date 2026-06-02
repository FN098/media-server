"use client";

import { useLocale } from "@/hooks/general/use-locale";
import { createContext, useContext } from "react";

type Locale = ReturnType<typeof useLocale>;

const LocaleContext = createContext<Locale | undefined>(undefined);

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
