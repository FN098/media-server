import { ViewMode } from "@/app/dashboard/explorer/ui/types";
import { Button } from "@/shadcn/components/ui/button";
import { GridIcon, ListIcon } from "lucide-react";

export function ViewModeSwitch({
  value,
  setValue,
}: {
  value: ViewMode;
  setValue: (value: ViewMode) => void;
}) {
  return (
    <div className="flex gap-1">
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
