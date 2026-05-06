"use client";

import { useMounted } from "@/hooks/use-mounted";
import { MediaNode } from "@/lib/media/types";
import { MenuItemDef } from "@/lib/menu-items/types";
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

const variantClass = {
  default: "",
  destructive: "text-destructive focus:text-destructive",
  success: "text-success focus:text-success",
} as const;

interface ViewerActionsDropdownMenuProps {
  node: MediaNode;
  menuItems: MenuItemDef[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ViewerActionsDropdownMenu({
  node,
  menuItems,
  open: controlledOpen,
  onOpenChange: onControlledOpenChange,
}: ViewerActionsDropdownMenuProps) {
  const isMobile = useIsMobile();
  const mounted = useMounted();

  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onControlledOpenChange ?? setInternalOpen;

  if (!mounted) return null;

  const visibleItems = menuItems.filter((item) => !item.hidden?.(node));

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <button
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => setOpen(!open)}
          className="p-2 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full outline-none"
        >
          <MoreVertical size={24} />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-48">
        {visibleItems.map((item) => {
          if (item.type === "custom") {
            return (
              <DropdownMenuItem key={item.key} className="flex justify-center">
                {item.render(node)}
              </DropdownMenuItem>
            );
          }

          const Icon = item.icon;
          const variant = item.variant ?? "default";

          return (
            <DropdownMenuItem
              key={item.key}
              className={cn("relative", variantClass[variant])}
              disabled={item.disabled?.(node)}
              onClick={(e) => {
                e.stopPropagation();
                void item.onClick(node);
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
