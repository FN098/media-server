import { ExplorerDialogs } from "@/hooks/explorer/use-explorer-dialogs";
import { ExplorerFavorites } from "@/hooks/explorer/use-explorer-favorites";
import { ExplorerFiltering } from "@/hooks/explorer/use-explorer-filtering";
import { MediaNodeSelection } from "@/hooks/selections/use-media-node-selection";
import { MediaListing, MediaNode } from "@/lib/media/types";
import { defaultFilters } from "@/lib/menu-items/filters";
import { createRecursiveTransformer } from "@/lib/menu-items/transformer";
import { MenuItemDef } from "@/lib/menu-items/types";
import { useExplorerContext } from "@/providers/explorer-provider";
import { useIsMobile } from "@/shadcn/hooks/use-mobile";
import { CheckCheckIcon, FolderPlusIcon, Trash2Icon } from "lucide-react";
import { useMemo } from "react";

interface ExplorerActionMenuContext {
  listing: MediaListing;
  filtering: ExplorerFiltering;
  dialogs: ExplorerDialogs;
  favorites: ExplorerFavorites;
  selection: MediaNodeSelection;
  isMobile: boolean;
  nonFavoriteFiles: MediaNode[];
}

const actionMenuItems: MenuItemDef<ExplorerActionMenuContext>[] = [
  {
    key: "check-all",
    type: "action",
    label: "すべて選択",
    icon: CheckCheckIcon,
    onClick: (ctx) => ctx.selection.selectAll(),
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
    disabled: (ctx) => ctx.nonFavoriteFiles.length === 0,
    onClick: (ctx) => {
      const targets = ctx.nonFavoriteFiles;
      if (targets.length > 0) {
        ctx.dialogs.deleteDialog.open(targets);
      }
    },
  },
];

const transformer = createRecursiveTransformer<
  MenuItemDef<ExplorerActionMenuContext>,
  ExplorerActionMenuContext
>(defaultFilters);

export function useExplorerActionMenu() {
  const { listing, filtering, selection, dialogs, favorites } =
    useExplorerContext();

  const isMobile = useIsMobile();

  const nonFavoriteFiles = useMemo(() => {
    return filtering.filteredNodes.filter(
      (node) => !node.isDirectory && !favorites.get(node.path).isFavorite
    );
  }, [filtering, favorites]);

  const context = useMemo(() => {
    return {
      listing,
      filtering,
      dialogs,
      favorites,
      selection,
      isMobile,
      nonFavoriteFiles,
    } satisfies ExplorerActionMenuContext;
  }, [
    dialogs,
    favorites,
    filtering,
    isMobile,
    listing,
    nonFavoriteFiles,
    selection,
  ]);

  const transformed = useMemo(
    () => transformer(actionMenuItems, context),
    [context]
  );

  return {
    items: transformed,
    context,
  };
}
