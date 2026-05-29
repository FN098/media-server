import { FavoriteRatingInput } from "@/components/ui/buttons/favorite-rating-input";
import { ExplorerDialogs } from "@/components/ui/pages/explorer/hooks/use-explorer-dialogs";
import { ExplorerFavorites } from "@/components/ui/pages/explorer/hooks/use-explorer-favorites";
import { ExplorerFiltering } from "@/components/ui/pages/explorer/hooks/use-explorer-filtering";
import { ExplorerNavigation } from "@/components/ui/pages/explorer/hooks/use-explorer-navigation";
import { ExplorerSelection } from "@/components/ui/pages/explorer/hooks/use-explorer-selection";
import { ExplorerThumbs } from "@/components/ui/pages/explorer/hooks/use-explorer-thumbs";
import { Fullscreen } from "@/hooks/use-fullscreen";
import { TagEditorControl } from "@/hooks/use-tag-editor-control";
import { ViewerNavigation } from "@/hooks/use-viewer-control";
import { isArchiveFile } from "@/lib/archive/validators";
import { MediaListing } from "@/lib/media/types";
import { MenuItemDef, NodeContext } from "@/lib/menu-items/types";
import {
  CopyIcon,
  ExternalLinkIcon,
  FolderInputIcon,
  FullscreenIcon,
  ImagePlusIcon,
  ListFilterPlusIcon,
  MoveLeftIcon,
  MoveRightIcon,
  PackageOpenIcon,
  PencilIcon,
  RefreshCwIcon,
  TagIcon,
  Trash2Icon,
} from "lucide-react";
import { useMemo } from "react";

interface UseExplorerMenuProps {
  listing: MediaListing;
  filtering: ExplorerFiltering;
  selection: ExplorerSelection;
  dialogs: ExplorerDialogs;
  tagEditor: TagEditorControl;
  navigation: ExplorerNavigation;
  viewer: ViewerNavigation;
  fullscreen: Fullscreen;
  favorites: ExplorerFavorites;
  thumbs: ExplorerThumbs;
}

export function useExplorerMenu({
  listing,
  filtering,
  selection,
  dialogs,
  tagEditor,
  navigation,
  viewer,
  fullscreen,
  favorites,
  thumbs,
}: UseExplorerMenuProps) {
  const { hasSelection, selectedCount, selectedNodes } = selection;

  const {
    copyDialog,
    deleteDialog,
    extractDialog,
    moveDialog,
    previewDialog,
    renameDialog,
  } = dialogs;

  // TODO: context
  const items = useMemo<MenuItemDef<NodeContext>[]>(
    () => [
      {
        key: "rating",
        type: "custom",
        render: ({ node, closeMenu }) => {
          if (node.isDirectory) return null;

          const { rating } = favorites.get(node.path);
          const targets = hasSelection ? selectedNodes : [node];

          return (
            <div className="w-full flex justify-center">
              <FavoriteRatingInput
                value={rating}
                onChange={(newRating) =>
                  favorites.update({ targets, newRating, onSuccess: closeMenu })
                }
              />
            </div>
          );
        },
      },
      {
        key: "separator-navigation",
        type: "separator",
      },
      {
        key: "open-in-new-tab",
        type: "action",
        icon: ExternalLinkIcon,
        label: "新しいタブで開く",
        onClick: ({ node }) => navigation.openInNewTab(node),
        hidden: () => selectedCount > 1,
      },
      {
        key: "goto-next-folder",
        type: "action",
        icon: MoveRightIcon,
        label: "次のフォルダを開く",
        onClick: () => navigation.openNextFolder("first"),
        hidden: () => !viewer.isOpen,
        kbd: ["Ctrl", "Right"],
      },
      {
        key: "goto-prev-folder",
        type: "action",
        icon: MoveLeftIcon,
        label: "前のフォルダを開く",
        onClick: () => navigation.openPrevFolder("first"),
        hidden: () => !viewer.isOpen,
        kbd: ["Ctrl", "Left"],
      },
      {
        key: "toggle-fullscreen",
        type: "action",
        icon: FullscreenIcon,
        label: "全画面",
        onClick: () => void fullscreen.toggle(),
        hidden: () => !viewer.isOpen || !fullscreen.isSupported,
        kbd: "F",
      },
      {
        key: "separator-file-action",
        type: "separator",
      },
      {
        key: "extract-archive",
        type: "action",
        icon: PackageOpenIcon,
        label: "解凍",
        onClick: ({ node }) =>
          extractDialog.open(hasSelection ? selectedNodes : [node]),
        hidden: ({ node }) => !isArchiveFile(node.path),
      },
      {
        key: "rename",
        type: "action",
        icon: PencilIcon,
        label: "名前の変更",
        onClick: ({ node }) => renameDialog.open(node),
        hidden: () => selectedCount > 1,
        kbd: "F2",
      },
      {
        key: "move",
        type: "action",
        icon: FolderInputIcon,
        label: "移動",
        onClick: ({ node }) =>
          moveDialog.open(hasSelection ? selectedNodes : [node], listing.path),
      },
      {
        key: "copy",
        type: "action",
        icon: CopyIcon,
        label: "コピー",
        onClick: ({ node }) =>
          copyDialog.open(hasSelection ? selectedNodes : [node], listing.path),
      },
      {
        key: "separator-tag-action",
        type: "separator",
      },
      {
        key: "edit-tags",
        type: "action",
        icon: TagIcon,
        label: "タグ編集",
        onClick: () => tagEditor.open(),
        hidden: ({ node }) => node.isDirectory,
      },
      {
        key: "add-tag-filter",
        type: "action",
        icon: ListFilterPlusIcon,
        label: "タグをフィルターに追加",
        onClick: ({ node }) =>
          filtering.addTagFilter(hasSelection ? selectedNodes : node),
        disabled: ({ node }) =>
          !filtering.canAddTagFilter(hasSelection ? selectedNodes : node),
        hidden: ({ node }) => node.isDirectory,
      },
      {
        key: "separator-etc",
        type: "separator",
      },
      {
        key: "set-as-preview",
        type: "action",
        icon: ImagePlusIcon,
        label: "プレビューに設定",
        onClick: ({ node }) => previewDialog.open(node.path),
        hidden: ({ node }) =>
          (node.type !== "image" && node.type !== "video") || selectedCount > 1,
      },
      {
        key: "update-thumb",
        type: "action",
        icon: RefreshCwIcon,
        label: "サムネイルを更新",
        onClick: ({ node }) =>
          hasSelection
            ? void thumbs.updateParallel(selectedNodes)
            : void thumbs.update(node),
        hidden: () => viewer.isOpen,
      },
      {
        key: "separator-delete",
        type: "separator",
      },
      {
        key: "delete",
        type: "action",
        icon: Trash2Icon,
        variant: "destructive",
        label: "削除",
        onClick: ({ node }) =>
          deleteDialog.open(hasSelection ? selectedNodes : [node]),
        kbd: "Del",
      },
    ],
    [
      favorites,
      hasSelection,
      navigation,
      selectedCount,
      fullscreen,
      viewer.isOpen,
      extractDialog,
      selectedNodes,
      renameDialog,
      moveDialog,
      listing.path,
      copyDialog,
      tagEditor,
      filtering,
      previewDialog,
      thumbs,
      deleteDialog,
    ]
  );

  return {
    items,
  };
}
