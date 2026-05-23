"use client";

import { useMounted } from "@/hooks/use-mounted";
import { MediaNode } from "@/lib/media/types";
import {
  MenuItemDef,
  MenuItemVariant,
  NodeContext,
} from "@/lib/menu-items/types";
import { Button } from "@/shadcn/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shadcn/components/ui/dropdown-menu";
import { Kbd } from "@/shadcn/components/ui/kbd";
import { useIsMobile } from "@/shadcn/hooks/use-mobile";
import { cn } from "@/shadcn/lib/utils";
import { MoreVertical } from "lucide-react";
import { useState } from "react";

const variantClass: Record<MenuItemVariant, string> = {
  default: "",
  destructive: "text-destructive focus:text-destructive",
};

interface ActionsDropdownMenuProps {
  node: MediaNode;
  menuItems: MenuItemDef<NodeContext>[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export function ActionsDropdownMenu({
  node,
  menuItems,
  open: controlledOpen,
  onOpenChange: onControlledOpenChange,
  className,
}: ActionsDropdownMenuProps) {
  const isMobile = useIsMobile();
  const mounted = useMounted();

  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onControlledOpenChange ?? setInternalOpen;

  if (!mounted) return null;

  const visibleItems = menuItems.filter((item) => !item.hidden?.({ node }));

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8 rounded-full", className)}
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => setOpen(!open)}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-48">
        {visibleItems.map((item) => {
          if (item.type === "custom") {
            return (
              <DropdownMenuItem key={item.key} className="flex justify-center">
                {item.render({ node })}
              </DropdownMenuItem>
            );
          }

          const Icon = item.icon;
          const variant = item.variant ?? "default";

          return (
            <DropdownMenuItem
              key={item.key}
              className={cn("relative", variantClass[variant])}
              disabled={item.disabled?.({ node })}
              onClick={(e) => {
                e.stopPropagation();
                void item.onClick({ node });
              }}
            >
              <Icon className="mr-2 h-4 w-4" />
              {item.label}
              {!isMobile && item.kbd && (
                <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 text-xs text-muted-foreground">
                  <Kbd>{item.kbd}</Kbd>
                </div>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
