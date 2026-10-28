import { useFullscreen } from "@/__feature/general/hooks/use-fullscreen";
import { useFolderNavigation } from "@/__feature/navigation/hooks/use-folder-navigation";
import { useTrashDialogs } from "@/__feature/pages/trash/hooks/use-trash-dialogs";
import { useTrashFiltering } from "@/__feature/pages/trash/hooks/use-trash-filtering";
import { useTrashHotkeys } from "@/__feature/pages/trash/hooks/use-trash-hotkeys";
import { useTrashMenu } from "@/__feature/pages/trash/hooks/use-trash-menu";
import { useTrashNavigation } from "@/__feature/pages/trash/hooks/use-trash-navigation";
import { useTrashSelectionBar } from "@/__feature/pages/trash/hooks/use-trash-selection-bar";
import { useTrashThumbs } from "@/__feature/pages/trash/hooks/use-trash-thumbs";
import { useSort } from "@/__feature/sort/hooks/use-sort";
import { useViewMode } from "@/__feature/view/hooks/use-view-mode";
import { useHistoryContext } from "@/feature/history/providers/history-provider";
import { useSearchFocusContext } from "@/feature/search/providers/search-focus-provider";
import { useNodeSelection } from "@/feature/selection/hooks/use-node-selection";
import { useTagEditorContext } from "@/feature/tag-editor/_providers/tag-editor-provider";
import { useViewer } from "@/feature/viewer/hooks/use-viewer";
import { MediaListing } from "@/lib/node/types";

export interface UseTrashProps {
  listing: MediaListing;
}

export function useTrash({ listing }: UseTrashProps) {
  const searchFocus = useSearchFocusContext();
  const viewMode = useViewMode();

  const filtering = useTrashFiltering({ listing });
  const selection = useNodeSelection({
    allNodes: listing.nodes,
    activeNodes: filtering.filteredNodes,
  });
  const sort = useSort();

  const dialogs = useTrashDialogs({ filtering, selection });
  const viewer = useViewer({ mediaNodes: filtering.mediaOnly });
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
