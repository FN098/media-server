"use client";

import { useShuffle } from "@/hooks/use-shuffle";
import { Button } from "@/shadcn/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shadcn/components/ui/tooltip";
import { Shuffle } from "lucide-react";

export function ShuffleButton() {
  const { enabled, update, reset } = useShuffle();

  const handleToggle = () => {
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
            onClick={handleToggle}
            aria-label="シャッフル切り替え"
            className="gap-2 h-9 w-full"
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
