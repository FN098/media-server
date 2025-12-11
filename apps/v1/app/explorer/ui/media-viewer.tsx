"use client";

import { MediaFsNode } from "@/app/lib/media/types";
import { cn } from "@/shadcn/lib/utils";
import MuxPlayer from "@mux/mux-player-react";
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from "lucide-react";
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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      {/* メディア表示 */}
      <div className="flex items-center justify-center max-w-[90vw] max-h-[90vh]">
        {mediaNode.type === "image" && (
          <Image
            src={filePath}
            alt={mediaNode.name}
            width={1920}
            height={1920}
            className="max-h-full max-w-full object-contain"
          />
        )}

        {mediaNode.type === "video" && (
          <MuxPlayer
            src={filePath}
            autoPlay
            streamType="on-demand"
            className="max-h-full max-w-full"
            accentColor="#ffffff"
          />
        )}
      </div>

      {/* ナビゲーションボタン */}
      {hasPrev && (
        <button
          onClick={onPrev}
          className={cn(
            "absolute left-8 top-1/2 -translate-y-1/2",
            "p-3 rounded-full",
            "text-white text-4xl"
          )}
        >
          <ChevronLeftIcon />
        </button>
      )}

      {hasNext && (
        <button
          onClick={onNext}
          className={cn(
            "absolute right-8 top-1/2 -translate-y-1/2",
            "p-3 rounded-full",
            "text-white text-4xl"
          )}
        >
          <ChevronRightIcon />
        </button>
      )}

      {/* 閉じる */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-3xl"
      >
        <XIcon />
      </button>
    </div>
  );
}
