import { LoadingSpinner } from "@/components/ui/spinners/loading-spinner";
import { MediaFsNode } from "@/lib/media/types";
import { encodePath } from "@/lib/path/encoder";
import { getMediaUrl, getThumbUrl } from "@/lib/path/helpers";
import { cn } from "@/shadcn/lib/utils";
import Image from "next/image";
import { useState } from "react";

type ImageViewerProps = {
  media: MediaFsNode;
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
          src={getThumbUrl(encodePath(media.path))}
          alt={media.name}
          fill
          className="absolute inset-0 object-contain opacity-50"
          draggable={false}
        />
      )}

      {/* メイン画像 */}
      <Image
        src={getMediaUrl(encodePath(media.path))}
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
