"use client";

import { useMounted } from "@/hooks/use-mounted";
import { MediaNode } from "@/lib/media/types";
import { MenuItemDef, NodeContext } from "@/lib/menu-items/types";
import { castArray } from "@/lib/utils/array";
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
import { Kbd, KbdGroup } from "@/shadcn/components/ui/kbd";
import { useIsMobile } from "@/shadcn/hooks/use-mobile";
import { cn } from "@/shadcn/lib/utils";
import React, { Fragment } from "react";

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
    const isDisabled = item.disabled?.(context);

    return (
      <ContextMenuItem
        className={cn(
          "flex items-center justify-between gap-4",
          variant === "destructive" && "text-destructive focus:text-destructive"
        )}
        disabled={isDisabled}
        onClick={(e) => {
          e.stopPropagation();
          void item.onClick(context);
        }}
      >
        <div className="flex min-w-0 items-center">
          <Icon className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">{item.label}</span>
        </div>

        {!isMobile && item.kbd && (
          <KbdGroup className="shrink-0">
            {castArray(item.kbd).map((key, index) => (
              <Fragment key={key}>
                {index > 0 && <span>+</span>}
                <Kbd>{key}</Kbd>
              </Fragment>
            ))}
          </KbdGroup>
        )}
      </ContextMenuItem>
    );
  }

  return null;
}
