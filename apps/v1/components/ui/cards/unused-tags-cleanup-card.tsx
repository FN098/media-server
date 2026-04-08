"use client";

import {
  UnusedTagDeleteResult,
  UnusedTagItem,
  UnusedTagScanResult,
} from "@/lib/tag/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn-overrides/components/ui/table";
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
import { Checkbox } from "@/shadcn/components/ui/checkbox";
import { CheckCircle2, Loader2, Search, Tag } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

interface UnusedTagsCleanupCardProps {
  onScan: () => Promise<UnusedTagScanResult>;
  onDelete: (ids: string[]) => Promise<UnusedTagDeleteResult>;
  autoScan?: boolean;
}

export function UnusedTagsCleanupCard({
  onScan,
  onDelete,
  autoScan = false,
}: UnusedTagsCleanupCardProps) {
  const [isPending, startTransition] = useTransition();
  const [hasScanned, setHasScanned] = useState(false);
  const [tags, setTags] = useState<UnusedTagItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // スキャン処理
  const handleScan = useCallback(() => {
    startTransition(async () => {
      const result = await onScan();
      if (result.success && result.tags) {
        setTags(result.tags);
        // デフォルトで全選択
        setSelectedIds(new Set(result.tags.map((t) => t.id)));
        setHasScanned(true);
      } else {
        toast.error(result.error || "スキャン中にエラーが発生しました");
      }
    });
  }, [onScan]);

  // 削除処理
  const handleDelete = useCallback(() => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    startTransition(async () => {
      const result = await onDelete(ids);
      if (result.success) {
        toast.success(`完了: ${result.deletedCount} 件のタグを削除しました。`);
        setTags([]);
        setSelectedIds(new Set());
        setHasScanned(false);
      } else {
        toast.error(result.error || "削除中にエラーが発生しました");
      }
    });
  }, [onDelete, selectedIds]);

  // 初回のみ自動スキャン
  useEffect(() => {
    if (autoScan) handleScan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 選択制御
  const toggleSelectAll = () => {
    if (selectedIds.size === tags.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tags.map((t) => t.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Tag className="w-5 h-5" />
          未使用タグ削除
        </CardTitle>
        <CardDescription>
          どのファイルにも紐付いていないタグをスキャンして削除します。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ステータス & テーブルエリア */}
        <div className="border rounded-md bg-muted/10 overflow-hidden">
          {!hasScanned ? (
            <div className="h-[200px] flex flex-col items-center justify-center text-sm text-muted-foreground gap-2">
              {isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              {isPending
                ? "スキャン中..."
                : "スキャンを実行して未使用タグを確認"}
            </div>
          ) : tags.length > 0 ? (
            <div className="max-h-[300px] overflow-y-auto border-t">
              <Table noWrapper>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[50px] sticky top-0 bg-background z-10 shadow-[sm]">
                      <Checkbox
                        checked={
                          selectedIds.size === tags.length && tags.length > 0
                        }
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="sticky top-0 bg-background z-10 shadow-[sm]">
                      タグ名
                    </TableHead>
                    <TableHead className="text-right sticky top-0 bg-background z-10 shadow-[sm]">
                      ID
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tags.map((tag) => (
                    <TableRow key={tag.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(tag.id)}
                          onCheckedChange={() => toggleSelect(tag.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{tag.name}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground font-mono">
                        {tag.id.split("-")[0]}...
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="h-[100px] flex items-center justify-center gap-2 text-sm text-green-600 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              未使用のタグは見つかりませんでした。
            </div>
          )}
        </div>

        {/* アクションエリア */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleScan}
            disabled={isPending}
            className="flex-1"
          >
            再スキャン
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="flex-[2]"
                disabled={isPending || !hasScanned || selectedIds.size === 0}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                選択した {selectedIds.size} 件を削除
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>タグの削除</AlertDialogTitle>
                <AlertDialogDescription>
                  選択された {selectedIds.size} 件のタグを完全に削除します。
                  この操作は元に戻せませんが、よろしいですか？
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground"
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
