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
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/shadcn/components/ui/context-menu";
import { useIsMobile } from "@/shadcn/hooks/use-mobile";
import React from "react";

const variantClass: Record<MenuItemVariant, string> = {
  default: "",
  destructive: "text-destructive focus:text-destructive",
};

interface NodeContextMenuProps {
  node: MediaNode;
  menuItems: MenuItemDef<NodeContext>[];
  children: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
}

export function NodeContextMenu({
  node,
  menuItems,
  children,
  onOpenChange,
  disabled = false,
}: NodeContextMenuProps) {
  const isMobile = useIsMobile();
  const mounted = useMounted();

  const context = { node };

  if (!mounted || disabled) return children;

  return (
    <ContextMenu onOpenChange={onOpenChange}>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent className="min-w-48">
        {menuItems.map((item) => (
          <NodeContextMenuItem
            key={item.key}
            item={item}
            context={context}
            isMobile={isMobile}
          />
        ))}
      </ContextMenuContent>
    </ContextMenu>
  );
}

interface NodeContextMenuItemProps {
  item: MenuItemDef<NodeContext>;
  context: NodeContext;
  isMobile: boolean;
}

function NodeContextMenuItem({
  item,
  context,
  isMobile,
}: NodeContextMenuItemProps) {
  if (item.hidden?.(context)) return null;

  // 区切り線
  if (item.type === "separator") {
    return <ContextMenuSeparator />;
  }

  // カスタム
  if (item.type === "custom") {
    return <ContextMenuItem asChild>{item.render(context)}</ContextMenuItem>;
  }

  // 階層グループ
  if (item.type === "group") {
    const Icon = item.icon;
    return (
      <ContextMenuSub>
        <ContextMenuSubTrigger disabled={item.disabled?.(context)}>
          {Icon && <Icon className="mr-2 h-4 w-4" />}
          <span>{item.label}</span>
        </ContextMenuSubTrigger>
        <ContextMenuSubContent className="w-[200px]">
          {item.children.map((child) => (
            <NodeContextMenuItem
              key={child.key}
              item={child}
              context={context}
              isMobile={isMobile}
            />
          ))}
        </ContextMenuSubContent>
      </ContextMenuSub>
    );
  }

  // 通常アクション
  if (item.type === "action") {
    const Icon = item.icon;
    const variant = item.variant ?? "default";

    return (
      <ContextMenuItem
        className={variantClass[variant]}
        disabled={item.disabled?.(context)}
        onClick={(e) => {
          e.stopPropagation();
          void item.onClick(context);
        }}
      >
        <Icon className="mr-2 h-4 w-4" />
        {item.label}
        {!isMobile && item.kbd && (
          <kbd className="ml-auto text-xs opacity-50">{item.kbd}</kbd>
        )}
      </ContextMenuItem>
    );
  }

  return null;
}
