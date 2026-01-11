"use client";

import { useFavorites } from "@/hooks/use-favorites";
import { FavoritesRecord } from "@/lib/favorite/types";
import { createContext, useContext } from "react";

type FavoritesContextType = ReturnType<typeof useFavorites>;

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined
);

export function FavoritesProvider({
  children,
  favorites,
}: {
  children: React.ReactNode;
  favorites?: FavoritesRecord;
}) {
  const value = useFavorites(favorites);

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavoritesContext() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error(
      "useFavoritesContext must be used within FavoritesProvider"
    );
  }
  return context;
}
