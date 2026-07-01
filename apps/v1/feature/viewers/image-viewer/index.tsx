import { LoadingSpinner } from "@/feature/viewers/media-viewer/ui/loading-spinner";
import { resolveMediaUrl } from "@/lib/media/resolvers";
import { MediaNode } from "@/lib/media/types";
import { resolveMediaThumbUrl } from "@/lib/thumb/resolvers";
import { cn } from "@/shadcn/lib/utils";
import Image from "next/image";
import { useState } from "react";

type ImageViewerProps = {
  media: MediaNode;
  active?: boolean;
};

export function ImageViewer({ media, active = true }: ImageViewerProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const thumbSrc = resolveMediaThumbUrl(media);
  const src = resolveMediaUrl(media);

  return (
    <div className="swiper-zoom-container relative w-full h-full flex items-center justify-center">
      {/* スピナー */}
      {!isLoaded && <LoadingSpinner />}

      {/* サムネイル */}
      {!isLoaded && (
        <Image
          src={thumbSrc}
          alt={media.name}
          fill
          className="absolute inset-0 object-contain opacity-50"
          draggable={false}
        />
      )}

      {/* メイン画像 */}
      <Image
        src={src}
        alt={media.name}
        fill
        className={cn(
          "object-contain transition-opacity duration-500",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={() => setIsLoaded(true)}
        priority={active}
        unoptimized
        draggable={false}
      />
    </div>
  );
}
