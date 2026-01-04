"use client";

import { useShortcutKeys } from "@/hooks/use-shortcut-keys";
import { KeyAction } from "@/lib/shortcut/types";
import { createContext, useContext } from "react";

type ShortcutContextType = ReturnType<typeof useShortcutKeys>;

const ShortcutContext = createContext<ShortcutContextType | undefined>(
  undefined
);

/** @deprecated 使用されていない */
export function ShortcutProvider({
  children,
  actions,
}: {
  children: React.ReactNode;
  actions?: KeyAction[];
}) {
  const value = useShortcutKeys(actions ?? []);

  return (
    <ShortcutContext.Provider value={value}>
      {children}
    </ShortcutContext.Provider>
  );
}

export function useShortcutContext() {
  const context = useContext(ShortcutContext);
  if (!context) {
    throw new Error("useShortcutContext must be used within ShortcutProvider");
  }
  return context;
}
