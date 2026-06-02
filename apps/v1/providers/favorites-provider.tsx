"use client";

import { useFavorites } from "@/hooks/favorites/use-favorites";
import { MediaListing } from "@/lib/media/types";
import { createContext, useContext } from "react";

type Favorites = ReturnType<typeof useFavorites>;

const FavoritesContext = createContext<Favorites | undefined>(undefined);

export function FavoritesProvider({
  children,
  listing,
}: {
  children: React.ReactNode;
  listing: MediaListing;
}) {
  const value = useFavorites({ listing });

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
