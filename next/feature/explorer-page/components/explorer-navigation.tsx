import { FolderNavigation } from "@/feature/folder-navigation/components/folder-navigation";
import { useNodeListingContext } from "@/feature/listing/providers/node-listing-provider";

export function ExplorerFolderNavigation() {
  const listing = useNodeListingContext();

  return (
    <FolderNavigation
      prevFolder={listing.prevFolder}
      nextFolder={listing.nextFolder}
    />
  );
}
