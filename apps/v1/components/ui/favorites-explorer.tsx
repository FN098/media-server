"use client";

import { visitFolderAction } from "@/actions/folder-actions";
import { enqueueThumbJob } from "@/actions/thumb-actions";
import { ExplorerGridView } from "@/components/ui/explorer-grid-view";
import { ExplorerListView } from "@/components/ui/explorer-list-view";
import { MediaViewer } from "@/components/ui/media-viewer";
import { SelectionBar } from "@/components/ui/selection-bar";
import { TagEditSheet } from "@/components/ui/tag-edit-sheet";
import { TagFilterBar } from "@/components/ui/tag-filter-bar-v2";
import {
  useExplorerQuery,
  useNormalizeExplorerQuery,
  useSetExplorerQuery,
} from "@/hooks/use-explorer-query";
import { useShortcutKeys } from "@/hooks/use-shortcut-keys";
import { useTagFilter } from "@/hooks/use-tag-filter";
import { FavoritesRecord } from "@/lib/favorite/types";
import { isMedia } from "@/lib/media/media-types";
import { MediaNode, MediaPathToIndexMap } from "@/lib/media/types";
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
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export function FavoritesExplorer() {
  const { listing, openViewer, closeViewer, openFolder } = useExplorerContext();

  // ===== URL ステート =====

  // URLファーストのステート管理
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

  // ===== フィルタリング =====

  const { nodes: allNodes } = listing;

  // 検索フィルタリング
  const searchFiltered: MediaNode[] = useMemo(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return allNodes;
    return allNodes.filter((n) => isMatchJapanese(n.name, trimmedQuery));
  }, [allNodes, query]);

  // メディアフィルタリング
  const mediaOnly: MediaNode[] = useMemo(
    () => searchFiltered.filter((n) => isMedia(n.type)),
    [searchFiltered]
  );

  // タグフィルタリング
  const {
    allTags,
    selectedTags,
    filteredNodes: tagFiltered,
    toggleTag,
    resetTags,
  } = useTagFilter(mediaOnly);

  // 最終フィルタリング
  const finalFiltered = tagFiltered;

  // ===== ビューア =====

  // ビューア用ノードリスト
  const viewerNodes = finalFiltered;

  // ビューア用インデックスを計算するためのマップ
  const viewerIndexMap: MediaPathToIndexMap = useMemo(
    () => new Map(viewerNodes.map((n, index) => [n.path, index])),
    [viewerNodes]
  );

  // ビューア用インデックスを取得
  const getMediaIndex = useCallback(
    (path: string) => {
      if (viewerIndexMap.has(path)) return viewerIndexMap.get(path)!;
      return null;
    },
    [viewerIndexMap]
  );

  // ビューア用インデックス
  const viewerIndex = useMemo(
    () => (at != null ? normalizeIndex(at, mediaOnly.length) : null),
    [at, mediaOnly.length]
  );

  // ビューアスライド移動時の処理
  const handleViewerIndexChange = (index: number) => {
    const media = mediaOnly[index];
    if (!media) return;

    // 選択状態の更新
    selectPaths([media.path]);
    exitSelectionMode();
  };

  // ===== ナビゲーション =====

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

  // ===== お気に入り =====

  const favorites: FavoritesRecord = useMemo(
    () => Object.fromEntries(mediaOnly.map((n) => [n.path, n.isFavorite])),
    [mediaOnly]
  );

  // ===== 選択機能 =====

  const {
    isSelectionMode,
    enterSelectionMode,
    exitSelectionMode,
    selectedPaths,
    selectPaths,
    clearSelection,
  } = usePathSelectionContext();

  const selectable = finalFiltered;

  // 選択済みノードリスト
  const selected = useMemo(
    () => selectable.filter((n) => selectedPaths.has(n.path)),
    [selectable, selectedPaths]
  );

  // 全選択
  const handleSelectAll = () => {
    selectPaths(mediaOnly.map((n) => n.path));
    enterSelectionMode();
  };

  // 選択解除
  const handleClearSelection = () => {
    clearSelection();
    exitSelectionMode();
  };

  // 選択バー閉じる
  const handleCloseSelectionBar = () => {
    clearSelection();
    exitSelectionMode();
  };

  // ===== タグエディタ =====

  const [isTagEditorOpen, setIsTagEditorOpen] = useState(false); // TODO: URLパラメータ tag=true

  const handleOpenTagEditor = () => {
    setIsTagEditorOpen(true);
  };

  const handleCloseTagEditor = () => {
    setIsTagEditorOpen(false);
  };

  const handleToggleTagEditor = () => {
    setIsTagEditorOpen((prev) => !prev);
  };

  // タグエディタの起動モード
  const tagEditMode = useMemo(() => {
    if (modal) return "single";
    return "default";
  }, [modal]);

  // ===== サーバーアクション =====

  // サムネイル作成リクエスト送信
  useEffect(() => {
    if (listing.path) {
      void enqueueThumbJob(listing.path);
    }
  }, [listing.path]);

  // 訪問済みフォルダ更新リクエスト送信
  useEffect(() => {
    if (listing.path) {
      void visitFolderAction(listing.path);
    }
  }, [listing.path]);

  // ===== その他 =====

  // ショートカット
  useShortcutKeys([
    { key: "t", callback: () => handleToggleTagEditor() },
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
        {/* タグフィルター */}
        <TagFilterBar
          tags={allTags}
          selectedTags={selectedTags}
          onToggle={toggleTag}
          onClear={resetTags}
        />

        {/* グリッドビュー */}
        {viewMode === "grid" && (
          <div>
            <ExplorerGridView allNodes={finalFiltered} onOpen={handleOpen} />
          </div>
        )}

        {/* リストビュー */}
        {viewMode === "list" && (
          <div>
            <ExplorerListView allNodes={finalFiltered} onOpen={handleOpen} />
          </div>
        )}

        {/* タグエディター */}
        {isTagEditorOpen && (
          <TagEditSheet
            targetNodes={selected}
            active={isTagEditorOpen}
            onClose={handleCloseTagEditor}
            mode={tagEditMode}
          />
        )}

        {/* 選択バー */}
        {isSelectionMode && (
          <SelectionBar
            count={selected.length}
            totalCount={finalFiltered.length}
            active={isSelectionMode}
            onSelectAll={handleSelectAll}
            onClose={handleCloseSelectionBar}
            actions={
              <>
                <Button onClick={handleOpenTagEditor}>タグ編集</Button>
              </>
            }
          />
        )}

        {/* ビューワ */}
        {modal && viewerIndex != null && (
          <ScrollLockProvider>
            <MediaViewer
              allNodes={viewerNodes}
              initialIndex={viewerIndex}
              onIndexChange={handleViewerIndexChange}
              onClose={closeViewer}
              onOpenFolder={openFolder}
              onTags={handleToggleTagEditor}
            />
          </ScrollLockProvider>
        )}
      </FavoritesProvider>
    </div>
  );
}
