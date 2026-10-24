import { useExplorerContext } from "@/app/(pages)/explorer/_providers/explorer-provider";
import { FolderNavigation } from "@/feature/navigation/ui/folder-navigation";

export function ExplorerFolderNavigation() {
  const { listing } = useExplorerContext();

  return (
    <FolderNavigation
      prevFolder={listing.prevFolder}
      nextFolder={listing.nextFolder}
    />
  );
}
