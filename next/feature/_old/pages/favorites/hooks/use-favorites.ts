import { useFullscreen } from "@/feature/_old/general/hooks/use-fullscreen";
import { useFavoritesDialogs } from "@/feature/_old/pages/favorites/hooks/use-favorites-dialogs";
import { useFavoritesFavorites } from "@/feature/_old/pages/favorites/hooks/use-favorites-favorites";
import { useFavoritesFiltering } from "@/feature/_old/pages/favorites/hooks/use-favorites-filtering";
import { useFavoritesHotkeys } from "@/feature/_old/pages/favorites/hooks/use-favorites-hotkeys";
import { useFavoritesMenu } from "@/feature/_old/pages/favorites/hooks/use-favorites-menu";
import { useFavoritesNavigation } from "@/feature/_old/pages/favorites/hooks/use-favorites-navigation";
import { useFavoritesSelectionBar } from "@/feature/_old/pages/favorites/hooks/use-favorites-selection-bar";
import { useFavoritesThumbs } from "@/feature/_old/pages/favorites/hooks/use-favorites-thumbs";
import { useSort } from "@/feature/_old/sort/hooks/use-sort";
import { useViewMode } from "@/feature/_old/view/hooks/use-view-mode";
import { useSlideshowContext } from "@/feature/_old/viewers/media-viewer/providers/slideshow-provider";
import { useFolderNavigation } from "@/feature/folder-navigation/hooks/use-folder-navigation";
import { useHistoryContext } from "@/feature/history/providers/history-provider";
import { useSearchFocusContext } from "@/feature/search/providers/search-focus-provider";
import { useNodeSelection } from "@/feature/selection/hooks/use-node-selection";
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
  const selection = useNodeSelection({
    allNodes: listing.nodes,
    activeNodes: filtering.filteredNodes,
  });
  const sort = useSort();

  const viewer = useViewer({ mediaNodes: filtering.mediaOnly });
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
