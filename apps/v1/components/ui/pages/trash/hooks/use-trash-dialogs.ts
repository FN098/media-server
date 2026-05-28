import { useDeleteDialog } from "@/hooks/use-delete-dialog";
import { useRestoreDialog } from "@/hooks/use-restore-dialog";
import { MediaNode } from "@/lib/media/types";
import { useMemo } from "react";

export type TrashDialogs = ReturnType<typeof useTrashDialogs>;

export function useTrashDialogs() {
  const deleteDialog = useDeleteDialog<MediaNode>();
  const restoreDialog = useRestoreDialog<MediaNode>();

  const all = useMemo(
    () =>
      ({
        deleteDialog,
        restoreDialog,
      }) as const,
    [deleteDialog, restoreDialog]
  );

  const isOpen = useMemo(
    () => Object.values(all).some(({ isOpen }) => isOpen),
    [all]
  );

  return {
    ...all,
    isOpen,
  };
}
