import { useExplorerDialogs } from "@/feature/explorer/hooks/use-explorer-dialogs";
import { useExplorerFavorites } from "@/feature/explorer/hooks/use-explorer-favorites";
import { useExplorerFiltering } from "@/feature/explorer/hooks/use-explorer-filtering";
import { useExplorerHotkeys } from "@/feature/explorer/hooks/use-explorer-hotkeys";
import { useExplorerMenu } from "@/feature/explorer/hooks/use-explorer-menu";
import { useExplorerNavigation } from "@/feature/explorer/hooks/use-explorer-navigation";
import { useExplorerSelectionBar } from "@/feature/explorer/hooks/use-explorer-selection-bar";
import { useExplorerThumbs } from "@/feature/explorer/hooks/use-explorer-thumbs";
import { useFullscreen } from "@/feature/general/hooks/use-fullscreen";
import { useHistoryContext } from "@/feature/history/providers/history-provider";
import { useFolderNavigation } from "@/feature/navigation/hooks/use-folder-navigation";
import { useSearchFocusContext } from "@/feature/search/providers/search-focus-provider";
import { useMediaNodeSelection } from "@/feature/selection/hooks/use-media-node-selection";
import { useSort } from "@/feature/sort/hooks/use-sort";
import { useTagEditorContext } from "@/feature/tag-editor/providers/tag-editor-provider";
import { useViewMode } from "@/feature/view/hooks/use-view-mode";
import { useViewerNavigation } from "@/feature/viewers/media-viewer/hooks/use-viewer-navigation";
import { useSlideshowContext } from "@/feature/viewers/media-viewer/providers/slideshow-provider";
import { MediaListing } from "@/lib/media/types";

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
