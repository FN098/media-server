import { enqueueThumbJob } from "@/actions/thumb-actions";
import { MediaThumbIcon } from "@/components/ui/icons/media-thumb-icons";
import { FallbackImage } from "@/components/ui/images/fallback-image";
import { useThumbEventObserver } from "@/hooks/use-thumb-event-observer";
import { MediaNode } from "@/lib/media/types";
import { getParentDirPath } from "@/lib/path/helpers";
import { resolveMediaThumbUrl } from "@/lib/url/resolver";
import { cn } from "@/shadcn/lib/utils";
import { useCallback, useState } from "react";

type MediaThumbProps = {
  node: MediaNode;
  className?: string;
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  showIcon?: boolean;
};

export function MediaThumb({
  node,
  className,
  onLoad,
  showIcon = false,
}: MediaThumbProps) {
  const hasPreview =
    node.type === "image" ||
    node.type === "video" ||
    (node.type === "audio" && node.previewPath) ||
    (node.type === "directory" && node.previewPath);

  if (hasPreview) {
    return (
      <div className="relative w-full h-full group">
        <MediaThumbImage
          node={node}
          previewPath={node.previewPath}
          className={className}
          onLoad={onLoad}
        />

        {/* アイコンのオーバーレイ表示 */}
        {showIcon && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <div className="p-2 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 shadow-xl">
              <MediaThumbIcon
                type={node.type}
                className="w-6 h-6 text-white opacity-90"
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // プレビューがない場合のデフォルト表示
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
