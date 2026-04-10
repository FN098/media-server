/* eslint-disable @next/next/no-img-element */
import { enqueueThumbJob } from "@/actions/thumb-actions";
import { FallbackImage } from "@/components/ui/images/fallback-image";
import { useThumbEventObserver } from "@/hooks/use-thumb-event-observer";
import { MediaFsNodeType, MediaNode } from "@/lib/media/types";
import { getParentDirPath } from "@/lib/path/helpers";
import { resolveMediaThumbUrl } from "@/lib/url/resolver";
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
  // メディア
  if (node.type === "image" || node.type === "video" || node.type === "audio") {
    return (
      <MediaThumbImage
        node={node}
        previewPath={node.previewPath}
        className={className}
        onLoad={onLoad}
      />
    );
  }

  // ディレクトリ
  if (node.type === "directory") {
    return (
      <div className="relative w-full h-full">
        <MediaThumbImage
          node={node}
          previewPath={node.previewPath}
          className={className}
          onLoad={onLoad}
        />

        <div className="absolute bottom-8 left-2 z-20 flex items-center justify-center p-1.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 shadow-lg">
          <MediaThumbIcon type="directory" className="w-4 h-4 opacity-90" />
        </div>
      </div>
    );
  }

  // デフォルト（プレビューがない、またはその他のファイル）
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
});

function MediaThumbImage({
  node,
  className,
  previewPath,
  onLoad,
}: {
  node: MediaNode;
  previewPath?: string | null;
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
    if (!isProcessing) return;
    const targetPath = previewPath || node.path; // プレビュー中ならそのパスを優先

    if (event.filePath === targetPath) {
      update();
    } else if (event.dirPath === getParentDirPath(targetPath)) {
      setTimeout(update, 300);
    }
  });

  // サムネイル作成依頼イベントを発行
  const handleError = useCallback(async () => {
    if (requested) return;
    setRequested(true);
    setIsProcessing(true);

    try {
      // フォルダ自体のサムネ生成が必要な場合は node.path、
      // フォルダ内の特定ファイルのサムネが必要な場合はその親ディレクトリを enqueue
      const targetDir = previewPath
        ? getParentDirPath(previewPath)
        : getParentDirPath(node.path);
      await enqueueThumbJob(targetDir);
    } catch (e) {
      console.error("Failed to enqueue thumb job", e);
      setIsProcessing(false);
      setRequested(false); // 失敗時は再試行可能にする
    }
  }, [node.path, previewPath, requested]);

  // 表示するソースの決定
  const displayPath = previewPath || node.path;
  const thumbSrc = resolveMediaThumbUrl({ path: displayPath });

  return (
    <FallbackImage
      key={`${displayPath}-${version}`}
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
  return (
    <div className={cn("inline-flex items-center justify-center", className)}>
      {img}
    </div>
  );
}
