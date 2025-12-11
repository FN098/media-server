"use client";

import { useShortcutKeys } from "@/app/explorer/ui/hooks/use-shortcut-keys";
import { MediaFsNode } from "@/app/lib/media/types";
import { getAbsoluteUrl } from "@/app/lib/media/url";
import { cn } from "@/shadcn/lib/utils";
import MuxPlayer from "@mux/mux-player-react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Image from "next/image";

interface MediaViewerProps {
  filePath: string;
  mediaNode: MediaFsNode;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
}

export function MediaViewer({
  filePath,
  mediaNode,
  onClose,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
}: MediaViewerProps) {
  useShortcutKeys([
    { key: "ArrowRight", callback: onNext, condition: hasNext },
    { key: "ArrowLeft", callback: onPrev, condition: hasPrev },
    { key: "Escape", callback: onClose },
  ]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose} // 外部クリックで閉じる
    >
      {/* メディア */}
      <div
        className="flex items-center justify-center max-w-[90vw] max-h-[90vh]"
        onClick={(e) => e.stopPropagation()} // クリックしても閉じない
      >
        {mediaNode.type === "image" && (
          <Image
            src={filePath}
            alt={mediaNode.name}
            width={2560}
            height={2560}
            className="w-auto h-auto max-w-[100vw] max-h-screen object-contain"
          />
        )}

        {mediaNode.type === "video" && (
          <MuxPlayer
            src={getAbsoluteUrl(filePath)}
            autoPlay
            streamType="on-demand"
            className="max-w-[90vw] max-h-[90vh] object-contain"
            accentColor="#ffffff"
          />
        )}

        {mediaNode.type === "audio" && (
          <MuxPlayer
            src={getAbsoluteUrl(filePath)}
            autoPlay
            streamType="on-demand"
            className="max-w-[90vw] max-h-[90vh] object-contain"
            accentColor="#ffffff"
          />
        )}
      </div>

      {/* 前のメディア */}
      <button
        className={cn(
          "focus:outline-none",
          "absolute left-0 top-0 h-full w-24 flex items-center justify-center",
          "bg-black/20 opacity-0 transition-opacity duration-200",
          "hover:opacity-100 active:opacity-100"
        )}
        onClick={(e) => {
          e.stopPropagation(); // クリックしても閉じない
          onPrev();
        }}
        disabled={!hasPrev}
        tabIndex={-1}
      >
        <ChevronLeftIcon
          className={cn("text-white text-4xl", !hasPrev && "text-gray-500")}
        />
      </button>

      {/* 次のメディア */}
      <button
        className={cn(
          "focus:outline-none",
          "absolute right-0 top-0 h-full w-24 flex items-center justify-center",
          "bg-black/20 opacity-0 transition-opacity duration-200",
          "hover:opacity-100 active:opacity-100"
        )}
        onClick={(e) => {
          e.stopPropagation(); // クリックしても閉じない
          onNext();
        }}
        disabled={!hasNext}
        tabIndex={-1}
      >
        <ChevronRightIcon
          className={cn("text-white text-4xl", !hasNext && "text-gray-500")}
        />
      </button>
    </div>
  );
}
