"use client";

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
import { ArrowUpDown, ChevronRight, LucideIcon, RotateCcw } from "lucide-react";

type SortDirection = "asc" | "desc";

type SortValue = {
  sort: string;
  direction: SortDirection;
};

type SortMenuItem = {
  sort: string;
  label: string;
  icon?: LucideIcon;
};

interface SortDropdownMenuProps {
  value: SortValue | null;
  onChange: (value: SortValue | null) => void;
  items: readonly SortMenuItem[];
}

export function SortDropdownMenu({
  value,
  onChange,
  items,
}: SortDropdownMenuProps) {
  const currentItem = items.find((item) => item.sort === value?.sort);

  const currentLabel = currentItem
    ? `${currentItem.label} (${value?.direction === "asc" ? "昇順" : value?.direction === "desc" ? "降順" : ""})`
    : "ソート";

  const handleSelect = (sort: string, direction: SortDirection) => {
    onChange({ sort, direction });
  };

  const handleReset = () => {
    onChange(null);
  };

  return (
    <div className="w-full">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between bg-background font-normal text-sm border border-input px-3 py-2"
          >
            <div className="flex items-center gap-2 overflow-hidden truncate">
              <ArrowUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span
                className={cn(
                  value ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {currentLabel}
              </span>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 opacity-50 max-[320px]:hidden rotate-90" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-[200px]">
          {/* リセットボタン */}
          {value && (
            <>
              <DropdownMenuItem
                onClick={handleReset}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  <span>リセットする</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {/* 階層（サブメニュー）の生成 */}
          {items.map((item, index) => {
            const Icon = item.icon || ArrowUpDown;
            const isSelectedField = value?.sort === item.sort;

            return (
              <DropdownMenuSub key={index}>
                {/* 第一階層：項目名（名前、作成日など） */}
                <DropdownMenuSubTrigger
                  className={cn(isSelectedField && "bg-accent font-medium")}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span>{item.label}</span>
                  </div>
                </DropdownMenuSubTrigger>

                <DropdownMenuPortal>
                  {/* 第二階層：昇順・降順 */}
                  <DropdownMenuSubContent>
                    <DropdownMenuItem
                      onClick={() => handleSelect(item.sort, "asc")}
                      className={cn(
                        isSelectedField &&
                          value?.direction === "asc" &&
                          "bg-accent font-medium"
                      )}
                    >
                      <span className="text-sm">昇順 (小さい順)</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleSelect(item.sort, "desc")}
                      className={cn(
                        isSelectedField &&
                          value?.direction === "desc" &&
                          "bg-accent font-medium"
                      )}
                    >
                      <span className="text-sm">降順 (大きい順)</span>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
