"use client";

import { TextWithTooltip } from "@/app/components/ui/text-with-tooltip";
import { MediaThumb } from "@/app/components/ui/thumb";
import { MediaFsNode } from "@/app/lib/media/types";
import { useIsMobile } from "@/shadcn/hooks/use-mobile";
import { cn } from "@/shadcn/lib/utils";
import { memo, useRef } from "react";
import { CellComponentProps, Grid, useGridRef } from "react-window";

type GridViewProps = {
  nodes: MediaFsNode[];
  columnCount: number;
  columnWidth: number;
  rowHeight: number;
  onOpen?: (target: MediaFsNode) => void;
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
  const containerRef = useRef<HTMLDivElement>(null);

  const Cell = ({ columnIndex, rowIndex, style }: CellComponentProps) => {
    const isMobile = useIsMobile();

    const index = rowIndex * columnCount + columnIndex;
    if (index >= nodes.length) return <div style={style} />;

    const node = nodes[index];

    return (
      <div style={style} className="p-1">
        <div
          className={cn(
            "aspect-square w-full overflow-hidden rounded-lg border bg-muted select-none",
            "hover:bg-blue-100 active:bg-blue-200"
          )}
          onClick={() => isMobile && onOpen?.(node)}
          onDoubleClick={() => !isMobile && onOpen?.(node)}
        >
          <MediaThumb
            node={node}
            width={columnWidth}
            height={rowHeight - 20}
            className="w-full h-full object-cover"
          />
        </div>
        <TextWithTooltip text={node.name} className="text-center text-xs" />
      </div>
    );
  };

  return (
    <div ref={containerRef} className="w-full h-full">
      <Grid
        gridRef={gridRef}
        columnCount={columnCount}
        rowCount={rowCount}
        columnWidth={columnWidth}
        rowHeight={rowHeight}
        cellComponent={Cell}
        cellProps={{}}
      />
    </div>
  );
});
