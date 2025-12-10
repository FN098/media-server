import { MediaFsNode } from "@/app/lib/media/types";
import { useIsMobile } from "@/shadcn/hooks/use-mobile";
import { cn } from "@/shadcn/lib/utils";
import { FileIcon } from "lucide-react";
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

  const isMobile = useIsMobile();

  if (node.isDirectory) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-muted",
          className
        )}
        onClick={handleClick}
      >
        <FileIcon
          className={cn("h-12 w-12 text-blue-600", isMobile && "h-6 w-6")}
        />
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
        className={className}
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
        className={className}
        onClick={handleClick}
      />
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
