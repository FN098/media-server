import { useExplorerContext } from "@/feature/explorer/providers/explorer-provider";
import { MediaNode } from "@/lib/media/types";
import { defaultFilters } from "@/lib/menu-items/filters";
import { createRecursiveTransformer } from "@/lib/menu-items/transformer";
import { MenuItemDef } from "@/lib/menu-items/types";
import { CheckCheckIcon, FolderPlusIcon, Trash2Icon } from "lucide-react";
import { useCallback, useMemo } from "react";

interface ExplorerActionMenuContext {
  selectAll(): void;
  promptCreateFolder(): void;
  confirmDeleteNonFavorites(): void;
  canDeleteNonFavorites: boolean;
}

const actionMenuItems: MenuItemDef<ExplorerActionMenuContext>[] = [
  {
    key: "select-all",
    type: "action",
    label: "すべて選択",
    icon: CheckCheckIcon,
    onClick: (ctx) => ctx.selectAll(),
  },
  {
    key: "create-folder",
    type: "action",
    label: "新規フォルダ",
    icon: FolderPlusIcon,
    onClick: (ctx) => ctx.promptCreateFolder(),
  },
  {
    key: "delete-non-favorites",
    type: "action",
    label: "お気に入り以外一括削除",
    icon: Trash2Icon,
    variant: "destructive",
    disabled: (ctx) => !ctx.canDeleteNonFavorites,
    onClick: (ctx) => ctx.confirmDeleteNonFavorites(),
  },
];

const transformer = createRecursiveTransformer<
  MenuItemDef<ExplorerActionMenuContext>,
  ExplorerActionMenuContext
>(defaultFilters);

export function useExplorerActionMenu() {
  const {
    listing: { path: currentDirPath },
    filtering: { filteredNodes },
    selection: { selectAll },
    dialogs: { createFolderDialog, deleteDialog },
    favorites: { get: getFavorite },
  } = useExplorerContext();

  const isNonFavoriteFile = useCallback(
    (node: MediaNode) =>
      !node.isDirectory && !getFavorite(node.path).isFavorite,
    [getFavorite]
  );

  const hasNonFavoriteFiles = useMemo(() => {
    return filteredNodes.some(isNonFavoriteFile);
  }, [filteredNodes, isNonFavoriteFile]);

  const context = useMemo(() => {
    return {
      selectAll,
      promptCreateFolder: () => createFolderDialog.open(currentDirPath),
      canDeleteNonFavorites: hasNonFavoriteFiles,
      confirmDeleteNonFavorites: () => {
        const targets = filteredNodes.filter(isNonFavoriteFile);
        if (targets.length > 0) {
          deleteDialog.open(targets);
        }
      },
    } satisfies ExplorerActionMenuContext;
  }, [
    createFolderDialog,
    currentDirPath,
    deleteDialog,
    filteredNodes,
    hasNonFavoriteFiles,
    isNonFavoriteFile,
    selectAll,
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
