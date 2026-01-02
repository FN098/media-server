"use client";

import { visitFolderAction } from "@/actions/folder-actions";
import { enqueueThumbJob } from "@/actions/thumb-actions";
import { ExplorerGridView } from "@/components/ui/explorer-grid-view";
import { ListView } from "@/components/ui/explorer-list-view";
import { MediaViewer } from "@/components/ui/media-viewer";
import { useInitialize } from "@/hooks/use-initialize";
import { useMediaViewer } from "@/hooks/use-media-selection";
import { useShortcutKeys } from "@/hooks/use-shortcut-keys";
import { isMedia } from "@/lib/media/media-types";
import { MediaNode } from "@/lib/media/types";
import { useExplorerListingContext } from "@/providers/explorer-listing-provider";
import { useExplorerNavigationContext } from "@/providers/explorer-navigation-provider";
import { ScrollLockProvider } from "@/providers/scroll-lock-provider";
import { useSearchContext } from "@/providers/search-provider";
import { useSelectionContext } from "@/providers/selection-provider";
import { useViewModeContext } from "@/providers/view-mode-provider";
import { Button } from "@/shadcn/components/ui/button";
import { cn } from "@/shadcn/lib/utils";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";

export function Explorer() {
  const { listing } = useExplorerListingContext();
  const listingCtx = useExplorerListingContext();
  const navigationCtx = useExplorerNavigationContext();
  const viewModeCtx = useViewModeContext();
  const searchCtx = useSearchContext();
  const selectCtx = useSelectionContext();
  const { currentMediaIndex, setCurrentMediaIndex } = useMediaViewer();

  // ファイルまたはフォルダを開く
  const handleOpen = useCallback(
    (node: MediaNode) => {
      // フォルダ
      if (node.isDirectory) {
        navigationCtx.navigate(node.path);
        return;
      }

      // ファイル
      if (isMedia(node.type)) {
        const index = listingCtx.getMediaIndex(node.path);
        if (index === null) return;
        setCurrentMediaIndex(index);
        navigationCtx.refresh({
          index,
          modal: true,
        });
        return;
      }

      toast.warning("このファイル形式は対応していません");
    },
    [listingCtx, navigationCtx, setCurrentMediaIndex]
  );

  // ビューアを閉じる
  const handleCloseViewer = useCallback(() => {
    navigationCtx.refresh({
      modal: false,
    });
  }, [navigationCtx]);

  // 次のフォルダに移動
  const navigateToNextFolder = useCallback(() => {
    if (!listingCtx.listing.next) return;
    const modal = navigationCtx.modal;
    navigationCtx.navigate(listingCtx.listing.next, {
      index: modal ? "first" : undefined,
      modal,
    });
  }, [listingCtx.listing.next, navigationCtx]);

  // 前のフォルダに移動
  const navigateToPrevFolder = useCallback(() => {
    if (!listingCtx.listing.prev) return;
    const modal = navigationCtx.modal;
    navigationCtx.navigate(listingCtx.listing.prev, {
      index: modal ? "last" : undefined,
      modal,
    });
  }, [listingCtx.listing.prev, navigationCtx]);

  // すべて選択
  const handleSelectAll = useCallback(() => {
    const paths = listingCtx.mediaOnly.map((n) => n.path);
    selectCtx.selectKeys(paths);
  }, [listingCtx, selectCtx]);

  // 選択解除
  const handleClearSelection = useCallback(() => {
    selectCtx.clearSelection();
  }, [selectCtx]);

  // 1つ以上選択された状態なら選択モードに移行
  useEffect(() => {
    if (selectCtx.selectedCount === 0) {
      selectCtx.setIsSelectionMode(false);
    } else {
      selectCtx.setIsSelectionMode(true);
    }
  }, [selectCtx]);

  // 初回のみ実行
  useInitialize(() => {
    // const index = navigationCtx.index;
    // const node = listingCtx.getMediaNode(index);
    // const mediaIndex = listingCtx.getMediaIndex(node.path);
    // setCurrentMediaIndex(mediaIndex);
  });

  // クエリ入力時に遅延反映
  // const debouncedSetQuery = useDebouncedCallback(setQuery, 300);
  // useEffect(() => {
  // debouncedSetQuery(searchCtx.query);
  // }, [debouncedSetQuery, searchCtx.query]);

  // サムネイル作成リクエスト送信
  useEffect(() => {
    void enqueueThumbJob(listing.path);
  }, [listing.path]);

  // 訪問済みフォルダ更新リクエスト送信
  useEffect(() => {
    void visitFolderAction(listing.path);
  }, [listing.path]);

  // ショートカット
  useShortcutKeys([
    { key: "q", callback: navigateToNextFolder },
    { key: "e", callback: navigateToPrevFolder },
    { key: "Ctrl+a", callback: handleSelectAll },
    { key: "Escape", callback: handleClearSelection },
    { key: "Ctrl+k", callback: searchCtx.focus },
  ]);

  // エイリアス
  const { viewMode } = viewModeCtx;
  const {
    searchFiltered,
    mediaOnly,
    listing: { prev: prevFolderPath, next: nextFolderPath },
  } = listingCtx;
  const { modal, getFolderUrl } = navigationCtx;

  return (
    <div
      className={cn(
        "flex-1 overflow-auto",
        viewMode === "grid" && "p-4",
        viewMode === "list" && "px-4"
      )}
    >
      {/* グリッドビュー */}
      {viewMode === "grid" && (
        <div>
          <ExplorerGridView nodes={searchFiltered} onOpen={handleOpen} />
        </div>
      )}

      {/* リストビュー */}
      {viewMode === "list" && (
        <div>
          <ListView nodes={searchFiltered} onOpen={handleOpen} />
        </div>
      )}

      {/* ビューワ */}
      <ScrollLockProvider>
        {modal && currentMediaIndex != null && (
          <MediaViewer
            items={mediaOnly}
            initialIndex={currentMediaIndex}
            features={{
              openFolder: false,
            }}
            onClose={handleCloseViewer}
            onPrevFolder={navigateToPrevFolder}
            onNextFolder={navigateToNextFolder}
          />
        )}
      </ScrollLockProvider>

      {/* フォルダナビゲーション */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-8 border-t border-border/30">
        {/* 前のフォルダ */}
        <div className="w-full sm:flex-1">
          {prevFolderPath && (
            <Button
              variant="outline"
              className="group flex flex-col items-start gap-1 h-auto py-4 px-6 w-full sm:max-w-[280px] hover:bg-accent transition-all"
              asChild
            >
              <Link href={getFolderUrl(prevFolderPath)}>
                <div className="flex items-center text-xs text-muted-foreground group-hover:text-primary">
                  <ArrowLeft className="mr-1 h-3 w-3" />
                  Previous
                </div>
                <div className="text-base font-medium truncate w-full text-left">
                  {prevFolderPath.split("/").filter(Boolean).pop()}
                </div>
              </Link>
            </Button>
          )}
        </div>

        {/* 次のフォルダ */}
        <div className="w-full sm:flex-1 flex justify-end">
          {nextFolderPath && (
            <Button
              variant="outline"
              className="group flex flex-col items-end gap-1 h-auto py-4 px-6 w-full sm:max-w-[280px] hover:bg-accent transition-all"
              asChild
            >
              <Link href={getFolderUrl(nextFolderPath)}>
                <div className="flex items-center text-xs text-muted-foreground group-hover:text-primary">
                  Next
                  <ArrowRight className="ml-1 h-3 w-3" />
                </div>
                <div className="text-base font-medium truncate w-full text-right">
                  {nextFolderPath.split("/").filter(Boolean).pop()}
                </div>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
