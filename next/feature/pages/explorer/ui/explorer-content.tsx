import { ScrollLockProvider } from "@/feature/general/providers/scroll-lock-provider";
import { MenuItemsProvider } from "@/feature/menu-items/providers/menu-items-provider";
import { useExplorerContext } from "@/feature/pages/explorer/providers/explorer-provider";
import { ExplorerListingView } from "@/feature/pages/explorer/ui/explorer-listing-view";
import { PagingProvider } from "@/feature/paging-view/providers/paging-provider";
import { MediaViewer } from "@/feature/viewers/media-viewer";
import { MediaViewerProvider } from "@/feature/viewers/media-viewer/providers/media-viewer-provider";

export function ExplorerContent() {
  const { viewer, filtering, navigation, menu, dialogs } = useExplorerContext();

  if (viewer.isOpen) {
    return (
      <ScrollLockProvider>
        <MediaViewerProvider
          allNodes={filtering.mediaOnly}
          initialIndex={viewer.index}
          menuItems={menu.items}
          onIndexChange={navigation.onIndexChange}
          onClose={viewer.close}
          onOpenPrev={navigation.openPrevFolder}
          onOpenNext={navigation.openNextFolder}
          onDelete={(node) => dialogs.deleteDialog.open([node])}
        >
          <MediaViewer />
        </MediaViewerProvider>
      </ScrollLockProvider>
    );
  }

  return (
    <MenuItemsProvider items={menu.items}>
      <PagingProvider totalCount={filtering.filteredCount}>
        <ExplorerListingView />
      </PagingProvider>
    </MenuItemsProvider>
  );
}
