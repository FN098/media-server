import { useExplorerDialogs } from "@/hooks/explorer/use-explorer-dialogs";
import { useExplorerFavorites } from "@/hooks/explorer/use-explorer-favorites";
import { useExplorerFiltering } from "@/hooks/explorer/use-explorer-filtering";
import { useExplorerHotkeys } from "@/hooks/explorer/use-explorer-hotkeys";
import { useExplorerMenu } from "@/hooks/explorer/use-explorer-menu";
import { useExplorerNavigation } from "@/hooks/explorer/use-explorer-navigation";
import { useExplorerSelectionBar } from "@/hooks/explorer/use-explorer-selection-bar";
import { useExplorerThumbs } from "@/hooks/explorer/use-explorer-thumbs";
import { useFullscreen } from "@/hooks/general/use-fullscreen";
import { useFolderNavigation } from "@/hooks/navigations/use-folder-navigation";
import { useViewerNavigation } from "@/hooks/navigations/use-viewer-navigation";
import { useMediaNodeSelection } from "@/hooks/selections/use-media-node-selection";
import { useSort } from "@/hooks/sort/use-sort";
import { useTagEditorControl } from "@/hooks/tag-editor/use-tag-editor-control";
import { useViewMode } from "@/hooks/view/use-view-mode";
import { MediaListing } from "@/lib/media/types";
import { useHistoryContext } from "@/providers/history-provider";
import { useSearchFocusContext } from "@/providers/search-focus.provider";

interface UseExplorerProps {
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

  const dialogs = useExplorerDialogs({ filtering });
  const viewer = useViewerNavigation({ nodes: filtering.mediaOnly });
  const folder = useFolderNavigation();
  const history = useHistoryContext();
  const favorites = useExplorerFavorites();

  const navigation = useExplorerNavigation({
    listing,
    filtering,
    selection,
    viewer,
    history,
    folder,
    dialogs,
  });

  const tagEditor = useTagEditorControl({
    targetCount: selection.selectedCount,
  });

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
