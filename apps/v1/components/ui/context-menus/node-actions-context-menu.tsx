"use client";

import { useMounted } from "@/hooks/use-mounted";
import { MediaNode } from "@/lib/media/types";
import {
  MenuItemDef,
  MenuItemVariant,
  NodeContext,
} from "@/lib/menu-items/types";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/shadcn/components/ui/context-menu";
import React, { useMemo } from "react";

const variantClass: Record<MenuItemVariant, string> = {
  default: "",
  destructive: "text-destructive focus:text-destructive",
};

interface NodeActionContextMenuProps {
  node: MediaNode;
  menuItems: MenuItemDef<NodeContext>[];
  children: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
}

export function NodeActionContextMenu({
  node,
  menuItems,
  children,
  onOpenChange,
  disabled = false,
}: NodeActionContextMenuProps) {
  const mounted = useMounted();

  const visibleItems = useMemo(
    () => menuItems.filter((item) => !item.hidden?.({ node })),
    [menuItems, node]
  );

  if (!mounted || disabled) return children;

  return (
    <ContextMenu onOpenChange={onOpenChange}>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent className="min-w-48">
        {visibleItems.map((item) => (
          <ActionContextMenuItem key={item.key} item={item} node={node} />
        ))}
      </ContextMenuContent>
    </ContextMenu>
  );
}

interface ActionContextMenuItemProps {
  node: MediaNode;
  item: MenuItemDef<NodeContext>;
}

function ActionContextMenuItem({ node, item }: ActionContextMenuItemProps) {
  if (item.type === "custom") {
    return <ContextMenuItem asChild>{item.render({ node })}</ContextMenuItem>;
  }

  if (item.type === "separator") {
    return <ContextMenuSeparator />;
  }

  const Icon = item.icon;
  const variant = item.variant ?? "default";

  return (
    <ContextMenuItem
      className={variantClass[variant]}
      disabled={item.disabled?.({ node })}
      onClick={(e) => {
        e.stopPropagation();
        void item.onClick({ node });
      }}
    >
      <Icon className="mr-2 h-4 w-4" />
      {item.label}
    </ContextMenuItem>
  );
}
