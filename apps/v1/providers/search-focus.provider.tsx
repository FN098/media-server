"use client";

import { useSearchFocus } from "@/hooks/search/use-search-focus";
import { createContext, useContext } from "react";

const SearchFocusContext = createContext<
  ReturnType<typeof useSearchFocus> | undefined
>(undefined);

export function SearchFocusProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = useSearchFocus();

  return (
    <SearchFocusContext.Provider value={value}>
      {children}
    </SearchFocusContext.Provider>
  );
}

export function useSearchFocusContext() {
  const context = useContext(SearchFocusContext);
  if (context === undefined) {
    throw new Error(
      "useSearchFocusContext must be used within SearchFocusProvider"
    );
  }
  return context;
}
