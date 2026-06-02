import { useFavoritesDialogs } from "@/hooks/favorites/use-favorites-dialogs";
import { useFavoritesFavorites } from "@/hooks/favorites/use-favorites-favorites";
import { useFavoritesFiltering } from "@/hooks/favorites/use-favorites-filtering";
import { useFavoritesHotkeys } from "@/hooks/favorites/use-favorites-hotkeys";
import { useFavoritesMenu } from "@/hooks/favorites/use-favorites-menu";
import { useFavoritesNavigation } from "@/hooks/favorites/use-favorites-navigation";
import { useFavoritesSelectionBar } from "@/hooks/favorites/use-favorites-selection-bar";
import { useFavoritesThumbs } from "@/hooks/favorites/use-favorites-thumbs";
import { useFullscreen } from "@/hooks/general/use-fullscreen";
import { useFolderNavigation } from "@/hooks/navigations/use-folder-navigation";
import { useViewerNavigation } from "@/hooks/navigations/use-viewer-navigation";
import { useMediaNodeSelection } from "@/hooks/selections/use-media-node-selection";
import { useTagEditorControl } from "@/hooks/tag-editor/use-tag-editor-control";
import { useViewMode } from "@/hooks/view/use-view-mode";
import { MediaListing } from "@/lib/media/types";
import { useHistoryContext } from "@/providers/history-provider";
import { useSearchFocusContext } from "@/providers/search-focus.provider";

interface UseFavoritesProps {
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

  const tagEditor = useTagEditorControl({
    targetCount: selection.selectedCount,
  });

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

  const menu = useFavoritesMenu({
    filtering,
    selection,
    tagEditor,
    navigation,
    viewer,
    fullscreen,
    favorites,
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
