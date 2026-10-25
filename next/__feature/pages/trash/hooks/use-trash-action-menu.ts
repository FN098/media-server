import { useTrashContext } from "@/__feature/pages/trash/providers/trash-provider";
import { defaultFilters } from "@/__lib/menu-items/filters";
import { createRecursiveTransformer } from "@/__lib/menu-items/transformer";
import { MenuItemDef } from "@/__lib/menu-items/types";
import { Trash2Icon } from "lucide-react";
import { useMemo } from "react";

interface TrashActionMenuContext {
  emptyCurrentDir(): void;
  canEmptyCurrentDir: boolean;
}

const actionMenuItems: MenuItemDef<TrashActionMenuContext>[] = [
  {
    key: "empty-current-dir",
    type: "action",
    variant: "destructive",
    label: "このフォルダ内を完全に削除",
    icon: Trash2Icon,
    onClick: (ctx) => ctx.emptyCurrentDir(),
    disabled: (ctx) => !ctx.canEmptyCurrentDir,
  },
];

const transformer = createRecursiveTransformer<
  MenuItemDef<TrashActionMenuContext>,
  TrashActionMenuContext
>(defaultFilters);

export function useTrashActionMenu() {
  const {
    listing: { nodes: currentNodes },
    dialogs: { deleteDialog },
  } = useTrashContext();

  const context = useMemo(() => {
    return {
      emptyCurrentDir: () =>
        deleteDialog.open(currentNodes, { isPermanent: true }),
      canEmptyCurrentDir: currentNodes.length > 0,
    } satisfies TrashActionMenuContext;
  }, [currentNodes, deleteDialog]);

  const transformed = useMemo(
    () => transformer(actionMenuItems, context),
    [context]
  );

  return {
    items: transformed,
    context,
  };
}
