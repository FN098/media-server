import { MediaNode } from "@/lib/media/types";
import { MenuItemDef, NodeContext } from "@/lib/menu-items/types";
import { PencilIcon } from "lucide-react";
import { useMemo } from "react";

interface UseRenameMenuItemProps {
  openDialog: (node: MediaNode) => void;
  selectedCount: number;
}

export function useRenameMenuItem({
  openDialog,
  selectedCount,
}: UseRenameMenuItemProps): MenuItemDef<NodeContext> {
  return useMemo(
    () => ({
      key: "rename",
      type: "action",
      icon: PencilIcon,
      label: "名前の変更",
      onClick: ({ node }) => openDialog(node),
      hidden: () => selectedCount > 1,
      kbd: "F2",
    }),
    [openDialog, selectedCount]
  );
}
