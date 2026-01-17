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
import { useTransition } from "react";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  onConfirm: () => Promise<void>;
  permanent?: boolean;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  count,
  onConfirm,
  permanent = false,
}: DeleteConfirmDialogProps) {
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      await onConfirm();
      onOpenChange(false);
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
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
          <AlertDialogCancel disabled={isPending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isPending
              ? permanent
                ? "完全削除中..."
                : "削除中..."
              : permanent
                ? "完全に削除する"
                : "削除する"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
