import { MediaThumb } from "@/app/components/ui/thumb";
import { getClientExplorerPath } from "@/app/lib/path-helpers";
import { MediaFsNode } from "@/app/lib/types";
import Link from "next/link";
import { memo } from "react";
import { CellComponentProps, Grid } from "react-window";

type GridViewProps = {
  nodes: MediaFsNode[];
  columnCount: number;
  columnWidth: number;
  rowHeight: number;
  onFileOpen?: (node: MediaFsNode) => void;
};

export const GridView = memo(function GridView1({
  nodes,
  columnCount,
  columnWidth,
  rowHeight,
  onFileOpen,
}: GridViewProps) {
  const rowCount = Math.ceil(nodes.length / columnCount);

  const Cell = ({ columnIndex, rowIndex, style }: CellComponentProps) => {
    const index = rowIndex * columnCount + columnIndex;

    if (index >= nodes.length) {
      return <div style={style} />;
    }

    const node = nodes[index];

    const handleOpen =
      !node.isDirectory && onFileOpen ? () => onFileOpen(node) : undefined;

    return (
      <div style={style} className="overflow-hidden p-1">
        <div className="aspect-square w-full overflow-hidden rounded-lg border bg-muted">
          <ThumbItem
            node={node}
            width={columnWidth}
            height={rowHeight - 20}
            className="w-full h-full object-cover cursor-pointer"
            onOpen={handleOpen}
          />
        </div>
        <div className="mt-1 truncate text-center text-xs">{node.name}</div>
      </div>
    );
  };

  return (
    <Grid
      columnCount={columnCount}
      rowCount={rowCount}
      columnWidth={columnWidth}
      rowHeight={rowHeight}
      cellComponent={Cell}
      cellProps={{}}
    />
  );
});

function ThumbItem({
  node,
  width,
  height,
  className,
  onOpen,
}: {
  node: MediaFsNode;
  width?: number;
  height?: number;
  className?: string;
  onOpen?: () => void;
}) {
  // DirectoryItem
  if (node.isDirectory) {
    const href = getClientExplorerPath(node.path);
    return (
      <Link href={href} className="cursor-pointer">
        <MediaThumb node={node} width={width} height={height} />
      </Link>
    );
  }

  // FileItem
  return (
    <MediaThumb
      node={node}
      onOpen={onOpen}
      width={width}
      height={height}
      className={className}
    />
  );
}
