"use client";

import { visitFolderAction } from "@/actions/folder-actions";
import { enqueueThumbJob } from "@/actions/thumb-actions";
import { ExplorerGridView } from "@/components/ui/explorer-grid-view";
import { ExplorerListView } from "@/components/ui/explorer-list-view";
import { MediaViewer } from "@/components/ui/media-viewer";
import {
  useExplorerQuery,
  useNormalizeExplorerQuery,
  useSetExplorerQuery,
} from "@/hooks/use-explorer-query";
import { useShortcutKeys } from "@/hooks/use-shortcut-keys";
import { MediaNode } from "@/lib/media/types";
import { ExplorerQuery } from "@/lib/query/types";
import { normalizeIndex } from "@/lib/query/utils";
import { useExplorerContext } from "@/providers/explorer-provider";
import { ScrollLockProvider } from "@/providers/scroll-lock-provider";
import { useSearchContext } from "@/providers/search-provider";
import { useViewModeContext } from "@/providers/view-mode-provider";
import { cn } from "@/shadcn/lib/utils";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";

export function Favorites() {
  const {
    listing,
    searchFiltered,
    mediaOnly,
    openNode,
    closeViewer,
    openNextFolder,
    openPrevFolder,
    selectAllMedia,
    clearSelection,
  } = useExplorerContext();

  // クエリパラメータ
  const setExplorerQuery = useSetExplorerQuery();
  const { view, q, at, modal } = useExplorerQuery(); // URL
  const { focus: focusSearch, query, setQuery } = useSearchContext(); // ヘッダーUI
  const { viewMode, setViewMode } = useViewModeContext(); // ヘッダーUI
  const viewerIndex = at != null ? normalizeIndex(at, mediaOnly.length) : null;

  // 初期同期：URL → Context（1回だけ）
  useEffect(() => {
    if (view !== viewMode) setViewMode(view);
    if (q !== query) setQuery(q ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // UI操作：Context → URL
  useEffect(() => {
    const patch: Partial<ExplorerQuery> = {};

    // undefined と空文字列の比較にならないように normalize しておく
    const nq = q ?? "";
    const nQuery = query ?? "";

    if (view !== viewMode) patch.view = viewMode;
    if (nq !== nQuery) patch.q = nQuery || undefined;

    if (Object.keys(patch).length === 0) return;

    setExplorerQuery(patch);
  }, [q, query, setExplorerQuery, view, viewMode]);

  // クエリパラメータ正規化
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
    { key: "Ctrl+a", callback: () => selectAllMedia() },
    { key: "Ctrl+k", callback: () => focusSearch() },
    { key: "Escape", callback: () => clearSelection() },
  ]);

  // ファイル/フォルダオープン
  const handleOpen = useCallback(
    (node: MediaNode) => {
      const result = openNode(node);

      if (result === "unsupported") {
        toast.warning("このファイル形式は対応していません");
      }
    },
    [openNode]
  );

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
          <ExplorerListView nodes={searchFiltered} onOpen={handleOpen} />
        </div>
      )}

      {/* タグエディター */}
      {/* <TagEditSheet allNodes={mediaOnly} /> */}

      {/* ビューワ */}
      {modal && viewerIndex != null && (
        <ScrollLockProvider>
          <MediaViewer
            items={mediaOnly}
            initialIndex={viewerIndex}
            features={{ openFolder: true }}
            onClose={closeViewer}
            onPrevFolder={() => openPrevFolder("last")}
            onNextFolder={() => openNextFolder("first")}
          />
        </ScrollLockProvider>
      )}
    </div>
  );
}
