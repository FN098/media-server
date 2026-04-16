"use client";

import { getMediaByTagId } from "@/actions/tag-actions";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shadcn/components/ui/popover";
import { ExternalLink, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

interface TagMediaPreviewProps {
  tagId: string;
  tagName: string;
  count: number;
  children: React.ReactNode;
}

type MediaInfo = {
  id: string;
  title: string;
  path: string;
  url: string;
};

export function TagMediaPreview({
  tagId,
  tagName,
  count,
  children,
}: TagMediaPreviewProps) {
  const [media, setMedia] = useState<MediaInfo[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const [isLoading, startTransition] = useTransition();

  useEffect(() => {
    if (isOpen && count > 0) {
      startTransition(async () => {
        const result = await getMediaByTagId(tagId);
        if (result.success && result.media) {
          setMedia(result.media);
        } else {
          toast.error(result.error ?? "失敗");
        }
      });
    }
  }, [isOpen, tagId, count]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b bg-muted/50">
          <p className="text-sm font-bold truncate">「{tagName}」のファイル</p>
          <p className="text-[10px] text-muted-foreground">
            最新 {media.length} 件を表示
          </p>
        </div>

        <div className="max-h-[300px] overflow-auto p-2 scrollbar-thin">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
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
                      <p className="text-xs font-medium truncate">
                        {item.title}
                      </p>
                      <p
                        className="text-[10px] text-muted-foreground truncate italic"
                        title={item.path}
                      >
                        {item.path}
                      </p>
                    </div>
                    <Link
                      href={item.url}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-primary transition-opacity"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-center py-8 text-muted-foreground">
              ファイルが見つかりません
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
