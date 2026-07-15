"use client";

import {
  useHistory,
  UseHistoryProps,
} from "@/feature/history/hooks/use-history";
import { createContext, useContext } from "react";

const HistoryContext = createContext<ReturnType<typeof useHistory> | undefined>(
  undefined
);

interface HistoryProviderProps extends UseHistoryProps {
  children: React.ReactNode;
}

export function HistoryProvider({ children, ...rest }: HistoryProviderProps) {
  const value = useHistory(rest);

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
