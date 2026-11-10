import { DeleteDialog } from "@/feature/_old/node/ui/delete-dialog";
import { RestoreDialog } from "@/feature/_old/node/ui/restore-dialog";
import { useTrashContext } from "@/feature/_old/pages/trash/providers/trash-provider";

export function TrashDialogs() {
  const { dialogs } = useTrashContext();

  return (
    <>
      <DeleteDialog dialog={dialogs.deleteDialog} />
      <RestoreDialog dialog={dialogs.restoreDialog} />
    </>
  );
}
