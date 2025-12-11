import { MediaFsNode } from "@/app/lib/media/types";
import FallbackImage from "@/app/ui/fallback-image";
import { useIsMobile } from "@/shadcn/hooks/use-mobile";
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
  width = 200,
  height = 200,
  className,
}: MediaThumbProps) {
  const isMobile = useIsMobile();

  const handleClick = () => {
    onOpen?.(node);
  };

  if (node.isDirectory) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-muted",
          className
        )}
        onClick={handleClick}
      >
        <FolderIcon
          className={cn("h-12 w-12 text-blue-600", isMobile && "h-6 w-6")}
        />
      </div>
    );
  }

  if (node.type === "image") {
    return (
      <Image
        src={`/api/media/${node.path}`}
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
        src={`/api/media/.thumbs/${node.path}.jpg`}
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
            <FilmIcon
              className={cn("h-12 w-12 text-gray-600", isMobile && "h-6 w-6")}
            />
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
        <AudioWaveformIcon
          className={cn("h-12 w-12 text-gray-600", isMobile && "h-6 w-6")}
        />
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
      <FileIcon
        className={cn("h-12 w-12 text-gray-600", isMobile && "h-6 w-6")}
      />
    </div>
  );
});
