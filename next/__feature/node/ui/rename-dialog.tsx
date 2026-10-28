"use client";

import { Button } from "@/shadcn/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/components/ui/dialog";
import { Input } from "@/shadcn/components/ui/input";
import { Ref } from "react";

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newName: string;
  setNewName: (name: string) => void;
  extension: string;
  inputRef: Ref<HTMLInputElement>;
  isPending: boolean;
  onConfirm: () => void;
}

export function RenameDialog({
  open,
  onOpenChange,
  newName,
  setNewName,
  extension,
  inputRef,
  isPending,
  onConfirm,
}: RenameDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                  onConfirm();
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
          <Button onClick={onConfirm} disabled={isPending || !newName.trim()}>
            {isPending ? "実行中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
