"use client";

import { useShuffle } from "@/feature/shuffle/hooks/use-shuffle";
import { Button } from "@/shadcn/components/ui/button";
import { cn } from "@/shadcn/lib/utils";
import { Shuffle } from "lucide-react";

export function ShuffleButton() {
  const shuffle = useShuffle();

  const toggle = () => {
    if (shuffle.enabled) {
      shuffle.reset();
    } else {
      shuffle.update();
    }
  };

  return (
    <Button
      variant={shuffle.enabled ? "default" : "outline"}
      size="default"
      onClick={toggle}
      aria-label="シャッフル切り替え"
      className={cn("gap-2 h-9", !shuffle.enabled && "text-muted-foreground")}
    >
      <Shuffle
        className={`h-4 w-4 ${shuffle.enabled ? "animate-pulse" : ""}`}
      />
      {shuffle.enabled ? "シャッフル解除" : "シャッフル"}
    </Button>
  );
}
