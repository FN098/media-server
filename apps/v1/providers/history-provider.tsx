"use client";

import { useHistory } from "@/hooks/use-history";
import { createContext, useContext } from "react";

type HistoryContextType = ReturnType<typeof useHistory>;

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const value = useHistory();

  return (
    <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>
  );
}

export function useHistoryContext() {
  const context = useContext(HistoryContext);
  if (context === undefined) {
    throw new Error("useHistoryContext must be used within HistoryProvider");
  }
  return context;
}
