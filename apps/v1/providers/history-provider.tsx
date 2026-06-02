"use client";

import { useHistory } from "@/hooks/navigations/use-history";
import { createContext, useContext } from "react";

type History = ReturnType<typeof useHistory>;

const HistoryContext = createContext<History | undefined>(undefined);

export function HistoryProvider({
  children,
  maxLength,
}: {
  children: React.ReactNode;
  maxLength?: number;
}) {
  const value = useHistory({ maxLength });

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
