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
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  oldPath: string;
  currentName: string;
}

export function RenameDialog({
  open,
  onOpenChange,
  oldPath,
  currentName,
}: RenameDialogProps) {
  const [newName, setNewName] = useState(currentName);
  const [isPending, setIsPending] = useState(false);

  // ダイアログが開くたびに名前をリセット
  useEffect(() => {
    if (open) setNewName(currentName);
  }, [open, currentName]);

  const handleRename = async () => {
    if (!newName || newName === currentName) {
      onOpenChange(false);
      return;
    }

    setIsPending(true);
    const result = await renameNodeAction(oldPath, newName);
    setIsPending(false);

    if (result.success) {
      toast.success("リネームしました");
      onOpenChange(false);
    } else {
      toast.error(result.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>名前の変更</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="新しい名前を入力"
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
            autoFocus
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
