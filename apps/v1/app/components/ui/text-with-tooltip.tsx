import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shadcn/components/ui/tooltip";
import { useEffect, useRef, useState } from "react";

type TextWithTooltipProps = {
  text: string;
  className?: string;
};

export function TextWithTooltip({ text, className }: TextWithTooltipProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    setIsTruncated(el.scrollWidth > el.clientWidth);
  }, [text]);

  const content = (
    <div ref={ref} className={className}>
      {text}
    </div>
  );

  return isTruncated ? (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  ) : (
    content
  );
}
