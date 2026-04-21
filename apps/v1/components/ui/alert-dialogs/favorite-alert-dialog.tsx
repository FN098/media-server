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

interface FavoriteAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  mode: "add" | "remove";
  onConfirm: () => Promise<void>;
}

export function FavoriteAlertDialog({
  open,
  onOpenChange,
  count,
  mode,
  onConfirm,
}: FavoriteAlertDialogProps) {
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
          <AlertDialogCancel disabled={isPending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            autoFocus
            onClick={handleConfirm}
            disabled={isPending}
          >
            {mode === "add" ? "追加する" : "解除する"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
