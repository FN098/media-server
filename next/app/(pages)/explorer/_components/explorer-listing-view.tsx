import { useFolderNavigation } from "@/__feature/navigation/hooks/use-folder-navigation";
import { PagingGridView } from "@/__feature/paging-view/components/paging-grid-view";
import { PagingListView } from "@/__feature/paging-view/components/paging-list-view";
import { MediaNodePagingViewProvider } from "@/__feature/paging-view/providers/media-node-paging-view-provider";
import { useViewMode } from "@/__feature/view/hooks/use-view-mode";
import { useExplorerDialogs } from "@/app/(pages)/explorer/_hooks/use-explorer-dialogs";
import { useExplorerFavorites } from "@/app/(pages)/explorer/_hooks/use-explorer-favorites";
import { useExplorerFiltering } from "@/app/(pages)/explorer/_hooks/use-explorer-filtering";
import { useExplorerNavigation } from "@/app/(pages)/explorer/_hooks/use-explorer-navigation";
import { useExplorerThumbs } from "@/app/(pages)/explorer/_hooks/use-explorer-thumbs";
import { useHistoryContext } from "@/feature/history/providers/history-provider";
import { useNodeListingContext } from "@/feature/listing/providers/node-listing-provider";
import { useNodeSelection } from "@/feature/selection/hooks/use-node-selection";
import { useViewerContext } from "@/feature/viewer/providers/viewer-provider";

export function ExplorerListingView() {
  const viewMode = useViewMode();
  const listing = useNodeListingContext();
  const filtering = useExplorerFiltering({ listing });
  const history = useHistoryContext();
  const selection = useNodeSelection({
    allNodes: listing.children,
    activeNodes: filtering.filteredNodes,
  });
  const favorites = useExplorerFavorites();
  const dialogs = useExplorerDialogs({ filtering, selection, favorites });
  const viewer = useViewerContext();
  const folder = useFolderNavigation();
  const thumbs = useExplorerThumbs({ listing });
  const navigation = useExplorerNavigation({
    listing,
    filtering,
    selection,
    viewer,
    history,
    folder,
    dialogs,
  });

  return (
    <MediaNodePagingViewProvider
      allNodes={filtering.filteredNodes}
      initialScrollPath={history.last?.key}
      onScrollRestored={navigation.onScrollRestored}
      onThumbError={(node) => void thumbs.update(node)}
      onOpen={(node) => void navigation.open(node)}
      onDragEnd={({ activeNode, overNode, modifiers }) => {
        if (!overNode.isDirectory) return;
        const targets = selection.hasSelection
          ? selection.selectedNodes
          : [activeNode];
        if (modifiers.ctrlKey) {
          dialogs.copyDialog.open(targets, overNode.path);
        } else {
          dialogs.moveDialog.open(targets, overNode.path);
        }
      }}
      focusOnPageChange
    >
      {viewMode.value === "grid" && <PagingGridView />}
      {viewMode.value === "list" && <PagingListView />}
    </MediaNodePagingViewProvider>
  );
}
