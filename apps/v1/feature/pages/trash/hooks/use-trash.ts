import { useFullscreen } from "@/feature/general/hooks/use-fullscreen";
import { useHistoryContext } from "@/feature/history/providers/history-provider";
import { useFolderNavigation } from "@/feature/navigation/hooks/use-folder-navigation";
import { useSearchFocusContext } from "@/feature/search/providers/search-focus-provider";
import { useMediaNodeSelection } from "@/feature/selection/hooks/use-media-node-selection";
import { useSort } from "@/feature/sort/hooks/use-sort";
import { useTagEditorContext } from "@/feature/tag-editor/providers/tag-editor-provider";
import { useTrashDialogs } from "@/feature/trash/hooks/use-trash-dialogs";
import { useTrashFiltering } from "@/feature/trash/hooks/use-trash-filtering";
import { useTrashHotkeys } from "@/feature/trash/hooks/use-trash-hotkeys";
import { useTrashMenu } from "@/feature/trash/hooks/use-trash-menu";
import { useTrashNavigation } from "@/feature/trash/hooks/use-trash-navigation";
import { useTrashSelectionBar } from "@/feature/trash/hooks/use-trash-selection-bar";
import { useTrashThumbs } from "@/feature/trash/hooks/use-trash-thumbs";
import { useViewMode } from "@/feature/view/hooks/use-view-mode";
import { useViewerNavigation } from "@/feature/viewers/media-viewer/hooks/use-viewer-navigation";
import { MediaListing } from "@/lib/media/types";

export interface UseTrashProps {
  listing: MediaListing;
}

export function useTrash({ listing }: UseTrashProps) {
  const searchFocus = useSearchFocusContext();
  const viewMode = useViewMode();

  const filtering = useTrashFiltering({ listing });
  const selection = useMediaNodeSelection({
    allNodes: listing.nodes,
    activeNodes: filtering.filteredNodes,
  });
  const sort = useSort();

  const dialogs = useTrashDialogs({ filtering, selection });
  const viewer = useViewerNavigation({ nodes: filtering.mediaOnly });
  const folder = useFolderNavigation();
  const history = useHistoryContext();

  const navigation = useTrashNavigation({
    listing,
    filtering,
    selection,
    viewer,
    history,
    folder,
  });

  const tagEditor = useTagEditorContext();

  const thumbs = useTrashThumbs({ listing });
  const fullscreen = useFullscreen();

  useTrashHotkeys({
    enabled: true,
    filtering,
    selection,
    dialogs,
    tagEditor,
    navigation,
    viewer,
    fullscreen,
    searchFocus,
  });

  const menu = useTrashMenu({
    selection,
    dialogs,
    navigation,
    viewer,
    fullscreen,
  });

  const selectionbar = useTrashSelectionBar({
    selection,
    dialogs,
    tagEditor,
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
    navigation,
    tagEditor,
    thumbs,
    fullscreen,
    menu,
    selectionbar,
  };
}
