import { LoadingSpinner } from "@/components/ui/spinners/loading-spinner";
import { MediaNode } from "@/lib/media/types";
import { resolveMediaThumbUrl, resolveMediaUrl } from "@/lib/url/resolver";
import { cn } from "@/shadcn/lib/utils";
import Image from "next/image";
import { useState } from "react";

type ImageViewerProps = {
  media: MediaNode;
  active: boolean;
};

export function ImageViewer({ media }: ImageViewerProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="swiper-zoom-container relative w-full h-full flex items-center justify-center">
      {/* スピナー */}
      {!isLoaded && <LoadingSpinner />}

      {/* サムネイル */}
      {!isLoaded && (
        <Image
          src={resolveMediaThumbUrl(media)}
          alt={media.name}
          fill
          className="absolute inset-0 object-contain opacity-50"
          draggable={false}
        />
      )}

      {/* メイン画像 */}
      <Image
        src={resolveMediaUrl(media)}
        alt={media.name}
        fill
        className={cn(
          "object-contain transition-opacity duration-500",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={() => setIsLoaded(true)}
        priority
        unoptimized
        draggable={false}
      />
    </div>
  );
}
