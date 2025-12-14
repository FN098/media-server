import { MediaFsNode } from "@/app/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/components/ui/table";
import {
  FileIcon,
  FolderIcon,
  ImageIcon,
  MusicIcon,
  VideoIcon,
} from "lucide-react";

type ListViewProps = {
  nodes: MediaFsNode[];
  onOpen?: (target: MediaFsNode) => void;
};

export function ListView({ nodes, onOpen }: ListViewProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead>Size</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {nodes.map((node) => {
          return <RowItem key={node.path} node={node} onOpen={onOpen} />;
        })}
      </TableBody>
    </Table>
  );
}

function RowItem({
  node,
  onOpen,
}: {
  node: MediaFsNode;
  onOpen?: (target: MediaFsNode) => void;
}) {
  const handleDoubleClick = onOpen ? () => onOpen(node) : undefined;

  return (
    <TableRow
      className="hover:bg-blue-100 cursor-pointer"
      onDoubleClick={handleDoubleClick}
    >
      <TableCell>
        <div className="flex items-center gap-2">
          <ThumbIcon node={node} />
          <span className="truncate">{node.name}</span>
        </div>
      </TableCell>
      <TableCell>{node.isDirectory ? "Folder" : node.type}</TableCell>
      <TableCell>{node.updatedAt ?? "-"}</TableCell>
      <TableCell>
        {node.size ? `${Math.round(node.size / 1024)} KB` : "-"}
      </TableCell>
    </TableRow>
  );
}

function ThumbIcon({ node }: { node: MediaFsNode }) {
  switch (node.type) {
    case "directory":
      return <FolderIcon className="h-6 w-6 text-blue-600" />;
    case "image":
      return <ImageIcon className="h-6 w-6 text-purple-600" />;
    case "video":
      return <VideoIcon className="h-6 w-6 text-green-600" />;
    case "audio":
      return <MusicIcon className="h-6 w-6 text-orange-600" />;
    default:
      return <FileIcon className="h-6 w-6 text-gray-600" />;
  }
}
