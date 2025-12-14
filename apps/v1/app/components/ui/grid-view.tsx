import { TextWithTooltip } from "@/app/components/ui/text-with-tooltip";
import { MediaThumb } from "@/app/components/ui/thumb";
import { MediaFsNode } from "@/app/lib/types";
import Link from "next/link";
import { memo, useEffect, useState } from "react";
import { CellComponentProps, Grid, useGridRef } from "react-window";

type GridViewProps = {
  nodes: MediaFsNode[];
  columnCount: number;
  columnWidth: number;
  rowHeight: number;
  getNodeHref: (node: MediaFsNode) => string;
  onFileOpen?: (node: MediaFsNode) => void;
};

export const GridView = memo(function GridView1({
  nodes,
  columnCount,
  columnWidth,
  rowHeight,
  getNodeHref,
  onFileOpen,
}: GridViewProps) {
  const rowCount = Math.ceil(nodes.length / columnCount);
  const gridRef = useGridRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Grid 内部スクロール監視
  const onScroll = () => {
    const target = gridRef.current?.element;
    if (!target) return;

    const rowIndex = Math.floor(target.scrollTop / rowHeight);
    const columnIndex = Math.floor(target.scrollLeft / columnWidth);
    const index = rowIndex * columnCount + columnIndex;
    setCurrentIndex(index);
  };

  // 列数変更時に現在のノード位置を復元
  useEffect(() => {
    const index = currentIndex;
    const rowIndex = Math.floor(index / columnCount);
    const columnIndex = index % columnCount;

    gridRef.current?.scrollToCell({
      rowIndex,
      columnIndex,
      rowAlign: "start",
      columnAlign: "start",
      behavior: "auto",
    });
  }, [columnCount, currentIndex, gridRef]);

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
            getNodeHref={getNodeHref}
            onOpen={handleOpen}
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
    <div className="overflow-hidden w-full h-full">
      <Grid
        gridRef={gridRef}
        columnCount={columnCount}
        rowCount={rowCount}
        columnWidth={columnWidth}
        rowHeight={rowHeight}
        cellComponent={Cell}
        cellProps={{}}
        onScroll={onScroll}
      />
    </div>
  );
});

type ThumbItemProps = {
  node: MediaFsNode;
  width?: number;
  height?: number;
  className?: string;
  getNodeHref: (node: MediaFsNode) => string;
  onOpen?: () => void;
};

function ThumbItem({
  node,
  width,
  height,
  className,
  getNodeHref,
  onOpen,
}: ThumbItemProps) {
  // DirectoryItem
  if (node.isDirectory) {
    const href = getNodeHref(node);
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
