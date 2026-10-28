import { GroupMenuItem, MenuItemDef } from "@/feature/menu-items/lib/types";

export function isGroupMenuItem<TContext>(
  item: MenuItemDef<TContext>
): item is GroupMenuItem<TContext> {
  return item.type === "group";
}
