"use client";

import { TagMasterCardList } from "@/components/ui/cards/tag-master-manager-card/tag-master-card-list";
import { TagMasterTable } from "@/components/ui/cards/tag-master-manager-card/tag-master-table";
import { useDetectMobileContext } from "@/providers/mobile/mobile-provider";
import { useTagMasterContext } from "@/providers/tag-editor/tag-master-provider";
import { Button } from "@/shadcn/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shadcn/components/ui/card";
import { Input } from "@/shadcn/components/ui/input";
import { Label } from "@/shadcn/components/ui/label";
import { Switch } from "@/shadcn/components/ui/switch";
import { cn } from "@/shadcn/lib/utils";
import { Check, CheckCheck, Loader2, Plus, Search, Tags } from "lucide-react";

export function TagMasterManagerCard() {
  const {
    filter,
    setFilter,
    isMarking,
    newTagsInput,
    isCreating,
    showNewOnly,
    setShowNewOnly,
    hasNewTags,
    newTagIds,
    newTagsCount,
    setNewTagsInput,
    handleCreateTags,
    markAsRead,
  } = useTagMasterContext();

  const isMobile = useDetectMobileContext();

  return (
    <Card className="shadow-md border-muted/60">
      {/* タイトル・説明 */}
      <CardHeader className="pb-4">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-primary text-xl">
            <Tags className="w-6 h-6" />
            タグマスター管理
          </CardTitle>
          <CardDescription>
            五十音順で表示。ピン留めや検索、一括既読管理が可能です。
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="p-0 sm:p-6 sm:pt-0 space-y-4">
        {/* メイン操作メニュー */}
        <div className="space-y-3 px-4 sm:px-0">
          {/* タグ検索 */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="タグ名または読みで検索..."
              className="pl-9 h-11 bg-muted/20 border-muted focus-visible:ring-primary/30"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>

          {/* 新規タグ追加 */}
          <form
            onSubmit={handleCreateTags}
            className="flex gap-2 bg-muted/30 p-2 rounded-lg border border-dashed border-muted-foreground/30 items-center"
          >
            <div className="relative flex-1">
              <Plus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="新しいタグを追加..."
                className="pl-9 bg-background border-none shadow-none focus-visible:ring-1"
                value={newTagsInput}
                onChange={(e) => setNewTagsInput(e.target.value)}
                disabled={isCreating}
              />
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={isCreating || !newTagsInput.trim()}
              className="shrink-0"
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "追加"
              )}
            </Button>
          </form>
        </div>

        {/* 境界線 */}
        <hr className="border-muted/60 mx-4 sm:mx-0" />

        {/* その他の操作メニュー */}
        <div className="flex flex-row justify-between items-start sm:items-center gap-3 px-4 sm:px-0">
          {/* 新規のみフィルター */}
          <div className="flex items-center gap-3 border rounded-lg px-4 h-9 bg-card shadow-sm shrink-0">
            <Label
              htmlFor="new-only"
              className="text-sm font-medium cursor-pointer text-muted-foreground"
            >
              新規のみ
            </Label>
            <Switch
              id="new-only"
              checked={showNewOnly}
              onCheckedChange={setShowNewOnly}
            />
          </div>

          {/* 既読チェックボタン */}
          <Button
            variant={hasNewTags ? "default" : "secondary"}
            size="sm"
            className={cn(
              "transition-all shrink-0",
              hasNewTags ? "shadow-sm" : "opacity-60"
            )}
            onClick={() => hasNewTags && markAsRead(newTagIds)}
            disabled={isMarking || !hasNewTags}
          >
            {isMarking ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : hasNewTags ? (
              <CheckCheck className="h-4 w-4 mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            <span className="font-semibold">
              {hasNewTags ? `${newTagsCount} 件を既読にする` : "すべて既読済み"}
            </span>
          </Button>
        </div>

        {/* タグ一覧 */}
        <div className="pt-2">
          {isMobile ? <TagMasterCardList /> : <TagMasterTable />}
        </div>
      </CardContent>
    </Card>
  );
}
