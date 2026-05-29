import { extractMultipleArchivesNodeAction } from "@/lib/archive/actions";
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

interface ExtractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targets: { path: string; name: string }[] | null;
}

export function ExtractDialog({
  open,
  onOpenChange,
  targets,
}: ExtractDialogProps) {
  const [isPending, startTransition] = useTransition();

  if (!targets || targets.length === 0) return null;

  const handleApply = (e: React.MouseEvent<HTMLButtonElement>) => {
    // 重要: デフォルトの「クリックしたらダイアログを自動で閉じる」動作をキャンセル
    e.preventDefault();

    startTransition(async () => {
      const result = await extractMultipleArchivesNodeAction(targets);

      if (result.success) {
        toast.success(
          targets.length === 1
            ? `${targets[0].name} の解凍が完了しました`
            : `${targets.length} 件の解凍が完了しました`
        );
        onOpenChange(false); // 成功時のみモーダルを閉じる
      } else {
        toast.error(result.error || "解凍に失敗しました");
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        onEscapeKeyDown={(e) => e.stopPropagation()}
        className="focus:outline-none"
      >
        <AlertDialogHeader>
          <AlertDialogTitle>アーカイブの解凍</AlertDialogTitle>
          <AlertDialogDescription>
            {targets.length === 1
              ? `「${targets[0].name}」を現在のディレクトリに解凍します。`
              : `${targets.length} 件を現在のディレクトリに解凍します。`}
            <br />
            同名のフォルダがある場合は、自動的に連番（ (1)
            など）が付与されます。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            autoFocus
            onClick={handleApply}
            disabled={isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                解凍中...
              </>
            ) : (
              "解凍する"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
