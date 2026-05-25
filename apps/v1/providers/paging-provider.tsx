"use client";

import { usePaging } from "@/hooks/use-paging";
import { createContext, ReactNode, useContext } from "react";

type PagingContextType = ReturnType<typeof usePaging>;

const PagingContext = createContext<PagingContextType | undefined>(undefined);

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
  // フックを呼び出し
  const value = usePaging(totalItems, { defaultPageSize, history });

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
