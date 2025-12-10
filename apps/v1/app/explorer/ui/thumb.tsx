import { MediaFsNode } from "@/app/lib/media/types";
import { FileIcon, FolderIcon } from "lucide-react";
import Image from "next/image";
import { memo } from "react";

type MediaThumbProps = {
  node: MediaFsNode;
  onOpen?: (node: MediaFsNode) => void;
  width?: number;
  height?: number;
};

export const MediaThumb = memo(function MediaThumb1({
  node,
  onOpen,
  width = 200,
  height = 200,
}: MediaThumbProps) {
  const handleClick = () => {
    onOpen?.(node);
  };

  if (node.isDirectory) {
    return (
      <div
        className="flex h-full w-full items-center justify-center bg-muted"
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
        className="object-cover"
        loading="lazy"
        onClick={handleClick}
      />
    );
  }

  if (node.type === "video") {
    return (
      <div className="relative w-full h-full">
        <Image
          src={`/api/media/.thumbs/${node.path}.jpg`}
          alt={node.name}
          width={width}
          height={height}
          className="object-cover cursor-pointer"
          onClick={handleClick}
          // TODO: 動画再生は親でやる
          // onClick={() => {
          //   const video = document.createElement("video");
          //   video.src = `/api/media/${node.path}`;
          //   video.controls = true;
          //   video.autoplay = true;
          //   video.muted = true;
          //   video.style.width = "100%";
          //   video.style.height = "100%";
          //   const container = document.getElementById(`video-${node.path}`);
          //   if (container) container.innerHTML = "";
          //   container?.appendChild(video);
          // }}
        />
        <div id={`video-${node.path}`} className="absolute inset-0" />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-muted">
      <FileIcon className="h-10 w-10 text-gray-600" />
    </div>
  );
});
