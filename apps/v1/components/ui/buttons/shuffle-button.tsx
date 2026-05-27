"use client";

import { useShuffle } from "@/hooks/use-shuffle";
import { Button } from "@/shadcn/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shadcn/components/ui/tooltip";
import { cn } from "@/shadcn/lib/utils";
import { Shuffle } from "lucide-react";

export function ShuffleButton() {
  const { enabled, update, reset } = useShuffle();

  const toggle = () => {
    if (enabled) {
      reset();
    } else {
      update();
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={enabled ? "default" : "outline"}
            size="default"
            onToggle={toggle}
            aria-label="シャッフル切り替え"
            className={cn(
              "gap-2 h-9 w-full",
              !enabled && "text-muted-foreground"
            )}
          >
            <Shuffle className={`h-4 w-4 ${enabled ? "animate-pulse" : ""}`} />
            {enabled ? "シャッフル解除" : "シャッフル"}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{enabled ? "シャッフルを解除" : "シャッフルを有効化"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
