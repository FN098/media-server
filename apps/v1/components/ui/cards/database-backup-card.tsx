"use client";

import {
  createBackupAction,
  getBackupListAction,
  restoreBackupAction,
} from "@/actions/db-actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shadcn/components/ui/alert-dialog";
import { Button } from "@/shadcn/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shadcn/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/components/ui/select";
import { Database, Download, Loader2, Plus, RotateCcw } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

type BackupInfo = {
  name: string;
  createdAt: string;
};

export function DatabaseBackupCard() {
  const [isListing, startList] = useTransition();
  const [isCreating, startCreate] = useTransition();
  const [isRestoring, startRestore] = useTransition();
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>("");

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    const formatted = date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    return `${formatted} (JST)`;
  };

  const refreshList = () => {
    startList(async () => {
      const list = await getBackupListAction();
      setBackups(list);
    });
  };

  const handleBackup = () => {
    startCreate(async () => {
      const res = await createBackupAction();
      if (res.success) {
        toast.success("バックアップを作成しました");
        refreshList();
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleRestore = () => {
    if (!selectedFile) return;
    startRestore(async () => {
      const res = await restoreBackupAction(selectedFile);
      if (res.success) {
        toast.success("リストアが完了しました");
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          DBバックアップ・リストア
        </CardTitle>
        <CardDescription>
          MySQLデータベースのバックアップ作成と復元を行います
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 新規バックアップ作成ボタン */}
        <Button
          onClick={handleBackup}
          disabled={isCreating}
          className="w-full"
          variant="outline"
        >
          {isCreating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          新規バックアップ作成
        </Button>

        {/* 保存済みバックアップ選択 */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            保存済みバックアップ
          </label>
          <div className="flex gap-2">
            <Select
              onValueChange={setSelectedFile}
              value={selectedFile}
              onOpenChange={(open) => {
                if (open && backups.length === 0) {
                  void refreshList();
                }
              }}
            >
              <SelectTrigger className="flex-1 h-auto py-3 [&>span]:line-clamp-none">
                <SelectValue placeholder="ファイルを選択">
                  {selectedFile && (
                    <div className="flex w-full justify-between items-start gap-1">
                      <span className="font-medium text-sm leading-none">
                        {selectedFile}
                      </span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-[400px]">
                {isListing ? (
                  <div className="flex items-center justify-center p-6 text-xs text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    リストを取得中...
                  </div>
                ) : backups.length === 0 ? (
                  <div className="p-6 text-xs text-center text-muted-foreground">
                    バックアップが見つかりません
                  </div>
                ) : (
                  backups.map((file) => (
                    <SelectItem
                      key={file.name}
                      value={file.name}
                      className="py-3 cursor-pointer"
                    >
                      <div className="flex flex-col items-start gap-1">
                        <span className="font-medium leading-none">
                          {file.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-1">
                          <span className="inline-block w-2 h-2 rounded-full bg-blue-400/50" />
                          作成日: {formatDateTime(file.createdAt)}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          {/* ダウンロードボタン */}
          <Button
            variant="secondary"
            className="flex-1"
            disabled={!selectedFile || isListing}
            onClick={() => window.open(`/api/db/download?file=${selectedFile}`)}
          >
            <Download className="mr-2 h-4 w-4" /> ダウンロード
          </Button>

          {/* リストア実行ボタン＋確認ダイアログ */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={!selectedFile || isRestoring}
              >
                {isRestoring ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="mr-2 h-4 w-4" />
                )}
                リストア実行
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>本当にリストアしますか？</AlertDialogTitle>
                <AlertDialogDescription>
                  選択したバックアップファイル <strong>{selectedFile}</strong>{" "}
                  を使用してデータベースを復元します。
                  <br />
                  <span className="text-destructive font-bold">
                    現在のデータは上書きされ、元に戻すことはできません。
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleRestore}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  リストアを確定する
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
