import { MenuItemDef } from "@/lib/menu-items/types";
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
import { ChevronRight, MoreVertical } from "lucide-react";

interface ActionDropdownMenuProps<T> {
  triggerLabel?: string;
  items: MenuItemDef<T>[];
  context: T;
}

export function ActionDropdownMenu<T>({
  triggerLabel = "アクション",
  items,
  context,
}: ActionDropdownMenuProps<T>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between bg-background font-normal text-sm border border-input px-3 h-9"
        >
          <div className="flex items-center gap-2 overflow-hidden truncate">
            <MoreVertical className="h-4 w-4 shrink-0 text-muted-foreground transition-colors" />
            <span className="text-foreground font-medium truncate">
              {triggerLabel}
            </span>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 opacity-50 rotate-90 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[240px]">
        {items.map((item) => (
          <RenderMenuItem key={item.key} item={item} context={context} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// 再帰的にメニューを描画する内部コンポーネント
function RenderMenuItem<T>({
  item,
  context,
}: {
  item: MenuItemDef<T>;
  context: T;
}) {
  // hidden の動的判定
  if (item.hidden?.(context)) return null;

  // 1. 区切り線
  if (item.type === "separator") {
    return <DropdownMenuSeparator />;
  }

  // 2. カスタム
  if (item.type === "custom") {
    return <>{item.render(context)}</>;
  }

  // 3. 階層グループ（追加！）
  if (item.type === "group") {
    const SubIcon = item.icon;
    const isGroupDisabled = item.disabled?.(context);

    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger disabled={isGroupDisabled}>
          {SubIcon && <SubIcon className="mr-2 h-4 w-4" />}
          <span>{item.label}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="w-[200px]">
          {item.children.map((child) => (
            <RenderMenuItem key={child.key} item={child} context={context} />
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    );
  }

  // 4. 通常アクション
  const Icon = item.icon;
  const isDisabled = item.disabled?.(context);

  return (
    <DropdownMenuItem
      disabled={isDisabled}
      onClick={(e) => {
        e.stopPropagation();
        void item.onClick(context);
      }}
      className={
        item.variant === "destructive"
          ? "text-destructive focus:text-destructive"
          : ""
      }
    >
      <Icon className="mr-2 h-4 w-4" />
      <span className="flex-grow">{item.label}</span>
      {item.kbd && <kbd className="ml-auto text-xs opacity-50">{item.kbd}</kbd>}
    </DropdownMenuItem>
  );
}
