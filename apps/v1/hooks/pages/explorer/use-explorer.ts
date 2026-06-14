import { useFullscreen } from "@/hooks/general/use-fullscreen";
import { useFolderNavigation } from "@/hooks/navigation/use-folder-navigation";
import { useViewerNavigation } from "@/hooks/navigation/use-viewer-navigation";
import { useExplorerDialogs } from "@/hooks/pages/explorer/use-explorer-dialogs";
import { useExplorerFavorites } from "@/hooks/pages/explorer/use-explorer-favorites";
import { useExplorerFiltering } from "@/hooks/pages/explorer/use-explorer-filtering";
import { useExplorerHotkeys } from "@/hooks/pages/explorer/use-explorer-hotkeys";
import { useExplorerMenu } from "@/hooks/pages/explorer/use-explorer-menu";
import { useExplorerNavigation } from "@/hooks/pages/explorer/use-explorer-navigation";
import { useExplorerSelectionBar } from "@/hooks/pages/explorer/use-explorer-selection-bar";
import { useExplorerThumbs } from "@/hooks/pages/explorer/use-explorer-thumbs";
import { useMediaNodeSelection } from "@/hooks/selections/use-media-node-selection";
import { useSort } from "@/hooks/sort/use-sort";
import { useViewMode } from "@/hooks/view/use-view-mode";
import { MediaListing } from "@/lib/media/types";
import { useHistoryContext } from "@/providers/navigation/history-provider";
import { useSearchFocusContext } from "@/providers/search/search-focus-provider";
import { useTagEditorContext } from "@/providers/tag-editor/tag-editor-provider";
import { useSlideshowContext } from "@/providers/viewer/slideshow-provider";

export interface UseExplorerProps {
  listing: MediaListing;
}

export function useExplorer({ listing }: UseExplorerProps) {
  const searchFocus = useSearchFocusContext();
  const viewMode = useViewMode();

  const filtering = useExplorerFiltering({ listing });
  const selection = useMediaNodeSelection({
    allNodes: listing.nodes,
    activeNodes: filtering.filteredNodes,
  });
  const sort = useSort();

  const favorites = useExplorerFavorites();
  const dialogs = useExplorerDialogs({ filtering, selection, favorites });
  const viewer = useViewerNavigation({ nodes: filtering.mediaOnly });
  const folder = useFolderNavigation();
  const history = useHistoryContext();

  const navigation = useExplorerNavigation({
    listing,
    filtering,
    selection,
    viewer,
    history,
    folder,
    dialogs,
  });

  const tagEditor = useTagEditorContext();

  const thumbs = useExplorerThumbs({ listing });
  const fullscreen = useFullscreen();

  useExplorerHotkeys({
    enabled: true,
    listing,
    filtering,
    selection,
    dialogs,
    tagEditor,
    navigation,
    viewer,
    fullscreen,
    searchFocus,
  });

  const slideshow = useSlideshowContext();

  const menu = useExplorerMenu({
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
    slideshow,
  });

  const selectionbar = useExplorerSelectionBar({
    listing,
    selection,
    dialogs,
    tagEditor,
    favorites,
    thumbs,
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
