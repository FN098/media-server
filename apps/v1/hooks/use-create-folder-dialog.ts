import { useCallback, useState } from "react";

type CreateFolderDialogContext =
  | {
      isOpen: true;
      parentPath: string;
    }
  | { isOpen: false };

interface CreateFolderDialogProps {
  onChange?: (context: CreateFolderDialogContext) => void;
}

export function useCreateFolderDialog({ onChange }: CreateFolderDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [parentPath, setParentPath] = useState<string>("");

  const open = useCallback(
    (parentPath: string) => {
      onChange?.({
        isOpen: true,
        parentPath,
      });
      setParentPath(parentPath);
      setIsOpen(true);
    },
    [onChange]
  );

  const close = useCallback(() => {
    onChange?.({ isOpen: false });
    setParentPath("");
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
    parentPath,
    isOpen,
    open,
    close,
    onOpenChange,
  };
}
