import { LoadingSpinner } from "@/components/ui/spinners";
import { useShortcutKeys } from "@/hooks/use-shortcut-keys";
import { MediaFsNode } from "@/lib/media/types";
import { getAbsoluteMediaUrl, getThumbUrl } from "@/lib/path-helpers";
import MuxPlayer, { MuxPlayerRefAttributes } from "@mux/mux-player-react";
import Image from "next/image";
import { memo, useRef, useState } from "react";

type VideoPlayerProps = {
  media: MediaFsNode;
  isCurrent: boolean;
};

export const VideoPlayer = memo(function VideoPlayer({
  media,
  isCurrent,
}: VideoPlayerProps) {
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

  const togglePlay = () => {
    const video = playerRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch((e) => console.error(e));
    } else {
      video.pause();
    }
  };

  const seek = (amount: number) => {
    const video = playerRef.current;
    if (video) {
      video.currentTime += amount;
    }
  };

  useShortcutKeys([
    { key: "Ctrl+ArrowRight", callback: () => seek(10) },
    { key: "Ctrl+ArrowLeft", callback: () => seek(-10) },
    { key: " ", callback: () => togglePlay() },
  ]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {(!isCurrent || !isVideoReady) && (
        <div className="absolute inset-0 z-10">
          <Image
            src={getThumbUrl(media.path)}
            alt={media.name}
            fill
            className="object-contain select-none"
            priority // カレントの可能性があるものは優先的にロード
            draggable={false}
          />
          {/* ロード中のみスピナーを表示 */}
          {isCurrent && !isVideoReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <LoadingSpinner />
            </div>
          )}
        </div>
      )}

      {isCurrent && (
        <div
          className="relative max-w-full max-h-full aspect-video"
          onPointerDownCapture={(e) => e.stopPropagation()}
        >
          <MuxPlayer
            ref={playerRef}
            src={getAbsoluteMediaUrl(media.path)}
            autoPlay
            streamType="on-demand"
            onLoadedData={handleLoadedData}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
          />
        </div>
      )}
    </div>
  );
});
