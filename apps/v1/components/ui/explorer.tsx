"use client";

import { visitFolderAction } from "@/actions/folder-actions";
import { enqueueThumbJob } from "@/actions/thumb-actions";
import { ExplorerGridView } from "@/components/ui/explorer-grid-view";
import { ExplorerListView } from "@/components/ui/explorer-list-view";
import { MediaViewer } from "@/components/ui/media-viewer";
import { SelectionBar } from "@/components/ui/selection-bar";
import { TagEditSheet } from "@/components/ui/tag-edit-sheet";
import {
  useExplorerQuery,
  useNormalizeExplorerQuery,
  useSetExplorerQuery,
} from "@/hooks/use-explorer-query";
import { useShortcutKeys } from "@/hooks/use-shortcut-keys";
import { FavoritesRecord } from "@/lib/favorite/types";
import { isMedia } from "@/lib/media/media-types";
import { MediaNode, MediaPathToIndexMap } from "@/lib/media/types";
import { getClientExplorerPath } from "@/lib/path/helpers";
import { ExplorerQuery } from "@/lib/query/types";
import { normalizeIndex } from "@/lib/query/utils";
import { isMatchJapanese } from "@/lib/utils/search";
import { useExplorerContext } from "@/providers/explorer-provider";
import { FavoritesProvider } from "@/providers/favorites-provider";
import { usePathSelectionContext } from "@/providers/path-selection-provider";
import { ScrollLockProvider } from "@/providers/scroll-lock-provider";
import { useSearchContext } from "@/providers/search-provider";
import { useViewModeContext } from "@/providers/view-mode-provider";
import { Button } from "@/shadcn/components/ui/button";
import { cn } from "@/shadcn/lib/utils";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export function Explorer() {
  const {
    listing,
    openViewer,
    closeViewer,
    openFolder,
    openNextFolder,
    openPrevFolder,
  } = useExplorerContext();

  // URLパラメータによるステート管理
  const setExplorerQuery = useSetExplorerQuery();
  const { view, q, at, modal } = useExplorerQuery(); // URL
  const { focus: focusSearch, query, setQuery } = useSearchContext(); // ヘッダーUI
  const { viewMode, setViewMode } = useViewModeContext(); // ヘッダーUI

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

  // 全ノードリスト
  const { nodes: allNodes } = listing;

  // フィルターノードリスト
  const searchFiltered: MediaNode[] = useMemo(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return allNodes;
    return allNodes.filter((n) => isMatchJapanese(n.name, trimmedQuery));
  }, [allNodes, query]);

  // メディアノードリスト
  const mediaOnly: MediaNode[] = useMemo(
    () => searchFiltered.filter((n) => isMedia(n.type)),
    [searchFiltered]
  );

  // メディアノードリストのインデックスを計算するためのマップ
  const mediaOnlyMap: MediaPathToIndexMap = useMemo(
    () => new Map(mediaOnly.map((n, index) => [n.path, index])),
    [mediaOnly]
  );

  // お気に入り
  const favorites: FavoritesRecord = useMemo(
    () => Object.fromEntries(mediaOnly.map((n) => [n.path, n.isFavorite])),
    [mediaOnly]
  );

  // 選択機能
  const {
    isSelectionMode,
    setIsSelectionMode,
    selectedKeys: selectedPaths,
    selectKeys: selectPaths,
    clearSelection,
  } = usePathSelectionContext();

  // 選択済みノードリスト
  const selected = useMemo(
    () => searchFiltered.filter((n) => selectedPaths.has(n.path)),
    [searchFiltered, selectedPaths]
  );

  // 1つ以上選択されたら選択モードに移行、0ならモード解除
  useEffect(() => {
    setIsSelectionMode(selected.length > 0);
  }, [selected, setIsSelectionMode]);

  // 全選択
  const handleSelectAll = () => {
    selectPaths(mediaOnly.map((n) => n.path));
  };

  // 選択解除
  const handleClearSelection = () => {
    clearSelection();
  };

  // タグエディタ表示・非表示
  const [isTagEditorOpen, setIsTagEditorOpen] = useState(false);
  const handleOpenTagEditor = () => setIsTagEditorOpen(true);
  const handleCloseTagEditor = () => setIsTagEditorOpen(false);
  const toggleIsTagEditorOpen = () => setIsTagEditorOpen((prev) => !prev);

  // ビューア表示用インデックス
  const viewerIndex = useMemo(
    () => (at != null ? normalizeIndex(at, mediaOnly.length) : null),
    [at, mediaOnly.length]
  );

  // メディアノードリストのインデックスを取得
  const getMediaIndex = useCallback(
    (path: string) => {
      if (mediaOnlyMap.has(path)) return mediaOnlyMap.get(path)!;
      return null;
    },
    [mediaOnlyMap]
  );

  // ファイル/フォルダオープン
  const handleOpen = (node: MediaNode) => {
    if (node.isDirectory) {
      openFolder(node.path);
      return;
    }

    if (isMedia(node.type)) {
      const index = getMediaIndex(node.path);
      if (index == null) return;
      openViewer(index);
      return;
    }

    toast.warning("このファイル形式は対応していません");
  };

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
    { key: "t", callback: () => toggleIsTagEditorOpen() },
    { key: "Ctrl+a", callback: () => handleSelectAll() },
    { key: "Ctrl+k", callback: () => focusSearch() },
    { key: "Escape", callback: () => handleClearSelection() },
  ]);

  return (
    <div
      className={cn(
        "flex-1 overflow-auto",
        viewMode === "grid" && "p-4",
        viewMode === "list" && "px-4"
      )}
    >
      <FavoritesProvider favorites={favorites}>
        {/* グリッドビュー */}
        {viewMode === "grid" && (
          <div>
            <ExplorerGridView allNodes={searchFiltered} onOpen={handleOpen} />
          </div>
        )}

        {/* リストビュー */}
        {viewMode === "list" && (
          <div>
            <ExplorerListView allNodes={searchFiltered} onOpen={handleOpen} />
          </div>
        )}

        {/* タグエディター */}
        <TagEditSheet
          targetNodes={selected}
          active={isTagEditorOpen}
          onClose={handleCloseTagEditor}
        />

        {/* 選択バー */}
        <SelectionBar
          count={selected.length}
          totalCount={mediaOnly.length}
          active={isSelectionMode}
          onSelectAll={handleSelectAll}
          onCancel={handleClearSelection}
          actions={
            <>
              <Button onClick={handleOpenTagEditor}>タグ編集</Button>
            </>
          }
        />

        {/* ビューワ */}
        {modal && viewerIndex != null && (
          <ScrollLockProvider>
            <MediaViewer
              allNodes={mediaOnly}
              initialIndex={viewerIndex}
              onClose={closeViewer}
              onOpenFolder={openFolder}
              onPrevFolder={() => openPrevFolder("last")}
              onNextFolder={() => openNextFolder("first")}
            />
          </ScrollLockProvider>
        )}
      </FavoritesProvider>

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
