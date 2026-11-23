"use client";

import {
  UseFavoriteProps,
  useFavorite,
} from "@/feature/favorite/hooks/use-favorite";
import { createContext, useContext } from "react";

const FavoriteContext = createContext<
  ReturnType<typeof useFavorite> | undefined
>(undefined);

interface FavoriteProviderProps extends UseFavoriteProps {
  children: React.ReactNode;
}

export function FavoriteProvider({ children, ...rest }: FavoriteProviderProps) {
  const value = useFavorite(rest);

  return (
    <FavoriteContext.Provider value={value}>
      {children}
    </FavoriteContext.Provider>
  );
}

export function useFavoriteContext() {
  const context = useContext(FavoriteContext);
  if (context === undefined) {
    throw new Error("useFavoriteContext must be used within FavoriteProvider");
  }
  return context;
}
