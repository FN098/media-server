"use client";

import { MediaFsNode } from "@/app/lib/media/types";
import Image from "next/image";
import React, { useCallback, useEffect } from "react";

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
  // ----------------------------------------------------
  // キーボード操作のフック
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
  // メディアの表示
  // ----------------------------------------------------
  let mediaElement;

  if (mediaNode.type === "image") {
    mediaElement = (
      <Image
        src={filePath}
        alt={mediaNode.name}
        className="max-w-full max-h-full object-contain"
        width={1000}
        height={1000}
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
  // UIのレンダリング
  // ----------------------------------------------------
  return (
    // ビューアの背景 (モーダル)
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
      {/* 前へボタン */}
      <button
        onClick={onPrev}
        disabled={!hasPrev}
        className="absolute left-4 text-white text-5xl disabled:opacity-30 z-50"
      >
        &lt;
      </button>

      {/* メディアコンテンツ */}
      <div className="flex-grow flex items-center justify-center h-full w-full p-10">
        {mediaElement}
      </div>

      {/* 次へボタン */}
      <button
        onClick={onNext}
        disabled={!hasNext}
        className="absolute right-4 text-white text-5xl disabled:opacity-30 z-50"
      >
        &gt;
      </button>

      {/* 閉じるボタン */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-3xl"
      >
        ✕
      </button>
    </div>
  );
};
