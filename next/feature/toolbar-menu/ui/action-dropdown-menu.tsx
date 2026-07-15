import { useDetectMobileContext } from "@/feature/mobile/providers/mobile-provider";
import { MenuItemDef } from "@/lib/menu-items/types";
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
import { cn } from "@/shadcn/lib/utils";
import { ChevronRight, Wand2 } from "lucide-react";
import { Fragment } from "react/jsx-runtime";

interface ActionDropdownMenuProps<T> {
  items: MenuItemDef<T>[];
  context: T;
  triggerLabel?: string;
}

export function ActionDropdownMenu<T>({
  items,
  context,
}: ActionDropdownMenuProps<T>) {
  const isMobile = useDetectMobileContext();

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
