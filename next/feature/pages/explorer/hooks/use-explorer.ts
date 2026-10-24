import { useExplorerDialogs } from "@/feature/pages/explorer/hooks/use-explorer-dialogs";
import { useExplorerFavorites } from "@/feature/pages/explorer/hooks/use-explorer-favorites";
import { useExplorerFiltering } from "@/feature/pages/explorer/hooks/use-explorer-filtering";
import { useSearchFocusContext } from "@/feature/search/providers/search-focus-provider";
import { useNodeSelectionControl } from "@/feature/selection/hooks/use-node-selection-control";
import { useSort } from "@/feature/sort/hooks/use-sort";
import { useViewMode } from "@/feature/view/hooks/use-view-mode";
import { useViewerNavigation } from "@/feature/viewers/media-viewer/hooks/use-viewer-navigation";
import { NodeListing } from "@/lib/node/types";

export interface UseExplorerProps {
  listing: NodeListing;
}

export function useExplorer({ listing }: UseExplorerProps) {
  const searchFocus = useSearchFocusContext();

  const viewMode = useViewMode();

  const filtering = useExplorerFiltering({ listing });

  const selection = useNodeSelectionControl({
    allNodes: listing.children,
    activeNodes: filtering.filteredNodes,
  });

  const sort = useSort();

  const favorites = useExplorerFavorites();

  const dialogs = useExplorerDialogs({ filtering, selection, favorites });

  const viewer = useViewerNavigation({ nodes: filtering.mediaOnly });

  // const folder = useFolderNavigation();
  // const history = useHistoryContext();

  // const navigation = useExplorerNavigation({
  //   listing,
  //   filtering,
  //   selection,
  //   viewer,
  //   history,
  //   folder,
  //   dialogs,
  // });

  // const tagEditor = useTagEditorContext();

  // const thumbs = useExplorerThumbs({ listing });
  // const fullscreen = useFullscreen();

  // useExplorerHotkeys({
  //   enabled: true,
  //   listing,
  //   filtering,
  //   selection,
  //   dialogs,
  //   tagEditor,
  //   navigation,
  //   viewer,
  //   fullscreen,
  //   searchFocus,
  // });

  // const slideshow = useSlideshowContext();

  // const menu = useExplorerMenu({
  //   listing,
  //   filtering,
  //   selection,
  //   dialogs,
  //   tagEditor,
  //   navigation,
  //   viewer,
  //   fullscreen,
  //   favorites,
  //   thumbs,
  //   slideshow,
  // });

  // const selectionbar = useExplorerSelectionBar({
  //   listing,
  //   selection,
  //   dialogs,
  //   tagEditor,
  //   favorites,
  //   thumbs,
  // });

  return {
    listing,
    searchFocus,
    viewMode,
    filtering,
    selection,
    sort,
    dialogs,
    viewer,
    // folder,
    // history,
    // favorites,
    // navigation,
    // tagEditor,
    // thumbs,
    // fullscreen,
    // menu,
    // selectionbar,
  };
}
