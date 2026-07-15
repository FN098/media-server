import { useFullscreen } from "@/feature/general/hooks/use-fullscreen";
import { useHistoryContext } from "@/feature/history/providers/history-provider";
import { useFolderNavigation } from "@/feature/navigation/hooks/use-folder-navigation";
import { useFavoritesDialogs } from "@/feature/pages/favorites/hooks/use-favorites-dialogs";
import { useFavoritesFavorites } from "@/feature/pages/favorites/hooks/use-favorites-favorites";
import { useFavoritesFiltering } from "@/feature/pages/favorites/hooks/use-favorites-filtering";
import { useFavoritesHotkeys } from "@/feature/pages/favorites/hooks/use-favorites-hotkeys";
import { useFavoritesMenu } from "@/feature/pages/favorites/hooks/use-favorites-menu";
import { useFavoritesNavigation } from "@/feature/pages/favorites/hooks/use-favorites-navigation";
import { useFavoritesSelectionBar } from "@/feature/pages/favorites/hooks/use-favorites-selection-bar";
import { useFavoritesThumbs } from "@/feature/pages/favorites/hooks/use-favorites-thumbs";
import { useSearchFocusContext } from "@/feature/search/providers/search-focus-provider";
import { useMediaNodeSelection } from "@/feature/selection/hooks/use-media-node-selection";
import { useSort } from "@/feature/sort/hooks/use-sort";
import { useTagEditorContext } from "@/feature/tag-editor/providers/tag-editor-provider";
import { useViewMode } from "@/feature/view/hooks/use-view-mode";
import { useViewerNavigation } from "@/feature/viewers/media-viewer/hooks/use-viewer-navigation";
import { useSlideshowContext } from "@/feature/viewers/media-viewer/providers/slideshow-provider";
import { MediaListing } from "@/lib/media/types";

export interface UseFavoritesProps {
  listing: MediaListing;
}

export function useFavorites({ listing }: UseFavoritesProps) {
  const searchFocus = useSearchFocusContext();
  const viewMode = useViewMode();
  const filtering = useFavoritesFiltering({ listing });
  const selection = useMediaNodeSelection({
    allNodes: listing.nodes,
    activeNodes: filtering.filteredNodes,
  });
  const sort = useSort();

  const viewer = useViewerNavigation({ nodes: filtering.mediaOnly });
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
