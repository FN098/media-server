"use client";

import { useIsMobile } from "@/shadcn-overrides/hooks/use-mobile";
import { Kbd } from "@/shadcn/components/ui/kbd";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shadcn/components/ui/tooltip";
import { Pin, PinOff } from "lucide-react";

interface ViewerHeaderPinButtonProps {
  enabled: boolean;
  onClick: () => void;
}

export function ViewerHeaderPinButton({
  enabled,
  onClick,
}: ViewerHeaderPinButtonProps) {
  const button = (
    <button
      className="p-2 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full outline-none"
      onClick={onClick}
    >
      {enabled ? <PinOff size={28} /> : <Pin size={28} />}
    </button>
  );

  const isMobile = useIsMobile();

  // モバイルなら Tooltip 使わない
  if (isMobile) {
    return button;
  }

  return (
    <TooltipProvider delayDuration={400}>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
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
