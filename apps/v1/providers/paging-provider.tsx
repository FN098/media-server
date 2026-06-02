"use client";

import { usePaging } from "@/hooks/navigations/use-paging";
import { createContext, ReactNode, useContext } from "react";

type PagingContextValue = ReturnType<typeof usePaging>;

const PagingContext = createContext<PagingContextValue | undefined>(undefined);

export function PagingProvider({
  children,
  totalItems,
  defaultPageSize,
  history,
}: {
  children: ReactNode;
  totalItems: number;
  defaultPageSize?: number;
  history?: "push" | "replace";
}) {
  const value = usePaging({ totalItems, defaultPageSize, history });

  return (
    <PagingContext.Provider value={value}>{children}</PagingContext.Provider>
  );
}

export function usePagingContext() {
  const context = useContext(PagingContext);
  if (context === undefined) {
    throw new Error("usePagingContext must be used within PagingProvider");
  }
  return context;
}
