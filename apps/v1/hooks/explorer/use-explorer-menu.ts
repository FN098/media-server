import { ExplorerDialogs } from "@/hooks/explorer/use-explorer-dialogs";
import { ExplorerFavorites } from "@/hooks/explorer/use-explorer-favorites";
import { ExplorerFiltering } from "@/hooks/explorer/use-explorer-filtering";
import { useExplorerMenuItems } from "@/hooks/explorer/use-explorer-menu-items";
import { ExplorerNavigation } from "@/hooks/explorer/use-explorer-navigation";
import { ExplorerThumbs } from "@/hooks/explorer/use-explorer-thumbs";
import { Fullscreen } from "@/hooks/general/use-fullscreen";
import { ViewerNavigation } from "@/hooks/navigations/use-viewer-navigation";
import { MediaNodeSelection } from "@/hooks/selections/use-media-node-selection";
import { TagEditorControl } from "@/hooks/tag-editor/use-tag-editor-control";
import { MediaListing } from "@/lib/media/types";

interface UseExplorerMenuProps {
  listing: MediaListing;
  filtering: ExplorerFiltering;
  selection: MediaNodeSelection;
  dialogs: ExplorerDialogs;
  tagEditor: TagEditorControl;
  navigation: ExplorerNavigation;
  viewer: ViewerNavigation;
  fullscreen: Fullscreen;
  favorites: ExplorerFavorites;
  thumbs: ExplorerThumbs;
}

export function useExplorerMenu({
  listing,
  filtering,
  selection,
  dialogs,
  tagEditor,
  navigation,
  viewer,
  fullscreen,
  favorites,
  thumbs,
}: UseExplorerMenuProps) {
  const items = useExplorerMenuItems({
    listing,
    filtering,
    selection,
    dialogs,
    tagEditor,
    navigation,
    viewer,
    fullscreen,
    favorites,
    thumbs,
  });

  return {
    items,
  };
}
