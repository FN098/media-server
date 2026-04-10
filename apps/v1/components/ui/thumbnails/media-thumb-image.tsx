import { enqueueThumbJob } from "@/actions/thumb-actions";
import { MediaThumbIcon } from "@/components/ui/icons/media-thumb-icons";
import { FallbackImage } from "@/components/ui/images/fallback-image";
import { useThumbEventObserver } from "@/hooks/use-thumb-event-observer";
import { MediaNode } from "@/lib/media/types";
import { getParentDirPath } from "@/lib/path/helpers";
import { resolveMediaThumbUrl } from "@/lib/url/resolver";
import { cn } from "@/shadcn/lib/utils";
import { useCallback, useState } from "react";

interface MediaThumbImageProps {
  node: MediaNode;
  previewPath?: string | null;
  className?: string;
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

export function MediaThumbImage({
  node,
  className,
  previewPath,
  onLoad,
}: MediaThumbImageProps) {
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
      // サムネイルを作成するディレクトリを enqueue
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
