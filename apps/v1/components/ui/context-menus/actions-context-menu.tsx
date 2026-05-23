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
  ContextMenuTrigger,
} from "@/shadcn/components/ui/context-menu";

const variantClass: Record<MenuItemVariant, string> = {
  default: "",
  destructive: "text-destructive focus:text-destructive",
};

interface ActionsContextMenuProps {
  node: MediaNode;
  menuItems: MenuItemDef<NodeContext>[];
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
}

export function ActionsContextMenu({
  node,
  menuItems,
  children,
  open,
  onOpenChange,
  disabled = false,
}: ActionsContextMenuProps) {
  const mounted = useMounted();
  if (!mounted || disabled) return <>{children}</>;

  const visibleItems = menuItems.filter((item) => !item.hidden?.({ node }));

  return (
    <ContextMenu modal={open} onOpenChange={onOpenChange}>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="min-w-48">
        {visibleItems.map((item) => {
          if (item.type === "custom") {
            return (
              <ContextMenuItem key={item.key} className="flex justify-center">
                {item.render({ node })}
              </ContextMenuItem>
            );
          }

          const Icon = item.icon;
          const variant = item.variant ?? "default";

          return (
            <ContextMenuItem
              key={item.key}
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
        })}
      </ContextMenuContent>
    </ContextMenu>
  );
}
