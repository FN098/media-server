import { FallbackImage } from "@/app/components/ui/fallback-image";
import { getMediaUrl, getThumbUrl } from "@/app/lib/path-helpers";
import { MediaFsNode } from "@/app/lib/types";
import { cn } from "@/shadcn/lib/utils";
import {
  AudioWaveformIcon,
  FileIcon,
  FilmIcon,
  FolderIcon,
} from "lucide-react";
import Image from "next/image";
import { memo } from "react";

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
  const iconSize = "h-6 w-6 md:h-12 md:w-12";

  if (node.isDirectory) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-muted",
          className
        )}
      >
        <FolderIcon className={cn("text-blue-600", iconSize)} />
      </div>
    );
  }

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
  }

  if (node.type === "video") {
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
              "flex h-full w-full items-center justify-center bg-muted",
              className
            )}
          >
            <FilmIcon className={cn("text-gray-600", iconSize)} />
          </div>
        }
      />
    );
  }

  if (node.type === "audio") {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-muted",
          className
        )}
      >
        <AudioWaveformIcon className={cn("text-gray-600", iconSize)} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-muted",
        className
      )}
    >
      <FileIcon className={cn("text-gray-600", iconSize)} />
    </div>
  );
});
