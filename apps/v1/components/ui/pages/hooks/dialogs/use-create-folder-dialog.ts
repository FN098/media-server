import { useCallback, useState } from "react";

type UseCreateFolderDialogProps = {
  targetDirPath: string;
  onClose?: () => void;
};

export function useCreateFolderDialog({
  targetDirPath,
  onClose,
}: UseCreateFolderDialogProps) {
  const [folderPath, setFolderPath] = useState<string | null>(null);

  const isCreateFolderMode = !!folderPath;

  const handleOpenCreateFolderDialog = useCallback(() => {
    setFolderPath(targetDirPath);
  }, [targetDirPath]);

  const handleCreateFolderDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setFolderPath(null);
        onClose?.();
      }
    },
    [onClose]
  );

  return {
    folderPath,
    setFolderPath,
    isCreateFolderMode,
    handleOpenCreateFolderDialog,
    handleCreateFolderDialogOpenChange,
  };
}
