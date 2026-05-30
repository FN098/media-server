"use client";

import { useDeleteDialog } from "@/hooks/dialogs/use-delete-dialog";
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

interface DeleteDialogProps {
  dialog: ReturnType<typeof useDeleteDialog>;
}

export function DeleteDialog({ dialog }: DeleteDialogProps) {
  const { isOpen, targets, permanent, isPending, close, performDelete } =
    dialog;

  if (!isOpen || !targets || targets.length === 0) return null;

  const count = targets.length;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <AlertDialogContent
        onEscapeKeyDown={(e) => e.stopPropagation()}
        className="focus:outline-none"
      >
        <AlertDialogHeader>
          <AlertDialogTitle>
            {permanent ? "アイテムの完全削除" : "アイテムの削除"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {permanent ? (
              <>
                選択された {count} 件のアイテムを完全に削除します。
                <br />
                <span className="text-destructive font-semibold">
                  この操作は取り消せません。
                </span>
              </>
            ) : (
              <>
                選択された {count} 件のアイテムをゴミ箱に移動しますか？
                <br />
                この操作は後でゴミ箱フォルダから戻すことができます。
              </>
            )}
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
              performDelete();
            }}
            disabled={isPending}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {permanent ? "完全削除中..." : "削除中..."}
              </>
            ) : (
              <>{permanent ? "完全に削除する" : "削除する"}</>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
