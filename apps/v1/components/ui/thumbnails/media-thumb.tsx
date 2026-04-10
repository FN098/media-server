import { MediaThumbIcon } from "@/components/ui/thumbnails/media-thumb-icons";
import { MediaThumbImage } from "@/components/ui/thumbnails/media-thumb-image";
import { MediaNode } from "@/lib/media/types";
import { cn } from "@/shadcn/lib/utils";

interface MediaThumbProps {
  node: MediaNode;
  className?: string;
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  showIcon?: boolean;
}

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
