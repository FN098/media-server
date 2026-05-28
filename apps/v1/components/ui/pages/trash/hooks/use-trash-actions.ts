import { ExplorerDialogs } from "@/components/ui/pages/explorer/hooks/use-explorer-dialogs";
import { ExplorerFavorites } from "@/components/ui/pages/explorer/hooks/use-explorer-favorites";
import { ExplorerFiltering } from "@/components/ui/pages/explorer/hooks/use-explorer-filtering";
import { MediaListing, MediaNode } from "@/lib/media/types";
import { MenuItemDef } from "@/lib/menu-items/types";
import { FolderPlus } from "lucide-react";

interface ToolbarActionContext {
  listing: MediaListing;
  filtering: ExplorerFiltering;
  dialogs: ExplorerDialogs;
  favorites: ExplorerFavorites;
  computed: {
    hasNonFavoriteFiles: boolean;
    nonFavoriteTargets: MediaNode[];
  };
}

const toolbarActionItems: MenuItemDef<ToolbarActionContext>[] = [
  {
    key: "create-folder",
    type: "action",
    label: "新規フォルダ",
    icon: FolderPlus,
    onClick: (ctx) => ctx.dialogs.createFolderDialog.open(ctx.listing.path),
  },
];

export function useExplorerActions() {
  return { toolbarActionItems };
}
