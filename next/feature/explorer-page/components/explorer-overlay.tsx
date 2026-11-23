import { ExplorerDialogs } from "@/feature/explorer-page/components/explorer-dialogs";
import { useFiltering } from "@/feature/explorer-page/hooks/use-filtering";
import { useSelectionContext } from "@/feature/selection/providers/selection-provider";
import { SelectionBar } from "@/feature/selection/ui/selection-bar";
import { TagEditSheet } from "@/feature/tag-editor/components/tag-edit-sheet";
import { useTagEditorContext } from "@/feature/tag-editor/providers/tag-editor-provider";
import { useViewerContext } from "@/feature/viewer/providers/viewer-provider";

export function ExplorerOverlays() {
  const selection = useSelectionContext();
  const tagEditor = useTagEditorContext();
  const viewer = useViewerContext();
  const filtering = useFiltering();
  // const { filtering, selection, tagEditor, selectionbar, viewer } =
  //   useExplorerContext();

  return (
    <>
      <SelectionBar
        open={selection.isSelectionMode && !tagEditor.isOpen}
        count={selection.selectedCount}
        totalCount={filtering.filteredCount}
        onSelectAll={selection.selectAll}
        onClose={selection.reset}
        className="z-40" // DropdownMenu より小さくする
        context={{ nodes: selection.selectedNodes }}
        menuItems={selectionbar.menu.items}
        inlineMenuItems={selectionbar.menu.inlineItems}
      />

      <TagEditSheet />

      <ExplorerDialogs />

      {!viewer.isOpen && <ExplorerToolbarDialogs />}
    </>
  );
}
