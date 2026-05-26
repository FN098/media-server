import {
  deleteNodesAction,
  deleteNodesPermanentlyAction,
} from "@/actions/media-actions";
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
import { toast } from "sonner";

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targets: { path: string; name: string }[];
  permanent?: boolean;
}

export function DeleteDialog({
  open,
  onOpenChange,
  targets,
  permanent = false,
}: DeleteDialogProps) {
  const [isPending, startTransition] = useTransition();
  const count = targets.length;

  const handleApply = (e: React.MouseEvent<HTMLButtonElement>) => {
    // 重要: デフォルトの「クリックしたら閉じる」動作をキャンセル
    e.preventDefault();

    if (permanent) {
      // 完全に削除
      startTransition(async () => {
        const paths = targets.map((n) => n.path);
        const result = await deleteNodesPermanentlyAction(paths);

        if (result.failed === 0) {
          toast.success(`${result.success}件のアイテムを完全に削除しました`);
          onOpenChange(false);
        } else {
          toast.error(`${result.failed}件の削除に失敗しました`);
        }
      });
    } else {
      // ゴミ箱に移動
      startTransition(async () => {
        const paths = targets.map((n) => n.path);
        const result = await deleteNodesAction(paths);

        if (result.failed === 0) {
          toast.success(`${result.success}件をゴミ箱に移動しました`);
          onOpenChange(false);
        } else {
          toast.error(`${result.failed}件の削除に失敗しました`);
        }
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
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
          <AlertDialogCancel disabled={isPending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            autoFocus
            onClick={handleApply}
            disabled={isPending}
            className="bg-destructive hover:bg-destructive/90"
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
