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
  onOpen?: (node: MediaFsNode) => void;
  width?: number;
  height?: number;
  className?: string;
};

export const MediaThumb = memo(function MediaThumb1({
  node,
  onOpen,
  width,
  height,
  className,
}: MediaThumbProps) {
  const handleClick = onOpen ? () => onOpen(node) : undefined;

  const iconSize = "h-6 w-6 md:h-12 md:w-12";

  if (node.isDirectory) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-muted",
          className
        )}
        onClick={handleClick}
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
        onClick={handleClick}
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
        onClick={handleClick}
        fallback={
          <div
            className={cn(
              "flex h-full w-full items-center justify-center bg-muted",
              className
            )}
            onClick={handleClick}
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
        onClick={handleClick}
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
