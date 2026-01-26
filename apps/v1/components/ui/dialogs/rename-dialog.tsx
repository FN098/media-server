"use client";

import { renameNodeAction } from "@/actions/media-actions";
import { Button } from "@/shadcn/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/components/ui/dialog";
import { Input } from "@/shadcn/components/ui/input";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourcePath: string;
  currentName: string;
}

export function RenameDialog({
  open,
  onOpenChange,
  sourcePath,
  currentName,
}: RenameDialogProps) {
  const [newName, setNewName] = useState(currentName);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  // ダイアログが開くたびに名前をリセット
  useEffect(() => {
    if (open) {
      setNewName(currentName);

      // ダイアログが開いて DOM がレンダリングされた後に実行
      setTimeout(() => {
        if (inputRef.current) {
          // 拡張子の位置を探す（最後に見つかる "."）
          const dotIndex = currentName.lastIndexOf(".");

          // 拡張子がない場合や、先頭が "."（隠しファイル等）の場合は末尾に
          const selectionEnd = dotIndex > 0 ? dotIndex : currentName.length;

          inputRef.current.focus();
          // カーソル位置を 0 から 拡張子の手前までに設定（全選択なら 0, selectionEnd）
          // 今回は「手前にカーソルを置く」ので、開始と終了を同じ値にする
          inputRef.current.setSelectionRange(selectionEnd, selectionEnd);
        }
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleRename = () => {
    startTransition(async () => {
      if (!newName || newName === currentName) {
        onOpenChange(false);
        return;
      }

      const result = await renameNodeAction(sourcePath, newName);

      if (result.success) {
        toast.success("リネームしました");
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>名前の変更</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Input
            ref={inputRef}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="新しい名前を入力"
            onKeyDown={(e) => e.key === "Enter" && void handleRename()}
            autoFocus
            disabled={isPending}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            キャンセル
          </Button>
          <Button onClick={handleRename} disabled={isPending}>
            {isPending ? "実行中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
