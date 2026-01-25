"use client";

import {
  cleanupGhostMediaAction,
  scanGhostMediaAction,
} from "@/actions/media-actions"; // パスは適宜調整
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
import { AlertCircle, CheckCircle2, Loader2, Trash2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner"; // または普段お使いの通知ライブラリ

export default function MaintenancePage() {
  const [isPending, startTransition] = useTransition();
  const [scanResult, setScanResult] = useState<{
    missingFolderCount: number;
    recordCount: number;
  } | null>(null);
  const [hasScanned, setHasScanned] = useState(false);

  // 初回表示時に自動スキャン
  useEffect(() => {
    startTransition(async () => {
      const result = await scanGhostMediaAction();
      if (result.success) {
        setScanResult({
          missingFolderCount: result.missingFolderCount!,
          recordCount: result.recordCount!,
        });
      }
      setHasScanned(true);
    });
  }, []);

  // 削除処理
  const handleCleanup = () => {
    startTransition(async () => {
      const result = await cleanupGhostMediaAction();
      if (result.success) {
        toast.success(
          `削除完了: ${result.deletedRecords}件のデータをクリーンアップしました。`
        );
        setScanResult(null);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="p-8 space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              DBクリーンアップ
            </CardTitle>
            <CardDescription>
              実在しないフォルダに紐付いた不要なメディア情報を一括削除します。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="min-h-[40px] flex items-center">
              {!hasScanned ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  データベースをスキャン中...
                </div>
              ) : scanResult && scanResult.recordCount > 0 ? (
                <div className="flex items-center gap-2 text-sm font-medium text-orange-600 animate-in zoom-in-95">
                  <AlertCircle className="w-4 h-4" />
                  {scanResult.missingFolderCount} 個の消滅したフォルダ内に
                  {scanResult.recordCount} 件のデータが見つかりました。
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm font-medium text-green-600 animate-in zoom-in-95">
                  <CheckCircle2 className="w-4 h-4" />
                  クリーンな状態です。ゴーストデータは見つかりませんでした。
                </div>
              )}
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full"
                  disabled={
                    isPending || !scanResult || scanResult.recordCount === 0
                  }
                >
                  {isPending && scanResult && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  ゴーストデータを削除する
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>最終確認</AlertDialogTitle>
                  <AlertDialogDescription>
                    見つかった {scanResult?.recordCount}
                    件のレコードを削除します。この操作は元に戻せません。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>やめる</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCleanup}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    実行
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* 将来的に他のメンテナンス項目を追加できる */}
        <Card>
          <CardHeader>
            <CardTitle>システム情報</CardTitle>
            <CardDescription>
              DBの状態やインデックスの再構築など（予定）
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              現在実装されている項目はありません。
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
