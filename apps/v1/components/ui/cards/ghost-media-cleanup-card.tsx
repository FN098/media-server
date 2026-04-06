"use client";

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
  AlertCircle,
  CheckCircle2,
  Loader2,
  Search,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

export type ScanResult = {
  success: boolean;
  recordCount?: number;
  missingFolderCount?: number;
  error?: string;
};

export type ExecuteResult = {
  success: boolean;
  deletedRecords?: number;
  error?: string;
};

interface GhostMediaCleanupCardProps {
  onScan: () => Promise<ScanResult>;
  onExecute: () => Promise<ExecuteResult>;
  autoScan?: boolean;
}

export function GhostMediaCleanupCard({
  onScan,
  onExecute,
  autoScan = false,
}: GhostMediaCleanupCardProps) {
  const [isPending, startTransition] = useTransition();
  const [hasScanned, setHasScanned] = useState(false);
  const [scanResult, setScanResult] = useState<{
    recordCount: number;
    missingFolderCount: number;
  } | null>(null);

  // スキャン処理
  const handleScan = useCallback(() => {
    startTransition(async () => {
      const result = await onScan();
      if (result.success) {
        setScanResult({
          recordCount: result.recordCount ?? 0,
          missingFolderCount: result.missingFolderCount ?? 0,
        });
        setHasScanned(true);
      } else {
        toast.error(result.error || "スキャンに失敗しました");
      }
    });
  }, [onScan]);

  // 実行処理
  const handleExecute = useCallback(() => {
    startTransition(async () => {
      const result = await onExecute();
      if (result.success) {
        toast.success(
          `完了: ${result.deletedRecords} 件のデータを削除しました。`
        );
        setScanResult(null);
        setHasScanned(false); // 実行後は再度スキャンが必要な状態にする
      } else {
        toast.error(result.error || "エラーが発生しました");
      }
    });
  }, [onExecute]);

  useEffect(() => {
    if (autoScan) handleScan();
  }, [autoScan, handleScan]);

  return (
    <Card className={"border-destructive/50"}>
      <CardHeader>
        <CardTitle className={"flex items-center gap-2 text-destructive"}>
          <Trash2 className="w-5 h-5" />
          ゴーストデータ削除
        </CardTitle>
        <CardDescription>
          実在しないフォルダに紐付いた不要なレコードをスキャンして削除します。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ステータス表示エリア */}
        <div className="min-h-[40px] flex items-center border rounded-md px-3 bg-muted/30">
          {!hasScanned ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              {isPending ? "スキャン中..." : "スキャンを実行してください"}
            </div>
          ) : scanResult && scanResult.recordCount > 0 ? (
            <div
              className={`flex items-center gap-2 text-sm font-medium animate-in zoom-in-95 text-orange-600`}
            >
              <AlertCircle className="w-4 h-4" />
              {scanResult.missingFolderCount} フォルダ /{" "}
              {scanResult.recordCount} 件のデータが対象
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm font-medium text-green-600 animate-in zoom-in-95">
              <CheckCircle2 className="w-4 h-4" />
              クリーンな状態です。
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {/* スキャンボタン（手動用） */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleScan}
            disabled={isPending}
            className="flex-1"
          >
            {isPending && !hasScanned && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            再スキャン
          </Button>

          {/* 実行ボタン（確認ダイアログ付き） */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="flex-[2]"
                disabled={
                  isPending ||
                  !hasScanned ||
                  (scanResult?.recordCount ?? 0) === 0
                }
              >
                {isPending && hasScanned && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                削除する
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>最終確認</AlertDialogTitle>
                <AlertDialogDescription>
                  対象の {scanResult?.recordCount}{" "}
                  件のデータを削除します。この操作は元に戻せません。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleExecute}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  削除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
