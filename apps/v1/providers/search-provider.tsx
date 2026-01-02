"use client";

import { useSearch } from "@/hooks/use-search";
import { createContext, useContext } from "react";

type SearchContextType = ReturnType<typeof useSearch>;

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({
  children,
  query,
}: {
  children: React.ReactNode;
  query?: string;
}) {
  const value = useSearch(query);

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
}

export function useSearchContext() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error("useSearchContext must be used within SearchProvider");
  }
  return context;
}
