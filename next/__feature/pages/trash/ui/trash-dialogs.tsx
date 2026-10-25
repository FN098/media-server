import { DeleteDialog } from "@/__feature/node/ui/delete-dialog";
import { RestoreDialog } from "@/__feature/node/ui/restore-dialog";
import { useTrashContext } from "@/__feature/pages/trash/providers/trash-provider";

export function TrashDialogs() {
  const { dialogs } = useTrashContext();

  return (
    <>
      <DeleteDialog dialog={dialogs.deleteDialog} />
      <RestoreDialog dialog={dialogs.restoreDialog} />
    </>
  );
}
