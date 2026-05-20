import { extractArchiveNodeAction } from "@/actions/archive-actions";
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
  targetNode: { path: string; name: string } | null;
}

export function ExtractDialog({
  open,
  onOpenChange,
  targetNode,
}: ExtractDialogProps) {
  const [isPending, startTransition] = useTransition();

  if (!targetNode) return null;

  const handleApply = (e: React.MouseEvent<HTMLButtonElement>) => {
    // 重要: デフォルトの「クリックしたらダイアログを自動で閉じる」動作をキャンセル
    e.preventDefault();

    startTransition(async () => {
      const result = await extractArchiveNodeAction(targetNode.path);

      if (result.success) {
        toast.success(`${targetNode.name} の解凍が完了しました`);
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
            「{targetNode.name}」を現在のディレクトリに解凍します。
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
