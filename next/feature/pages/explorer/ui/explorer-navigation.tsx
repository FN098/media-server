import { FolderNavigation } from "@/feature/navigation/ui/folder-navigation";
import { useExplorerContext } from "@/feature/pages/explorer/providers/explorer-provider";

export function ExplorerFolderNavigation() {
  const { listing } = useExplorerContext();

  return (
    <FolderNavigation
      prevFolder={listing.prevFolder}
      nextFolder={listing.nextFolder}
    />
  );
}
