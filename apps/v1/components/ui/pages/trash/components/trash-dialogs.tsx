import { DeleteDialog } from "@/components/ui/dialogs/delete-dialog";
import { RestoreDialog } from "@/components/ui/dialogs/restore-dialog";
import { TrashDialogs as TrashDialogsType } from "@/components/ui/pages/trash/hooks/use-trash-dialogs";

type TrashDialogsProps = {
  dialogs: TrashDialogsType;
};

export function TrashDialogs({ dialogs }: TrashDialogsProps) {
  const { deleteDialog, restoreDialog } = dialogs;

  return (
    <>
      {/* 削除ダイアログ */}
      <DeleteDialog
        open={deleteDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            deleteDialog.close();
          }
        }}
        targets={deleteDialog.targets}
        permanent
      />

      {/* 復元ダイアログ */}
      <RestoreDialog
        open={restoreDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            restoreDialog.close();
          }
        }}
        targets={restoreDialog.targets}
      />
    </>
  );
}
