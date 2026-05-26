import { useCallback, useState } from "react";

type UseCreateFolderDialogProps = {
  parentDirPath: string;
};

export function useCreateFolderDialog({
  parentDirPath,
}: UseCreateFolderDialogProps) {
  const [folderPath, setFolderPath] = useState<string | null>(null);

  const isOpen = !!folderPath;

  const open = useCallback(() => {
    setFolderPath(parentDirPath);
  }, [parentDirPath]);

  const onOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setFolderPath(null);
    }
  }, []);

  return {
    parentDirPath,
    folderPath,
    setFolderPath,
    isOpen,
    open,
    onOpenChange,
  };
}
