import { TextWithTooltip } from "@/app/components/ui/text-with-tooltip";
import { MediaThumb } from "@/app/components/ui/thumb";
import { MediaFsNode } from "@/app/lib/types";
import { cn } from "@/shadcn/lib/utils";
import { memo } from "react";
import { CellComponentProps, Grid, useGridRef } from "react-window";

type GridViewProps = {
  nodes: MediaFsNode[];
  columnCount: number;
  columnWidth: number;
  rowHeight: number;
  onOpen?: (node: MediaFsNode) => void;
};

export const GridView = memo(function GridView1({
  nodes,
  columnCount,
  columnWidth,
  rowHeight,
  onOpen,
}: GridViewProps) {
  const rowCount = Math.ceil(nodes.length / columnCount);
  const gridRef = useGridRef(null);

  const Cell = ({ columnIndex, rowIndex, style }: CellComponentProps) => {
    const index = rowIndex * columnCount + columnIndex;

    if (index >= nodes.length) {
      return <div style={style} />;
    }

    const node = nodes[index];

    const handleDoubleClick = onOpen ? () => onOpen(node) : undefined;

    return (
      <div style={style} className="p-1">
        <div
          className="aspect-square w-full overflow-hidden rounded-lg border bg-muted"
          onDoubleClick={handleDoubleClick}
        >
          <ThumbItem
            node={node}
            width={columnWidth}
            height={rowHeight - 20}
            className="w-full h-full object-cover cursor-pointer"
          />
        </div>
        <TextWithTooltip
          text={node.name}
          className="truncate text-center text-xs"
        />
      </div>
    );
  };

  return (
    <Grid
      gridRef={gridRef}
      columnCount={columnCount}
      rowCount={rowCount}
      columnWidth={columnWidth}
      rowHeight={rowHeight}
      cellComponent={Cell}
      cellProps={{}}
    />
  );
});

type ThumbItemProps = {
  node: MediaFsNode;
  width?: number;
  height?: number;
  className?: string;
};

function ThumbItem({ node, width, height, className }: ThumbItemProps) {
  return (
    <MediaThumb
      node={node}
      width={width}
      height={height}
      className={cn("cursor-pointer", className)}
    />
  );
}
