import { PagingGridView } from "@/__feature/paging-view/components/paging-grid-view";
import { PagingListView } from "@/__feature/paging-view/components/paging-list-view";
import { MediaNodePagingViewProvider } from "@/__feature/paging-view/providers/media-node-paging-view-provider";
import { useViewMode } from "@/__feature/view/hooks/use-view-mode";
import { useExplorerDialogs } from "@/app/(pages)/explorer/_hooks/use-explorer-dialogs";
import { useExplorerFiltering } from "@/app/(pages)/explorer/_hooks/use-explorer-filtering";
import { useExplorerNavigation } from "@/app/(pages)/explorer/_hooks/use-explorer-navigation";
import { useExplorerSelection } from "@/app/(pages)/explorer/_hooks/use-explorer-selection";
import { useExplorerThumbnails } from "@/app/(pages)/explorer/_hooks/use-explorer-thumbnails";
import { useHistoryContext } from "@/feature/history/providers/history-provider";

export function ExplorerListingView() {
  const { filteredNodes } = useExplorerFiltering();
  const { value: viewMode } = useViewMode();
  const { hasSelection, selectedNodes } = useExplorerSelection();
  const { copyDialog, moveDialog } = useExplorerDialogs();
  const { update: updateThumbnail } = useExplorerThumbnails();
  const { open, onScrollRestored } = useExplorerNavigation();
  const { last: lastItem } = useHistoryContext();

  return (
    <MediaNodePagingViewProvider
      allNodes={filteredNodes}
      initialScrollPath={lastItem?.key}
      onScrollRestored={onScrollRestored}
      onThumbError={(node) => void updateThumbnail(node)}
      onOpen={(node) => void open(node)}
      onDragEnd={({ activeNode, overNode, modifiers }) => {
        if (!overNode.isDirectory) return;
        const targets = hasSelection ? selectedNodes : [activeNode];
        if (modifiers.ctrlKey) {
          copyDialog.open(targets, overNode.path);
        } else {
          moveDialog.open(targets, overNode.path);
        }
      }}
      focusOnPageChange
    >
      {viewMode === "grid" && <PagingGridView />}
      {viewMode === "list" && <PagingListView />}
    </MediaNodePagingViewProvider>
  );
}
