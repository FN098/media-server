import { DeleteDialog } from "@/components/ui/dialogs/delete-dialog";
import { RestoreDialog } from "@/components/ui/dialogs/restore-dialog";
import { useTrashContext } from "@/providers/trash-provider";

export function TrashDialogs() {
  const { dialogs } = useTrashContext();

  return (
    <>
      <DeleteDialog dialog={dialogs.deleteDialog} />
      <RestoreDialog dialog={dialogs.restoreDialog} />
    </>
  );
}
