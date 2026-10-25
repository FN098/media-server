import { LoadingSpinner } from "@/feature/spinner/loading-spinner";
import { getImageUrl } from "@/feature/viewer/lib/image-url";
import { getThumbnailUrl } from "@/feature/viewer/lib/thumbnail-url";
import { Node } from "@/lib/node/types";
import { cn } from "@/shadcn/lib/utils";
import Image from "next/image";
import { useState } from "react";

type ImageViewerProps = {
  node: Node;
  active?: boolean;
};

export function ImageViewer({ node, active = true }: ImageViewerProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const thumbSrc = getThumbnailUrl(node.previewFileId ?? node.id);
  const src = getImageUrl(node.id);

  return (
    <div className="swiper-zoom-container relative w-full h-full flex items-center justify-center">
      {/* スピナー */}
      {!isLoaded && <LoadingSpinner />}

      {/* サムネイル */}
      {!isLoaded && (
        <Image
          src={thumbSrc}
          alt={node.name}
          fill
          className="absolute inset-0 object-contain opacity-50"
          draggable={false}
        />
      )}

      {/* メイン画像 */}
      <Image
        src={src}
        alt={node.name}
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
