import { DeleteDialog } from "@/components/ui/dialogs/delete-dialog";
import { RestoreDialog } from "@/components/ui/dialogs/restore-dialog";
import { TrashDialogs as TrashDialogsType } from "@/hooks/trash/use-trash-dialogs";

type TrashDialogsProps = {
  dialogs: TrashDialogsType;
};

export function TrashDialogs({ dialogs }: TrashDialogsProps) {
  const { deleteDialog, restoreDialog } = dialogs;

  return (
    <>
      {/* 削除ダイアログ */}
      <DeleteDialog dialog={deleteDialog} />

      {/* 復元ダイアログ */}
      <RestoreDialog dialog={restoreDialog} />
    </>
  );
}
