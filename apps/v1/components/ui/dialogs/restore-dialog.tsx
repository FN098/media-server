import { restoreNodesAction } from "@/actions/media-actions";
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

interface RestoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targets: { path: string; name: string }[];
}

export function RestoreDialog({
  open,
  onOpenChange,
  targets,
}: RestoreDialogProps) {
  const [isPending, startTransition] = useTransition();
  const count = targets.length;

  const handleApply = (e: React.MouseEvent) => {
    // 重要: デフォルトの「クリックしたら閉じる」動作をキャンセル
    e.preventDefault();

    startTransition(async () => {
      const paths = targets.map((n) => n.path);
      const result = await restoreNodesAction(paths);

      if (result.failed === 0) {
        toast.success(`${result.success}件のアイテムを復元しました`);
        onOpenChange(false);
      } else {
        toast.error(`${result.failed}件の復元に失敗しました`);
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent onEscapeKeyDown={(e) => e.stopPropagation()}>
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
            onClick={handleApply}
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
