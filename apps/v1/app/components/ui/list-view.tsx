import { MediaThumbIcon } from "@/app/components/ui/thumb";
import { MediaFsNode } from "@/app/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/components/ui/table";

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
          <MediaThumbIcon node={node} className="w-6 h-6" />
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
