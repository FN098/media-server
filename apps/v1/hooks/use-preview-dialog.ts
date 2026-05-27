import { useCallback, useState } from "react";

type PreviewDialogContext =
  | {
      isOpen: true;
      previewPath: string;
    }
  | { isOpen: false };

type UsePreviewDialogProps = {
  onChange?: (context: PreviewDialogContext) => void;
};

export function usePreviewDialog({ onChange }: UsePreviewDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [previewPath, setPreviewPath] = useState<string | null>(null);

  const open = useCallback(
    (previewPath: string) => {
      onChange?.({
        isOpen: true,
        previewPath,
      });
      setPreviewPath(previewPath);
      setIsOpen(true);
    },
    [onChange]
  );

  const close = useCallback(() => {
    onChange?.({ isOpen: false });
    setPreviewPath(null);
    setIsOpen(false);
  }, [onChange]);

  const onOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        close();
      }
    },
    [close]
  );

  return {
    previewPath,
    setPreviewPath,
    isOpen,
    open,
    onOpenChange,
  };
}
