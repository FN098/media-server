import { LoadingSpinner } from "@/components/ui/spinners";
import { MediaFsNode } from "@/lib/media/types";
import { getMediaUrl, getThumbUrl } from "@/lib/path-helpers";
import Image from "next/image";
import { useState } from "react";

export function ImageViewer({ media }: { media: MediaFsNode }) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
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
        draggable={false}
        priority
        unoptimized
        loading="eager"
      />
    </div>
  );
}
