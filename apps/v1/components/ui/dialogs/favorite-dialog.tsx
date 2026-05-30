"use client";

import { useFavoriteDialog } from "@/hooks/dialogs/use-favorite-dialog";
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

interface FavoriteDialogProps {
  dialog: ReturnType<typeof useFavoriteDialog>;
}

export function FavoriteDialog({ dialog }: FavoriteDialogProps) {
  const { isOpen, targets, mode, isPending, close, performFavoriteAction } =
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
            {mode === "add" ? "お気に入りに追加" : "お気に入りの解除"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {mode === "add" ? (
              <>選択された {count} 件のアイテムをお気に入りに追加しますか？</>
            ) : (
              <>選択された {count} 件のアイテムのお気に入りを解除しますか？</>
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
              performFavoriteAction();
            }}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === "add" ? "追加中..." : "解除中..."}
              </>
            ) : (
              <>{mode === "add" ? "追加する" : "解除する"}</>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
