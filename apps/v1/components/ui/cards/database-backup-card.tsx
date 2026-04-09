"use client";

import {
  createBackupAction,
  getBackupListAction,
  restoreBackupAction,
} from "@/actions/db-actions";
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

export function DatabaseBackupCard() {
  const [isListing, startList] = useTransition();
  const [isCreating, startCreate] = useTransition();
  const [isRestoring, startRestore] = useTransition();
  const [backups, setBackups] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>("");

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

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            保存済みバックアップ
          </label>
          <div className="flex gap-2">
            <Select
              onValueChange={setSelectedFile}
              value={selectedFile}
              onOpenChange={(open) => {
                if (open) {
                  void refreshList();
                }
              }}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="ファイルを選択" />
              </SelectTrigger>
              <SelectContent>
                {isListing ? (
                  <div className="flex items-center justify-center p-4 text-xs text-muted-foreground">
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    リストを取得中...
                  </div>
                ) : backups.length === 0 ? (
                  <div className="p-4 text-xs text-center text-muted-foreground">
                    バックアップファイルが見つかりません
                  </div>
                ) : (
                  backups.map((file) => (
                    <SelectItem key={file} value={file}>
                      {file}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            disabled={!selectedFile || isListing}
            onClick={() => window.open(`/api/db/download?file=${selectedFile}`)}
          >
            <Download className="mr-2 h-4 w-4" /> ダウンロード
          </Button>

          <Button
            variant="destructive"
            className="flex-1"
            disabled={!selectedFile || isRestoring}
            onClick={handleRestore}
          >
            <RotateCcw className="mr-2 h-4 w-4" /> リストア実行
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
