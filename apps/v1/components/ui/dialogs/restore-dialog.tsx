"use client";

import { useRestoreDialog } from "@/hooks/dialogs/use-restore-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shadcn/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface RestoreDialogProps {
  dialog: ReturnType<typeof useRestoreDialog>;
}

export function RestoreDialog({ dialog }: RestoreDialogProps) {
  const { isOpen, targets, isPending, close, performRestore } = dialog;

  if (!isOpen || !targets || targets.length === 0) return null;

  const count = targets.length;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <AlertDialogContent
        onEscapeKeyDown={(e) => e.stopPropagation()}
        className="focus:outline-none"
      >
        <AlertDialogHeader>
          <AlertDialogTitle>アイテムの復元</AlertDialogTitle>
          <AlertDialogDescription>
            選択された {count} 件のアイテムを元の場所に復元しますか？
            <br />
            同名のファイルまたはフォルダが元の場所にある場合は上書きされます。
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={close} disabled={isPending}>
            キャンセル
          </AlertDialogCancel>
          <AlertDialogAction
            autoFocus
            onClick={(e) => {
              // Shadcnのデフォルトで閉じる挙動をガード
              e.preventDefault();
              void performRestore();
            }}
            disabled={isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                復元中...
              </>
            ) : (
              "復元する"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
