import { ViewMode } from "@/lib/view/types";
import { Button } from "@/shadcn/components/ui/button";
import { cn } from "@/shadcn/lib/utils";
import { GridIcon, ListIcon } from "lucide-react";

export function ViewModeSwitch({
  viewMode,
  setViewMode,
  className,
}: {
  viewMode: ViewMode;
  setViewMode: (viewMode: ViewMode) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-1", className)}>
      <Button
        size="icon"
        variant={viewMode === "list" ? "default" : "ghost"}
        onClick={() => setViewMode("list")}
      >
        <ListIcon />
      </Button>
      <Button
        size="icon"
        variant={viewMode === "grid" ? "default" : "ghost"}
        onClick={() => setViewMode("grid")}
      >
        <GridIcon />
      </Button>
    </div>
  );
}
