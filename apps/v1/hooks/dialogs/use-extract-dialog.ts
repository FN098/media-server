import { extractManyArchivesAction } from "@/actions/archive/extract";
import { useCallback, useState } from "react";
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
  const [isPending, setIsPending] = useState(false);

  const open = useCallback((targets: ExtractTarget[]) => {
    setTargets(targets);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setTargets([]);
  }, []);

  const performExtract = useCallback(async () => {
    if (targets.length === 0) return;

    const paths = targets.map((t) => t.path);

    setIsPending(true);
    try {
      const result = await extractManyArchivesAction({ paths });
      if (result.success) {
        if (result.completed.length > 0) {
          toast.success(`${result.completed.length} 件の解凍が完了しました`);
        }
        if (result.failed.length > 0) {
          toast.error(`${result.failed.length} 件の解凍に失敗しました`);
        }
        if (result.skipped.length > 0) {
          toast.warning(`${result.skipped.length} 件の解凍をスキップしました`);
        }
        onSuccess?.();
        close();
      } else {
        toast.error(result.message);
      }
    } finally {
      setIsPending(false);
    }
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
