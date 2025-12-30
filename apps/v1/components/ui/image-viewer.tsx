import { LoadingSpinner } from "@/components/ui/spinners";
import { MediaFsNode } from "@/lib/media/types";
import { getMediaUrl, getThumbUrl } from "@/lib/path/helpers";
import Image from "next/image";
import { memo, useState } from "react";

type ImageViewerProps = {
  media: MediaFsNode;
  isCurrent: boolean;
};

export const ImageViewer = memo(
  function ImageViewer({ media }: ImageViewerProps) {
    const [isLoaded, setIsLoaded] = useState(false);

    return (
      <div className="swiper-zoom-container relative w-full h-full flex items-center justify-center">
        {!isLoaded && <LoadingSpinner />}

        {/* サムネイル */}
        {!isLoaded && (
          <Image
            src={getThumbUrl(media.path)}
            alt={media.name}
            fill
            className="absolute inset-0 object-contain opacity-50"
          />
        )}

        <Image
          src={getMediaUrl(media.path)}
          alt={media.name}
          fill
          className={`object-contain transition-opacity duration-500 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setIsLoaded(true)}
          priority
          unoptimized
        />
      </div>
    );
  },
  (prev, next) => {
    // path が同じ、かつ isCurrent の状態が変わっていなければ再レンダリングしない
    return (
      prev.media.path === next.media.path && prev.isCurrent === next.isCurrent
    );
  }
);
