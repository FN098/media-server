import { MediaThumb } from "@/app/explorer/ui/thumb";
import { MediaFsNode } from "@/app/lib/media/types";
import Link from "next/link";
import { memo } from "react";
import { CellComponentProps, Grid } from "react-window";

type GridViewProps = {
  data: MediaFsNode[];
  columnCount?: number;
  columnWidth?: number;
  rowHeight?: number;
};

export const GridView = memo(function GridView1({
  data,
  columnCount = 6,
  columnWidth = 220,
  rowHeight = 240,
}: GridViewProps) {
  const rowCount = Math.ceil(data.length / columnCount);

  const Cell = ({ columnIndex, rowIndex, style }: CellComponentProps) => {
    const index = rowIndex * columnCount + columnIndex;

    if (index >= data.length) {
      return <div style={style} />;
    }

    const node = data[index];

    return (
      <div style={style} className="overflow-hidden p-1">
        <div className="aspect-square w-full overflow-hidden rounded-lg border bg-muted">
          <ThumbItem node={node} width={columnWidth} height={rowHeight - 20} />
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
}: {
  node: MediaFsNode;
  width?: number;
  height?: number;
}) {
  // DirectoryItem
  if (node.isDirectory) {
    const href = "/explorer/" + node.path;
    return (
      <Link href={href} className="cursor-pointer">
        <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
          <MediaThumb node={node} width={width} height={height} />
        </div>
      </Link>
    );
  }

  // MediaItem
  return (
    <MediaThumb
      node={node}
      onOpen={() => {
        // TODO: ファイルの場合はビューア起動して画像、動画、音声を再生＋左右キーで次・前のファイルに移動
      }}
      width={width}
      height={height}
    />
  );
}
