import { TrashDialogs } from "@/hooks/trash/use-trash-dialogs";
import { MediaListing } from "@/lib/media/types";
import { MenuItemDef } from "@/lib/menu-items/types";
import { Trash2Icon } from "lucide-react";

interface TrashActionMenuContext {
  listing: MediaListing;
  dialogs: TrashDialogs;
}

const menuItems: MenuItemDef<TrashActionMenuContext>[] = [
  {
    key: "empty-current-dir",
    type: "action",
    label: "このフォルダ内を完全に削除",
    icon: Trash2Icon,
    onClick: (ctx) =>
      ctx.dialogs.deleteDialog.open(ctx.listing.nodes, { isPermanent: true }),
    disabled: (ctx) => {
      return ctx.listing.nodes.length === 0;
    },
    variant: "destructive",
  },
];

export function useTrashActionMenu() {
  return { items: menuItems };
}
