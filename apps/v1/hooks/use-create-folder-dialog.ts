import { useCallback, useState } from "react";

type UseCreateFolderDialogProps = {
  targetDirPath: string;
};

export function useCreateFolderDialog({
  targetDirPath,
}: UseCreateFolderDialogProps) {
  const [folderPath, setFolderPath] = useState<string | null>(null);

  const isOpen = !!folderPath;

  const open = useCallback(() => {
    setFolderPath(targetDirPath);
  }, [targetDirPath]);

  const onOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setFolderPath(null);
    }
  }, []);

  return {
    folderPath,
    setFolderPath,
    isOpen,
    open,
    onOpenChange,
  };
}
