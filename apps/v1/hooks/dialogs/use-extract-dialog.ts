import { extractMultipleArchivesNodeAction } from "@/actions/archive-actions";
import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";

type ExtractTarget = {
  path: string;
  name: string;
};

interface UseExtractDialogProps {
  onSuccess?: () => void;
}

export function useExtractDialog({ onSuccess }: UseExtractDialogProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [targets, setTargets] = useState<ExtractTarget[]>([]);
  const [isPending, startTransition] = useTransition();

  // 1. ダイアログを開く
  const open = useCallback((targets: ExtractTarget[]) => {
    setTargets(targets);
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
        if (result.completed > 0) {
          toast.success(`${result.completed} 件の解凍が完了しました`);
        }
        if (result.failed > 0) {
          toast.error(`${result.failed} 件の解凍に失敗しました`);
        }
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
