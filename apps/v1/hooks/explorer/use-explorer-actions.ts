import { ExplorerDialogs } from "@/hooks/explorer/use-explorer-dialogs";
import { ExplorerFavorites } from "@/hooks/explorer/use-explorer-favorites";
import { ExplorerFiltering } from "@/hooks/explorer/use-explorer-filtering";
import { MediaNodeSelection } from "@/hooks/selections/use-media-node-selection";
import { MediaListing, MediaNode } from "@/lib/media/types";
import { MenuItemDef } from "@/lib/menu-items/types";
import { CheckCheckIcon, FolderPlusIcon, Trash2Icon } from "lucide-react";

interface ExplorerToolbarActionContext {
  listing: MediaListing;
  filtering: ExplorerFiltering;
  dialogs: ExplorerDialogs;
  favorites: ExplorerFavorites;
  selection: MediaNodeSelection;
  computed: {
    hasNonFavoriteFiles: boolean;
    nonFavoriteTargets: MediaNode[];
    isMobile: boolean;
  };
}

const toolbarActionItems: MenuItemDef<ExplorerToolbarActionContext>[] = [
  {
    key: "check-all",
    type: "action",
    label: "すべて選択",
    icon: CheckCheckIcon,
    onClick: (ctx) => ctx.selection.selectAll(),
    // hidden: (ctx) => !ctx.computed.isMobile,
  },
  {
    key: "create-folder",
    type: "action",
    label: "新規フォルダ",
    icon: FolderPlusIcon,
    onClick: (ctx) => ctx.dialogs.createFolderDialog.open(ctx.listing.path),
  },
  {
    key: "delete-non-favorites",
    type: "action",
    label: "お気に入り以外一括削除",
    icon: Trash2Icon,
    variant: "destructive",
    disabled: (ctx) => !ctx.computed.hasNonFavoriteFiles,
    onClick: (ctx) => {
      const targets = ctx.computed.nonFavoriteTargets;
      if (targets.length > 0) {
        ctx.dialogs.deleteDialog.open(targets);
      }
    },
  },
];

export function useExplorerActions() {
  return { toolbarActionItems };
}
