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
import { useEffect, useRef, useState } from "react";

type ListViewProps = {
  nodes: MediaFsNode[];
  onOpen?: (target: MediaFsNode) => void;
};

// TODO: memo化
export function ListView({ nodes, onOpen }: ListViewProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 外部クリックで選択解除
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setSelectedIndex(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
          {nodes.map((node, index) => (
            <RowItem
              key={node.path}
              node={node}
              isSelected={selectedIndex === index}
              onClick={() => setSelectedIndex(index)}
              onOpen={onOpen}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function RowItem({
  node,
  isSelected,
  onClick,
  onOpen,
}: {
  node: MediaFsNode;
  isSelected: boolean;
  onClick: () => void;
  onOpen?: (target: MediaFsNode) => void;
}) {
  const handleDoubleClick = () => {
    onOpen?.(node);
  };

  return (
    <TableRow
      className={`hover:bg-blue-100 ${isSelected ? "bg-blue-200" : ""}`}
      onClick={onClick}
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
