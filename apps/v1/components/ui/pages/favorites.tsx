"use client";

import { visitFolderAction } from "@/actions/folder-actions";
import { enqueueThumbJob } from "@/actions/thumb-actions";
import { SelectionBar } from "@/components/ui/bars/selection-bar";
import { TagFilterBar } from "@/components/ui/bars/tag-filter-bar";
import { TagEditSheet } from "@/components/ui/sheets/tag-edit-sheet";
import { MediaViewer } from "@/components/ui/viewers/media-viewer";
import { GridView } from "@/components/ui/views/grid-view";
import { ListView } from "@/components/ui/views/list-view";
import {
  useExplorerQuery,
  useNormalizeExplorerQuery,
  useSetExplorerQuery,
} from "@/hooks/use-explorer-query";
import { useShortcutKeys } from "@/hooks/use-shortcut-keys";
import { useTagFilter } from "@/hooks/use-tag-filter";
import { FavoritesRecord } from "@/lib/favorite/types";
import { createSearchFilter, createTagFilter } from "@/lib/media/filters";
import { isMedia } from "@/lib/media/media-types";
import { sortNames } from "@/lib/media/sort";
import {
  MediaNode,
  MediaNodeFilter,
  MediaPathToIndexMap,
} from "@/lib/media/types";
import { ExplorerQuery } from "@/lib/query/types";
import { normalizeIndex } from "@/lib/query/utils";
import { unique } from "@/lib/utils/unique";
import { useExplorerContext } from "@/providers/explorer-provider";
import { FavoritesProvider } from "@/providers/favorites-provider";
import { usePathSelectionContext } from "@/providers/path-selection-provider";
import { ScrollLockProvider } from "@/providers/scroll-lock-provider";
import { useSearchContext } from "@/providers/search-provider";
import { useViewModeContext } from "@/providers/view-mode-provider";
import { Button } from "@/shadcn/components/ui/button";
import { cn } from "@/shadcn/lib/utils";
import { TagIcon } from "lucide-react";
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

  // フィルタリング対象タグ
  const { selectedTags, selectTags } = useTagFilter();

  const filteredNodes = useMemo(() => {
    const { nodes: allNodes } = listing;

    // 1. 各フィルタの生成
    const filters: MediaNodeFilter[] = [
      createSearchFilter(query),
      createTagFilter(Array.from(selectedTags)),
    ];

    // 2. フィルタの適用
    return allNodes.filter((node) => {
      // フォルダは常に表示する場合 (検索にはヒットさせたい場合は条件を調整)
      if (node.isDirectory) {
        // 例: フォルダは検索クエリには反応させるが、タグやお気に入りフィルタからは除外する
        return createSearchFilter(query)(node);
      }

      // メディアファイルは全てのフィルタを適用
      return filters.every((fn) => fn(node));
    });
  }, [listing, query, selectedTags]);

  // ビューアや選択機能で使う「メディアのみ」のリストは filteredNodes から抽出
  const mediaOnly = useMemo(
    () => filteredNodes.filter((n) => isMedia(n.type)),
    [filteredNodes]
  );

  // 処理高速化のため、path => node の Map を作成しておく
  const mediaOnlyMap = useMemo(() => {
    return new Map(mediaOnly.map((node) => [node.path, node]));
  }, [mediaOnly]);

  // すべてのタグ
  const allTags = sortNames(
    unique(
      mediaOnly
        .filter((n) => n.tags && n.tags.length > 0)
        .flatMap((n) => n.tags!.map((t) => t.name))
    )
  );

  // ===== ビューア =====

  // ビューアのインデックスを計算するためのマップ
  const viewerIndexMap: MediaPathToIndexMap = useMemo(
    () => new Map(mediaOnly.map((n, index) => [n.path, index])),
    [mediaOnly]
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

  const isViewMode = modal && viewerIndex != null && mediaOnly[viewerIndex];

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
    selectedCount,
    selectedPaths,
    selectPaths,
    clearSelection,
  } = usePathSelectionContext();

  // 選択済みノードリスト
  const selected = useMemo(() => {
    const result = [];
    for (const path of selectedPaths) {
      const node = mediaOnlyMap.get(path);
      if (node) result.push(node);
    }
    return result;
  }, [mediaOnlyMap, selectedPaths]);

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

  // 選択時にタグエディタを起動
  const handleSelect = useCallback(() => {
    setIsTagEditorOpen(true);
  }, []);

  // ===== タグエディタ =====

  const [isTagEditorOpen, setIsTagEditorOpen] = useState(false); // TODO: URLパラメータ tag=true

  const isTagEditorOpenEffective = isTagEditorOpen && selectedCount > 0;

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
    if (isViewMode) return "single";
    return "default";
  }, [isViewMode]);

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
          onApply={selectTags}
        />

        {/* グリッドビュー */}
        {viewMode === "grid" && (
          <div>
            <GridView
              allNodes={filteredNodes}
              onOpen={handleOpen}
              onSelect={handleSelect}
            />
          </div>
        )}

        {/* リストビュー */}
        {viewMode === "list" && (
          <div>
            <ListView
              allNodes={filteredNodes}
              onOpen={handleOpen}
              onSelect={handleSelect}
            />
          </div>
        )}

        {/* タグエディター */}
        {isTagEditorOpenEffective && (
          <TagEditSheet
            targetNodes={selected}
            active={isTagEditorOpen}
            onClose={handleCloseTagEditor}
            mode={tagEditMode}
            transparent={tagEditMode === "single"}
          />
        )}

        {/* 選択バー */}
        {isSelectionMode && (
          <SelectionBar
            count={selected.length}
            totalCount={mediaOnly.length}
            active={isSelectionMode}
            onSelectAll={handleSelectAll}
            onClose={handleCloseSelectionBar}
            actions={
              <>
                <Button size="sm" onClick={handleOpenTagEditor}>
                  <TagIcon />
                  タグ表示
                </Button>
              </>
            }
          />
        )}

        {/* ビューワ */}
        {isViewMode && (
          <ScrollLockProvider>
            <MediaViewer
              allNodes={mediaOnly}
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
