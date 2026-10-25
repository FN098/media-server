import { GroupMenuItem, MenuItemDef } from "@/__lib/menu-items/types";

export function isGroupMenuItem<TContext>(
  item: MenuItemDef<TContext>
): item is GroupMenuItem<TContext> {
  return item.type === "group";
}
