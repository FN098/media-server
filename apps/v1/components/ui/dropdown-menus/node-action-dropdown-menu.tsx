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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shadcn/components/ui/dropdown-menu";
import { Kbd } from "@/shadcn/components/ui/kbd";
import { useIsMobile } from "@/shadcn/hooks/use-mobile";
import { cn } from "@/shadcn/lib/utils";
import { MoreVertical } from "lucide-react";
import { useMemo, useState } from "react";

const variantClass: Record<MenuItemVariant, string> = {
  default: "",
  destructive: "text-destructive focus:text-destructive",
};

interface NodeActionsDropdownMenuProps {
  node: MediaNode;
  menuItems: MenuItemDef<NodeContext>[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  disabled?: boolean;
  hidden?: boolean;
  triggerType?: "default" | "large";
}

export function NodeActionDropdownMenu({
  node,
  menuItems,
  open: controlledOpen,
  onOpenChange: onControlledOpenChange,
  className,
  disabled,
  hidden,
  triggerType = "default",
}: NodeActionsDropdownMenuProps) {
  const isMobile = useIsMobile();
  const mounted = useMounted();

  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onControlledOpenChange ?? setInternalOpen;

  const visibleItems = useMemo(
    () => menuItems.filter((item) => !item.hidden?.({ node })),
    [menuItems, node]
  );

  if (!mounted || hidden) return null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <ActionDropdownMenuTrigger
          triggerType={triggerType}
          className={className}
          disabled={disabled}
          onToggle={() => setOpen(!open)}
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-48">
        {visibleItems.map((item) => (
          <ActionDropdownMenuItem
            key={item.key}
            node={node}
            item={item}
            closeMenu={() => setOpen(false)}
            isMobile={isMobile}
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface ActionDropdownMenuTriggerProps extends React.ComponentProps<"button"> {
  triggerType?: "default" | "large";
}

function ActionDropdownMenuTrigger({
  triggerType = "default",
  className,
  ...rest
}: ActionDropdownMenuTriggerProps) {
  if (triggerType === "large") {
    return (
      <button
        className={cn(
          "p-2 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full outline-none",
          className
        )}
        {...rest}
      >
        <MoreVertical size={28} />
      </button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("h-8 w-8 rounded-full", className)}
      {...rest}
    >
      <MoreVertical className="h-4 w-4" />
    </Button>
  );
}

interface ActionDropdownMenuItemProps {
  node: MediaNode;
  item: MenuItemDef<NodeContext>;
  closeMenu: () => void;
  isMobile: boolean;
}

function ActionDropdownMenuItem({
  node,
  item,
  closeMenu,
  isMobile,
}: ActionDropdownMenuItemProps) {
  if (item.type === "custom") {
    return (
      <DropdownMenuItem asChild>
        {item.render({ node, closeMenu })}
      </DropdownMenuItem>
    );
  }

  if (item.type === "separator") {
    return <DropdownMenuSeparator />;
  }

  const Icon = item.icon;
  const variant = item.variant ?? "default";

  return (
    <DropdownMenuItem
      className={cn("relative", variantClass[variant])}
      disabled={item.disabled?.({ node })}
      onClick={(e) => {
        e.stopPropagation();
        void item.onClick({ node, closeMenu });
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
}
