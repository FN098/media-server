import { useExplorerContext } from "@/feature/pages/explorer/providers/explorer-provider";

export function ExplorerContent() {
  // const { viewer, filtering, navigation, menu, dialogs } = useExplorerContext();
  const { filtering, menu } = useExplorerContext();

  console.log({ filtering, menu });

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
    // <MenuItemsProvider items={menu.items}>
    // <PagingProvider totalCount={filtering.filteredCount}>
    // {/* <ExplorerListingView /> */}
    <>aaa</>
    // </PagingProvider>
    // </MenuItemsProvider>
  );
}
