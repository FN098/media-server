"use client";

import { useFavoritesControl } from "@/hooks/favorites/use-favorites-control";
import { Favorite } from "@/lib/favorite/types";
import { createContext, useContext } from "react";

const FavoritesControlContext = createContext<
  ReturnType<typeof useFavoritesControl> | undefined
>(undefined);

export function FavoritesControlProvider({
  children,
  favorites,
}: {
  children: React.ReactNode;
  favorites?: Favorite[];
}) {
  const value = useFavoritesControl({ favorites });

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
