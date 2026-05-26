"use client";

import { useIsMobile } from "@/shadcn-overrides/hooks/use-mobile";
import { Kbd } from "@/shadcn/components/ui/kbd";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shadcn/components/ui/tooltip";
import { cn } from "@/shadcn/lib/utils";
import { Pin, PinOff } from "lucide-react";

interface ViewerHeaderPinButtonProps extends React.ComponentProps<"button"> {
  isPinned: boolean;
}

export function ViewerHeaderPinButton(props: ViewerHeaderPinButtonProps) {
  const isMobile = useIsMobile();

  // モバイルなら Tooltip 使わない
  if (isMobile) {
    return <Trigger {...props} />;
  }

  return (
    <TooltipProvider delayDuration={400}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Trigger {...props} />
        </TooltipTrigger>
        <TooltipContent side="top" align="center">
          <div className="flex items-center gap-2 text-xs font-medium">
            <span>ピン留め</span>
            <Kbd>H</Kbd>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function Trigger({ isPinned, className, ...rest }: ViewerHeaderPinButtonProps) {
  return (
    <button
      className={cn(
        "p-2 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full outline-none",
        className
      )}
      {...rest}
    >
      {isPinned ? <PinOff size={28} /> : <Pin size={28} />}
    </button>
  );
}
