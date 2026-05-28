import { AnimatedCheckCircle } from "@/components/ui/icons/animated-check-circle";
import { MenuItemDef, MultipleNodesContext } from "@/lib/menu-items/types";
import { useIsMobile } from "@/shadcn-overrides/hooks/use-mobile";
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
import { cn } from "@/shadcn/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { MoreVertical, X } from "lucide-react";

interface SelectionBarProps {
  open: boolean;
  count: number;
  totalCount: number;
  onSelectAll: () => void;
  onClose: () => void;
  context: MultipleNodesContext;
  inlineMenuItems?: MenuItemDef<MultipleNodesContext>[];
  menuItems?: MenuItemDef<MultipleNodesContext>[];
  className?: string;
}

export function SelectionBar({
  open,
  count,
  totalCount,
  onSelectAll,
  onClose,
  context,
  inlineMenuItems,
  menuItems,
  className,
}: SelectionBarProps) {
  const isAllSelected = count > 0 && count === totalCount;
  const isMobile = useIsMobile();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="selection-bar"
          initial={{ y: 100, x: "-50%", opacity: 0 }}
          animate={{ y: 0, x: "-50%", opacity: 1 }}
          exit={{ y: 100, x: "-50%", opacity: 0 }}
          className={cn(
            "fixed bottom-8 left-1/2 z-[60] w-[95%] max-w-md pointer-events-auto",
            className
          )}
        >
          <div className="flex items-center justify-between gap-2 p-2 bg-background/80 backdrop-blur-xl border rounded-2xl shadow-2xl">
            {/* 全選択ボタン */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "rounded-xl text-xs h-10 px-3 gap-2",
                isAllSelected && "bg-green-500/10"
              )}
              onClick={onSelectAll}
            >
              <AnimatedCheckCircle active={isAllSelected} />
              {isAllSelected ? "全選択済み" : "すべて選択"}
            </Button>

            {/* 選択件数表示 */}
            <div className="flex-1 text-center">
              <span className="text-sm font-bold">{count}</span>
              <span className="text-[10px] text-muted-foreground ml-1">
                {isMobile ? "項目" : "項目を選択"}
              </span>
            </div>

            {/* アクションエリア */}
            <div className="flex gap-1 items-center">
              <div className="flex gap-1 items-center">
                {/* インラインアクション */}
                {inlineMenuItems?.map((item) => (
                  <SelectionBarInlineMenuItem
                    key={item.key}
                    item={item}
                    context={context}
                  />
                ))}

                {/* ドロップダウンメニューアクション */}
                {menuItems && menuItems.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="その他"
                        className="rounded-xl w-10 h-10 p-0"
                      >
                        <MoreVertical size={18} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {menuItems.map((item) => (
                        <SelectionBarMenuItem
                          key={item.key}
                          item={item}
                          context={context}
                        />
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {/* 閉じるボタンとの区切り線 */}
              <div className="w-[1px] h-6 bg-border mx-1" />

              {/* 閉じるボタン */}
              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl w-10 h-10 p-0"
                onClick={onClose}
              >
                <X size={18} />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface SelectionBarInlineMenuItemProps {
  item: MenuItemDef<MultipleNodesContext>;
  context: MultipleNodesContext;
}

function SelectionBarInlineMenuItem({
  item,
  context,
}: SelectionBarInlineMenuItemProps) {
  if (item.hidden?.(context)) return null;

  // 区切り線
  if (item.type === "separator") {
    return <div className="w-px h-6 bg-border mx-1" />;
  }

  // カスタム
  if (item.type === "custom") {
    return item.render(context);
  }

  // 階層グループ
  if (item.type === "group") return null; // インラインメニューではサポートしない

  // 通常アクション
  const Icon = item.icon;
  return (
    <Button
      variant={item.variant === "destructive" ? "destructive" : "ghost"}
      size="icon"
      className={cn("rounded-xl w-10 h-10 p-0", item.className)}
      onClick={(e) => {
        e.stopPropagation();
        void item.onClick(context);
      }}
      disabled={item.disabled?.(context)}
      title={item.label}
    >
      {Icon && <Icon className="h-[18px] w-[18px]" />}
    </Button>
  );
}

interface SelectionBarMenuItemProps {
  item: MenuItemDef<MultipleNodesContext>;
  context: MultipleNodesContext;
}

function SelectionBarMenuItem({ item, context }: SelectionBarMenuItemProps) {
  if (item.hidden?.(context)) return null;

  // 区切り線
  if (item.type === "separator") {
    return <DropdownMenuSeparator />;
  }

  // カスタム
  if (item.type === "custom") {
    return item.render(context);
  }

  // 階層グループ
  if (item.type === "group") {
    const SubIcon = item.icon;
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger disabled={item.disabled?.(context)}>
          {SubIcon && <SubIcon className="mr-2 h-4 w-4" />}
          <span>{item.label}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="w-[200px]">
          {item.children.map((child) => (
            <SelectionBarMenuItem
              key={child.key}
              item={child}
              context={context}
            />
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    );
  }

  // 通常アクション
  const Icon = item.icon;
  return (
    <DropdownMenuItem
      disabled={item.disabled?.(context)}
      onClick={(e) => {
        e.stopPropagation();
        void item.onClick(context);
      }}
      className={cn(
        item.variant === "destructive" &&
          "text-destructive focus:text-destructive",
        item.className
      )}
      title={item.label}
    >
      {Icon && <Icon className="mr-2 h-4 w-4" />}
      <span className="flex-grow">{item.label}</span>
      {item.kbd && <kbd className="ml-auto text-xs opacity-50">{item.kbd}</kbd>}
    </DropdownMenuItem>
  );
}
