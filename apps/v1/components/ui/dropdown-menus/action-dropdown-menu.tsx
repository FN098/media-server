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
import { useIsMobile } from "@/shadcn/hooks/use-mobile";
import { ChevronRight, Wand2 } from "lucide-react";

interface ActionDropdownMenuProps<T> {
  items: MenuItemDef<T>[];
  context: T;
  triggerLabel?: string;
}

export function ActionDropdownMenu<T>({
  items,
  context,
}: ActionDropdownMenuProps<T>) {
  const isMobile = useIsMobile();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between bg-background font-normal text-sm border border-input px-3 h-9"
        >
          <div className="flex items-center gap-2 overflow-hidden truncate">
            <Wand2 className="h-4 w-4 shrink-0 text-muted-foreground transition-colors" />
            <span className="text-foreground font-medium truncate">
              アクション
            </span>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 opacity-50 rotate-90 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[240px]">
        {items.map((item) => (
          <ActionDropdownMenuItem
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

interface ActionDropdownMenuItemProps<T> {
  item: MenuItemDef<T>;
  context: T;
  isMobile: boolean;
}

function ActionDropdownMenuItem<T>({
  item,
  context,
  isMobile,
}: ActionDropdownMenuItemProps<T>) {
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

    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger disabled={isDisabled}>
          {Icon && <Icon className="mr-2 h-4 w-4" />}
          <span>{item.label}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="w-[200px]">
          {item.children.map((child) => (
            <ActionDropdownMenuItem
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
        {!isMobile && item.kbd && (
          <kbd className="ml-auto text-xs opacity-50">{item.kbd}</kbd>
        )}
      </DropdownMenuItem>
    );
  }

  return null;
}
