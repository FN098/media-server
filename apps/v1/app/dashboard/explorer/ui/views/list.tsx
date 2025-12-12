import { MediaFsNode } from "@/app/lib/media/types";
import { EXPLORER_PATH } from "@/app/lib/path";
import { Card, CardContent } from "@/shadcn/components/ui/card";
import {
  FileIcon,
  FolderIcon,
  ImageIcon,
  MusicIcon,
  VideoIcon,
} from "lucide-react";
import Link from "next/link";

export function ListView({
  data,
}: {
  data: MediaFsNode[];
  onOpen?: (target: MediaFsNode) => void;
}) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="grid grid-cols-4 px-4 py-2 bg-muted font-semibold text-sm">
          <div>Name</div>
          <div>Type</div>
          <div>Updated</div>
          <div>Size</div>
        </div>
        {data.map((node) => (
          <Link
            key={node.path}
            href={node.isDirectory ? EXPLORER_PATH + node.path : "#"}
            className="grid grid-cols-4 px-4 py-2 items-center hover:bg-blue-100"
          >
            <div className="flex gap-2">
              <ThumbIcon node={node} />
              <span className="truncate">{node.name}</span>
            </div>
            <div>{node.isDirectory ? "Folder" : node.type}</div>
            <div>{node.updatedAt ?? "-"}</div>
            <div>{node.size ? `${Math.round(node.size / 1024)} KB` : "-"}</div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

function ThumbIcon({ node }: { node: MediaFsNode }) {
  switch (node.type) {
    case "directory":
      return <FolderIcon className="shrink-0 h-6 w-6 text-blue-600" />;
    case "image":
      return <ImageIcon className="shrink-0 h-6 w-6 text-purple-600" />;
    case "video":
      return <VideoIcon className="shrink-0 h-6 w-6 text-green-600" />;
    case "audio":
      return <MusicIcon className="shrink-0 h-6 w-6 text-orange-600" />;
    default:
      return <FileIcon className="shrink-0 h-6 w-6 text-gray-600" />;
  }
}
