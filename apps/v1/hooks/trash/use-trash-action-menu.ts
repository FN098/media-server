import { TrashDialogs } from "@/hooks/trash/use-trash-dialogs";
import { MediaListing } from "@/lib/media/types";
import { defaultFilters } from "@/lib/menu-items/filters";
import { createRecursiveTransformer } from "@/lib/menu-items/transformer";
import { MenuItemDef } from "@/lib/menu-items/types";
import { useTrashContext } from "@/providers/trash-provider";
import { Trash2Icon } from "lucide-react";
import { useMemo } from "react";

interface TrashActionMenuContext {
  listing: MediaListing;
  dialogs: TrashDialogs;
}

const actionMenuItems: MenuItemDef<TrashActionMenuContext>[] = [
  {
    key: "empty-current-dir",
    type: "action",
    variant: "destructive",
    label: "このフォルダ内を完全に削除",
    icon: Trash2Icon,
    onClick: (ctx) =>
      ctx.dialogs.deleteDialog.open(ctx.listing.nodes, { isPermanent: true }),
    disabled: (ctx) => {
      return ctx.listing.nodes.length === 0;
    },
  },
];

const transformer = createRecursiveTransformer<
  MenuItemDef<TrashActionMenuContext>,
  TrashActionMenuContext
>(defaultFilters);

export function useTrashActionMenu() {
  const { listing, dialogs } = useTrashContext();

  const context = useMemo(() => {
    return {
      listing,
      dialogs,
    };
  }, [dialogs, listing]);

  const transformed = useMemo(
    () => transformer(actionMenuItems, context),
    [context]
  );

  return {
    items: transformed,
    context,
  };
}
