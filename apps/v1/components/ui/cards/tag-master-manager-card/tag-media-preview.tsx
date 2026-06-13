"use client";

import { getTagMediaAction, TagMedia } from "@/actions/tag/get-tag-media";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shadcn/components/ui/popover";
import { ExternalLink, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { toast } from "sonner";

interface TagMediaPreviewProps {
  tagId: string;
  tagName: string;
  count: number;
  children: React.ReactNode;
}

export function TagMediaPreview({
  tagId,
  tagName,
  count,
  children,
}: TagMediaPreviewProps) {
  const [media, setMedia] = useState<TagMedia[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenChange = useCallback(
    async (open: boolean) => {
      setIsOpen(open);

      if (!open || count === 0) return;

      setIsLoading(true);
      try {
        const result = await getTagMediaAction({ tagId });
        if (result.success) {
          setMedia(result.media);
        } else {
          toast.error(result.message);
        }
      } catch {
        toast.error("通信エラーが発生しました。");
      } finally {
        setIsLoading(false);
      }
    },
    [count, tagId]
  );

  return (
    <Popover open={isOpen} onOpenChange={(open) => void handleOpenChange(open)}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b bg-muted/50">
          <p className="text-sm font-bold truncate">
            「{tagName}」を含むフォルダ
          </p>
          <div className="flex justify-between items-center mt-1">
            <p className="text-[10px] text-muted-foreground">
              最新 {media.length} 件を表示
            </p>
            {isLoading && (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>

        <div className="max-h-[400px] overflow-auto p-2 scrollbar-thin">
          {isLoading && media.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : media.length > 0 ? (
            <div className="space-y-1">
              {media.map((item) => (
                <div
                  key={item.id}
                  className="p-2 rounded hover:bg-muted transition-colors group border border-transparent hover:border-border"
                >
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate leading-relaxed">
                        {item.title}
                      </p>
                      <p
                        className="text-[10px] text-muted-foreground truncate italic opacity-70"
                        title={item.path}
                      >
                        {item.path}
                      </p>
                    </div>
                    <Link
                      href={item.url}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-primary transition-opacity shrink-0"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !isLoading && (
              <p className="text-xs text-center py-12 text-muted-foreground">
                ファイルが見つかりません
              </p>
            )
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
