"use client";

import { usePaging } from "@/hooks/navigations/use-paging";
import { createContext, ReactNode, useContext } from "react";

const PagingContext = createContext<ReturnType<typeof usePaging> | undefined>(
  undefined
);

export function PagingProvider({
  children,
  totalCount,
  defaultPageSize,
  history,
}: {
  children: ReactNode;
  totalCount: number;
  defaultPageSize?: number;
  history?: "push" | "replace";
}) {
  const value = usePaging({ totalCount, defaultPageSize, history });

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
