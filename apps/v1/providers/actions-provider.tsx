"use client";

import { Actions, useActions } from "@/hooks/use-actions";
import { createContext, ReactNode, useContext } from "react";

type ActionsContextType = ReturnType<typeof useActions>;

const ActionsContext = createContext<ActionsContextType | undefined>(undefined);

export function ActionsProvider({
  children,
  actions,
}: {
  children: ReactNode;
  actions: Actions;
}) {
  const value = useActions(actions);

  return (
    <ActionsContext.Provider value={value}>{children}</ActionsContext.Provider>
  );
}

export function useActionsContext() {
  const context = useContext(ActionsContext);
  if (context === undefined) {
    throw new Error("useActionContext must be used within ActionsProvider");
  }
  return context;
}
