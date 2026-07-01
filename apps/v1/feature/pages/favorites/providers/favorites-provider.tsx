"use client";

import {
  useFavorites,
  UseFavoritesProps,
} from "@/feature/pages/favorites/hooks/use-favorites";
import { createContext, useContext } from "react";

const FavoritesContext = createContext<
  ReturnType<typeof useFavorites> | undefined
>(undefined);

interface FavoritesProviderProps extends UseFavoritesProps {
  children: React.ReactNode;
}

export function FavoritesProvider({
  children,
  ...rest
}: FavoritesProviderProps) {
  const value = useFavorites(rest);

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
