import { ExplorerListingView } from "@/app/(pages)/explorer/_components/explorer-listing-view";
import { useNodeListingContext } from "@/feature/listing/providers/node-listing-provider";
import { SelectionProvider } from "@/feature/selection/providers/selection-provider";
import { useViewerContext } from "@/feature/viewer/providers/viewer-provider";

export function ExplorerContent() {
  const listing = useNodeListingContext();
  const viewer = useViewerContext();

  // const { viewer, filtering, navigation, menu, dialogs } = useExplorerContext();

  // if (viewer.isOpen) {
  //   return (
  //     <ScrollLockProvider>
  //       <MediaViewerProvider
  //         allNodes={filtering.mediaOnly}
  //         initialIndex={viewer.index}
  //         menuItems={menu.items}
  //         onIndexChange={navigation.onIndexChange}
  //         onClose={viewer.close}
  //         onOpenPrev={navigation.openPrevFolder}
  //         onOpenNext={navigation.openNextFolder}
  //         onDelete={(node) => dialogs.deleteDialog.open([node])}
  //       >
  //         <MediaViewer />
  //       </MediaViewerProvider>
  //     </ScrollLockProvider>
  //   );
  // }

  return (
    <SelectionProvider>
      {/*  <MenuItemsProvider items={menu.items}> */}
      {/*  <PagingProvider totalCount={filtering.filteredCount}> */}
      <ExplorerListingView />
      {/*  </PagingProvider> */}
      {/*  </MenuItemsProvider> */}
    </SelectionProvider>
  );
}
