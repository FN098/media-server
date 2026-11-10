"use client";

import { Button } from "@/shadcn/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shadcn/components/ui/popover";
import { cn } from "@/shadcn/lib/utils";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";

interface TagDeleteButtonProps {
  tagName: string;
  mediaCount: number;
  onDelete: () => void | Promise<void>;
  isDeleting: boolean;
}

export function TagDeleteButton({
  tagName,
  mediaCount,
  onDelete,
  isDeleting,
}: TagDeleteButtonProps) {
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    await onDelete();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          disabled={isDeleting}
          className={cn(
            "h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          )}
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        side="left"
        align="center"
        className="z-50 w-72 p-4 shadow-xl"
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-bold text-destructive flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              タグを完全に削除しますか？
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              「<span className="font-semibold text-foreground">{tagName}</span>
              」を削除します。 現在このタグが付与されている{" "}
              <span className="font-semibold text-foreground">
                {mediaCount} 件
              </span>{" "}
              のメディアから設定が解除されます。
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setOpen(false)}
              disabled={isDeleting}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-8 text-xs font-bold"
              onClick={() => void handleDelete()}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
              削除を実行
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
