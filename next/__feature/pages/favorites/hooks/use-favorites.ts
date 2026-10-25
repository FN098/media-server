import { useFullscreen } from "@/__feature/general/hooks/use-fullscreen";
import { useFolderNavigation } from "@/__feature/navigation/hooks/use-folder-navigation";
import { useFavoritesDialogs } from "@/__feature/pages/favorites/hooks/use-favorites-dialogs";
import { useFavoritesFavorites } from "@/__feature/pages/favorites/hooks/use-favorites-favorites";
import { useFavoritesFiltering } from "@/__feature/pages/favorites/hooks/use-favorites-filtering";
import { useFavoritesHotkeys } from "@/__feature/pages/favorites/hooks/use-favorites-hotkeys";
import { useFavoritesMenu } from "@/__feature/pages/favorites/hooks/use-favorites-menu";
import { useFavoritesNavigation } from "@/__feature/pages/favorites/hooks/use-favorites-navigation";
import { useFavoritesSelectionBar } from "@/__feature/pages/favorites/hooks/use-favorites-selection-bar";
import { useFavoritesThumbs } from "@/__feature/pages/favorites/hooks/use-favorites-thumbs";
import { useNodeSelectionControl } from "@/__feature/selection/hooks/use-node-selection-control";
import { useSort } from "@/__feature/sort/hooks/use-sort";
import { useViewMode } from "@/__feature/view/hooks/use-view-mode";
import { useSlideshowContext } from "@/__feature/viewers/media-viewer/providers/slideshow-provider";
import { useHistoryContext } from "@/feature/history/providers/history-provider";
import { useSearchFocusContext } from "@/feature/search/providers/search-focus-provider";
import { useTagEditorContext } from "@/feature/tag-editor/_providers/tag-editor-provider";
import { useViewer } from "@/feature/viewer/hooks/use-viewer";
import { MediaListing } from "@/lib/node/types";

export interface UseFavoritesProps {
  listing: MediaListing;
}

export function useFavorites({ listing }: UseFavoritesProps) {
  const searchFocus = useSearchFocusContext();
  const viewMode = useViewMode();
  const filtering = useFavoritesFiltering({ listing });
  const selection = useNodeSelectionControl({
    allNodes: listing.nodes,
    activeNodes: filtering.filteredNodes,
  });
  const sort = useSort();

  const viewer = useViewer({ nodes: filtering.mediaOnly });
  const folder = useFolderNavigation({});
  const history = useHistoryContext();
  const navigation = useFavoritesNavigation({
    filtering,
    selection,
    viewer,
    history,
    folder,
  });

  const favorites = useFavoritesFavorites();

  const tagEditor = useTagEditorContext();

  const dialogs = useFavoritesDialogs({ filtering });
  const thumbs = useFavoritesThumbs();
  const fullscreen = useFullscreen();

  useFavoritesHotkeys({
    enabled: true,
    filtering,
    selection,
    dialogs,
    tagEditor,
    viewer,
    fullscreen,
    searchFocus,
  });

  const slideshow = useSlideshowContext();

  const menu = useFavoritesMenu({
    filtering,
    selection,
    tagEditor,
    navigation,
    viewer,
    fullscreen,
    favorites,
    slideshow,
  });

  const selectionbar = useFavoritesSelectionBar({
    selection,
    tagEditor,
    favorites,
  });

  return {
    listing,
    searchFocus,
    viewMode,
    filtering,
    selection,
    sort,
    dialogs,
    viewer,
    folder,
    history,
    favorites,
    navigation,
    tagEditor,
    thumbs,
    fullscreen,
    menu,
    selectionbar,
  };
}
