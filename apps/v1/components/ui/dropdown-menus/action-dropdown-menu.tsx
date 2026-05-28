import { Button } from "@/shadcn/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shadcn/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { ReactNode } from "react";

export interface ActionMenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: "default" | "destructive"; // 削除などを赤文字にできるように
}

interface ActionDropdownMenuProps {
  triggerLabel?: string;
  items: ActionMenuItem[];
}

export function ActionDropdownMenu({
  triggerLabel = "アクション",
  items,
}: ActionDropdownMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span>{triggerLabel}</span>
          <MoreVertical className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {items.map((item, index) => (
          <DropdownMenuItem
            key={index}
            onClick={item.onClick}
            className={
              item.variant === "destructive"
                ? "text-destructive focus:text-destructive"
                : ""
            }
          >
            {item.icon && <span className="mr-2">{item.icon}</span>}
            <span>{item.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
