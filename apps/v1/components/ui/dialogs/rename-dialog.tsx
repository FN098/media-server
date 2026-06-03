"use client";

import { useRenameDialog } from "@/hooks/dialogs/use-rename-dialog";
import { Button } from "@/shadcn/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/components/ui/dialog";
import { Input } from "@/shadcn/components/ui/input";
import { useEffect } from "react";

interface RenameDialogProps {
  dialog: ReturnType<typeof useRenameDialog>;
}

export function RenameDialog({ dialog }: RenameDialogProps) {
  const {
    isOpen,
    newName,
    extension,
    isPending,
    inputRef,
    setNewName,
    close,
    performRename,
  } = dialog;

  // ダイアログが開いた際、テキストを入力状態にして最初から全選択（反転）
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [inputRef]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent
        className="sm:max-w-[425px]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>名前の変更</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-2">
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="名前を入力"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isPending) {
                  e.preventDefault();
                  performRename();
                }
              }}
              disabled={isPending}
              className="flex-1"
            />
            {extension && (
              <span className="text-sm text-muted-foreground font-mono bg-muted px-2 py-1 rounded shrink-0">
                {extension}
              </span>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={close} disabled={isPending}>
            キャンセル
          </Button>
          <Button
            onClick={performRename}
            disabled={isPending || !newName.trim()}
          >
            {isPending ? "実行中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
