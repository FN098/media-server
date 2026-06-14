"use client";

import { usePaging, UsePagingProps } from "@/feature/view/hooks/use-paging";
import { createContext, ReactNode, useContext } from "react";

const PagingContext = createContext<ReturnType<typeof usePaging> | undefined>(
  undefined
);

interface PagingProviderProps extends UsePagingProps {
  children: ReactNode;
}

export function PagingProvider({ children, ...rest }: PagingProviderProps) {
  const value = usePaging(rest);

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
