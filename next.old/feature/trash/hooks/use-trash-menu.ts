import { Fullscreen } from "@/feature/_old/general/hooks/use-fullscreen";
import { TrashDialogs } from "@/feature/_old/trash/hooks/use-trash-dialogs";
import { useTrashMenuItems } from "@/feature/_old/trash/hooks/use-trash-menu-items";
import { TrashNavigation } from "@/feature/_old/trash/hooks/use-trash-navigation";
import { NodeSelection } from "@/feature/selection/hooks/use-node-selection";
import { ViewerNavigation } from "@/feature/viewer/hooks/use-viewer";

interface UseTrashMenuProps {
  selection: NodeSelection;
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
