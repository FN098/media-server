import { ViewMode } from "@/app/lib/explorer/types";
import { Button } from "@/shadcn/components/ui/button";
import { cn } from "@/shadcn/lib/utils";
import { GridIcon, ListIcon } from "lucide-react";

export function ViewModeSwitch({
  value,
  setValue,
  className,
}: {
  value: ViewMode;
  setValue: (value: ViewMode) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-1", className)}>
      <Button
        size="icon"
        variant={value === "list" ? "default" : "ghost"}
        onClick={() => setValue("list")}
      >
        <ListIcon />
      </Button>
      <Button
        size="icon"
        variant={value === "grid" ? "default" : "ghost"}
        onClick={() => setValue("grid")}
      >
        <GridIcon />
      </Button>
    </div>
  );
}
