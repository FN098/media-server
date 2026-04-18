import { enqueueCreateThumbsJobAction } from "@/actions/thumb-actions";
import { FallbackImage } from "@/components/ui/images/fallback-image";
import { MediaThumbIcon } from "@/components/ui/thumbnails/media-thumb-icons";
import { useThumbEventObserver } from "@/hooks/use-thumb-event-observer";
import { MediaNode } from "@/lib/media/types";
import { getParentDirPath } from "@/lib/path/helpers";
import { resolveMediaThumbUrl } from "@/lib/url/resolver";
import { cn } from "@/shadcn/lib/utils";
import { useCallback, useRef, useState } from "react";

interface MediaThumbImageProps {
  node: MediaNode;
  previewPath?: string | null;
  className?: string;
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

const MAX_RETRY_COUNT = 1;

export function MediaThumbImage({
  node,
  className,
  previewPath,
  onLoad,
  onError,
}: MediaThumbImageProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [version, setVersion] = useState(0);
  const [requested, setRequested] = useState(false);

  const retryCountRef = useRef(0);
  const [isError, setIsError] = useState(false);

  const update = () => {
    setVersion(Date.now());
    setIsProcessing(false);
    setRequested(false);
    setIsError(false);
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
  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      // すでにリクエスト中、または上限に達している場合は何もしない
      if (requested || retryCountRef.current >= MAX_RETRY_COUNT) {
        if (retryCountRef.current >= MAX_RETRY_COUNT) {
          setIsError(true);
          setIsProcessing(false);
          onError?.(e);
        }
        return;
      }

      setRequested(true);
      setIsProcessing(true);
      retryCountRef.current += 1;

      try {
        // サムネイルを作成するディレクトリを enqueue
        const targetDir = previewPath
          ? getParentDirPath(previewPath)
          : getParentDirPath(node.path);

        void enqueueCreateThumbsJobAction(targetDir);
      } catch (e) {
        console.error("Failed to enqueue thumb job", e);
        setIsProcessing(false);
        setRequested(false); // 失敗時は再試行可能にする
      }
    },
    [node.path, onError, previewPath, requested]
  );

  // 表示するソースの決定
  const displayPath = previewPath || node.path;
  const thumbSrc = resolveMediaThumbUrl(
    { path: displayPath },
    { version: node.mtime.getTime() }
  );

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-1">
        {/* <MediaThumbIcon type={node.type} className="opacity-50" /> */}
        <span className="text-[10px] text-destructive">Error</span>
      </div>
    );
  }

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
      onError={handleError} // 画像がなかったら発火
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
