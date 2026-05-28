"use client";

import { FilterMenuItem } from "@/components/ui/pages/explorer/hooks/use-explorer-filter";
import { Button } from "@/shadcn/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/shadcn/components/ui/dropdown-menu";
import { cn } from "@/shadcn/lib/utils";
import { CheckIcon, ChevronRight, Filter, RotateCcw } from "lucide-react";

interface FilterDropdownMenuProps<T> {
  items: FilterMenuItem<T>[];
  context: T;
  onReset?: () => void;
  canReset?: boolean;
  triggerLabel?: string;
  resetLabel?: string;
}

export function FilterDropdownMenu<T>({
  items,
  context,
  onReset,
  canReset = false,
  triggerLabel = "フィルター",
  resetLabel = "フィルターをクリア",
}: FilterDropdownMenuProps<T>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between bg-background font-normal text-sm border border-input px-3 h-9"
        >
          <div className="flex items-center gap-2 overflow-hidden truncate">
            <Filter
              className={cn(
                "h-4 w-4 shrink-0 transition-colors",
                canReset ? "fill-primary text-primary" : "text-muted-foreground"
              )}
            />
            <span
              className={
                canReset
                  ? "text-foreground font-medium"
                  : "text-muted-foreground"
              }
            >
              {triggerLabel}
            </span>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 opacity-50 rotate-90" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-[200px]">
        {/* 一括リセット */}
        {canReset && onReset && (
          <>
            <DropdownMenuItem
              onClick={onReset}
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                <span>{resetLabel}</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {items.map((item) => (
          <FilterDropdownMenuItem
            key={item.key}
            item={item}
            context={context}
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface FilterDropdownMenuItemProps<T> {
  item: FilterMenuItem<T>;
  context: T;
}

function FilterDropdownMenuItem<T>({
  item,
  context,
}: FilterDropdownMenuItemProps<T>) {
  if (item.hidden?.(context)) return null;

  // 区切り線
  if (item.type === "separator") {
    return <DropdownMenuSeparator />;
  }

  // カスタム
  if (item.type === "custom") {
    return <>{item.render(context)}</>;
  }

  // 階層グループ
  if (item.type === "group") {
    const Icon = item.icon;
    const isDisabled = item.disabled?.(context);
    const isActive = item.isActive?.(context);

    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger
          disabled={isDisabled}
          className={isActive ? "bg-accent font-medium" : ""}
        >
          <div className="flex items-center gap-2">
            {Icon && (
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground",
                  item.iconClassName
                )}
              />
            )}
            <span>{item.label}</span>
          </div>
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent>
            {item.children.map((child) => (
              <FilterDropdownMenuItem
                key={item.key}
                item={child}
                context={context}
              />
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
    );
  }

  // 通常アクション
  if (item.type === "action") {
    const Icon = item.icon;
    const isDisabled = item.disabled?.(context);
    const isActive = item.isActive?.(context);

    return (
      <DropdownMenuItem
        disabled={isDisabled}
        onClick={() => {
          void item.onClick(context);
        }}
        onSelect={(e) => {
          if (item.closeOnSelect === false) {
            e.preventDefault();
          }
        }}
        className={cn(
          "flex items-center justify-between gap-4 w-full cursor-pointer",
          isActive ? "bg-accent/60 font-medium text-foreground" : ""
        )}
      >
        <div className="flex items-center gap-2 overflow-hidden truncate">
          {Icon && (
            <Icon
              className={cn(
                "h-4 w-4 shrink-0 transition-colors",
                isActive ? "" : "text-muted-foreground",
                item.iconClassName
              )}
            />
          )}
          <span className="truncate">{item.label}</span>
        </div>

        <div className="flex h-4 w-4 shrink-0 items-center justify-center">
          {isActive && (
            <CheckIcon className="h-4 w-4 text-primary stroke-[2.5]" />
          )}
        </div>
      </DropdownMenuItem>
    );
  }

  return null;
}
