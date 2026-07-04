import { LoadingSpinner } from "@/feature/viewers/media-viewer/ui/loading-spinner";
import { resolveMediaUrl } from "@/lib/media/resolvers";
import { MediaFsNode } from "@/lib/media/types";
import { resolveMediaThumbUrl } from "@/lib/thumb/resolvers";
import { cn } from "@/shadcn/lib/utils";
import Image from "next/image";
import { useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

type VideoPlayerProps = {
  media: MediaFsNode;
  active?: boolean;
  onEnded?: () => void;
};

export function VideoPlayer({
  media,
  active = true,
  onEnded,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);

  const storageKey = `video-progress:${media.path}`;

  // 再生位置を保存
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || video.currentTime <= 0) return;

    localStorage.setItem(storageKey, video.currentTime.toString());
  };

  // メディアが読み込まれた時に保存された位置から復元する
  const handleLoadedData = () => {
    const video = videoRef.current;
    if (!video) return;

    const savedTime = localStorage.getItem(storageKey);

    if (savedTime) {
      video.currentTime = parseFloat(savedTime);
    }

    setIsVideoReady(true);
  };

  // 再生が終わったらストレージから削除する
  const handleEnded = () => {
    localStorage.removeItem(storageKey);
    onEnded?.();
  };

  const seek = (amount: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime += amount;
  };

  const togglePlaying = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      void video.play();
    } else {
      video.pause();
    }
  };

  // ===== ショートカット =====

  // Space: 再生/一時停止
  useHotkeys(
    "space",
    (e) => {
      e.preventDefault();
      togglePlaying();
    },
    {
      scopes: ["viewer", "tag-editor"],
      enabled: active,
    }
  );

  // ↑: 10秒進む
  useHotkeys(
    "arrowup",
    () => {
      seek(10);
    },
    {
      scopes: ["viewer", "tag-editor"],
      enabled: active,
    }
  );

  // ↓: 10秒戻る
  useHotkeys(
    "arrowdown",
    () => {
      seek(-10);
    },
    {
      scopes: ["viewer", "tag-editor"],
      enabled: active,
    }
  );

  // F11: フルスクリーン
  useHotkeys(
    "f11",
    (e) => {
      e.preventDefault();

      const video = videoRef.current;

      if (video?.requestFullscreen) {
        void video.requestFullscreen();
      }
    },
    {
      scopes: ["viewer", "tag-editor"],
      enabled: active,
    }
  );

  return (
    <div
      className={cn(
        "relative w-full h-full min-h-0 overflow-hidden bg-black mx-auto shadow-lg",
        "flex items-center justify-center"
      )}
    >
      {/* サムネイル */}
      <div
        className={cn(
          "absolute inset-0 z-10 transition-opacity duration-500",
          active ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
      >
        <Image
          src={resolveMediaThumbUrl(media)}
          alt={media.name}
          fill
          className="object-contain select-none"
          priority
          draggable={false}
        />

        {!isVideoReady && <LoadingSpinner />}
      </div>

      {/* 動画 */}
      <div
        className={cn(
          "relative w-full h-full flex items-center justify-center",
          !active && "invisible"
        )}
      >
        {active && (
          <video
            tabIndex={-1}
            ref={videoRef}
            src={resolveMediaUrl(media, { absolute: true })}
            autoPlay
            controls
            preload="metadata"
            onLoadedData={handleLoadedData}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            onClick={() => {
              // フォーカスさせない
              videoRef.current?.blur();
            }}
            className="w-full h-full object-contain focus:outline-none"
          />
        )}
      </div>
    </div>
  );
}
