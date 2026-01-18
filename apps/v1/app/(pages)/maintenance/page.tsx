"use client";

import { cleanupGhostMediaAction } from "@/actions/media-actions"; // パスは適宜調整
import { Button } from "@/shadcn/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shadcn/components/ui/card";
import { Loader2, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner"; // または普段お使いの通知ライブラリ

export default function MaintenancePage() {
  const [isPending, startTransition] = useTransition();

  const handleCleanup = () => {
    startTransition(async () => {
      const confirmed = confirm(
        "実在しないフォルダのDBレコードを削除します。よろしいですか？",
      );
      if (!confirmed) return;

      const result = await cleanupGhostMediaAction();
      if (result.success) {
        toast.success(
          `クリーンアップ完了: ${result.removedFolders}個のフォルダを検知し、${result.deletedRecords}件のデータを削除しました。`,
          { duration: 5000 },
        );
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
              ファイルシステム上で既に削除されたフォルダをスキャンし、DBに残っている不要なレコード（Media/Tags/Favorites）を一括削除します。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={handleCleanup}
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              ゴーストデータを削除する
            </Button>
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
