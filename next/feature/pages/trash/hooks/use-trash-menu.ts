import { Fullscreen } from "@/feature/general/hooks/use-fullscreen";
import { TrashDialogs } from "@/feature/pages/trash/hooks/use-trash-dialogs";
import { useTrashMenuItems } from "@/feature/pages/trash/hooks/use-trash-menu-items";
import { TrashNavigation } from "@/feature/pages/trash/hooks/use-trash-navigation";
import { MediaNodeSelection } from "@/feature/selection/hooks/use-media-node-selection";
import { ViewerNavigation } from "@/feature/viewers/media-viewer/hooks/use-viewer-navigation";

interface UseTrashMenuProps {
  selection: MediaNodeSelection;
  dialogs: TrashDialogs;
  navigation: TrashNavigation;
  viewer: ViewerNavigation;
  fullscreen: Fullscreen;
}

export function useTrashMenu(props: UseTrashMenuProps) {
  const items = useTrashMenuItems(props);

  return {
    items,
  };
}
