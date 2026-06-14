"use client";

import { useTrash, UseTrashProps } from "@/feature/page/trash/hooks/use-trash";
import { createContext, useContext } from "react";

const TrashContext = createContext<ReturnType<typeof useTrash> | undefined>(
  undefined
);

interface TrashProviderProps extends UseTrashProps {
  children: React.ReactNode;
}

export function TrashProvider({ children, ...rest }: TrashProviderProps) {
  const value = useTrash(rest);

  return (
    <TrashContext.Provider value={value}>{children}</TrashContext.Provider>
  );
}

export function useTrashContext() {
  const context = useContext(TrashContext);
  if (context === undefined) {
    throw new Error("useTrashContext must be used within TrashProvider");
  }
  return context;
}
