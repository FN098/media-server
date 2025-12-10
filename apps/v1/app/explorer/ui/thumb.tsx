import { MediaFsNode } from "@/app/lib/media/types";
import { cn } from "@/shadcn/lib/utils";
import { FileIcon, FolderIcon } from "lucide-react";
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
        <FolderIcon className="h-12 w-12 text-blue-600" />
      </div>
    );
  }

  if (node.type === "image") {
    return (
      <Image
        src={`/api/media/${node.path}`}
        // TODO: サムネイルの自動生成
        // src={`/api/media/.thumbs/${node.path}.jpg`}
        alt={node.name}
        width={width}
        height={height}
        className={cn("object-cover", className)}
        loading="lazy"
        onClick={handleClick}
      />
    );
  }

  if (node.type === "video") {
    return (
      <Image
        src={`/api/media/.thumbs/${node.path}.jpg`}
        alt={node.name}
        width={width}
        height={height}
        className={cn("object-cover cursor-pointer", className)}
        onClick={handleClick}
      />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-muted">
      <FileIcon className={cn("h-10 w-10 text-gray-600", className)} />
    </div>
  );
});
