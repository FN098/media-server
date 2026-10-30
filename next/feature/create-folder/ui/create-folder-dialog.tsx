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

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newFolderName: string;
  setNewFolderName: (name: string) => void;
  isPending: boolean;
  onConfirm: () => void;
}

export function CreateFolderDialog({
  open,
  onOpenChange,
  newFolderName,
  setNewFolderName,
  isPending,
  onConfirm,
}: CreateFolderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[425px]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.stopPropagation()} // 親へのイベント伝播を止める
      >
        <DialogHeader>
          <DialogTitle>新規フォルダ作成</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="新しいフォルダ名を入力"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isPending) {
                e.preventDefault();
                onConfirm();
              }
            }}
            disabled={isPending}
            className="w-full"
            autoFocus // ダイアログを開いたときに自動でフォーカス
          />
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            キャンセル
          </Button>
          <Button
            onClick={() => onConfirm()}
            disabled={isPending || !newFolderName.trim()}
          >
            {isPending ? "作成中..." : "作成"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
