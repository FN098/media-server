import { MediaNode } from "@/lib/media/types";
import { MenuItemDef, NodeContext } from "@/lib/menu-items/types";
import { ExternalLinkIcon } from "lucide-react";
import { useMemo } from "react";

interface UseOpenInNewTabMenuItemProps {
  openInNewTab: (node: MediaNode) => void;
  selectedCount: number;
}

export function useOpenInNewTabMenuItem({
  openInNewTab,
  selectedCount,
}: UseOpenInNewTabMenuItemProps): MenuItemDef<NodeContext> {
  return useMemo(
    () => ({
      key: "open-in-new-tab",
      type: "action",
      icon: ExternalLinkIcon,
      label: "新しいタブで開く",
      onClick: ({ node }) => openInNewTab(node),
      hidden: () => selectedCount > 1,
    }),
    [openInNewTab, selectedCount]
  );
}
