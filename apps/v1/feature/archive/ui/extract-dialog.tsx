"use client";

import { useExtractDialog } from "@/feature/archive/hooks/use-extract-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shadcn/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface ExtractDialogProps {
  dialog: ReturnType<typeof useExtractDialog>;
}

export function ExtractDialog({ dialog }: ExtractDialogProps) {
  const { isOpen, targets, isPending, close, performExtract } = dialog;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <AlertDialogContent
        onEscapeKeyDown={(e) => e.stopPropagation()}
        className="focus:outline-none"
      >
        <AlertDialogHeader>
          <AlertDialogTitle>アーカイブの解凍</AlertDialogTitle>
          <AlertDialogDescription>
            {targets.length === 1
              ? `「${targets[0].name}」を現在のディレクトリに解凍します。`
              : `${targets.length} 件を現在のディレクトリに解凍します。`}
            <br />
            同名のフォルダがある場合は、自動的に連番（ (1)
            など）が付与されます。
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={close} disabled={isPending}>
            キャンセル
          </AlertDialogCancel>
          <AlertDialogAction
            autoFocus
            onClick={(e) => {
              // ShadcnのAlertDialogActionが勝手にダイアログを閉じるデフォルト挙動をガード
              e.preventDefault();
              void performExtract();
            }}
            disabled={isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                解凍中...
              </>
            ) : (
              "解凍する"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
