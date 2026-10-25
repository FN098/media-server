import { SelectionBar } from "@/__feature/selection/ui/selection-bar";
import { ExplorerDialogs } from "@/app/(pages)/explorer/_components/explorer-dialogs";
import { ExplorerToolbarDialogs } from "@/app/(pages)/explorer/_components/explorer-toolbar-dialogs";
import { useExplorerContext } from "@/app/(pages)/explorer/_providers/explorer-provider";
import { TagEditSheet } from "@/feature/tag-editor/_components/tag-edit-sheet";
import { TagEditSheetProvider } from "@/feature/tag-editor/_providers/tag-edit-sheet-provider";

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
