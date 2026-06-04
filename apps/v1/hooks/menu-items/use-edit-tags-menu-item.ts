import { MenuItemDef, NodeContext } from "@/lib/menu-items/types";
import { TagIcon } from "lucide-react";
import { useMemo } from "react";

interface UseEditTagsMenuItemProps {
  openEditor: () => void;
}

export function useEditTagsMenuItem({
  openEditor,
}: UseEditTagsMenuItemProps): MenuItemDef<NodeContext> {
  return useMemo(
    () => ({
      key: "edit-tags",
      type: "action",
      icon: TagIcon,
      label: "タグ編集",
      onClick: () => openEditor(),
      hidden: ({ node }) => node.isDirectory,
      kbd: "T",
    }),
    [openEditor]
  );
}
