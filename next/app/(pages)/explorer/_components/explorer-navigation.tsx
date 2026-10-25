import { FolderNavigation } from "@/__feature/navigation/ui/folder-navigation";
import { useExplorerContext } from "@/app/(pages)/explorer/_providers/explorer-provider";

export function ExplorerFolderNavigation() {
  const { listing } = useExplorerContext();

  return (
    <FolderNavigation
      prevFolder={listing.prevFolder}
      nextFolder={listing.nextFolder}
    />
  );
}
