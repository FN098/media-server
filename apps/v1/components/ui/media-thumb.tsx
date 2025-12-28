/* eslint-disable @next/next/no-img-element */
import { FallbackImage } from "@/components/ui/fallback-image";
import { MediaFsNodeType, MediaNode } from "@/lib/media/types";
import { getParentDirPath, getThumbUrl } from "@/lib/path-helpers";
import { enqueueThumbJobByFilePath } from "@/lib/thumb/actions";
import { useThumbEventObserver } from "@/providers/thumb-event-provider";
import { cn } from "@/shadcn/lib/utils";
import { memo, ReactNode, useCallback, useRef, useState } from "react";

type MediaThumbProps = {
  node: MediaNode;
  className?: string;
};

export const MediaThumb = memo(function MediaThumb1({
  node,
  className,
}: MediaThumbProps) {
  switch (node.type) {
    case "image":
    case "video":
      return <MediaThumbImage node={node} className={className} />;

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
}: {
  node: MediaNode;
  className?: string;
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [version, setVersion] = useState(0);
  const requestSent = useRef(false);

  // サムネイル作成完了イベントの監視
  useThumbEventObserver((event) => {
    const parentDir = getParentDirPath(node.path);
    if (event.dirPath === parentDir || event.filePath === node.path) {
      setVersion(Date.now());
      setIsProcessing(false);
    }
  });

  // サムネイル作成依頼イベントを発行
  const handleError = useCallback(async () => {
    if (requestSent.current) return;
    requestSent.current = true;
    setIsProcessing(true);
    await enqueueThumbJobByFilePath(node.path);
  }, [node.path]);

  // src に query を付けて再読み込みを強制
  const thumbSrc = `${getThumbUrl(node.path)}?v=${version}`;

  return (
    <FallbackImage
      src={thumbSrc}
      alt={node.name}
      fill
      className={cn(
        "transition-transform duration-500 hover:scale-110",
        className
      )}
      onError={() => void handleError()} // 画像がなかったら発火
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
      src="https://img.icons8.com/ios/50/file--v1.png"
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
