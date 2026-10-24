import { useExplorerContext } from "@/app/(pages)/explorer/_providers/explorer-provider";
import { PagingGridView } from "@/feature/paging-view/components/paging-grid-view";
import { PagingListView } from "@/feature/paging-view/components/paging-list-view";
import { MediaNodePagingViewProvider } from "@/feature/paging-view/providers/media-node-paging-view-provider";

export function ExplorerListingView() {
  const {
    viewMode,
    filtering,
    history,
    navigation,
    thumbs,
    dialogs,
    selection,
  } = useExplorerContext();

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
