"use client";

import {
  UseFavoriteControlProps,
  useFavoritesControl,
} from "@/feature/favorite/hooks/use-favorites-control";
import { createContext, useContext } from "react";

const FavoritesControlContext = createContext<
  ReturnType<typeof useFavoritesControl> | undefined
>(undefined);

interface FavoritesControlProvider extends UseFavoriteControlProps {
  children: React.ReactNode;
}

export function FavoritesControlProvider({
  children,
  ...rest
}: FavoritesControlProvider) {
  const value = useFavoritesControl(rest);

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
