"use client";

import { useTextFilePreviewDialog } from "@/hooks/dialogs/use-text-file-preview-dialog";
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

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      {/* テキストを広く見せるため、最大幅を大きめ（sm:max-w-[700px]など）に設定 */}
      <DialogContent
        className="sm:max-w-[700px] max-h-[85vh] flex flex-col p-6 gap-4"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.stopPropagation()}
      >
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 border-b pb-3 shrink-0">
          <DialogTitle className="truncate pr-4 text-base font-medium">
            {title}
          </DialogTitle>

          {/* エンコード情報をバッジのように表示 */}
          <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded shrink-0">
            {encoding}
          </span>
        </DialogHeader>

        {/* テキスト表示エリア：折り返しを有効にし、はみ出したらスクロール */}
        <div className="flex-1 overflow-y-auto rounded-md bg-muted/40 border p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap break-all select-text select-all">
          {content}

          {/* 省略された場合の案内 */}
          {isTruncated && (
            <div className="mt-4 border-t pt-2 text-xs text-amber-500 font-sans italic">
              ※
              ファイルサイズが大きいため、先頭部分のみプレビューを表示しています。
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 pt-2">
          <Button variant="outline" onClick={close} className="w-24">
            閉じる
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
