import { ExplorerDialogs } from "@/feature/explorer/hooks/use-explorer-dialogs";
import { ExplorerFavorites } from "@/feature/explorer/hooks/use-explorer-favorites";
import { ExplorerThumbs } from "@/feature/explorer/hooks/use-explorer-thumbs";
import { FavoriteRatingInput } from "@/feature/favorite/ui/favorite-rating-input";
import { MediaNodeSelection } from "@/feature/selection/hooks/use-media-node-selection";
import { TagEditor } from "@/feature/tag-editor/hooks/use-tag-editor";
import { hasMedia } from "@/lib/media/detectors";
import { MediaListing } from "@/lib/media/types";
import { MenuItemDef, MultipleNodesContext } from "@/lib/menu-items/types";
import { averageBy } from "@/lib/utils/math";
import {
  CopyIcon,
  FolderInputIcon,
  RefreshCwIcon,
  StarIcon,
  StarOffIcon,
  TagIcon,
  Trash2Icon,
} from "lucide-react";
import { useMemo } from "react";

interface ExplorerSelectionBarMenuContext {
  listing: MediaListing;
  selectedNodes: MediaNodeSelection["selectedNodes"];
  hasSelection: boolean;
  isMediaSelected: boolean;
  tagEditor: TagEditor;
  favorites: ExplorerFavorites;
  thumbs: ExplorerThumbs;
  favoriteDialog: ExplorerDialogs["favoriteDialog"];
  deleteDialog: ExplorerDialogs["deleteDialog"];
  copyDialog: ExplorerDialogs["copyDialog"];
  moveDialog: ExplorerDialogs["moveDialog"];
}

function createExplorerSelectionBarMenu({
  listing,
  selectedNodes,
  hasSelection,
  isMediaSelected,
  tagEditor,
  favorites,
  thumbs,
  favoriteDialog,
  deleteDialog,
  copyDialog,
  moveDialog,
}: ExplorerSelectionBarMenuContext) {
  const inlineItems: MenuItemDef<MultipleNodesContext>[] = [
    {
      key: "editTags",
      type: "action",
      icon: TagIcon,
      label: "タグ編集",
      onClick: tagEditor.open,
    },
  ];

  const items = [
    {
      key: "rating",
      type: "custom",
      render: ({ nodes, closeMenu }) => {
        const filtered = nodes.filter((n) => n.rating != null);
        const averageRating = averageBy(filtered, (n) => n.rating!);

        return (
          <div className="w-full flex justify-center p-2">
            <FavoriteRatingInput
              value={averageRating}
              onChange={(newRating) =>
                void favorites.update({
                  targets: nodes,
                  newRating,
                  onSuccess: closeMenu,
                })
              }
              disabled={!isMediaSelected}
            />
          </div>
        );
      },
    },
    {
      key: "separator-favorite-action",
      type: "separator",
    },
    {
      key: "add-favorites",
      type: "action",
      icon: StarIcon,
      label: "お気に入り登録",
      onClick: () => favoriteDialog.open(selectedNodes, "add"),
      disabled: () => !isMediaSelected,
    },
    {
      key: "remove-favorites",
      type: "action",
      icon: StarOffIcon,
      label: "お気に入り解除",
      onClick: () => favoriteDialog.open(selectedNodes, "remove"),
      disabled: () => !isMediaSelected,
    },
    {
      key: "separator-fs-operation",
      type: "separator",
    },
    {
      key: "move",
      type: "action",
      icon: FolderInputIcon,
      label: "移動",
      onClick: () => moveDialog.open(selectedNodes, listing.path),
      disabled: () => !hasSelection,
    },
    {
      key: "copy",
      type: "action",
      icon: CopyIcon,
      label: "コピー",
      onClick: () => copyDialog.open(selectedNodes, listing.path),
      disabled: () => !hasSelection,
    },
    {
      key: "update-thumb",
      type: "action",
      icon: RefreshCwIcon,
      label: "サムネイル更新",
      onClick: () => void thumbs.updateParallel(selectedNodes),
      disabled: () => !hasSelection,
    },
    {
      key: "separator-delete",
      type: "separator",
    },
    {
      key: "delete",
      type: "action",
      variant: "destructive",
      icon: Trash2Icon,
      label: "削除",
      onClick: () => deleteDialog.open(selectedNodes),
      disabled: () => !hasSelection,
    },
  ] satisfies MenuItemDef<MultipleNodesContext>[];

  return {
    items,
    inlineItems,
  };
}

interface UseExplorerSelectionBarProps {
  listing: MediaListing;
  selection: MediaNodeSelection;
  dialogs: ExplorerDialogs;
  tagEditor: TagEditor;
  favorites: ExplorerFavorites;
  thumbs: ExplorerThumbs;
}

export function useExplorerSelectionBar({
  listing,
  selection,
  dialogs,
  tagEditor,
  favorites,
  thumbs,
}: UseExplorerSelectionBarProps) {
  const { hasSelection, selectedNodes } = selection;
  const { favoriteDialog, deleteDialog, copyDialog, moveDialog } = dialogs;

  const isMediaSelected = useMemo(
    () => hasMedia(selectedNodes),
    [selectedNodes]
  );

  const menu = useMemo(
    () =>
      createExplorerSelectionBarMenu({
        listing,
        selectedNodes,
        hasSelection,
        isMediaSelected,
        tagEditor,
        favorites,
        thumbs,
        favoriteDialog,
        deleteDialog,
        copyDialog,
        moveDialog,
      }),
    [
      copyDialog,
      deleteDialog,
      favoriteDialog,
      favorites,
      hasSelection,
      isMediaSelected,
      listing,
      moveDialog,
      selectedNodes,
      tagEditor,
      thumbs,
    ]
  );

  return {
    menu,
  };
}
