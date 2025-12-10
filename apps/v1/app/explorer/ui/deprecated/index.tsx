import { MediaThumb } from "@/app/explorer/ui/thumb";
import { MediaFsNode } from "@/app/lib/media/types";
import { Button } from "@/shadcn/components/ui/button";
import {
  ArrowLeftIcon,
  FileIcon,
  FolderIcon,
  ImageIcon,
  MusicIcon,
  VideoIcon,
} from "lucide-react";

function GridItem({
  node,
  onOpen,
}: {
  node: MediaFsNode;
  onOpen: (p: string) => void;
}) {
  return (
    <div
      onClick={() => node.isDirectory && onOpen(node.path)}
      className="cursor-pointer"
    >
      <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
        <MediaThumb node={node} />
      </div>
      <div className="mt-1 truncate text-center text-xs">{node.name}</div>
    </div>
  );
}

function FileRow({
  node,
  onOpen,
}: {
  node: MediaFsNode;
  onOpen: (p: string) => void;
}) {
  return (
    <div
      onClick={() => node.isDirectory && onOpen(node.path)}
      className="grid cursor-pointer grid-cols-4 items-center px-4 py-2 text-sm hover:bg-blue-100"
    >
      <div className="flex items-center gap-2">
        {ThumbIcon(node)}
        {node.name}
      </div>
      <div>{node.isDirectory ? "Folder" : node.type}</div>
      <div>{node.updatedAt ?? "-"}</div>
      <div>{node.size ? `${Math.round(node.size / 1024)} KB` : "-"}</div>
    </div>
  );
}

function GoBackButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <Button size="icon" variant="ghost" disabled={disabled} onClick={onClick}>
      <ArrowLeftIcon />
    </Button>
  );
}

function ThumbIcon(e: MediaFsNode) {
  switch (e.type) {
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
