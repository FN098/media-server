"use client";

import { MediaFsNode } from "@/app/lib/media/types";
import { getAbsoluteUrl } from "@/app/lib/media/url";
import MuxPlayer from "@mux/mux-player-react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Image from "next/image";
import { useEffect } from "react";

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
  // ESC で閉じる
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

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
            width={1920}
            height={1920}
            className="max-h-full max-w-full object-contain"
          />
        )}

        {mediaNode.type === "video" && (
          <MuxPlayer
            src={getAbsoluteUrl(filePath)}
            autoPlay
            streamType="on-demand"
            className="max-h-full max-w-full"
            accentColor="#ffffff"
          />
        )}
      </div>

      {/* 前のメディア */}
      {hasPrev && (
        <div
          className="absolute left-0 top-0 h-full w-24 flex items-center justify-center
             bg-black/20 opacity-0 transition-opacity duration-200
             hover:opacity-100 active:opacity-100"
          onClick={(e) => {
            e.stopPropagation(); // クリックしても閉じない
            onPrev();
          }}
        >
          <ChevronLeftIcon className="text-white text-4xl" />
        </div>
      )}

      {/* 次のメディア */}
      {hasNext && (
        <div
          className="absolute right-0 top-0 h-full w-24 flex items-center justify-center
             bg-black/20 opacity-0 transition-opacity duration-200
             hover:opacity-100 active:opacity-100"
          onClick={(e) => {
            e.stopPropagation(); // クリックしても閉じない
            onNext();
          }}
        >
          <ChevronRightIcon className="text-white text-4xl" />
        </div>
      )}
    </div>
  );
}
