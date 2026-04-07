"use client";

import { useSeed } from "@/hooks/use-seed";
import { Button } from "@/shadcn/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shadcn/components/ui/tooltip";
import { Shuffle } from "lucide-react";

export function ShuffleButton() {
  const { updateSeed } = useSeed();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="default"
            onClick={() => updateSeed()}
            aria-label="シャッフル"
          >
            <Shuffle className="h-4 w-4" />
            シャッフル
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>シードを更新してシャッフル</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
