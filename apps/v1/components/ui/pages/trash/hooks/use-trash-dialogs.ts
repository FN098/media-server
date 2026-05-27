import { TrashSelection } from "@/components/ui/pages/trash/hooks/use-trash-selection";
import { useDeleteDialog } from "@/hooks/use-delete-dialog";
import { useRestoreDialog } from "@/hooks/use-restore-dialog";
import { MediaNode } from "@/lib/media/types";

export type TrashDialogs = ReturnType<typeof useTrashDialogs>;

type UseTrashDialogsProps = {
  selection: TrashSelection;
};

export function useTrashDialogs({ selection }: UseTrashDialogsProps) {
  const deleteDialog = useDeleteDialog<MediaNode>({
    onChange: (ctx) =>
      ctx.isOpen ? selection.select(ctx.targets) : selection.reset(),
  });

  const restoreDialog = useRestoreDialog<MediaNode>({
    onChange: (ctx) =>
      ctx.isOpen ? selection.select(ctx.targets) : selection.reset(),
  });

  const all = {
    deleteDialog,
    restoreDialog,
  } as const;

  const isOpen = Object.values(all).some(({ isOpen }) => isOpen);

  return {
    ...all,
    isOpen,
  };
}
