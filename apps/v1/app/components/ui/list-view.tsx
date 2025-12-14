import { MediaThumbIcon } from "@/app/components/ui/thumb";
import { MediaFsNode } from "@/app/lib/types";
import { useMediaFsNodeSelection } from "@/app/providers/selection-provider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/components/ui/table";
import { cn } from "@/shadcn/lib/utils";
import { memo, useEffect, useRef } from "react";

type ListViewProps = {
  nodes: MediaFsNode[];
  onOpen?: (target: MediaFsNode) => void;
};

export const ListView = memo(function ListView1({
  nodes,
  onOpen,
}: ListViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { select, clear, isSelected } = useMediaFsNodeSelection();

  // 外部クリックで選択解除
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        clear();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [clear]);

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
              className={cn(
                "hover:bg-blue-100",
                isSelected(node) && "bg-blue-100"
              )}
              onClick={() => select(node)}
              onDoubleClick={() => onOpen?.(node)}
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
