import { DbBackupUploadResult } from "@/app/api/db/upload/route";
import { cleanupOldBackupsAction } from "@/feature/maintenance/db-backup/actions/cleanup";
import { dumpDatabaseAction } from "@/feature/maintenance/db-backup/actions/dump";
import { listDbBackupsAction } from "@/feature/maintenance/db-backup/actions/list";
import { restoreDatabaseAction } from "@/feature/maintenance/db-backup/actions/restore";
import { DbBackupFile } from "@/lib/db-backup/types";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

type DbBackupSelectItem = {
  // Select 用のキー。自動保存は「saved:」、アップロードは「upload:」がプレフィックスにつく。
  // 例: saved:backup_20200101000000.sql
  key: string;
  value: DbBackupFile;
};

export function useDatabaseBackup() {
  const [isListing, setIsListing] = useState(false);
  const [isDumping, setIsDumping] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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

  const refreshList = useCallback(async () => {
    if (isListing) return;
    setIsListing(true);
    try {
      const result = await listDbBackupsAction();
      if (result.success) {
        setBackupFiles(
          result.files.map((f) => ({
            key: `saved:${f.name}`,
            value: f,
          }))
        );
      } else {
        toast.error(result.message);
      }
    } catch (e) {
      console.error(e);
      toast.error("通信エラーが発生しました");
    } finally {
      setIsListing(false);
    }
  }, [isListing]);

  const performDump = useCallback(async () => {
    if (isDumping) return;
    setIsDumping(true);
    try {
      const result = await dumpDatabaseAction();
      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success("バックアップを作成しました");

      // 自動クリーンアップがONの場合のみ実行
      if (autoCleanup) {
        const cleanResult = await cleanupOldBackupsAction({ keepCount });
        if (cleanResult.success && cleanResult.deletedCount > 0) {
          toast.info(
            `古いバックアップを ${cleanResult.deletedCount} 件削除しました`
          );
        } else if (!cleanResult.success) {
          toast.error(cleanResult.message);
        }
      }

      await refreshList();
    } catch (e) {
      console.error(e);
      toast.error("通信エラーが発生しました");
    } finally {
      setIsDumping(false);
    }
  }, [autoCleanup, isDumping, keepCount, refreshList]);

  const performUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target;
      const file = input.files?.[0];

      if (!file || isUploading) return;

      // クライアント側でも簡易チェック（Zod を使ってもOK）
      if (!file.name.endsWith(".sql")) {
        toast.error(".sql ファイルを選択してください");
        input.value = "";
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      setIsUploading(true);
      try {
        const response = await fetch("/api/db/upload", {
          method: "POST",
          body: formData,
        });

        const result = (await response.json()) as DbBackupUploadResult;
        if (result.success) {
          const uploaded = {
            key: `upload:${result.backup.name}`,
            value: result.backup,
          };
          setUploadedFile(uploaded);
          setSelectedFile(uploaded);
          toast.success("一時ファイルをアップロードしました");
        } else {
          toast.error(result.error);
        }
      } catch (e) {
        console.error(e);
        toast.error("通信エラーが発生しました");
      } finally {
        // 確実にリセット（既にやっていても念の為）
        input.value = "";
        setIsUploading(false);
      }
    },
    [isUploading]
  );

  const performRestore = useCallback(async () => {
    if (!selectedFile || isRestoring) return;

    setIsRestoring(true);
    try {
      const result = await restoreDatabaseAction({
        isTemp: selectedFile.value.isTemp,
        name: selectedFile.value.name,
      });
      if (result.success) {
        toast.success("リストアが完了しました");
        // 一時ファイルだった場合は、リストから消去して選択を解除
        if (selectedFile.value.isTemp) {
          setUploadedFile(null);
          setSelectedFile(null);
        }
      } else {
        toast.error(result.message);
      }
    } catch (e) {
      console.error(e);
      toast.error("通信エラーが発生しました");
    } finally {
      setIsRestoring(false);
    }
  }, [isRestoring, selectedFile]);

  const initiateDump = useCallback(async () => {
    if (!autoCleanup) {
      await performDump();
      return;
    }

    if (isListing) return;
    setIsListing(true);
    try {
      // 最新のリストを取得して件数を確認
      // (表示中の backupFiles を使わず、常に最新状態を取ることで判定ミスを防ぐ)
      const result = await listDbBackupsAction();
      if (!result.success) {
        toast.error(result.message);
        return;
      }

      const latestList = result.files.map((f) => ({
        key: `saved:${f.name}`,
        value: f,
      }));

      setBackupFiles(latestList);

      // 今から作る1件を加えた合計が keepCount を超えるか計算
      const deleteCount = latestList.length + 1 - keepCount;

      if (deleteCount > 0) {
        setPendingDeleteCount(deleteCount);
        setShowCleanupConfirm(true);
      } else {
        await performDump();
      }
    } catch (e) {
      console.error(e);
      toast.error("通信エラーが発生しました");
    } finally {
      setIsListing(false);
    }
  }, [autoCleanup, performDump, isListing, keepCount]);

  return {
    isListing,
    isDumping,
    isRestoring,
    isUploading,
    backupFiles,
    uploadedFile,
    displayBackupFiles,
    selectedFile,
    setSelectedFile,
    autoCleanup,
    setAutoCleanup,
    keepCount,
    setKeepCount,
    showCleanupConfirm,
    setShowCleanupConfirm,
    pendingDeleteCount,
    refreshList,
    performDump,
    performRestore,
    performUpload,
    initiateDump,
  };
}
