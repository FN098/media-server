"use client";

import { MediaFsNode } from "@/app/lib/media/types";
import { cn } from "@/shadcn/lib/utils";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MaximizeIcon,
  XIcon,
} from "lucide-react";
import Image from "next/image";
import React, { useCallback, useEffect, useRef } from "react";
import ReactPlayer from "react-player";

interface MediaViewerProps {
  filePath: string;
  mediaNode: MediaFsNode;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
}

export const MediaViewer: React.FC<MediaViewerProps> = ({
  filePath,
  mediaNode,
  onClose,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // -------------------------------------------
  // キー操作
  // -------------------------------------------
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" && hasNext) onNext();
      else if (event.key === "ArrowLeft" && hasPrev) onPrev();
      else if (event.key === "Escape") onClose();
    },
    [onNext, onPrev, onClose, hasNext, hasPrev]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // -------------------------------------------
  // メディア表示要素
  // -------------------------------------------
  let mediaElement;

  if (mediaNode.type === "image") {
    mediaElement = (
      <Image
        src={filePath}
        alt={mediaNode.name}
        width={1920}
        height={1920}
        className="max-w-full max-h-full object-contain"
      />
    );
  } else if (mediaNode.type === "video") {
    mediaElement = (
      <ReactPlayer
        url={filePath}
        playing
        controls
        width="100%"
        height="100%"
        style={{ maxWidth: "100%", maxHeight: "100%" }}
      />
    );
  } else if (mediaNode.type === "audio") {
    mediaElement = (
      <ReactPlayer
        url={filePath}
        playing
        controls
        width="400px"
        height="50px"
      />
    );
  } else {
    mediaElement = (
      <p className="text-white">非対応のファイル形式です: {mediaNode.name}</p>
    );
  }

  // -------------------------------------------
  // スクロール禁止
  // -------------------------------------------
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prevent = (e: Event) => e.preventDefault();

    container.addEventListener("wheel", prevent, { passive: false });
    container.addEventListener("touchmove", prevent, { passive: false });

    return () => {
      container.removeEventListener("wheel", prevent);
      container.removeEventListener("touchmove", prevent);
    };
  }, []);

  // -------------------------------------------
  // フルスクリーン
  // -------------------------------------------
  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;

    if (!document.fullscreenElement) {
      // 全画面にする
      el.requestFullscreen?.();
    } else {
      // 全画面解除
      document.exitFullscreen?.();
    }
  };

  // -------------------------------------------
  // レンダリング
  // -------------------------------------------
  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
    >
      {/* メディア */}
      <div className="flex items-center justify-center w-full h-full">
        {mediaElement}
      </div>

      {/* 左右ボタン */}
      {hasPrev && (
        <button
          onClick={onPrev}
          className={cn(
            "absolute left-8 top-1/2 -translate-y-1/2",
            "p-3 rounded-full bg-black/50 hover:bg-black/70 text-white text-4xl",
            "backdrop-blur-sm transition-opacity duration-300"
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
            "p-3 rounded-full bg-black/50 hover:bg-black/70 text-white text-4xl",
            "backdrop-blur-sm transition-opacity duration-300"
          )}
        >
          <ChevronRightIcon />
        </button>
      )}

      {/* 上部バー */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 flex justify-end items-center p-4 z-50 gap-2",
          "bg-lenear-to-b from-black/60 to-transparent",
          "transition-opacity duration-300"
        )}
      >
        <button onClick={toggleFullscreen} className="text-white text-3xl">
          <MaximizeIcon />
        </button>
        <button onClick={onClose} className="text-white text-3xl mr-4">
          <XIcon />
        </button>
      </div>
    </div>
  );
};
