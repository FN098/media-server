import { TrashDialogs } from "@/hooks/trash/use-trash-dialogs";
import { MediaListing } from "@/lib/media/types";
import { MenuItemDef } from "@/lib/menu-items/types";
import { Trash2Icon } from "lucide-react";

interface TrashToolbarActionContext {
  listing: MediaListing;
  dialogs: TrashDialogs;
}

const toolbarActionItems: MenuItemDef<TrashToolbarActionContext>[] = [
  {
    key: "empty-current-dir",
    type: "action",
    label: "このフォルダ内を完全に削除",
    icon: Trash2Icon,
    onClick: (ctx) => ctx.dialogs.deleteDialog.open(ctx.listing.nodes),
    disabled: (ctx) => {
      return ctx.listing.nodes.length === 0;
    },
    variant: "destructive",
  },
];

export function useTrashActions() {
  return { toolbarActionItems };
}
