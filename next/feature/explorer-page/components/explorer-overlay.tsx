import { ExplorerDialogs } from "@/feature/explorer-page/components/explorer-dialogs";
import { useFiltering } from "@/feature/explorer-page/hooks/use-filtering";
import { SelectionBar } from "@/feature/selection/components/selection-bar";
import { useSelectionContext } from "@/feature/selection/providers/selection-provider";
import { TagEditSheet } from "@/feature/tag-editor/components/tag-edit-sheet";
import { useTagEditorContext } from "@/feature/tag-editor/providers/tag-editor-provider";
import { useViewerContext } from "@/feature/viewer/providers/viewer-provider";

export function ExplorerOverlays() {
  const selection = useSelectionContext();
  const tagEditor = useTagEditorContext();
  const viewer = useViewerContext();
  const filtering = useFiltering();

  const filteredNodeMap = new Map(
    filtering.filteredNodes.map((n) => [n.id, n])
  );

  const selectAll = () => {
    selection.selectIds(filteredNodeMap.keys());
  };

  const selectedNodes = selection.selectedIds
    .values()
    .map((id) => filteredNodeMap.get(id))
    .filter((node) => node != null)
    .toArray();

  return (
    <>
      <SelectionBar
        open={selection.isSelectionMode && !tagEditor.isOpen}
        count={selection.selectedCount}
        totalCount={filtering.filteredCount}
        onSelectAll={selectAll}
        onClose={selection.clearSelection}
        className="z-40"
        context={{ nodes: selectedNodes }}
        menuItems={selectionbar.menu.items}
        inlineMenuItems={selectionbar.menu.inlineItems}
      />

      <TagEditSheet />

      <ExplorerDialogs />

      {!viewer.isOpen && <ExplorerToolbarDialogs />}
    </>
  );
}
