"use client";

import { useDetectMobileContext } from "@/feature/mobile/providers/mobile-provider";
import { Kbd } from "@/shadcn/components/ui/kbd";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shadcn/components/ui/tooltip";
import { cn } from "@/shadcn/lib/utils";
import { Pin, PinOff } from "lucide-react";

interface MediaViewerHeaderPinButtonProps extends React.ComponentProps<"button"> {
  isPinned: boolean;
}

export function MediaViewerHeaderPinButton(
  props: MediaViewerHeaderPinButtonProps
) {
  const isMobile = useDetectMobileContext();

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

function Trigger({
  isPinned,
  className,
  ...rest
}: MediaViewerHeaderPinButtonProps) {
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
