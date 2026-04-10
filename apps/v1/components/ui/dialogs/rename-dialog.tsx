import { renameNodeAction } from "@/actions/media-actions";
import { Button } from "@/shadcn/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/components/ui/dialog";
import { Input } from "@/shadcn/components/ui/input";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourcePath: string;
  currentName: string; // 例: "photo.jpg"
}

export function RenameDialog({
  open,
  onOpenChange,
  sourcePath,
  currentName,
}: RenameDialogProps) {
  const dotIndex = currentName.lastIndexOf(".");
  const baseName =
    dotIndex > 0 ? currentName.substring(0, dotIndex) : currentName;
  const extension = dotIndex > 0 ? currentName.substring(dotIndex) : "";

  const [newName, setNewName] = useState(baseName);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setNewName(baseName);

      // ダイアログが開いた時に全選択状態にする（使い勝手向上のため）
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }

    onOpenChange?.(open);
  };

  const handleRename = () => {
    startTransition(async () => {
      // 拡張子を再度結合
      debugger;
      const fullNewName = `${newName}${extension}`;

      if (!newName || fullNewName === currentName) {
        onOpenChange(false);
        return;
      }

      const result = await renameNodeAction(sourcePath, fullNewName);

      if (result.success) {
        toast.success("リネームしました");
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>名前の変更</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="ファイル名を入力"
              onKeyDown={(e) => e.key === "Enter" && void handleRename()}
              disabled={isPending}
              className="flex-1"
            />
            {/* 視覚的に拡張子を表示するとユーザーに親切です */}
            <span className="text-sm text-muted-foreground font-mono">
              {extension}
            </span>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            キャンセル
          </Button>
          <Button onClick={handleRename} disabled={isPending}>
            {isPending ? "実行中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
