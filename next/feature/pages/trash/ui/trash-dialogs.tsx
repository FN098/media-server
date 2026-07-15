import { DeleteDialog } from "@/feature/node/ui/delete-dialog";
import { RestoreDialog } from "@/feature/node/ui/restore-dialog";
import { useTrashContext } from "@/feature/pages/trash/providers/trash-provider";

export function TrashDialogs() {
  const { dialogs } = useTrashContext();

  return (
    <>
      <DeleteDialog dialog={dialogs.deleteDialog} />
      <RestoreDialog dialog={dialogs.restoreDialog} />
    </>
  );
}
