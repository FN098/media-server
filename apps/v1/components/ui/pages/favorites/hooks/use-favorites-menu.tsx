import { FavoriteRatingInput } from "@/components/ui/buttons/favorite-rating-input";
import { FavoritesFavorites } from "@/components/ui/pages/favorites/hooks/use-favorites-favorites";
import { FavoritesFiltering } from "@/components/ui/pages/favorites/hooks/use-favorites-filtering";
import { FavoritesNavigation } from "@/components/ui/pages/favorites/hooks/use-favorites-navigation";
import { FavoritesSelection } from "@/components/ui/pages/favorites/hooks/use-favorites-selection";
import { Fullscreen } from "@/hooks/use-fullscreen";
import { TagEditorControl } from "@/hooks/use-tag-editor-control";
import { ViewerNavigation } from "@/hooks/use-viewer-control";
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
        key: "openFolder",
        type: "action",
        icon: FolderIcon,
        label: "フォルダを開く",
        onClick: ({ node }) => navigation.openParentFolder(node),
        hidden: () => selectedCount > 1,
      },
      {
        key: "openInNewTab",
        type: "action",
        icon: ExternalLinkIcon,
        label: "新しいタブで開く",
        onClick: ({ node }) => navigation.openInNewTab(node),
        hidden: () => selectedCount > 1,
      },
      {
        key: "toggleFullscreen",
        type: "action",
        icon: FullscreenIcon,
        label: "全画面",
        onClick: () => void fullscreen.toggle(),
        hidden: () => !viewer.isOpen || !fullscreen.isSupported,
      },
      {
        key: "editTags",
        type: "action",
        icon: TagIcon,
        label: "タグ編集",
        onClick: () => tagEditor.open(),
      },
      {
        key: "addTagFilter",
        type: "action",
        icon: ListFilterPlusIcon,
        label: "タグをフィルターに追加",
        onClick: ({ node }) => filtering.addTagFilter(node),
        disabled: ({ node }) =>
          !node.tags || node.tags.length === 0 || selectedCount > 1,
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
