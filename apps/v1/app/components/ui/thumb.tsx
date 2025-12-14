/* eslint-disable @next/next/no-img-element */
import { FallbackImage } from "@/app/components/ui/fallback-image";
import { getMediaUrl, getThumbUrl } from "@/app/lib/path-helpers";
import { MediaFsNode, MediaFsNodeType } from "@/app/lib/types";
import { cn } from "@/shadcn/lib/utils";
import Image from "next/image";
import { memo, ReactNode } from "react";

type MediaThumbProps = {
  node: MediaFsNode;
  width?: number;
  height?: number;
  className?: string;
};

export const MediaThumb = memo(function MediaThumb1({
  node,
  width,
  height,
  className,
}: MediaThumbProps) {
  if (node.type === "image") {
    return (
      <Image
        src={getMediaUrl(node.path)}
        alt={node.name}
        width={width}
        height={height}
        className={className}
        loading="lazy"
      />
    );
  } else if (node.type === "video") {
    return (
      <FallbackImage
        src={getThumbUrl(node.path)}
        alt={node.name}
        width={width}
        height={height}
        className={className}
        fallback={
          <div
            className={cn(
              "flex h-full w-full items-center justify-center",
              className
            )}
          >
            <MediaThumbIcon type={node.type} />
          </div>
        }
      />
    );
  } else {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center",
          className
        )}
      >
        <MediaThumbIcon type={node.type} />
      </div>
    );
  }
});

export const mediaThumbIcons: Record<MediaFsNodeType, ReactNode> = {
  audio: (
    <img
      width="64"
      height="64"
      src="https://img.icons8.com/flat-round/64/audio-wave.png"
      alt="audio-wave"
    />
  ),
  directory: (
    <img
      width="48"
      height="48"
      src="https://img.icons8.com/fluency/48/folder-invoices--v2.png"
      alt="folder-invoices--v2"
    />
  ),
  file: (
    <img
      width="50"
      height="50"
      src="https://img.icons8.com/ios/50/file--v1.png"
      alt="file--v1"
    />
  ),
  image: (
    <img
      width="80"
      height="80"
      src="https://img.icons8.com/officel/80/picture.png"
      alt="picture"
    />
  ),
  video: (
    <img
      width="48"
      height="48"
      src="https://img.icons8.com/color/48/video.png"
      alt="video"
    />
  ),
};

export function MediaThumbIcon({
  type,
  className,
}: {
  type: MediaFsNodeType;
  className?: string;
}) {
  const img = mediaThumbIcons[type];
  return <div className={className}>{img}</div>;
}
