"use client";

import { useTextFilePreviewDialog } from "@/feature/text-file-reader/hooks/use-text-file-preview-dialog";
import { Button } from "@/shadcn/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/components/ui/dialog";

interface TextFilePreviewDialogProps {
  dialog: ReturnType<typeof useTextFilePreviewDialog>;
}

export function TextFilePreviewDialog({ dialog }: TextFilePreviewDialogProps) {
  const { isOpen, title, content, encoding, isTruncated, close } = dialog;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent
        className="sm:max-w-[800px] h-[80vh] flex flex-col p-6 gap-4"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.stopPropagation()}
      >
        <DialogHeader className="border-b pb-3 shrink-0">
          <DialogTitle className="truncate pr-8 text-base font-medium">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="relative flex-1 min-h-0 w-full">
          <div className="w-full h-full overflow-y-auto rounded-md bg-muted/40 border p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap break-all select-text">
            {content}

            {isTruncated && (
              <div className="mt-4 border-t pt-2 text-xs text-amber-500 font-sans italic">
                ※
                ファイルサイズが大きいため、先頭部分のみプレビューを表示しています。
              </div>
            )}
          </div>

          <div className="absolute bottom-3 right-3 z-10 select-none pointer-events-none">
            <span className="text-xs text-muted-foreground font-mono bg-background/90 backdrop-blur-sm border shadow-sm px-2 py-0.5 rounded opacity-70 hover:opacity-100 transition-opacity">
              {encoding}
            </span>
          </div>
        </div>

        <DialogFooter className="shrink-0 pt-2 border-t">
          <Button variant="outline" onClick={close} className="w-24">
            閉じる
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
