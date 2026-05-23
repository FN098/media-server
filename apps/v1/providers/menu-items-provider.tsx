"use client";

import { MenuItemDef, NodeContext } from "@/lib/menu-items/types";
import { createContext, ReactNode, useContext } from "react";

interface MenuItemsContextType {
  items: MenuItemDef<NodeContext>[];
}

const MenuItemsContext = createContext<MenuItemsContextType | undefined>(
  undefined
);

export function MenuItemsProvider({
  children,
  items,
}: {
  children: ReactNode;
  items: MenuItemDef<NodeContext>[];
}) {
  return (
    <MenuItemsContext.Provider value={{ items }}>
      {children}
    </MenuItemsContext.Provider>
  );
}

export function useMenuItemsContext() {
  const context = useContext(MenuItemsContext);
  if (!context) {
    throw new Error(
      "useMenuItemsContext must be used within MenuItemsProvider"
    );
  }
  return context;
}
