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
import React, { useCallback, useEffect, useRef, useState } from "react";

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

  // ----------------------------------------------------
  // キーボード操作
  // ----------------------------------------------------
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" && hasNext) {
        onNext();
      } else if (event.key === "ArrowLeft" && hasPrev) {
        onPrev();
      } else if (event.key === "Escape") {
        onClose();
      }
    },
    [onNext, onPrev, onClose, hasNext, hasPrev]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  // ----------------------------------------------------
  // メディア要素
  // ----------------------------------------------------
  let mediaElement;
  if (mediaNode.type === "image") {
    mediaElement = (
      <Image
        src={filePath}
        alt={mediaNode.name}
        className="max-w-full max-h-full object-contain"
        width={1920}
        height={1920}
      />
    );
  } else if (mediaNode.type === "video") {
    mediaElement = (
      <video
        src={filePath}
        controls
        autoPlay
        className="max-w-full max-h-full object-contain"
      />
    );
  } else if (mediaNode.type === "audio") {
    // 音声ファイルの場合は、画像＋音声コントロールバーを表示
    mediaElement = (
      <div className="flex flex-col items-center">
        <p className="text-white">🔊 {mediaNode.name}</p>
        <audio src={filePath} controls autoPlay className="mt-4" />
      </div>
    );
  } else {
    mediaElement = (
      <p className="text-white">非対応のファイル形式です: {mediaNode.name}</p>
    );
  }

  // ----------------------------------------------------
  // スクロール無効化
  // ----------------------------------------------------
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventScroll = (e: Event) => e.preventDefault();

    // モーダル内はスクロール禁止
    container.addEventListener("wheel", preventScroll, { passive: false });
    container.addEventListener("touchmove", preventScroll, { passive: false });

    return () => {
      container.removeEventListener("wheel", preventScroll);
      container.removeEventListener("touchmove", preventScroll);
    };
  }, []);

  // ----------------------------------------------------
  // フルスクリーン
  // ----------------------------------------------------
  const [isFullscreen, setIsFullscreen] = useState(false);
  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;

    if (!document.fullscreenElement) {
      // 全画面にする
      el.requestFullscreen?.().then(() => setIsFullscreen(true));
    } else {
      // 全画面解除
      document.exitFullscreen?.().then(() => setIsFullscreen(false));
    }
  };

  // ----------------------------------------------------
  // フェード
  // ----------------------------------------------------
  const [showUI, setShowUI] = useState(true);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const onMove = () => {
      setShowUI(true);
      clearTimeout(timer);
      timer = setTimeout(() => setShowUI(false), 1000);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchstart", onMove);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchstart", onMove);
    };
  }, []);

  // ----------------------------------------------------
  // レンダリング
  // ----------------------------------------------------
  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
    >
      {/* メディアコンテンツ */}
      <div className="grow flex items-center justify-center h-full w-full p-0">
        {mediaElement}
      </div>

      {hasPrev && (
        <button
          onClick={onPrev}
          className={cn(
            "absolute left-8 top-1/2 -translate-y-1/2",
            "p-3 rounded-full",
            "bg-black/50 hover:bg-black/70",
            "text-white text-4xl",
            "backdrop-blur-sm",
            "transition-opacity duration-300",
            showUI ? "opacity-100" : "opacity-0 pointer-events-none"
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
            "bg-black/50 hover:bg-black/70",
            "text-white text-4xl",
            "backdrop-blur-sm",
            "transition-opacity duration-300",
            showUI ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          <ChevronRightIcon />
        </button>
      )}

      <div
        className={cn(
          "absolute top-0 left-0 right-0",
          "flex justify-end items-center",
          "p-4 z-50 gap-2",
          "bg-lenear-to-b from-white/60 to-transparent",
          "transition-opacity duration-300",
          showUI ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {/* 全画面 */}
        <button onClick={toggleFullscreen} className="text-white text-3xl">
          <MaximizeIcon />
        </button>

        {/* 閉じる */}
        <button onClick={onClose} className="text-white text-3xl mr-4">
          <XIcon />
        </button>
      </div>
    </div>
  );
};
