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
  const [isLoaded, setIsLoaded] = useState(false);

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
    setIsLoaded(true);
    const savedTime = localStorage.getItem(storageKey);
    if (savedTime && playerRef.current) {
      playerRef.current.currentTime = parseFloat(savedTime);
    }
  };

  // 再生が終わったらストレージから削除する
  const handleEnded = () => {
    localStorage.removeItem(storageKey);
  };

  const togglePlay = () => {
    const video = playerRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
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

  if (!isCurrent) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <Image
          src={getThumbUrl(media.path)}
          alt={media.name}
          fill
          className="object-contain select-none"
          draggable={false}
        />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {!isLoaded && <LoadingSpinner />}

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
    </div>
  );
});
