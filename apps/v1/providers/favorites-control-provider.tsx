"use client";

import { useFavoritesControl } from "@/hooks/favorites/use-favorites-control";
import { Favorite } from "@/lib/favorite/types";
import { createContext, useContext } from "react";

type FavoritesControl = ReturnType<typeof useFavoritesControl>;

const FavoritesControlContext = createContext<FavoritesControl | undefined>(
  undefined
);

export function FavoritesControlProvider({
  children,
  favorites,
}: {
  children: React.ReactNode;
  favorites?: Favorite[];
}) {
  const value = useFavoritesControl({ initialData: favorites });

  return (
    <FavoritesControlContext.Provider value={value}>
      {children}
    </FavoritesControlContext.Provider>
  );
}

export function useFavoritesControlContext() {
  const context = useContext(FavoritesControlContext);
  if (context === undefined) {
    throw new Error(
      "useFavoritesControlContext must be used within FavoritesControlProvider"
    );
  }
  return context;
}
