"use client";

import { cleanupGhostMediaAction } from "@/actions/media-actions"; // パスは適宜調整
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
import { Loader2, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner"; // または普段お使いの通知ライブラリ

export default function MaintenancePage() {
  const [isPending, startTransition] = useTransition();

  const handleCleanup = () => {
    startTransition(async () => {
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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isPending}>
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  ゴーストデータを削除する
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>本当に実行しますか？</AlertDialogTitle>
                  <AlertDialogDescription>
                    この操作は取り消せません。実在しないフォルダに関連付けられたすべてのメディア情報、お気に入り、タグ付けがデータベースから完全に削除されます。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>キャンセル</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCleanup}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    実行する
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
