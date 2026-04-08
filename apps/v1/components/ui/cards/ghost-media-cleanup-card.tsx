"use client";

import {
  GhostMediaDeleteResult,
  GhostMediaItem,
  GhostMediaScanOptions,
  GhostMediaScanResult,
} from "@/lib/media/types";
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
import { Label } from "@/shadcn/components/ui/label";
import { Switch } from "@/shadcn/components/ui/switch";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Search,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

interface GhostMediaCleanupCardProps {
  onScan: (options?: GhostMediaScanOptions) => Promise<GhostMediaScanResult>;
  onDelete: (ids: string[]) => Promise<GhostMediaDeleteResult>;
  autoScan?: boolean;
}

export function GhostMediaCleanupCard({
  onScan,
  onDelete,
  autoScan = false,
}: GhostMediaCleanupCardProps) {
  const [isPending, startTransition] = useTransition();
  const [isFullScan, setIsFullScan] = useState(false);
  const [items, setItems] = useState<GhostMediaItem[] | null>(null);

  // スキャン実行
  const handleScan = useCallback(() => {
    startTransition(async () => {
      const result = await onScan({ fullScan: isFullScan });
      if (result.success) {
        setItems(result.items ?? []);
      } else {
        toast.error(result.error || "スキャン中にエラーが発生しました");
      }
    });
  }, [onScan, isFullScan]);

  // 削除実行
  const handleDelete = useCallback(() => {
    if (!items || items.length === 0) return;
    const ids = items.map((n) => n.id);
    startTransition(async () => {
      const result = await onDelete(ids);
      if (result.success) {
        toast.success(`${result.deletedCount}件のゴーストデータを削除しました`);
        setItems(null);
      } else {
        toast.error(result.error || "削除中にエラーが発生しました");
      }
    });
  }, [onDelete, items]);

  // 初回のみ自動スキャン
  useEffect(() => {
    if (autoScan) handleScan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="border-destructive/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-destructive text-lg">
            <Trash2 className="w-5 h-5" /> ゴーストデータ削除
          </CardTitle>
          <CardDescription>
            実体のないメディアレコードを掃除します
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 border p-2 rounded-md bg-muted/50">
          <Switch
            id="scan-mode"
            checked={isFullScan}
            onCheckedChange={(checked) => {
              setIsFullScan(checked);
              setItems(null); // モードを変えたら結果をクリアしてスキャンを促す
            }}
          />
          <Label
            htmlFor="scan-mode"
            className="text-xs font-bold cursor-pointer"
          >
            フルスキャン
          </Label>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ステータス表示 */}
        <div className="flex items-center h-10 px-3 border rounded bg-muted/20 text-sm">
          {isPending ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />{" "}
              {items ? "削除中..." : "スキャン中..."}
            </div>
          ) : items === null ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Search className="w-4 h-4" />{" "}
              モードを選択してスキャンしてください
            </div>
          ) : items.length > 0 ? (
            <div className="flex items-center gap-2 text-orange-600 font-medium">
              <AlertCircle className="w-4 h-4" /> {items.length}
              件の不要データを発見
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-600 font-medium">
              <CheckCircle2 className="w-4 h-4" /> クリーンな状態です
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {/* スキャンボタン：フルスキャン時のみダイアログを出す */}
          {isFullScan && items === null ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={isPending}
                >
                  フルスキャン実行
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    フルスキャンを開始しますか？
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    全ファイルの存在を確認するため、完了まで時間がかかる場合があります。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>キャンセル</AlertDialogCancel>
                  <AlertDialogAction onClick={handleScan}>
                    実行する
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleScan}
              disabled={isPending}
            >
              {items === null ? "スキャン" : "再スキャン"}
            </Button>
          )}

          {/* 削除ボタン */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="flex-[2]"
                disabled={isPending || !items || items.length === 0}
              >
                削除を実行
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>本当に削除しますか？</AlertDialogTitle>
                <AlertDialogDescription>
                  検出された {items?.length}{" "}
                  件のレコードをDBから削除します。この操作は取り消せません。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>やめる</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  削除する
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
