"use client";

import {
  GhostTag,
  scanGhostTagsAction,
} from "@/feature/ghost-tag/actions/scan";
import { deleteManyTagsAction } from "@/feature/tag/actions/delete-many";
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
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/components/ui/table";
import { CheckCircle2, Loader2, Search, Tag, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

export function GhostTagsCleanupCard() {
  const [isPending, setIsPending] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [tags, setTags] = useState<GhostTag[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // スキャン
  const handleScan = useCallback(async () => {
    setIsPending(true);
    try {
      const result = await scanGhostTagsAction();
      if (result.success) {
        setTags(result.tags);
        // デフォルトで全選択
        setSelectedIds(new Set(result.tags.map((t) => t.id)));
        setHasScanned(true);
      } else {
        toast.error(result.message);
      }
    } finally {
      setIsPending(false);
    }
  }, []);

  // 削除
  const handleDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);

    setIsPending(true);
    try {
      const result = await deleteManyTagsAction({ ids });
      if (result.success) {
        toast.success(`完了: ${result.deletedCount} 件のタグを削除しました。`);
        setTags([]);
        setSelectedIds(new Set());
        setHasScanned(false);
      } else {
        toast.error(result.message);
      }
    } finally {
      setIsPending(false);
    }
  }, [selectedIds]);

  // 全選択/解除
  const toggleSelectAll = () => {
    if (selectedIds.size === tags.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tags.map((t) => t.id)));
    }
  };

  // 選択/解除
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
          ゴーストタグ削除
        </CardTitle>
        <CardDescription>
          どのメディアレコードにも紐付いていないタグをスキャンして削除します。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ステータス & テーブルエリア */}
        <div className="border rounded-md bg-muted/10 overflow-hidden">
          {!hasScanned ? (
            <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground gap-2">
              {isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              {isPending ? "スキャン中..." : "スキャンしてください"}
            </div>
          ) : tags.length > 0 ? (
            <div className="max-h-[300px] overflow-y-auto border-t">
              {/* NOTE: shadcn の Table だとヘッダーの sticky が効かない */}
              <table className="w-full caption-bottom text-sm">
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
                    </TableRow>
                  ))}
                </TableBody>
              </table>
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
            onClick={() => void handleScan()}
            disabled={isPending}
            className="flex-1"
          >
            <Search className="mr-2 h-4 w-4" />
            {!hasScanned ? "スキャン" : "再スキャン"}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="flex-[2]"
                disabled={isPending || !hasScanned || selectedIds.size === 0}
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                選択した {selectedIds.size} 件を削除
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>本当に削除しますか？</AlertDialogTitle>
                <AlertDialogDescription>
                  選択された {selectedIds.size} 件のタグを完全に削除します。
                  この操作は元に戻せませんが、よろしいですか？
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => void handleDelete()}
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
