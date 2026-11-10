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

interface FavoriteManyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: { id: string }[];
  action: "add" | "remove";
  isPending: boolean;
  onConfirm: () => void;
}

export function FavoriteManyDialog({
  open,
  onOpenChange,
  items,
  action,
  isPending,
  onConfirm,
}: FavoriteManyDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        onEscapeKeyDown={(e) => e.stopPropagation()}
        className="focus:outline-none"
      >
        <AlertDialogHeader>
          <AlertDialogTitle>
            {action === "add" ? "お気に入りに追加" : "お気に入りの解除"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {action === "add" ? (
              <>
                選択された {items.length}{" "}
                件のアイテムをお気に入りに追加しますか？
              </>
            ) : (
              <>
                選択された {items.length}{" "}
                件のアイテムのお気に入りを解除しますか？
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
              onConfirm();
            }}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {action === "add" ? "追加中..." : "解除中..."}
              </>
            ) : (
              <>{action === "add" ? "追加する" : "解除する"}</>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
