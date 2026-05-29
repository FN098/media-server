"use client";

import {
  cleanupOldBackupsAction,
  createBackupAction,
  getBackupListAction,
  restoreBackupAction,
} from "@/lib/db-backup/actions";
import { MAX_KEEP_COUNT, MIN_KEEP_COUNT } from "@/lib/db-backup/config";
import { DbBackupFile, DbBackupUploadResult } from "@/lib/db-backup/types";
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
  Upload,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

type DbBackupSelectItem = {
  key: string; // Select 用のキー。自動保存は「saved:」、アップロードは「upload:」がプレフィックスにつく。例: saved:backup_20200101000000.sql
  value: DbBackupFile;
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
  const [isUploading, startUploading] = useTransition();

  const [backupFiles, setBackupFiles] = useState<DbBackupSelectItem[]>([]);
  const [uploadedFile, setUploadedFile] = useState<DbBackupSelectItem | null>(
    null
  );

  const displayBackupFiles = useMemo(
    () => [uploadedFile, ...backupFiles].filter((v) => !!v),
    [backupFiles, uploadedFile]
  );

  const [selectedFile, setSelectedFile] = useState<DbBackupSelectItem | null>(
    null
  );

  const [autoCleanup, setAutoCleanup] = useState(true);
  const [keepCount, setKeepCount] = useState(5);

  const [showCleanupConfirm, setShowCleanupConfirm] = useState(false);
  const [pendingDeleteCount, setPendingDeleteCount] = useState(0);

  const refreshList = () => {
    startListing(async () => {
      const list = await getBackupListAction();
      setBackupFiles(
        list.map((v) => ({
          key: `saved:${v.name}`,
          value: v,
        }))
      );
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
          } else if (!cleanRes.success) {
            toast.error(
              cleanRes.error ?? "バックアップのクリーンアップに失敗しました"
            );
          }
        }

        refreshList();
      } else {
        toast.error(res.error ?? "バックアップの作成に失敗しました");
      }
    });
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];

    if (!file) return;

    // クライアント側でも簡易チェック（Zod を使ってもOK）
    if (!file.name.endsWith(".sql")) {
      toast.error(".sql ファイルを選択してください");
      input.value = "";
      return;
    }

    startUploading(async () => {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/db/upload", {
          method: "POST",
          body: formData,
        });

        const data = (await res.json()) as DbBackupUploadResult;

        if (data.success) {
          const uploaded = {
            key: `upload:${data.backup.name}`,
            value: data.backup,
          };
          setUploadedFile(uploaded);
          setSelectedFile(uploaded);
          toast.success("一時ファイルをアップロードしました");
        } else {
          toast.error(data.error);
        }
      } catch {
        toast.error("通信エラーが発生しました");
      } finally {
        // 確実にリセット（既にやっていても念の為）
        input.value = "";
      }
    });
  };

  const handleRestore = () => {
    if (!selectedFile) return;

    startRestoring(async () => {
      const res = await restoreBackupAction(selectedFile.value);
      if (res.success) {
        toast.success("リストアが完了しました");
        // 一時ファイルだった場合は、リストから消去して選択を解除
        if (selectedFile.value.isTemp) {
          setUploadedFile(null);
          setSelectedFile(null);
        }
      } else {
        toast.error(res.error);
      }
    });
  };

  const initiateBackup = () => {
    if (!autoCleanup) {
      handleBackup();
      return;
    }

    // 最新のリストを取得して件数を確認
    // (表示中の backupFiles を使わず、常に最新状態を取ることで判定ミスを防ぐ)
    startListing(async () => {
      const list = await getBackupListAction();
      const mappedList = list.map((v) => ({
        key: `saved:${v.name}`,
        value: v,
      }));
      setBackupFiles(mappedList);

      // 今から作る1件を加えた合計が keepCount を超えるか計算
      const deleteCount = mappedList.length + 1 - keepCount;

      if (deleteCount > 0) {
        setPendingDeleteCount(deleteCount);
        setShowCleanupConfirm(true);
      } else {
        handleBackup();
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
          データベースのバックアップ作成と復元を行います
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 新規バックアップ作成ボタン */}
        <Button
          onClick={initiateBackup}
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

        {/* バックアップ確認ダイアログ（必要に応じて表示） */}
        <AlertDialog
          open={showCleanupConfirm}
          onOpenChange={setShowCleanupConfirm}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>バックアップの作成と整理</AlertDialogTitle>
              <AlertDialogDescription>
                新しいバックアップを作成すると、保持設定（{keepCount}
                件）を超えるため、
                <strong className="text-destructive mx-1">
                  {pendingDeleteCount} 件
                </strong>
                の古いバックアップが自動的に削除されます。
                <br />
                <br />
                続行してもよろしいですか？
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setShowCleanupConfirm(false);
                  handleBackup();
                }}
              >
                削除を承諾して作成
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* バックアップ設定セクション */}
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
                min={MIN_KEEP_COUNT}
                max={MAX_KEEP_COUNT}
                value={keepCount}
                onChange={(e) => setKeepCount(Number(e.target.value))}
                className="h-8 w-20"
              />
              <span className="text-xs text-muted-foreground">件</span>
            </div>
          )}
        </div>

        {/* アップロードボタン */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted-foreground">
            外部バックアップのインポート
          </label>
          <div className="relative">
            <Input
              type="file"
              accept=".sql"
              onChange={handleUpload}
              disabled={isUploading}
              className="hidden"
              id="db-upload"
            />
            <Button
              asChild
              variant="secondary"
              className="w-full border-dashed border-2"
              disabled={isUploading}
            >
              <label htmlFor="db-upload" className="cursor-pointer">
                {isUploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                SQLファイルを一時アップロード
              </label>
            </Button>
          </div>
        </div>

        {/* 保存済みバックアップ選択 */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            保存済みバックアップ
          </label>
          <div className="flex gap-2">
            <Select
              onValueChange={(k) =>
                setSelectedFile(
                  displayBackupFiles.find((f) => f.key === k) ?? null
                )
              }
              value={selectedFile?.key ?? ""}
              onOpenChange={(open) => {
                if (open && backupFiles.length === 0) {
                  void refreshList();
                }
              }}
            >
              <SelectTrigger className="flex-1 h-auto py-3 [&>span]:line-clamp-none">
                <SelectValue placeholder="ファイルを選択">
                  {selectedFile && (
                    <div className="flex items-center gap-2">
                      {selectedFile.value.isTemp && (
                        <Upload className="w-4 h-4 text-amber-600" />
                      )}
                      <span className="font-medium text-sm">
                        {selectedFile.value.label}
                      </span>
                      {selectedFile.value.isTemp && (
                        <span className="text-[10px] text-amber-600 font-bold">
                          (一時ファイル)
                        </span>
                      )}
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent
                position="popper"
                sideOffset={4}
                className="max-h-[400px] w-[var(--radix-select-trigger-width)]"
              >
                {isListing ? (
                  <div className="flex items-center justify-center p-4 gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    リストを取得中...
                  </div>
                ) : displayBackupFiles.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    バックアップが見つかりません
                  </div>
                ) : (
                  displayBackupFiles.map((file) => (
                    <SelectItem
                      key={file.key}
                      value={file.key}
                      className={`py-3 cursor-pointer transition-colors ${
                        file.value.isTemp
                          ? "bg-amber-50/50 border-l-4 border-l-amber-400 focus:bg-amber-100 dark:bg-amber-950/40 dark:border-l-amber-600 dark:focus:bg-amber-900/60"
                          : ""
                      }`}
                    >
                      <div className="flex flex-col items-start gap-1">
                        <div className="flex items-center gap-2">
                          {file.value.isTemp && (
                            <Upload className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          )}
                          <span
                            className={`font-medium leading-none text-sm ${
                              file.value.isTemp
                                ? "text-amber-900 dark:text-amber-100"
                                : ""
                            }`}
                          >
                            {file.value.label}
                          </span>
                          {file.value.isTemp && (
                            <span className="text-[9px] bg-amber-200 text-amber-700 px-1.5 py-0.5 rounded-full font-bold tracking-wider dark:bg-amber-800 dark:text-amber-100">
                              TEMP
                            </span>
                          )}
                        </div>

                        <div className="text-[10px] text-muted-foreground flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1">
                            <span
                              className={`inline-block w-2 h-2 rounded-full ${
                                file.value.isTemp
                                  ? "bg-amber-400 dark:bg-amber-500"
                                  : "bg-blue-400/50"
                              }`}
                            />
                            {`作成日: ${formatDateTime(file.value.createdAt)}`}
                          </span>
                          <span className="flex items-center gap-1 border-l pl-3 dark:border-muted/20">
                            サイズ: {formatBytes(file.value.size)}
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
            disabled={!selectedFile || isListing || selectedFile.value.isTemp}
            onClick={() => {
              if (!selectedFile) return;
              const url = `/api/db/download?file=${encodeURIComponent(selectedFile.value.name)}`;
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
                  選択したバックアップファイル{" "}
                  <strong>{selectedFile?.value.label}</strong>{" "}
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
