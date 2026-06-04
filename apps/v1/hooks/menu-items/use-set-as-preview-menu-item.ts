import { MenuItemDef, NodeContext } from "@/lib/menu-items/types";
import { ImagePlusIcon } from "lucide-react";
import { useMemo } from "react";

interface UseSetAsPreviewMenuItemProps {
  openDialog: (path: string) => void;
  selectedCount: number;
}

export function useSetAsPreviewMenuItem({
  openDialog,
  selectedCount,
}: UseSetAsPreviewMenuItemProps): MenuItemDef<NodeContext> {
  return useMemo(
    () => ({
      key: "set-as-preview",
      type: "action",
      icon: ImagePlusIcon,
      label: "プレビューに設定",
      onClick: ({ node }) => openDialog(node.path),
      hidden: ({ node }) =>
        (node.type !== "image" && node.type !== "video") || selectedCount > 1,
    }),
    [openDialog, selectedCount]
  );
}
