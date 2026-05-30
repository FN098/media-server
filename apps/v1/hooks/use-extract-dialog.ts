import { extractMultipleArchivesNodeAction } from "@/lib/archive/actions";
import { MediaNode } from "@/lib/media/types";
import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";

interface UseExtractDialogProps {
  onSuccess?: () => void;
}

export function useExtractDialog({ onSuccess }: UseExtractDialogProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [targets, setTargets] = useState<MediaNode[]>([]);
  const [isPending, startTransition] = useTransition();

  // 1. ダイアログを開く
  const open = useCallback((nodes: MediaNode[]) => {
    setTargets(nodes);
    setIsOpen(true);
  }, []);

  // 2. ダイアログを閉じる
  const close = useCallback(() => {
    setIsOpen(false);
    setTargets([]);
  }, []);

  // 3. 解凍処理の実行
  const performExtract = useCallback(() => {
    if (targets.length === 0) return;

    startTransition(async () => {
      const result = await extractMultipleArchivesNodeAction(targets);

      if (result.success) {
        toast.success(
          targets.length === 1
            ? `${targets[0].name} の解凍が完了しました`
            : `${targets.length} 件の解凍が完了しました`
        );
        onSuccess?.();
        close();
      } else {
        toast.error(result.error || "解凍に失敗しました");
      }
    });
  }, [targets, close, onSuccess]);

  return {
    isOpen,
    targets,
    isPending,
    open,
    close,
    performExtract,
  };
}
