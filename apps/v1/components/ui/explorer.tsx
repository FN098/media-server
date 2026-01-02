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
import { ExplorerQuery } from "@/lib/query/types";
import { normalizeIndex } from "@/lib/query/utils";
import { useExplorerContext } from "@/providers/explorer-provider";
import { ScrollLockProvider } from "@/providers/scroll-lock-provider";
import { useSearchContext } from "@/providers/search-provider";
import { useViewModeContext } from "@/providers/view-mode-provider";
import { Button } from "@/shadcn/components/ui/button";
import { cn } from "@/shadcn/lib/utils";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { startTransition, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

export function Explorer() {
  const {
    listing,
    searchFiltered,
    mediaOnly,
    openViewer,
    closeViewer,
    openFolder,
    openNextFolder,
    openPrevFolder,
    selectAllMedia,
    clearSelection,
  } = useExplorerContext();

  // クエリパラメータ
  const setExplorerQuery = useSetExplorerQuery();
  const { view, q, at, modal } = useExplorerQuery(); // URL
  const { query, setQuery } = useSearchContext(); // ヘッダーUI
  const { viewMode, setViewMode } = useViewModeContext(); // ヘッダーUI
  const initialized = useRef(false);

  const index = at != null ? normalizeIndex(at, mediaOnly.length) : null;

  // 初期同期：URL → Context（1回だけ）
  useEffect(() => {
    if (view !== viewMode) {
      setViewMode(view);
    }
    if (q !== query) {
      setQuery(q ?? "");
    }
    initialized.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // UI操作：Context → URL
  useEffect(() => {
    const patch: Partial<ExplorerQuery> = {};

    // undefined と空文字列の比較にならないように normalize しておく
    const nq = q ?? "";
    const nQuery = query ?? "";

    if (view !== viewMode) {
      patch.view = viewMode;
    }
    if (nq !== nQuery) {
      patch.q = nQuery || undefined;
    }

    if (Object.keys(patch).length === 0) return;

    startTransition(() => {
      setExplorerQuery(patch);
    });
  }, [q, query, setExplorerQuery, view, viewMode]);

  // クエリパラメータ正規化
  useNormalizeExplorerQuery();

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

  console.log({ modal, index });

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
      {modal && index != null && (
        <ScrollLockProvider>
          <MediaViewer
            items={mediaOnly}
            initialIndex={index}
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
