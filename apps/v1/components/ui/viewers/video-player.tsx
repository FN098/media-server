import { LoadingSpinner } from "@/components/ui/spinners/loading-spinner";
import { MediaFsNode } from "@/lib/media/types";
import { resolveMediaUrl } from "@/lib/media/url";
import { resolveMediaThumbUrl } from "@/lib/thumb/url";
import { cn } from "@/shadcn/lib/utils";
import MuxPlayer, { MuxPlayerRefAttributes } from "@mux/mux-player-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

type VideoPlayerProps = {
  media: MediaFsNode;
  active?: boolean;
};

export function VideoPlayer({ media, active = true }: VideoPlayerProps) {
  const playerRef = useRef<MuxPlayerRefAttributes>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);

  const storageKey = `video-progress:${media.path}`;

  // 再生位置を保存
  const handleTimeUpdate = (e: Event) => {
    const video = e.target as HTMLVideoElement;
    if (video.currentTime > 0) {
      localStorage.setItem(storageKey, video.currentTime.toString());
    }
  };

  // メディアが読み込まれた時に保存された位置から復元する
  const handleLoadedData = () => {
    const savedTime = localStorage.getItem(storageKey);
    if (savedTime && playerRef.current) {
      playerRef.current.currentTime = parseFloat(savedTime);
    }
    setIsVideoReady(true);
  };

  // 再生が終わったらストレージから削除する
  const handleEnded = () => {
    localStorage.removeItem(storageKey);
  };

  const seek = (amount: number) => {
    const video = playerRef.current;
    if (video) {
      video.currentTime += amount;
    }
  };

  const togglePlaying = () => {
    const video = playerRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch((e) => console.error(e));
    } else {
      video.pause();
    }
  };

  // ショートカット
  // Space: 再生/一時停止
  // ↑: 10秒進む
  // ↓: 10秒戻る
  // F11: フルスクリーン
  useHotkeys(
    "space",
    (e) => {
      e.preventDefault(); // 親のビューア側などのイベント伝播を阻止
      togglePlaying();
    },
    { scopes: ["viewer", "tag-editor"], enabled: active }
  );
  useHotkeys(
    "arrowup",
    (e) => {
      // 長押し（連打）を無視
      if (e.repeat) return;
      seek(10);
    },
    { scopes: ["viewer", "tag-editor"], enabled: active }
  );
  useHotkeys(
    "arrowdown",
    (e) => {
      // 長押し（連打）を無視
      if (e.repeat) return;
      seek(-10);
    },
    { scopes: ["viewer", "tag-editor"], enabled: active }
  );
  useHotkeys(
    "f11",
    (e) => {
      e.preventDefault();
      const video = playerRef.current;
      if (video) {
        if (video.requestFullscreen) {
          void video.requestFullscreen();
        }
      }
    },
    { scopes: ["viewer", "tag-editor"], enabled: active }
  );

  return (
    <div
      className="relative group overflow-hidden bg-black mx-auto shadow-lg"
      style={{
        width: "min(100%, calc(100vh * 16 / 9))",
        aspectRatio: "16/9",
      }}
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
        {/* ロード中のみスピナーを表示 */}
        {!isVideoReady && <LoadingSpinner />}
      </div>
      {/* 動画本体 */}
      <div
        className={cn("absolute inset-0 w-full h-full")}
        onPointerDownCapture={(e) => e.stopPropagation()}
      >
        {active && (
          <MuxPlayer
            ref={playerRef}
            src={resolveMediaUrl(media, { absolute: true })}
            autoPlay
            streamType="on-demand"
            nohotkeys={true}
            onLoadedData={handleLoadedData}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            className="w-full h-full object-contain"
          />
        )}
      </div>
    </div>
  );
}
