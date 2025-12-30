"use client";

import { visitFolderAction } from "@/actions/folder-actions";
import { syncMediaDirAction } from "@/actions/media-actions";
import { enqueueThumbJob } from "@/actions/thumb-actions";
import { GridView } from "@/components/ui/grid-view";
import { ListView } from "@/components/ui/list-view";
import { MediaViewer } from "@/components/ui/media-viewer";
import { TagEditorBar } from "@/components/ui/tag-editor-bar";
import { isMedia } from "@/lib/media/media-types";
import { MediaNode } from "@/lib/media/types";
import { getClientExplorerPath } from "@/lib/path/helpers";
import { useExplorer } from "@/providers/explorer-provider";
import { FavoriteProvider } from "@/providers/favorite-provider";
import { useSearch } from "@/providers/search-provider";
import { SelectionProvider } from "@/providers/selection-provider";
import { useViewMode } from "@/providers/view-mode-provider";
import { Button } from "@/shadcn/components/ui/button";
import { cn } from "@/shadcn/lib/utils";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";

export function Explorer() {
  const { listing, index, modal, openMedia, closeMedia, moveFolder } =
    useExplorer();
  const router = useRouter();
  const { view } = useViewMode();

  // 検索フィルター機能
  const { query } = useSearch();
  const lowerQuery = useMemo(() => query.toLowerCase(), [query]);
  const filtered = useMemo(() => {
    return listing.nodes
      .filter((e) => e.isDirectory || isMedia(e.type))
      .filter((e) => e.name.toLowerCase().includes(lowerQuery));
  }, [listing.nodes, lowerQuery]);

  const mediaOnly = useMemo(
    () => filtered.filter((e) => isMedia(e.type)),
    [filtered]
  );

  const handleOpen = useCallback(
    (node: MediaNode, index: number) => {
      // フォルダ
      if (node.isDirectory) {
        const href = getClientExplorerPath(node.path);
        router.push(href);
        return;
      }

      // ファイル
      if (isMedia(node.type)) {
        openMedia(index);
        return;
      }

      toast.warning("このファイル形式は対応していません");
    },
    [openMedia, router]
  );

  // お気に入り設定
  const initialFavorites = useMemo(
    () => Object.fromEntries(mediaOnly.map((n) => [n.path, n.isFavorite])),
    [mediaOnly]
  );

  // サムネイル作成リクエスト送信
  useEffect(() => {
    void enqueueThumbJob(listing.path);
  }, [listing.path]);

  // FS <=> DB 同期リクエスト送信
  useEffect(() => {
    void syncMediaDirAction(listing.path);
  }, [listing.path]);

  // 訪問済みフォルダ更新リクエスト送信
  useEffect(() => {
    void visitFolderAction(listing.path);
  }, [listing.path]);

  return (
    <div
      className={cn(
        "flex-1 overflow-auto",
        view === "grid" && "p-4",
        view === "list" && "px-4"
      )}
    >
      <FavoriteProvider initialFavorites={initialFavorites}>
        <SelectionProvider>
          {/* グリッドビュー */}
          <div className={cn(view === "grid" ? "block" : "hidden")}>
            <GridView
              nodes={filtered}
              onOpen={(node, index) => void handleOpen(node, index)}
            />
          </div>

          {/* リストビュー */}
          <div className={cn(view === "list" ? "block" : "hidden")}>
            <ListView
              nodes={filtered}
              onOpen={(node, index) => void handleOpen(node, index)}
            />
          </div>

          {/* ビューワ */}
          {modal && index != null && (
            <MediaViewer
              items={mediaOnly}
              initialIndex={index}
              onClose={closeMedia}
              features={{
                openFolder: false,
              }}
              onPrevFolder={
                listing.prev
                  ? () => moveFolder(listing.prev!, "last")
                  : undefined
              }
              onNextFolder={
                listing.next
                  ? () => moveFolder(listing.next!, "first")
                  : undefined
              }
            />
          )}

          {/* タグ編集バー */}
          <TagEditorBar allNodes={filtered} />
        </SelectionProvider>
      </FavoriteProvider>

      {/* フォルダナビゲーション */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-8 border-t border-border/30">
        {/* 前のフォルダ */}
        <div className="w-full sm:flex-1">
          {listing.prev && (
            <Button
              variant="outline"
              className="group flex flex-col items-start gap-1 h-auto py-4 px-6 w-full sm:max-w-[280px] hover:bg-accent transition-all"
              asChild
            >
              <Link href={encodeURI(getClientExplorerPath(listing.prev))}>
                <div className="flex items-center text-xs text-muted-foreground group-hover:text-primary">
                  <ArrowLeft className="mr-1 h-3 w-3" />
                  Previous
                </div>
                <div className="text-base font-medium truncate w-full text-left">
                  {listing.prev.split("/").filter(Boolean).pop()}
                </div>
              </Link>
            </Button>
          )}
        </div>

        {/* 次のフォルダ */}
        <div className="w-full sm:flex-1 flex justify-end">
          {listing.next && (
            <Button
              variant="outline"
              className="group flex flex-col items-end gap-1 h-auto py-4 px-6 w-full sm:max-w-[280px] hover:bg-accent transition-all"
              asChild
            >
              <Link href={encodeURI(getClientExplorerPath(listing.next))}>
                <div className="flex items-center text-xs text-muted-foreground group-hover:text-primary">
                  Next
                  <ArrowRight className="ml-1 h-3 w-3" />
                </div>
                <div className="text-base font-medium truncate w-full text-right">
                  {listing.next.split("/").filter(Boolean).pop()}
                </div>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
