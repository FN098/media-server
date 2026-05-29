import { createFolderAction } from "@/lib/folder/actions"; // 適宜アクション名を確認してください
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

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentPath: string; // フォルダを作成する親ディレクトリのパス
}

export function CreateFolderDialog({
  open,
  onOpenChange,
  parentPath,
}: CreateFolderDialogProps) {
  const [folderName, setFolderName] = useState("");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  // 作成実行
  const performCreate = () => {
    const trimmedName = folderName.trim();

    if (!trimmedName) {
      toast.error("フォルダ名を入力してください");
      return;
    }

    startTransition(async () => {
      // サーバーアクションの呼び出し
      const result = await createFolderAction(parentPath, trimmedName);

      if (result.success) {
        toast.success("フォルダを作成しました");
        onOpenChange(false);
      } else {
        toast.error(result.error || "作成に失敗しました");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>新規フォルダ作成</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <Input
            ref={inputRef}
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="新しいフォルダ名を入力"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isPending) {
                e.preventDefault();
                performCreate();
              }
            }}
            disabled={isPending}
            className="w-full"
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            キャンセル
          </Button>
          <Button
            onClick={performCreate}
            disabled={isPending || !folderName.trim()}
          >
            {isPending ? "作成中..." : "作成"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
