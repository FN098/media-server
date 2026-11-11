import { useFullscreen } from "@/feature/_old/general/hooks/use-fullscreen";
import { useSort } from "@/feature/_old/sort/hooks/use-sort";
import { useTrashDialogs } from "@/feature/_old/trash/hooks/use-trash-dialogs";
import { useTrashFiltering } from "@/feature/_old/trash/hooks/use-trash-filtering";
import { useTrashHotkeys } from "@/feature/_old/trash/hooks/use-trash-hotkeys";
import { useTrashMenu } from "@/feature/_old/trash/hooks/use-trash-menu";
import { useTrashNavigation } from "@/feature/_old/trash/hooks/use-trash-navigation";
import { useTrashSelectionBar } from "@/feature/_old/trash/hooks/use-trash-selection-bar";
import { useTrashThumbs } from "@/feature/_old/trash/hooks/use-trash-thumbs";
import { useViewMode } from "@/feature/_old/view/hooks/use-view-mode";
import { useFolderNavigation } from "@/feature/folder-navigation/hooks/use-folder-navigation";
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
