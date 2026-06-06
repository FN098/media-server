"use client";

import { useNodeDropdownMenu } from "@/hooks/dropdown-menus/use-node-context-menu";
import { useMounted } from "@/hooks/general/use-mounted";
import { MediaNode } from "@/lib/media/types";
import { MenuItemDef, NodeContext } from "@/lib/menu-items/types";
import { castArray } from "@/lib/utils/array";
import { Button } from "@/shadcn/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/shadcn/components/ui/dropdown-menu";
import { Kbd, KbdGroup } from "@/shadcn/components/ui/kbd";
import { useIsMobile } from "@/shadcn/hooks/use-mobile";
import { cn } from "@/shadcn/lib/utils";
import { MoreVertical } from "lucide-react";
import { Fragment, useState } from "react";

interface NodeDropdownMenuProps {
  node: MediaNode;
  menuItems: MenuItemDef<NodeContext>[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  disabled?: boolean;
  hidden?: boolean;
  triggerType?: "default" | "large";
}

export function NodeDropdownMenu({
  node,
  menuItems,
  open: controlledOpen,
  onOpenChange: onControlledOpenChange,
  className,
  disabled,
  hidden,
  triggerType = "default",
}: NodeDropdownMenuProps) {
  const isMobile = useIsMobile();
  const mounted = useMounted();

  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onControlledOpenChange ?? setInternalOpen;

  const { context, items } = useNodeDropdownMenu({ node, menuItems });

  if (!mounted || hidden) return null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <NodeDropdownMenuTrigger
          triggerType={triggerType}
          className={className}
          disabled={disabled}
          onToggle={() => setOpen(!open)}
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-48">
        {items.map((item) => (
          <NodeDropdownMenuItem
            key={item.key}
            item={item}
            context={context}
            isMobile={isMobile}
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface NodeDropdownMenuTriggerProps extends React.ComponentProps<"button"> {
  triggerType?: "default" | "large";
}

function NodeDropdownMenuTrigger({
  triggerType = "default",
  className,
  ...rest
}: NodeDropdownMenuTriggerProps) {
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

interface NodeDropdownMenuItemProps {
  item: MenuItemDef<NodeContext>;
  context: NodeContext;
  isMobile: boolean;
}

function NodeDropdownMenuItem({
  item,
  context,
  isMobile,
}: NodeDropdownMenuItemProps) {
  // 区切り線
  if (item.type === "separator") {
    return <DropdownMenuSeparator />;
  }

  // カスタム
  if (item.type === "custom") {
    return <DropdownMenuItem asChild>{item.render(context)}</DropdownMenuItem>;
  }

  // 階層グループ
  if (item.type === "group") {
    const Icon = item.icon;
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger disabled={item.disabled?.(context)}>
          {Icon && <Icon className="mr-2 h-4 w-4" />}
          <span>{item.label}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="w-[200px]">
          {item.children.map((child) => (
            <NodeDropdownMenuItem
              key={child.key}
              item={child}
              context={context}
              isMobile={isMobile}
            />
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    );
  }

  // 通常アクション
  if (item.type === "action") {
    const Icon = item.icon;
    const variant = item.variant ?? "default";
    const isDisabled = item.disabled?.(context);

    return (
      <DropdownMenuItem
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
      </DropdownMenuItem>
    );
  }

  return null;
}
