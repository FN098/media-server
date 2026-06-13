import { Fullscreen } from "@/hooks/general/use-fullscreen";
import { ViewerNavigation } from "@/hooks/navigation/use-viewer-navigation";
import { TrashDialogs } from "@/hooks/pages/trash/use-trash-dialogs";
import { useTrashMenuItems } from "@/hooks/pages/trash/use-trash-menu-items";
import { TrashNavigation } from "@/hooks/pages/trash/use-trash-navigation";
import { MediaNodeSelection } from "@/hooks/selections/use-media-node-selection";

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
