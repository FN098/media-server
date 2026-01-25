"use client";

import { usePaging } from "@/hooks/use-paging";
import { createContext, ReactNode, useContext } from "react";

type PagingContextType = ReturnType<typeof usePaging>;

const PagingContext = createContext<PagingContextType | undefined>(undefined);

export function PagingProvider({
  children,
  totalItems,
  defaultPageSize = 48,
}: {
  children: ReactNode;
  totalItems: number;
  defaultPageSize?: number;
}) {
  // フックを呼び出し
  const value = usePaging(totalItems, defaultPageSize);

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
