"use client";

import {
  cleanupGhostMediaAction,
  scanGhostMediaAction,
} from "@/actions/media-actions";
import { MaintenanceCard } from "@/components/ui/cards/maintenance-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shadcn/components/ui/card";
import { Info, Trash2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

export function Maintenance() {
  const [isPending, startTransition] = useTransition();
  const [hasScanned, setHasScanned] = useState(false);
  const [scanResult, setScanResult] = useState<{
    missingFolderCount: number;
    recordCount: number;
  } | null>(null);

  // 初回スキャン
  useEffect(() => {
    startTransition(async () => {
      const result = await scanGhostMediaAction();
      if (result.success) {
        setScanResult({
          missingFolderCount: result.missingFolderCount ?? 0,
          recordCount: result.recordCount ?? 0,
        });
      }
      setHasScanned(true);
    });
  }, []);

  // クリーンアップ実行
  const handleCleanup = () => {
    startTransition(async () => {
      const result = await cleanupGhostMediaAction();
      if (result.success) {
        toast.success(
          `削除完了: ${result.deletedRecords}件をクリーンアップしました。`
        );
        setScanResult(null);
      } else {
        toast.error(result.error || "エラーが発生しました");
      }
    });
  };

  return (
    <div className="p-8 space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* ゴーストメディア削除カード */}
        <MaintenanceCard
          title="DBクリーンアップ"
          description="実在しないフォルダに紐付いた不要なメディア情報を一括削除します。"
          icon={Trash2}
          variant="destructive"
          isPending={isPending}
          hasScanned={hasScanned}
          recordCount={scanResult?.recordCount ?? 0}
          message={`${scanResult?.missingFolderCount} 個の消滅したフォルダ内に ${scanResult?.recordCount} 件のデータが見つかりました。`}
          buttonText="ゴーストデータを削除する"
          onExecute={handleCleanup}
        />

        {/* システム情報（プレースホルダー） */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              システム情報
            </CardTitle>
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
