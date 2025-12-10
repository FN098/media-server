import { MediaThumb } from "@/app/explorer/ui/thumb";
import { MediaFsNode } from "@/app/lib/media/types";
import Link from "next/link";
import { memo } from "react";
import { CellComponentProps, Grid } from "react-window";

type GridViewProps = {
  data: MediaFsNode[];
  minColumnWidth?: number;
  rowHeight?: number;
};

function _GridView({
  data,
  minColumnWidth = 220,
  rowHeight = 240,
}: GridViewProps) {
  const columnCount = 6;
  const rowCount = Math.ceil(data.length / columnCount);

  const Cell = ({ columnIndex, rowIndex, style }: CellComponentProps) => {
    const index = rowIndex * columnCount + columnIndex;

    if (index >= data.length) {
      return <div style={style} />;
    }

    const node = data[index];

    return (
      <div style={{ ...style, padding: 4 }}>
        <MediaLink node={node} />
        <div className="mt-1 truncate text-center text-xs">{node.name}</div>
      </div>
    );
  };

  return (
    <Grid
      columnCount={columnCount}
      rowCount={rowCount}
      columnWidth={minColumnWidth}
      rowHeight={rowHeight}
      cellComponent={Cell}
      cellProps={{}}
    />
  );
}

function MediaLink({ node }: { node: MediaFsNode }) {
  if (!node.isDirectory) {
    return (
      <MediaThumb
        node={node}
        onOpen={() => {
          // TODO: ファイルの場合はビューア起動して画像、動画、音声を再生＋左右キーで次・前のファイルに移動
        }}
      />
    );
  }

  return (
    <Link
      href={node.isDirectory ? "/explorer/" + node.path : "#"}
      className="cursor-pointer"
    >
      <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
        <MediaThumb node={node} />
      </div>
    </Link>
  );
}

export const GridView = memo(_GridView);
