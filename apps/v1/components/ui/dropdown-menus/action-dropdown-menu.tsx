import { MenuItemDef } from "@/lib/menu-items/types";
import { Button } from "@/shadcn/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shadcn/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

interface ActionDropdownMenuProps<T> {
  placeholder?: string;
  items: MenuItemDef<T>[];
  context: T;
}

export function ActionDropdownMenu<T>({
  placeholder = "アクション",
  items,
  context,
}: ActionDropdownMenuProps<T>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span>{placeholder}</span>
          <MoreVertical className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {items.map((item) => {
          // hidden の判定
          if (item.hidden?.(context)) return null;

          // separator のレンダリング
          if (item.type === "separator") {
            return <DropdownMenuSeparator key={item.key} />;
          }

          // custom のレンダリング
          if (item.type === "custom") {
            return <div key={item.key}>{item.render(context)}</div>;
          }

          // action のレンダリング
          const Icon = item.icon;
          const isDisabled = item.disabled?.(context);

          return (
            <DropdownMenuItem
              key={item.key}
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
              {item.kbd && (
                <kbd className="ml-auto text-xs opacity-50">{item.kbd}</kbd>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
