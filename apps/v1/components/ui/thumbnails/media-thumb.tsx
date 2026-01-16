/* eslint-disable @next/next/no-img-element */
import { enqueueThumbJob } from "@/actions/thumb-actions";
import { FallbackImage } from "@/components/ui/images/fallback-image";
import { useThumbEventObserver } from "@/hooks/use-thumb-event-observer";
import { MediaFsNodeType, MediaNode } from "@/lib/media/types";
import { encodePath } from "@/lib/path/encoder";
import { getApiThumbUrl, getParentDirPath } from "@/lib/path/helpers";
import { cn } from "@/shadcn/lib/utils";
import { memo, ReactNode, useCallback, useState } from "react";

type MediaThumbProps = {
  node: MediaNode;
  className?: string;
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
};

export const MediaThumb = memo(function MediaThumb1({
  node,
  className,
  onLoad,
}: MediaThumbProps) {
  switch (node.type) {
    case "image":
    case "video":
      return (
        <MediaThumbImage node={node} className={className} onLoad={onLoad} />
      );

    default:
      return (
        <div
          className={cn(
            "flex h-full w-full items-center justify-center",
            className
          )}
        >
          <MediaThumbIcon type={node.type} />
        </div>
      );
  }
});

function MediaThumbImage({
  node,
  className,
  onLoad,
}: {
  node: MediaNode;
  className?: string;
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [version, setVersion] = useState(0);
  const [requested, setRequested] = useState(false);

  const update = () => {
    setVersion(Date.now());
    setIsProcessing(false);
    setRequested(false);
  };

  // サムネイル作成完了イベントの監視
  useThumbEventObserver((event) => {
    if (!isProcessing) return; // イベント発行していない場合は無視

    console.log("Event received:", event, "Node path:", node.path);

    const { filePath, dirPath } = event;

    if (filePath && filePath === node.path) {
      // ファイル一致なら即時
      update();
      return; // 処理完了したので抜ける
    }

    if (dirPath && dirPath === getParentDirPath(node.path)) {
      // ディレクトリ一致なら少し待つ
      setTimeout(update, 300); // 念のため少し長めに
    }
  });

  // サムネイル作成依頼イベントを発行
  const handleError = useCallback(async () => {
    if (requested) return;
    setRequested(true);
    setIsProcessing(true);

    try {
      await enqueueThumbJob(getParentDirPath(node.path));
    } catch (e) {
      console.error("Failed to enqueue thumb job", e);
      setIsProcessing(false);
      setRequested(false); // 失敗時は再試行可能にする
    }
  }, [node.path, requested]);

  const thumbSrc = getApiThumbUrl(encodePath(node.path));

  return (
    <FallbackImage
      key={`${node.path}-${version}`}
      src={thumbSrc}
      alt={node.name}
      width={200}
      height={200}
      className={cn(
        "transition-transform duration-500 hover:scale-110",
        className
      )}
      draggable={false}
      onError={() => void handleError()} // 画像がなかったら発火
      onLoad={onLoad}
      loading="lazy"
      fallback={
        <div
          className={cn(
            "flex h-full w-full items-center justify-center",
            className
          )}
        >
          {isProcessing ? (
            <span className="animate-pulse">Processing...</span>
          ) : (
            <MediaThumbIcon type={node.type} />
          )}
        </div>
      }
    />
  );
}

const mediaThumbIcons: Record<MediaFsNodeType, ReactNode> = {
  audio: (
    <img
      width="64"
      height="64"
      src="https://img.icons8.com/?size=100&id=eZkFHHHAXhtt&format=png&color=000000"
      alt="audio-wave"
    />
  ),
  directory: (
    <img
      width="48"
      height="48"
      src="https://img.icons8.com/fluency/48/folder-invoices--v2.png"
      alt="folder-invoices--v2"
    />
  ),
  file: (
    <img
      width="50"
      height="50"
      src="https://img.icons8.com/?size=100&id=12053&format=png&color=000000"
      alt="file--v1"
    />
  ),
  image: (
    <img
      width="80"
      height="80"
      src="https://img.icons8.com/officel/80/picture.png"
      alt="picture"
    />
  ),
  video: (
    <img
      width="48"
      height="48"
      src="https://img.icons8.com/color/48/video.png"
      alt="video"
    />
  ),
};

export function MediaThumbIcon({
  type,
  className,
}: {
  type: MediaFsNodeType;
  className?: string;
}) {
  const img = mediaThumbIcons[type];
  return <div className={className}>{img}</div>;
}
