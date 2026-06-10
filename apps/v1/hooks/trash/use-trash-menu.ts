import { Fullscreen } from "@/hooks/general/use-fullscreen";
import { ViewerNavigation } from "@/hooks/navigation/use-viewer-navigation";
import { MediaNodeSelection } from "@/hooks/selections/use-media-node-selection";
import { TrashDialogs } from "@/hooks/trash/use-trash-dialogs";
import { useTrashMenuItems } from "@/hooks/trash/use-trash-menu-items";
import { TrashNavigation } from "@/hooks/trash/use-trash-navigation";

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
