import { ExplorerDialogs } from "@/components/ui/pages/explorer/hooks/use-explorer-dialogs";
import { ExplorerFavorites } from "@/components/ui/pages/explorer/hooks/use-explorer-favorites";
import { ExplorerFiltering } from "@/components/ui/pages/explorer/hooks/use-explorer-filtering";
import { MediaListing } from "@/lib/media/types";
import { MenuItemDef } from "@/lib/menu-items/types";
import { FolderPlus, TrashIcon } from "lucide-react";

export interface ToolbarActionContext {
  listing: MediaListing;
  filtering: ExplorerFiltering;
  dialogs: ExplorerDialogs;
  favorites: ExplorerFavorites;
}

const toolbarActionItems: MenuItemDef<ToolbarActionContext>[] = [
  {
    key: "create-folder",
    type: "action",
    label: "新規フォルダ",
    icon: FolderPlus,
    onClick: (ctx) => ctx.dialogs.createFolderDialog.open(ctx.listing.path),
  },
  {
    key: "delete-non-favorites",
    type: "action",
    label: "お気に入り以外一括削除",
    icon: TrashIcon,
    variant: "destructive",
    disabled: (ctx) =>
      !ctx.filtering.filteredNodes.some(
        (node) => !node.isDirectory && !ctx.favorites.get(node.path).isFavorite
      ),
    onClick: (ctx) => {
      const targets = ctx.filtering.filteredNodes.filter(
        (node) => !node.isDirectory && !ctx.favorites.get(node.path).isFavorite
      );
      if (targets.length > 0) {
        ctx.dialogs.deleteDialog.open(targets);
      }
    },
  },
];

export function useExplorerActions() {
  return {
    toolbarActionItems,
  };
}
