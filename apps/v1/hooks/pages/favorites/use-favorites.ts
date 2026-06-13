import { useFullscreen } from "@/hooks/general/use-fullscreen";
import { useFolderNavigation } from "@/hooks/navigation/use-folder-navigation";
import { useViewerNavigation } from "@/hooks/navigation/use-viewer-navigation";
import { useFavoritesDialogs } from "@/hooks/pages/favorites/use-favorites-dialogs";
import { useFavoritesFavorites } from "@/hooks/pages/favorites/use-favorites-favorites";
import { useFavoritesFiltering } from "@/hooks/pages/favorites/use-favorites-filtering";
import { useFavoritesHotkeys } from "@/hooks/pages/favorites/use-favorites-hotkeys";
import { useFavoritesMenu } from "@/hooks/pages/favorites/use-favorites-menu";
import { useFavoritesNavigation } from "@/hooks/pages/favorites/use-favorites-navigation";
import { useFavoritesSelectionBar } from "@/hooks/pages/favorites/use-favorites-selection-bar";
import { useFavoritesThumbs } from "@/hooks/pages/favorites/use-favorites-thumbs";
import { useMediaNodeSelection } from "@/hooks/selections/use-media-node-selection";
import { useSort } from "@/hooks/sort/use-sort";
import { useViewMode } from "@/hooks/view/use-view-mode";
import { MediaListing } from "@/lib/media/types";
import { useHistoryContext } from "@/providers/history-provider";
import { useSearchFocusContext } from "@/providers/search-focus-provider";
import { useSlideshowContext } from "@/providers/slideshow-provider";
import { useTagEditorContext } from "@/providers/tag-editor-provider";

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
