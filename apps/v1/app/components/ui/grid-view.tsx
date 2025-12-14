import { TextWithTooltip } from "@/app/components/ui/text-with-tooltip";
import { MediaThumb } from "@/app/components/ui/thumb";
import { MediaFsNode } from "@/app/lib/types";
import { useMediaFsNodeSelection } from "@/app/providers/selection-provider";
import { cn } from "@/shadcn/lib/utils";
import { memo, useEffect, useRef } from "react";
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

  const { select, clear, isSelected } = useMediaFsNodeSelection();

  // 外側クリックで選択解除
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

  const Cell = ({ columnIndex, rowIndex, style }: CellComponentProps) => {
    const index = rowIndex * columnCount + columnIndex;
    if (index >= nodes.length) return <div style={style} />;

    const node = nodes[index];
    console.log(node);

    return (
      <div style={style} className="p-1">
        <div
          className={cn(
            "aspect-square w-full overflow-hidden rounded-lg border bg-muted select-none",
            "hover:bg-blue-100",
            isSelected(node) &&
              "border-blue-500 ring-2 ring-blue-300 bg-blue-100"
          )}
          onClick={() => select(node)}
          onDoubleClick={() => onOpen?.(node)}
        >
          <MediaThumb
            node={node}
            width={columnWidth}
            height={rowHeight - 20}
            className="w-full h-full object-cover"
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
