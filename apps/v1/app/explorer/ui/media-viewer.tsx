"use client";

import { MediaFsNode } from "@/app/lib/media/types";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MaximizeIcon,
  MinimizeIcon,
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
  swipeEnabled?: boolean;
}

export const MediaViewer: React.FC<MediaViewerProps> = ({
  filePath,
  mediaNode,
  onClose,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
  swipeEnabled,
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

  // -------------------------
  // スワイプ操作
  // -------------------------
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);
  const touchEndY = useRef(0);
  const isPinching = useRef(false);
  const SWIPE_THRESHOLD = 50; // スワイプ判定の最小距離

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!swipeEnabled) return; // スワイプ無効なら無視
    if (e.touches.length > 1) {
      // 複数指 → ピンチ開始
      isPinching.current = true;
    } else {
      isPinching.current = false;
      touchStartX.current = e.touches[0].screenX;
      touchStartY.current = e.touches[0].screenY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipeEnabled) return; // スワイプ無効なら無視
    if (isPinching.current) return; // ピンチ中は無視
    touchEndX.current = e.touches[0].screenX;
    touchEndY.current = e.touches[0].screenY;
  };

  const handleTouchEnd = () => {
    if (!swipeEnabled) return; // スワイプ無効なら無視
    if (isPinching.current) return; // ピンチ中は無視

    const deltaX = touchEndX.current - touchStartX.current;
    const deltaY = touchEndY.current - touchStartY.current;

    // 横スワイプ（左右）で前後移動
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > SWIPE_THRESHOLD && hasPrev) onPrev();
      else if (deltaX < -SWIPE_THRESHOLD && hasNext) onNext();
    }
    // 縦スワイプ（上下）で閉じる
    else {
      if (deltaY < -SWIPE_THRESHOLD) onClose();
      else if (deltaY > -SWIPE_THRESHOLD) onClose();
    }
  };

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
        width={10000}
        height={10000}
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
  // レンダリング
  // ----------------------------------------------------
  return (
    // ビューアの背景 (モーダル)
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
    >
      {/* 前へボタン */}
      <button
        onClick={onPrev}
        disabled={!hasPrev}
        className="absolute left-4 text-white text-5xl disabled:opacity-30 z-50"
        tabIndex={-1}
      >
        <ChevronLeftIcon />
      </button>

      {/* メディアコンテンツ */}
      <div className="grow flex items-center justify-center h-full w-full p-0">
        {mediaElement}
      </div>

      {/* 次へボタン */}
      <button
        onClick={onNext}
        disabled={!hasNext}
        className="absolute right-4 text-white text-5xl disabled:opacity-30 z-50"
        tabIndex={-1}
      >
        <ChevronRightIcon />
      </button>

      {/* 閉じるボタン */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-3xl"
        tabIndex={-1}
      >
        <XIcon />
      </button>

      {/* 全画面ボタン */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-4 right-16 text-white text-3xl"
        tabIndex={-1}
      >
        {isFullscreen ? <MinimizeIcon /> : <MaximizeIcon />}
      </button>
    </div>
  );
};
