"use client";

import { useCreateFolderDialog } from "@/hooks/dialogs/use-create-folder-dialog";
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
  dialog: ReturnType<typeof useCreateFolderDialog>;
}

export function CreateFolderDialog({ dialog }: CreateFolderDialogProps) {
  const { isOpen, folderName, isPending, setFolderName, close, performCreate } =
    dialog;

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
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
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="新しいフォルダ名を入力"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isPending) {
                e.preventDefault();
                void performCreate();
              }
            }}
            disabled={isPending}
            className="w-full"
            autoFocus // ダイアログを開いたときに自動でフォーカス
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={close} disabled={isPending}>
            キャンセル
          </Button>
          <Button
            onClick={() => void performCreate()}
            disabled={isPending || !folderName.trim()}
          >
            {isPending ? "作成中..." : "作成"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
