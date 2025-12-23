import { LoadingSpinner } from "@/components/ui/spinners";
import { useShortcutKeys } from "@/hooks/use-shortcut-keys";
import { MediaFsNode } from "@/lib/media/types";
import { getAbsoluteMediaUrl, getThumbUrl } from "@/lib/path-helpers";
import MuxPlayer, { MuxPlayerRefAttributes } from "@mux/mux-player-react";
import Image from "next/image";
import { useRef, useState } from "react";

export function VideoPlayer({
  media,
  isCurrent,
}: {
  media: MediaFsNode;
  isCurrent?: boolean;
}) {
  const playerRef = useRef<MuxPlayerRefAttributes>(null);
  const [isLoaded, setIsLoaded] = useState(false);

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
        className="relative max-w-full max-h-full"
        onPointerDownCapture={(e) => e.stopPropagation()}
      >
        <MuxPlayer
          ref={playerRef}
          src={getAbsoluteMediaUrl(media.path)}
          autoPlay
          streamType="on-demand"
          style={{ objectFit: "contain", width: "100%", height: "100%" }}
          className="max-w-full max-h-full"
          onLoadedData={() => setIsLoaded(true)}
        />
      </div>
    </div>
  );
}
