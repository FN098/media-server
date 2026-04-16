"use client";

import {
  cleanupOldBackupsAction,
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
import { Input } from "@/shadcn/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/components/ui/select";
import { Switch } from "@/shadcn/components/ui/switch";
import {
  Database,
  Download,
  Loader2,
  Plus,
  RotateCcw,
  Settings2,
} from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

type BackupInfo = {
  name: string;
  createdAt: string;
  size: number; // バイト単位
};

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

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export function DatabaseBackupCard() {
  const [isListing, startListing] = useTransition();
  const [isCreating, startCreating] = useTransition();
  const [isRestoring, startRestoring] = useTransition();
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [autoCleanup, setAutoCleanup] = useState(true);
  const [keepCount, setKeepCount] = useState(5);

  const refreshList = () => {
    startListing(async () => {
      const list = await getBackupListAction();
      setBackups(list);
    });
  };

  const handleBackup = () => {
    startCreating(async () => {
      const res = await createBackupAction();
      if (res.success) {
        toast.success("バックアップを作成しました");

        // 自動クリーンアップがONの場合のみ実行
        if (autoCleanup) {
          const cleanRes = await cleanupOldBackupsAction(keepCount);
          if (cleanRes.success && cleanRes.deletedCount! > 0) {
            toast.info(
              `古いバックアップを ${cleanRes.deletedCount} 件削除しました`
            );
          }
        }

        refreshList();
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleRestore = () => {
    if (!selectedFile) return;
    startRestoring(async () => {
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

        {/* 設定セクション */}
        <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Settings2 className="w-4 h-4 text-muted-foreground" />
              自動クリーンアップ設定
            </div>
            <Switch checked={autoCleanup} onCheckedChange={setAutoCleanup} />
          </div>

          {autoCleanup && (
            <div className="flex items-center gap-3 pl-6">
              <label className="text-xs text-muted-foreground whitespace-nowrap">
                保持する世代数:
              </label>
              <Input
                type="number"
                min={1}
                max={50}
                value={keepCount}
                onChange={(e) => setKeepCount(Number(e.target.value))}
                className="h-8 w-20"
              />
              <span className="text-xs text-muted-foreground">件</span>
            </div>
          )}
        </div>

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
                        <span className="font-medium leading-none text-sm">
                          {file.name}
                        </span>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1">
                            <span className="inline-block w-2 h-2 rounded-full bg-blue-400/50" />
                            作成日: {formatDateTime(file.createdAt)}
                          </span>
                          <span className="flex items-center gap-1 border-l pl-3">
                            サイズ: {formatBytes(file.size)}
                          </span>
                        </div>
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
            onClick={() => {
              const url = `/api/db/download?file=${encodeURIComponent(selectedFile)}`;
              window.location.href = url;
            }}
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
