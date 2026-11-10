import { defaultFilters } from "@/feature/menu-items/lib/filters";
import { createRecursiveTransformer } from "@/feature/menu-items/lib/transformers";
import { MenuItemDef, NodeContext } from "@/feature/menu-items/lib/types";
import { MediaNode } from "@/lib/node/types";
import { useMemo } from "react";

const transformer = createRecursiveTransformer<
  MenuItemDef<NodeContext>,
  NodeContext
>(defaultFilters);

interface UseNodeDropdownMenuProps {
  node: MediaNode;
  menuItems: MenuItemDef<NodeContext>[];
}

export function useNodeDropdownMenu({
  node,
  menuItems,
}: UseNodeDropdownMenuProps) {
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
