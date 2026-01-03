import { LoadingSpinner } from "@/components/ui/spinners";
import { useShortcutKeys } from "@/hooks/use-shortcut-keys";
import { MediaFsNode } from "@/lib/media/types";
import { getAbsoluteMediaUrl, getThumbUrl } from "@/lib/path/helpers";
import { cn } from "@/shadcn/lib/utils";
import MuxPlayer, { MuxPlayerRefAttributes } from "@mux/mux-player-react";
import Image from "next/image";
import { memo, useRef, useState } from "react";

type VideoPlayerProps = {
  media: MediaFsNode;
  active: boolean;
};

export const VideoPlayer = memo(function VideoPlayer({
  media,
  active,
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

  // ショートカット
  useShortcutKeys([
    { key: "Ctrl+ArrowRight", callback: () => seek(10) },
    { key: "Ctrl+ArrowLeft", callback: () => seek(-10) },
    { key: " ", callback: () => togglePlay() },
  ]);

  // ショートカット beta
  // const { register: registerShortcuts } = useShortcutContext();
  // useEffect(() => {
  //   return registerShortcuts([
  //     { priority: 500, key: "Ctrl+ArrowRight", callback: () => seek(10) },
  //     { priority: 500, key: "Ctrl+ArrowLeft", callback: () => seek(-10) },
  //     { priority: 500, key: " ", callback: () => togglePlay() },
  //   ]);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  return (
    <div className="relative group overflow-hidden bg-black aspect-video w-full max-w-4xl mx-auto shadow-lg">
      {/* サムネイル */}
      <div
        className={cn(
          "absolute inset-0 z-10 transition-opacity duration-500",
          active ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
      >
        <Image
          src={getThumbUrl(media.path)}
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
            src={getAbsoluteMediaUrl(media.path)}
            autoPlay
            streamType="on-demand"
            onLoadedData={handleLoadedData}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            className="w-full h-full object-contain"
          />
        )}
      </div>
    </div>
  );
});
