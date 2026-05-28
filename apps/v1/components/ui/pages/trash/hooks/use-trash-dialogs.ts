import { useDeleteDialog } from "@/hooks/use-delete-dialog";
import { useRestoreDialog } from "@/hooks/use-restore-dialog";
import { useTagFilterDialog } from "@/hooks/use-tag-filter-dialog";
import { MediaNode } from "@/lib/media/types";
import { useMemo } from "react";

export type TrashDialogs = ReturnType<typeof useTrashDialogs>;

export function useTrashDialogs() {
  const deleteDialog = useDeleteDialog<MediaNode>();
  const restoreDialog = useRestoreDialog<MediaNode>();
  const tagFilterDialog = useTagFilterDialog();

  const all = useMemo(
    () =>
      ({
        deleteDialog,
        restoreDialog,
        tagFilterDialog,
      }) as const,
    [deleteDialog, restoreDialog, tagFilterDialog]
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
