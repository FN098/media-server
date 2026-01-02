"use client";

import { visitFolderAction } from "@/actions/folder-actions";
import { enqueueThumbJob } from "@/actions/thumb-actions";
import { ExplorerGridView } from "@/components/ui/explorer-grid-view";
import { ListView } from "@/components/ui/explorer-list-view";
import { MediaViewer } from "@/components/ui/media-viewer";
import {
  useExplorerQuery,
  useNormalizeExplorerQuery,
  useSetExplorerQuery,
} from "@/hooks/use-explorer-query";
import { useShortcutKeys } from "@/hooks/use-shortcut-keys";
import { isMedia } from "@/lib/media/media-types";
import { MediaNode } from "@/lib/media/types";
import { getClientExplorerPath } from "@/lib/path/helpers";
import { useExplorerContext } from "@/providers/explorer-provider";
import { ScrollLockProvider } from "@/providers/scroll-lock-provider";
import { useViewModeContext } from "@/providers/view-mode-provider";
import { Button } from "@/shadcn/components/ui/button";
import { cn } from "@/shadcn/lib/utils";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";

export function Explorer() {
  const {
    listing,
    searchFiltered,
    mediaOnly,
    modal,
    index,
    openViewer,
    closeViewer,
    openFolder,
    openNextFolder,
    openPrevFolder,
    selectAllMedia,
    clearSelection,
  } = useExplorerContext();

  const setQuery = useSetExplorerQuery();

  // 表示モード
  const { viewMode, setViewMode } = useViewModeContext(); // ヘッダーUI
  const { view } = useExplorerQuery(); // URL

  // 初期同期：URL → Context（1回だけ）
  useEffect(() => {
    if (view !== viewMode) {
      setViewMode(view);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // UI操作：Context → URL
  useEffect(() => {
    if (view !== viewMode) {
      setQuery({ view: viewMode });
    }
  }, [setQuery, view, viewMode]);

  // ファイルまたはフォルダを開く
  const handleOpen = useCallback(
    (node: MediaNode) => {
      // フォルダ
      if (node.isDirectory) {
        openFolder(node.path);
        return;
      }

      // ファイル
      if (isMedia(node.type)) {
        openViewer(node.path);
        return;
      }

      toast.warning("このファイル形式は対応していません");
    },
    [openFolder, openViewer]
  );

  // URL パラメータ正規化
  useNormalizeExplorerQuery();

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
    { key: "q", callback: () => openPrevFolder("first") },
    { key: "e", callback: () => openNextFolder("first") },
    { key: "Ctrl+a", callback: () => selectAllMedia() },
    { key: "Escape", callback: () => clearSelection() },
  ]);

  return (
    <div
      className={cn(
        "flex-1 overflow-auto",
        view === "grid" && "p-4",
        view === "list" && "px-4"
      )}
    >
      {/* グリッドビュー */}
      {view === "grid" && (
        <div>
          <ExplorerGridView nodes={searchFiltered} onOpen={handleOpen} />
        </div>
      )}

      {/* リストビュー */}
      {view === "list" && (
        <div>
          <ListView nodes={searchFiltered} onOpen={handleOpen} />
        </div>
      )}

      {/* ビューワ */}
      {modal && index != null && (
        <ScrollLockProvider>
          <MediaViewer
            items={mediaOnly}
            initialIndex={index}
            features={{
              openFolder: false,
            }}
            onClose={closeViewer}
            onPrevFolder={() => openPrevFolder("last")}
            onNextFolder={() => openNextFolder("first")}
          />
        </ScrollLockProvider>
      )}

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
