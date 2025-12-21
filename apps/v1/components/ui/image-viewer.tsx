import { LoadingSpinner } from "@/components/ui/spinners";
import { MediaFsNode } from "@/lib/media/types";
import { getMediaUrl, getThumbUrl } from "@/lib/path-helpers";
import Image from "next/image";
import { useState } from "react";

export function ImageViewerV1({
  src,
  thumbSrc,
  title,
}: {
  src: string;
  thumbSrc: string;
  title: string;
}) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* サムネイル */}
      {!isLoaded && (
        <Image
          src={thumbSrc}
          alt={title}
          fill
          className="absolute inset-0 object-contain blur-lg opacity-50"
        />
      )}

      {!isLoaded && <LoadingSpinner />}

      <Image
        src={src}
        alt={title}
        fill
        className={`object-contain transition-opacity duration-500 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        onLoadingComplete={() => setIsLoaded(true)}
        draggable={false}
        priority
        unoptimized
      />
    </div>
  );
}

export function ImageViewerV2({ media }: { media: MediaFsNode }) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* サムネイル */}
      {!isLoaded && (
        <Image
          src={getThumbUrl(media.path)}
          alt={media.name}
          fill
          className="absolute inset-0 object-contain blur-lg opacity-50"
        />
      )}

      {!isLoaded && <LoadingSpinner />}

      <Image
        src={getMediaUrl(media.path)}
        alt={media.name}
        fill
        className={`object-contain transition-opacity duration-500 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        onLoadingComplete={() => setIsLoaded(true)}
        draggable={false}
        priority
        unoptimized
      />
    </div>
  );
}

export { ImageViewerV2 as ImageViewer };
