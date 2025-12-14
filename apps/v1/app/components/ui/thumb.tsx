import { FallbackImage } from "@/app/components/ui/fallback-image";
import { getMediaUrl, getThumbUrl } from "@/app/lib/path-helpers";
import { MediaFsNode } from "@/app/lib/types";
import { cn } from "@/shadcn/lib/utils";
import {
  FileIcon,
  FolderIcon,
  ImageIcon,
  MusicIcon,
  VideoIcon,
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
  if (node.isDirectory) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-muted",
          className
        )}
      >
        <ThumbIcon node={node} />
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
            <ThumbIcon node={node} />
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
        <ThumbIcon node={node} />
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
      <ThumbIcon node={node} />
    </div>
  );
});

function ThumbIcon({ node }: { node: MediaFsNode }) {
  switch (node.type) {
    case "directory":
      return <FolderIcon className="h-6 w-6 md:h-12 md:w-12 text-blue-600" />;
    case "image":
      return <ImageIcon className="h-6 w-6 md:h-12 md:w-12 text-purple-600" />;
    case "video":
      return <VideoIcon className="h-6 w-6 md:h-12 md:w-12 text-green-600" />;
    case "audio":
      return <MusicIcon className="h-6 w-6 md:h-12 md:w-12 text-orange-600" />;
    default:
      return <FileIcon className="h-6 w-6 md:h-12 md:w-12 text-gray-600" />;
  }
}
