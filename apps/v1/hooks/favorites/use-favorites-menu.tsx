import { FavoriteRatingInput } from "@/components/ui/buttons/favorite-rating-input";
import { FavoritesFavorites } from "@/hooks/favorites/use-favorites-favorites";
import { FavoritesFiltering } from "@/hooks/favorites/use-favorites-filtering";
import { FavoritesNavigation } from "@/hooks/favorites/use-favorites-navigation";
import { Fullscreen } from "@/hooks/general/use-fullscreen";
import { ViewerNavigation } from "@/hooks/navigations/use-viewer-navigation";
import { MediaNodeSelection } from "@/hooks/selections/use-media-node-selection";
import { TagEditorControl } from "@/hooks/tag-editor/use-tag-editor-control";
import { MenuItemDef, NodeContext } from "@/lib/menu-items/types";
import {
  ExternalLinkIcon,
  FolderIcon,
  FullscreenIcon,
  ListFilterPlusIcon,
  TagIcon,
} from "lucide-react";
import { useMemo } from "react";

interface FavoritesMenuContext {
  filtering: FavoritesFiltering;
  selection: MediaNodeSelection;
  tagEditor: TagEditorControl;
  navigation: FavoritesNavigation;
  viewer: ViewerNavigation;
  fullscreen: Fullscreen;
  favorites: FavoritesFavorites;
}

function createFavoritesMenuItems({
  filtering,
  selection,
  tagEditor,
  navigation,
  viewer,
  fullscreen,
  favorites,
}: FavoritesMenuContext): MenuItemDef<NodeContext>[] {
  return [
    {
      key: "rating",
      type: "custom",
      render: ({ node, closeMenu }) => {
        const { rating } = favorites.get(node.path);
        const targets = selection.hasSelection
          ? selection.selectedNodes
          : [node];

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
      hidden: ({ node }) => node.isDirectory,
    },
    {
      key: "separator-navigation",
      type: "separator",
    },
    {
      key: "open-folder",
      type: "action",
      icon: FolderIcon,
      label: "フォルダを開く",
      onClick: ({ node }) => navigation.openParentFolder(node),
      hidden: () => selection.selectedCount > 1,
      kbd: "O",
    },
    {
      key: "open-in-new-tab",
      type: "action",
      icon: ExternalLinkIcon,
      label: "新しいタブで開く",
      onClick: ({ node }) => navigation.openInNewTab(node),
      hidden: () => selection.selectedCount > 1,
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
      kbd: "T",
    },
    {
      key: "add-tag-filter",
      type: "action",
      icon: ListFilterPlusIcon,
      label: "タグをフィルターに追加",
      onClick: ({ node }) =>
        filtering.addTagFilter(
          selection.hasSelection ? selection.selectedNodes : node
        ),
      disabled: ({ node }) =>
        !filtering.canAddTagFilter(
          selection.hasSelection ? selection.selectedNodes : node
        ),
      hidden: ({ node }) => node.isDirectory,
    },
  ];
}

export function useFavoritesMenu(context: FavoritesMenuContext) {
  const items = useMemo(() => {
    return createFavoritesMenuItems(context);
  }, [context]);

  return {
    items,
  };
}
