import { Fullscreen } from "@/hooks/general/use-fullscreen";
import { ViewerNavigation } from "@/hooks/navigation/use-viewer-navigation";
import { ExplorerDialogs } from "@/hooks/pages/explorer/use-explorer-dialogs";
import { ExplorerFavorites } from "@/hooks/pages/explorer/use-explorer-favorites";
import { ExplorerFiltering } from "@/hooks/pages/explorer/use-explorer-filtering";
import { useExplorerMenuItems } from "@/hooks/pages/explorer/use-explorer-menu-items";
import { ExplorerNavigation } from "@/hooks/pages/explorer/use-explorer-navigation";
import { ExplorerThumbs } from "@/hooks/pages/explorer/use-explorer-thumbs";
import { MediaNodeSelection } from "@/hooks/selections/use-media-node-selection";
import { TagEditor } from "@/hooks/tag-editor/use-tag-editor";
import { Slideshow } from "@/hooks/viewer/use-slideshow";
import { MediaListing } from "@/lib/media/types";

interface UseExplorerMenuProps {
  listing: MediaListing;
  filtering: ExplorerFiltering;
  selection: MediaNodeSelection;
  dialogs: ExplorerDialogs;
  tagEditor: TagEditor;
  navigation: ExplorerNavigation;
  viewer: ViewerNavigation;
  fullscreen: Fullscreen;
  favorites: ExplorerFavorites;
  thumbs: ExplorerThumbs;
  slideshow: Slideshow;
}

export function useExplorerMenu(props: UseExplorerMenuProps) {
  const items = useExplorerMenuItems(props);

  return {
    items,
  };
}
