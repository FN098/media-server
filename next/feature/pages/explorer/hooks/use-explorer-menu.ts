import { Fullscreen } from "@/feature/general/hooks/use-fullscreen";
import { ExplorerDialogs } from "@/feature/pages/explorer/hooks/use-explorer-dialogs";
import { ExplorerFavorites } from "@/feature/pages/explorer/hooks/use-explorer-favorites";
import { ExplorerFiltering } from "@/feature/pages/explorer/hooks/use-explorer-filtering";
import { useExplorerMenuItems } from "@/feature/pages/explorer/hooks/use-explorer-menu-items";
import { ExplorerNavigation } from "@/feature/pages/explorer/hooks/use-explorer-navigation";
import { ExplorerThumbs } from "@/feature/pages/explorer/hooks/use-explorer-thumbs";
import { MediaNodeSelection } from "@/feature/selection/hooks/use-media-node-selection";
import { TagEditor } from "@/feature/tag-editor/hooks/use-tag-editor";
import { Slideshow } from "@/feature/viewers/media-viewer/hooks/use-slideshow";
import { ViewerNavigation } from "@/feature/viewers/media-viewer/hooks/use-viewer-navigation";
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
