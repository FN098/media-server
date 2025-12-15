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
import { useIsMobile } from "@/shadcn/hooks/use-mobile";
import { cn } from "@/shadcn/lib/utils";
import { memo, useRef } from "react";

type ListViewProps = {
  nodes: MediaFsNode[];
  onOpen?: (target: MediaFsNode) => void;
};

export const ListView = memo(function ListView1({
  nodes,
  onOpen,
}: ListViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  return (
    <div ref={containerRef} className="w-full h-full">
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
          {nodes.map((node) => (
            <RowItem
              key={node.path}
              node={node}
              className={cn("hover:bg-blue-100 active:bg-blue-200")}
              onClick={() => isMobile && onOpen?.(node)}
              onDoubleClick={() => !isMobile && onOpen?.(node)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
});

function RowItem({
  node,
  onClick,
  onDoubleClick,
  className,
}: {
  node: MediaFsNode;
  onClick?: () => void;
  onDoubleClick?: () => void;
  className?: string;
}) {
  return (
    <TableRow
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={className}
    >
      <TableCell>
        <div className="flex items-center gap-2">
          <MediaThumbIcon type={node.type} className="w-6 h-6" />
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
