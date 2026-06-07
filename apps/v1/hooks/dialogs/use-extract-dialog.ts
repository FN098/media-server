import { extractArchivesAction } from "@/actions/archive-actions";
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

    let result: Awaited<ReturnType<typeof extractArchivesAction>>;
    try {
      setIsPending(true);
      result = await extractArchivesAction(targets);
    } finally {
      setIsPending(false);
    }

    if (result.success) {
      if (result.completed.length > 0) {
        toast.success(`${result.completed.length} 件の解凍が完了しました`);
      }
      if (result.failed.length > 0) {
        toast.error(`${result.failed.length} 件の解凍に失敗しました`);
      }
      if (result.skipped.length > 0) {
        toast.error(`${result.skipped.length} 件の解凍をスキップしました`);
      }
      onSuccess?.();
      close();
    } else {
      console.error(result.errors);
      toast.error(result.message);
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
