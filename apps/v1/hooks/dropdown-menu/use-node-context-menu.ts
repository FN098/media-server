import { MediaNode } from "@/lib/media/types";
import { defaultFilters } from "@/lib/menu-items/filters";
import { createRecursiveTransformer } from "@/lib/menu-items/transformer";
import { MenuItemDef, NodeContext } from "@/lib/menu-items/types";
import { useMemo } from "react";

const transformer = createRecursiveTransformer<
  MenuItemDef<NodeContext>,
  NodeContext
>(defaultFilters);

interface UseNodeDropdownMenuProps {
  node: MediaNode;
  menuItems: MenuItemDef<NodeContext>[];
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
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
