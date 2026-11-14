import { ExplorerDialogs } from "@/feature/explorer/components/explorer-dialogs";
import { useExplorerContext } from "@/feature/explorer/providers/explorer-provider";
import { SelectionBar } from "@/feature/selection/ui/selection-bar";
import { TagEditSheet } from "@/feature/tag-editor/components/tag-edit-sheet";
import { TagEditSheetProvider } from "@/feature/tag-editor/providers/tag-edit-sheet-provider";

export function ExplorerOverlays() {
  const { filtering, selection, tagEditor, selectionbar, viewer } =
    useExplorerContext();

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

      <TagEditSheetProvider
        tagEditor={tagEditor}
        targetNodes={selection.selectedNodes}
      >
        <TagEditSheet />
      </TagEditSheetProvider>

      <ExplorerDialogs />

      {!viewer.isOpen && <ExplorerToolbarDialogs />}
    </>
  );
}
