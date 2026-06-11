import { MediaNode } from "@/lib/media/types";
import { defaultFilters } from "@/lib/menu-items/filters";
import { createRecursiveTransformer } from "@/lib/menu-items/transformer";
import { MenuItemDef, NodeContext } from "@/lib/menu-items/types";
import { useMemo } from "react";

const transformer = createRecursiveTransformer<
  MenuItemDef<NodeContext>,
  NodeContext
>(defaultFilters);

interface UseNodeContextMenuProps {
  node: MediaNode;
  menuItems: MenuItemDef<NodeContext>[];
}

export function useNodeContextMenu({
  node,
  menuItems,
}: UseNodeContextMenuProps) {
  const context = useMemo(() => ({ node }), [node]);

  const items = useMemo(
    () => transformer(menuItems, context),
    [context, menuItems]
  );

  return {
    context,
    items,
  };
}
