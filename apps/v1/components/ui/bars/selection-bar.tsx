import { AnimatedCheckCircle } from "@/components/ui/icons/animated-check-circle";
import { MenuItemDef, MultipleNodesContext } from "@/lib/menu-items/types";
import { useIsMobile } from "@/shadcn-overrides/hooks/use-mobile";
import { Button } from "@/shadcn/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shadcn/components/ui/dropdown-menu";
import { cn } from "@/shadcn/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { MoreVertical, X } from "lucide-react";
import React from "react";

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

  const displayInlineMenuItems =
    inlineMenuItems?.filter((item) => !item.hidden?.(context)) ?? [];

  const displayMenuItems =
    menuItems?.filter((item) => !item.hidden?.(context)) ?? [];

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

            <div className="flex-1 text-center">
              <span className="text-sm font-bold">{count}</span>
              <span className="text-[10px] text-muted-foreground ml-1">
                {isMobile ? "項目" : "項目を選択"}
              </span>
            </div>

            <div className="flex gap-1 items-center">
              <div className="flex gap-1 items-center">
                {/* インラインアクション */}
                {displayInlineMenuItems.map((item, index) => {
                  if (item.type === "custom") {
                    return (
                      <React.Fragment key={item.key}>
                        {item.render(context)}
                      </React.Fragment>
                    );
                  }

                  return (
                    <Button
                      key={index}
                      variant="ghost"
                      size="icon"
                      className={cn("rounded-xl w-10 h-10 p-0", item.className)}
                      onClick={() => void item.onClick(context)}
                      disabled={item.disabled?.(context)}
                      title={item.label}
                    >
                      <item.icon className="h-[18px] w-[18px]" />
                    </Button>
                  );
                })}

                {/* メニューアクション */}
                {displayMenuItems && (
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
                      {displayMenuItems.map((item, index) => {
                        if (item.type === "custom") {
                          return (
                            <React.Fragment key={item.key}>
                              {item.render(context)}
                            </React.Fragment>
                          );
                        }

                        return (
                          <DropdownMenuItem
                            key={index}
                            onClick={() => void item.onClick(context)}
                            disabled={item.disabled?.(context)}
                            className={item.className}
                            title={item.label}
                          >
                            <item.icon className="mr-2 h-4 w-4" /> {item.label}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <div className="w-[1px] h-6 bg-border mx-1" />
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
