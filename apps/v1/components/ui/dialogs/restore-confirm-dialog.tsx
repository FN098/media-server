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

interface RestoreConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  onConfirm: () => Promise<void>;
}

export function RestoreConfirmDialog({
  open,
  onOpenChange,
  count,
  onConfirm,
}: RestoreConfirmDialogProps) {
  const [isPending, startTransition] = useTransition();

  const handleConfirm = (e: React.MouseEvent) => {
    // AlertDialogActionのデフォルトの閉じ動作を防ぎ、処理完了後に手動で閉じる
    e.preventDefault();
    startTransition(async () => {
      await onConfirm();
      onOpenChange(false);
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>アイテムの復元</AlertDialogTitle>
          <AlertDialogDescription>
            選択された {count} 件のアイテムを元の場所に復元しますか？
            <br />
            同名のファイルが元の場所にある場合は上書きされます。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isPending ? "復元中..." : "復元する"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
