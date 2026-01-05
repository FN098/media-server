import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shadcn/components/ui/tooltip";
import { cn } from "@/shadcn/lib/utils";
import { useEffect, useRef, useState } from "react";

type TooltipSide = "top" | "right" | "bottom" | "left";
type TooltipAlign = "start" | "center" | "end";

type TextWithTooltipProps = {
  text: string;
  className?: string;
  tooltipSide?: TooltipSide;
  tooltipAlign?: TooltipAlign;
  sideOffset?: number;
};

export function TextWithTooltip({
  text,
  className,
  tooltipSide = "top",
  tooltipAlign = "center",
  sideOffset = 4,
}: TextWithTooltipProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setIsTruncated(el.scrollWidth > el.clientWidth);
  }, [text]);

  const content = (
    <div ref={ref} className={cn("truncate", className)}>
      {text}
    </div>
  );

  return isTruncated ? (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent
        side={tooltipSide}
        align={tooltipAlign}
        sideOffset={sideOffset}
      >
        {text}
      </TooltipContent>
    </Tooltip>
  ) : (
    content
  );
}
