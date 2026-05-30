import { FavoriteRatingInput } from "@/components/ui/buttons/favorite-rating-input";
import { FavoritesFavorites } from "@/hooks/favorites/use-favorites-favorites";
import { FavoritesFiltering } from "@/hooks/favorites/use-favorites-filtering";
import { FavoritesNavigation } from "@/hooks/favorites/use-favorites-navigation";
import { FavoritesSelection } from "@/hooks/favorites/use-favorites-selection";
import { Fullscreen } from "@/hooks/general/use-fullscreen";
import { ViewerNavigation } from "@/hooks/navigations/use-viewer-navigation";
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

interface UseFavoritesMenuProps {
  filtering: FavoritesFiltering;
  selection: FavoritesSelection;
  tagEditor: TagEditorControl;
  navigation: FavoritesNavigation;
  viewer: ViewerNavigation;
  fullscreen: Fullscreen;
  favorites: FavoritesFavorites;
}

export function useFavoritesMenu({
  filtering,
  selection,
  tagEditor,
  navigation,
  viewer,
  fullscreen,
  favorites,
}: UseFavoritesMenuProps) {
  const { hasSelection, selectedCount, selectedNodes } = selection;

  const items: MenuItemDef<NodeContext>[] = useMemo(
    () => [
      {
        key: "rating",
        type: "custom",
        render: ({ node, closeMenu }) => {
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
        hidden: ({ node }) => node.isDirectory,
      },
      {
        key: "open-folder",
        type: "action",
        icon: FolderIcon,
        label: "フォルダを開く",
        onClick: ({ node }) => navigation.openParentFolder(node),
        hidden: () => selectedCount > 1,
        kbd: "O",
      },
      {
        key: "open-in-new-tab",
        type: "action",
        icon: ExternalLinkIcon,
        label: "新しいタブで開く",
        onClick: ({ node }) => navigation.openInNewTab(node),
        hidden: () => selectedCount > 1,
        kbd: "F",
      },
      {
        key: "toggle-fullscreen",
        type: "action",
        icon: FullscreenIcon,
        label: "全画面",
        onClick: () => void fullscreen.toggle(),
        hidden: () => !viewer.isOpen || !fullscreen.isSupported,
      },
      {
        key: "edit-tags",
        type: "action",
        icon: TagIcon,
        label: "タグ編集",
        onClick: () => tagEditor.open(),
        kbd: "T",
      },
      {
        key: "addTagFilter",
        type: "action",
        icon: ListFilterPlusIcon,
        label: "タグをフィルターに追加",
        onClick: ({ node }) =>
          filtering.addTagFilter(hasSelection ? selectedNodes : node),
        disabled: ({ node }) =>
          !filtering.canAddTagFilter(hasSelection ? selectedNodes : node),
        hidden: ({ node }) => node.isDirectory,
      },
    ],
    [
      favorites,
      filtering,
      fullscreen,
      hasSelection,
      navigation,
      selectedCount,
      selectedNodes,
      tagEditor,
      viewer.isOpen,
    ]
  );

  return {
    items,
  };
}
