"use client";

import { deleteManyThumbnailsAction } from "@/feature/maintenance/components/ghost-thumbnail/actions/delete-many";
import {
  GhostThumbItem,
  GhostThumbScanEventData,
} from "@/lib/ghost-thumb/types";
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
import { Progress } from "@/shadcn/components/ui/progress";
import { Switch } from "@/shadcn/components/ui/switch";
import {
  AlertCircle,
  CheckCircle2,
  FileImage,
  Loader2,
  Search,
  Trash2,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

export function GhostThumbCleanupCard() {
  const [isPending, setIsPending] = useState(false);
  const [isFullScan, setIsFullScan] = useState(false);
  const [items, setItems] = useState<GhostThumbItem[] | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [elapsedDisplay, setElapsedDisplay] = useState(0);
  const [eta, setEta] = useState<number | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [foundCount, setFoundCount] = useState(0);

  const startTimeRef = useRef<number | null>(null);
  const esRef = useRef<EventSource | null>(null);

  // スキャン実行
  const handleScan = useCallback(() => {
    // 既存のスキャンがあれば閉じる
    if (esRef.current) esRef.current.close();

    setItems(null);
    setFoundCount(0);
    setProgress({ current: 0, total: 0 });
    setEta(null);
    setElapsedDisplay(0);
    setIsScanning(true);
    startTimeRef.current = Date.now();

    const eventSource = new EventSource(
      `/api/ghost/thumb/scan?full=${isFullScan}`
    );
    esRef.current = eventSource;

    eventSource.onmessage = (event: MessageEvent) => {
      if (typeof event.data !== "string") return;
      const data = JSON.parse(event.data) as GhostThumbScanEventData;

      switch (data.type) {
        case "progress":
          setProgress({ current: data.current, total: data.total });
          setFoundCount(data.found);

          if (startTimeRef.current) {
            const elapsed = (Date.now() - startTimeRef.current) / 1000;
            setElapsedDisplay(Math.floor(elapsed)); // UI表示用

            // 10秒経過かつ進捗がある場合のみETA計算
            if (data.current > 0 && elapsed > 10) {
              const remainingTime = elapsed * (data.total / data.current - 1);
              setEta(remainingTime);
            }
          }
          break;

        case "complete":
          setItems(data.items);
          setFoundCount(data.items.length);
          setIsScanning(false);
          eventSource.close();
          esRef.current = null;
          toast.success("サムネイルのスキャンが完了しました");
          break;

        case "error":
          setIsScanning(false);
          eventSource.close();
          esRef.current = null;
          toast.error(data.message);
          break;
      }
    };

    eventSource.onerror = () => {
      // ユーザーによる中断でない場合のみエラー表示
      if (esRef.current) {
        setIsScanning(false);
        eventSource.close();
        esRef.current = null;
        toast.error("スキャン中に接続エラーが発生しました");
      }
    };
  }, [isFullScan]);

  // 中断処理
  const handleAbort = () => {
    if (esRef.current) {
      setIsScanning(false);
      setEta(null);
      esRef.current.close();
      esRef.current = null;
      toast.info("スキャンを中断しました。");
    }
  };

  // 削除実行
  const handleDelete = useCallback(async () => {
    if (!items || items.length === 0) return;

    setIsPending(true);

    const BATCH_SIZE = 500; // 1回あたりの送信件数（1MBを超えない程度に調整）

    let totalDeleted = 0;
    let hasError = false;

    // パスを指定サイズごとに分割してループ
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);

      try {
        const result = await deleteManyThumbnailsAction({
          sourcePaths: batch.map((item) => item.path),
        });
        if (result.success) {
          totalDeleted += result.deletedCount ?? 0;
        } else {
          toast.error(result.message);
          hasError = true;
        }
      } catch (err) {
        console.error("Batch Delete Error:", err);
        toast.error("通信エラーが発生しました");
        hasError = true;
        break;
      }
    }

    setIsPending(false);

    if (!hasError) {
      toast.success(`${totalDeleted}件の不要なサムネイルを削除しました`);
      setItems(null);
    } else {
      // 途中で止まった場合、再スキャンを促すか、残りの items を更新する処理を入れると親切
      toast.info(
        "削除処理が中断されました。再スキャンして残りを確認してください。"
      );
    }
  }, [items]);

  return (
    <Card className="border-orange-500/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-600">
          <FileImage className="w-5 h-5" />
          不要サムネイル削除
        </CardTitle>
        <CardDescription>
          DBにレコードが存在しない古いサムネイルファイルを掃除します
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 進捗表示 */}
        {isScanning && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                スキャン中...
                {progress.total > 0
                  ? Math.floor((progress.current / progress.total) * 100)
                  : 0}{" "}
                % ({progress.current} / {progress.total})
              </span>
              <span>
                {elapsedDisplay ? Math.ceil(elapsedDisplay) : "--"} 秒経過
              </span>
              <span>残り約 {eta ? Math.ceil(eta) : "--"} 秒</span>
            </div>
            <Progress
              value={
                progress.total > 0
                  ? (progress.current / progress.total) * 100
                  : 0
              }
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAbort}
              className="w-full text-xs text-destructive hover:bg-destructive/10"
            >
              スキャンを中断
            </Button>
          </div>
        )}

        {/* ステータス */}
        <div className="flex items-center h-10 px-3 border rounded bg-muted/20 text-sm">
          {isPending ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />{" "}
              不要なファイル削除中...
            </div>
          ) : isScanning ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> スキャン中... (
              {foundCount}件発見)
            </div>
          ) : items === null ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Search className="w-4 h-4" /> スキャンしてください
            </div>
          ) : items.length > 0 ? (
            <div className="flex items-center gap-2 text-orange-600 font-medium">
              <AlertCircle className="w-4 h-4" /> {items.length}{" "}
              件の不要なファイルが見つかりました
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-600 font-medium">
              <CheckCircle2 className="w-4 h-4" /> クリーンな状態です
            </div>
          )}
        </div>

        {/* スキャン結果プレビュー */}
        {items && items.length > 0 && (
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              検出されたアイテム (最大100件)
            </Label>
            <div className="max-h-[160px] overflow-y-auto border rounded-md bg-muted/30 divide-y divide-border/40">
              {items.slice(0, 100).map((item, i) => (
                <div
                  key={i}
                  className="p-2 text-[10px] font-mono text-muted-foreground truncate hover:bg-muted/50"
                >
                  {item.path}
                </div>
              ))}
              {items.length > 100 && (
                <div className="p-2 text-[10px] text-center text-muted-foreground italic">
                  ほか {items.length - 100} 件を検出
                </div>
              )}
            </div>
          </div>
        )}

        {/* オプション類 */}
        <div className="flex items-center gap-2 p-1">
          <Switch
            id="thumb-scan-mode"
            checked={isFullScan}
            onCheckedChange={(checked) => {
              setIsFullScan(checked);
              setItems(null);
            }}
            disabled={isScanning}
          />
          <Label htmlFor="thumb-scan-mode" className="text-xs cursor-pointer">
            フルスキャン
          </Label>
        </div>

        {/* ボタン類 */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleScan}
            disabled={isScanning || isPending}
          >
            <Search className="mr-2 h-4 w-4" />
            {items === null ? "スキャン" : "再スキャン"}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="flex-[2]"
                disabled={
                  isScanning || isPending || !items || items.length === 0
                }
              >
                <Trash2 className="mr-2 h-4 w-4" />
                一括削除
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>削除しますか？</AlertDialogTitle>
                <AlertDialogDescription>
                  検出された {items?.length}{" "}
                  件のサムネイルファイルをサーバーから完全に削除します。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => void handleDelete()}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  削除を実行
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
