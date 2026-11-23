import { useExplorerDialogs } from "@/feature/explorer-page/hooks/use-explorer-dialogs";
import { useExplorerNavigation } from "@/feature/explorer-page/hooks/use-explorer-navigation";
import { useExplorerSelection } from "@/feature/explorer-page/hooks/use-explorer-selection";
import { useExplorerThumbnails } from "@/feature/explorer-page/hooks/use-explorer-thumbnails";
import { useFiltering } from "@/feature/explorer-page/hooks/use-filtering";
import { useHistoryContext } from "@/feature/history/providers/history-provider";
import { PagingGridView } from "@/feature/paging-view/components/paging-grid-view";
import { PagingListView } from "@/feature/paging-view/components/paging-list-view";
import { MediaNodePagingViewProvider } from "@/feature/paging-view/providers/media-node-paging-view-provider";
import { useViewMode } from "@/feature/view-mode/hooks/use-view-mode";

export function ExplorerListingView() {
  const { filteredNodes } = useFiltering();
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
