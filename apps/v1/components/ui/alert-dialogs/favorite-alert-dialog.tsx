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

  const handleConfirm = (e: React.MouseEvent<HTMLButtonElement>) => {
    // 重要: デフォルトの「クリックしたら閉じる」動作をキャンセル
    e.preventDefault();

    startTransition(async () => {
      try {
        await onConfirm();
        onOpenChange(false);
      } catch (error) {
        console.error(error);
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent onEscapeKeyDown={(e) => e.stopPropagation()}>
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
