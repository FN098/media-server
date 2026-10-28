"use client";

import {
  UseNodeFavoriteProps,
  useNodeFavorite,
} from "@/__feature/favorite/hooks/use-node-favorite";
import { createContext, useContext } from "react";

const NodeFavoriteContext = createContext<
  ReturnType<typeof useNodeFavorite> | undefined
>(undefined);

interface NodeFavoriteProviderProps extends UseNodeFavoriteProps {
  children: React.ReactNode;
}

export function NodeFavoriteProvider({
  children,
  ...rest
}: NodeFavoriteProviderProps) {
  const value = useNodeFavorite(rest);

  return (
    <NodeFavoriteContext.Provider value={value}>
      {children}
    </NodeFavoriteContext.Provider>
  );
}

export function useNodeFavoriteContext() {
  const context = useContext(NodeFavoriteContext);
  if (context === undefined) {
    throw new Error(
      "useNodeFavoriteContext must be used within NodeFavoriteProvider"
    );
  }
  return context;
}
