import { useFullscreen } from "@/hooks/general/use-fullscreen";
import { useFolderNavigation } from "@/hooks/navigation/use-folder-navigation";
import { useViewerNavigation } from "@/hooks/navigation/use-viewer-navigation";
import { useTrashDialogs } from "@/hooks/pages/trash/use-trash-dialogs";
import { useTrashFiltering } from "@/hooks/pages/trash/use-trash-filtering";
import { useTrashHotkeys } from "@/hooks/pages/trash/use-trash-hotkeys";
import { useTrashMenu } from "@/hooks/pages/trash/use-trash-menu";
import { useTrashNavigation } from "@/hooks/pages/trash/use-trash-navigation";
import { useTrashSelectionBar } from "@/hooks/pages/trash/use-trash-selection-bar";
import { useTrashThumbs } from "@/hooks/pages/trash/use-trash-thumbs";
import { useMediaNodeSelection } from "@/hooks/selections/use-media-node-selection";
import { useSort } from "@/hooks/sort/use-sort";
import { useViewMode } from "@/hooks/view/use-view-mode";
import { MediaListing } from "@/lib/media/types";
import { useHistoryContext } from "@/providers/navigation/history-provider";
import { useSearchFocusContext } from "@/providers/search/search-focus-provider";
import { useTagEditorContext } from "@/providers/tag-editor/tag-editor-provider";

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
