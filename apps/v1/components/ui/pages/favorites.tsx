"use client";

import { visitFolderAction } from "@/actions/folder-actions";
import { enqueueThumbJob } from "@/actions/thumb-actions";
import { SelectionBar } from "@/components/ui/bars/selection-bar";
import { TagFilterDialog } from "@/components/ui/dialogs/tag-filter-dialog";
import { TagEditSheet } from "@/components/ui/sheets/tag-edit-sheet";
import { MediaViewer } from "@/components/ui/viewers/media-viewer";
import { PagingGridView } from "@/components/ui/views/paging-grid-view";
import { PagingListView } from "@/components/ui/views/paging-list-view";
import {
  useExplorerQuery,
  useNormalizeExplorerQuery,
  useSetExplorerQuery,
} from "@/hooks/use-explorer-query";
import { useShortcutKeys } from "@/hooks/use-shortcut-keys";
import { useTagFilter } from "@/hooks/use-tag-filter";
import { createSearchFilter, createTagFilter } from "@/lib/media/filters";
import { isMedia } from "@/lib/media/media-types";
import { sortNames } from "@/lib/media/sort";
import {
  MediaNode,
  MediaNodeFilter,
  MediaPathToIndexMap,
  MediaPathToNodeMap,
} from "@/lib/media/types";
import { ExplorerQuery } from "@/lib/query/types";
import { normalizeIndex } from "@/lib/query/utils";
import { unique } from "@/lib/utils/unique";
import { useExplorerContext } from "@/providers/explorer-provider";
import { usePathSelectionContext } from "@/providers/path-selection-provider";
import { ScrollLockProvider } from "@/providers/scroll-lock-provider";
import { useSearchContext } from "@/providers/search-provider";
import { useTagEditorContext } from "@/providers/tag-editor-provider";
import { useViewModeContext } from "@/providers/view-mode-provider";
import { Button } from "@/shadcn/components/ui/button";
import { cn } from "@/shadcn/lib/utils";
import { AnimatePresence } from "framer-motion";
import { TagIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef } from "react";
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
  }, [setExplorerQuery, q, query, view, viewMode]);

  // クエリパラメータ正規化
  useNormalizeExplorerQuery();

  // ===== フィルタリング =====

  // フィルタリング対象タグ
  const { selectedTags, selectTags } = useTagFilter();

  // フィルタ関数
  const searchFilter = useMemo(() => createSearchFilter(query), [query]);
  const tagFilter = useMemo(
    () => createTagFilter(Array.from(selectedTags)),
    [selectedTags]
  );

  const filteredNodes = useMemo(() => {
    const { nodes: allNodes } = listing;

    // 1. 各フィルタの生成
    const filters: MediaNodeFilter[] = [searchFilter, tagFilter];

    // 2. フィルタの適用
    return allNodes.filter((node) => {
      // フォルダは常に表示する場合 (検索にはヒットさせたい場合は条件を調整)
      if (node.isDirectory) {
        // 例: フォルダは検索クエリには反応させるが、タグやお気に入りフィルタからは除外する
        return searchFilter(node);
      }

      // メディアファイルは全てのフィルタを適用
      return filters.every((fn) => fn(node));
    });
  }, [listing, searchFilter, tagFilter]);

  // 「メディアのみ」のリスト
  const mediaOnly = useMemo(
    () => filteredNodes.filter((n) => isMedia(n.type)),
    [filteredNodes]
  );

  // すべてのタグ
  const allTags = sortNames(
    unique(
      mediaOnly
        .filter((n) => n.tags && n.tags.length > 0)
        .flatMap((n) => n.tags!.map((t) => t.name))
    )
  );

  // ===== ビューア =====

  // ビューア用インデックスを計算するためのマップ
  const viewerIndexMap: MediaPathToIndexMap = useMemo(
    () => new Map(mediaOnly.map((n, index) => [n.path, index])),
    [mediaOnly]
  );

  // ビューア用インデックスを取得
  const getViewerIndex = useCallback(
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

  // ビューア起動モード
  const isViewMode = modal && viewerIndex != null && !!mediaOnly[viewerIndex];

  // 直前のインデックスを記憶するためのRef
  const lastViewerIndexRef = useRef<number | null>(null);

  // ビューアスライド移動時の処理
  const handleViewerIndexChange = (index: number) => {
    const media = mediaOnly[index];
    if (!media) return;

    // 選択状態の更新
    selectPaths([media.path]);

    // インデックス位置を覚えておく
    if (index !== null) {
      lastViewerIndexRef.current = index;
    }
  };

  // ビューアが閉じられた瞬間にスクロールを実行（ブラウザバック、閉じるボタン両方対応）
  useEffect(() => {
    if (!isViewMode && lastViewerIndexRef.current !== null) {
      const index = lastViewerIndexRef.current;

      // 次のレンダリングサイクルで実行
      const animationId = requestAnimationFrame(() => {
        const element = document.getElementById(`media-item-${index}`);
        if (element) {
          element.scrollIntoView({
            behavior: "instant",
            block: "center",
          });
        }
        lastViewerIndexRef.current = null;
      });

      return () => cancelAnimationFrame(animationId);
    }
  }, [isViewMode]);

  // ===== ナビゲーション =====

  // ファイル/フォルダオープン
  const handleOpen = (node: MediaNode) => {
    if (node.isDirectory) {
      openFolder(node.path);
      return;
    }

    if (isMedia(node.type)) {
      const index = getViewerIndex(node.path);
      if (index == null) return;
      openViewer(index);
      return;
    }

    toast.warning("このファイル形式は対応していません");
  };

  // ===== 選択機能 =====

  const {
    isSelectionMode,
    enterSelectionMode,
    exitSelectionMode,
    selectedPaths,
    replaceSelection,
    selectPaths,
    clearSelection,
  } = usePathSelectionContext();

  // 処理高速化のため、path => node の Map を作成しておく
  const pathToNodeMap: MediaPathToNodeMap = useMemo(() => {
    return new Map(listing.nodes.map((node) => [node.path, node]));
  }, [listing.nodes]);

  // 選択済みノードリスト
  const selected = useMemo(() => {
    const result = [];
    for (const path of selectedPaths) {
      const node = pathToNodeMap.get(path);
      if (node) result.push(node);
    }
    return result;
  }, [pathToNodeMap, selectedPaths]);

  // 選択
  const handleSelectSingle = (node: MediaNode) => {
    replaceSelection(node.path);
  };

  // 全選択
  const handleSelectAll = () => {
    selectPaths(filteredNodes.map((n) => n.path));
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

  const { isTagEditMode, setIsTagEditMode } = useTagEditorContext();
  const handleOpenTagEditor = () => {
    setIsTagEditMode(true);
  };
  const handleCloseTagEditor = () => {
    setIsTagEditMode(false);
  };
  const handleToggleTagEditor = () => {
    setIsTagEditMode((prev) => !prev);
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
      {/* タグフィルター */}
      <TagFilterDialog
        tags={allTags}
        selectedTags={selectedTags}
        onApply={selectTags}
      />

      {/* グリッドビュー */}
      {viewMode === "grid" && !isViewMode && (
        <div>
          <PagingGridView
            allNodes={filteredNodes}
            onOpen={handleOpen}
            onOpenFolder={openFolder}
            onEditTags={(node) => {
              handleSelectSingle(node);
              handleOpenTagEditor();
            }}
          />
        </div>
      )}

      {/* リストビュー */}
      {viewMode === "list" && !isViewMode && (
        <div>
          <PagingListView
            allNodes={filteredNodes}
            onOpen={handleOpen}
            onOpenFolder={openFolder}
            onEditTags={(node) => {
              handleSelectSingle(node);
              handleOpenTagEditor();
            }}
          />
        </div>
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
            onEditTags={handleToggleTagEditor}
          />
        </ScrollLockProvider>
      )}

      {/* 選択バー */}
      <AnimatePresence>
        {isSelectionMode && !isTagEditMode && (
          <SelectionBar
            count={selected.length}
            totalCount={filteredNodes.length}
            onSelectAll={handleSelectAll}
            onClose={handleCloseSelectionBar}
            actions={
              <>
                <Button
                  size="sm"
                  onClick={handleOpenTagEditor}
                  disabled={selected.length === 0}
                >
                  <TagIcon />
                  タグ表示
                </Button>
              </>
            }
          />
        )}
      </AnimatePresence>

      {/* タグエディター */}
      <AnimatePresence>
        {isTagEditMode && (
          <TagEditSheet
            targetNodes={selected}
            onClose={handleCloseTagEditor}
            mode={tagEditMode}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
