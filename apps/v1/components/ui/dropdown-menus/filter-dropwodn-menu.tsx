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
import { ChevronRight, Filter, LucideIcon, RotateCcw } from "lucide-react";

// 外から渡すメニュー項目の型定義（再帰構造）
export type FilterMenuItem =
  | {
      type: "action";
      label: string;
      icon?: LucideIcon;
      iconClassName?: string;
      onClick: () => void;
      isActive?: boolean; // 選択中かどうかのハイライト用
      closeOnSelect?: boolean;
    }
  | {
      type: "group";
      label: string;
      icon?: LucideIcon;
      iconClassName?: string;
      children: FilterMenuItem[]; // 子階層のメニュー
      isActive?: boolean; // 子階層のいずれかが選択されているかのハイライト用
    };

interface FilterDropdownMenuProps {
  items: FilterMenuItem[];
  placeholder?: string; // ボタンのテキスト（デフォルト: "フィルター"）
  onReset?: () => void; // フィルター全体のリセット処理
  canReset?: boolean; // リセットボタンを表示するかどうか（フィルターが適用されているかどうかのフラグとしても使用）
}

export function FilterDropdownMenu({
  items,
  placeholder = "フィルター",
  onReset,
  canReset = false,
}: FilterDropdownMenuProps) {
  // メニュー項目を再帰的にレンダリングするヘルパー関数
  const renderMenuItems = (menuItems: FilterMenuItem[]) => {
    return menuItems.map((item, index) => {
      const Icon = item.icon;

      // 1. 最終アクション
      if (item.type === "action") {
        return (
          <DropdownMenuItem
            key={`${item.label}-${index}`}
            onClick={item.onClick}
            onSelect={(e) => {
              if (item.closeOnSelect === false) {
                e.preventDefault();
              }
            }}
            className={item.isActive ? "bg-accent font-medium" : ""}
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
          </DropdownMenuItem>
        );
      }

      // 2. グループ（サブメニュー）
      if (item.type === "group") {
        return (
          <DropdownMenuSub key={`${item.label}-${index}`}>
            <DropdownMenuSubTrigger
              className={item.isActive ? "bg-accent font-medium" : ""}
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
                {renderMenuItems(item.children)}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        );
      }

      return null;
    });
  };

  return (
    <div className="w-full">
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
                  canReset
                    ? "fill-primary text-primary" // 適用中は塗りつぶし
                    : "text-muted-foreground"
                )}
              />
              <span
                className={
                  canReset
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                }
              >
                {placeholder}
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
                  <span>フィルターをクリア</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {/* 動的メニュー生成 */}
          {renderMenuItems(items)}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
