import { MediaFsNode } from "@/app/lib/media/types";
import { FileIcon, FolderIcon } from "lucide-react";
import Image from "next/image";

export function MediaThumb({ node }: { node: MediaFsNode }) {
  if (node.isDirectory) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted">
        <FolderIcon className="h-12 w-12 text-blue-600" />
      </div>
    );
  }

  if (node.type === "image") {
    return (
      <div className="relative h-full w-full">
        <Image
          src={`/api/media/${node.path}`}
          alt={node.name}
          width="500"
          height="500"
          className="object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  if (node.type === "video") {
    return (
      <video
        src={`/api/media/${node.path}`}
        poster={`/api/media/.thumbs/${node.path}.jpg`}
        className="h-full w-full object-cover"
        muted
        preload="metadata"
      />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-muted">
      <FileIcon className="h-10 w-10 text-gray-600" />
    </div>
  );
}
